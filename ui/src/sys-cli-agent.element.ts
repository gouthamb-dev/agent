import { LitElement, html, css, type PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { designTokens } from './ui/styles/design-tokens.css.js';
import type { TerminalEntry } from './types/index.js';
import { validateEndpointUrl } from './utils/validate-endpoint.js';
import { PostMessageBridge } from './bridge/post-message-bridge.js';

import './ui/header-bar.js';
import './ui/terminal-stream.js';
import './ui/input-bar.js';

export { validateEndpointUrl } from './utils/validate-endpoint.js';

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * SysCLIAgentElement - Root custom element for SYS_CLI // AGENT.
 * 
 * Thin terminal UI that communicates with a Strands Agent backend
 * via an OpenAI-compatible HTTP API.
 */
@customElement('sys-cli-agent')
export class SysCLIAgentElement extends LitElement {
  static override styles = [
    designTokens,
    css`
      :host {
        display: flex;
        flex-direction: column;
        width: 100%;
        height: 100%;
        min-height: 300px;
        font-family: var(--sys-font);
        background: var(--sys-bg);
        border: var(--sys-border-width) solid var(--sys-border);
        border-radius: var(--sys-border-radius);
        overflow: hidden;
        box-sizing: border-box;
      }

      :host([hidden]) {
        display: none;
      }

      terminal-stream {
        flex: 1;
        min-height: 0;
        overflow: hidden;
      }

      sys-header-bar {
        flex-shrink: 0;
      }

      input-bar {
        flex-shrink: 0;
      }
    `,
  ];

  @property({ type: String, reflect: true })
  endpoint: string = '';

  @property({ type: String, reflect: true, attribute: 'kb-path' })
  kbPath: string = '';

  @property({ type: String, reflect: true, attribute: 'allowed-origins' })
  allowedOrigins: string = '*';

  /** Configurable title displayed in the header bar */
  @property({ type: String, reflect: true, attribute: 'title' })
  agentTitle: string = 'SYS_CLI // AGENT';

  /** Configurable placeholder text for the input bar */
  @property({ type: String, reflect: true, attribute: 'placeholder' })
  inputPlaceholder: string = 'Ask about my experience, skills, or projects...';

  /** Configurable greeting message shown on first load */
  @property({ type: String, reflect: true, attribute: 'greeting' })
  greeting: string = '';

  /** Language for agent responses (e.g. "en", "es", "hi", "fr", "te"). Defaults to English. */
  @property({ type: String, reflect: true, attribute: 'lang' })
  override lang: string = 'en';

  @state() private _connectionStatus: 'idle' | 'connecting' | 'connected' | 'error' = 'idle';
  @state() private _entries: TerminalEntry[] = [];
  @state() private _isProcessing: boolean = false;

  private _validatedEndpoint: string = '';
  private _validatedKbPath: string = '';
  private _postMessageBridge: PostMessageBridge | null = null;
  private _abortController: AbortController | null = null;

  override connectedCallback(): void {
    super.connectedCallback();
    this._initialize();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._cleanup();
  }

  override updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties);
    if (changedProperties.has('endpoint') && changedProperties.get('endpoint') !== undefined) {
      this._onEndpointChanged();
    }
    if (changedProperties.has('kbPath')) {
      this._onKbPathChanged();
    }
  }

  private async _initialize(): Promise<void> {
    const validationError = validateEndpointUrl(this.endpoint);
    if (validationError) {
      this._connectionStatus = 'error';
      this._validatedEndpoint = '';
      this._emitAgentError(validationError);
      this._addErrorEntry(validationError);
      return;
    }

    this._validatedEndpoint = this.endpoint;
    this._connectionStatus = 'connecting';

    // Initialize PostMessageBridge
    const origins = this.allowedOrigins.split(',').map(o => o.trim()).filter(o => o.length > 0);
    this._postMessageBridge = new PostMessageBridge({
      targetOrigin: origins[0] || '*',
      allowedOrigins: origins.length > 0 ? origins : ['*'],
    });
    this._postMessageBridge.connect();

    // Check backend connectivity (AgentCore uses /ping)
    try {
      const response = await fetch(`${this.endpoint}/ping`, { method: 'GET', signal: AbortSignal.timeout(10_000) });
      void response;
      this._connectionStatus = 'connected';
      this._postMessageBridge?.send('state-change', { status: 'connected' });
      this.dispatchEvent(new CustomEvent('agent-ready', { bubbles: true, composed: true }));

      // Show greeting if configured
      if (this.greeting) {
        this._addEntry({ id: crypto.randomUUID(), type: 'response', content: this.greeting, timestamp: Date.now() });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this._connectionStatus = 'error';
      this._addErrorEntry(`Connection failed: ${msg}`);
      this._postMessageBridge?.send('state-change', { status: 'error', error: msg });
      this.dispatchEvent(new CustomEvent('connection-error', { detail: { message: msg }, bubbles: true, composed: true }));
    }
  }

  private _cleanup(): void {
    if (this._abortController) {
      this._abortController.abort();
      this._abortController = null;
    }
    if (this._postMessageBridge) {
      this._postMessageBridge.disconnect();
      this._postMessageBridge = null;
    }
    this._connectionStatus = 'idle';
    this._isProcessing = false;
  }

  validateEndpoint(endpoint: string): ValidationResult {
    const error = validateEndpointUrl(endpoint);
    return error ? { valid: false, error } : { valid: true };
  }

  validateKbPath(kbPath: string): ValidationResult {
    if (!kbPath || kbPath.length === 0) return { valid: true };
    if (kbPath.length > 512) {
      return { valid: false, error: `Knowledge base path exceeds maximum length of 512 characters (received ${kbPath.length})` };
    }
    return { valid: true };
  }

  private _onEndpointChanged(): void {
    const result = this.validateEndpoint(this.endpoint);
    if (!result.valid) {
      this._validatedEndpoint = '';
      this._connectionStatus = 'error';
      this.dispatchEvent(new CustomEvent('agent-error', { detail: { message: result.error, attribute: 'endpoint', value: this.endpoint }, bubbles: true, composed: true }));
    } else {
      this._validatedEndpoint = this.endpoint;
    }
  }

  private _onKbPathChanged(): void {
    const result = this.validateKbPath(this.kbPath);
    if (!result.valid) {
      this._validatedKbPath = '';
      this.dispatchEvent(new CustomEvent('agent-error', { detail: { message: result.error, attribute: 'kb-path', value: this.kbPath }, bubbles: true, composed: true }));
    } else {
      this._validatedKbPath = this.kbPath;
    }
  }

  get validatedEndpoint(): string { return this._validatedEndpoint; }
  get validatedKbPath(): string { return this._validatedKbPath; }

  override render() {
    return html`
      <sys-header-bar .status=${this._connectionStatus} .agentTitle=${this.agentTitle}></sys-header-bar>
      <terminal-stream .entries=${this._entries} lang=${this.lang}></terminal-stream>
      <input-bar ?disabled=${this._isProcessing} .placeholder=${this.inputPlaceholder} @query-submit=${this._handleQuerySubmit}></input-bar>
    `;
  }

  private async _handleQuerySubmit(e: CustomEvent<{ text: string }>): Promise<void> {
    const { text } = e.detail;

    this._addEntry({ id: crypto.randomUUID(), type: 'user', content: text, timestamp: Date.now() });
    this._isProcessing = true;
    this._postMessageBridge?.send('user-interaction', { query: text });

    if (this._connectionStatus !== 'connected') {
      this._addErrorEntry('Cannot process query: not connected to backend');
      this._isProcessing = false;
      return;
    }

    // Show processing indicator
    this._addEntry({ id: 'processing', type: 'processing', content: '', timestamp: Date.now() });

    try {
      this._abortController = new AbortController();

      const response = await fetch(`${this._validatedEndpoint}/invocations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: text,
          lang: this.lang || 'en',
        }),
        signal: this._abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`Backend returned ${response.status}: ${response.statusText}`);
      }

      // Remove processing indicator
      this._entries = this._entries.filter(e => e.id !== 'processing');

      // Check content type to determine how to parse
      const contentType = response.headers.get('content-type') || '';

      if (contentType.includes('text/event-stream') && response.body) {
        // SSE streaming
        await this._handleStreamingResponse(response.body, text);
      } else {
        // JSON response — extract content, render with typewriter effect
        const data = await response.json();
        const content = data?.choices?.[0]?.message?.content
          || data?.result
          || data?.output?.message
          || JSON.stringify(data);
        await this._typewriterRender(content, text);
      }
    } catch (err: unknown) {
      this._entries = this._entries.filter(e => e.id !== 'processing');
      const errorMessage = err instanceof Error ? err.message : String(err);
      if (errorMessage !== 'The user aborted a request.') {
        this._addErrorEntry(errorMessage);
        this._emitAgentError(errorMessage);
      }
    } finally {
      this._abortController = null;
      this._isProcessing = false;
    }
  }

  /**
   * Process a streaming response from AgentCore Runtime.
   * Parses AgentCore SSE events and displays text token-by-token.
   */
  private async _handleStreamingResponse(body: ReadableStream<Uint8Array>, query: string): Promise<void> {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let rawContent = '';
    let buffer = '';
    const responseId = crypto.randomUUID();

    this._addEntry({ id: responseId, type: 'response', content: '', timestamp: Date.now() });

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Split on "data: " boundaries
        const events = buffer.split(/\n+(?=data: )/);
        buffer = events.pop() ?? '';

        for (const eventLine of events) {
          const trimmed = eventLine.trim();
          if (!trimmed.startsWith('data: ')) continue;

          const dataStr = trimmed.slice(6).trim();
          if (dataStr === '[DONE]') continue;

          try {
            const parsed = JSON.parse(dataStr);

            // AgentCore format
            const text = parsed?.event?.contentBlockDelta?.delta?.text;
            if (text !== undefined && text !== '') {
              rawContent += text;

              // Strip thinking blocks from display (they accumulate across chunks)
              const display = rawContent
                .replace(/<thinking>[\s\S]*?<\/thinking>\s*/g, '')
                .replace(/<thinking[\s\S]*$/g, ''); // partial thinking block at end

              this._entries = this._entries.map(entry =>
                entry.id === responseId ? { ...entry, content: display.trim() } : entry
              );
            }

            // OpenAI format fallback
            const oaiDelta = parsed?.choices?.[0]?.delta?.content;
            if (oaiDelta) {
              rawContent += oaiDelta;
              this._entries = this._entries.map(entry =>
                entry.id === responseId ? { ...entry, content: rawContent } : entry
              );
            }
          } catch {
            // skip
          }
        }
      }

      // Process remaining buffer
      if (buffer.trim().startsWith('data: ')) {
        const dataStr = buffer.trim().slice(6).trim();
        if (dataStr !== '[DONE]') {
          try {
            const parsed = JSON.parse(dataStr);
            const text = parsed?.event?.contentBlockDelta?.delta?.text;
            if (text) rawContent += text;
            const oai = parsed?.choices?.[0]?.delta?.content;
            if (oai) rawContent += oai;
          } catch { /* skip */ }
        }
      }

      // Final clean display
      const finalContent = rawContent
        .replace(/<thinking>[\s\S]*?<\/thinking>\s*/g, '')
        .replace(/<thinking[\s\S]*$/g, '')
        .trim();

      this._entries = this._entries.map(entry =>
        entry.id === responseId ? { ...entry, content: finalContent } : entry
      );
    } finally {
      reader.releaseLock();
    }

    const finalDisplay = rawContent
      .replace(/<thinking>[\s\S]*?<\/thinking>\s*/g, '')
      .trim();
    this.dispatchEvent(new CustomEvent('agent-response', { detail: { response: finalDisplay, query }, bubbles: true, composed: true }));
  }

  /**
   * Render text word-by-word with a typewriter effect.
   */
  private async _typewriterRender(content: string, query: string): Promise<void> {
    const responseId = crypto.randomUUID();
    this._addEntry({ id: responseId, type: 'response', content: '', timestamp: Date.now() });

    const words = content.split(/(\s+)/); // split but keep whitespace
    let accumulated = '';

    for (const word of words) {
      accumulated += word;
      this._entries = this._entries.map(entry =>
        entry.id === responseId ? { ...entry, content: accumulated } : entry
      );
      // Small delay between words for typing effect
      if (word.trim()) {
        await new Promise(r => setTimeout(r, 15));
      }
    }

    this.dispatchEvent(new CustomEvent('agent-response', { detail: { response: content, query }, bubbles: true, composed: true }));
  }

  private _emitAgentError(message: string): void {
    this.dispatchEvent(new CustomEvent('agent-error', { detail: { message }, bubbles: true, composed: true }));
  }

  private _addErrorEntry(content: string): void {
    this._addEntry({ id: crypto.randomUUID(), type: 'error', content, timestamp: Date.now() });
  }

  private _addEntry(entry: TerminalEntry): void {
    this._entries = [...this._entries, entry];
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sys-cli-agent': SysCLIAgentElement;
  }
}
