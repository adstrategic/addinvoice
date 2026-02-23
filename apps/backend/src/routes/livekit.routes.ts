import { Router } from "express";
import {
  AccessToken,
  RoomAgentDispatch,
  RoomConfiguration,
} from "livekit-server-sdk";
import { z } from "zod";
import { validateRequest } from "zod-express-middleware";

export const livekitRouter = Router();

const room_config_agent_schema = z.object({
  agent_name: z.string().optional(),
  metadata: z.string().optional(),
});

const room_config_schema = z.object({
  agents: z.array(room_config_agent_schema).optional(),
});

const token_request_schema = {
  body: z.object({
    participant_name: z.string().optional(),
    participant_identity: z.string().optional(),
    room_config: room_config_schema.optional(),
    agent_name: z.string().optional(),
  }),
};

function buildRoomConfigFromBody(
  body: z.infer<typeof token_request_schema.body>,
): RoomConfiguration | undefined {
  const room_config_input = body.room_config;
  const agent_name_input = body.agent_name;

  if (room_config_input?.agents?.length) {
    const agents: RoomAgentDispatch[] = room_config_input.agents.map(
      (a: { agent_name?: string; metadata?: string }) =>
        new RoomAgentDispatch({
          agentName: a.agent_name ?? "invoice-agent",
          metadata: a.metadata ?? undefined,
        }),
    );
    const config = new RoomConfiguration({});
    config.agents = agents;
    return config;
  }

  if (agent_name_input) {
    const config = new RoomConfiguration({});
    config.agents = [
      new RoomAgentDispatch({
        agentName: agent_name_input,
      }),
    ];
    return config;
  }

  return undefined;
}

livekitRouter.post(
  "/token",
  validateRequest(token_request_schema),
  async (req, res) => {
    try {
      const workspace_id = req.workspaceId;
      const user_id = req.userId;

      if (!workspace_id || !user_id) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const body = req.body as z.infer<typeof token_request_schema.body>;
      const room_name = `invoice-${workspace_id}-${Date.now()}`;
      const participant_name = body.participant_name ?? "User";
      const identity = body.participant_identity ?? user_id;

      const room_config = buildRoomConfigFromBody(body);

      const token = new AccessToken(
        process.env.LIVEKIT_API_KEY!,
        process.env.LIVEKIT_API_SECRET!,
        {
          identity,
          name: participant_name,
          metadata: JSON.stringify({ workspaceId: workspace_id }),
        },
      );

      token.addGrant({
        roomJoin: true,
        room: room_name,
        canPublish: true,
        canSubscribe: true,
      });

      if (room_config) {
        token.roomConfig = room_config;
      }

      const jwt = await token.toJwt();

      res.status(201).json({
        server_url: process.env.LIVEKIT_URL!,
        participant_token: jwt,
      });
    } catch (error) {
      console.error("Error generating LiveKit token:", error);
      res.status(500).json({ error: "Failed to generate token" });
    }
  },
);
