# SYS_CLI // AGENT - Backend

**Strands Agent deployed to Bedrock AgentCore Runtime** with streaming.

## Architecture

```
Browser (<sys-cli-agent> Web Component)
    ↓ HTTPS + SSE streaming
Bedrock AgentCore Runtime (managed, auto-scaling, zero cold starts)
    ↓ stream_async()
Strands Agent (tools: experience, projects, skills)
    ↓
Amazon Bedrock (Nova Pro - us.amazon.nova-pro-v1:0)
```

## Quick Start (5 minutes)

### 1. Install AgentCore CLI

```bash
npm install -g @aws/agentcore
```

### 2. Bootstrap CDK (one-time per AWS account/region)

```bash
cdk bootstrap aws://YOUR_ACCOUNT_ID/us-east-1
```

### 3. Set your AWS account in config

Edit `agentcore/aws-targets.json`:
```json
{
  "targets": [{ "accountId": "123456789012", "region": "us-east-1" }]
}
```

### 4. Test locally

```bash
cd backend
agentcore dev
```

Opens agent inspector in browser. In another terminal:
```bash
agentcore dev "What is your experience?"
agentcore dev "Tell me about the sys-cli-agent project" --stream
```

### 5. Deploy to production

```bash
agentcore deploy
```

That's it. AgentCore handles:
- Container packaging (CodeZip — no Docker needed)
- IAM roles
- Auto-scaling
- Streaming transport
- Observability (traces in CloudWatch)

### 6. Invoke deployed agent

```bash
agentcore invoke "What are your skills?" --stream
```

### 7. Get the endpoint URL

```bash
agentcore status
```

Use this URL as the frontend's `endpoint` attribute.

## Project Structure

```
backend/
├── agentcore/
│   ├── agentcore.json       # Project + agent config
│   ├── aws-targets.json     # AWS account/region
│   └── .env.local           # Local env vars (gitignored)
└── app/
    └── SysCLIAgent/
        ├── main.py          # AgentCore entrypoint (streaming)
        ├── tools.py         # Resume tools ← EDIT THIS
        └── pyproject.toml   # Python deps
```

## Customize Your Resume

Edit `app/SysCLIAgent/tools.py` — update:
- `get_professional_experience()` → your roles, companies, highlights
- `get_project_architecture()` → your project tech stacks
- `get_skills()` → your technical skills

## Connect Frontend

After `agentcore deploy`, get the invoke URL from `agentcore status`.

For the frontend to stream from AgentCore, you need a thin proxy (API Gateway + Lambda)
that calls `invoke_agent_runtime` and relays SSE to the browser:

```html
<sys-cli-agent endpoint="https://your-proxy-url.com"></sys-cli-agent>
```

Or for local dev:
```bash
agentcore dev  # runs on localhost:8080
```
```html
<sys-cli-agent endpoint="http://localhost:8080"></sys-cli-agent>
```

## Prerequisites

- Node.js 20+ (for AgentCore CLI)
- Python 3.10+
- AWS CDK installed (`npm install -g aws-cdk`)
- AWS credentials configured
- Bedrock Nova Pro model access enabled in us-east-1
