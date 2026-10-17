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
 * id: Should start with the type, then a separating dash. Then, the name of the group in lowercase, with whitespace as dashes and non A-Z characters replaced by their hex code point in lowercase.
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

const makeCodepointString = (char) => {
    return [...char].map(piece => piece.charCodeAt(0).toString(16)).join("-");
};
const makeGroupId = (group) => {
    const normalizedName = group.name.toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z\-\_]+/g, makeCodepointString);
    return `${group.type}-${normalizedName}`;
};
const makeEmojiId = (emoji) => {
    if (emoji.collection !== "standard")
        throw new Error("Unimplemented");
    return (emoji.collection === "standard" ? "u" : "c")
        + makeCodepointString(emoji.unicode)
        + "-"
        + emoji.name.toLowerCase().replace(/[^a-z]/g, "-");
};

const existingDefinitions = new Map();
const saveGroupToFile = async (savePath, group) => {
    try {
        const existingDataStr = await fs.readFile(savePath, "utf8");
        const existingData = JSON.parse(existingDataStr);
        console.log("merging group data for", group.id);
        group = {
            ...existingData,
            ...group,
            name: existingData.name,
            group_type: existingData.group_type,
            flags: existingData.flags,
        };
    } catch {
        console.log("saving group for the first time", group.id);
    } finally {
        await fs.writeFile(savePath, JSON.stringify(group, null, 4), "utf8");
    }
};
const saveEmojiInFolder = async (saveFolder, emoji) => {
    /** @type {string[]} see all the defs that already exist in the folder */
    const definitions = existingDefinitions.get(saveFolder)
        || (await fs.readdir(saveFolder)).filter(fileName => fileName.endsWith(".json"));
    existingDefinitions.set(saveFolder, definitions);

    // NOTE: Emojis may differ in CLDR name since they are documented to be allowed to change. In this case we cant assume a path yet incase existing definitions use an older name.
    // We need to find a definition with our code points (if we have 14ff4-23e0 and a file named 14ff4-23e0-my-cool-emoji.json exists, save to that name)
    let savePath = path.join(saveFolder, `${emoji.id}.json`);
    try {
        // drop to catch & finally to make the new data if we dont find anything
        const codePoints = makeCodepointString(emoji.unicode);
        const existingFileName = definitions.find(fileName => fileName.startsWith(codePoints));
        if (!existingFileName)
            throw new Error("No matches");
        // We also need to change the ID (intentional mutation)
        emoji.id = path.basename(existingFileName, ".json");
        savePath = path.join(saveFolder, existingFileName);

        // NOTE: If these fail (like broken json), then the earlier code should recover the existing file instead of making a new one
        const existingDataStr = await fs.readFile(savePath, "utf8");
        const existingData = JSON.parse(existingDataStr);
        console.log("merging emoji data for", emoji.id);
        emoji = {
            ...existingData,
            ...emoji,
            name: existingData.name,
            alias: [...new Set([...emoji.alias, ...existingData.alias])],
            sequences: [...new Set([...emoji.sequences, ...existingData.sequences])],
            emoji_type: existingData.emoji_type,
            completed: existingData.completed,
            flags: existingData.flags,
        };
    } catch {
        console.log("saving emoji for the first time", emoji.id);
    } finally {
        await fs.writeFile(savePath, JSON.stringify(emoji, null, 4), "utf8");
    }
};

// for standard, do the fetches and checks
if (collectionTarget === "standard") {
    const response = await fetch(STANDARD_URL);
    const text = await response.text();

    // NOTE: For standard emoji:
    /**
     * id: This should start with `u` to denote Unicode Standard, and then the hex code points separated by dashes. Then, add a separating dash. Anything after the dash is not required in the sense that: if a definition file already exists that uses the hex code points in the start of its file name, then the ID should be derived from that definition file. Otherwise, create the ID by inserting the CLDR Short Name after the separating dash in lowercase, with non A-Z characters replaced with dashes.
     * name: The CLDR Short Name. This may change for newer emojis, and the old name should be included in alias.
     * alias: The CLDR Short Name, then a version with dashes, then a version with underscores, then others added for legacy or compatibility reasons.
     * unicode: The preferred character sequence to create this emoji.
     * emoji_version: The version of emoji the character came from.
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
        const trimLine = line.trim();
        if (!trimLine) continue;

        // look for group marker, or end of file to save.
        // NOTE: Assume all emojis are in subgroups and all groups have at least 1 subgroup.
        // NOTE: We assume groups and subgroups will never change names.
        const isEndOfFile = trimLine.startsWith("#EOF");
        const isGroupThisLine = trimLine.startsWith("# group:");
        const isSubGroupThisLine = trimLine.startsWith("# subgroup:");
        if (isGroupThisLine && currentGroup && !currentSubgroup)
            throw new Error("Next group started before first group created a subgroup");
        if (isSubGroupThisLine && !currentGroup)
            throw new Error("Subgroup is present outside of a group");
        if (isEndOfFile && ((!currentGroup) || (!currentSubgroup)))
            throw new Error("Read EOF before groups were created");
        if (isGroupThisLine || isSubGroupThisLine || isEndOfFile) {
            // If we have a group/subgroup to save then save it. Should only be false on first group
            if (currentGroup && currentSubgroup) {
                // commit emojis to file
                for (const emoji of currentEmojis) {
                    await saveEmojiInFolder(definitionFolder, emoji);
                }
                currentEmojis.splice(0, Infinity);

                // save group to file
                const subGroupPath = path.join(definitionFolder, `${currentSubgroup.id}.json`);
                await saveGroupToFile(subGroupPath, currentSubgroup);
                currentSubgroup = null;
                // for groups, need to save their data too
                if (isGroupThisLine) {
                    const groupPath = path.join(definitionFolder, `${currentGroup.id}.json`);
                    await saveGroupToFile(groupPath, currentGroup);
                    currentGroup = null;
                }
            }

            // Start a new group/subgroup
            if (!isEndOfFile) {
                // Grab the name from "# subgroup: group-name" or "# group: Group name"
                const groupLineSlice = trimLine.split(":");
                groupLineSlice.shift();

                const groupName = groupLineSlice.join(":").trim();
                const newGroup = createGroup();
                newGroup.name = groupName;
                newGroup.collection = "standard";
                newGroup.type = isGroupThisLine ? "group" : "subgroup";
                newGroup.group_type = "qualified";
                newGroup.id = makeGroupId(newGroup);
                if (currentGroup) {
                    newGroup.group = currentGroup.id;
                }

                // assign the group to current
                if (isGroupThisLine) {
                    currentGroup = newGroup;
                } else {
                    currentSubgroup = newGroup;
                }
            }
        }

        // now we skip comment lines
        if (trimLine.startsWith("#"))
            continue;

        // grab emojis
        // NOTE: Don't use trimLine here for precaution because emojis use zero-width symbols
        // Format: code points; status # 🙂 E1.0 slightly smiling face
        // grab the codepoints because they are before the ; and can be trimmed after
        const emojiSplit = line.split(";");
        const codePoints = emojiSplit.shift().trim().split(" ");
        const emojiCreated = codePoints.map(codePoint => String.fromCodePoint(parseInt(codePoint, 16))).join("");
        // grab the status after the ; but before the # (we can also trim it after)
        const metaSplit = emojiSplit.join(";").split("#");
        const status = metaSplit.shift().trim();
        // slice to the first E character for emoji version, then anything by spaces after is a CLDR name we can trim
        const emojiInfo = metaSplit.join("#");
        const versionIndex = emojiInfo.indexOf("E");
        const versionSlice = emojiInfo.slice(versionIndex + 1).split(" ");
        const emojiVersion = versionSlice.shift();
        const emojiCldrName = versionSlice.join(" ");
        // create definition if we're qualified or a component
        if (status === "fully-qualified" || status === "component") {
            // NOTE: We assume that minimally-qualified or unqualified must be part of a fully-qualified emoji already created
            const emojiDefinition = createEmoji();
            emojiDefinition.type = "emoji";
            emojiDefinition.name = emojiCldrName;
            emojiDefinition.alias = [emojiCldrName, emojiCldrName.replace(/\s+/g, "-"), emojiCldrName.replace(/\s+/g, "_")];
            emojiDefinition.unicode = emojiCreated;
            emojiDefinition.sequences = [emojiCreated];
            emojiDefinition.emoji_version = emojiVersion;
            emojiDefinition.emoji_type = status !== "component" ? "qualified" : "component";
            emojiDefinition.collection = "standard";
            emojiDefinition.completed = false;
            emojiDefinition.group = currentSubgroup.id;
            emojiDefinition.id = makeEmojiId(emojiDefinition);
            currentEmojis.push(emojiDefinition);
        } else {
            // we're part of another emoji's sequence set
            // NOTE: For simplicity right now we just assume that we're part of the previous emoji.
            const latestEmoji = currentEmojis.at(-1);
            if (!latestEmoji)
                throw new Error("Reached non-fully-qualified emoji before reaching any fully-qualified emoji");
            latestEmoji.sequences.push(emojiCreated);
        }
    }

    // TODO: Later we'll see what logic should be duplicated for custom but its not implemented right now
    process.exit(0);
}

// NOTE: For custom emoji:
/**
 * id: This should start with `c` to denote BFunEmoji custom, and then the custom Unicode hex code points separated by dashes. Then, add a separating dash. Anything afterwards should stay the same from creation.
 * name: The friendly name for this emoji. Should match the wording of other CLDR Short Names.
 * alias: The friendly name for this emoji, then a version with dashes, then a version with underscores, then others added for legacy or compatibility reasons.
 * unicode: A custom Unicode sequence to create this emoji. Zero-width-joiners are required and U+EA20 must be the first character.
 * sequences: A list with only the preferred custom Unicode character sequence.
 */
// TODO: Custom emoji
throw new Error("Not implemented");