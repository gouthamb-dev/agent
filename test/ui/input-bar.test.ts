import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { LitElement } from 'lit';
import '../../src/ui/input-bar.ts';
import type { InputBar } from '../../src/ui/input-bar.ts';

function createElement(): InputBar {
  const el = document.createElement('input-bar') as InputBar;
  document.body.appendChild(el);
  return el;
}

async function waitForUpdate(el: LitElement): Promise<void> {
  await el.updateComplete;
  // Give additional microtask for async rendering
  await new Promise((r) => setTimeout(r, 0));
}

describe('InputBar', () => {
  let el: InputBar;

  beforeEach(async () => {
    el = createElement();
    await waitForUpdate(el);
  });

  afterEach(() => {
    el?.remove();
  });

  describe('rendering', () => {
    it('should register as a custom element', () => {
      expect(customElements.get('input-bar')).toBeDefined();
    });

    it('should render a $ command symbol', async () => {
      const shadow = el.shadowRoot!;
      const symbol = shadow.querySelector('.command-symbol');
      expect(symbol).not.toBeNull();
      expect(symbol!.textContent).toBe('$');
    });

    it('should render an input field', async () => {
      const shadow = el.shadowRoot!;
      const input = shadow.querySelector('.input-field') as HTMLInputElement;
      expect(input).not.toBeNull();
      expect(input.tagName.toLowerCase()).toBe('input');
    });

    it('should apply role="textbox" on the input wrapper', async () => {
      const shadow = el.shadowRoot!;
      const wrapper = shadow.querySelector('[role="textbox"]');
      expect(wrapper).not.toBeNull();
    });

    it('should render a blinking cursor indicator', async () => {
      const shadow = el.shadowRoot!;
      const cursor = shadow.querySelector('.cursor-indicator');
      expect(cursor).not.toBeNull();
    });
  });

  describe('max length enforcement', () => {
    it('should set maxlength=500 on the input element', async () => {
      const shadow = el.shadowRoot!;
      const input = shadow.querySelector('.input-field') as HTMLInputElement;
      expect(input.getAttribute('maxlength')).toBe('500');
    });

    it('should truncate input exceeding 500 characters programmatically', async () => {
      const shadow = el.shadowRoot!;
      const input = shadow.querySelector('.input-field') as HTMLInputElement;

      // Simulate input with >500 chars
      const longText = 'a'.repeat(600);
      input.value = longText;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      await waitForUpdate(el);

      // After processing, internal value should be truncated to 500
      expect((el as any)._value.length).toBeLessThanOrEqual(500);
    });
  });

  describe('submit behavior', () => {
    it('should emit query-submit event on Enter with non-empty text', async () => {
      const shadow = el.shadowRoot!;
      const input = shadow.querySelector('.input-field') as HTMLInputElement;

      // Set value
      input.value = 'hello world';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      await waitForUpdate(el);

      // Listen for event
      const handler = vi.fn();
      el.addEventListener('query-submit', handler);

      // Press Enter
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      await waitForUpdate(el);

      expect(handler).toHaveBeenCalledTimes(1);
      const detail = (handler.mock.calls[0][0] as CustomEvent).detail;
      expect(detail.text).toBe('hello world');
    });

    it('should clear input after successful submission', async () => {
      const shadow = el.shadowRoot!;
      const input = shadow.querySelector('.input-field') as HTMLInputElement;

      input.value = 'test query';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      await waitForUpdate(el);

      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      await waitForUpdate(el);

      expect((el as any)._value).toBe('');
    });

    it('should NOT emit query-submit for whitespace-only input', async () => {
      const shadow = el.shadowRoot!;
      const input = shadow.querySelector('.input-field') as HTMLInputElement;

      input.value = '   \t  ';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      await waitForUpdate(el);

      const handler = vi.fn();
      el.addEventListener('query-submit', handler);

      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      await waitForUpdate(el);

      expect(handler).not.toHaveBeenCalled();
    });

    it('should NOT emit query-submit for empty input', async () => {
      const shadow = el.shadowRoot!;
      const input = shadow.querySelector('.input-field') as HTMLInputElement;

      const handler = vi.fn();
      el.addEventListener('query-submit', handler);

      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      await waitForUpdate(el);

      expect(handler).not.toHaveBeenCalled();
    });

    it('should trim text before emitting query-submit event', async () => {
      const shadow = el.shadowRoot!;
      const input = shadow.querySelector('.input-field') as HTMLInputElement;

      input.value = '  hello  ';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      await waitForUpdate(el);

      const handler = vi.fn();
      el.addEventListener('query-submit', handler);

      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      await waitForUpdate(el);

      const detail = (handler.mock.calls[0][0] as CustomEvent).detail;
      expect(detail.text).toBe('hello');
    });
  });

  describe('disabled state', () => {
    it('should ignore keyboard input when disabled', async () => {
      el.disabled = true;
      await waitForUpdate(el);

      const shadow = el.shadowRoot!;
      const input = shadow.querySelector('.input-field') as HTMLInputElement;

      const handler = vi.fn();
      el.addEventListener('query-submit', handler);

      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      await waitForUpdate(el);

      expect(handler).not.toHaveBeenCalled();
    });

    it('should show visual indicator when disabled', async () => {
      el.disabled = true;
      await waitForUpdate(el);

      const shadow = el.shadowRoot!;
      const input = shadow.querySelector('.input-field') as HTMLInputElement;
      expect(input.classList.contains('disabled')).toBe(true);
      expect(input.disabled).toBe(true);
    });

    it('should ignore text input when disabled', async () => {
      el.disabled = true;
      await waitForUpdate(el);

      const shadow = el.shadowRoot!;
      const input = shadow.querySelector('.input-field') as HTMLInputElement;

      input.value = 'test';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      await waitForUpdate(el);

      // The handler prevents updates when disabled
      expect((el as any)._value).toBe('');
    });

    it('should restore focus when disabled transitions to false', async () => {
      el.disabled = true;
      await waitForUpdate(el);

      el.disabled = false;
      await waitForUpdate(el);
      // Allow the focus restoration promise to resolve
      await new Promise((r) => setTimeout(r, 50));

      const shadow = el.shadowRoot!;
      const input = shadow.querySelector('.input-field') as HTMLInputElement;
      expect(shadow.activeElement).toBe(input);
    });
  });

  describe('accessibility', () => {
    it('should have role="textbox" on wrapper', async () => {
      const shadow = el.shadowRoot!;
      const wrapper = shadow.querySelector('.input-wrapper');
      expect(wrapper?.getAttribute('role')).toBe('textbox');
    });

    it('should have aria-label for the wrapper', async () => {
      const shadow = el.shadowRoot!;
      const wrapper = shadow.querySelector('.input-wrapper');
      expect(wrapper?.getAttribute('aria-label')).toBe('Command input');
    });

    it('should reflect aria-disabled state', async () => {
      el.disabled = true;
      await waitForUpdate(el);

      const shadow = el.shadowRoot!;
      const input = shadow.querySelector('.input-field') as HTMLInputElement;
      expect(input.getAttribute('aria-disabled')).toBe('true');
    });
  });

  describe('event properties', () => {
    it('should emit query-submit as composed and bubbling', async () => {
      const shadow = el.shadowRoot!;
      const input = shadow.querySelector('.input-field') as HTMLInputElement;

      input.value = 'test';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      await waitForUpdate(el);

      const handler = vi.fn();
      el.addEventListener('query-submit', handler);

      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      await waitForUpdate(el);

      const event = handler.mock.calls[0][0] as CustomEvent;
      expect(event.bubbles).toBe(true);
      expect(event.composed).toBe(true);
    });
  });
});
