# Requirements Document

## Introduction

SYS_CLI // AGENT is a standalone micro-application that combines an AI chatbot with a RAG (Retrieval-Augmented Generation) knowledge base, delivered as a framework-agnostic Lit Web Component. The component provides a terminal-inspired interface styled with a Technical Brutalism design system, enabling users to query professional experience, project documentation, and architecture specs through a conversational agent that autonomously reasons, plans, and invokes tools.

## Glossary

- **Agent_Core**: The model-driven agent loop responsible for LLM reasoning, planning, and autonomous tool invocation using a Strands-style lightweight agent pattern.
- **Knowledge_Base**: A local vector store or document index containing professional experience records, project documentation, and architecture specifications used for retrieval-augmented generation.
- **Tool**: A callable function decorated with metadata that the Agent_Core can invoke autonomously during reasoning (e.g., `query_knowledge_base`, `get_professional_experience`, `get_project_architecture`).
- **Web_Component**: The `<sys-cli-agent>` Lit custom element that renders the terminal UI and manages user interaction.
- **Terminal_Stream**: The scrollable log view within the Web_Component that displays user inputs, agent reasoning steps, and structured responses.
- **Input_Bar**: The bottom prompt row of the Web_Component containing a blinking cursor, command symbol (`$`), and text input that submits on Enter.
- **Header_Bar**: The top bar of the Web_Component displaying the `SYS_CLI // AGENT` title and status indicator dots.
- **Technical_Brutalism**: The design system applied to the Web_Component characterized by flat borders, monospace typography, and a muted warm color palette.
- **Host_Application**: Any Angular or non-Angular application that embeds the `<sys-cli-agent>` custom element.

## Requirements

### Requirement 1: Agent Core Reasoning Loop

**User Story:** As a user, I want the agent to autonomously reason about my query, plan a response strategy, and invoke appropriate tools, so that I receive accurate and contextually relevant answers without manual orchestration.

#### Acceptance Criteria

1. WHEN a user query is received, THE Agent_Core SHALL parse the query and determine a reasoning plan before invoking any Tool.
2. WHEN the Agent_Core determines that additional context is needed, THE Agent_Core SHALL autonomously select and invoke up to a maximum of 10 Tools per query without user intervention.
3. WHEN a Tool returns a result, THE Agent_Core SHALL incorporate the result into its reasoning chain and continue planning until a final response is formulated, completing within a maximum of 15 reasoning-action cycles and a total response time of 120 seconds.
4. THE Agent_Core SHALL support a configurable LLM endpoint (base URL and model identifier) for the underlying language model.
5. IF a Tool invocation fails (defined as: the Tool returns an error response, throws an exception, or does not respond within 30 seconds), THEN THE Agent_Core SHALL log the error, skip the failed Tool, and continue reasoning with available context.
6. IF the Agent_Core reaches the maximum reasoning-action cycle limit or the total response time limit without formulating a final response, THEN THE Agent_Core SHALL return a partial response containing the reasoning and results gathered so far, along with an indication that the response is incomplete.

### Requirement 2: Knowledge Base and Vector Store

**User Story:** As a user, I want the agent to search a local knowledge base of professional documents, so that responses are grounded in accurate, domain-specific information.

#### Acceptance Criteria

1. THE Knowledge_Base SHALL index markdown and JSON documents from a configurable source directory, splitting each document into chunks of no more than 512 tokens with an overlap of 50 tokens between consecutive chunks.
2. WHEN a search query is submitted to the Knowledge_Base, THE Knowledge_Base SHALL return the top-k most relevant document chunks ranked by semantic similarity, where k defaults to 5 and is configurable between 1 and 20.
3. WHEN a source document is added or modified in the source directory, THE Knowledge_Base SHALL re-index only the affected document within 30 seconds without requiring a full re-index of unchanged documents.
4. WHEN no relevant documents are found above the configured similarity threshold, THE Knowledge_Base SHALL return an empty result set with zero chunks.
5. THE Knowledge_Base SHALL use a similarity threshold that defaults to 0.7 on a 0.0 to 1.0 scale and is configurable by the user.
6. IF the configured source directory is empty or does not exist, THEN THE Knowledge_Base SHALL return an error indication specifying that no documents are available for indexing and SHALL not process search queries until valid documents are indexed.
7. IF a source document fails to parse due to invalid markdown or malformed JSON, THEN THE Knowledge_Base SHALL skip the invalid document, log an error indication identifying the failed file, and continue indexing the remaining documents.

### Requirement 3: Tool Definitions

**User Story:** As a developer, I want tools defined with clean decorators and clear interfaces, so that I can extend the agent's capabilities with new tools easily.

#### Acceptance Criteria

1. THE Agent_Core SHALL expose a `query_knowledge_base(search_term: string)` Tool that performs a case-insensitive keyword search across local markdown and JSON project documents and returns content from documents containing all terms in the search string, limited to a maximum of 10 result entries.
2. THE Agent_Core SHALL expose a `get_professional_experience()` Tool that returns a structured timeline of professional experience including metrics such as years of experience.
3. THE Agent_Core SHALL expose a `get_project_architecture(project_name: string)` Tool that returns blueprint data and tech stack specifications for the named project.
4. WHEN a Tool is defined, THE Agent_Core SHALL register the Tool using a decorator pattern that declares the Tool name, description, and parameter schema.
5. WHEN a Tool is invoked, THE Agent_Core SHALL validate all provided parameters against the declared schema for type correctness and required-field presence before executing the Tool logic.
6. IF a Tool is invoked with invalid parameters, THEN THE Agent_Core SHALL return a descriptive error message indicating which parameters failed validation and shall not execute the Tool logic.
7. IF a Tool is invoked with valid parameters but the requested resource is not found, THEN THE Agent_Core SHALL return an empty result set rather than raising an unhandled error.
8. THE Agent_Core SHALL reject a `search_term` that is empty or exceeds 200 characters and return an error message indicating the length constraint.

### Requirement 4: Lit Web Component Shell

**User Story:** As a developer, I want a framework-agnostic Lit custom element, so that the chatbot can be embedded in any web application regardless of framework.

#### Acceptance Criteria

1. THE Web_Component SHALL register as the custom element `<sys-cli-agent>` using Lit's standard custom element definition.
2. THE Web_Component SHALL render without requiring any external framework dependencies beyond Lit.
3. THE Web_Component SHALL encapsulate all styles within Shadow DOM such that component-defined styles do not affect elements in the Host_Application and Host_Application styles do not override the component's scoped styles.
4. WHEN the Web_Component is added to the DOM, THE Web_Component SHALL read the LLM endpoint URL from its `endpoint` attribute, initialize the Agent_Core, and establish a connection to the LLM endpoint within 10 seconds.
5. WHEN the Web_Component is removed from the DOM, THE Web_Component SHALL disconnect from the LLM endpoint, remove all registered event listeners, cancel pending timers, and close open network connections within 5 seconds.
6. IF the Web_Component fails to establish a connection to the LLM endpoint within 10 seconds, THEN THE Web_Component SHALL display an error message indicating the connection failure and expose a `connection-error` event on the host element.

### Requirement 5: Technical Brutalism Design System

**User Story:** As a user, I want a visually distinct terminal-inspired interface, so that the experience feels like interacting with a professional command-line system.

#### Acceptance Criteria

1. THE Web_Component SHALL apply a background color of `#f9f6f0` to the component root container.
2. THE Web_Component SHALL apply `1px solid #dcd6cd` borders with `0px` border-radius to all bordered elements.
3. THE Web_Component SHALL use the `JetBrains Mono` font family for all text content including logs, inputs, and headings.
4. THE Web_Component SHALL render a Header_Bar displaying the text `SYS_CLI // AGENT` with three status window dots: one close dot, one minimize dot, and one active indicator dot colored `#E5A93B` (amber).
5. THE Web_Component SHALL provide a fallback monospace font stack of `'JetBrains Mono', 'Fira Code', 'Source Code Pro', 'Courier New', monospace` in case `JetBrains Mono` is unavailable.

### Requirement 6: Terminal Stream Display

**User Story:** As a user, I want to see my inputs, the agent's reasoning steps, and final responses in a scrollable terminal log, so that I can follow the agent's thought process transparently.

#### Acceptance Criteria

1. THE Terminal_Stream SHALL display user inputs prefixed with a `$` command symbol.
2. WHEN the Agent_Core begins a Tool invocation, THE Terminal_Stream SHALL display a reasoning step indicator formatted as `> ` followed by an uppercase action label and trailing ellipsis (e.g., `> RETRIEVING_VECTOR_CONTEXT...`).
3. WHEN the Agent_Core produces a final response, THE Terminal_Stream SHALL display the response as a text block visually separated from reasoning steps by a different prefix or indentation level (no `>` prefix and no `$` prefix).
4. WHEN new content is appended to the Terminal_Stream, THE Terminal_Stream SHALL automatically scroll so the most recent entry is visible within the viewport.
5. THE Terminal_Stream SHALL retain a minimum of 200 conversation entries for the duration of the component lifecycle.
6. WHILE the Agent_Core is processing a query, THE Terminal_Stream SHALL display an animated processing indicator.
7. WHEN the Agent_Core completes or fails processing a query, THE Terminal_Stream SHALL remove the animated processing indicator within 300 milliseconds.
8. IF the Agent_Core returns an error during processing, THEN THE Terminal_Stream SHALL display an error entry visually distinct from reasoning steps and final responses, indicating the nature of the failure.

### Requirement 7: Input Bar Interaction

**User Story:** As a user, I want a command-line input bar with a blinking cursor, so that I can type and submit queries naturally using keyboard interaction.

#### Acceptance Criteria

1. THE Input_Bar SHALL display a `$` command symbol followed by a text input field with a blinking cursor animation that alternates visibility at a 500-millisecond interval, accepting a maximum of 500 characters.
2. WHEN the user presses the Enter key, THE Input_Bar SHALL submit the current input text to the Agent_Core and clear the input field.
3. WHILE the Agent_Core is processing a query, THE Input_Bar SHALL set the text input field to a non-editable state and display a visual indicator distinguishing it from the enabled state.
4. WHEN the Agent_Core completes processing, THE Input_Bar SHALL re-enable user input and restore focus to the text field.
5. IF the user submits input that contains no non-whitespace characters, THEN THE Input_Bar SHALL ignore the submission and retain focus without sending a request to the Agent_Core.
6. IF the user presses the Enter key while the Input_Bar is in a disabled state, THEN THE Input_Bar SHALL ignore the keypress and remain in the disabled state.

### Requirement 8: Angular Integration

**User Story:** As an Angular developer, I want clear configuration guidance for embedding the custom element, so that I can integrate the component without framework conflicts.

#### Acceptance Criteria

1. THE Web_Component SHALL render without template compilation errors when the host Angular application registers `CUSTOM_ELEMENTS_SCHEMA` in the consuming module or component.
2. THE Web_Component SHALL expose configurable properties via standard HTML attributes for the LLM endpoint URL (maximum 2048 characters) and knowledge base source path (maximum 512 characters), and SHALL reflect attribute value changes to the component's internal state within 100 milliseconds.
3. THE Web_Component SHALL emit the following custom DOM events: `agent-ready` when initialization completes, `agent-error` with a `detail` property containing an error description when an operation fails, and `agent-response` with a `detail` property containing the response payload when a response is received.
4. WHEN embedded within an Angular application, THE Web_Component SHALL render its UI, respond to attribute changes, and emit DOM events without requiring Angular-specific adapters or wrappers.
5. IF a required attribute (LLM endpoint URL) is missing or contains a malformed URL value, THEN THE Web_Component SHALL emit an `agent-error` event with a `detail` property indicating the validation failure and SHALL not attempt a connection to the endpoint.

### Requirement 9: Cross-Domain and Iframe Embedding

**User Story:** As a platform engineer, I want secure cross-domain embedding support, so that the component can be hosted on a separate domain or within an iframe without security issues.

#### Acceptance Criteria

1. THE Web_Component SHALL render its interface, accept user input, and communicate with the LLM endpoint when embedded within an iframe from a different origin, provided the hosting page does not set sandbox restrictions that block scripts or same-origin access.
2. THE Web_Component SHALL document the required CORS headers for cross-origin API communication between the component and the LLM endpoint.
3. WHILE embedded in an iframe, THE Web_Component SHALL support a `postMessage` interface for parent-frame communication with configurable target origin (defaulting to `*`) and at minimum the following message types: state-change notifications, user-interaction events, and configuration updates from the parent frame.
4. IF the Web_Component detects that required CORS permissions are unavailable within 5 seconds of the first failed cross-origin request, THEN THE Web_Component SHALL display an error message in the Terminal_Stream indicating the affected origin and the specific permission that is missing.
5. WHEN the Web_Component receives a `postMessage` from a parent frame, THE Web_Component SHALL validate the message origin against a configurable allowlist of trusted origins and discard any message whose origin is not in the allowlist.

### Requirement 10: Accessibility

**User Story:** As a user with assistive technology, I want the terminal interface to be accessible, so that I can interact with the agent using screen readers and keyboard navigation.

#### Acceptance Criteria

1. THE Web_Component SHALL assign appropriate ARIA roles to the Terminal_Stream (`log` role) and Input_Bar (`textbox` role).
2. THE Web_Component SHALL support keyboard navigation such that all interactive elements (Input_Bar, action buttons, and scrollable regions) are operable using Tab, Shift+Tab, Enter, and Escape keys without requiring a mouse.
3. WHEN new content is added to the Terminal_Stream, THE Web_Component SHALL announce the content to assistive technologies using an ARIA live region with `polite` politeness level.
4. THE Web_Component SHALL maintain a minimum contrast ratio of 4.5:1 between text and background colors for all readable content.
5. WHEN an interactive element receives keyboard focus, THE Web_Component SHALL display a visible focus indicator with a minimum 2px outline that meets the 3:1 contrast ratio against adjacent colors.
