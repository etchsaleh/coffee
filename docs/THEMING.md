# Changing sam'spresso's colours and fonts (no coding)

Everything about the look lives in one small file: **`theme.json`**. You can play with it live in the app, then save it on GitHub. The site updates for everyone about a minute later.

## 1. Play with it

Open the app with `?design` on the end of the address:

**https://etchsaleh.github.io/coffee/?design**

A **theme playground** panel appears. Changes show straight away, but **only on your device**, so experiment freely.

- **Colours:** tap a swatch to pick a colour, or type a hex code (like `#3E5700`) and press Enter.
- **Fonts:** pick a heading font and a body font from about 70 Google Fonts, grouped into serif, sans serif, and display & script. For anything else, choose **Other Google Font…**, type the name from [fonts.google.com](https://fonts.google.com) and tap **Use**. The app checks the name and fixes capitals for you ("lora" becomes "Lora").
- **Italic headings:** on or off.
- **Corner roundness:** how round cards and buttons are.
- **Reset:** throws away your changes and goes back to the theme everyone currently sees.
- The chevron minimises the panel so you can browse the app. Tap **theme** at the bottom left to bring it back.

Your draft is remembered on that device, even after closing the page.

## 2. Publish it

Tap **Publish theme** at the bottom of the playground. Everyone sees the new theme at https://etchsaleh.github.io/coffee/ about a minute later (refresh if it hasn't changed yet).

The first time, the button says **Connect to publish**. Follow the steps it shows (they're also in [EDITING.md](EDITING.md#connect-github-once)). The same connection works for the content editor.

**Undo:** every publish is saved in GitHub's history. Open [theme.json's history](https://github.com/etchsaleh/coffee/commits/main/theme.json), find the version you want and copy it back, or paste in the original theme below. **Code** shows the theme as text if you ever need to copy it by hand.

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
| `accent` | Taste matches, "open now" and live signals |
| `highlight` | Samia's Picks and editorial highlights |

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
    "accent": "#7A8B5A",
    "highlight": "#C49A74"
  },
  "fonts": {
    "display": "Instrument Serif",
    "displayItalic": true,
    "body": "Manrope"
  },
  "corners": 24
}
```

## Readability is automatic

Any combination is safe to try. On each surface (page, cards, pills, brand buttons), the app checks whether text is readable:

- If it isn't, the app uses a stronger shade of the same colour there. For example, dark text on a dark card becomes light on that card only.
- Text on brand-coloured buttons switches between white and dark to suit the brand colour.

The playground shows a short **contrast note** whenever this happens, so you know which pairing was adjusted. If you'd rather keep your exact colour everywhere, pick a combination that doesn't trigger a note.

## Good to know

- A typo can't break the app. Any value it doesn't understand is ignored, and the original is used for that one setting.
- Colours must be 6-digit hex codes (`#RRGGBB`). Corners can be 0–40.
- The app icon and the home-screen icon are images, so they don't change with the theme.
