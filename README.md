# SYS_CLI // AGENT

AI-powered conversational portfolio agent with a framework-agnostic **Lit Web Component** frontend and a **Strands Agent** backend on **AWS Bedrock AgentCore Runtime**.

Built with TypeScript, Python, AWS CDK, and deployed via GitHub Actions to AWS + Cloudflare.

![Architecture](./architecture-diagram.drawio)

---

## Architecture Overview

```
User (Browser)
  │
  │  imports <sys-cli-agent> from Cloudflare R2 CDN
  │
  ▼
┌─────────────────────────────────┐
│  <sys-cli-agent>                │
│  Lit 3.x Web Component          │
│  Shadow DOM • Terminal UI        │
└──────────────┬──────────────────┘
               │ POST /invocations {prompt, lang}
               │ (SSE streaming response)
               ▼
┌─────────────────────────────────┐
│  AWS Lambda Function URL        │
│  Node.js 24 • RESPONSE_STREAM   │
│  CORS: * • Auth: NONE           │
│  120s timeout • 256MB            │
├─────────────────────────────────┤
│  PROXY_MODE = "direct"          │     PROXY_MODE = "agentcore"
│  ConverseStream → Nova Lite     │     InvokeAgentRuntime → AgentCore
│  (~0.5-1s latency)              │     (~2-3s latency)
└──────────────┬──────────────────┘
               │
               ▼
┌─────────────────────────────────┐
│  Amazon Bedrock                  │
│  Nova Lite v1 (Foundation Model) │
├─────────────────────────────────┤
│  Bedrock AgentCore Runtime       │
│  Zero Cold Starts                │
│  Managed Containers              │
└──────────────┬──────────────────┘
               │ (agentcore mode only)
               ▼
┌─────────────────────────────────┐
│  Strands Agent (Python)          │
│  @tool: get_skills()             │
│  @tool: get_professional_exp()   │
│  @tool: get_project_arch(name)   │
│  system-prompt.md (resume data)  │
└─────────────────────────────────┘
```

---

## Project Structure

```
agent/
├── ui/                            # Web Component (TypeScript / Lit 3.x)
│   ├── src/
│   │   ├── sys-cli-agent.element.ts   Root custom element
│   │   ├── ui/                        Sub-components (header, terminal, input)
│   │   ├── bridge/                    PostMessage cross-origin bridge
│   │   ├── utils/                     Endpoint validation
│   │   └── types/                     TypeScript interfaces
│   ├── index.html                     Standalone dev/demo page
│   ├── package.json                   @goutham/agent-ui
│   └── vite.config.ts                 Build config
│
├── backend/
│   ├── proxy/                         Lambda streaming proxy (Node.js)
│   │   ├── handler.ts                 Dual-mode: DIRECT / AGENTCORE
│   │   └── package.json
│   ├── cdk/                           CDK stack for Lambda proxy
│   │   ├── app.ts                     CDK app entry
│   │   └── proxy-stack.ts             ProxyStack (Function URL + IAM)
│   ├── SysCLIAgent/                   Strands Agent on AgentCore
│   │   ├── app/SysCLIAgent/
│   │   │   ├── main.py               Agent entrypoint + tools
│   │   │   └── model/load.py         Bedrock model config
│   │   └── agentcore/                 AgentCore config + CDK
│   ├── system-prompt.md               Agent system prompt (resume data)
│   └── README.md
│
├── .github/workflows/
│   ├── deploy-backend.yml             Deploys Lambda proxy + AgentCore
│   └── publish-ui.yml                 Builds & deploys UI to Cloudflare
│
└── architecture-diagram.drawio        Visual architecture diagram
```

---

## Quick Start

### Prerequisites

- Node.js 24+
- Python 3.12+
- AWS CLI configured with credentials
- [AWS CDK](https://docs.aws.amazon.com/cdk/latest/guide/getting_started.html) installed
- [AgentCore CLI](https://docs.aws.amazon.com/bedrock/latest/userguide/agentcore-cli.html): `npm install -g @aws/agentcore`
- (Optional) [Wrangler](https://developers.cloudflare.com/workers/wrangler/) for Cloudflare deployment

### 1. UI Development

```bash
cd ui
npm install
npm run dev              # Vite dev server on localhost:5173
```

Set the `endpoint` attribute in `index.html` to your Lambda Function URL or use the `__AGENT_ENDPOINT__` placeholder for CI.

### 2. Deploy the Lambda Proxy

```bash
cd backend
npm install
cd proxy && npm install && npm run build && cd ..
npx cdk deploy --context proxyMode=direct
```

The deploy outputs a **Function URL** — use this as the `endpoint` attribute.

#### Proxy Modes

| Mode | Env Var | Behavior |
|------|---------|----------|
| `direct` (default) | `PROXY_MODE=direct` | Lambda calls Bedrock ConverseStream directly with system prompt baked in. Fast, simple, no tools. |
| `agentcore` | `PROXY_MODE=agentcore` | Lambda pipes to AgentCore Runtime which invokes the Strands agent with tools. Richer but slower. |

### 3. Deploy the Strands Agent (AgentCore mode)

```bash
cd backend/SysCLIAgent
pip install -r app/SysCLIAgent/requirements.txt  # or use a venv
agentcore dev                                     # local dev on :8080
agentcore deploy -y                               # deploy to AgentCore Runtime
```

Then redeploy the proxy with the agent ARN:

```bash
cd backend
npx cdk deploy \
  --context proxyMode=agentcore \
  --context agentRuntimeArn=arn:aws:bedrock-agentcore:us-east-1:YOUR_ACCOUNT:agent-runtime/YOUR_AGENT
```

### 4. Deploy UI to Cloudflare (optional)

```bash
cd ui
npm run build                # Standalone app build
npm run build:lib            # Library module build (agent-ui.js)
npx wrangler pages deploy dist --project-name=agent-ui
```

---

## Usage

### Embed via CDN (any website)

```html
<script type="module" src="https://your-r2-bucket.r2.dev/agent-ui.js"></script>

<sys-cli-agent
  endpoint="https://your-lambda-url.lambda-url.us-east-1.on.aws"
  title="MY // AGENT"
  placeholder="Ask me anything..."
  greeting="Hello! How can I help?"
  lang="en"
></sys-cli-agent>
```

### Embed via npm

```bash
npm install @goutham/agent-ui
```

```js
import '@goutham/agent-ui';
```

### Configurable Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `endpoint` | String | (required) | Backend Lambda Function URL |
| `title` | String | `SYS_CLI // AGENT` | Header bar title text |
| `placeholder` | String | `Ask about my experience...` | Input field placeholder |
| `greeting` | String | (empty) | Welcome message shown on connect |
| `lang` | String | `en` | Response language code (e.g. `es`, `hi`, `fr`, `te`) |
| `allowed-origins` | String | `*` | Comma-separated PostMessage origin allowlist |
| `kb-path` | String | (empty) | Knowledge base path (for future use) |

### Events

| Event | Detail | Description |
|-------|--------|-------------|
| `agent-ready` | — | Backend connectivity confirmed |
| `agent-response` | `{response, query}` | Agent finished responding |
| `agent-error` | `{message}` | Connection or processing error |
| `connection-error` | `{message}` | Initial connection failed |

---

## Customization

### Swap the System Prompt

Edit `backend/system-prompt.md` with your own content. The agent uses this as its identity and knowledge base. In DIRECT mode it's baked into the Lambda; in AGENTCORE mode the Python agent loads it at startup.

### Add/Modify Tools

Edit `backend/SysCLIAgent/app/SysCLIAgent/main.py`:

```python
@tool
def get_your_data() -> dict:
    """Description of what this tool returns."""
    return {"key": "value"}

# Add to tools list
tools = [get_professional_experience, get_project_architecture, get_skills, get_your_data]
```

### Change the Model

Edit `backend/SysCLIAgent/app/SysCLIAgent/model/load.py`:

```python
def load_model() -> BedrockModel:
    return BedrockModel(model_id="us.anthropic.claude-sonnet-4-20250514-v1:0", region_name="us-east-1")
```

For DIRECT mode, set the `MODEL_ID` context in CDK or environment variable.

### Style the Component

The Web Component uses Shadow DOM with CSS custom properties. Override from the host page:

```css
sys-cli-agent {
  --sys-bg: #1a1a2e;
  --sys-text: #eaeaea;
  --sys-border: #333;
  --sys-accent: #00d4aa;
}
```

---

## CI/CD (GitHub Actions)

### deploy-backend.yml

- **Trigger:** Push to `backend/**` on `main`, or manual dispatch
- **Jobs:**
  - `deploy-proxy` — Builds Lambda, runs `cdk deploy`
  - `deploy-agentcore` — Installs AgentCore CLI, runs `agentcore deploy`
- **Secrets needed:** `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`
- **Vars needed:** `AGENT_RUNTIME_ARN` (for agentcore mode)

### publish-ui.yml

- **Trigger:** Push to `ui/**` on `main`, or manual dispatch
- **Steps:** Build app → replace endpoint placeholder → upload to R2 → deploy to Pages
- **Secrets needed:** `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`
- **Vars needed:** `AGENT_ENDPOINT_URL`

---

## Security Considerations

### Before making this repo public, address these items:

| Item | Risk | Status |
|------|------|--------|
| `backend/system-prompt.md` | Contains resume/bio — this is intentionally public portfolio content | ✅ Keep in repo (required for deployment) |
| `backend/sampleprompt.md` | Extended personal data (gitignored ✓) | ✅ Excluded |
| `backend/SysCLIAgent/agentcore/aws-targets.json` | Contains AWS Account ID | ⚠️ Gitignored — use `aws-targets.example.json` as template |
| `.cli/deployed-state.json` | Could contain runtime ARNs | ✅ Entire `.cli/` gitignored |
| Lambda Function URL `Auth: NONE` | Public endpoint, anyone can call | ℹ️ Expected for portfolio — add rate limiting or WAF if costs are a concern |
| `CORS: *` | Allows any origin to call the API | ℹ️ Fine for an embeddable portfolio widget |
| GitHub Actions secrets | AWS keys, Cloudflare tokens | ✅ Stored as GitHub repo secrets, not in code |
| No API key on Function URL | Anyone with the URL can invoke | ℹ️ Add a bearer token check if abuse becomes an issue |

### What's safe to commit (deployment-critical):

- `backend/system-prompt.md` — Your resume/portfolio content. This is public info (same as your LinkedIn/website). The Lambda and Agent both load this at deploy time.
- `backend/proxy/handler.ts` — No secrets, uses env vars for runtime config.
- `.github/workflows/` — Reference secrets by name, not value.

### What should NEVER be committed:

```gitignore
# Already in .gitignore:
backend/SysCLIAgent/agentcore/aws-targets.json   # AWS Account ID
backend/SysCLIAgent/agentcore/.cli/              # Deployed state + ARNs
.env / .env.*                                     # Any secrets
```

### For forkers: Create these files locally

```bash
cp backend/system-prompt.example.md backend/system-prompt.md
cp backend/SysCLIAgent/agentcore/aws-targets.example.json backend/SysCLIAgent/agentcore/aws-targets.json
# Then edit with your own content and AWS account ID
```

---

## Forking / Plug-and-Play Guide

Want to use this for your own portfolio? Here's the minimal steps:

1. **Fork** this repository
2. **Replace** `backend/system-prompt.md` with your own resume/bio content
3. **Edit** the `@tool` functions in `main.py` to return your data
4. **Set up AWS:**
   - Create an AWS account (or use existing)
   - Enable Amazon Bedrock model access for Nova Lite in us-east-1
   - `npm install -g @aws/agentcore`
5. **Deploy backend:**
   ```bash
   cd backend && npm install
   cd proxy && npm install && npm run build && cd ..
   npx cdk bootstrap   # first time only
   npx cdk deploy --context proxyMode=direct
   ```
6. **Test:** Copy the Function URL from CDK output → open `ui/index.html` → set the endpoint
7. **Deploy UI** (optional): Set up Cloudflare Pages or host the built files anywhere
8. **Set GitHub secrets** for automated deployments

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | TypeScript, Lit 3.x, Vite, Web Components |
| Proxy | Node.js 24, AWS Lambda (streaming), Function URL |
| Agent | Python 3.12, Strands Agents SDK, Bedrock AgentCore |
| Model | Amazon Nova Lite v1 (or any Bedrock model) |
| Infra | AWS CDK (TypeScript), CloudFormation |
| CI/CD | GitHub Actions |
| Hosting (UI) | Cloudflare Pages + R2 |
| Hosting (Backend) | AWS Lambda + Bedrock AgentCore Runtime |

---

## License

MIT
