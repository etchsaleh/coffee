# Changing sam'spresso's colours and fonts (no coding)

Everything about the look lives in one small file: **`theme.json`**. You can play with it live in the app, then save it on GitHub. The site updates for everyone about a minute later.

## 1. Play with it

Open the app with `?design` on the end of the address:

**https://etchsaleh.github.io/coffee/?design**

A **theme playground** panel appears. Changes show straight away, but **only on your device**, so experiment freely.

- **Colours:** tap a swatch to pick a colour, or type a hex code (like `#3E5700`) and press Enter.
- **Fonts:** pick a heading font and a body font. "Other Google Font…" accepts any font name from [fonts.google.com](https://fonts.google.com), typed exactly as it appears there.
- **Italic headings:** on or off.
- **Corner roundness:** how round cards and buttons are.
- **Reset:** goes back to the theme everyone currently sees.
- The chevron minimises the panel so you can browse the app. Tap **theme** at the bottom left to bring it back.

Your draft is remembered on that device, even after closing the page.

## 2. Publish it

1. In the playground, tap **Copy theme**. If copying doesn't work, tap **Show code** and copy all of the text in the box.
2. Go to **https://github.com/etchsaleh/coffee/edit/main/theme.json** and sign in. You need to have been added as a collaborator.
3. Select everything in the editor and paste over it.
4. Click **Commit changes…**, then **Commit changes** again.

After about a minute, everyone sees the new theme at https://etchsaleh.github.io/coffee/. Refresh if it hasn't changed yet.

To undo, open the file on GitHub, click **History**, and copy back an older version. Or paste in the original theme below.

## What each colour does

| Name | Used for |
| --- | --- |
| `background` | Page background |
| `card` | Cards and sheets |
| `surface` | Pills, slider tracks and list rows |
| `line` | Thin dividing lines |
| `text` | Main text |
| `muted` | Secondary text and icons |
| `brand` | Logo, main buttons, selected states |
| `matcha` | Taste-match highlights |
| `latte` | Samia's Picks |

Lighter tints (soft backgrounds, shadows, glows) are worked out automatically from these colours.

## Original theme

```json
{
  "colors": {
    "background": "#F8F6F2",
    "card": "#FFFFFF",
    "surface": "#F1EDE7",
    "line": "#EEEAE4",
    "text": "#2A2623",
    "muted": "#8D867E",
    "brand": "#3E5700",
    "matcha": "#7A8B5A",
    "latte": "#C49A74"
  },
  "fonts": {
    "display": "Instrument Serif",
    "displayItalic": true,
    "body": "Manrope"
  },
  "corners": 24
}
```

## Good to know

- A typo can't break the app. Any value it doesn't understand is ignored, and the original is used for that one setting.
- Colours must be 6-digit hex codes (`#RRGGBB`). Corners can be 0–40.
- The app icon and the home-screen icon are images, so they don't change with the theme.
