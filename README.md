# SYS_CLI // AGENT

> AI-powered conversational agent Web Component with terminal-inspired Technical Brutalism interface, supporting both in-browser execution and remote deployment on AWS Bedrock AgentCore.

---

## 🌟 Features

- ⚡ **Lit Web Component (`<sys-cli-agent>`)**: Encapsulated within Shadow DOM with zero styling leaks.
- 🎨 **Technical Brutalism UI**: Terminal-inspired design system with live auto-scrolling streams, status indicators, and keyboard prompt navigation.
- ☁️ **AWS Bedrock AgentCore Compatible**: Deploy the core reasoning engine as a serverless container backend on AWS Bedrock AgentCore.
- 🔄 **Real-time SSE Streaming**: Stream reasoning steps (`plan`, `tool_call`, `tool_result`, `response`, `error`) from remote backends.
- 🛠️ **Autonomous Tool Loop (ReAct)**: Multi-cycle reasoning engine with automatic tool invocation and failure resilience.
- 🧠 **Local & Remote Vector Store**: In-memory document chunking and ONNX embeddings (`@xenova/transformers`).
- 🌉 **Cross-Domain PostMessage Bridge**: Secure iframe-to-parent postMessage communication protocol.

---

## 🚀 Quick Start

### 1. Installation

```bash
npm install
```

### 2. Development & Testing

```bash
# Start local Vite development server
npm run dev

# Run unit and property-based test suites (Vitest + Fast-Check)
npm run test

# Build production distribution bundle
npm run build
```

---

## 💻 Web Component Usage

Import the web component script and place `<sys-cli-agent>` in your HTML:

```html
<!-- Include build script -->
<script type="module" src="./dist/sys-cli-agent.js"></script>

<!-- Remote AWS Bedrock AgentCore Mode -->
<sys-cli-agent
  mode="agentcore"
  endpoint="https://your-agentcore-runtime.amazonaws.com/invocations"
  allowed-origins="https://your-portfolio-domain.com">
</sys-cli-agent>
```

### Component Attributes

| Attribute | Type | Default | Description |
|---|---|---|---|
| `endpoint` | `string` | `''` | LLM or AWS Bedrock AgentCore endpoint URL. |
| `mode` | `'local' \| 'agentcore'` | `'local'` | Execution runtime mode. Set to `'agentcore'` for remote AWS deployment. |
| `kb-path` | `string` | `''` | Directory path for local knowledge base indexing. |
| `allowed-origins` | `string` | `'*'` | Comma-separated list of allowed origins for postMessage. |

---

## ☁️ Deploying Backend to AWS Bedrock AgentCore

The backend logic is isolated in [`src/aws-agentcore/`](./src/aws-agentcore/):

1. **Build Container Image**:
   ```bash
   docker build -t sys-cli-agentcore:latest -f src/aws-agentcore/Dockerfile .
   ```
2. **Push to Amazon ECR**:
   ```bash
   aws ecr get-login-password --region <REGION> | docker login --username AWS --password-stdin <ACCOUNT_ID>.dkr.ecr.<REGION>.amazonaws.com
   docker tag sys-cli-agentcore:latest <ACCOUNT_ID>.dkr.ecr.<REGION>.amazonaws.com/sys-cli-agentcore:latest
   docker push <ACCOUNT_ID>.dkr.ecr.<REGION>.amazonaws.com/sys-cli-agentcore:latest
   ```
3. **Deploy with AWS AgentCore CLI**:
   ```bash
   agentcore deploy --config src/aws-agentcore/agentcore.config.json
   ```

---

## 📁 Repository Structure

```
.
├── src/
│   ├── sys-cli-agent.element.ts  # Root Lit custom web element <sys-cli-agent>
│   ├── agent/                    # ReAct reasoning loop, LLM client, tool registry
│   ├── agent/tools/              # Agent tool implementations
│   ├── aws-agentcore/            # Bedrock AgentCore server & deployment descriptor
│   ├── knowledge-base/           # Document chunker, embeddings & vector store
│   ├── ui/                       # Lit UI sub-components (header, stream, input)
│   └── bridge/                   # Cross-domain postMessage bridge
├── test/                         # Unit and property-based test suites
└── package.json
```

---

## 📄 License

MIT
