"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// main.ts
var main_exports = {};
__export(main_exports, {
  default: () => ScriptRunnerPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian = require("obsidian");
var import_child_process = require("child_process");
var import_util = require("util");
var path = __toESM(require("path"));
var fs = __toESM(require("fs/promises"));
var execAsync = (0, import_util.promisify)(import_child_process.exec);
var PASS_CURRENT_FILE = false;
var ScriptSelectorModal = class extends import_obsidian.FuzzySuggestModal {
  constructor(app, plugin) {
    super(app);
    this.plugin = plugin;
  }
  getItems() {
    return this.plugin.scripts;
  }
  getItemText(item) {
    return item;
  }
  onChooseItem(item) {
    this.plugin.runScript(item);
  }
};
var ScriptRunnerPlugin = class extends import_obsidian.Plugin {
  constructor() {
    super(...arguments);
    this.scriptsPath = "";
    this.scripts = [];
  }
  async onload() {
    const adapter = this.app.vault.adapter;
    if (!(adapter instanceof import_obsidian.FileSystemAdapter)) {
      new import_obsidian.Notice("Desktop only");
      return;
    }
    this.scriptsPath = path.join(adapter.getBasePath(), ".scripts");
    await this.loadScripts();
    this.addCommand({
      id: "run-script",
      name: "Run script",
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
        const stat2 = await fs.stat(fullPath);
        if (stat2.isFile() && stat2.mode & 73) {
          this.scripts.push(file);
        }
      }
    } catch {
      new import_obsidian.Notice(".scripts not found");
    }
  }
  async runScript(name) {
    const adapter = this.app.vault.adapter;
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
      if (stdout) new import_obsidian.Notice(stdout);
      if (stderr) new import_obsidian.Notice(stderr);
    } catch (e) {
      const error = e;
      new import_obsidian.Notice(`Error: ${error.message}`);
    }
  }
};
