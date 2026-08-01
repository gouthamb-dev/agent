import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SysCLIAgentElement } from '../../src/sys-cli-agent.element.js';

// Mock child component imports to avoid registration conflicts in test env
vi.mock('../../src/ui/header-bar.js', () => ({}));
vi.mock('../../src/ui/terminal-stream.js', () => ({}));
vi.mock('../../src/ui/input-bar.js', () => ({}));

describe('SysCLIAgentElement - Endpoint URL Validation', () => {
  let element: SysCLIAgentElement;

  beforeEach(() => {
    element = new SysCLIAgentElement();
  });

  describe('validateEndpoint()', () => {
    it('should reject empty string', () => {
      const result = element.validateEndpoint('');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('required');
    });

    it('should reject whitespace-only string', () => {
      const result = element.validateEndpoint('   ');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('required');
    });

    it('should reject URL exceeding 2048 characters', () => {
      const longUrl = 'https://example.com/' + 'a'.repeat(2040);
      expect(longUrl.length).toBeGreaterThan(2048);
      const result = element.validateEndpoint(longUrl);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('2048');
    });

    it('should accept URL at exactly 2048 characters', () => {
      const baseUrl = 'https://example.com/';
      const padding = 'a'.repeat(2048 - baseUrl.length);
      const url = baseUrl + padding;
      expect(url.length).toBe(2048);
      const result = element.validateEndpoint(url);
      expect(result.valid).toBe(true);
    });

    it('should reject invalid URL format', () => {
      const result = element.validateEndpoint('not-a-url');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('not a valid URL');
    });

    it('should reject ftp:// protocol', () => {
      const result = element.validateEndpoint('ftp://example.com/api');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('http or https');
    });

    it('should reject ws:// protocol', () => {
      const result = element.validateEndpoint('ws://example.com/ws');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('http or https');
    });

    it('should accept valid http:// URL', () => {
      const result = element.validateEndpoint('http://localhost:3000/api');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept valid https:// URL', () => {
      const result = element.validateEndpoint('https://api.example.com/v1/chat');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept https URL with port', () => {
      const result = element.validateEndpoint('https://example.com:8080/api');
      expect(result.valid).toBe(true);
    });

    it('should accept https URL with path and query params', () => {
      const result = element.validateEndpoint('https://example.com/api?key=value');
      expect(result.valid).toBe(true);
    });
  });

  describe('validateKbPath()', () => {
    it('should accept empty string (optional attribute)', () => {
      const result = element.validateKbPath('');
      expect(result.valid).toBe(true);
    });

    it('should accept valid path under 512 chars', () => {
      const result = element.validateKbPath('/home/user/docs');
      expect(result.valid).toBe(true);
    });

    it('should accept path at exactly 512 characters', () => {
      const path = '/docs/' + 'a'.repeat(506);
      expect(path.length).toBe(512);
      const result = element.validateKbPath(path);
      expect(result.valid).toBe(true);
    });

    it('should reject path exceeding 512 characters', () => {
      const path = '/docs/' + 'a'.repeat(510);
      expect(path.length).toBeGreaterThan(512);
      const result = element.validateKbPath(path);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('512');
    });
  });

  describe('agent-error event emission on invalid endpoint', () => {
    it('should emit agent-error when endpoint is set to empty string after initialization', async () => {
      const errors: CustomEvent[] = [];
      element.addEventListener('agent-error', ((e: CustomEvent) => {
        errors.push(e);
      }) as EventListener);

      // Simulate the updated() lifecycle by calling it directly
      element.endpoint = '';
      // Call the internal handler directly since we can't easily trigger Lit lifecycle in unit tests
      (element as any)._onEndpointChanged();

      expect(errors.length).toBe(1);
      expect(errors[0].detail.message).toContain('required');
      expect(errors[0].detail.attribute).toBe('endpoint');
    });

    it('should emit agent-error when endpoint is an invalid URL', () => {
      const errors: CustomEvent[] = [];
      element.addEventListener('agent-error', ((e: CustomEvent) => {
        errors.push(e);
      }) as EventListener);

      element.endpoint = 'not-a-valid-url';
      (element as any)._onEndpointChanged();

      expect(errors.length).toBe(1);
      expect(errors[0].detail.message).toContain('not a valid URL');
    });

    it('should emit agent-error when endpoint uses wrong protocol', () => {
      const errors: CustomEvent[] = [];
      element.addEventListener('agent-error', ((e: CustomEvent) => {
        errors.push(e);
      }) as EventListener);

      element.endpoint = 'ftp://example.com/api';
      (element as any)._onEndpointChanged();

      expect(errors.length).toBe(1);
      expect(errors[0].detail.message).toContain('http or https');
    });

    it('should NOT emit agent-error for valid endpoint', () => {
      const errors: CustomEvent[] = [];
      element.addEventListener('agent-error', ((e: CustomEvent) => {
        errors.push(e);
      }) as EventListener);

      element.endpoint = 'https://api.example.com/v1';
      (element as any)._onEndpointChanged();

      expect(errors.length).toBe(0);
    });

    it('should set validatedEndpoint on valid URL', () => {
      element.endpoint = 'https://api.example.com/v1';
      (element as any)._onEndpointChanged();

      expect(element.validatedEndpoint).toBe('https://api.example.com/v1');
    });

    it('should clear validatedEndpoint on invalid URL', () => {
      // First set a valid one
      element.endpoint = 'https://api.example.com/v1';
      (element as any)._onEndpointChanged();
      expect(element.validatedEndpoint).toBe('https://api.example.com/v1');

      // Now set an invalid one
      element.endpoint = 'bad-url';
      (element as any)._onEndpointChanged();
      expect(element.validatedEndpoint).toBe('');
    });

    it('should set connectionStatus to error on invalid endpoint', () => {
      element.endpoint = 'not-valid';
      (element as any)._onEndpointChanged();

      expect((element as any)._connectionStatus).toBe('error');
    });

    it('should NOT attempt connection on invalid endpoint (no status change to connecting)', () => {
      element.endpoint = 'invalid';
      (element as any)._onEndpointChanged();

      // Status should be 'error', never 'connecting'
      expect((element as any)._connectionStatus).not.toBe('connecting');
    });
  });

  describe('agent-error event emission on invalid kb-path', () => {
    it('should emit agent-error when kb-path exceeds 512 chars', () => {
      const errors: CustomEvent[] = [];
      element.addEventListener('agent-error', ((e: CustomEvent) => {
        errors.push(e);
      }) as EventListener);

      element.kbPath = '/docs/' + 'a'.repeat(510);
      (element as any)._onKbPathChanged();

      expect(errors.length).toBe(1);
      expect(errors[0].detail.message).toContain('512');
      expect(errors[0].detail.attribute).toBe('kb-path');
    });

    it('should NOT emit agent-error for valid kb-path', () => {
      const errors: CustomEvent[] = [];
      element.addEventListener('agent-error', ((e: CustomEvent) => {
        errors.push(e);
      }) as EventListener);

      element.kbPath = '/home/user/knowledge-base';
      (element as any)._onKbPathChanged();

      expect(errors.length).toBe(0);
    });

    it('should set validatedKbPath on valid path', () => {
      element.kbPath = '/home/user/docs';
      (element as any)._onKbPathChanged();

      expect(element.validatedKbPath).toBe('/home/user/docs');
    });

    it('should clear validatedKbPath on invalid path', () => {
      element.kbPath = '/docs/' + 'a'.repeat(510);
      (element as any)._onKbPathChanged();

      expect(element.validatedKbPath).toBe('');
    });
  });

  describe('event properties', () => {
    it('agent-error events should bubble', () => {
      const errors: CustomEvent[] = [];
      element.addEventListener('agent-error', ((e: CustomEvent) => {
        errors.push(e);
      }) as EventListener);

      element.endpoint = '';
      (element as any)._onEndpointChanged();

      expect(errors[0].bubbles).toBe(true);
    });

    it('agent-error events should be composed (cross shadow DOM)', () => {
      const errors: CustomEvent[] = [];
      element.addEventListener('agent-error', ((e: CustomEvent) => {
        errors.push(e);
      }) as EventListener);

      element.endpoint = '';
      (element as any)._onEndpointChanged();

      expect(errors[0].composed).toBe(true);
    });
  });
});
