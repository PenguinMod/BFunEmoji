# Contributing
Note that all emojis drawn for BFunEmoji across all collections within this repository are licensed under Creative Commons Zero v1.0 Universal.

Please be aware before designing or submitting anything that by contributing an emoji to the BFunEmoji collection, you are voluntarily giving up all rights to your design, allowing anyone, including public and commercial entities, to freely use, modify, reproduce, redistribute, and reuse it in any form and for any purpose.

Creative Commons Zero v1.0 Universal is a Public Domain license. See [LICENSE](./LICENSE).

Formatting your own emoji:
- Emoji should be 256x256 in size exactly
- Export/Save your files as `.png`
- Add your emojis in `emojis/emojiset/png`
- Do **not** run the `make:others` script for *your* Pull Request as this will make a big mess of changes

General guidelines (but not strict rules) for emoji designs:
- Try to make emojis usable in many contexts (e.g., tools, emotions, places, etc.)
- Use a transparent background (unless the emoji entails otherwise)
- Avoid designs that are hard to read on pitch-black or bright-white backgrounds (an outline or border can help a lot)
- Avoid looking out of place from other emojis
- Avoid anti-aliasing (unless you need it for zooming/resizing, or messing with rotation/perspective)
- Important features such as eyes or mouth should be at least 4 pixels large (usually this is the outline/border)
- Make sure the emoji is still understandable at 64x64, and reasonably understandable at 32x32 (we do intentionally add anti-aliasing on all emojis when scaling down)
- Use subtle or pleasant gradients for key/noticable colors

Rules for this repository:
- No emojis ripped/traced directly from another emoji set (e.g., Twemoji, Apple emojis, etc.)
- All content must not have any special licensing restrictions (e.g., only Steamboat Willie is public domain but not recent versions of Mickey)
- All content must be appropriate for ages 10+ or approved into the Unicode Standard (e.g., no bloody faces)
  - Problematic associations or innuendos may cause unintended designs to be rejected or marked as restricted in metadata regardless.
- SFW (Safe for Work) content only. Suggestive/sexual content is not tolerated.
  - Some approved Unicode-standard emojis may have mature association (e.g., 🏩, 🔞) and are included as exceptions to this rule.
  - Problematic associations or innuendos may cause unintended designs to be rejected or marked as restricted in metadata regardless.
- AI-Generated content will be ignored and closed. You haven't earned the skills of a chef if you can only order food.
  - Note that the license does not allow us to place any restrictions on the usage of BFunEmoji in generative AI training or datasets.
