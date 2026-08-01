import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PostMessageBridge } from '../../src/bridge/post-message-bridge';
import type { BridgeMessage, MessageType } from '../../src/bridge/post-message-bridge';

describe('PostMessageBridge', () => {
  let bridge: PostMessageBridge;

  beforeEach(() => {
    bridge = new PostMessageBridge();
  });

  afterEach(() => {
    bridge.disconnect();
  });

  describe('constructor', () => {
    it('should use default config when no config provided', () => {
      const config = bridge.getConfig();
      expect(config.targetOrigin).toBe('*');
      expect(config.allowedOrigins).toEqual(['*']);
    });

    it('should accept custom target origin', () => {
      const customBridge = new PostMessageBridge({ targetOrigin: 'https://example.com' });
      expect(customBridge.getConfig().targetOrigin).toBe('https://example.com');
    });

    it('should accept custom allowed origins', () => {
      const customBridge = new PostMessageBridge({
        allowedOrigins: ['https://trusted.com', 'https://other.com'],
      });
      expect(customBridge.getConfig().allowedOrigins).toEqual([
        'https://trusted.com',
        'https://other.com',
      ]);
    });
  });

  describe('send()', () => {
    it('should dispatch a postMessage with correct structure', () => {
      const postMessageSpy = vi.spyOn(window, 'postMessage');

      bridge.send('state-change', { status: 'connected' });

      expect(postMessageSpy).toHaveBeenCalledTimes(1);
      const [message, origin] = postMessageSpy.mock.calls[0];

      expect(message.type).toBe('state-change');
      expect(message.payload).toEqual({ status: 'connected' });
      expect(message.source).toBe('sys-cli-agent');
      expect(typeof message.timestamp).toBe('number');
      expect(origin).toBe('*');

      postMessageSpy.mockRestore();
    });

    it('should use configured target origin', () => {
      const customBridge = new PostMessageBridge({ targetOrigin: 'https://app.example.com' });
      const postMessageSpy = vi.spyOn(window, 'postMessage');

      customBridge.send('user-interaction', { action: 'click' });

      const [, origin] = postMessageSpy.mock.calls[0];
      expect(origin).toBe('https://app.example.com');

      postMessageSpy.mockRestore();
    });

    it('should support all message types', () => {
      const postMessageSpy = vi.spyOn(window, 'postMessage');

      const types: MessageType[] = ['state-change', 'user-interaction', 'config-update'];
      for (const type of types) {
        bridge.send(type, { data: type });
      }

      expect(postMessageSpy).toHaveBeenCalledTimes(3);
      expect(postMessageSpy.mock.calls[0][0].type).toBe('state-change');
      expect(postMessageSpy.mock.calls[1][0].type).toBe('user-interaction');
      expect(postMessageSpy.mock.calls[2][0].type).toBe('config-update');

      postMessageSpy.mockRestore();
    });

    it('should include a timestamp in outbound messages', () => {
      const postMessageSpy = vi.spyOn(window, 'postMessage');
      const before = Date.now();

      bridge.send('state-change', null);

      const after = Date.now();
      const message = postMessageSpy.mock.calls[0][0];
      expect(message.timestamp).toBeGreaterThanOrEqual(before);
      expect(message.timestamp).toBeLessThanOrEqual(after);

      postMessageSpy.mockRestore();
    });
  });

  describe('onMessage()', () => {
    it('should register a handler that receives valid messages', () => {
      const handler = vi.fn();
      bridge.onMessage(handler);
      bridge.connect();

      const message: BridgeMessage = {
        type: 'state-change',
        payload: { status: 'ready' },
        source: 'sys-cli-agent',
        timestamp: Date.now(),
      };

      window.dispatchEvent(new MessageEvent('message', {
        data: message,
        origin: 'https://any-origin.com',
      }));

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(message);
    });

    it('should support multiple handlers', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      bridge.onMessage(handler1);
      bridge.onMessage(handler2);
      bridge.connect();

      const message: BridgeMessage = {
        type: 'config-update',
        payload: { theme: 'dark' },
        source: 'sys-cli-agent',
        timestamp: Date.now(),
      };

      window.dispatchEvent(new MessageEvent('message', {
        data: message,
        origin: 'https://parent.com',
      }));

      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
    });
  });

  describe('connect()', () => {
    it('should start listening for messages', () => {
      const handler = vi.fn();
      bridge.onMessage(handler);

      // Before connect, messages should not be received
      window.dispatchEvent(new MessageEvent('message', {
        data: { type: 'state-change', payload: null, source: 'sys-cli-agent', timestamp: Date.now() },
        origin: 'https://test.com',
      }));
      expect(handler).not.toHaveBeenCalled();

      bridge.connect();

      window.dispatchEvent(new MessageEvent('message', {
        data: { type: 'state-change', payload: null, source: 'sys-cli-agent', timestamp: Date.now() },
        origin: 'https://test.com',
      }));
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should be idempotent (calling connect twice does not double-register)', () => {
      const handler = vi.fn();
      bridge.onMessage(handler);
      bridge.connect();
      bridge.connect(); // second call should be no-op

      window.dispatchEvent(new MessageEvent('message', {
        data: { type: 'state-change', payload: null, source: 'sys-cli-agent', timestamp: Date.now() },
        origin: 'https://test.com',
      }));

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should set isConnected to true', () => {
      expect(bridge.isConnected).toBe(false);
      bridge.connect();
      expect(bridge.isConnected).toBe(true);
    });
  });

  describe('disconnect()', () => {
    it('should stop listening for messages', () => {
      const handler = vi.fn();
      bridge.onMessage(handler);
      bridge.connect();

      bridge.disconnect();

      window.dispatchEvent(new MessageEvent('message', {
        data: { type: 'state-change', payload: null, source: 'sys-cli-agent', timestamp: Date.now() },
        origin: 'https://test.com',
      }));

      expect(handler).not.toHaveBeenCalled();
    });

    it('should set isConnected to false', () => {
      bridge.connect();
      expect(bridge.isConnected).toBe(true);
      bridge.disconnect();
      expect(bridge.isConnected).toBe(false);
    });

    it('should be safe to call when not connected', () => {
      expect(() => bridge.disconnect()).not.toThrow();
    });
  });

  describe('origin validation', () => {
    it('should accept messages from any origin when allowlist is ["*"]', () => {
      const handler = vi.fn();
      bridge.onMessage(handler);
      bridge.connect();

      window.dispatchEvent(new MessageEvent('message', {
        data: { type: 'state-change', payload: null, source: 'sys-cli-agent', timestamp: Date.now() },
        origin: 'https://random-origin.io',
      }));

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should discard messages from untrusted origins', () => {
      const restrictedBridge = new PostMessageBridge({
        allowedOrigins: ['https://trusted.com'],
      });
      const handler = vi.fn();
      restrictedBridge.onMessage(handler);
      restrictedBridge.connect();

      window.dispatchEvent(new MessageEvent('message', {
        data: { type: 'state-change', payload: null, source: 'sys-cli-agent', timestamp: Date.now() },
        origin: 'https://untrusted.com',
      }));

      expect(handler).not.toHaveBeenCalled();
      restrictedBridge.disconnect();
    });

    it('should accept messages from a trusted origin in the allowlist', () => {
      const restrictedBridge = new PostMessageBridge({
        allowedOrigins: ['https://trusted.com', 'https://also-trusted.com'],
      });
      const handler = vi.fn();
      restrictedBridge.onMessage(handler);
      restrictedBridge.connect();

      window.dispatchEvent(new MessageEvent('message', {
        data: { type: 'state-change', payload: null, source: 'sys-cli-agent', timestamp: Date.now() },
        origin: 'https://also-trusted.com',
      }));

      expect(handler).toHaveBeenCalledTimes(1);
      restrictedBridge.disconnect();
    });

    it('should silently discard without leaking information (no errors, no events)', () => {
      const restrictedBridge = new PostMessageBridge({
        allowedOrigins: ['https://trusted.com'],
      });
      const handler = vi.fn();
      const errorSpy = vi.spyOn(console, 'error');
      const warnSpy = vi.spyOn(console, 'warn');
      restrictedBridge.onMessage(handler);
      restrictedBridge.connect();

      // Send multiple messages from untrusted origins
      window.dispatchEvent(new MessageEvent('message', {
        data: { type: 'state-change', payload: { secret: 'data' }, source: 'sys-cli-agent', timestamp: Date.now() },
        origin: 'https://malicious.com',
      }));
      window.dispatchEvent(new MessageEvent('message', {
        data: { type: 'config-update', payload: null, source: 'sys-cli-agent', timestamp: Date.now() },
        origin: 'http://attacker.io',
      }));

      // No handler called, no console output (no information leakage)
      expect(handler).not.toHaveBeenCalled();
      expect(errorSpy).not.toHaveBeenCalled();
      expect(warnSpy).not.toHaveBeenCalled();

      errorSpy.mockRestore();
      warnSpy.mockRestore();
      restrictedBridge.disconnect();
    });

    it('should validate origin with exact string matching (no partial matches)', () => {
      const restrictedBridge = new PostMessageBridge({
        allowedOrigins: ['https://trusted.com'],
      });
      const handler = vi.fn();
      restrictedBridge.onMessage(handler);
      restrictedBridge.connect();

      // Partial match should NOT be accepted
      window.dispatchEvent(new MessageEvent('message', {
        data: { type: 'state-change', payload: null, source: 'sys-cli-agent', timestamp: Date.now() },
        origin: 'https://trusted.com.evil.com',
      }));

      // Subdomain should NOT match
      window.dispatchEvent(new MessageEvent('message', {
        data: { type: 'state-change', payload: null, source: 'sys-cli-agent', timestamp: Date.now() },
        origin: 'https://sub.trusted.com',
      }));

      expect(handler).not.toHaveBeenCalled();
      restrictedBridge.disconnect();
    });
  });

  describe('message structure validation', () => {
    it('should discard messages without valid type', () => {
      const handler = vi.fn();
      bridge.onMessage(handler);
      bridge.connect();

      window.dispatchEvent(new MessageEvent('message', {
        data: { type: 'invalid-type', payload: null, source: 'sys-cli-agent', timestamp: Date.now() },
        origin: 'https://test.com',
      }));

      expect(handler).not.toHaveBeenCalled();
    });

    it('should discard messages without source "sys-cli-agent"', () => {
      const handler = vi.fn();
      bridge.onMessage(handler);
      bridge.connect();

      window.dispatchEvent(new MessageEvent('message', {
        data: { type: 'state-change', payload: null, source: 'other-app', timestamp: Date.now() },
        origin: 'https://test.com',
      }));

      expect(handler).not.toHaveBeenCalled();
    });

    it('should discard non-object messages', () => {
      const handler = vi.fn();
      bridge.onMessage(handler);
      bridge.connect();

      window.dispatchEvent(new MessageEvent('message', {
        data: 'just a string',
        origin: 'https://test.com',
      }));

      expect(handler).not.toHaveBeenCalled();
    });

    it('should discard messages without timestamp', () => {
      const handler = vi.fn();
      bridge.onMessage(handler);
      bridge.connect();

      window.dispatchEvent(new MessageEvent('message', {
        data: { type: 'state-change', payload: null, source: 'sys-cli-agent' },
        origin: 'https://test.com',
      }));

      expect(handler).not.toHaveBeenCalled();
    });

    it('should not break if a handler throws an error', () => {
      const badHandler = vi.fn(() => { throw new Error('handler error'); });
      const goodHandler = vi.fn();
      bridge.onMessage(badHandler);
      bridge.onMessage(goodHandler);
      bridge.connect();

      window.dispatchEvent(new MessageEvent('message', {
        data: { type: 'state-change', payload: null, source: 'sys-cli-agent', timestamp: Date.now() },
        origin: 'https://test.com',
      }));

      expect(badHandler).toHaveBeenCalledTimes(1);
      expect(goodHandler).toHaveBeenCalledTimes(1);
    });
  });
});
