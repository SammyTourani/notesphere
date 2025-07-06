# 📝 NoteSphere

A modern, intelligent note-taking application with advanced grammar checking capabilities.

## ✨ Features

### 📝 **Rich Text Editor**
- TipTap-powered editor with markdown support
- Real-time collaborative editing
- Rich formatting options (bold, italic, underline, highlights)
- Image and link support

### 🔍 **Advanced Grammar Checking**
- **Professional-grade grammar engine** powered by LanguageTool
- **Command-based text replacement** with full undo/redo support (Cmd+Z/Cmd+Y)
- **Smart suggestion system** with context-aware recommendations
- **Real-time checking** as you type
- **Formatting preservation** during grammar corrections

### 🔐 **Authentication & Sync**
- Firebase Authentication (Email/Password, Microsoft, Guest mode)
- Real-time cloud synchronization
- Offline support with local storage
- User profiles and onboarding

### 📱 **Modern UI/UX**
- Dark/Light theme support
- Responsive design for all devices
- Smooth animations with Framer Motion
- Intuitive navigation and user experience

### 📊 **Additional Features**
- Word count display
- Note pinning and organization
- Trash/restore functionality
- Guest mode for quick notes
- Performance-optimized with smart caching

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone [your-repo-url]
   cd notesphere
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file with your Firebase configuration:
   ```
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5173`

## 🔧 Grammar System Architecture

NoteSphere features a sophisticated grammar checking system built with modern best practices:

### **Command-Based Replacer**
- Uses TipTap's native command system for all text modifications
- Ensures proper undo/redo integration
- Preserves rich text formatting during replacements
- Professional editor behavior matching tools like Grammarly

### **Grammar Engine**
- Multi-layer caching system for performance
- Context-aware suggestions
- Advanced error categorization
- Real-time position tracking

### **Key Components**
- `CommandBasedReplacer.js` - Professional text replacement engine
- `GrammarEngine.js` - Advanced grammar checking with LanguageTool
- `UltimateGrammarUI.jsx` - Modern grammar interface
- `GrammarExtension.js` - TipTap extension for grammar integration

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite
- **Editor**: TipTap (ProseMirror-based)
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Backend**: Firebase (Firestore, Authentication)
- **Grammar**: LanguageTool API
- **Build Tool**: Vite
- **Language**: JavaScript (ES6+)

## 📖 Usage

1. **Create an account** or use guest mode
2. **Start writing** with the rich text editor
3. **Check grammar** using the grammar button (bottom-right)
4. **Apply suggestions** with confidence - full undo/redo support
5. **Organize notes** with pinning and folders
6. **Sync across devices** with automatic cloud storage

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

---

**Built with ❤️ for modern note-taking**
