import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import { LitElement } from 'lit';
import '../../src/ui/input-bar.ts';
import type { InputBar } from '../../src/ui/input-bar.ts';

/**
 * Property 14: Disabled State Input Rejection
 *
 * For any keyboard input (including Enter) received while the Input_Bar is in a disabled
 * state (isProcessing = true), the Input_Bar SHALL ignore the input and maintain the
 * disabled state with no side effects.
 *
 * **Validates: Requirements 7.3**
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

describe('Feature: sys-cli-agent, Property 14: Disabled State Input Rejection', () => {
  let el: InputBar;

  beforeEach(async () => {
    el = createElement();
    await waitForUpdate(el);
  });

  afterEach(() => {
    el?.remove();
  });

  // --- Arbitraries ---

  /** Generate random keyboard event keys including Enter, Escape, and printable characters */
  const keyArb: fc.Arbitrary<string> = fc.oneof(
    fc.constant('Enter'),
    fc.constant('Escape'),
    fc.constant('Tab'),
    fc.constant('Backspace'),
    fc.constant('Delete'),
    fc.constant('ArrowUp'),
    fc.constant('ArrowDown'),
    fc.constant('ArrowLeft'),
    fc.constant('ArrowRight'),
    fc.constant('Home'),
    fc.constant('End'),
    fc.constant(' '),
    // Printable characters (single chars: letters, digits, symbols)
    fc.char().filter((c) => c.length === 1 && c.charCodeAt(0) >= 32 && c.charCodeAt(0) <= 126)
  );

  /** Generate random initial value strings (non-empty to verify no mutation) */
  const initialValueArb: fc.Arbitrary<string> = fc.string({ minLength: 1, maxLength: 100 }).filter(
    (s) => s.trim().length > 0
  );

  // --- Property Tests ---

  it('all keyboard inputs are ignored when disabled — no query-submit event is dispatched', () => {
    fc.assert(
      fc.property(keyArb, initialValueArb, (key, initialValue) => {
        // Set up: disable the input bar and set an initial value
        el.disabled = true;
        (el as any)._value = initialValue;

        // Track query-submit events
        let eventFired = false;
        const handler = () => { eventFired = true; };
        el.addEventListener('query-submit', handler);

        try {
          // Call _handleKeydown directly with a generated KeyboardEvent
          const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
          (el as any)._handleKeydown(event);

          // Verify: no query-submit event dispatched
          expect(eventFired).toBe(false);
        } finally {
          el.removeEventListener('query-submit', handler);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('all keyboard inputs are ignored when disabled — _value remains unchanged', () => {
    fc.assert(
      fc.property(keyArb, initialValueArb, (key, initialValue) => {
        // Set up: disable the input bar and set an initial value
        el.disabled = true;
        (el as any)._value = initialValue;

        // Call _handleKeydown directly with a generated KeyboardEvent
        const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
        (el as any)._handleKeydown(event);

        // Verify: _value has not changed
        expect((el as any)._value).toBe(initialValue);
      }),
      { numRuns: 100 }
    );
  });

  it('all keyboard inputs are ignored when disabled — e.preventDefault() is called', () => {
    fc.assert(
      fc.property(keyArb, initialValueArb, (key, initialValue) => {
        // Set up: disable the input bar and set an initial value
        el.disabled = true;
        (el as any)._value = initialValue;

        // Create a cancelable event to verify preventDefault is called
        const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
        (el as any)._handleKeydown(event);

        // Verify: preventDefault was called (event.defaultPrevented is true)
        expect(event.defaultPrevented).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('all keyboard inputs are ignored when disabled — disabled state is maintained', () => {
    fc.assert(
      fc.property(keyArb, initialValueArb, (key, initialValue) => {
        // Set up: disable the input bar and set an initial value
        el.disabled = true;
        (el as any)._value = initialValue;

        // Call _handleKeydown directly with a generated KeyboardEvent
        const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
        (el as any)._handleKeydown(event);

        // Verify: disabled state is maintained
        expect(el.disabled).toBe(true);
      }),
      { numRuns: 100 }
    );
  });
});
