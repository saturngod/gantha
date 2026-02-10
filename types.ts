export interface Chapter {
    id: string;
    title: string;
    subtitle: string;
    file: string;
}

export interface BookData {
    title: string;
    chapters: Chapter[];
    plugins?: string[]; // List of plugin names or paths
}

// Plugin System Interfaces
export interface PluginContext {
    // Hooks
    on(hook: 'beforeBuild', callback: () => void | Promise<void>): void;
    on(hook: 'afterBuild', callback: () => void | Promise<void>): void;
    on(hook: 'processMarkdown', callback: (markdown: string) => string | Promise<string>): void;
    on(hook: 'processHTML', callback: (html: string) => string | Promise<string>): void;

    // Data access
    bookData: BookData;
    projectRoot: string;
}

export interface Plugin {
    init(context: PluginContext): void | Promise<void>;
}
