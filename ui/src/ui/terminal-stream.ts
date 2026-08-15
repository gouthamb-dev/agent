import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { designTokens } from './styles/design-tokens.css.js';
import type { TerminalEntry } from '../types/index.js';

/**
 * TerminalStream component - scrollable log view displaying user inputs,
 * reasoning steps, responses, errors, and processing indicators.
 */
@customElement('terminal-stream')
export class TerminalStream extends LitElement {
  static override styles = [
    designTokens,
    css`
      :host {
        display: flex;
        flex-direction: column;
        flex: 1;
        min-height: 0;
        overflow: hidden;
      }

      .terminal-log {
        flex: 1;
        overflow-y: auto;
        padding: 12px 16px;
        font-family: var(--sys-font);
        font-size: 13px;
        line-height: 1.6;
        color: var(--sys-text);
        background: var(--sys-bg);
        scroll-behavior: smooth;
      }

      /* Custom scrollbar */
      .terminal-log::-webkit-scrollbar {
        width: 6px;
      }

      .terminal-log::-webkit-scrollbar-track {
        background: var(--sys-bg);
      }

      .terminal-log::-webkit-scrollbar-thumb {
        background: var(--sys-border);
        border-radius: 3px;
      }

      .terminal-log::-webkit-scrollbar-thumb:hover {
        background: var(--sys-border-strong);
      }

      .terminal-log:focus {
        outline: 2px solid var(--sys-accent);
        outline-offset: -2px;
      }

      .entry {
        margin-bottom: 8px;
        word-break: break-word;
      }

      .entry--response {
        white-space: normal;
      }

      .entry--user {
        color: var(--sys-text);
        white-space: pre-wrap;
      }

      .entry--user::before {
        content: '$ ';
        color: var(--sys-accent);
        font-weight: 700;
      }

      .entry--reasoning {
        color: var(--sys-text-muted);
      }

      .entry--reasoning::before {
        content: '> ';
        color: var(--sys-text-muted);
      }

      .entry--response {
        color: var(--sys-text);
      }

      /* Error entry styling
       * Contrast: --sys-error-text (#93000A) on --sys-error-container (#FFDAD6) = ~6.5:1 ratio ✓ (WCAG AA)
       */
      .entry--error {
        background: var(--sys-error-container);
        color: var(--sys-error-text);
        border-left: 3px solid var(--sys-error);
        padding: 6px 10px;
        margin: 4px 0;
      }

      .entry--processing {
        color: var(--sys-text-muted);
      }

      .processing-dots {
        display: inline-block;
        animation: dots 1.4s infinite steps(4, end);
      }

      @keyframes dots {
        0% { content: ''; }
        25% { content: '.'; }
        50% { content: '..'; }
        75% { content: '...'; }
      }

      .processing-dots::after {
        content: '';
        animation: dots-content 1.4s infinite steps(4, end);
      }

      @keyframes dots-content {
        0% { content: ''; }
        25% { content: '.'; }
        50% { content: '..'; }
        75% { content: '...'; }
      }

      .entry--response strong {
        color: var(--sys-accent);
        font-weight: 700;
      }

      .md-heading {
        display: block;
        font-weight: 700;
        color: var(--sys-accent);
        margin: 8px 0 4px 0;
        font-size: 14px;
      }

      .md-h2 {
        font-size: 15px;
      }

      .md-bullet {
        display: block;
        padding-left: 12px;
        margin: 2px 0;
      }

      .md-bullet-dot {
        color: var(--sys-accent);
        margin-right: 4px;
      }
    `
  ];

  /** The list of terminal entries to display */
  @property({ type: Array })
  entries: TerminalEntry[] = [];

  /** Tracks whether we're in the process of clearing the processing indicator */
  @state()
  private _clearingProcessing = false;

  private _scrollContainer: HTMLElement | null = null;



  override firstUpdated(): void {
    this._scrollContainer = this.renderRoot.querySelector('.terminal-log');
  }

  override updated(changedProperties: Map<string, unknown>): void {
    super.updated(changedProperties);
    if (changedProperties.has('entries')) {
      this._autoScroll();
    }
  }

  /**
   * Append a new entry to the stream. Enforces minimum 200 entry retention
   * (never evicts below this threshold).
   */
  appendEntry(entry: TerminalEntry): void {
    this.entries = [...this.entries, entry];
    this.requestUpdate();
    // Auto-scroll after render
    this.updateComplete.then(() => this._autoScroll());
  }

  /**
   * Remove the processing indicator within 300ms of completion.
   */
  clearProcessing(): void {
    if (this._clearingProcessing) return;
    this._clearingProcessing = true;
    setTimeout(() => {
      this.entries = this.entries.filter(e => e.type !== 'processing');
      this._clearingProcessing = false;
      this.requestUpdate();
    }, 250); // within 300ms budget
  }


  private _autoScroll(): void {
    if (this._scrollContainer) {
      this._scrollContainer.scrollTop = this._scrollContainer.scrollHeight;
    }
  }

  private _renderEntry(entry: TerminalEntry) {
    switch (entry.type) {
      case 'user':
        return html`<div class="entry entry--user">${entry.content}</div>`;
      case 'reasoning':
        return html`<div class="entry entry--reasoning">${entry.content.toUpperCase()}...</div>`;
      case 'response':
        return html`<div class="entry entry--response">${this._renderMarkdownHtml(entry.content)}</div>`;
      case 'error':
        return html`<div class="entry entry--error">${entry.content}</div>`;
      case 'processing':
        return html`<div class="entry entry--processing">Processing<span class="processing-dots"></span></div>`;
      default:
        return html`<div class="entry">${entry.content}</div>`;
    }
  }

  private _renderMarkdownHtml(text: string) {
    // Escape HTML first
    let escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Bold: **text**
    escaped = escaped.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

    // Headings: ### text
    escaped = escaped.replace(/^###\s+(.+)$/gm, '<span class="md-heading">$1</span>');
    escaped = escaped.replace(/^##\s+(.+)$/gm, '<span class="md-heading md-h2">$1</span>');

    // Bullet points: - text (with indentation support)
    escaped = escaped.replace(/^(\s*)- (.+)$/gm, (_, indent, content) => {
      const level = Math.floor(indent.length / 2);
      const padding = level > 0 ? `padding-left: ${level * 16}px` : '';
      return `<div class="md-bullet" style="${padding}"><span class="md-bullet-dot">•</span> ${content}</div>`;
    });

    // Line breaks
    escaped = escaped.replace(/\n/g, '<br>');

    // Clean up extra <br> before/after block elements
    escaped = escaped.replace(/<br>\s*<(div|span class="md-heading")/g, '<$1');
    escaped = escaped.replace(/<\/(div)>\s*<br>/g, '</$1>');

    return unsafeHTML(escaped);
  }

  override render() {
    return html`
      <div class="terminal-log" role="log" aria-live="polite" tabindex="0" aria-label="Terminal output">
        ${this.entries.map(entry => this._renderEntry(entry))}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'terminal-stream': TerminalStream;
  }
}
