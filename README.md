# Gantha (ဂန္ထ)

Just Another Markdown to Website builder designed for books, especially Myanmar content.

Gantha is a static site generator written in TypeScript that converts Markdown files into beautiful, book-like websites. It's built to run with Bun and focuses on creating ebook-style layouts perfect for documentation, books, and long-form content.

## Features

- 📚 **Book-focused design** - Clean, readable layouts optimized for long-form content
- 🇲🇲 **Myanmar language support** - Specifically designed for Myanmar content
- ⚡ **Fast builds** - Powered by Bun for quick compilation
- 📝 **Markdown-based** - Write content in simple Markdown format
- 🎨 **Customizable fonts and styling** - Easy font configuration and styling options
- 📖 **Table of contents** - Automatic navigation generation
- 🔧 **TypeScript** - Type-safe development experience

## Prerequisites

- [Bun](https://bun.sh/) runtime (recommended) or Node.js
- Basic knowledge of Markdown

## Installation

1. Clone the repository:
```bash
git clone https://github.com/saturngod/gantha.git
cd gantha
```

2. Install dependencies:
```bash
bun install
```

Or with npm:
```bash
npm install
```

## Quick Start

1. **Add your content**: Place your Markdown files in the `md/` folder
2. **Update the table of contents**: Edit `toc.json` to include your chapters
3. **Build the site**: Run the build command
4. **View your book**: Open the generated HTML files in the `build/` folder

## Usage

### Adding Content

1. Create Markdown files in the `md/` directory:
```
md/
├── introduction.md
├── chapter1.md
├── chapter2.md
└── conclusion.md
```

2. Update `toc.json` to define your book structure:
```json
{
    "title": "Your Book Title",
    "chapters": [
        {
            "id": "intro",
            "title": "Introduction",
            "subtitle": "Getting started",
            "file": "introduction.md"
        },
        {
            "id": "chapter1",
            "title": "Chapter 1",
            "subtitle": "First chapter",
            "file": "chapter1.md"
        }
    ]
}
```

### Building Your Site

Build the static website:
```bash
bun run build
```

Or with npm:
```bash
npm run build
```

The generated static HTML files will be available in the `build/` folder.

### Development

For development with auto-reload:
```bash
bun run dev
```

Clean the build directory:
```bash
bun run clean
```

## Project Structure

```
gantha/
├── md/                 # Markdown source files
├── template/           # HTML templates and assets
│   ├── index.html
│   ├── scripts/
│   └── styles/
├── build/              # Generated static site
├── toc.json           # Table of contents configuration
├── app.ts             # Main build script
├── package.json
└── tsconfig.json
```

## Configuration

### Table of Contents

Edit `toc.json` to configure your book structure:

- `title`: The main title of your book
- `chapters`: Array of chapter objects
  - `id`: Unique identifier for the chapter
  - `title`: Chapter title
  - `subtitle`: Optional chapter subtitle
  - `file`: Markdown file name (relative to `md/` folder)

### Styling

- Customize fonts in `template/styles/fonts.css`
- Modify the main styles in `template/styles/styles.css`
- Font configuration is available through the built-in font selector

## Dependencies

- **marked**: Markdown parser
- **fs-extra**: Enhanced file system operations
- **clean-css**: CSS minification
- **terser**: JavaScript minification
- **elasticlunr**: Lightweight full-text search engine

## Development Dependencies

- **TypeScript**: Type-safe JavaScript
- **@types/fs-extra**: TypeScript definitions for fs-extra
- **@types/node**: TypeScript definitions for Node.js

## License

MIT License

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Search

Gantha includes built-in full-text search powered by [Elasticlunr.js](http://elasticlunr.com/). The search index is automatically generated during `bun run build`.

### Myanmar Text Support

Elasticlunr uses English tokenization by default, which doesn't work for Myanmar script (no spaces between words). Gantha includes a custom **Myanmar syllable tokenizer** that breaks text into searchable syllables using Unicode-aware regex patterns:

```javascript
// Myanmar consonants: က-အ
const myConsonant = "\u1000-\u1021";
const ssSymbol = "\u1039";  // subscript symbol
const aThat = "\u103a";     // a-That character

// Syllable break pattern - splits on consonants not after subscript 
// AND not followed by a-That or subscript
const BREAK_PATTERN = new RegExp(
  "((?!" + ssSymbol + ")[" + myConsonant + "](?![" + aThat + ssSymbol + "])|[a-zA-Z0-9...])", 
  "mg"
);
```

This tokenizes text like `"ဖန့်ရှင့်"` into syllables `["ဖန့်", "ရှင့်"]`, making Myanmar content fully searchable.

### How It Works

1. **Build time**: `app.ts` extracts text from each markdown file, tokenizes it into syllables using the Myanmar tokenizer, and builds the Elasticlunr index → saves to `search-index.json`
2. **Runtime**: Browser loads the pre-built index and registers the same Myanmar tokenizer for search queries
3. **Search**: User queries are tokenized into syllables and matched against the index

### Usage

- Click the 🔍 icon in the header or press **Cmd/Ctrl+K** to open search
- Type in English or Myanmar to find matching chapters
- Click a result to navigate to that page

> **Note**: Search requires an HTTP server to work (CORS restriction). Use `npx serve build` or similar to test locally.

## Credits

- **[sylbreak](https://github.com/ye-kyaw-thu/sylbreak)** - Myanmar syllable breaking algorithm by Ye Kyaw Thu
- **[Elasticlunr.js](http://elasticlunr.com/)** - Lightweight full-text search engine

## Keywords

`ebook`, `markdown`, `website`, `builder`, `myanmar`, `static-site-generator`, `book`, `documentation`
