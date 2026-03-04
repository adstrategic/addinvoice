import { Router } from "express";
import {
  AccessToken,
  RoomAgentDispatch,
  RoomConfiguration,
} from "livekit-server-sdk";
import { z } from "zod";
import { validateRequest } from "zod-express-middleware";

export const livekitRouter: Router = Router();

const room_config_agent_schema = z.object({
  agent_name: z.string().optional(),
  metadata: z.string().optional(),
});

const room_config_schema = z.object({
  agents: z.array(room_config_agent_schema).optional(),
});

const token_request_schema = {
  body: z.object({
    agent_name: z.string().optional(),
    participant_identity: z.string().optional(),
    participant_name: z.string().optional(),
    room_config: room_config_schema.optional(),
  }),
};

function buildRoomConfigFromBody(
  body: z.infer<typeof token_request_schema.body>,
  workspace_id: number,
): RoomConfiguration | undefined {
  const room_config_input = body.room_config;
  const agent_name_input = body.agent_name;

  if (room_config_input?.agents?.length) {
    const agents: RoomAgentDispatch[] = room_config_input.agents.map(
      (a: { agent_name?: string; metadata?: string }) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const existing_meta = a.metadata ? JSON.parse(a.metadata) : {};
        return new RoomAgentDispatch({
          agentName: a.agent_name,
          metadata: JSON.stringify({
            ...existing_meta,
            workspaceId: workspace_id,
          }),
        });
      },
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
        metadata: JSON.stringify({ workspaceId: workspace_id }),
      }),
    ];
    return config;
  }

  const config = new RoomConfiguration({});
  config.agents = [
    new RoomAgentDispatch({
      metadata: JSON.stringify({ workspaceId: workspace_id }),
    }),
  ];
  return config;
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
      const room_name = `invoice-${String(workspace_id)}-${String(Date.now())}`;
      const participant_name = body.participant_name ?? "User";
      const identity = body.participant_identity ?? user_id;

      const token = new AccessToken(
        process.env.LIVEKIT_API_KEY,
        process.env.LIVEKIT_API_SECRET,
        {
          identity,
          metadata: JSON.stringify({ workspaceId: workspace_id }),
          name: participant_name,
        },
      );

      token.roomConfig = buildRoomConfigFromBody(body, workspace_id);

      token.addGrant({
        canPublish: true,
        canSubscribe: true,
        room: room_name,
        roomJoin: true,
      });

      const jwt = await token.toJwt();

      res.status(201).json({
        participant_token: jwt,
        server_url: process.env.LIVEKIT_URL,
      });
    } catch (error) {
      console.error("Error generating LiveKit token:", error);
      res.status(500).json({ error: "Failed to generate token" });
    }
  },
);
