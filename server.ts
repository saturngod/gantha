import { build } from './app';
import { watch } from 'fs';
import { serve, file } from 'bun';
import path from 'path';

const PORT = 8765;
const BUILD_DIR = "./build";

// Simple debounce function to prevent multiple builds
let buildTimeout: any = null;
let isBuilding = false;
let needsRebuild = false;

async function triggerBuild() {
    if (buildTimeout) clearTimeout(buildTimeout);

    buildTimeout = setTimeout(async () => {
        if (isBuilding) {
            needsRebuild = true;
            return;
        }

        isBuilding = true;
        await runBuild();
    }, 100);
}

async function runBuild() {
    stopWatching();
    console.log('Rebuilding...');
    try {
        await build();
        console.log('Build complete.');
    } catch (error) {
        console.error('Build failed:', error);
    } finally {
        isBuilding = false;
        startWatching();
        if (needsRebuild) {
            needsRebuild = false;
            triggerBuild();
        }
    }
}

// Initial build
console.log('Starting dev server...');
await triggerBuild();

// Watch directories
const watchDirs = ['./md', './template'];
const watchFiles = ['./toc.json', './app.ts'];
let watchers: ReturnType<typeof watch>[] = [];

function startWatching() {
    if (watchers.length > 0) return; // Already watching

    watchDirs.forEach(dir => {
        try {
            const watcher = watch(dir, { recursive: true }, (event, filename) => {
                console.log(`Change in ${dir}/${filename}`);
                triggerBuild();
            });
            watchers.push(watcher);
        } catch (e) {
            console.error(`Failed to watch ${dir}:`, e);
        }
    });

    watchFiles.forEach(f => {
        try {
            const watcher = watch(f, (event, filename) => {
                console.log(`Change in ${f}`);
                triggerBuild();
            });
            watchers.push(watcher);
        } catch (e) {
            console.error(`Failed to watch ${f}:`, e);
        }
    });
}

function stopWatching() {
    watchers.forEach(w => w.close());
    watchers = [];
}

// Start initial watchers
startWatching();

// Serve the build folder
console.log(`Server running at http://localhost:${PORT}`);
serve({
    port: PORT,
    async fetch(req: Request) {
        const url = new URL(req.url);
        let filePath = url.pathname;

        if (filePath === "/" || filePath === "") {
            filePath = "/index.html";
        }

        let fullPath = path.join(BUILD_DIR, filePath);
        let f = file(fullPath);

        if (await f.exists()) {
            return new Response(f);
        }

        if (!path.extname(filePath)) {
            const htmlPath = fullPath + ".html";
            const htmlFile = file(htmlPath);
            if (await htmlFile.exists()) {
                return new Response(htmlFile);
            }
        }

        return new Response("Not Found", { status: 404 });
    },
});
