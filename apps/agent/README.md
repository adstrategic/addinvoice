# LiveKit Voice Agent for Invoice Creation

This is the LiveKit voice agent service for creating invoices via voice interaction.

## Setup

### 1. Environment Variables

Copy `.env.local.example` to `.env.local` and fill in your credentials:

```bash
cp .env.local.example .env.local
```

Required variables:
- `LIVEKIT_URL` - Your LiveKit Cloud WebSocket URL
- `LIVEKIT_API_KEY` - Your LiveKit API key
- `LIVEKIT_API_SECRET` - Your LiveKit API secret
- `GROQ_API_KEY` - Your Groq API key (get from https://groq.com)
- `DATABASE_URL` - PostgreSQL connection string (same as backend)
- `DEFAULT_WORKSPACE_ID` - Optional: Default workspace ID if not provided in token

### 2. Download Model Files

Before running the agent, download required model files:

```bash
pnpm download-files
```

This downloads the Silero VAD model and other required files.

### 3. Development

Run the agent in development mode:

```bash
pnpm dev
```

The agent will connect to LiveKit Cloud and be available for testing.

### 4. Testing

You can test the agent in two ways:

1. **LiveKit Playground**: After starting with `pnpm dev`, visit your LiveKit Cloud project's playground to test voice interaction.

2. **Frontend**: Start the frontend (`cd ../frontend && yarn dev`) and navigate to `/voice` to test the voice UI.

### 5. Production Build

Build for production:

```bash
pnpm build
pnpm start
```

### 6. Deploy to LiveKit Cloud

From the agent directory:

```bash
lk agent create
```

This will:
- Generate `Dockerfile`, `.dockerignore`, and `livekit.toml`
- Build and deploy the agent to LiveKit Cloud
- Register the agent for automatic dispatching

## Architecture

- `src/agent.ts` - Main entrypoint with `defineAgent` pattern
- `src/agents/invoice.agent.ts` - Core invoice creation agent with function tools
- `src/types/session-data.ts` - TypeScript types for session state
- `src/db/prisma.ts` - Shared Prisma client for database access

## Function Tools

The agent includes the following tools:

1. **lookupCustomer** - Search for existing customers by name or email
2. **createCustomer** - Create a new customer in the database
3. **addInvoiceItem** - Add line items to the current invoice
4. **createInvoice** - Save the complete invoice to the database

## Notes

- The Prisma schema is copied from `../backend/prisma/schema.prisma`. When you update the schema in the backend, copy it again to `agent/prisma/schema.prisma` and run `pnpm prisma generate`.
- The agent receives `workspaceId` from the participant metadata set by the backend token endpoint.
