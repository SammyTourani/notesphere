# File Migration Map

## Overview

This document tracks all file movements during the architecture reorganization.

## Configuration Files

| Old Path | New Path | Status |
|----------|----------|--------|
| `src/firebaseConfig.js` | `src/core/config/firebase.config.js` | ✅ Moved |
| N/A | `src/core/config/app.config.js` | ✅ Created |
| N/A | `src/core/config/routes.config.js` | ✅ Created |

## Context (State Management)

| Old Path | New Path | Status |
|----------|----------|--------|
| `src/context/AuthContext.jsx` | `src/core/state/AuthContext.jsx` | ✅ Moved |
| `src/context/NotesContext.jsx` | `src/core/state/NotesContext.jsx` | ✅ Moved |
| `src/context/ThemeContext.jsx` | `src/core/state/ThemeContext.jsx` | ✅ Moved |
| `src/context/FontContext.jsx` | `src/core/state/FontContext.jsx` | ✅ Moved |

## Core Services

| Old Path | New Path | Status |
|----------|----------|--------|
| `src/services/NotesRepository.js` | `src/core/services/notes/NotesRepository.js` | ✅ Moved |
| `src/services/NotesService.js` | `src/core/services/notes/NotesService.js` | ✅ Moved |
| `src/services/SyncEngine.js` | `src/core/services/notes/SyncEngine.js` | ✅ Moved |
| `src/services/storage/` | `src/core/services/storage/` | ✅ Moved |

## Grammar Feature

| Old Path | New Path | Status |
|----------|----------|--------|
| `src/services/UnifiedGrammarController.js` | `src/features/grammar/core/GrammarController.js` | ✅ Moved |
| `src/services/AdvancedGrammarService.js` | `src/features/grammar/engines/WasmEngine.js` | ✅ Moved |
| `src/services/GrammarFallback.js` | `src/features/grammar/engines/FallbackEngine.js` | ✅ Moved |
| `src/services/GrammarEngine.js` | `src/features/grammar/engines/LegacyEngine.js` | ✅ Moved |
| `src/services/CommandBasedReplacer.js` | `src/features/grammar/services/ReplacementService.js` | ✅ Moved |
| `src/services/SuggestionIntelligenceService.js` | `src/features/grammar/services/SuggestionService.js` | ✅ Moved |
| `src/components/editor/AdvancedGrammarInsights.jsx` | `src/features/grammar/components/GrammarInsights.jsx` | ✅ Moved |
| `src/components/editor/InteractiveGrammarHighlighter.jsx` | `src/features/grammar/components/GrammarHighlighter.jsx` | ✅ Moved |
| `src/hooks/useGrammarIntegration.js` | `src/features/grammar/hooks/useGrammarIntegration.js` | ✅ Moved |

## Editor Feature

| Old Path | New Path | Status |
|----------|----------|--------|
| `src/extensions/GrammarExtension.js` | `src/features/editor/extensions/GrammarExtension.js` | ✅ Moved |
| `src/components/editor/TipTapEditor.jsx` | `src/features/editor/core/TipTapEditor.jsx` | ✅ Moved |
| `src/components/editor/EditorToolbar.jsx` | `src/features/editor/core/EditorToolbar.jsx` | ✅ Moved |
| `src/components/editor/WordCountDisplay.jsx` | `src/features/editor/plugins/WordCountDisplay.jsx` | ✅ Moved |
| `src/hooks/useTipTapEditor.js` | `src/features/editor/hooks/useTipTapEditor.js` | ✅ Moved |

## Auth Feature

| Old Path | New Path | Status |
|----------|----------|--------|
| `src/components/Login.jsx` | `src/features/auth/components/Login.jsx` | ✅ Moved |
| `src/components/AuthAnimation.jsx` | `src/features/auth/components/AuthAnimation.jsx` | ✅ Moved |
| `src/components/GuestRoute.jsx` | `src/features/auth/components/GuestRoute.jsx` | ✅ Moved |
| `src/components/ProtectedRoute.jsx` | `src/features/auth/components/ProtectedRoute.jsx` | ✅ Moved |
| `src/pages/Login.jsx` | `src/features/auth/pages/LoginPage.jsx` | ✅ Moved |
| `src/pages/SignUp.jsx` | `src/features/auth/pages/SignUpPage.jsx` | ✅ Moved |
| `src/pages/UserOnboarding.jsx` | `src/features/auth/pages/OnboardingPage.jsx` | ✅ Moved |

## Notes Feature

| Old Path | New Path | Status |
|----------|----------|--------|
| `src/components/NoteCardEnhanced.jsx` | `src/features/notes/components/NoteCard.jsx` | ✅ Moved |
| `src/components/NotesListOptimized.jsx` | `src/features/notes/components/NotesList.jsx` | ✅ Moved |
| `src/components/TrashView.jsx` | `src/features/notes/components/TrashView.jsx` | ✅ Moved |
| `src/components/PinButton.jsx` | `src/features/notes/components/PinButton.jsx` | ✅ Moved |
| `src/components/DeleteConfirmationModal.jsx` | `src/features/notes/components/DeleteModal.jsx` | ✅ Moved |
| `src/components/SingleNoteEditor.jsx` | `src/features/notes/pages/NoteEditorPage.jsx` | ✅ Moved |
| `src/hooks/useNoteEditor.js` | `src/features/notes/hooks/useNoteEditor.js` | ✅ Moved |
| `src/hooks/useAutoSave.js` | `src/features/notes/hooks/useAutoSave.js` | ✅ Moved |

## Settings Feature

| Old Path | New Path | Status |
|----------|----------|--------|
| `src/components/Settings.jsx` | `src/features/settings/components/Settings.jsx` | ✅ Moved |
| `src/components/ThemeToggle.jsx` | `src/features/settings/components/ThemeToggle.jsx` | ✅ Moved |
| `src/components/FloatingThemeToggle.jsx` | `src/features/settings/components/FloatingThemeToggle.jsx` | ✅ Moved |
| `src/components/FontPreview.jsx` | `src/features/settings/components/FontPreview.jsx` | ✅ Moved |
| `src/components/UserProfile.jsx` | `src/features/settings/components/UserProfile.jsx` | ✅ Moved |
| `src/pages/SettingsPage.jsx` | `src/features/settings/pages/SettingsPage.jsx` | ✅ Moved |

## Landing Feature

| Old Path | New Path | Status |
|----------|----------|--------|
| `src/components/LandingPage.jsx` | `src/features/landing/components/LandingPage.jsx` | ✅ Moved |
| `src/pages/LandingPage.jsx` | `src/features/landing/pages/LandingPage.jsx` | ✅ Moved |

## Shared Components

| Old Path | New Path | Status |
|----------|----------|--------|
| `src/components/PageTransition.jsx` | `src/shared/components/layout/PageTransition.jsx` | ✅ Moved |
| `src/components/ErrorBoundary.jsx` | `src/shared/components/layout/ErrorBoundary.jsx` | ✅ Moved |
| `src/components/SlideInMenu.jsx` | `src/shared/components/layout/SlideInMenu.jsx` | ✅ Moved |
| `src/components/SavePrompt.jsx` | `src/shared/components/feedback/SavePrompt.jsx` | ✅ Moved |
| `src/components/GuestBanner.jsx` | `src/shared/components/feedback/GuestBanner.jsx` | ✅ Moved |
| `src/components/MergeOptions.jsx` | `src/shared/components/feedback/MergeOptions.jsx` | ✅ Moved |

## Shared Hooks

| Old Path | New Path | Status |
|----------|----------|--------|
| `src/hooks/useTheme.js` | `src/shared/hooks/useTheme.js` | ✅ Moved |

## Shared Utils

| Old Path | New Path | Status |
|----------|----------|--------|
| `src/utils/logger.js` | `src/shared/utils/logger.js` | ✅ Moved |
| `src/utils/noteUtils.js` | `src/shared/utils/noteUtils.js` | ✅ Moved |

## Files to be Cleaned Up

### Legacy/Deprecated Files (Can be deleted)
- `src/components/NoteCard.jsx` (replaced by NoteCardEnhanced)
- `src/components/NotesListPremium.jsx` (duplicate)
- `src/components/NotesList.jsx` (deprecated)
- `src/components/NoteEditor.jsx` (empty file)
- `src/services/grammarService.js` (old service)
- `src/services/ProfessionalGrammarEngine.js` (unused)
- `src/services/UltimateGrammarService.js` (unused)
- `src/services/UltimateGrammarSystemV2.js` (unused)
- `src/services/UltimateGrammarRules.js` (unused)
- `src/services/SimpleGrammarRules.js` (unused)
- `src/services/CustomGrammarRules.js` (unused)
- `src/services/MultiEngineGrammarService.ts` (unused)
- `src/services/TestGrammarDebug.js` (test file)
- `src/services/test-grammar.js` (test file)
- `src/utils/GrammarReplacementTester.js` (test file)

### Unused Editor Components (Can be deleted)
- `src/components/editor/GrammarPro.jsx`
- `src/components/editor/EmbeddedGrammarSidebar.jsx`
- `src/components/editor/MinimalistGrammarPanel.jsx`
- `src/components/editor/EditorMenuButton.jsx`
- `src/components/editor/PremiumFloatingGrammarButton.jsx`
- `src/components/editor/NoFramerGrammarButton.jsx`
- `src/components/editor/PremiumGrammarPanel.jsx`
- `src/components/editor/UltimateGrammarUI.jsx`
- `src/components/editor/GrammarChecker.jsx`
- `src/components/editor/FloatingGrammarButton.jsx`
- `src/components/editor/PremiumGrammarSystem.jsx`

## Import Path Updates Needed

### Update `from '../context/...'` to `from '@/core/state/...'`
- All files importing from context

### Update `from '../firebaseConfig'` to `from '@/core/config/firebase.config'`
- All files importing Firebase config

### Update `from '../services/...'` to appropriate feature
- Grammar imports → `@/features/grammar`
- Notes imports → `@/core/services/notes`

### Update `from '../components/...'` to appropriate feature or shared
- Auth components → `@/features/auth`
- Notes components → `@/features/notes`
- Editor components → `@/features/editor`
- Settings components → `@/features/settings`
- Layout components → `@/shared/components/layout`
- Feedback components → `@/shared/components/feedback`

### Update `from '../hooks/...'` to appropriate location
- Feature-specific hooks → `@/features/{feature}/hooks`
- Shared hooks → `@/shared/hooks`

### Update `from '../utils/...'` to `from '@/shared/utils/...'`
- All utility imports

## Next Steps

1. ✅ Physical file movement complete
2. ⏳ Update import paths in all moved files
3. ⏳ Test all features to ensure nothing broke
4. ⏳ Delete deprecated/unused files
5. ⏳ Update documentation
6. ⏳ Create migration guide for contributors

---

**Last Updated**: November 17, 2025
