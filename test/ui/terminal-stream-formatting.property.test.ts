import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import '../../src/ui/terminal-stream.js';
import type { TerminalStream } from '../../src/ui/terminal-stream.js';
import type { TerminalEntry } from '../../src/types/index.js';

/**
 * Property 10: Terminal Entry Type Formatting
 *
 * For any terminal entry, the displayed content SHALL follow the formatting rule
 * determined by its type: user entries are prefixed with `$ `, reasoning entries
 * are prefixed with `> ` followed by an uppercase label and ellipsis, response
 * entries have no `$` or `>` prefix, and error entries are rendered with a visually
 * distinct style (error type classification).
 *
 * **Validates: Requirements 6.1, 6.2, 6.3, 6.8**
 */
describe('Feature: sys-cli-agent, Property 10: Terminal Entry Type Formatting', () => {
  let el: TerminalStream;

  beforeEach(async () => {
    el = document.createElement('terminal-stream') as TerminalStream;
    document.body.appendChild(el);
    await el.updateComplete;
  });

  afterEach(() => {
    el.remove();
  });

  // --- Arbitraries ---

  /** Generate a random non-empty content string (printable, no leading/trailing whitespace issues) */
  const contentArb = fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0);

  /** Generate a valid entry type from the four main display types */
  const entryTypeArb = fc.constantFrom('user', 'reasoning', 'response', 'error') as fc.Arbitrary<
    'user' | 'reasoning' | 'response' | 'error'
  >;

  /** Generate a random TerminalEntry with a specific type */
  function terminalEntryArb(type: 'user' | 'reasoning' | 'response' | 'error'): fc.Arbitrary<TerminalEntry> {
    return contentArb.map((content) => ({
      id: `entry-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      type,
      content,
      timestamp: Date.now(),
    }));
  }

  /** Generate a random TerminalEntry with any of the four main types */
  const anyEntryArb: fc.Arbitrary<TerminalEntry> = entryTypeArb.chain((type) => terminalEntryArb(type));

  // --- Property Tests ---

  it('user entries should have class entry--user ($ prefix applied via CSS ::before)', async () => {
    await fc.assert(
      fc.asyncProperty(terminalEntryArb('user'), async (entry) => {
        el.entries = [entry];
        await el.updateComplete;

        const shadow = el.shadowRoot!;
        const rendered = shadow.querySelector('.entry--user');

        // User entry must be rendered with the entry--user class
        expect(rendered).not.toBeNull();
        // Must also have the base entry class
        expect(rendered!.classList.contains('entry')).toBe(true);
        expect(rendered!.classList.contains('entry--user')).toBe(true);
        // Content should be the raw text ($ prefix is CSS ::before, not in textContent)
        expect(rendered!.textContent).toBe(entry.content);
        // Must NOT have other type classes
        expect(rendered!.classList.contains('entry--reasoning')).toBe(false);
        expect(rendered!.classList.contains('entry--response')).toBe(false);
        expect(rendered!.classList.contains('entry--error')).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it('reasoning entries should have class entry--reasoning with uppercased content and ellipsis (> prefix via CSS ::before)', async () => {
    await fc.assert(
      fc.asyncProperty(terminalEntryArb('reasoning'), async (entry) => {
        el.entries = [entry];
        await el.updateComplete;

        const shadow = el.shadowRoot!;
        const rendered = shadow.querySelector('.entry--reasoning');

        // Reasoning entry must be rendered with the entry--reasoning class
        expect(rendered).not.toBeNull();
        expect(rendered!.classList.contains('entry')).toBe(true);
        expect(rendered!.classList.contains('entry--reasoning')).toBe(true);
        // Content should be uppercased with trailing ellipsis
        expect(rendered!.textContent).toBe(entry.content.toUpperCase() + '...');
        // Must NOT have other type classes
        expect(rendered!.classList.contains('entry--user')).toBe(false);
        expect(rendered!.classList.contains('entry--response')).toBe(false);
        expect(rendered!.classList.contains('entry--error')).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it('response entries should have class entry--response with no $ or > prefix', async () => {
    await fc.assert(
      fc.asyncProperty(terminalEntryArb('response'), async (entry) => {
        el.entries = [entry];
        await el.updateComplete;

        const shadow = el.shadowRoot!;
        const rendered = shadow.querySelector('.entry--response');

        // Response entry must be rendered with entry--response class
        expect(rendered).not.toBeNull();
        expect(rendered!.classList.contains('entry')).toBe(true);
        expect(rendered!.classList.contains('entry--response')).toBe(true);
        // Content is the raw text without modification
        expect(rendered!.textContent).toBe(entry.content);
        // The response class does NOT have ::before with $ or > in CSS
        // Must NOT have other type classes
        expect(rendered!.classList.contains('entry--user')).toBe(false);
        expect(rendered!.classList.contains('entry--reasoning')).toBe(false);
        expect(rendered!.classList.contains('entry--error')).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it('error entries should have class entry--error with distinct styling (error container)', async () => {
    await fc.assert(
      fc.asyncProperty(terminalEntryArb('error'), async (entry) => {
        el.entries = [entry];
        await el.updateComplete;

        const shadow = el.shadowRoot!;
        const rendered = shadow.querySelector('.entry--error');

        // Error entry must be rendered with entry--error class
        expect(rendered).not.toBeNull();
        expect(rendered!.classList.contains('entry')).toBe(true);
        expect(rendered!.classList.contains('entry--error')).toBe(true);
        // Content should be the raw error text
        expect(rendered!.textContent).toBe(entry.content);
        // Must NOT have other type classes
        expect(rendered!.classList.contains('entry--user')).toBe(false);
        expect(rendered!.classList.contains('entry--reasoning')).toBe(false);
        expect(rendered!.classList.contains('entry--response')).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it('each entry type gets its unique CSS class for type-specific formatting', async () => {
    await fc.assert(
      fc.asyncProperty(anyEntryArb, async (entry) => {
        el.entries = [entry];
        await el.updateComplete;

        const shadow = el.shadowRoot!;
        const expectedClass = `entry--${entry.type}`;
        const rendered = shadow.querySelector(`.${expectedClass}`);

        // Every entry must render with its type-specific class
        expect(rendered).not.toBeNull();
        expect(rendered!.classList.contains('entry')).toBe(true);
        expect(rendered!.classList.contains(expectedClass)).toBe(true);

        // Verify exactly one type class is present (mutual exclusivity)
        const typeClasses = ['entry--user', 'entry--reasoning', 'entry--response', 'entry--error'];
        const presentTypeClasses = typeClasses.filter((cls) => rendered!.classList.contains(cls));
        expect(presentTypeClasses).toHaveLength(1);
        expect(presentTypeClasses[0]).toBe(expectedClass);
      }),
      { numRuns: 100 }
    );
  });
});
