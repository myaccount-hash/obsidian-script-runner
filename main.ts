import { App, Plugin, Notice, FuzzySuggestModal, FileSystemAdapter, TFile } from 'obsidian';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs/promises';

const execAsync = promisify(exec);
const PASS_CURRENT_FILE = false; // 現在のファイルパスをスクリプトに渡すかどうか

class ScriptSelectorModal extends FuzzySuggestModal<string> {
    plugin: ScriptRunnerPlugin;npm install --save-dev @types/node

    constructor(app: App, plugin: ScriptRunnerPlugin) {
        super(app);
        this.plugin = plugin;
    }

    getItems(): string[] {
        return this.plugin.scripts;
    }

    getItemText(item: string): string {
        return item;
    }

    onChooseItem(item: string): void {
        this.plugin.runScript(item);
    }
}

export default class ScriptRunnerPlugin extends Plugin {
    scriptsPath: string = '';
    scripts: string[] = [];

    async onload() {
        const adapter = this.app.vault.adapter;
        if (!(adapter instanceof FileSystemAdapter)) {
            new Notice('Desktop only');
            return;
        }

        this.scriptsPath = path.join(adapter.getBasePath(), '.scripts');
        await this.loadScripts();

        this.addCommand({
            id: 'run-script',
            name: 'Run script',
            callback: () => {
                new ScriptSelectorModal(this.app, this).open();
            }
        });
    }

    async loadScripts() {
        try {
            const files = await fs.readdir(this.scriptsPath);
            this.scripts = [];
            for (const file of files) {
                const fullPath = path.join(this.scriptsPath, file);
                const stat = await fs.stat(fullPath);
                if (stat.isFile() && (stat.mode & 0o111)) {
                    this.scripts.push(file);
                }
            }
        } catch {
            new Notice('.scripts not found');
        }
    }

    async runScript(name: string) {
        const adapter = this.app.vault.adapter as FileSystemAdapter;
        const scriptPath = path.join(this.scriptsPath, name);
        const cwd = adapter.getBasePath();

        let cmd = scriptPath;
        if (PASS_CURRENT_FILE) {
            const file = this.app.workspace.getActiveFile();
            if (file) {
                const filePath = path.join(cwd, file.path);
                cmd = `${scriptPath} "${filePath}"`;
            }
        }

        try {
            const { stdout, stderr } = await execAsync(cmd, { cwd });
            if (stdout) new Notice(stdout);
            if (stderr) new Notice(stderr);
        } catch (e) {
            const error = e as Error;
            new Notice(`Error: ${error.message}`);
        }
    }
}