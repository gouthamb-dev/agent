import { describe, it, expect, beforeAll, afterEach } from 'vitest';

/**
 * Accessibility unit tests for ARIA attributes and contrast compliance.
 * Validates Requirements 10.1, 10.3, 10.4
 */

// Import Lit components to trigger custom element registration
import '../../src/ui/terminal-stream.js';
import '../../src/ui/input-bar.js';

describe('Accessibility: ARIA Attributes and Contrast Compliance', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('TerminalStream ARIA attributes (Requirement 10.1, 10.3)', () => {
    it('should have role="log" on the scrollable container', async () => {
      const el = document.createElement('terminal-stream');
      document.body.appendChild(el);
      await el.updateComplete;

      const logContainer = el.shadowRoot!.querySelector('.terminal-log');
      expect(logContainer).not.toBeNull();
      expect(logContainer!.getAttribute('role')).toBe('log');
    });

    it('should have aria-live="polite" for screen reader announcements', async () => {
      const el = document.createElement('terminal-stream');
      document.body.appendChild(el);
      await el.updateComplete;

      const logContainer = el.shadowRoot!.querySelector('.terminal-log');
      expect(logContainer).not.toBeNull();
      expect(logContainer!.getAttribute('aria-live')).toBe('polite');
    });
  });

  describe('InputBar ARIA attributes (Requirement 10.1)', () => {
    it('should have role="textbox" on the input wrapper', async () => {
      const el = document.createElement('input-bar') as any;
      document.body.appendChild(el);
      await el.updateComplete;

      const wrapper = el.shadowRoot!.querySelector('[role="textbox"]');
      expect(wrapper).not.toBeNull();
      expect(wrapper!.getAttribute('role')).toBe('textbox');
    });

    it('should have aria-label on the input wrapper', async () => {
      const el = document.createElement('input-bar') as any;
      document.body.appendChild(el);
      await el.updateComplete;

      const wrapper = el.shadowRoot!.querySelector('[role="textbox"]');
      expect(wrapper).not.toBeNull();
      expect(wrapper!.getAttribute('aria-label')).toBeTruthy();
    });

    it('should have aria-disabled="true" when disabled property is true', async () => {
      const el = document.createElement('input-bar') as any;
      el.disabled = true;
      document.body.appendChild(el);
      await el.updateComplete;

      const input = el.shadowRoot!.querySelector('input');
      expect(input).not.toBeNull();
      expect(input!.getAttribute('aria-disabled')).toBe('true');
    });

    it('should have aria-disabled="false" when disabled property is false', async () => {
      const el = document.createElement('input-bar') as any;
      el.disabled = false;
      document.body.appendChild(el);
      await el.updateComplete;

      const input = el.shadowRoot!.querySelector('input');
      expect(input).not.toBeNull();
      expect(input!.getAttribute('aria-disabled')).toBe('false');
    });
  });

  describe('Contrast Compliance (Requirement 10.4)', () => {
    /**
     * Helper to compute relative luminance from a hex color.
     * Formula per WCAG 2.1: https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
     */
    function relativeLuminance(hex: string): number {
      const r = parseInt(hex.slice(1, 3), 16) / 255;
      const g = parseInt(hex.slice(3, 5), 16) / 255;
      const b = parseInt(hex.slice(5, 7), 16) / 255;

      const linearize = (c: number) =>
        c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

      return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
    }

    /**
     * Compute contrast ratio between two colors.
     * Returns ratio >= 1.
     */
    function contrastRatio(fg: string, bg: string): number {
      const lum1 = relativeLuminance(fg);
      const lum2 = relativeLuminance(bg);
      const lighter = Math.max(lum1, lum2);
      const darker = Math.min(lum1, lum2);
      return (lighter + 0.05) / (darker + 0.05);
    }

    it('On Surface (#201B13) against Surface (#FFF8F3) meets 4.5:1 ratio', () => {
      const ratio = contrastRatio('#201B13', '#FFF8F3');
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it('On Surface Variant (#4E4539) against Surface (#FFF8F3) meets 4.5:1 ratio', () => {
      const ratio = contrastRatio('#4E4539', '#FFF8F3');
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it('On Error Container (#93000A) against Error Container (#FFDAD6) meets 4.5:1 ratio', () => {
      const ratio = contrastRatio('#93000A', '#FFDAD6');
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it('On Surface (#201B13) against Surface Container (#F8ECDF) meets 4.5:1 ratio', () => {
      const ratio = contrastRatio('#201B13', '#F8ECDF');
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it('On Surface Variant (#4E4539) against Surface Container (#F8ECDF) meets 4.5:1 ratio', () => {
      const ratio = contrastRatio('#4E4539', '#F8ECDF');
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });
  });
});
