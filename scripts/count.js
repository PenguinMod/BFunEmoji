/**
 * @fileoverview count
 * Count how many of all Emoji versions have been covered by BFunEmoji
 */
/** */
import fs from "node:fs/promises";
import path from "node:path";

const versionMap = new Map();

const definitionsFolder = path.join(import.meta.dirname, "../src/standard/definitions");
const files = await fs.readdir(definitionsFolder);
for (const file of files) {
    if (!file.endsWith(".json")) continue;
    if (!file.startsWith("u")) continue;

    console.log("reading", file);
    const definitionStr = await fs.readFile(path.join(definitionsFolder, file), "utf8");
    const definitionObj = JSON.parse(definitionStr);

    const versionStr = definitionObj.emoji_version;
    const versionCount = versionMap.get(versionStr) || 0;
    versionMap.set(versionStr, versionCount + 1);
}

const sorted = {};
const keys = [...versionMap.keys()].sort();
for (const key of keys) {
    sorted[key] = versionMap.get(key);
}
console.log(sorted);
