import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import { PostMessageBridge } from '../../src/bridge/post-message-bridge';
import type { BridgeMessage } from '../../src/bridge/post-message-bridge';

/**
 * Property 19: Origin Allowlist Enforcement
 *
 * For any incoming postMessage event, the PostMessageBridge SHALL accept the message
 * only if the event's origin matches an entry in the configured allowlist, and SHALL
 * silently discard messages from all other origins.
 *
 * **Validates: Requirements 9.5**
 */
describe('Feature: sys-cli-agent, Property 19: Origin Allowlist Enforcement', () => {
  // --- Arbitraries ---

  /** Generate a valid origin string like 'https://example.com' or 'http://localhost:3000' */
  const originArb: fc.Arbitrary<string> = fc.oneof(
    // https origins with random domains
    fc.tuple(
      fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'.split('')), { minLength: 3, maxLength: 12 }),
      fc.constantFrom('.com', '.io', '.org', '.net', '.dev', '.app'),
    ).map(([domain, tld]) => `https://${domain}${tld}`),
    // http origins with port numbers
    fc.tuple(
      fc.constantFrom('localhost', '127.0.0.1', '0.0.0.0'),
      fc.integer({ min: 1000, max: 9999 }),
    ).map(([host, port]) => `http://${host}:${port}`),
    // https origins with subdomain
    fc.tuple(
      fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'.split('')), { minLength: 2, maxLength: 8 }),
      fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'.split('')), { minLength: 3, maxLength: 10 }),
      fc.constantFrom('.com', '.io', '.org'),
    ).map(([sub, domain, tld]) => `https://${sub}.${domain}${tld}`),
  );

  /** Generate a non-empty allowlist of unique origin strings (1 to 5 entries) */
  const allowlistArb: fc.Arbitrary<string[]> = fc
    .array(originArb, { minLength: 1, maxLength: 5 })
    .map((origins) => [...new Set(origins)])
    .filter((origins) => origins.length >= 1);

  /** Generate a valid BridgeMessage payload */
  const bridgeMessageArb: fc.Arbitrary<BridgeMessage> = fc
    .tuple(
      fc.constantFrom('state-change' as const, 'user-interaction' as const, 'config-update' as const),
      fc.anything(),
      fc.integer({ min: 0, max: Number.MAX_SAFE_INTEGER }),
    )
    .map(([type, payload, timestamp]) => ({
      type,
      payload,
      source: 'sys-cli-agent' as const,
      timestamp,
    }));

  // --- Helpers ---

  function createBridgeAndDispatch(
    allowedOrigins: string[],
    messageOrigin: string,
    message: BridgeMessage,
  ): { handler: ReturnType<typeof vi.fn>; bridge: PostMessageBridge } {
    const bridge = new PostMessageBridge({ allowedOrigins });
    const handler = vi.fn();
    bridge.onMessage(handler);
    bridge.connect();

    window.dispatchEvent(
      new MessageEvent('message', {
        data: message,
        origin: messageOrigin,
      }),
    );

    return { handler, bridge };
  }

  // --- Property Tests ---

  it('messages from origins IN the allowlist are accepted', { timeout: 30_000 }, () => {
    fc.assert(
      fc.property(
        allowlistArb,
        bridgeMessageArb,
        (allowlist, message) => {
          // Pick a random origin from the allowlist (always at least one entry)
          const chosenOrigin = allowlist[0];

          const { handler, bridge } = createBridgeAndDispatch(allowlist, chosenOrigin, message);

          try {
            // Handler SHOULD be called because origin is in the allowlist
            expect(handler).toHaveBeenCalledTimes(1);
            expect(handler).toHaveBeenCalledWith(message);
          } finally {
            bridge.disconnect();
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('messages from origins NOT in the allowlist are silently discarded', { timeout: 30_000 }, () => {
    fc.assert(
      fc.property(
        allowlistArb,
        originArb,
        bridgeMessageArb,
        (allowlist, randomOrigin, message) => {
          // Ensure the random origin is NOT in the allowlist
          fc.pre(!allowlist.includes(randomOrigin));

          const { handler, bridge } = createBridgeAndDispatch(allowlist, randomOrigin, message);

          try {
            // Handler should NOT be called because origin is not in the allowlist
            expect(handler).not.toHaveBeenCalled();
          } finally {
            bridge.disconnect();
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('wildcard allowlist ["*"] accepts any origin', { timeout: 30_000 }, () => {
    fc.assert(
      fc.property(
        originArb,
        bridgeMessageArb,
        (randomOrigin, message) => {
          const wildcardAllowlist = ['*'];

          const { handler, bridge } = createBridgeAndDispatch(wildcardAllowlist, randomOrigin, message);

          try {
            // With wildcard, ALL origins should be accepted
            expect(handler).toHaveBeenCalledTimes(1);
            expect(handler).toHaveBeenCalledWith(message);
          } finally {
            bridge.disconnect();
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('rejected origins cause no errors, no events, no information leakage', { timeout: 30_000 }, () => {
    fc.assert(
      fc.property(
        allowlistArb,
        originArb,
        bridgeMessageArb,
        (allowlist, randomOrigin, message) => {
          // Ensure the random origin is NOT in the allowlist
          fc.pre(!allowlist.includes(randomOrigin));

          const bridge = new PostMessageBridge({ allowedOrigins: allowlist });
          const handler = vi.fn();
          const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
          const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
          const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

          bridge.onMessage(handler);
          bridge.connect();

          try {
            // Dispatch the message from a non-allowed origin
            window.dispatchEvent(
              new MessageEvent('message', {
                data: message,
                origin: randomOrigin,
              }),
            );

            // No handler called (message discarded)
            expect(handler).not.toHaveBeenCalled();

            // No console output (no information leakage)
            expect(errorSpy).not.toHaveBeenCalled();
            expect(warnSpy).not.toHaveBeenCalled();
            expect(logSpy).not.toHaveBeenCalled();
          } finally {
            bridge.disconnect();
            errorSpy.mockRestore();
            warnSpy.mockRestore();
            logSpy.mockRestore();
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
