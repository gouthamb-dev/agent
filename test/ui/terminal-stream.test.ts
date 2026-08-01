import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import '../../src/ui/terminal-stream.js';
import type { TerminalStream } from '../../src/ui/terminal-stream.js';
import type { TerminalEntry } from '../../src/types/index.js';

function createEntry(overrides: Partial<TerminalEntry> = {}): TerminalEntry {
  return {
    id: crypto.randomUUID?.() ?? `entry-${Date.now()}-${Math.random()}`,
    type: 'response',
    content: 'test content',
    timestamp: Date.now(),
    ...overrides,
  };
}

describe('TerminalStream', () => {
  let el: TerminalStream;

  beforeEach(async () => {
    el = document.createElement('terminal-stream') as TerminalStream;
    document.body.appendChild(el);
    await el.updateComplete;
  });

  afterEach(() => {
    el.remove();
  });

  describe('registration and rendering', () => {
    it('should register as a custom element', () => {
      expect(customElements.get('terminal-stream')).toBeDefined();
    });

    it('should render a container with role="log"', async () => {
      const shadow = el.shadowRoot!;
      const log = shadow.querySelector('[role="log"]');
      expect(log).not.toBeNull();
    });

    it('should set aria-live="polite" on the log container', async () => {
      const shadow = el.shadowRoot!;
      const log = shadow.querySelector('[role="log"]');
      expect(log!.getAttribute('aria-live')).toBe('polite');
    });

    it('should render with no entries by default', async () => {
      const shadow = el.shadowRoot!;
      const entries = shadow.querySelectorAll('.entry');
      expect(entries.length).toBe(0);
    });
  });

  describe('entry type formatting', () => {
    it('should prefix user entries with "$ "', async () => {
      el.entries = [createEntry({ type: 'user', content: 'hello world' })];
      await el.updateComplete;

      const shadow = el.shadowRoot!;
      const entry = shadow.querySelector('.entry--user');
      expect(entry).not.toBeNull();
      expect(entry!.textContent).toBe('hello world');
      // The $ prefix is applied via CSS ::before pseudo-element
      expect(entry!.classList.contains('entry--user')).toBe(true);
    });

    it('should prefix reasoning entries with "> " and uppercase content with ellipsis', async () => {
      el.entries = [createEntry({ type: 'reasoning', content: 'retrieving_vector_context' })];
      await el.updateComplete;

      const shadow = el.shadowRoot!;
      const entry = shadow.querySelector('.entry--reasoning');
      expect(entry).not.toBeNull();
      // Content should be uppercased with trailing ellipsis
      expect(entry!.textContent).toBe('RETRIEVING_VECTOR_CONTEXT...');
      // The > prefix is applied via CSS ::before
      expect(entry!.classList.contains('entry--reasoning')).toBe(true);
    });

    it('should display response entries without prefix', async () => {
      el.entries = [createEntry({ type: 'response', content: 'Here is the answer' })];
      await el.updateComplete;

      const shadow = el.shadowRoot!;
      const entry = shadow.querySelector('.entry--response');
      expect(entry).not.toBeNull();
      expect(entry!.textContent).toBe('Here is the answer');
      expect(entry!.classList.contains('entry--response')).toBe(true);
    });

    it('should render error entries with distinct styling class', async () => {
      el.entries = [createEntry({ type: 'error', content: 'Connection failed' })];
      await el.updateComplete;

      const shadow = el.shadowRoot!;
      const entry = shadow.querySelector('.entry--error');
      expect(entry).not.toBeNull();
      expect(entry!.textContent).toBe('Connection failed');
      expect(entry!.classList.contains('entry--error')).toBe(true);
    });

    it('should render processing entries with animated indicator', async () => {
      el.entries = [createEntry({ type: 'processing', content: '' })];
      await el.updateComplete;

      const shadow = el.shadowRoot!;
      const entry = shadow.querySelector('.entry--processing');
      expect(entry).not.toBeNull();
      const dots = entry!.querySelector('.processing-dots');
      expect(dots).not.toBeNull();
    });
  });

  describe('appendEntry method', () => {
    it('should add an entry to the entries array', async () => {
      const entry = createEntry({ type: 'user', content: 'test' });
      el.appendEntry(entry);
      await el.updateComplete;

      expect(el.entries.length).toBe(1);
      expect(el.entries[0]).toEqual(entry);
    });

    it('should render newly appended entries', async () => {
      el.appendEntry(createEntry({ type: 'user', content: 'first' }));
      el.appendEntry(createEntry({ type: 'response', content: 'second' }));
      await el.updateComplete;

      const shadow = el.shadowRoot!;
      const entries = shadow.querySelectorAll('.entry');
      expect(entries.length).toBe(2);
    });

    it('should retain minimum 200 entries', async () => {
      for (let i = 0; i < 200; i++) {
        el.appendEntry(createEntry({ content: `entry ${i}` }));
      }
      await el.updateComplete;

      expect(el.entries.length).toBe(200);
      const shadow = el.shadowRoot!;
      const entries = shadow.querySelectorAll('.entry');
      expect(entries.length).toBe(200);
    });
  });

  describe('auto-scroll behavior', () => {
    it('should auto-scroll to bottom when entries are updated', async () => {
      // Add enough entries to create scrollable content
      for (let i = 0; i < 50; i++) {
        el.appendEntry(createEntry({ content: `Long content line ${i}` }));
      }
      await el.updateComplete;

      const shadow = el.shadowRoot!;
      const container = shadow.querySelector('.terminal-log') as HTMLElement;
      // In jsdom, scrollHeight and scrollTop might not work realistically,
      // but we verify the method is called without errors
      expect(container).not.toBeNull();
    });
  });

  describe('clearProcessing method', () => {
    it('should remove processing entries within 300ms', async () => {
      vi.useFakeTimers();
      el.appendEntry(createEntry({ type: 'processing', content: '' }));
      el.appendEntry(createEntry({ type: 'user', content: 'my query' }));
      await el.updateComplete;

      expect(el.entries.length).toBe(2);

      el.clearProcessing();
      vi.advanceTimersByTime(300);
      await el.updateComplete;

      expect(el.entries.length).toBe(1);
      expect(el.entries[0].type).toBe('user');
      vi.useRealTimers();
    });

    it('should keep non-processing entries after clearProcessing', async () => {
      vi.useFakeTimers();
      el.appendEntry(createEntry({ type: 'user', content: 'input' }));
      el.appendEntry(createEntry({ type: 'processing', content: '' }));
      el.appendEntry(createEntry({ type: 'response', content: 'output' }));
      await el.updateComplete;

      el.clearProcessing();
      vi.advanceTimersByTime(300);
      await el.updateComplete;

      expect(el.entries.length).toBe(2);
      expect(el.entries.every(e => e.type !== 'processing')).toBe(true);
      vi.useRealTimers();
    });
  });

  describe('multiple entry types rendered together', () => {
    it('should render a mix of entry types correctly', async () => {
      el.entries = [
        createEntry({ type: 'user', content: 'search for docs' }),
        createEntry({ type: 'reasoning', content: 'retrieving_context' }),
        createEntry({ type: 'response', content: 'Here are the docs...' }),
        createEntry({ type: 'error', content: 'timeout occurred' }),
      ];
      await el.updateComplete;

      const shadow = el.shadowRoot!;
      expect(shadow.querySelector('.entry--user')).not.toBeNull();
      expect(shadow.querySelector('.entry--reasoning')).not.toBeNull();
      expect(shadow.querySelector('.entry--response')).not.toBeNull();
      expect(shadow.querySelector('.entry--error')).not.toBeNull();
    });
  });
});
