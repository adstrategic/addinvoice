import { llm } from '@livekit/agents';
import {
  assertCanCreate,
  LimitExceededError,
  type LimitModule,
} from '@addinvoice/db';
import { prisma } from '../db/prisma';

/**
 * Wraps the shared limit guard for use inside agent tools. On limit-exceeded
 * it converts the structured error into an llm.ToolError so the agent speaks
 * the message back to the user instead of erroring silently.
 */
export async function guardCreateOrExplain(
  workspaceId: number,
  module: LimitModule,
): Promise<void> {
  try {
    await assertCanCreate(prisma, workspaceId, module, { viaVoice: true });
  } catch (error) {
    if (error instanceof LimitExceededError) {
      throw new llm.ToolError(error.message);
    }
    throw error;
  }
}
