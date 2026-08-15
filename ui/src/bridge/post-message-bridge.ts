/**
 * PostMessage Bridge for cross-domain iframe communication.
 * Enables the sys-cli-agent component to communicate with parent frames
 * via the postMessage API with configurable origin validation.
 */

export interface BridgeConfig {
  /** Target origin for outbound messages. Default: '*' */
  targetOrigin: string;
  /** Allowlist of origins permitted for inbound messages. Default: ['*'] */
  allowedOrigins: string[];
}

export type MessageType = 'state-change' | 'user-interaction' | 'config-update';

export interface BridgeMessage {
  type: MessageType;
  payload: unknown;
  source: 'sys-cli-agent';
  timestamp: number;
}

export class PostMessageBridge {
  private readonly config: BridgeConfig;
  private handlers: Array<(msg: BridgeMessage) => void> = [];
  private messageListener: ((event: MessageEvent) => void) | null = null;
  private connected = false;

  constructor(config?: Partial<BridgeConfig>) {
    this.config = {
      targetOrigin: config?.targetOrigin ?? '*',
      allowedOrigins: config?.allowedOrigins ?? ['*'],
    };
  }

  /**
   * Send a message to the parent frame (or current window if not in an iframe).
   * Outbound messages include type, payload, source identifier, and timestamp.
   */
  send(type: MessageType, payload: unknown): void {
    const message: BridgeMessage = {
      type,
      payload,
      source: 'sys-cli-agent',
      timestamp: Date.now(),
    };

    const targetWindow = this.getTargetWindow();
    targetWindow.postMessage(message, this.config.targetOrigin);
  }

  /**
   * Register a handler for incoming messages that pass origin validation.
   */
  onMessage(handler: (msg: BridgeMessage) => void): void {
    this.handlers.push(handler);
  }

  /**
   * Start listening for incoming postMessage events.
   * Messages are validated against the configured origin allowlist.
   */
  connect(): void {
    if (this.connected) {
      return;
    }

    this.messageListener = (event: MessageEvent) => {
      this.handleIncomingMessage(event);
    };

    window.addEventListener('message', this.messageListener);
    this.connected = true;
  }

  /**
   * Stop listening for messages and clean up all handlers.
   */
  disconnect(): void {
    if (!this.connected || !this.messageListener) {
      return;
    }

    window.removeEventListener('message', this.messageListener);
    this.messageListener = null;
    this.connected = false;
  }

  /**
   * Check if the bridge is currently connected and listening.
   */
  get isConnected(): boolean {
    return this.connected;
  }

  /**
   * Get the current bridge configuration.
   */
  getConfig(): Readonly<BridgeConfig> {
    return { ...this.config };
  }

  /**
   * Determine whether we're inside an iframe and target parent, or fallback to current window.
   */
  private getTargetWindow(): Window {
    try {
      if (window.parent && window.parent !== window) {
        return window.parent;
      }
    } catch {
      // Cross-origin access to window.parent may throw; fall through to self
    }
    return window;
  }

  /**
   * Handle an incoming message event:
   * 1. Validate origin against the allowlist
   * 2. Validate message structure
   * 3. Dispatch to registered handlers
   */
  private handleIncomingMessage(event: MessageEvent): void {
    // Step 1: Origin validation — silently discard untrusted origins
    if (!this.isOriginAllowed(event.origin)) {
      return;
    }

    // Step 2: Validate message structure
    const data = event.data;
    if (!this.isValidBridgeMessage(data)) {
      return;
    }

    // Step 3: Dispatch to all registered handlers
    const message = data as BridgeMessage;
    for (const handler of this.handlers) {
      try {
        handler(message);
      } catch {
        // Swallow handler errors to prevent one bad handler from breaking others
      }
    }
  }

  /**
   * Check if an origin is in the configured allowlist.
   * Wildcard '*' permits all origins.
   */
  private isOriginAllowed(origin: string): boolean {
    if (this.config.allowedOrigins.includes('*')) {
      return true;
    }
    return this.config.allowedOrigins.includes(origin);
  }

  /**
   * Validate that a message has the expected BridgeMessage structure.
   */
  private isValidBridgeMessage(data: unknown): data is BridgeMessage {
    if (typeof data !== 'object' || data === null) {
      return false;
    }

    const msg = data as Record<string, unknown>;

    const validTypes: MessageType[] = ['state-change', 'user-interaction', 'config-update'];
    if (!validTypes.includes(msg.type as MessageType)) {
      return false;
    }

    if (msg.source !== 'sys-cli-agent') {
      return false;
    }

    if (typeof msg.timestamp !== 'number') {
      return false;
    }

    // payload can be anything (unknown), so no validation needed
    return true;
  }
}
