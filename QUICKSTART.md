# MathWriter Quick Start Guide

Get up and running with MathWriter in 5 minutes!

## Installation

### Prerequisites

- **Node.js 18+** (recommended: 22.x)
- **pnpm** (recommended) or npm

Install pnpm if you don't have it:
```bash
npm install -g pnpm
```

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/FarmaanFJM/mathwriter.git
   cd mathwriter
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Run the app**
   ```bash
   pnpm run dev
   ```

The app will launch automatically!

## First Steps

### 1. Explore the Welcome Notes

When you first launch MathWriter, you'll see two example notes:
- **Welcome to MathWriter**: Introduction to the app
- **Example: Linear Algebra**: Sample math notation

Click on these notes to see how math blocks are rendered.

### 2. Create Your First Note

1. Click **"+ New Note"** in the left sidebar
2. Edit the title at the top
3. Start typing in the paragraph block

### 3. Insert Your First Math Block

Let's create a simple 2×2 matrix:

1. Go to the **Math Tools** panel on the right
2. Click the **Matrices** tab
3. Click the **2×2** button
4. Fill in the cells:
   - Row 1: `1`, `2`
   - Row 2: `3`, `4`
5. Click **"Insert Block"**

You'll see a beautifully rendered matrix in your note!

### 4. Edit a Math Block

1. Click on the matrix you just created
2. The Math Tools panel switches to **Edit Mode**
3. Change any cell value
4. Click **"Update"**
5. Press **Escape** to exit edit mode

## Common Tasks

### Insert a Vector

1. Go to **Vectors** tab
2. Choose size (e.g., **3D**)
3. Fill in values: `x`, `y`, `z`
4. Choose **Column** or **Row** orientation
5. Click **"Insert Block"**

### Insert Symbols

1. Go to **Symbols** tab
2. Browse categories:
   - Greek Letters (α, β, π, etc.)
   - Operators (+, ×, ÷, etc.)
   - Relations (=, ≤, ≥, etc.)
   - Special Symbols (∞, ∑, ∫, etc.)
3. Click any symbol to insert it inline

### Create an Integral

1. Go to **Calculus** tab
2. Fill in:
   - **Integrand**: `x^2`
   - **Differential variable**: `x`
   - **Lower bound**: `0` (optional)
   - **Upper bound**: `1` (optional)
3. Click **"Insert Block"**

### Create a Fraction

1. Go to **Templates** tab
2. Under **Fraction**:
   - **Numerator**: `a + b`
   - **Denominator**: `c`
3. Click **"Insert Block"**

## Keyboard Shortcuts

- **Ctrl/Cmd + N**: Create new note
- **Ctrl/Cmd + F**: Focus search
- **Escape**: Exit math edit mode
- **Enter**: Create new paragraph (in editor)
- **Backspace**: Delete empty paragraph (in editor)

## Tips & Tricks

### Quick Matrix Presets

Use the preset buttons for common sizes:
- **2×2**: Identity matrices, transformations
- **3×3**: 3D transformations, systems of equations
- **2×3** or **3×2**: Non-square matrices

### Quick Fill Options

In Matrix and Vector builders:
- **Identity**: Creates an identity matrix
- **Zeros**: Fills all cells with 0
- **Ones**: Fills all cells with 1
- **Sequence**: Fills with 1, 2, 3, ...
- **Clear**: Empties all cells

### Theme Toggle

Click the 🌙 or ☀️ icon in the top-right to switch between light and dark themes.

### Search Notes

Use the search box at the top of the left sidebar to filter notes by title.

## Where Are My Notes Stored?

Notes are saved locally on your computer:

- **Windows**: `%APPDATA%/electron-vue-vite/notes/`
- **macOS**: `~/Library/Application Support/electron-vue-vite/notes/`
- **Linux**: `~/.config/electron-vue-vite/notes/`

Each note is a JSON file, and there's an `index.json` file tracking all notes.

## Building for Production

To create a distributable app:

```bash
pnpm run build
```

This will:
1. Compile TypeScript
2. Bundle the app with Vite
3. Package with Electron Builder
4. Output to `release/` directory

## Troubleshooting

### App won't start

1. Make sure you have Node.js 18+ installed:
   ```bash
   node --version
   ```

2. Delete `node_modules` and reinstall:
   ```bash
   rm -rf node_modules
   pnpm install
   ```

3. Clear the build cache:
   ```bash
   rm -rf dist dist-electron
   ```

### Math not rendering

1. Check browser console for errors (DevTools: Ctrl+Shift+I)
2. Verify KaTeX is installed:
   ```bash
   pnpm list katex
   ```

### Notes not saving

1. Check file permissions in the notes directory
2. Look for errors in the Electron console
3. Try creating a new note to test

## Next Steps

- Read the full [README.md](README.md) for detailed features
- Check out [ARCHITECTURE.md](ARCHITECTURE.md) for technical details
- Explore the code in `src/components/` to customize the UI
- Add your own math builders in `src/components/math-builders/`

## Getting Help

- **Issues**: [GitHub Issues](https://github.com/FarmaanFJM/mathwriter/issues)
- **Discussions**: [GitHub Discussions](https://github.com/FarmaanFJM/mathwriter/discussions)

## What's Next?

Now that you're up and running, try:

1. **Create a study note** with formulas from your coursework
2. **Document a proof** using matrices and symbols
3. **Build a formula sheet** for quick reference
4. **Customize the theme** by editing `src/style.css`

Happy math writing! ✨📐
