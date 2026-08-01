// Test environment initialization for sys-cli-agent
// jsdom environment is configured via vitest.config.ts

// Polyfill customElements for jsdom if not available
if (!globalThis.customElements) {
  (globalThis as any).customElements = {
    define: () => {},
    get: () => undefined,
    whenDefined: () => Promise.resolve(),
  };
}
