import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import '../../src/ui/terminal-stream.js';
import type { TerminalStream } from '../../src/ui/terminal-stream.js';
import type { TerminalEntry } from '../../src/types/index.js';

/**
 * Property 11: Terminal Stream Capacity
 *
 * For any sequence of up to 200 terminal entries appended to the Terminal_Stream,
 * all entries SHALL be retained without eviction for the component lifecycle.
 *
 * **Validates: Requirements 6.5**
 */
describe('Feature: sys-cli-agent, Property 11: Terminal Stream Capacity', () => {
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

  /** Generate a valid entry type */
  const entryTypeArb = fc.constantFrom<TerminalEntry['type']>(
    'user',
    'reasoning',
    'response',
    'error',
    'processing'
  );

  /** Generate random content for an entry */
  const entryContentArb = fc.string({ minLength: 1, maxLength: 100 });

  /** Generate a single random TerminalEntry */
  const terminalEntryArb: fc.Arbitrary<TerminalEntry> = fc.record({
    id: fc.uuid(),
    type: entryTypeArb,
    content: entryContentArb,
    timestamp: fc.integer({ min: 1_000_000_000_000, max: 2_000_000_000_000 }),
  });

  /** Generate an array of 1 to 200 TerminalEntry objects */
  const entriesArrayArb = fc.integer({ min: 1, max: 200 }).chain((count) =>
    fc.array(terminalEntryArb, { minLength: count, maxLength: count })
  );

  // --- Property Tests ---

  it('all entries are retained when up to 200 entries are set on the TerminalStream', () => {
    fc.assert(
      fc.property(entriesArrayArb, (entries) => {
        // Set entries directly on the component
        el.entries = [...entries];

        // Verify all entries are retained
        expect(el.entries.length).toBe(entries.length);

        // Verify no eviction occurred - each entry matches
        for (let i = 0; i < entries.length; i++) {
          expect(el.entries[i].id).toBe(entries[i].id);
          expect(el.entries[i].type).toBe(entries[i].type);
          expect(el.entries[i].content).toBe(entries[i].content);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('all entries are retained when up to 200 entries are appended one by one via appendEntry', () => {
    fc.assert(
      fc.property(entriesArrayArb, (entries) => {
        // Reset entries before each run
        el.entries = [];

        // Append entries one by one
        for (const entry of entries) {
          el.appendEntry(entry);
        }

        // Verify all entries are retained without eviction
        expect(el.entries.length).toBe(entries.length);

        // Verify entry order and content is preserved
        for (let i = 0; i < entries.length; i++) {
          expect(el.entries[i].id).toBe(entries[i].id);
          expect(el.entries[i].type).toBe(entries[i].type);
          expect(el.entries[i].content).toBe(entries[i].content);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('no eviction occurs within the 200-entry threshold regardless of entry types', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 200 }),
        entryTypeArb,
        (count, type) => {
          // Reset entries
          el.entries = [];

          // Generate entries all of the same type to verify type doesn't affect retention
          for (let i = 0; i < count; i++) {
            el.appendEntry({
              id: `entry-${i}-${Date.now()}`,
              type,
              content: `content-${i}`,
              timestamp: Date.now() + i,
            });
          }

          // Verify count matches - no entries were evicted
          expect(el.entries.length).toBe(count);
        }
      ),
      { numRuns: 100 }
    );
  });
});
