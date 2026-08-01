# Implementation Plan: SYS_CLI // AGENT

## Overview

This plan implements a standalone Lit Web Component (`<sys-cli-agent>`) delivering an AI-powered conversational agent with a terminal-inspired Technical Brutalism interface. The system combines an autonomous reasoning agent loop with a local RAG knowledge base, packaged as a single framework-agnostic custom element. Implementation uses TypeScript with Lit 3.x, Vitest for testing, and fast-check for property-based tests.

## Tasks

- [x] 1. Set up project structure, build tooling, and shared types
  - [x] 1.1 Initialize project with Vite, TypeScript, Lit, and testing dependencies
    - Create `package.json` with dependencies: `lit`, `transformers.js`, `reflect-metadata`
    - Add dev dependencies: `vite`, `typescript`, `vitest`, `fast-check`, `jsdom`, `@vitest/coverage-v8`
    - Create `tsconfig.json` with decorator support and ES module target
    - Create `vite.config.ts` for library mode output with ESM bundle
    - Create `vitest.config.ts` with jsdom environment and coverage thresholds (80% branches/functions/lines/statements)
    - Create `test/setup.ts` for test environment initialization
    - _Requirements: 4.1, 4.2_

  - [x] 1.2 Create shared type definitions and design tokens
    - Create `src/types/index.ts` with all shared interfaces: `TerminalEntry`, `ConversationState`, `ToolInvocation`, `ReasoningStep`, `LLMRequest`, `LLMMessage`, `ToolCall`, `LLMToolDef`, `SysCLIAgentConfig`
    - Create `src/ui/styles/design-tokens.css.ts` with CSS custom properties using Material Design 3 tokens from the workspace design system
    - _Requirements: 5.1, 5.2, 5.3, 5.5_

  - [x] 1.3 Create project directory structure
    - Create directory scaffold matching file structure: `src/agent/`, `src/agent/tools/`, `src/knowledge-base/`, `src/ui/`, `src/ui/styles/`, `src/bridge/`, `src/types/`
    - Create `src/index.ts` public entry point with barrel exports
    - _Requirements: 4.1_

- [x] 2. Implement Tool Registry and parameter validation
  - [x] 2.1 Implement ToolRegistry class with decorator-based registration
    - Create `src/agent/tool-registry.ts` with `ToolRegistry` class
    - Implement `register(schema, handler)` method for tool registration
    - Implement `getSchemas()` to return all registered tool schemas for LLM context
    - Implement `@tool` decorator using `Reflect.defineMetadata` for method annotation
    - _Requirements: 3.4_

  - [x] 2.2 Implement parameter validation and tool invocation
    - Implement `validate(name, params)` method checking type constraints, required fields, `minLength`, `maxLength`
    - Implement `invoke(name, params)` that validates params before execution and returns `ToolResult`
    - Return descriptive error for invalid params without executing tool logic
    - Return empty result set when resource not found (no unhandled errors)
    - _Requirements: 3.5, 3.6, 3.7, 3.8_

  - [x] 2.3 Write property test for tool parameter validation
    - **Property 9: Tool Parameter Validation**
    - Generate random schemas and parameter sets; verify accept/reject behavior matches schema constraints
    - **Validates: Requirements 3.5, 3.8**

- [x] 3. Implement Knowledge Base with document chunking and vector search
  - [x] 3.1 Implement document chunker
    - Create `src/knowledge-base/chunker.ts` with `chunkDocument(content, chunkSize, overlap)` function
    - Implement token-based splitting: max 512 tokens per chunk, 50-token overlap between consecutive chunks
    - Handle edge case of documents smaller than chunk size (return single chunk)
    - _Requirements: 2.1_

  - [x] 3.2 Write property test for document chunking invariants
    - **Property 4: Document Chunking Invariants**
    - Generate random markdown/JSON documents; verify chunk size ≤ 512 tokens and overlap = 50 tokens
    - **Validates: Requirements 2.1**

  - [x] 3.3 Implement embedding engine and vector store
    - Create `src/knowledge-base/embeddings.ts` with embedding generation using Transformers.js (ONNX)
    - Create `src/knowledge-base/vector-store.ts` with in-memory HNSW index
    - Implement `cosineSimilarity(a, b)` function for Float32Array vectors
    - Implement `search(queryEmbedding, topK, threshold)` returning scored results sorted descending
    - _Requirements: 2.2, 2.5_

  - [x] 3.4 Implement KnowledgeBase class with indexing and search
    - Create `src/knowledge-base/knowledge-base.ts` with `KnowledgeBase` class
    - Implement `indexAll()` for bulk document indexing from source directory
    - Implement `reindex(filePath)` for incremental single-document re-indexing preserving unchanged document chunks
    - Implement `search(query, topK)` returning top-k results above similarity threshold, sorted descending
    - Handle invalid documents (skip, log error, continue indexing valid ones)
    - Handle missing/empty source directory with error status
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

  - [x] 3.5 Write property test for search result ordering and bounds
    - **Property 5: Search Result Ordering and Bounds**
    - Generate random queries against indexed corpus; verify ≤ k results, all above threshold, sorted descending
    - **Validates: Requirements 2.2**

  - [x] 3.6 Write property test for incremental re-index preservation
    - **Property 6: Incremental Re-index Preservation**
    - Index N documents, modify one, re-index; verify remaining N-1 documents' chunks are identical
    - **Validates: Requirements 2.3**

  - [x] 3.7 Write property test for invalid document resilience
    - **Property 7: Invalid Document Resilience**
    - Generate mix of valid and malformed documents; verify only valid documents produce chunks
    - **Validates: Requirements 2.7**

- [x] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement Agent Core reasoning loop
  - [x] 5.1 Implement LLM client
    - Create `src/agent/llm-client.ts` with HTTP client for LLM endpoint communication
    - Support configurable endpoint URL and model identifier
    - Implement streaming/non-streaming request handling
    - Handle connection timeout (10s), request timeout, and CORS errors
    - _Requirements: 1.4, 4.4_

  - [x] 5.2 Implement AgentCore reasoning loop
    - Create `src/agent/agent-core.ts` with `AgentCore` class
    - Implement `processQuery(query)` as `AsyncGenerator<ReasoningStep>`
    - Enforce max 10 tool invocations and max 15 reasoning-action cycles
    - Enforce 120-second total timeout
    - First reasoning step must be `plan` type before any `tool_call`
    - Return partial response prefixed with `[INCOMPLETE]` or `[TIMEOUT]` when limits reached
    - Implement `abort()` for cancellation
    - _Requirements: 1.1, 1.2, 1.3, 1.6_

  - [x] 5.3 Implement tool invocation with error handling
    - Add safe tool invocation with 30-second per-tool timeout
    - Catch exceptions and timeouts, log error, skip failed tool, continue reasoning
    - Add tool result incorporation into conversation context
    - _Requirements: 1.5_

  - [x] 5.4 Write property test for agent loop invariants
    - **Property 1: Agent Loop Invariants**
    - Mock LLM with varying tool-call sequences; verify ≤ 10 tools and ≤ 15 cycles before termination
    - **Validates: Requirements 1.2, 1.3**

  - [x] 5.5 Write property test for plan-first reasoning
    - **Property 2: Plan-First Reasoning**
    - Mock LLM responses; verify first emitted step is always type `plan` before any `tool_call`
    - **Validates: Requirements 1.1**

  - [x] 5.6 Write property test for tool failure resilience
    - **Property 3: Tool Failure Resilience**
    - Mock tool invocations that throw/timeout/error; verify agent continues and produces response
    - **Validates: Requirements 1.5**

- [x] 6. Implement Tool definitions
  - [x] 6.1 Implement query_knowledge_base tool
    - Create `src/agent/tools/query-knowledge-base.tool.ts`
    - Implement case-insensitive keyword search across indexed documents
    - Return content from documents containing all search terms, limited to max 10 results
    - Validate search_term: reject empty or >200 characters
    - Use `@tool` decorator for registration
    - _Requirements: 3.1, 3.8_

  - [x] 6.2 Write property test for keyword search correctness
    - **Property 8: Keyword Search Correctness**
    - Generate random search terms and document corpus; verify all results contain all terms (case-insensitive) and count ≤ 10
    - **Validates: Requirements 3.1**

  - [x] 6.3 Implement get_professional_experience tool
    - Create `src/agent/tools/get-professional-experience.tool.ts`
    - Return structured timeline of professional experience with metrics
    - Use `@tool` decorator for registration
    - _Requirements: 3.2_

  - [x] 6.4 Implement get_project_architecture tool
    - Create `src/agent/tools/get-project-architecture.tool.ts`
    - Accept `project_name` parameter, return blueprint data and tech stack
    - Return empty result set if project not found
    - Use `@tool` decorator for registration
    - _Requirements: 3.3, 3.7_

- [x] 7. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Implement UI components
  - [x] 8.1 Implement HeaderBar component
    - Create `src/ui/header-bar.ts` as Lit element
    - Render `SYS_CLI // AGENT` title with three status dots (close, minimize, active amber `#E5A93B`)
    - Accept `status` property for connection state indication
    - Apply design tokens for Technical Brutalism styling
    - _Requirements: 5.4, 5.1, 5.2, 5.3_

  - [x] 8.2 Implement TerminalStream component
    - Create `src/ui/terminal-stream.ts` as Lit element
    - Render entries with type-based formatting: user (`$ ` prefix), reasoning (`> ` + uppercase label + `...`), response (no prefix), error (distinct styling with error tokens)
    - Implement auto-scroll on new entry append
    - Retain minimum 200 entries for component lifecycle
    - Implement animated processing indicator with removal within 300ms on completion
    - Apply ARIA `role="log"` and `aria-live="polite"` for screen reader announcements
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 10.1, 10.3_

  - [x] 8.3 Write property test for terminal entry type formatting
    - **Property 10: Terminal Entry Type Formatting**
    - Generate random entries of each type; verify formatting rules (prefix, style) match type
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.8**

  - [x] 8.4 Write property test for terminal stream capacity
    - **Property 11: Terminal Stream Capacity**
    - Append up to 200 entries; verify all retained without eviction
    - **Validates: Requirements 6.5**

  - [x] 8.5 Implement InputBar component
    - Create `src/ui/input-bar.ts` as Lit element
    - Render `$` symbol + text input with blinking cursor (500ms interval)
    - Enforce max 500 character input length
    - Emit `query-submit` event on Enter with non-empty, non-whitespace text, then clear input
    - Disable input during processing (ignore all keyboard input including Enter)
    - Re-enable and restore focus when processing completes
    - Ignore whitespace-only submissions (no event emitted, retain focus)
    - Apply `role="textbox"` for accessibility
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 10.1_

  - [x] 8.6 Write property test for input max length enforcement
    - **Property 12: Input Max Length Enforcement**
    - Generate strings > 500 chars; verify truncation/rejection at position 500
    - **Validates: Requirements 7.1**

  - [x] 8.7 Write property test for submit and clear behavior
    - **Property 13: Submit and Clear Behavior**
    - Generate non-empty, non-whitespace strings; verify `query-submit` event and field cleared
    - **Validates: Requirements 7.2**

  - [x] 8.8 Write property test for disabled state input rejection
    - **Property 14: Disabled State Input Rejection**
    - Generate keyboard inputs while disabled; verify all ignored with no side effects
    - **Validates: Requirements 7.3**

  - [x] 8.9 Write property test for whitespace-only rejection
    - **Property 15: Whitespace-Only Rejection**
    - Generate whitespace-only strings; verify no event emitted and focus retained
    - **Validates: Requirements 7.5**

- [x] 9. Implement Web Component shell and lifecycle
  - [x] 9.1 Implement SysCLIAgentElement root component
    - Create `src/sys-cli-agent.element.ts` as root Lit custom element registered as `<sys-cli-agent>`
    - Compose HeaderBar, TerminalStream, and InputBar within Shadow DOM
    - Expose `endpoint`, `kb-path`, and `allowed-origins` HTML attributes with reflection
    - Encapsulate all styles within Shadow DOM (no leakage in/out)
    - _Requirements: 4.1, 4.2, 4.3, 8.2_

  - [x] 9.2 Implement component lifecycle management
    - In `connectedCallback`: read `endpoint` attribute, validate URL, initialize AgentCore, connect to LLM within 10s
    - In `disconnectedCallback`: disconnect LLM, remove listeners, cancel timers, close connections within 5s
    - Emit `agent-ready` on successful initialization
    - Emit `agent-error` with detail for validation failures or connection issues
    - Emit `connection-error` if connection fails within 10s
    - Emit `agent-response` with response payload on query completion
    - _Requirements: 4.4, 4.5, 4.6, 8.3, 8.5_

  - [x] 9.3 Implement endpoint URL validation
    - Validate: non-empty, ≤ 2048 chars, valid URL with http/https protocol
    - Emit `agent-error` event for validation failures without attempting connection
    - Validate `kb-path` ≤ 512 chars
    - Reflect attribute changes to internal state within 100ms
    - _Requirements: 8.2, 8.5_

  - [x] 9.4 Write property test for attribute reflection
    - **Property 16: Attribute Reflection**
    - Generate valid endpoint URLs (≤ 2048 chars) and kb-path values (≤ 512 chars); verify internal state reflects within 100ms
    - **Validates: Requirements 8.2**

  - [x] 9.5 Write property test for malformed URL error emission
    - **Property 17: Malformed URL Error Emission**
    - Generate empty, oversized, or invalid URLs; verify `agent-error` event emitted and no connection attempted
    - **Validates: Requirements 8.5**

- [x] 10. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Implement PostMessage bridge for cross-domain communication
  - [x] 11.1 Implement PostMessageBridge class
    - Create `src/bridge/post-message-bridge.ts` with `PostMessageBridge` class
    - Implement `send(type, payload)` dispatching messages with structure: `{ type, payload, source: 'sys-cli-agent' }` targeting configured origin
    - Implement `onMessage(handler)` for registering incoming message handlers
    - Implement `connect()` and `disconnect()` for lifecycle management
    - Support message types: `state-change`, `user-interaction`, `config-update`
    - Default target origin to `*`, configurable via `allowed-origins` attribute
    - _Requirements: 9.1, 9.2, 9.3_

  - [x] 11.2 Implement origin allowlist validation
    - Validate incoming message origins against configurable allowlist
    - Silently discard messages from untrusted origins (no information leakage)
    - Support wildcard `*` to accept all origins
    - _Requirements: 9.5_

  - [x] 11.3 Write property test for PostMessage structure and dispatch
    - **Property 18: PostMessage Structure and Dispatch**
    - Generate random messages; verify dispatched structure includes `type`, `payload`, `source: 'sys-cli-agent'`, and targets configured origin
    - **Validates: Requirements 9.3**

  - [x] 11.4 Write property test for origin allowlist enforcement
    - **Property 19: Origin Allowlist Enforcement**
    - Generate random origins and allowlists; verify only matching origins are accepted, others discarded
    - **Validates: Requirements 9.5**

- [x] 12. Implement accessibility features
  - [x] 12.1 Implement keyboard navigation and focus management
    - Ensure all interactive elements (InputBar, action buttons, scrollable regions) are Tab/Shift+Tab navigable
    - Support Enter for submission, Escape for blur
    - Display visible focus indicator (min 2px outline, 3:1 contrast ratio)
    - _Requirements: 10.2, 10.5_

  - [x] 12.2 Implement ARIA attributes and contrast compliance
    - Verify Terminal_Stream has `role="log"` and ARIA live region with `polite` level
    - Verify Input_Bar has `role="textbox"`
    - Ensure minimum 4.5:1 contrast ratio for all readable content using design system token pairings
    - _Requirements: 10.1, 10.3, 10.4_

- [x] 13. Wire components together and create public API
  - [x] 13.1 Integrate all components into the root element
    - Wire InputBar `query-submit` → AgentCore `processQuery`
    - Wire AgentCore `ReasoningStep` emissions → TerminalStream `appendEntry`
    - Wire AgentCore state changes → HeaderBar `status` property
    - Wire AgentCore state changes → InputBar `disabled` property
    - Connect PostMessageBridge for cross-domain state notifications
    - Initialize KnowledgeBase from `kb-path` attribute on connect
    - Register all tools with ToolRegistry on initialization
    - _Requirements: 1.1, 1.2, 4.4, 7.2, 7.3, 7.4, 9.3_

  - [x] 13.2 Implement CORS error detection and reporting
    - Detect CORS failures within 5s of first failed cross-origin request
    - Display error in TerminalStream indicating affected origin and missing permission
    - _Requirements: 9.4_

  - [x] 13.3 Write integration tests for end-to-end query flow
    - Test: user input → agent reasoning → tool invocation → response display
    - Test: cross-origin iframe postMessage communication
    - Test: LLM connection lifecycle (connect, timeout, disconnect)
    - Test: Angular host compatibility with CUSTOM_ELEMENTS_SCHEMA
    - _Requirements: 1.1, 4.4, 8.1, 8.4, 9.1_

- [x] 14. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document (Properties 1–19)
- Unit tests validate specific examples and edge cases
- The design uses TypeScript throughout — all implementations use TypeScript with Lit 3.x
- Design system tokens from the workspace steering rules are used for all color values (never hardcoded arbitrary colors)

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.3"] },
    { "id": 2, "tasks": ["2.1", "3.1"] },
    { "id": 3, "tasks": ["2.2", "3.2", "3.3"] },
    { "id": 4, "tasks": ["2.3", "3.4"] },
    { "id": 5, "tasks": ["3.5", "3.6", "3.7", "5.1"] },
    { "id": 6, "tasks": ["5.2", "6.1"] },
    { "id": 7, "tasks": ["5.3", "6.2", "6.3", "6.4"] },
    { "id": 8, "tasks": ["5.4", "5.5", "5.6"] },
    { "id": 9, "tasks": ["8.1", "8.2", "8.5"] },
    { "id": 10, "tasks": ["8.3", "8.4", "8.6", "8.7", "8.8", "8.9"] },
    { "id": 11, "tasks": ["9.1"] },
    { "id": 12, "tasks": ["9.2", "9.3", "11.1"] },
    { "id": 13, "tasks": ["9.4", "9.5", "11.2"] },
    { "id": 14, "tasks": ["11.3", "11.4", "12.1", "12.2"] },
    { "id": 15, "tasks": ["13.1"] },
    { "id": 16, "tasks": ["13.2", "13.3"] }
  ]
}
```
