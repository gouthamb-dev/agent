import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

/**
 * Unit tests for keyboard navigation and focus management
 * Validates: Requirements 10.2, 10.5
 *
 * Tests that:
 * - All interactive elements are Tab/Shift+Tab navigable
 * - Enter submits input
 * - Escape blurs input
 * - Visible focus indicators are present (2px outline, 3:1 contrast)
 */

// We test the component logic directly since jsdom doesn't fully support
// Shadow DOM + Lit rendering. We test the keyboard event handlers and
// CSS declarations by inspecting the component's static styles and methods.

describe('Keyboard Navigation - InputBar', () => {
  let inputBar: any;
  let mockInputEl: HTMLInputElement;

  beforeEach(async () => {
    // Dynamically import to ensure decorators are processed
    const { InputBar } = await import('../../src/ui/input-bar.js');

    // Create a mock instance to test handler logic
    inputBar = new InputBar();
    mockInputEl = document.createElement('input');
    // Override the query result
    Object.defineProperty(inputBar, '_inputEl', {
      get: () => mockInputEl,
      configurable: true,
    });
  });

  describe('Escape key handling', () => {
    it('should blur the input when Escape is pressed and not disabled', () => {
      const blurSpy = vi.spyOn(mockInputEl, 'blur');
      inputBar.disabled = false;

      const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

      // Call the handler directly
      (inputBar as any)._handleKeydown(event);

      expect(preventDefaultSpy).toHaveBeenCalled();
      expect(blurSpy).toHaveBeenCalled();
    });

    it('should not blur when Escape is pressed while disabled', () => {
      const blurSpy = vi.spyOn(mockInputEl, 'blur');
      inputBar.disabled = true;

      const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });

      (inputBar as any)._handleKeydown(event);

      // When disabled, the handler prevents default and returns early
      expect(blurSpy).not.toHaveBeenCalled();
    });
  });

  describe('Enter key handling', () => {
    it('should call _submit when Enter is pressed and not disabled', () => {
      inputBar.disabled = false;
      const submitSpy = vi.spyOn(inputBar as any, '_submit');

      const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

      (inputBar as any)._handleKeydown(event);

      expect(preventDefaultSpy).toHaveBeenCalled();
      expect(submitSpy).toHaveBeenCalled();
    });

    it('should ignore Enter when disabled', () => {
      inputBar.disabled = true;
      const submitSpy = vi.spyOn(inputBar as any, '_submit');

      const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });

      (inputBar as any)._handleKeydown(event);

      expect(submitSpy).not.toHaveBeenCalled();
    });
  });

  describe('Tab navigation', () => {
    it('should not prevent default for Tab key (allow natural Tab order)', () => {
      inputBar.disabled = false;

      const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true });
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

      (inputBar as any)._handleKeydown(event);

      expect(preventDefaultSpy).not.toHaveBeenCalled();
    });

    it('should not prevent default for Shift+Tab key', () => {
      inputBar.disabled = false;

      const event = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true });
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

      (inputBar as any)._handleKeydown(event);

      expect(preventDefaultSpy).not.toHaveBeenCalled();
    });
  });

  describe('Focus indicator CSS', () => {
    it('should have a focus-within style with 2px solid outline using accent color', async () => {
      const { InputBar } = await import('../../src/ui/input-bar.js');
      const styles = InputBar.styles;

      // Convert CSSResult array to string for inspection
      const cssText = styles.map((s: any) => s.cssText || s.toString()).join('\n');

      // Verify focus-within style is present with 2px solid outline
      expect(cssText).toContain('focus-within');
      expect(cssText).toContain('2px solid var(--sys-accent)');
    });
  });
});

describe('Keyboard Navigation - TerminalStream', () => {
  describe('Tab focusability', () => {
    it('should include tabindex="0" on the scrollable container', async () => {
      const { TerminalStream } = await import('../../src/ui/terminal-stream.js');
      const stream = new TerminalStream();

      // Check render output by calling render directly
      const renderResult = (stream as any).render();

      // The template should contain tabindex="0"
      // We verify by checking the strings in the template
      const templateStrings = renderResult.strings || renderResult._$litType$?.h?.join('') || '';
      const fullTemplate = Array.isArray(templateStrings)
        ? templateStrings.join('')
        : String(templateStrings);

      expect(fullTemplate).toContain('tabindex="0"');
    });

    it('should include aria-label on the scrollable container', async () => {
      const { TerminalStream } = await import('../../src/ui/terminal-stream.js');
      const stream = new TerminalStream();

      const renderResult = (stream as any).render();
      const templateStrings = renderResult.strings || renderResult._$litType$?.h?.join('') || '';
      const fullTemplate = Array.isArray(templateStrings)
        ? templateStrings.join('')
        : String(templateStrings);

      expect(fullTemplate).toContain('aria-label="Terminal output"');
    });
  });

  describe('Focus indicator CSS', () => {
    it('should have a focus style with 2px solid outline using accent color', async () => {
      const { TerminalStream } = await import('../../src/ui/terminal-stream.js');
      const styles = TerminalStream.styles;

      const cssText = styles.map((s: any) => s.cssText || s.toString()).join('\n');

      expect(cssText).toContain('.terminal-log:focus');
      expect(cssText).toContain('2px solid var(--sys-accent)');
    });
  });
});

describe('Keyboard Navigation - HeaderBar', () => {
  describe('Decorative elements', () => {
    it('should mark dots as aria-hidden (not tab navigable)', async () => {
      const { HeaderBar } = await import('../../src/ui/header-bar.js');
      const header = new HeaderBar();

      const renderResult = (header as any).render();
      const templateStrings = renderResult.strings || renderResult._$litType$?.h?.join('') || '';
      const fullTemplate = Array.isArray(templateStrings)
        ? templateStrings.join('')
        : String(templateStrings);

      // Dots container should be aria-hidden="true" so it's not in Tab order
      expect(fullTemplate).toContain('aria-hidden="true"');
    });
  });
});

describe('Focus Indicator Contrast', () => {
  it('focus indicator uses --sys-accent (#7C580D) which provides 3:1 contrast against #FFF8F3 background', () => {
    // Per the design system:
    // --sys-accent = #7C580D (primary color)
    // --sys-bg = #FFF8F3 (surface color)
    //
    // Contrast ratio calculation:
    // Relative luminance of #7C580D ≈ 0.093
    // Relative luminance of #FFF8F3 ≈ 0.946
    // Contrast ratio = (0.946 + 0.05) / (0.093 + 0.05) ≈ 6.96:1
    // This exceeds the 3:1 minimum for focus indicators (WCAG 2.2 SC 2.4.7)

    const accentHex = '#7C580D';
    const bgHex = '#FFF8F3';

    const relativeLuminance = (hex: string): number => {
      const r = parseInt(hex.slice(1, 3), 16) / 255;
      const g = parseInt(hex.slice(3, 5), 16) / 255;
      const b = parseInt(hex.slice(5, 7), 16) / 255;

      const srgb = [r, g, b].map(c =>
        c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
      );

      return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
    };

    const l1 = relativeLuminance(bgHex);
    const l2 = relativeLuminance(accentHex);
    const contrastRatio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);

    // Must be at least 3:1 for focus indicators
    expect(contrastRatio).toBeGreaterThanOrEqual(3);
  });
});
