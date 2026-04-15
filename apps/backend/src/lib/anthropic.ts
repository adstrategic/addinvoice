import Anthropic from "@anthropic-ai/sdk"

/**
 * Shared Anthropic client — initialized once at startup, reused by all AI features.
 * Reads ANTHROPIC_API_KEY from the environment automatically.
 */
export const anthropic = new Anthropic()

/**
 * Cheap, fast model for structured extraction from voice transcripts.
 * Used by invoice, estimate, client, payment, and catalog voice flows.
 */
export const VOICE_EXTRACTION_MODEL = "claude-haiku-4-5"
