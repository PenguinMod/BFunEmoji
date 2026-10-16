/**
 * @fileoverview update:definitions:x
 * Update the definitions folder for a specific collection.
 * - For `standard`, downloads the latest Unicode emoji data, checks for drawn glyphs, and updates definitions.
 * - For `custom`, just checks for drawn glyphs and updates definitions.
 */
/** */
import fs from "node:fs/promises";
import path from "node:path";
import { glob } from "glob";
import sharp from "sharp";

// NOTE: This should change on Unicode revisions
const STANDARD_URL = "https://www.unicode.org/Public/18.0.0/emoji/emoji-test.txt";
const STANDARD_VERSION = "18.0.0";

const scriptArguments = process.argv;
scriptArguments.shift();
scriptArguments.shift();

// check target
const collectionTarget = scriptArguments.shift();
if (
    collectionTarget !== "standard"
    && collectionTarget !== "custom"
) {
    throw new Error("Invalid collectionTarget");
}

// NOTE: For ALL types:
/**
 * type: "emoji" for emoji, "group" for emoji groups, "subgroup" for sub groups of emoji within groups.
 * collection: "standard" for Unicode Standard, "custom" for BFunEmoji customs. This applies to all types.
 * group: Only present if necessary. The group that this emoji or subgroup belongs to
 * flags: A list of internal flags to assign this object.
 */
// NOTE: For ALL groups & subgroups:
/**
 * id: Should start with the type, then a separating dash. Then, the name of the group in lowercase, with non A-Z characters replaced by their hex code point in lowercase.
 * name: The name of the group.
 * group_type: Either "qualified" or "internal". "internal" groups shouldn't regularly appear.
 */
const createGroup = () => {
    return {
        id: "INVALIDINVALIDINVALID",
        type: "group",
        name: "INVALIDINVALIDINVALID",
        collection: "INVALIDINVALIDINVALID",
        group_type: "internal",
        flags: [],
    };
};
const createEmoji = () => {
    return {
        id: "INVALIDINVALIDINVALID",
        type: "emoji",
        name: "INVALIDINVALIDINVALID",
        alias: [],
        unicode: "INVALIDINVALIDINVALID",
        sequences: [],
        flags: [],
    };
};

// for standard, do the fetches and checks
if (collectionTarget === "standard") {
    const response = await fetch(STANDARD_URL);
    const text = await response.text();

    // NOTE: For standard emoji:
    /**
     * id: This should start with `u` to denote Unicode Standard, and then the hex code points separated by dashes. Then, add a separating dash. Anything after the dash is not required in the sense that: if a drawn file already exists that uses the hex code points in the start of its file name, then the ID should be derived from that drawn file. Otherwise, create the ID by inserting the CLDR Short Name after the separating dash in lowercase, with non A-Z characters replaced with dashes.
     * name: The CLDR Short Name. This may change for newer emojis, and the old name should be included in alias.
     * alias: The CLDR Short Name, then a version with dashes, then a version with underscores, then others added for legacy or compatibility reasons.
     * unicode: The preferred character sequence to create this emoji.
     * emoji_version: The version of Unicode the character came from.
     * emoji_type: Either "qualified" or "component". "component" emojis are special and have glyphs for assistance, but shouldn't regularly appear.
     * completed: True if this glyph is fully drawn in the collection.
     * sequences: The preferred character sequence, then incomplete or alternate sequences that can still create this emoji.
     */
    const textList = text.split("\n");
    const definitionFolder = path.join(import.meta.dirname, "../src/standard/definitions");

    let currentGroup = null;
    let currentSubgroup = null;
    const currentEmojis = [];
    for (let i = 0; i < textList.length; i++) {
        const line = textList[i];
        if (!line.trim()) continue;

        // look for group marker
        const trimLine = line.trim();
        const isGroupThisLine = trimLine.startsWith("# group:");
        const isSubGroupThisLine = trimLine.startsWith("# subgroup:");
        if (isGroupThisLine || isSubGroupThisLine) {
            if ((currentGroup && isGroupThisLine) || (currentSubgroup && isSubGroupThisLine)) {

            }
        }
    }
}

// NOTE: For custom emoji:
/**
 * id: This should start with `c` to denote BFunEmoji custom, and then the custom Unicode hex code points separated by dashes. Then, add a separating dash. Anything afterwards should stay the same from creation.
 * name: The friendly name for this emoji. Should match the wording of other CLDR Short Names.
 * alias: The friendly name for this emoji, then a version with dashes, then a version with underscores, then others added for legacy or compatibility reasons.
 * unicode: A custom Unicode sequence to create this emoji. Zero-width-joiners are required and U+EA20 must be the first character.
 * sequences: A list with only the preferred custom Unicode character sequence.
 */