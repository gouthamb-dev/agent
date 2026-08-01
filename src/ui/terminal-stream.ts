import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
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
        display: block;
        flex: 1;
        overflow: hidden;
      }

      /* Terminal log container
       * Contrast: --sys-text (#201B13) on --sys-bg (#FFF8F3) = ~16.5:1 ratio ✓ (WCAG AA)
       * Contrast: --sys-text-muted (#4E4539) on --sys-bg (#FFF8F3) = ~7.8:1 ratio ✓ (WCAG AA)
       */
      .terminal-log {
        height: 100%;
        overflow-y: auto;
        padding: 12px 16px;
        font-family: var(--sys-font);
        font-size: 13px;
        line-height: 1.6;
        color: var(--sys-text);
        background: var(--sys-bg);
      }

      .terminal-log:focus {
        outline: 2px solid var(--sys-accent);
        outline-offset: -2px;
      }

      .entry {
        margin-bottom: 4px;
        white-space: pre-wrap;
        word-break: break-word;
      }

      .entry--user {
        color: var(--sys-text);
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
        return html`<div class="entry entry--response">${entry.content}</div>`;
      case 'error':
        return html`<div class="entry entry--error">${entry.content}</div>`;
      case 'processing':
        return html`<div class="entry entry--processing">Processing<span class="processing-dots"></span></div>`;
      default:
        return html`<div class="entry">${entry.content}</div>`;
    }
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
