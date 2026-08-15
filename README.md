# SYS_CLI // AGENT

AI-powered portfolio agent with a terminal-style Web Component frontend and Strands Agent backend on AWS Bedrock AgentCore.

## Architecture

```
Browser
  ↓ imports https://cdn.goutham.dev/agent-ui.js
<sys-cli-agent endpoint="...">
  ↓ HTTPS (streaming SSE)
Lambda Function URL (Node.js 24, RESPONSE_STREAM)
  ↓ pipes agentResponse.response stream
Bedrock AgentCore Runtime
  ↓ Strands Agent + tools
Amazon Bedrock (Nova Lite)
```

## Project Structure

```
agent/
├── ui/                      ← Web Component (TypeScript/Lit)
│   ├── src/                   Source code
│   ├── package.json           @goutham/agent-ui
│   ├── vite.config.ts         Builds to dist/agent-ui.js
│   └── wrangler.toml          Deploys to Cloudflare Pages
│
├── backend/SysCLIAgent/     ← Strands Agent (Python)
│   ├── app/SysCLIAgent/       Agent code + tools
│   │   ├── main.py            AgentCore entrypoint (streaming)
│   │   └── tools.py           Resume data tools
│   └── agentcore/             AgentCore CLI config + CDK
│
├── infra/                   ← AWS Infrastructure (CDK)
│   ├── lib/infra-stack.ts     Lambda proxy + S3 + CloudFront
│   ├── lambda/handler.ts      Streaming proxy (Node.js 24)
│   └── package.json
│
└── README.md                ← This file
```

## Quick Start

### UI Development

```bash
cd ui
npm install
npm run dev          # localhost:5173 with hot reload
npm run build        # builds dist/agent-ui.js
npm run deploy       # deploys to Cloudflare Pages (cdn.goutham.dev)
```

### Backend Deployment

```bash
cd backend/SysCLIAgent
agentcore dev        # local dev on :8080
agentcore deploy     # deploys to AgentCore Runtime
```

### Infrastructure Deployment

```bash
cd infra
npm install
npx cdk deploy       # deploys Lambda proxy + hosting
```

## Usage (CDN)

```html
<script type="module" src="https://cdn.goutham.dev/agent-ui.js"></script>

<sys-cli-agent
  endpoint="https://your-lambda-url.on.aws"
  title="GOUTHAM // AGENT"
  placeholder="Ask about my experience, skills, or projects..."
  greeting="Hey! I'm an AI assistant for this portfolio."
></sys-cli-agent>
```

## Configurable Attributes

| Attribute | Default | Description |
|-----------|---------|-------------|
| `endpoint` | (required) | Backend API URL |
| `title` | `SYS_CLI // AGENT` | Header bar title |
| `placeholder` | `Ask about my experience...` | Input placeholder |
| `greeting` | (empty) | Welcome message on connect |
| `allowed-origins` | `*` | PostMessage origin allowlist |

## Deploy Flow

1. Edit tools in `backend/SysCLIAgent/app/SysCLIAgent/main.py`
2. `agentcore deploy` — pushes agent to AgentCore
3. Edit UI in `ui/src/`
4. `cd ui && npm run deploy` — pushes UI to CDN
5. Both are independent — change one without touching the other
