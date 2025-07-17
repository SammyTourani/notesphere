# System Patterns

## 1. System Architecture
The application follows a modular, component-based architecture. The front-end is built with React, utilizing a context-based state management system. The grammar engine is designed as a pluggable service, allowing for multiple engines to be integrated and managed by a central controller.

## 2. Key Technical Decisions
- **Local-First**: All data and processing are handled on the client-side to ensure privacy.
- **Component-Based UI**: The user interface is built with reusable React components.
- **Context API for State**: React's Context API is used for managing global state, such as themes and user authentication.
- **WASM for Performance**: WebAssembly is used for performance-critical components of the grammar engine.

## 3. Design Patterns
- **Service Locator**: The `UnifiedGrammarController` acts as a service locator for accessing different grammar engines.
- **Strategy Pattern**: Different grammar engines can be swapped out at runtime.
- **Observer Pattern**: The UI components subscribe to changes in the application state and re-render accordingly.

## 4. Component Relationships
- `NoteEditor` is the core component for writing and editing notes.
- `GrammarChecker` is a child component of `NoteEditor` that provides real-time grammar feedback.
- `UltimateGrammarSystemV2` is the service that powers the `GrammarChecker`.

## 5. Critical Implementation Paths
- The integration between the `NoteEditor` and the `UltimateGrammarSystemV2` is critical for the application's core functionality.
- The performance of the WASM-based grammar engine is essential for a smooth user experience.
