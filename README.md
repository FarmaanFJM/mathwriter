# MathWriter

A local-first desktop notes application with integrated mathematical notation tools. Write notes with beautifully rendered math expressions without ever seeing LaTeX code.

![MathWriter](./electron-vite-vue.gif)

## Features

- **Local-First**: All notes are saved locally on your machine with automatic persistence
- **Block-Based Editor**: Rich text editing with paragraph and math blocks
- **Visual Math Tools**: Insert matrices, vectors, symbols, integrals, and more using graphical builders
- **No LaTeX Exposure**: Math notation is created visually and rendered beautifully
- **Re-editable Math**: Click any math block to edit it using the same visual tools
- **Light/Dark Theme**: Toggle between light and dark modes
- **Keyboard Shortcuts**: Efficient navigation and note management
- **Cross-Platform**: Works on Windows, macOS, and Linux

## Tech Stack

- **Electron** - Desktop application framework
- **Vue 3** - Reactive UI framework with Composition API
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **Pinia** - State management
- **KaTeX** - Fast math rendering

## Installation

### Prerequisites

- Node.js 18+ (recommended: 22.x)
- pnpm (recommended) or npm

### Setup

```bash
# Clone the repository
git clone https://github.com/FarmaanFJM/mathwriter.git
cd mathwriter

# Install dependencies
pnpm install

# Run in development mode
pnpm run dev

# Build for production
pnpm run build
```

## Usage

### Creating Notes

1. Click **"+ New Note"** in the left sidebar
2. Edit the note title at the top of the editor
3. Type in paragraph blocks or insert math blocks

### Adding Math

1. Use the **Math Tools** panel on the right
2. Choose from five categories:
   - **Matrices**: Build matrices with custom dimensions
   - **Vectors**: Create column or row vectors
   - **Symbols**: Insert Greek letters, operators, and special symbols
   - **Calculus**: Build integrals and other calculus notation
   - **Templates**: Create fractions, exponents, subscripts, and brackets
3. Click **"Insert Block"** for display math or **"Insert Inline"** for inline math

### Editing Math

1. Click on any math block in the editor
2. The Math Tools panel switches to **Edit Mode**
3. Modify the values or structure
4. Click **"Update"** to apply changes
5. Press **Escape** to exit edit mode

### Keyboard Shortcuts

- **Ctrl/Cmd + N**: Create new note
- **Ctrl/Cmd + F**: Focus search
- **Ctrl/Cmd + S**: Manual save (auto-save is always active)
- **Escape**: Exit math edit mode
- **Enter**: Create new paragraph (in editor)
- **Backspace**: Delete empty paragraph (in editor)

## Architecture

### Directory Structure

```
mathwriter/
├── electron/
│   ├── main/
│   │   ├── index.ts          # Electron main process
│   │   └── noteStorage.ts    # File-based note storage
│   └── preload/
│       └── index.ts          # Secure IPC bridge
├── src/
│   ├── components/
│   │   ├── NotesList.vue     # Left sidebar note list
│   │   ├── Editor.vue        # Center pane editor
│   │   ├── MathTools.vue     # Right sidebar math tools
│   │   └── math-builders/    # Individual math builder components
│   ├── stores/
│   │   ├── notesStore.ts     # Notes state management
│   │   ├── editorStore.ts    # Editor state
│   │   └── mathBuilderStore.ts # Math builder state
│   ├── types/
│   │   └── index.ts          # TypeScript type definitions
│   ├── utils/
│   │   └── mathConverter.ts  # AST to LaTeX conversion
│   ├── composables/
│   │   └── useKeyboardShortcuts.ts # Keyboard shortcuts
│   ├── App.vue               # Main application component
│   ├── main.ts               # Vue app entry point
│   └── style.css             # Global styles with CSS variables
└── package.json
```

### Data Model

#### Note Structure

```typescript
interface Note {
  id: string;
  title: string;
  content: ContentBlock[];
  createdAt: number;
  updatedAt: number;
}
```

#### Content Blocks

```typescript
type ContentBlock = ParagraphBlock | MathBlock;

interface ParagraphBlock {
  type: 'paragraph';
  id: string;
  text: string;
}

interface MathBlock {
  type: 'math';
  id: string;
  inline: boolean;
  ast: MathAst;
  latex: string;
}
```

#### Math AST

Math expressions are stored as Abstract Syntax Trees (AST) for reliable re-editing:

- **Symbol**: Greek letters, operators, special symbols
- **Number**: Numeric values
- **Identifier**: Variables (x, y, A, etc.)
- **Matrix**: 2D array with rows and columns
- **Vector**: 1D array with orientation (row/column)
- **Fraction**: Numerator and denominator
- **Exponent**: Base and power
- **Subscript**: Base and subscript value
- **Integral**: Body, bounds, and differential variable
- **Wrapper**: Parentheses, norms, square roots

### Storage

Notes are stored as JSON files in the Electron app data directory:

- **Windows**: `%APPDATA%/electron-vue-vite/notes/`
- **macOS**: `~/Library/Application Support/electron-vue-vite/notes/`
- **Linux**: `~/.config/electron-vue-vite/notes/`

Each note is saved as `<id>.json`, with an `index.json` file tracking all notes.

### Security

- **Context Isolation**: Enabled for security
- **Preload Bridge**: Secure IPC communication between main and renderer
- **No Remote Content**: All resources are local
- **No Node Integration in Renderer**: Prevents security vulnerabilities

## Development

### Project Setup

The project uses:
- **Vite** for fast development and building
- **TypeScript** for type safety
- **ESLint** for code quality (optional)
- **Pinia** for predictable state management
- **Vue 3 Composition API** for reactive components

### Adding New Math Builders

1. Create a new component in `src/components/math-builders/`
2. Add the AST type to `src/types/index.ts`
3. Implement AST to LaTeX conversion in `src/utils/mathConverter.ts`
4. Add builder methods to `src/stores/mathBuilderStore.ts`
5. Register the tab in `src/components/MathTools.vue`

### Customizing Themes

Edit CSS variables in `src/style.css`:

```css
:root {
  --color-accent: #228be6;
  --spacing-md: 16px;
  /* ... more variables */
}
```

## Building for Production

```bash
# Build the application
pnpm run build

# Output will be in dist/ and dist-electron/
# Packaged app will be in release/ (configured in electron-builder.json5)
```

### Distribution

The app can be packaged for:
- Windows (NSIS installer, portable)
- macOS (DMG, app)
- Linux (AppImage, deb, rpm)

Configure distribution in `electron-builder.json5`.

## Roadmap

### Current Version (v0 "Basics")

✅ Local file-based storage  
✅ Block-based editor  
✅ Visual math builders  
✅ Math block re-editing  
✅ Light/dark theme  
✅ Keyboard shortcuts  

### Future Enhancements

- [ ] Full LaTeX parsing for imported content
- [ ] Computer Algebra System (CAS) integration
- [ ] Graphing calculator
- [ ] Cloud sync (optional)
- [ ] Plugin system
- [ ] Export to PDF/LaTeX
- [ ] Collaborative editing
- [ ] Mobile companion app

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes with clear commit messages
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [electron-vite-vue](https://github.com/electron-vite/electron-vite-vue) template
- Math rendering by [KaTeX](https://katex.org/)
- Icons and design inspired by Notion and Desmos

## Support

For issues, questions, or feature requests, please open an issue on GitHub.

---

**Made with ❤️ for math enthusiasts and note-takers**
