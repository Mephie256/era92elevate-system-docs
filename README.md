# Elevate Help

Help guides for the era92 Elevate portal, one set per role: Student, Instructor, Hub Manager and Admin, plus a shared "Start here" section.

Plain HTML, CSS and JavaScript. Every guide is a real HTML page with its own address (for example `/student/enrol/`), so search engines can read the full text without running JavaScript.

## Run it

```bash
cd elevate-docs
node scripts/build.mjs          # writes every page, the sitemap and robots.txt
python3 -m http.server 5055     # open http://localhost:5055
```

The build needs Node 18 or newer and nothing else.

## Where things live

| File | What it holds |
|---|---|
| `assets/js/content.js` | All guide text, grouped by role. Edit this file to change the docs. |
| `assets/js/render.js` | Turns the content into page HTML. The build and the browser both use it. |
| `assets/js/app.js` | Browser behaviour: search, the screenshot viewer, theme, the phone menu |
| `assets/css/styles.css` | Elevate palette tokens, layout, light and dark themes |
| `assets/screens/*.webp` | Screenshots of the real app, named `<role>-<screen>.webp` |
| `scripts/build.mjs` | Generates `index.html`, one folder per role and guide, `404.html`, `sitemap.xml` and `robots.txt` |

The generated pages (`index.html`, `start/`, `student/`, `instructor/`, `hub-manager/`, `admin/`, `404.html`, `sitemap.xml`, `robots.txt`) are committed, so the site can be hosted as-is. Don't edit them by hand: change `content.js` and run the build again.

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
- `[link text](#/student/payments)`, which links to another guide

Search, the sitemap and the structured data pick up new guides automatically.

## SEO

Every page gets:
- its own title and description
- a canonical URL
- Open Graph and Twitter card tags, with `assets/img/og-image.png` as the share image
- JSON-LD structured data: `WebSite` on the home page, `BreadcrumbList` on every page, `TechArticle` on each guide, and `FAQPage` on the question pages

Before going live, build with the real address so canonical URLs and the sitemap point to it:

```bash
SITE_URL=https://your-domain.example/ node scripts/build.mjs
```

The default is `https://mephie256.github.io/era92elevate-system-docs/` (GitHub Pages). After launch, submit `sitemap.xml` in Google Search Console.

Old links in the form `/#/student/enrol` still work; they redirect to the new address.

## Keep it accurate

The guides describe the app's actual behaviour, taken from the client and server code. When a screen changes, update the matching guide and retake its screenshot.

Some callouts mark features that are not finished yet: Settings notification switches, student CSV import, instructor announcements, Roles-tab permissions, Exams, the "Export Report" button and Hub Reports. Remove each callout once that feature ships.
