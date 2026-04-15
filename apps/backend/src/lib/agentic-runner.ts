import type {
  MessageParam,
  Tool,
  ToolResultBlockParam,
} from "@anthropic-ai/sdk/resources/messages/messages"

import { anthropic } from "./anthropic.js"

const DEFAULT_MAX_ROUNDS = 6

export interface AgenticToolResult {
  /** Name of the tool that was called. */
  name: string
  /** Raw input passed by the model. */
  input: unknown
  /** Value returned (or error object) from executeTool. */
  result: unknown
  /** True when executeTool resolved without throwing. */
  ok: boolean
}

export interface AgenticRunnerOptions {
  model: string
  system: string
  userMessage: string
  tools: Tool[]
  /**
   * Maximum number of model↔tool round-trips.
   * Keep low for single-tool flows (3–4); raise for multi-tool agents.
   * @default 6
   */
  maxRounds?: number
}

/**
 * Run a Claude tool-use loop until the model stops requesting tools or maxRounds is reached.
 *
 * Each tool_use block in the model response is passed to `executeTool`. The return value is
 * serialized to JSON and sent back as a tool_result. If `executeTool` throws, the error message
 * is forwarded to the model so it can recover or stop.
 *
 * @returns All tool invocations in order, with their results and ok flag.
 */
export async function runAgenticToolLoop(
  opts: AgenticRunnerOptions,
  executeTool: (name: string, input: unknown) => Promise<unknown>,
): Promise<AgenticToolResult[]> {
  const { model, system, userMessage, tools, maxRounds = DEFAULT_MAX_ROUNDS } = opts

  const messages: MessageParam[] = [{ role: "user", content: userMessage }]
  const allResults: AgenticToolResult[] = []

  console.info("[agentic-runner] starting loop", { maxRounds, model, toolNames: tools.map(t => t.name) })

  for (let round = 0; round < maxRounds; round++) {
    console.info(`[agentic-runner] round ${round + 1}/${maxRounds} — calling model`)

    const response = await anthropic.messages.create({
      max_tokens: 8192,
      messages,
      model,
      system,
      tools,
    })

    console.info(`[agentic-runner] round ${round + 1} — stop_reason: ${response.stop_reason}, usage:`, response.usage)

    if (response.stop_reason === "end_turn") {
      console.info("[agentic-runner] model finished (end_turn)")
      break
    }

    if (response.stop_reason !== "tool_use") {
      console.warn("[agentic-runner] unexpected stop_reason:", response.stop_reason, "— content:", JSON.stringify(response.content))
      break
    }

    messages.push({ role: "assistant", content: response.content as MessageParam["content"] })

    const toolResults: ToolResultBlockParam[] = []

    for (const block of response.content) {
      if (block.type !== "tool_use") continue

      console.info(`[agentic-runner] executing tool: ${block.name}`, JSON.stringify(block.input))

      let result: unknown
      let ok: boolean

      try {
        result = await executeTool(block.name, block.input)
        ok = true
        console.info(`[agentic-runner] tool ${block.name} succeeded:`, JSON.stringify(result))
      } catch (err) {
        result = { error: err instanceof Error ? err.message : String(err), ok: false }
        ok = false
        console.error(`[agentic-runner] tool ${block.name} threw:`, err)
      }

      allResults.push({ name: block.name, input: block.input, result, ok })
      toolResults.push({ content: JSON.stringify(result), tool_use_id: block.id, type: "tool_result" })
    }

    if (toolResults.length === 0) {
      console.warn("[agentic-runner] no tool_use blocks found in tool_use response — stopping")
      break
    }

    messages.push({ role: "user", content: toolResults })
  }

  console.info("[agentic-runner] loop finished, total tool calls:", allResults.length)
  return allResults
}
