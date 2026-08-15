import { css } from 'lit';

/**
 * Design tokens for SYS_CLI // AGENT
 *
 * Inherits Antarctic Tech Color System from host portfolio CSS custom properties
 * (--primary, --surface, --on-surface, --outline-variant, etc.), falling back to
 * portfolio default dark theme values.
 * Anyone embedding <sys-cli-agent> can override design tokens externally via CSS Custom Properties.
 */
export const designTokens = css`
  :host {
    /* --- Base Palette (Inherited from portfolio CSS variables with Antarctic Dark Theme fallbacks) --- */

    /* Primary */
    --color-primary: var(--primary, #D8B8B6);
    --color-on-primary: var(--on-primary, #3B2221);
    --color-primary-container: var(--primary-container, #876765);
    --color-on-primary-container: var(--on-primary-container, #FFFFFF);

    /* Secondary */
    --color-secondary: var(--secondary, #FFE186);
    --color-on-secondary: var(--on-secondary, #3C2F00);
    --color-secondary-container: var(--secondary-container, #E8C44A);
    --color-on-secondary-container: var(--on-secondary-container, #231B00);

    /* Tertiary */
    --color-tertiary: var(--tertiary, #B8C9D6);
    --color-on-tertiary: var(--on-tertiary, #23323D);

    /* Error */
    --color-error: var(--error, #FFB4AB);
    --color-on-error: var(--on-error, #690005);
    --color-error-container: var(--error-container, #93000A);
    --color-on-error-container: var(--on-error-container, #FFDAD6);

    /* Background & Surface */
    --color-background: var(--background, #0B0B0D);
    --color-on-background: var(--on-background, #F0ECE0);
    --color-surface: var(--surface, #0B0B0D);
    --color-on-surface: var(--on-surface, #F0ECE0);
    --color-surface-variant: var(--surface-variant, var(--surface-container-highest, #2C2C33));
    --color-on-surface-variant: var(--on-surface-variant, #C8C2B4);

    /* Outline */
    --color-outline: var(--outline, #D8B8B6);
    --color-outline-variant: var(--outline-variant, #3A3D45);

    /* Surface Containers */
    --color-surface-container: var(--surface-container, #19191D);
    --color-surface-container-high: var(--surface-container-high, #212126);
    --color-surface-container-highest: var(--surface-container-highest, #2C2C33);

    /* --- Technical Brutalism Semantic Tokens --- */

    /* Surface */
    --sys-bg: var(--color-surface);
    --sys-bg-container: var(--color-surface-container);
    --sys-bg-high: var(--color-surface-container-high);

    /* Text */
    --sys-text: var(--color-on-surface);
    --sys-text-muted: var(--color-on-surface-variant);

    /* Borders */
    --sys-border: var(--color-outline-variant);
    --sys-border-strong: var(--color-outline);

    /* Accent */
    --sys-accent: var(--color-primary);
    --sys-accent-container: var(--color-primary-container);
    --sys-active-dot: var(--color-secondary);

    /* Error */
    --sys-error: var(--color-error);
    --sys-error-container: var(--color-error-container);
    --sys-error-text: var(--color-on-error-container);

    /* Typography & Layout */
    --sys-font: 'JetBrains Mono', 'Fira Code', 'Source Code Pro', 'Courier New', monospace;
    --sys-border-width: 1px;
    --sys-border-radius: 0px;
  }
`;
