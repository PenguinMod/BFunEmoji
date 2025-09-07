/**
 * @fileoverview make:others
 * Makes the `avif`, `thumb/128x128` and `thumb/64x64` folders based on the `png` folder.
 */

const fs = require("fs");
const path = require("path");
const glob = require("glob");
const sharp = require("sharp");

glob.glob(path.join(__dirname, "../emojis/png") + `/**/*.png`).then(async (relPaths) => {
    // avif folder
    const folders = [
        { path: "avif" },
        { path: "thumb/128x128", scale: 128 },
        { path: "thumb/64x64", scale: 64 },
        { path: "thumb/48x48", scale: 48 },
        { path: "thumb/32x32", scale: 32 },
    ];
    for (const relPngPath of relPaths) {
        const newFileName = `${path.basename(relPngPath).replace(".png", "")}.avif`;

        const image = fs.readFileSync(path.resolve(relPngPath));
        for (const folder of folders) {
            const newPath = path.join(path.join(__dirname, "../emojis/", folder.path), newFileName);
            console.log("making", folder.path, newFileName);
            if (!folder.scale) {
                await sharp(image).avif().toFile(newPath);
            } else {
                await sharp(image).resize({ width: folder.scale, height: folder.scale, kernel: "nearest" }).avif().toFile(newPath);
            }
        }
    }
});