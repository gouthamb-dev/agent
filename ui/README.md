# Agent UI

Terminal-style AI agent Web Component. Framework-agnostic, Shadow DOM isolated.

## Use via CDN

```html
<script type="module" src="https://cdn.goutham.dev/agent-ui.js"></script>

<sys-cli-agent
  endpoint="https://your-backend.com"
  title="MY // AGENT"
  placeholder="Ask me anything..."
  greeting="Welcome!"
></sys-cli-agent>
```

## Install as package

```bash
npm install @goutham/agent-ui
```

```js
import '@goutham/agent-ui';
```

## Configurable Attributes

| Attribute | Default | Description |
|-----------|---------|-------------|
| `endpoint` | (required) | Backend API URL |
| `title` | `SYS_CLI // AGENT` | Header title |
| `placeholder` | `Ask about my experience...` | Input placeholder |
| `greeting` | (empty) | Welcome message on connect |
| `allowed-origins` | `*` | PostMessage origin allowlist |

## Development

```bash
cd ui
npm install
npm run dev
```

## Deploy to CDN

```bash
npm run deploy
```

Deploys to Cloudflare Pages. Map `cdn.goutham.dev` in Pages custom domains.
