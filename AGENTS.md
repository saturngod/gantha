# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Project Overview

Gantha is a TypeScript-based static site generator that converts Markdown files into beautiful, book-like websites optimized for Myanmar content. It's built to run with Bun and focuses on creating ebook-style layouts perfect for documentation, books, and long-form content.

## Development Commands

- **Build the site**: `bun run build` (or `npm run build`)
- **Development mode**: `bun run dev` (or `npm run dev`) - runs with auto-reload
- **Clean build directory**: `bun run clean` (or `npm run clean`)
- **Install dependencies**: `bun install` (or `npm install`)

## Architecture Overview

### Core Build Process (`app.ts`)

The main build script follows this workflow:

1. **Configuration**: Reads project structure from constants at the top
2. **Template Processing**: Uses simple string replacement with `{{placeholders}}`
3. **Markdown Conversion**: Uses `marked` library for parsing Markdown to HTML
4. **Asset Optimization**: Compresses CSS (clean-css) and JavaScript (terser)
5. **File Generation**: Creates HTML files with navigation and data injection

Key functions:
- `build()`: Main orchestrator that runs the entire build process
- `convertMarkdownToHTML()`: Converts markdown to HTML with Myanmar-friendly settings
- `compressCSS()` and `compressJS()`: Minify assets for production
- `generateDataJS()`: Creates JavaScript data structure from `toc.json`

### Content Structure

- **`toc.json`**: Defines book structure with chapters, titles, and file mappings
- **`md/`**: Contains source Markdown files and assets (images, etc.)
- **`template/`**: HTML template and client-side assets
- **`build/`**: Generated static site

### Template System

The template system uses simple placeholder replacement:
- `{{title}}`: Book title from toc.json
- `{{content}}`: Converted HTML from Markdown
- `{{prev-link}}` / `{{next-link}}`: Navigation between chapters

### Client-Side Architecture

The frontend is organized into modular JavaScript files:

- **`script.js`**: Main application logic, UI interactions, theme management
- **`fonts.js`**: Font configuration and options
- **`fontsize.js`**: Font size controls
- **`lineheight.js`**: Line height controls
- **`data.js`**: Auto-generated book structure from toc.json

Key features:
- **Theme System**: System/light/dark themes with localStorage persistence
- **Font Management**: Dynamic font loading with Myanmar language support
- **Reading Preferences**: Font size, line height, text alignment
- **Navigation**: Sidebar table of contents with current chapter highlighting

## File Naming Conventions

- First chapter in toc.json becomes `index.html`
- Other chapters use their markdown filename with `.html` extension
- All assets in `md/` subdirectories are copied to `build/` as-is

## Build Output Structure

```
build/
├── index.html (first chapter)
├── chapter2.html (other chapters)
├── styles/ (compressed CSS)
├── scripts/ (compressed JS + generated data.js)
└── [any folders from md/] (images, etc.)
```

## Dependencies and Their Purpose

- **marked**: Markdown parser with GitHub-flavored markdown support
- **fs-extra**: Enhanced file system operations for copying, ensuring directories
- **clean-css**: CSS minification for production builds
- **terser**: JavaScript minification and mangling

## Development Notes

- The build system automatically copies directories from `md/` to `build/` (useful for images)
- Template uses Font Awesome icons and Highlight.js for syntax highlighting
- Myanmar language support is built into the font system and CSS
- All client-side preferences persist in localStorage
- The system theme automatically responds to OS dark/light mode preferences

## Common Development Tasks

When working with this codebase:

1. **Adding new chapters**: Add to `toc.json` and create corresponding `.md` file
2. **Styling changes**: Modify `template/styles/styles.css` and rebuild
3. **Font changes**: Update `template/styles/fonts.css` and `template/scripts/fonts.js`
4. **Template modifications**: Edit `template/index.html` with placeholder tags
5. **Build customization**: Modify constants at the top of `app.ts`