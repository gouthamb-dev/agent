import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import { PostMessageBridge } from '../../src/bridge/post-message-bridge';
import type { MessageType } from '../../src/bridge/post-message-bridge';

/**
 * Property 18: PostMessage Structure and Dispatch
 *
 * For any message sent via the PostMessageBridge, the dispatched postMessage SHALL include
 * a `type` field (one of 'state-change', 'user-interaction', 'config-update'), a `payload`
 * field, and a `source` field set to 'sys-cli-agent', targeting the configured origin.
 *
 * **Validates: Requirements 9.3**
 */
describe('Feature: sys-cli-agent, Property 18: PostMessage Structure and Dispatch', () => {
  let postMessageSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    postMessageSpy = vi.spyOn(window, 'postMessage');
  });

  afterEach(() => {
    postMessageSpy.mockRestore();
  });

  // --- Arbitraries ---

  /** Generate a random message type from the valid set */
  const messageTypeArb: fc.Arbitrary<MessageType> = fc.constantFrom(
    'state-change',
    'user-interaction',
    'config-update'
  );

  /** Generate random payloads: objects, strings, numbers, arrays, null */
  const payloadArb: fc.Arbitrary<unknown> = fc.oneof(
    fc.dictionary(fc.string({ minLength: 1, maxLength: 10 }), fc.jsonValue()),
    fc.string(),
    fc.double({ noNaN: true }),
    fc.integer(),
    fc.array(fc.jsonValue(), { maxLength: 5 }),
    fc.constant(null)
  );

  /** Generate random target origins (URLs or '*') */
  const targetOriginArb: fc.Arbitrary<string> = fc.oneof(
    fc.constant('*'),
    fc.webUrl().map((url) => new URL(url).origin)
  );

  it('dispatched message has correct type field matching input type', () => {
    fc.assert(
      fc.property(
        messageTypeArb,
        payloadArb,
        targetOriginArb,
        (type, payload, targetOrigin) => {
          postMessageSpy.mockClear();

          const bridge = new PostMessageBridge({ targetOrigin });
          bridge.send(type, payload);

          expect(postMessageSpy).toHaveBeenCalledTimes(1);
          const [message] = postMessageSpy.mock.calls[0];
          expect(message.type).toBe(type);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('dispatched message has payload field matching input payload', () => {
    fc.assert(
      fc.property(
        messageTypeArb,
        payloadArb,
        targetOriginArb,
        (type, payload, targetOrigin) => {
          postMessageSpy.mockClear();

          const bridge = new PostMessageBridge({ targetOrigin });
          bridge.send(type, payload);

          expect(postMessageSpy).toHaveBeenCalledTimes(1);
          const [message] = postMessageSpy.mock.calls[0];
          expect(message.payload).toEqual(payload);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('dispatched message has source field set to "sys-cli-agent"', () => {
    fc.assert(
      fc.property(
        messageTypeArb,
        payloadArb,
        targetOriginArb,
        (type, payload, targetOrigin) => {
          postMessageSpy.mockClear();

          const bridge = new PostMessageBridge({ targetOrigin });
          bridge.send(type, payload);

          expect(postMessageSpy).toHaveBeenCalledTimes(1);
          const [message] = postMessageSpy.mock.calls[0];
          expect(message.source).toBe('sys-cli-agent');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('dispatched message has a timestamp field that is a number', () => {
    fc.assert(
      fc.property(
        messageTypeArb,
        payloadArb,
        targetOriginArb,
        (type, payload, targetOrigin) => {
          postMessageSpy.mockClear();

          const bridge = new PostMessageBridge({ targetOrigin });
          bridge.send(type, payload);

          expect(postMessageSpy).toHaveBeenCalledTimes(1);
          const [message] = postMessageSpy.mock.calls[0];
          expect(typeof message.timestamp).toBe('number');
          expect(Number.isFinite(message.timestamp)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('dispatched message targets the configured origin', () => {
    fc.assert(
      fc.property(
        messageTypeArb,
        payloadArb,
        targetOriginArb,
        (type, payload, targetOrigin) => {
          postMessageSpy.mockClear();

          const bridge = new PostMessageBridge({ targetOrigin });
          bridge.send(type, payload);

          expect(postMessageSpy).toHaveBeenCalledTimes(1);
          const [, dispatchedOrigin] = postMessageSpy.mock.calls[0];
          expect(dispatchedOrigin).toBe(targetOrigin);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('all structural invariants hold together for any valid input combination', () => {
    fc.assert(
      fc.property(
        messageTypeArb,
        payloadArb,
        targetOriginArb,
        (type, payload, targetOrigin) => {
          postMessageSpy.mockClear();

          const bridge = new PostMessageBridge({ targetOrigin });
          bridge.send(type, payload);

          expect(postMessageSpy).toHaveBeenCalledTimes(1);
          const [message, dispatchedOrigin] = postMessageSpy.mock.calls[0];

          // All structural invariants from Property 18
          expect(message.type).toBe(type);
          expect(message.payload).toEqual(payload);
          expect(message.source).toBe('sys-cli-agent');
          expect(typeof message.timestamp).toBe('number');
          expect(Number.isFinite(message.timestamp)).toBe(true);
          expect(dispatchedOrigin).toBe(targetOrigin);
        }
      ),
      { numRuns: 100 }
    );
  });
});
