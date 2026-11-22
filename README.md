# Elevate Help

Help guides for the Elevate portal, one set per role: Student, Instructor and Hub Manager, plus a shared "Start here" section. Admin and Super Admin are deliberately not covered.

Plain HTML, CSS and JavaScript. There is no build step and nothing to install.

## Run it

```bash
cd elevate-docs
python3 -m http.server 5055
# open http://localhost:5055
```

Opening `index.html` directly also works. The local server is only there so the screenshots load the same way they will once the site is hosted.

## Where things live

| File | What it holds |
|---|---|
| `assets/js/content.js` | All guide text, grouped by role. Edit this file to change the docs. |
| `assets/js/app.js` | Routing (`#/role/guide`), page rendering, search, screenshot viewer, theme |
| `assets/css/styles.css` | Elevate palette tokens, layout, light and dark themes |
| `assets/screens/*.webp` | Screenshots of the real app, named `<role>-<screen>.webp` |

## Add or edit a guide

Each guide in `content.js` is a list of blocks:

| Block | Meaning |
|---|---|
| `['p', text]` | Paragraph |
| `['h', text]` | Sub-heading. It also appears under "On this page". |
| `['steps', [...]]` | Numbered steps |
| `['ul', [...]]` | Bullet list |
| `['note', 'tip' \| 'info' \| 'warn', title, text]` | Callout box |
| `['shot', 'student-home', caption]` | Screenshot |
| `['table', [headers], [[row], ...]]` | Table |

Inside text you can use:
- `**bold**`
- `` `Button label` ``, which renders as a UI chip
- `[link text](#/student/payments)`

Search picks up new guides automatically.

## Keep it accurate

The guides describe the app's actual behaviour, taken from the client and server code. When a screen changes, update the matching guide and retake its screenshot.

Some callouts mark features that are not finished yet: Settings notification switches, student CSV import, instructor announcements, the "Export Report" button and Hub Reports. Remove each callout once that feature ships.
