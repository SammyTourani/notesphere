#!/bin/bash

# Fix PinButton.jsx - rewrite the first 3 lines properly
cat > /tmp/pinbutton_header.txt << 'EOF'
import React, { useState, useRef, useEffect } from 'react';
import { useNotes } from '../../../core/state/NotesContext';
import { motion, AnimatePresence } from 'framer-motion';
EOF

# Extract everything after line 3
tail -n +4 src/features/notes/components/PinButton.jsx > /tmp/pinbutton_body.txt

# Combine them
cat /tmp/pinbutton_header.txt /tmp/pinbutton_body.txt > src/features/notes/components/PinButton.jsx

# Fix TrashView.jsx
cat > /tmp/trashview_header.txt << 'EOF'
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotes } from '../../../core/state/NotesContext';
import DeleteConfirmationModal from './DeleteModal';
import { motion, AnimatePresence } from 'framer-motion';
import PageTransition from '../../../shared/components/layout/PageTransition';
EOF

tail -n +7 src/features/notes/components/TrashView.jsx > /tmp/trashview_body.txt
cat /tmp/trashview_header.txt /tmp/trashview_body.txt > src/features/notes/components/TrashView.jsx

# Fix GrammarController - it still has wrong import
sed -i '' "s|import AdvancedGrammarService from './AdvancedGrammarService.js';|import AdvancedGrammarService from '../engines/WasmEngine.js';|" src/features/grammar/core/GrammarController.js

# Fix ProtectedRoute - it's looking for GuestBanner in wrong place  
sed -i '' 's|import GuestBanner from "./GuestBanner";|import GuestBanner from "../../../shared/components/feedback/GuestBanner";|' src/features/auth/components/ProtectedRoute.jsx

# Fix ErrorBoundary logger path
sed -i '' 's|from "../utils/logger"|from "../../utils/logger"|' src/shared/components/layout/ErrorBoundary.jsx

echo "✅ Fixed corrupted imports!"
