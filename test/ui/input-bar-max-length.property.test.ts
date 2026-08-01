import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import { LitElement } from 'lit';
import '../../src/ui/input-bar.ts';
import type { InputBar } from '../../src/ui/input-bar.ts';

/**
 * Property 12: Input Max Length Enforcement
 *
 * For any string longer than 500 characters, the Input_Bar SHALL prevent the full
 * string from being entered (truncating or rejecting characters beyond position 500).
 *
 * **Validates: Requirements 7.1**
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

describe('Feature: sys-cli-agent, Property 12: Input Max Length Enforcement', () => {
  let el: InputBar;

  beforeEach(async () => {
    el = createElement();
    await waitForUpdate(el);
  });

  afterEach(() => {
    el?.remove();
  });

  it('the HTML input element has maxlength="500" attribute set', async () => {
    const shadow = el.shadowRoot!;
    const input = shadow.querySelector('.input-field') as HTMLInputElement;
    expect(input).not.toBeNull();
    expect(input.getAttribute('maxlength')).toBe('500');
  });

  it('_handleInput truncates any string longer than 500 characters to exactly 500', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 501, maxLength: 2000 }),
        (longString) => {
          // Access the shadow DOM input element
          const shadow = el.shadowRoot!;
          const input = shadow.querySelector('.input-field') as HTMLInputElement;

          // Simulate setting a value longer than 500 chars and triggering input event
          input.value = longString;
          input.dispatchEvent(new Event('input', { bubbles: true }));

          // Verify internal _value is truncated to at most 500 characters
          const internalValue = (el as any)._value as string;
          expect(internalValue.length).toBeLessThanOrEqual(500);
          expect(internalValue.length).toBe(500);

          // Verify the truncated value matches the first 500 chars of the input
          expect(internalValue).toBe(longString.slice(0, 500));
        }
      ),
      { numRuns: 100 }
    );
  });

  it('strings of exactly 500 characters are accepted without truncation', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 500, maxLength: 500 }),
        (exactString) => {
          const shadow = el.shadowRoot!;
          const input = shadow.querySelector('.input-field') as HTMLInputElement;

          input.value = exactString;
          input.dispatchEvent(new Event('input', { bubbles: true }));

          const internalValue = (el as any)._value as string;
          expect(internalValue.length).toBe(500);
          expect(internalValue).toBe(exactString);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('strings shorter than 500 characters are accepted as-is', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 499 }),
        (shortString) => {
          const shadow = el.shadowRoot!;
          const input = shadow.querySelector('.input-field') as HTMLInputElement;

          input.value = shortString;
          input.dispatchEvent(new Event('input', { bubbles: true }));

          const internalValue = (el as any)._value as string;
          expect(internalValue.length).toBeLessThanOrEqual(500);
          expect(internalValue).toBe(shortString);
        }
      ),
      { numRuns: 100 }
    );
  });
});
