import { LitElement, html, css } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import { designTokens } from './styles/design-tokens.css.js';

/**
 * InputBar component for the SYS_CLI // AGENT terminal interface.
 *
 * Renders a `$` command symbol followed by a text input with a blinking cursor.
 * Emits `query-submit` event on Enter with non-empty, non-whitespace text.
 * Supports disabled state during agent processing.
 */
@customElement('input-bar')
export class InputBar extends LitElement {
  static override styles = [
    designTokens,
    css`
      :host {
        display: block;
        font-family: var(--sys-font);
      }

      /* Input wrapper container
       * Contrast: --sys-text (#201B13) on --sys-bg-container (#F8ECDF) = ~14.8:1 ratio ✓ (WCAG AA)
       * Contrast: --sys-accent (#7C580D) on --sys-bg-container (#F8ECDF) = ~4.9:1 ratio ✓ (WCAG AA)
       */
      .input-wrapper {
        display: flex;
        align-items: center;
        padding: 8px 12px;
        border-top: var(--sys-border-width) solid var(--sys-border);
        background: var(--sys-bg-container);
      }

      .command-symbol {
        color: var(--sys-accent);
        font-family: var(--sys-font);
        font-size: 14px;
        font-weight: 700;
        margin-right: 8px;
        user-select: none;
        flex-shrink: 0;
      }

      .input-field {
        flex: 1;
        background: transparent;
        border: none;
        outline: none;
        color: var(--sys-text);
        font-family: var(--sys-font);
        font-size: 14px;
        line-height: 1.4;
        caret-color: var(--sys-accent);
        padding: 0;
      }

      .input-field::placeholder {
        color: var(--sys-text-muted);
        opacity: 0.6;
      }

      .input-field:focus {
        outline: none;
      }

      .input-wrapper:focus-within {
        outline: 2px solid var(--sys-accent);
        outline-offset: -2px;
      }

      .input-field.disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      /* Blinking cursor animation */
      @keyframes blink {
        0%, 49% { opacity: 1; }
        50%, 100% { opacity: 0; }
      }

      .cursor-indicator {
        display: inline-block;
        width: 8px;
        height: 16px;
        background: var(--sys-accent);
        animation: blink 1s step-end infinite;
        flex-shrink: 0;
        margin-left: 2px;
      }

      .cursor-indicator.hidden {
        display: none;
      }
    `,
  ];

  /** When true, input ignores all keyboard input including Enter. */
  @property({ type: Boolean, reflect: true })
  disabled = false;

  @state()
  private _value = '';

  @state()
  private _isFocused = false;

  @query('.input-field')
  private _inputEl!: HTMLInputElement;

  private _previousDisabled = false;

  override updated(changedProperties: Map<string, unknown>): void {
    super.updated(changedProperties);

    // When disabled transitions from true to false, restore focus
    if (changedProperties.has('disabled')) {
      const wasDisabled = this._previousDisabled;
      if (wasDisabled && !this.disabled) {
        // Re-enable: restore focus
        this.updateComplete.then(() => {
          this._inputEl?.focus();
        });
      }
      this._previousDisabled = this.disabled;
    }
  }

  override render() {
    return html`
      <div class="input-wrapper" role="textbox" aria-label="Command input">
        <span class="command-symbol">$</span>
        <input
          class="input-field ${this.disabled ? 'disabled' : ''}"
          type="text"
          .value=${this._value}
          maxlength="500"
          ?disabled=${this.disabled}
          aria-disabled=${this.disabled ? 'true' : 'false'}
          @input=${this._handleInput}
          @keydown=${this._handleKeydown}
          @focus=${this._handleFocus}
          @blur=${this._handleBlur}
          spellcheck="false"
          autocomplete="off"
        />
        <span class="cursor-indicator ${this._value.length > 0 || this._isFocused ? 'hidden' : ''}"></span>
      </div>
    `;
  }

  private _handleInput(e: Event): void {
    if (this.disabled) {
      e.preventDefault();
      return;
    }
    const input = e.target as HTMLInputElement;
    // Enforce 500 character max (belt and suspenders with maxlength attr)
    this._value = input.value.slice(0, 500);
  }

  private _handleKeydown(e: KeyboardEvent): void {
    if (this.disabled) {
      e.preventDefault();
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      this._submit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      this._inputEl?.blur();
    }
  }

  private _submit(): void {
    const text = this._value.trim();

    // Ignore whitespace-only submissions
    if (text.length === 0) {
      // Retain focus, do not emit event
      this._inputEl?.focus();
      return;
    }

    // Dispatch query-submit event with the text
    this.dispatchEvent(
      new CustomEvent('query-submit', {
        detail: { text },
        bubbles: true,
        composed: true,
      })
    );

    // Clear input after submission
    this._value = '';
  }

  private _handleFocus(): void {
    this._isFocused = true;
  }

  private _handleBlur(): void {
    this._isFocused = false;
  }

  /** Public method to programmatically focus the input */
  public focus(): void {
    this._inputEl?.focus();
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'input-bar': InputBar;
  }
}
