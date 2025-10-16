import fs from 'fs-extra';
import path from 'path';
import { marked } from 'marked';
import CleanCSS from 'clean-css';
import { minify } from 'terser';

// Types
interface Chapter {
  id: string;
  title: string;
  subtitle: string;
  file: string;
}

interface BookData {
  title: string;
  chapters: Chapter[];
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

    // Process each chapter
    console.log('Processing chapters...');
    for (let i = 0; i < bookData.chapters.length; i++) {
      const chapter = bookData.chapters[i];
      const markdownPath = path.join(MD_PATH, chapter.file);

      console.log(`   Processing: ${chapter.title}`);

      // Read markdown content
      const markdownContent = await fs.readFile(markdownPath, 'utf-8');
      const htmlContent = convertMarkdownToHTML(markdownContent);

      // Determine output filename - use same name as markdown but with .html extension
      // Special case: first chapter becomes index.html for convenience
      const outputFilename = i === 0 ? 'index.html' : chapter.file.replace(/\.md$/, '.html');
      const outputPath = path.join(BUILD_PATH, outputFilename);

      // Determine navigation links using actual HTML filenames
      let prevLink = '';
      let nextLink = '';

      if (i > 0) {
        prevLink = i === 1 ? 'index.html' : bookData.chapters[i-1].file.replace(/\.md$/, '.html');
      }

      if (i < bookData.chapters.length - 1) {
        nextLink = bookData.chapters[i+1].file.replace(/\.md$/, '.html');
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