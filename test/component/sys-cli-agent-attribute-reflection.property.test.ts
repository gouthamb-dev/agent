import { describe, it, expect, beforeEach, vi } from 'vitest';
import fc from 'fast-check';
import { SysCLIAgentElement } from '../../src/sys-cli-agent.element.js';

// Mock child component imports to avoid registration conflicts in test env
vi.mock('../../src/ui/header-bar.js', () => ({}));
vi.mock('../../src/ui/terminal-stream.js', () => ({}));
vi.mock('../../src/ui/input-bar.js', () => ({}));

/**
 * Property 16: Attribute Reflection
 *
 * For any valid endpoint URL (≤2048 chars) or kb-path value (≤512 chars) set via HTML
 * attribute, the component's internal state SHALL reflect the new value within 100
 * milliseconds of the attribute change.
 *
 * **Validates: Requirements 8.2**
 */
describe('Feature: sys-cli-agent, Property 16: Attribute Reflection', () => {
  let element: SysCLIAgentElement;

  beforeEach(() => {
    element = new SysCLIAgentElement();
  });

  // --- Arbitraries ---

  /** Generate valid URL path segments (alphanumeric + some safe chars) */
  const pathSegmentArb = fc.stringOf(
    fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789-_'.split('')),
    { minLength: 1, maxLength: 20 }
  ).filter((s) => /^[a-z]/.test(s));

  /**
   * Generate a valid hostname label (must start with a letter, contain only alphanumeric + hyphen,
   * not end with hyphen). This ensures URLs pass the URL constructor.
   */
  const hostnameLabelArb = fc
    .tuple(
      fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'.split('')),
      fc.stringOf(
        fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'.split('')),
        { minLength: 0, maxLength: 8 }
      )
    )
    .map(([first, rest]) => first + rest);

  /** Generate a valid TLD (purely alphabetic, 2-6 chars) */
  const tldArb = fc.stringOf(
    fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'.split('')),
    { minLength: 2, maxLength: 6 }
  );

  /** Generate a valid hostname (labels joined by dots, ending with a valid TLD) */
  const hostnameArb = fc
    .tuple(
      fc.array(hostnameLabelArb, { minLength: 1, maxLength: 3 }),
      tldArb
    )
    .map(([labels, tld]) => [...labels, tld].join('.'));

  /** Generate an optional port */
  const portArb = fc.oneof(
    fc.constant(''),
    fc.integer({ min: 1, max: 65535 }).map((p) => `:${p}`)
  );

  /** Generate a valid URL path (0-4 segments) */
  const urlPathArb = fc
    .array(pathSegmentArb, { minLength: 0, maxLength: 4 })
    .map((segments) => (segments.length > 0 ? '/' + segments.join('/') : ''));

  /**
   * Generate valid endpoint URLs with http or https protocol, ≤2048 chars total.
   * Uses structured generation to ensure URLs are always parseable by new URL().
   */
  const validEndpointUrlArb: fc.Arbitrary<string> = fc
    .tuple(
      fc.constantFrom('http', 'https'),
      hostnameArb,
      portArb,
      urlPathArb
    )
    .map(([protocol, host, port, path]) => `${protocol}://${host}${port}${path}`)
    .filter((url) => {
      if (url.length > 2048) return false;
      // Verify the URL is actually parseable
      try {
        new URL(url);
        return true;
      } catch {
        return false;
      }
    });

  /**
   * Generate valid kb-path strings, ≤512 chars.
   * Paths are non-empty strings with path-like characters.
   */
  const validKbPathArb: fc.Arbitrary<string> = fc
    .tuple(
      fc.constantFrom('/', '/home/', '/docs/', '/var/data/', '/opt/kb/', 'C:\\Users\\', './'),
      fc.array(
        fc.stringOf(
          fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789-_'.split('')),
          { minLength: 1, maxLength: 20 }
        ),
        { minLength: 1, maxLength: 8 }
      )
    )
    .map(([prefix, segments]) => prefix + segments.join('/'))
    .filter((path) => path.length > 0 && path.length <= 512);

  // --- Property Tests ---

  it('valid endpoint URLs are reflected in validatedEndpoint after calling _onEndpointChanged()', () => {
    fc.assert(
      fc.property(validEndpointUrlArb, (url) => {
        element.endpoint = url;
        const startTime = performance.now();
        (element as any)._onEndpointChanged();
        const elapsed = performance.now() - startTime;

        // Internal state reflects the value
        expect(element.validatedEndpoint).toBe(url);

        // Reflection happens within 100ms
        expect(elapsed).toBeLessThan(100);
      }),
      { numRuns: 100 }
    );
  });

  it('valid kb-path values are reflected in validatedKbPath after calling _onKbPathChanged()', () => {
    fc.assert(
      fc.property(validKbPathArb, (path) => {
        element.kbPath = path;
        const startTime = performance.now();
        (element as any)._onKbPathChanged();
        const elapsed = performance.now() - startTime;

        // Internal state reflects the value
        expect(element.validatedKbPath).toBe(path);

        // Reflection happens within 100ms
        expect(elapsed).toBeLessThan(100);
      }),
      { numRuns: 100 }
    );
  });

  it('endpoint reflection preserves exact URL value without mutation', () => {
    fc.assert(
      fc.property(validEndpointUrlArb, (url) => {
        element.endpoint = url;
        (element as any)._onEndpointChanged();

        // The reflected value must be exactly the same string
        expect(element.validatedEndpoint).toStrictEqual(url);
        expect(element.validatedEndpoint.length).toBe(url.length);
      }),
      { numRuns: 100 }
    );
  });

  it('kb-path reflection preserves exact path value without mutation', () => {
    fc.assert(
      fc.property(validKbPathArb, (path) => {
        element.kbPath = path;
        (element as any)._onKbPathChanged();

        // The reflected value must be exactly the same string
        expect(element.validatedKbPath).toStrictEqual(path);
        expect(element.validatedKbPath.length).toBe(path.length);
      }),
      { numRuns: 100 }
    );
  });

  it('endpoint URLs at boundary length (close to 2048 chars) are correctly reflected', () => {
    // Generate URLs near the 2048 boundary
    const nearBoundaryUrlArb = fc
      .integer({ min: 1900, max: 2048 })
      .map((targetLength) => {
        const base = 'https://example.com/';
        const padding = 'a'.repeat(Math.max(0, targetLength - base.length));
        return base + padding;
      })
      .filter((url) => url.length <= 2048);

    fc.assert(
      fc.property(nearBoundaryUrlArb, (url) => {
        element.endpoint = url;
        const startTime = performance.now();
        (element as any)._onEndpointChanged();
        const elapsed = performance.now() - startTime;

        expect(element.validatedEndpoint).toBe(url);
        expect(elapsed).toBeLessThan(100);
      }),
      { numRuns: 100 }
    );
  });

  it('kb-path values at boundary length (close to 512 chars) are correctly reflected', () => {
    // Generate paths near the 512 boundary
    const nearBoundaryPathArb = fc
      .integer({ min: 450, max: 512 })
      .map((targetLength) => {
        const base = '/docs/';
        const padding = 'x'.repeat(Math.max(0, targetLength - base.length));
        return base + padding;
      })
      .filter((path) => path.length <= 512);

    fc.assert(
      fc.property(nearBoundaryPathArb, (path) => {
        element.kbPath = path;
        const startTime = performance.now();
        (element as any)._onKbPathChanged();
        const elapsed = performance.now() - startTime;

        expect(element.validatedKbPath).toBe(path);
        expect(elapsed).toBeLessThan(100);
      }),
      { numRuns: 100 }
    );
  });
});
