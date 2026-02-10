import fs from 'fs-extra';
import path from 'path';
import { marked } from 'marked';
import CleanCSS from 'clean-css';
import { minify } from 'terser';

// Types
import { Chapter, BookData, Plugin, PluginContext } from './types';

class PluginManager {
  private hooks: {
    beforeBuild: (() => void | Promise<void>)[];
    afterBuild: (() => void | Promise<void>)[];
    processMarkdown: ((markdown: string) => string | Promise<string>)[];
    processHTML: ((html: string) => string | Promise<string>)[];
  } = {
      beforeBuild: [],
      afterBuild: [],
      processMarkdown: [],
      processHTML: []
    };

  constructor(private bookData: BookData, private projectRoot: string) { }

  async loadPlugins() {
    if (!this.bookData.plugins || this.bookData.plugins.length === 0) {
      return;
    }

    console.log('Loading plugins...');
    for (const pluginName of this.bookData.plugins) {
      try {
        // Resolve plugin path - check local first, then node_modules
        let pluginPath: string;
        if (pluginName.startsWith('./') || pluginName.startsWith('../')) {
          pluginPath = path.resolve(this.projectRoot, pluginName);
        } else {
          // Assume npm package
          pluginPath = pluginName;
        }

        console.log(`   Loading plugin: ${pluginName}`);

        // Dynamically import the plugin
        // Note: In Bun/Node, dynamic import works for both ESM and CJS if configured right.
        // We'll try standard import.
        const pluginModule = await import(pluginPath);
        const plugin = pluginModule.default || pluginModule;

        if (plugin && typeof plugin.init === 'function') {
          const context: PluginContext = {
            on: (hook, callback) => {
              if (this.hooks[hook]) {
                // @ts-ignore
                this.hooks[hook].push(callback);
              } else {
                console.warn(`   Warning: Plugin ${pluginName} tried to register unknown hook: ${hook}`);
              }
            },
            bookData: this.bookData,
            projectRoot: this.projectRoot
          };

          await plugin.init(context);
          console.log(`   Plugin loaded: ${pluginName}`);
        } else {
          console.warn(`   Warning: Plugin ${pluginName} does not export an init function.`);
        }
      } catch (error) {
        console.error(`   Error loading plugin ${pluginName}:`, error);
      }
    }
  }

  async runHook(hookName: 'beforeBuild' | 'afterBuild') {
    if (this.hooks[hookName].length > 0) {
      console.log(`   Running ${hookName} hooks...`);
      for (const callback of this.hooks[hookName]) {
        await callback();
      }
    }
  }

  async processContent(hookName: 'processMarkdown' | 'processHTML', content: string): Promise<string> {
    let result = content;
    for (const callback of this.hooks[hookName]) {
      result = await callback(result);
    }
    return result;
  }
}

// Configuration
const PROJECT_ROOT = __dirname;
const TOC_PATH = path.join(PROJECT_ROOT, 'toc.json');
const TEMPLATE_PATH = path.join(PROJECT_ROOT, 'template');
const MD_PATH = path.join(PROJECT_ROOT, 'md');
const BUILD_PATH = path.join(PROJECT_ROOT, 'build');

// Template processing
function replaceTemplatePlaceholders(template: string, replacements: Record<string, string>): string {
  let result = template;
  for (const [placeholder, value] of Object.entries(replacements)) {
    result = result.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
  }
  return result;
}

// Convert markdown to HTML
function convertMarkdownToHTML(markdownContent: string): string {
  // Configure marked for better Myanmar text support
  marked.setOptions({
    gfm: true,
    breaks: true,
  });

  return marked(markdownContent);
}

// Compress CSS content
function compressCSS(cssContent: string): string {
  const cleanCSS = new CleanCSS({
    level: 2 // Advanced optimization
  });

  const result = cleanCSS.minify(cssContent);

  // Handle both callback and promise results
  if (typeof result === 'string') {
    return result;
  } else if (result && typeof result === 'object' && result.styles) {
    return result.styles;
  } else {
    return cssContent; // Return original if compression fails
  }
}

// Compress JavaScript content
async function compressJS(jsContent: string): Promise<string> {
  try {
    const result = await minify(jsContent, {
      compress: true,
      mangle: true
    });

    if (result && result.code) {
      return result.code;
    } else {
      return jsContent;
    }
  } catch (error) {
    console.warn('JS compression failed:', error);
    return jsContent;
  }
}

// Generate data.js from toc.json
function generateDataJS(bookData: BookData): string {
  // Convert toc.json data to JavaScript format for template/scripts/data.js
  // Use same filename as markdown but with .html extension (first chapter becomes index.html)
  const chaptersWithHTMLFiles = bookData.chapters.map((chapter, index) => ({
    ...chapter,
    file: index === 0 ? 'index.html' : chapter.file.replace(/\.md$/, '.html')
  }));

  return `// Book data structure - Table of Contents
const bookData = {
    title: "${bookData.title}",
    chapters: ${JSON.stringify(chaptersWithHTMLFiles, null, 4)}
};`;
}

// Strip HTML tags from content to get plain text
function stripHtml(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // Remove scripts
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '') // Remove styles
    .replace(/<[^>]+>/g, ' ') // Remove HTML tags
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

// Simple elasticlunr-like index builder for Node.js
// We'll build the index structure manually since elasticlunr is a browser library
interface SearchDocument {
  id: string;
  title: string;
  body: string;
  file: string;
}

interface SearchDocsMap {
  [id: string]: { title: string; body: string; file: string };
}

// Myanmar syllable breaking patterns
const myConsonant = "\u1000-\u1021"; // "က-အ"
const enChar = "a-zA-Z0-9";
const otherChar = "\u1023\u1024\u1025\u1026\u1027\u1029\u102a\u103f\u104c\u104d\u104f\u1040-\u1049\u104a\u104b!-/:-@\\[-`\\{-~\\s";
const ssSymbol = "\u1039";
const aThat = "\u103a";

// Myanmar syllable break pattern
const BREAK_PATTERN = new RegExp("((?!" + ssSymbol + ")[" + myConsonant + "](?![" + aThat + ssSymbol + "])" + "|[" + enChar + otherChar + "])", "mg");

// Segment Myanmar text into syllables
function segmentMyanmar(text: string): string[] {
  const outArray = text.replace(BREAK_PATTERN, "𝕊$1").split('𝕊');
  if (outArray.length > 0) {
    outArray.shift();
  }
  return outArray;
}

// Custom tokenizer for Myanmar text
function myanmarTokenizer(str: string): string[] {
  if (!str) return [];

  const text = str.toString().toLowerCase().trim();
  if (!text) return [];

  const segments = segmentMyanmar(text);
  return segments
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

// Generate search index from book chapters
async function generateSearchIndex(bookData: BookData): Promise<{ indexData: object; docsData: SearchDocsMap }> {
  // Import elasticlunr
  const elasticlunr = require('elasticlunr');

  // Override the tokenizer with Myanmar-aware tokenizer
  elasticlunr.tokenizer = myanmarTokenizer;

  // Create index
  const index = elasticlunr(function (this: any) {
    this.addField('title');
    this.addField('body');
    this.setRef('id');
    this.saveDocument(false);

    // Clear pipeline - default trimmer/stemmer don't work for Myanmar
    this.pipeline.reset();
  });

  const docsMap: SearchDocsMap = {};

  for (let i = 0; i < bookData.chapters.length; i++) {
    const chapter = bookData.chapters[i];
    const markdownPath = path.join(MD_PATH, chapter.file);

    try {
      const markdownContent = await fs.readFile(markdownPath, 'utf-8');
      const htmlContent = convertMarkdownToHTML(markdownContent);
      const plainText = stripHtml(htmlContent);

      const outputFilename = i === 0 ? 'index.html' : chapter.file.replace(/\.md$/, '.html');

      // Add document to index
      index.addDoc({
        id: chapter.id,
        title: chapter.title,
        body: plainText
      });

      // Store docs for result display (with truncated body for smaller file size)
      docsMap[chapter.id] = {
        title: chapter.title,
        body: plainText.substring(0, 500),
        file: outputFilename
      };
    } catch (error) {
      console.warn(`   Warning: Could not process ${chapter.file} for search index`);
    }
  }

  // Serialize the index to JSON
  return {
    indexData: index.toJSON(),
    docsData: docsMap
  };
}

// Main build function
async function build(): Promise<void> {
  try {
    console.log('Starting build process...');

    // Clean build directory
    await fs.remove(BUILD_PATH);
    await fs.ensureDir(BUILD_PATH);

    // Enable compression in build
    console.log('Compression: Enabled');

    // Read toc.json
    console.log('Reading table of contents...');
    const tocContent = await fs.readFile(TOC_PATH, 'utf-8');
    const bookData: BookData = JSON.parse(tocContent);

    // Initialize Plugin Manager
    const pluginManager = new PluginManager(bookData, PROJECT_ROOT);
    await pluginManager.loadPlugins();

    // Run beforeBuild hooks
    await pluginManager.runHook('beforeBuild');

    // Read template HTML
    console.log('Reading template...');
    const templateHTML = await fs.readFile(path.join(TEMPLATE_PATH, 'index.html'), 'utf-8');

    // Copy and compress template assets to build directory
    console.log('Copying and compressing template assets...');

    // Copy and compress CSS files
    const stylesPath = path.join(TEMPLATE_PATH, 'styles');
    const buildStylesPath = path.join(BUILD_PATH, 'styles');
    await fs.ensureDir(buildStylesPath);

    const cssFiles = await fs.readdir(stylesPath);
    for (const cssFile of cssFiles) {
      if (cssFile.endsWith('.css')) {
        try {
          const cssContent = await fs.readFile(path.join(stylesPath, cssFile), 'utf-8');
          const compressedCSS = compressCSS(cssContent);
          await fs.writeFile(path.join(buildStylesPath, cssFile), compressedCSS);
          console.log(`   Compressed: styles/${cssFile}`);
        } catch (error) {
          console.warn(`   Warning: Failed to compress ${cssFile}, copying original file`);
          await fs.copy(path.join(stylesPath, cssFile), path.join(buildStylesPath, cssFile));
        }
      } else {
        // Copy non-CSS files as-is
        await fs.copy(path.join(stylesPath, cssFile), path.join(buildStylesPath, cssFile));
      }
    }

    // Copy and compress JavaScript files
    const scriptsPath = path.join(TEMPLATE_PATH, 'scripts');
    const buildScriptsPath = path.join(BUILD_PATH, 'scripts');
    await fs.ensureDir(buildScriptsPath);

    const jsFiles = await fs.readdir(scriptsPath);
    for (const jsFile of jsFiles) {
      if (jsFile.endsWith('.js')) {
        const jsContent = await fs.readFile(path.join(scriptsPath, jsFile), 'utf-8');
        const compressedJS = await compressJS(jsContent);
        await fs.writeFile(path.join(buildScriptsPath, jsFile), compressedJS);
        console.log(`   Compressed: scripts/${jsFile}`);
      } else {
        // Copy non-JS files as-is
        await fs.copy(path.join(scriptsPath, jsFile), path.join(buildScriptsPath, jsFile));
      }
    }

    // Generate and write data.js
    console.log('Generating data.js...');
    const dataJSContent = generateDataJS(bookData);
    await fs.writeFile(path.join(BUILD_PATH, 'scripts', 'data.js'), dataJSContent);

    // Copy folders from md directory to build directory (e.g., images folder)
    console.log('Copying folders from md directory...');
    const mdItems = await fs.readdir(MD_PATH);
    for (const item of mdItems) {
      const itemPath = path.join(MD_PATH, item);
      const itemStat = await fs.stat(itemPath);

      // If it's a directory, copy it to build directory
      if (itemStat.isDirectory()) {
        const destPath = path.join(BUILD_PATH, item);
        await fs.copy(itemPath, destPath);
        console.log(`   Copied folder: ${item}/`);
      }
    }

    // Process each chapter
    console.log('Processing chapters...');
    for (let i = 0; i < bookData.chapters.length; i++) {
      const chapter = bookData.chapters[i];
      const markdownPath = path.join(MD_PATH, chapter.file);

      console.log(`   Processing: ${chapter.title}`);

      // Read markdown content
      let markdownContent = await fs.readFile(markdownPath, 'utf-8');

      // Hook: processMarkdown
      markdownContent = await pluginManager.processContent('processMarkdown', markdownContent);

      let htmlContent = convertMarkdownToHTML(markdownContent);

      // Hook: processHTML
      htmlContent = await pluginManager.processContent('processHTML', htmlContent);

      // Determine output filename - use same name as markdown but with .html extension
      // Special case: first chapter becomes index.html for convenience
      const outputFilename = i === 0 ? 'index.html' : chapter.file.replace(/\.md$/, '.html');
      const outputPath = path.join(BUILD_PATH, outputFilename);

      // Determine navigation links using actual HTML filenames
      let prevLink = '';
      let nextLink = '';

      if (i > 0) {
        prevLink = i === 1 ? 'index.html' : bookData.chapters[i - 1].file.replace(/\.md$/, '.html');
      }

      if (i < bookData.chapters.length - 1) {
        nextLink = bookData.chapters[i + 1].file.replace(/\.md$/, '.html');
      }

      // Prepare template replacements
      const replacements = {
        '{{title}}': bookData.title,
        '{{content}}': htmlContent,
        '{{prev-link}}': prevLink,
        '{{next-link}}': nextLink
      };

      // Generate HTML file
      const finalHTML = replaceTemplatePlaceholders(templateHTML, replacements);
      await fs.writeFile(outputPath, finalHTML);

      console.log(`   Generated: ${outputFilename}`);
    }

    // Generate search index
    console.log('Generating search index...');
    const { indexData, docsData } = await generateSearchIndex(bookData);
    await fs.writeFile(
      path.join(BUILD_PATH, 'search-index.json'),
      JSON.stringify(indexData)
    );
    await fs.writeFile(
      path.join(BUILD_PATH, 'search-docs.json'),
      JSON.stringify(docsData)
    );
    console.log('   Generated: search-index.json, search-docs.json');

    // Run afterBuild hooks
    await pluginManager.runHook('afterBuild');

    console.log('Build completed successfully!');
    console.log(`Build output is available in: ${BUILD_PATH}`);
    console.log('You can now open the HTML files in your browser.');

  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

// Run build if this file is executed directly
if (require.main === module) {
  build();
}

export { build };