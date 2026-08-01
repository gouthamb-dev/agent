import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { designTokens } from './styles/design-tokens.css.js';

/**
 * HeaderBar component for SYS_CLI // AGENT
 *
 * Renders the title "SYS_CLI // AGENT" with three window-control dots:
 * - Close (red-ish)
 * - Minimize (yellow-ish)
 * - Active indicator (amber #E5A93B)
 *
 * Accepts a `status` property for connection state indication.
 */
@customElement('sys-header-bar')
export class HeaderBar extends LitElement {
  static styles = [
    designTokens,
    css`
      :host {
        display: block;
        font-family: var(--sys-font);
      }

      .header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px 12px;
        background: var(--sys-bg);
        border-bottom: var(--sys-border-width) solid var(--sys-border);
        border-radius: var(--sys-border-radius);
      }

      .title {
        font-size: 12px;
        font-weight: 600;
        letter-spacing: 1px;
        color: var(--sys-text);
        font-family: var(--sys-font);
      }

      .dots {
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        border: var(--sys-border-width) solid var(--sys-border);
      }

      .dot--close {
        background-color: var(--sys-error);
      }

      .dot--minimize {
        background-color: var(--sys-accent);
      }

      .dot--active {
        background-color: var(--sys-active-dot);
      }

      /* Status-based styling for the active dot */
      :host([status='connecting']) .dot--active {
        animation: pulse 1.2s ease-in-out infinite;
      }

      :host([status='error']) .dot--active {
        background-color: var(--sys-error);
      }

      :host([status='idle']) .dot--active {
        opacity: 0.5;
      }

      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.4; }
      }
    `,
  ];

  /**
   * Connection status indicator.
   * Controls the visual state of the active indicator dot.
   */
  @property({ type: String, reflect: true })
  status: 'idle' | 'connecting' | 'connected' | 'error' = 'idle';

  render() {
    return html`
      <div class="header" role="banner">
        <div class="dots" aria-hidden="true">
          <span class="dot dot--close" title="Close"></span>
          <span class="dot dot--minimize" title="Minimize"></span>
          <span class="dot dot--active" title="Status: ${this.status}"></span>
        </div>
        <span class="title">SYS_CLI // AGENT</span>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sys-header-bar': HeaderBar;
  }
}
