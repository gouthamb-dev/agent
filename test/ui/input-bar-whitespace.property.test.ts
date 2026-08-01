import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fc from 'fast-check';
import { LitElement } from 'lit';
import '../../src/ui/input-bar.ts';
import type { InputBar } from '../../src/ui/input-bar.ts';

/**
 * Property 15: Whitespace-Only Rejection
 *
 * For any string composed entirely of whitespace characters (spaces, tabs, newlines),
 * submitting via Enter SHALL be a no-op — no `query-submit` event is emitted and
 * the input field retains focus.
 *
 * **Validates: Requirements 7.5**
 */

function createElement(): InputBar {
  const el = document.createElement('input-bar') as InputBar;
  document.body.appendChild(el);
  return el;
}

async function waitForUpdate(el: LitElement): Promise<void> {
  await el.updateComplete;
  await new Promise((r) => setTimeout(r, 0));
}

describe('Feature: sys-cli-agent, Property 15: Whitespace-Only Rejection', () => {
  let el: InputBar;
  let focusSpy: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    el = createElement();
    await waitForUpdate(el);
    // Mock _inputEl with a focus spy to verify focus is retained
    focusSpy = vi.fn();
    Object.defineProperty(el, '_inputEl', {
      get: () => ({ focus: focusSpy }),
      configurable: true,
    });
  });

  afterEach(() => {
    el?.remove();
  });

  /**
   * Arbitrary: whitespace-only strings of various lengths (1 to 500 chars).
   * Composed of spaces, tabs, and newlines.
   */
  const whitespaceOnlyArb = fc
    .array(fc.constantFrom(' ', '\t', '\n', '\r', '  ', '\t\t', '\n\n'), {
      minLength: 1,
      maxLength: 100,
    })
    .map((chars) => chars.join(''))
    .filter((s) => s.length >= 1 && s.length <= 500 && s.trim().length === 0);

  it('does not dispatch query-submit event for whitespace-only input', () => {
    fc.assert(
      fc.property(whitespaceOnlyArb, (whitespaceString) => {
        // Set internal value to the whitespace-only string
        (el as any)._value = whitespaceString;

        // Listen for query-submit event
        let eventFired = false;
        const handler = () => {
          eventFired = true;
        };
        el.addEventListener('query-submit', handler);

        // Call _submit()
        (el as any)._submit();

        // Verify no event was dispatched
        expect(eventFired).toBe(false);

        // Cleanup listener
        el.removeEventListener('query-submit', handler);
      }),
      { numRuns: 100 }
    );
  });

  it('retains _value unchanged (does not clear) for whitespace-only input', () => {
    fc.assert(
      fc.property(whitespaceOnlyArb, (whitespaceString) => {
        // Set internal value to the whitespace-only string
        (el as any)._value = whitespaceString;

        // Call _submit()
        (el as any)._submit();

        // Verify _value is NOT cleared — remains the whitespace string
        expect((el as any)._value).toBe(whitespaceString);
      }),
      { numRuns: 100 }
    );
  });

  it('retains focus (calls _inputEl.focus()) for whitespace-only input', () => {
    fc.assert(
      fc.property(whitespaceOnlyArb, (whitespaceString) => {
        // Reset the spy before each iteration
        focusSpy.mockClear();

        // Set internal value to the whitespace-only string
        (el as any)._value = whitespaceString;

        // Call _submit()
        (el as any)._submit();

        // Verify focus() was called to retain focus
        expect(focusSpy).toHaveBeenCalled();
      }),
      { numRuns: 100 }
    );
  });

  it('all three invariants hold simultaneously for whitespace-only input', () => {
    fc.assert(
      fc.property(whitespaceOnlyArb, (whitespaceString) => {
        // Reset state
        focusSpy.mockClear();

        // Set internal value to the whitespace-only string
        (el as any)._value = whitespaceString;

        // Listen for query-submit event
        let eventFired = false;
        const handler = () => {
          eventFired = true;
        };
        el.addEventListener('query-submit', handler);

        // Call _submit()
        (el as any)._submit();

        // Verify: no event dispatched
        expect(eventFired).toBe(false);

        // Verify: _value is NOT cleared
        expect((el as any)._value).toBe(whitespaceString);

        // Verify: focus() was called
        expect(focusSpy).toHaveBeenCalled();

        // Cleanup listener
        el.removeEventListener('query-submit', handler);
      }),
      { numRuns: 100 }
    );
  });
});
