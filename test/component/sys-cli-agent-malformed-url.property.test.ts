import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { SysCLIAgentElement } from '../../src/sys-cli-agent.element.js';

// Mock child component imports to avoid registration conflicts in test env
vi.mock('../../src/ui/header-bar.js', () => ({}));
vi.mock('../../src/ui/terminal-stream.js', () => ({}));
vi.mock('../../src/ui/input-bar.js', () => ({}));

/**
 * Property 17: Malformed URL Error Emission
 *
 * For any endpoint attribute value that is empty, exceeds 2048 characters,
 * or fails URL validation (missing protocol, invalid characters), the
 * Web_Component SHALL emit an `agent-error` event with a detail describing
 * the validation failure and SHALL NOT attempt a connection.
 *
 * **Validates: Requirements 8.5**
 *
 * Tag: Feature: sys-cli-agent, Property 17: Malformed URL Error Emission
 */
describe('Property 17: Malformed URL Error Emission', { timeout: 30_000 }, () => {
  let element: SysCLIAgentElement;

  beforeEach(() => {
    element = new SysCLIAgentElement();
  });

  // --- Generators ---

  /** Generates empty strings */
  const emptyStringArb = fc.constant('');

  /** Generates whitespace-only strings (spaces, tabs, newlines) */
  const whitespaceOnlyArb = fc.stringOf(
    fc.constantFrom(' ', '\t', '\n', '\r', ' \t', '  '),
    { minLength: 1, maxLength: 20 }
  );

  /** Generates oversized URLs (>2048 chars) with valid URL format */
  const oversizedUrlArb = fc.integer({ min: 2049, max: 4096 }).map((length) => {
    const prefix = 'https://example.com/';
    const padding = 'a'.repeat(length - prefix.length);
    return prefix + padding;
  });

  /** Generates random strings that are NOT valid URLs */
  const invalidFormatArb = fc.oneof(
    // Random alphanumeric strings without protocol
    fc.stringOf(fc.char(), { minLength: 1, maxLength: 100 }).filter((s) => {
      try {
        new URL(s);
        return false; // Discard valid URLs
      } catch {
        return true; // Keep invalid ones
      }
    }),
    // Strings with partial URL-like patterns but invalid
    fc.constantFrom(
      'not-a-url',
      'just some text',
      '://missing-protocol.com',
      'http://',
      'https://',
      'example.com/no-protocol',
      '12345',
      'http//missing-colon.com',
      'htp://typo.com/api'
    )
  );

  /** Generates valid URLs but with wrong protocol (not http/https) */
  const wrongProtocolArb = fc.oneof(
    fc.constantFrom('ftp', 'ws', 'wss', 'file', 'ssh', 'telnet', 'mailto').map(
      (proto) => `${proto}://example.com/api/v1`
    ),
    fc.tuple(
      fc.constantFrom('ftp', 'ws', 'wss', 'file', 'ssh', 'telnet'),
      fc.webUrl().map((url) => {
        try {
          const parsed = new URL(url);
          return parsed.host + parsed.pathname;
        } catch {
          return 'example.com/path';
        }
      })
    ).map(([proto, hostPath]) => `${proto}://${hostPath}`)
  );

  /** Combined arbitrary for all malformed URL categories */
  const malformedUrlArb = fc.oneof(
    emptyStringArb,
    whitespaceOnlyArb,
    oversizedUrlArb,
    invalidFormatArb,
    wrongProtocolArb
  );

  // --- Property Tests ---

  it('validateEndpoint() returns { valid: false } for any malformed URL', () => {
    fc.assert(
      fc.property(malformedUrlArb, (url) => {
        const result = element.validateEndpoint(url);
        expect(result.valid).toBe(false);
        expect(result.error).toBeDefined();
        expect(typeof result.error).toBe('string');
        expect(result.error!.length).toBeGreaterThan(0);
      }),
      { numRuns: 100, verbose: true }
    );
  });

  it('emits agent-error event with bubbles: true and composed: true for any malformed URL', () => {
    fc.assert(
      fc.property(malformedUrlArb, (url) => {
        const errors: CustomEvent[] = [];
        element.addEventListener('agent-error', ((e: CustomEvent) => {
          errors.push(e);
        }) as EventListener);

        element.endpoint = url;
        (element as any)._onEndpointChanged();

        expect(errors.length).toBe(1);
        expect(errors[0].bubbles).toBe(true);
        expect(errors[0].composed).toBe(true);

        // Clean up listener for next iteration
        element.removeEventListener('agent-error', errors[0] as any);
      }),
      { numRuns: 100, verbose: true }
    );
  });

  it('agent-error event detail contains a descriptive error message', () => {
    fc.assert(
      fc.property(malformedUrlArb, (url) => {
        const errors: CustomEvent[] = [];
        element.addEventListener('agent-error', ((e: CustomEvent) => {
          errors.push(e);
        }) as EventListener);

        element.endpoint = url;
        (element as any)._onEndpointChanged();

        expect(errors.length).toBe(1);
        expect(errors[0].detail).toBeDefined();
        expect(errors[0].detail.message).toBeDefined();
        expect(typeof errors[0].detail.message).toBe('string');
        expect(errors[0].detail.message.length).toBeGreaterThan(0);
      }),
      { numRuns: 100, verbose: true }
    );
  });

  it('sets _connectionStatus to "error" and never "connecting" for any malformed URL', () => {
    fc.assert(
      fc.property(malformedUrlArb, (url) => {
        element.endpoint = url;
        (element as any)._onEndpointChanged();

        expect((element as any)._connectionStatus).toBe('error');
        expect((element as any)._connectionStatus).not.toBe('connecting');
      }),
      { numRuns: 100, verbose: true }
    );
  });

  // --- Category-Specific Property Tests ---

  it('rejects empty strings and whitespace-only URLs', () => {
    const emptyOrWhitespaceArb = fc.oneof(emptyStringArb, whitespaceOnlyArb);

    fc.assert(
      fc.property(emptyOrWhitespaceArb, (url) => {
        const result = element.validateEndpoint(url);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('required');
      }),
      { numRuns: 100, verbose: true }
    );
  });

  it('rejects oversized URLs (>2048 chars) with length-related error', () => {
    fc.assert(
      fc.property(oversizedUrlArb, (url) => {
        expect(url.length).toBeGreaterThan(2048);
        const result = element.validateEndpoint(url);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('2048');
      }),
      { numRuns: 100, verbose: true }
    );
  });

  it('rejects invalid URL format strings', () => {
    fc.assert(
      fc.property(invalidFormatArb, (url) => {
        const result = element.validateEndpoint(url);
        expect(result.valid).toBe(false);
        expect(result.error).toBeDefined();
      }),
      { numRuns: 100, verbose: true }
    );
  });

  it('rejects valid URLs with wrong protocol (not http/https)', () => {
    fc.assert(
      fc.property(wrongProtocolArb, (url) => {
        const result = element.validateEndpoint(url);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('http or https');
      }),
      { numRuns: 100, verbose: true }
    );
  });
});
