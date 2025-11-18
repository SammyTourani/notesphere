# NoteSphere - Developer Guide

## 🏗️ Architecture Overview

NoteSphere follows a clean, modular architecture based on **feature-driven development** and **object-oriented design principles**.

### Key Architectural Decisions

1. **Feature-Based Structure**: Code is organized by features, not by technical layers
2. **Plugin Architecture**: Easy to add/remove features without affecting others
3. **Dependency Injection**: Core services are injected, not imported directly
4. **Single Responsibility**: Each module has one clear purpose
5. **Separation of Concerns**: UI, business logic, and data access are separate

## 📂 Directory Structure

```
src/
├── core/           → Core services and configuration (singleton pattern)
├── features/       → Feature modules (self-contained)
├── shared/         → Reusable components and utilities
├── assets/         → Static assets
├── styles/         → Global styles
└── wasm/           → WebAssembly modules
```

## 🎯 Core Principles

### 1. Import Rules

```javascript
// ✅ CORRECT: Import from feature index
import { NoteCard, NotesList } from '@/features/notes';

// ✅ CORRECT: Import from core index
import { useAuth, useNotes } from '@/core';

// ✅ CORRECT: Import from shared
import { PageTransition, createLogger } from '@/shared';

// ❌ WRONG: Direct imports bypass feature encapsulation
import NoteCard from '@/features/notes/components/NoteCard';
```

### 2. Feature Independence

Features should NOT import from other features directly. Use core services for communication:

```javascript
// ❌ WRONG: Feature-to-feature dependency
import { GrammarInsights } from '@/features/grammar';

// ✅ CORRECT: Use core service or context
const { grammarController } = useGrammarContext();
```

### 3. State Management

- **Local State**: Use `useState` for component-specific state
- **Feature State**: Use custom hooks within the feature
- **Global State**: Use Context API in `core/state/`

```javascript
// Component state
const [isOpen, setIsOpen] = useState(false);

// Feature state
const { notes, loading } = useNotes(); // from core/state

// Shared state across features
const { currentUser } = useAuth(); // from core/state
```

## 🔌 Adding a New Feature

### Step 1: Create Feature Structure

```bash
mkdir -p src/features/my-feature/{core,components,hooks,services,pages}
```

### Step 2: Create Feature Components

```javascript
// src/features/my-feature/components/MyComponent.jsx
export default function MyComponent() {
  return <div>My Feature</div>;
}
```

### Step 3: Create Feature Index

```javascript
// src/features/my-feature/index.js
export { default as MyComponent } from './components/MyComponent.jsx';
export { useMyFeature } from './hooks/useMyFeature.js';
```

### Step 4: Register in App

```javascript
// src/App.jsx
import { MyComponent } from '@/features/my-feature';
```

## 🧩 Design Patterns in Use

### Repository Pattern
**Location**: `core/services/notes/NotesRepository.js`

```javascript
// Abstracts data access
const repository = getNotesRepository();
const notes = await repository.getAllNotes();
```

### Strategy Pattern
**Location**: `core/services/storage/`

```javascript
// Interchangeable storage implementations
const adapter = isOnline 
  ? new FirestoreAdapter(userId)
  : new LocalStorageAdapter();
```

### Facade Pattern
**Location**: `features/grammar/core/GrammarController.js`

```javascript
// Simplifies complex subsystem
const controller = getGrammarController();
await controller.checkGrammar(text);
```

### Factory Pattern
**Location**: `features/grammar/engines/`

```javascript
// Creates appropriate engine
const engine = EngineFactory.create(config);
```

### Plugin Pattern
**Location**: `features/editor/plugins/`

```javascript
// Extensible functionality
const editor = new Editor({
  plugins: [WordCountPlugin, AutoSavePlugin]
});
```

## 📦 Module Dependencies

```
┌─────────────┐
│   Features  │  → Can use Core & Shared
└─────────────┘
       ↓
┌─────────────┐
│    Core     │  → Foundation layer
└─────────────┘
       ↓
┌─────────────┐
│   Shared    │  → Used everywhere
└─────────────┘
```

### Dependency Rules

1. **Core** → Only imports from other core modules
2. **Features** → Can import from Core and Shared
3. **Shared** → No dependencies on Features or Core
4. **Features** ↔ **Features** → ❌ Not allowed

## 🔧 Common Tasks

### Creating a New Component

```javascript
// 1. Create component file
// src/features/my-feature/components/MyComponent.jsx

import React from 'react';

export default function MyComponent({ prop1, prop2 }) {
  return <div>{prop1}</div>;
}

// 2. Export from feature index
// src/features/my-feature/index.js
export { default as MyComponent } from './components/MyComponent.jsx';

// 3. Use in app
import { MyComponent } from '@/features/my-feature';
```

### Creating a Custom Hook

```javascript
// 1. Create hook file
// src/features/my-feature/hooks/useMyFeature.js

export function useMyFeature() {
  const [state, setState] = useState(initialState);
  
  return { state, setState };
}

// 2. Export from feature index
export { useMyFeature } from './hooks/useMyFeature.js';

// 3. Use in component
const { state } = useMyFeature();
```

### Creating a Service

```javascript
// 1. Create service class
// src/features/my-feature/services/MyService.js

class MyService {
  async doSomething() {
    // Business logic here
  }
}

let instance = null;

export function getMyService() {
  if (!instance) {
    instance = new MyService();
  }
  return instance;
}

// 2. Use in component
import { getMyService } from '@/features/my-feature';

const service = getMyService();
await service.doSomething();
```

## 🧪 Testing

```
tests/
├── unit/           # Unit tests for individual functions
├── integration/    # Tests for feature interactions
└── e2e/           # End-to-end user flows
```

### Test File Naming

- `*.test.js` → Unit tests
- `*.integration.test.js` → Integration tests
- `*.e2e.test.js` → E2E tests

## 📝 Code Style

### File Naming

- Components: `PascalCase.jsx` (e.g., `NoteCard.jsx`)
- Services: `PascalCase.js` (e.g., `NotesService.js`)
- Utilities: `camelCase.js` (e.g., `formatDate.js`)
- Hooks: `use*.js` (e.g., `useNotes.js`)
- Config: `*.config.js` (e.g., `app.config.js`)

### Import Order

```javascript
// 1. External libraries
import React, { useState } from 'react';
import { motion } from 'framer-motion';

// 2. Core imports
import { useAuth } from '@/core';

// 3. Feature imports
import { NoteCard } from '@/features/notes';

// 4. Shared imports
import { PageTransition } from '@/shared';

// 5. Local imports
import styles from './MyComponent.module.css';
```

## 🚀 Getting Started

### 1. Clone and Install

```bash
git clone https://github.com/SammyTourani/notesphere.git
cd notesphere
npm install
```

### 2. Start Development Server

```bash
npm run dev
```

### 3. Explore the Code

- Start with `src/App.jsx` to see the app structure
- Check `ARCHITECTURE.md` for detailed architecture docs
- Browse `src/features/` to see feature modules

## 📚 Resources

- [Architecture Documentation](./ARCHITECTURE.md)
- [Component Library](./docs/components.md)
- [API Documentation](./docs/api.md)
- [Contributing Guide](./CONTRIBUTING.md)

## 🤝 Contributing

1. Create feature branch: `git checkout -b feature/my-feature`
2. Follow the architecture guidelines
3. Write tests for new features
4. Submit pull request

## ❓ Questions?

- Check the [FAQ](./docs/FAQ.md)
- Read the [Architecture Guide](./ARCHITECTURE.md)
- Open an [Issue](https://github.com/SammyTourani/notesphere/issues)

---

**Happy Coding! 🎉**
