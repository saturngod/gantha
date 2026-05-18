// Updates toc.json by reading the first H1 of every markdown file in md/.
// Run: bun run update-toc.ts

import fs from 'fs-extra';
import path from 'path';
import type { BookData, Chapter } from './types';

const PROJECT_ROOT = import.meta.dir;
const TOC_PATH = path.join(PROJECT_ROOT, 'toc.json');
const MD_PATH = path.join(PROJECT_ROOT, 'md');

// Return the text of the first H1 (`# Heading`) in the markdown, or null.
function firstH1(markdown: string): string | null {
  for (const line of markdown.split(/\r?\n/)) {
    const match = line.match(/^#\s+(.+?)\s*#*\s*$/);
    if (match) return match[1].trim();
  }
  return null;
}

// Read existing toc.json if present and valid; otherwise start fresh.
async function readExistingToc(): Promise<BookData> {
  try {
    const data: BookData = await fs.readJson(TOC_PATH);
    return data;
  } catch {
    // File missing, empty, or invalid JSON — generate from scratch.
    return { title: 'Untitled Book', chapters: [], plugins: [] };
  }
}

async function updateToc(): Promise<void> {
  const bookData: BookData = await readExistingToc();

  // Keep existing subtitles so they are not lost on regeneration.
  const subtitleByFile = new Map<string, string>(
    bookData.chapters.map((c) => [c.file, c.subtitle])
  );

  // All chapter markdown files, sorted by name.
  // Matches chp_00.md as well as chp_00_cover.md, chp_00_intro.md, etc.
  const files = (await fs.readdir(MD_PATH))
    .filter((f) => /^chp_\d+(_[a-z0-9]+)?\.md$/i.test(f))
    .sort();

  const chapters: Chapter[] = [];
  for (const file of files) {
    const markdown = await fs.readFile(path.join(MD_PATH, file), 'utf-8');
    const id = file.replace(/\.md$/, '');
    const title = firstH1(markdown) ?? id;

    if (!firstH1(markdown)) {
      console.warn(`  Warning: no H1 found in ${file}, using "${id}" as title`);
    }

    chapters.push({
      id,
      title,
      subtitle: subtitleByFile.get(file) ?? '',
      file,
    });
  }

  bookData.chapters = chapters;
  await fs.writeJson(TOC_PATH, bookData, { spaces: 2 });
  console.log(`Updated toc.json with ${chapters.length} chapters.`);
}

updateToc().catch((err) => {
  console.error('Failed to update toc.json:', err);
  process.exit(1);
});
