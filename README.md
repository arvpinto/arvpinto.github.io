# arvpinto.github.io

Personal home page of Alexandre V. Pinto: https://arvpinto.github.io/

It gathers my portfolio of workflows, models and software from my research in
computational chemistry and biochemistry of enzymes, together with an "About me" section
(publications, journal covers and artwork).

<div align="center">
    <img src="assets/img/hero-1200.webp" loading="lazy" alt="Molecular surface of an enzyme reflected on dark water">
</div>

## How the page is put together

The page is a single Jekyll layout fed by a few data files, so most changes
only need a text edit:

| To change | Edit |
| --- | --- |
| Title and text of the hero, title and text of the catalogue, About text, photo, contact links, location, time zone and CV | `_data/profile.yml` |
| Cards in the catalogue | `_data/resources.yml` |
| Topics and their colours | `_data/categories.yml` |
| Series (entries to follow in order) | `_data/series.yml` |
| Publications | `_data/publications.yml` |
| Journal covers and artwork | `_data/gallery.yml` (images in `assets/img/gallery/`) |
| Browser title and description for search engines | `_config.yml` |
| Logo and browser icon | `assets/img/logo.svg` (dark mode), `assets/img/logo-light.svg` (light mode) and `assets/img/favicon.svg` |
| Structure of the page | `_layouts/default.html` |
| Styles | `assets/css/site.css` |
| Behaviour (filters, animations) | `assets/js/site.js` |

### Adding an entry to the catalogue

1. Save the card image as WebP (about 900 px wide) in `assets/img/cards/`.
2. Add a block to `_data/resources.yml`, following the fields described at the
   top of that file. The newest entry (by `added` date) is featured in the hero
   automatically, and entries from the last 180 days get a "New" label.
3. To make it part of a series, add its `slug` to `_data/series.yml`.

### Journal covers and artwork

All images in `assets/img/gallery/` are WebP. Covers are 480 px wide; each
artwork has a full image (at most 2400 px on the long side) that opens when its
tile is clicked, and a smaller `-thumb` version (760 px, or 1100 px for a wide
tile) shown on the page. The fields are described at the top of
`_data/gallery.yml`.

### Light and dark mode

The button in the top bar switches between the two, and the choice is
remembered in the visitor's browser. Colours for each mode are the variables at
the top of `assets/css/site.css`. Images that change with the mode have a
`data-light-src` (and `data-light-srcset`) attribute in the layout pointing to
their light version: `hero-light-*.webp` and `logo-light.svg`. The image in
the About section (`about-760.webp`, `about-1600.webp`) has a transparent
background and is lossless, so the same files serve both modes.

### CV

The footer links to `assets/cv/Alexandre_V_Pinto_CV.pdf`. To update it,
replace that file (or change `cv:` in `_data/profile.yml` to point to a new
one).

### Hero image

`assets/img/hero-800.webp`, `hero-1200.webp` and `hero-1600.webp` are lossless
copies of the artwork, with its edges (the light at the top and bottom and the
sides of the water) faded into black so that it blends with the page. The
`hero-light-*` files are the same for the inverted artwork, faded into white. Keep them
lossless if the artwork is replaced: lossy compression shows as blocks in the
glow of the lamp.

### Animations

There are two, and both respect the "reduce motion" setting of the system:

- **Hero**: the lamp in the artwork switches on when the page opens and
  flickers briefly every 10 to 24 seconds (and whenever the pointer moves over
  the lamp), and the reflection on the water
  keeps moving (a canvas redraws the lower part of the image, see parts 1 and
  1b of `assets/js/site.js`).
- **Series**: a pulse of light travels along the reaction energy profile in a
  loop, slowing down towards the top of the barrier and speeding up after it.
  Each step lights up as the pulse passes (part 2 of the same file; the timing
  is set by the three constants at its top).

## Font

Hanken Grotesk is served from `assets/fonts/` (SIL Open Font License, see
`assets/fonts/LICENSE.txt`), so the page makes no requests to third-party
servers.
