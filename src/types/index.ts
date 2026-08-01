/**
 * SYS_CLI // AGENT - Shared Type Definitions (Frontend Only)
 */

/** A single entry in the terminal display. */
export interface TerminalEntry {
  id: string;
  type: 'user' | 'reasoning' | 'response' | 'error' | 'processing';
  content: string;
  timestamp: number;
  metadata?: {
    toolName?: string;
  };
}

/** Configuration for the sys-cli-agent component. */
export interface SysCLIAgentConfig {
  endpoint: string;
  kbPath?: string;
  allowedOrigins?: string;
}
