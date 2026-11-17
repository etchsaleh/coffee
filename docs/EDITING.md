# Editing stories, drops and picks (no coding)

Journal stories, limited drops and Samia's Picks live in one file, **`content.json`**. You edit them inside the app and publish with one tap.

## 1. Open the editor

**https://etchsaleh.github.io/coffee/?edit**

A **Content** panel appears with three tabs. Everything you change shows straight away in the app behind it, **on your device only**, until you publish. Your changes are kept on that device even if you close the page.

### Stories

- **New story**, or tap one to edit it.
- **Type:** samia's edit, spotlight, new or drop. The type sets the small label on the card.
- **Title** and **Intro**: the intro shows on the card and at the top of the story.
- **Card colour:** five shades taken from the theme.
- **Photo (optional):** tap **Add a photo** to use a photo for the card and the top of the story instead of the colour. The photo is shrunk on your phone so it loads quickly, then uploaded to the repo when you publish. Add a short description for people using screen readers. If a photo can't load, the card shows its colour instead.
- **Publish on:** a future date schedules the story. It appears on that day.
- **Ends (optional):** the story disappears after this. Use it for drops.
- **Story:** build it from blocks: **Paragraph**, **Heading**, **Quote** and **Café** (a café card, optionally featuring one drink, with a note). Use the arrows to reorder blocks and × to remove one.
- **Preview** opens the story exactly as readers will see it. Tap **content** at the bottom right to get back to the editor.

### Drops

A drop is a limited drink pinned to the top of a café's menu with a badge and a countdown.

- Choose the **café**, the **drink** name, **Limited drop** or **Sponsored**, the **badge text** and the **partner line**.
- **Ends:** the drop leaves the menu at this time.
- **Linked story:** adds a "read the story" button to the drop.
- Ratings people give a drop are kept on their devices if you edit or end it.

### Picks

Tap **✦** next to any drink to make it one of Samia's Picks. Use the search box to find a drink or café.

## 2. Publish

Tap **Publish content** at the bottom of the panel. Everyone sees the changes about a minute later. **Undo all** throws away your unpublished changes.

If someone published from another device since you opened the page, the editor warns you before replacing that version. GitHub keeps every published version, so nothing is ever lost: see [content.json's history](https://github.com/etchsaleh/coffee/commits/main/content.json).

## Connect GitHub (once)

The first time you publish (from the editor or the theme playground), tap **Connect to publish** and follow these steps:

1. Open [GitHub → new fine-grained token](https://github.com/settings/personal-access-tokens/new) and sign in.
2. Name it "sam'spresso" and pick an expiry (for example 1 year).
3. **Repository access:** Only select repositories → `etchsaleh/coffee`.
4. **Permissions → Repository permissions → Contents:** Read and write.
5. Generate the token, copy it, paste it into the editor and tap **Connect**.

The token is saved only in that browser, and it can only change files in this one repository. To remove it, tap **Disconnect** under the Publish button, or delete the token on GitHub. You'll need to connect again on each new device or browser.

## Good to know

- A mistake can't break the app. Anything in the file the app doesn't understand is skipped, and if the file can't be read at all, the app shows its built-in stories.
- Stories and drops for a café that no longer exists are hidden automatically.
- Photos appear for everyone a minute or two after publishing, once the site has updated.
