# NoteSphere Architecture Documentation

## 📁 Project Structure

This document outlines the clean, modular architecture of NoteSphere following object-oriented programming principles and plugin-based design patterns.

## 🏗️ Directory Structure

```
src/
├── core/                          # Core application logic (singleton services)
│   ├── config/                    # Configuration management
│   │   ├── firebase.config.js     # Firebase configuration
│   │   ├── app.config.js          # Application-wide settings
│   │   └── routes.config.js       # Route definitions
│   │
│   ├── services/                  # Core business logic services
│   │   ├── notes/                 # Note management
│   │   │   ├── NotesRepository.js # Data access layer (Repository Pattern)
│   │   │   ├── NotesService.js    # Business logic for notes
│   │   │   └── SyncEngine.js      # Offline/online synchronization
│   │   │
│   │   └── storage/               # Storage adapters (Strategy Pattern)
│   │       ├── StorageAdapter.js       # Base adapter interface
│   │       ├── LocalStorageAdapter.js  # Local storage implementation
│   │       └── FirestoreAdapter.js     # Firestore implementation
│   │
│   └── state/                     # Global state management (Context API)
│       ├── AuthContext.jsx        # Authentication state
│       ├── NotesContext.jsx       # Notes state
│       ├── ThemeContext.jsx       # Theme state
│       └── FontContext.jsx        # Font preferences state
│
├── features/                      # Feature modules (self-contained)
│   ├── auth/                      # Authentication feature
│   │   ├── components/            # Auth-specific components
│   │   │   ├── Login.jsx
│   │   │   ├── SignUp.jsx
│   │   │   ├── AuthAnimation.jsx
│   │   │   ├── GuestRoute.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   │
│   │   ├── hooks/                 # Auth-specific hooks
│   │   │   └── useAuth.js
│   │   │
│   │   └── pages/                 # Auth pages
│   │       ├── LoginPage.jsx
│   │       └── OnboardingPage.jsx
│   │
│   ├── notes/                     # Notes feature
│   │   ├── components/            # Note-specific components
│   │   │   ├── NoteCard.jsx       # Note card display
│   │   │   ├── NotesList.jsx      # Notes list view
│   │   │   ├── TrashView.jsx      # Trash bin view
│   │   │   ├── PinButton.jsx      # Pin functionality
│   │   │   └── DeleteModal.jsx    # Delete confirmation
│   │   │
│   │   ├── hooks/                 # Note-specific hooks
│   │   │   ├── useNoteEditor.js   # Note editing logic
│   │   │   └── useAutoSave.js     # Auto-save functionality
│   │   │
│   │   └── pages/                 # Note pages
│   │       ├── NotesListPage.jsx
│   │       └── NoteEditorPage.jsx
│   │
│   ├── editor/                    # Rich text editor feature
│   │   ├── core/                  # Core editor functionality
│   │   │   ├── TipTapEditor.jsx   # Main editor component
│   │   │   └── EditorToolbar.jsx  # Editor toolbar
│   │   │
│   │   ├── extensions/            # TipTap extensions (Plugin Pattern)
│   │   │   └── GrammarExtension.js # Grammar checking extension
│   │   │
│   │   ├── plugins/               # Editor plugins
│   │   │   ├── WordCount/         # Word count plugin
│   │   │   │   ├── WordCountPlugin.js
│   │   │   │   └── WordCountDisplay.jsx
│   │   │   │
│   │   │   └── AutoSave/          # Auto-save plugin
│   │   │       └── AutoSavePlugin.js
│   │   │
│   │   └── hooks/                 # Editor hooks
│   │       └── useTipTapEditor.js
│   │
│   ├── grammar/                   # Grammar checking feature (Plugin Architecture)
│   │   ├── core/                  # Core grammar system
│   │   │   ├── GrammarController.js    # Main controller (Facade Pattern)
│   │   │   ├── GrammarEngine.js        # Grammar detection engine
│   │   │   └── GrammarConfig.js        # Grammar configuration
│   │   │
│   │   ├── engines/               # Grammar engines (Strategy Pattern)
│   │   │   ├── BaseEngine.js           # Base engine interface
│   │   │   ├── WasmEngine.js           # WASM-based engine (nlprule)
│   │   │   ├── FallbackEngine.js       # Simple fallback engine
│   │   │   └── EngineFactory.js        # Engine creation factory
│   │   │
│   │   ├── rules/                 # Grammar rules (Rule Pattern)
│   │   │   ├── BaseRule.js
│   │   │   ├── SpellingRules.js
│   │   │   ├── GrammarRules.js
│   │   │   ├── StyleRules.js
│   │   │   └── PunctuationRules.js
│   │   │
│   │   ├── services/              # Grammar services
│   │   │   ├── SuggestionService.js    # Suggestion intelligence
│   │   │   └── ReplacementService.js   # Text replacement
│   │   │
│   │   ├── components/            # Grammar UI components
│   │   │   ├── GrammarInsights.jsx     # Main insights panel
│   │   │   ├── GrammarHighlighter.jsx  # Interactive highlighter
│   │   │   ├── GrammarButton.jsx       # Toggle button
│   │   │   └── IssueCard.jsx           # Issue display card
│   │   │
│   │   └── hooks/                 # Grammar hooks
│   │       └── useGrammarIntegration.js
│   │
│   ├── settings/                  # Settings feature
│   │   ├── components/
│   │   │   ├── ThemeToggle.jsx
│   │   │   ├── FontPreview.jsx
│   │   │   └── UserProfile.jsx
│   │   │
│   │   └── pages/
│   │       └── SettingsPage.jsx
│   │
│   └── landing/                   # Landing page feature
│       ├── components/
│       │   └── LandingHero.jsx
│       │
│       └── pages/
│           └── LandingPage.jsx
│
├── shared/                        # Shared/common code
│   ├── components/                # Reusable UI components
│   │   ├── ui/                    # Basic UI components
│   │   │   ├── Button.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── Input.jsx
│   │   │   └── Card.jsx
│   │   │
│   │   ├── layout/                # Layout components
│   │   │   ├── PageTransition.jsx
│   │   │   ├── ErrorBoundary.jsx
│   │   │   └── SlideInMenu.jsx
│   │   │
│   │   └── feedback/              # User feedback components
│   │       ├── SavePrompt.jsx
│   │       ├── GuestBanner.jsx
│   │       └── LoadingSpinner.jsx
│   │
│   ├── hooks/                     # Shared custom hooks
│   │   ├── useTheme.js
│   │   ├── useDebounce.js
│   │   └── useLocalStorage.js
│   │
│   └── utils/                     # Utility functions
│       ├── logger.js              # Logging utility
│       ├── validators.js          # Validation functions
│       ├── formatters.js          # Data formatting
│       └── constants.js           # Application constants
│
├── assets/                        # Static assets
│   ├── images/
│   ├── fonts/
│   ├── icons/
│   └── animations/
│
├── styles/                        # Global styles
│   ├── globals.css
│   ├── themes/
│   │   ├── light.css
│   │   └── dark.css
│   │
│   └── utilities/
│       └── tailwind-custom.css
│
├── wasm/                          # WebAssembly modules
│   ├── nlprule_wasm.js
│   ├── nlprule_wasm_bg.js
│   ├── nlprule_wasm_bg.wasm
│   └── en.bin
│
├── App.jsx                        # Main application component
├── main.jsx                       # Application entry point
└── routes.jsx                     # Route definitions

```

## 🎯 Design Patterns Used

### 1. **Repository Pattern**
- **Location**: `core/services/notes/NotesRepository.js`
- **Purpose**: Abstracts data access layer, allowing easy switching between storage backends
- **Implementation**: Single interface for all data operations

### 2. **Strategy Pattern**
- **Location**: `core/services/storage/*Adapter.js`
- **Purpose**: Interchangeable storage implementations (LocalStorage, Firestore)
- **Implementation**: Common `StorageAdapter` base class with multiple implementations

### 3. **Facade Pattern**
- **Location**: `features/grammar/core/GrammarController.js`
- **Purpose**: Simplifies complex grammar system with single entry point
- **Implementation**: Unified API hiding multiple engines and services

### 4. **Factory Pattern**
- **Location**: `features/grammar/engines/EngineFactory.js`
- **Purpose**: Creates appropriate grammar engine based on availability
- **Implementation**: Returns WASM engine or fallback based on conditions

### 5. **Plugin Pattern**
- **Location**: `features/editor/plugins/*` and `features/editor/extensions/*`
- **Purpose**: Extensible editor functionality
- **Implementation**: Self-contained plugins with clear interfaces

### 6. **Observer Pattern**
- **Location**: Throughout using React Context API
- **Purpose**: State management and component updates
- **Implementation**: Context providers notify subscribers of changes

### 7. **Singleton Pattern**
- **Location**: Core services (GrammarController, NotesRepository)
- **Purpose**: Ensure single instance of critical services
- **Implementation**: Factory functions returning single instance

## 🔌 Plugin Architecture

### Adding a New Feature

1. **Create feature directory** in `features/`
2. **Structure**:
   ```
   features/your-feature/
   ├── core/           # Core logic
   ├── components/     # UI components
   ├── hooks/          # Custom hooks
   ├── services/       # Business logic
   └── pages/          # Pages (if needed)
   ```

3. **Export from index**:
   ```javascript
   // features/your-feature/index.js
   export { default as YourFeature } from './components/YourFeature';
   export { useYourFeature } from './hooks/useYourFeature';
   ```

4. **Register in App.jsx**

### Adding a Grammar Engine

1. **Create engine class** in `features/grammar/engines/`
2. **Extend BaseEngine**:
   ```javascript
   class MyEngine extends BaseEngine {
     async checkText(text) { ... }
     getName() { return 'my-engine'; }
   }
   ```

3. **Register in EngineFactory**

## 📦 Module Dependencies

### Core → Features (❌ NO)
Core modules should never import from features.

### Features → Core (✅ YES)
Features can use core services and state.

### Features → Features (⚠️ LIMITED)
Features should be independent. Use core services for communication.

### Shared → Anywhere (✅ YES)
Shared utilities can be used anywhere.

### Anywhere → Shared (✅ YES)
Any module can import shared code.

## 🧪 Testing Strategy

```
tests/
├── unit/           # Unit tests for services
├── integration/    # Integration tests for features
└── e2e/           # End-to-end tests
```

## 🚀 Getting Started

1. **Core Services**: Start in `core/services/`
2. **Features**: Browse `features/` for specific functionality
3. **Shared Code**: Check `shared/` for reusable components
4. **Configuration**: Modify `core/config/` for settings

## 📚 Key Principles

1. **Single Responsibility**: Each file has one clear purpose
2. **Open/Closed**: Open for extension, closed for modification
3. **Dependency Inversion**: Depend on abstractions, not concretions
4. **Interface Segregation**: Many specific interfaces over one general
5. **DRY**: Don't Repeat Yourself - shared code in `shared/`
6. **Separation of Concerns**: Clear boundaries between features
7. **Plugin Architecture**: Easy to add/remove features

## 🔄 Migration Status

- ✅ Core services organized
- ✅ Storage adapters created
- ✅ Grammar system modularized
- ⏳ Components being reorganized
- ⏳ Legacy code being cleaned up

---

**Last Updated**: November 17, 2025
