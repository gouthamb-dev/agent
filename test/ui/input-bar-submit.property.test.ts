import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import { LitElement } from 'lit';
import '../../src/ui/input-bar.ts';
import type { InputBar } from '../../src/ui/input-bar.ts';

/**
 * Property 13: Submit and Clear Behavior
 *
 * For any non-empty, non-whitespace-only string in the Input_Bar, pressing Enter SHALL
 * dispatch a `query-submit` event with the input text as detail and clear the input field
 * to an empty string.
 *
 * **Validates: Requirements 7.2**
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

describe('Feature: sys-cli-agent, Property 13: Submit and Clear Behavior', () => {
  let el: InputBar;

  beforeEach(async () => {
    el = createElement();
    await waitForUpdate(el);
    // Mock _inputEl since _submit() calls this._inputEl?.focus()
    Object.defineProperty(el, '_inputEl', {
      get: () => ({ focus: () => {} }),
      configurable: true,
    });
  });

  afterEach(() => {
    el?.remove();
  });

  /**
   * Arbitrary: non-empty, non-whitespace-only strings up to 500 characters.
   * These are valid submission inputs that should trigger the query-submit event.
   */
  const nonEmptyNonWhitespaceArb = fc
    .string({ minLength: 1, maxLength: 500 })
    .filter((s) => s.trim().length > 0);

  it('dispatches query-submit event with trimmed text and clears _value after _submit()', () => {
    fc.assert(
      fc.property(nonEmptyNonWhitespaceArb, (input) => {
        // Set the internal value directly
        (el as any)._value = input;

        // Listen for query-submit event
        let receivedEvent: CustomEvent | null = null;
        const handler = (e: Event) => {
          receivedEvent = e as CustomEvent;
        };
        el.addEventListener('query-submit', handler);

        // Call _submit()
        (el as any)._submit();

        // Verify event was dispatched
        expect(receivedEvent).not.toBeNull();
        expect(receivedEvent!.type).toBe('query-submit');

        // Verify event detail contains trimmed text
        const expectedText = input.trim();
        expect(receivedEvent!.detail).toEqual({ text: expectedText });

        // Verify _value is cleared after submission
        expect((el as any)._value).toBe('');

        // Cleanup listener
        el.removeEventListener('query-submit', handler);
      }),
      { numRuns: 100 }
    );
  });

  it('query-submit event is composed and bubbles', () => {
    fc.assert(
      fc.property(nonEmptyNonWhitespaceArb, (input) => {
        (el as any)._value = input;

        let receivedEvent: CustomEvent | null = null;
        const handler = (e: Event) => {
          receivedEvent = e as CustomEvent;
        };
        el.addEventListener('query-submit', handler);

        (el as any)._submit();

        expect(receivedEvent).not.toBeNull();
        expect(receivedEvent!.bubbles).toBe(true);
        expect(receivedEvent!.composed).toBe(true);

        el.removeEventListener('query-submit', handler);
      }),
      { numRuns: 100 }
    );
  });

  it('event detail text matches the trimmed version of the input value', () => {
    fc.assert(
      fc.property(nonEmptyNonWhitespaceArb, (input) => {
        (el as any)._value = input;

        let receivedEvent: CustomEvent | null = null;
        const handler = (e: Event) => {
          receivedEvent = e as CustomEvent;
        };
        el.addEventListener('query-submit', handler);

        (el as any)._submit();

        // The text in the event should always be the trimmed version
        expect(receivedEvent!.detail.text).toBe(input.trim());
        // Trimmed text should never be empty for our generated inputs
        expect(receivedEvent!.detail.text.length).toBeGreaterThan(0);

        el.removeEventListener('query-submit', handler);
      }),
      { numRuns: 100 }
    );
  });
});
