import { Router } from 'express';
import { AccessToken } from 'livekit-server-sdk';
import { z } from 'zod';
import { validateRequest } from 'zod-express-middleware';

export const livekitRouter = Router();

const tokenRequestSchema = z.object({
  body: z.object({
    room_name: z.string().optional(),
    participant_name: z.string().optional(),
  }),
});

livekitRouter.post(
  '/token',
  validateRequest(tokenRequestSchema),
  async (req, res) => {
    try {
      // Get workspace ID from request (set by verifyWorkspaceAccess middleware)
      const workspaceId = req.workspaceId;
      const userId = req.userId;

      if (!workspaceId || !userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const roomName = req.body.room_name || `invoice-${userId}-${Date.now()}`;
      const participantName = req.body.participant_name || 'User';

      // Create token with workspace metadata
      const token = new AccessToken(
        process.env.LIVEKIT_API_KEY!,
        process.env.LIVEKIT_API_SECRET!,
        {
          identity: userId,
          name: participantName,
          metadata: JSON.stringify({ workspaceId }), // Pass to agent
        }
      );

      token.addGrant({
        roomJoin: true,
        room: roomName,
        canPublish: true,
        canSubscribe: true,
      });

      const jwt = await token.toJwt();

      res.json({
        serverURL: process.env.LIVEKIT_URL!,
        participantToken: jwt,
      });
    } catch (error) {
      console.error('Error generating LiveKit token:', error);
      res.status(500).json({ error: 'Failed to generate token' });
    }
  }
);
