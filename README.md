# arvpinto.github.io

Home page for the CompBioChem tutorials: https://arvpinto.github.io/

Everything on the page is generated from the files in `_data/`, so it grows as entries are added:

- **Top of the page**: title, description and author details next to the main artwork, plus the newest entry ("Latest addition"), picked automatically from the `added:` dates.
- **Tutorials**: every entry as a card, newest first, with search, topic and software filters and sorting. The 9 most recent are shown until the reader filters or clicks "Show all".
  Filtered views can be shared as links, for example `https://arvpinto.github.io/?software=cp2k` or `?topic=qmmm`.
- **About**: short description and author details.

## Adding a tutorial

1. Make a compressed image (WebP, about 900 px wide), for example:

   ```bash
   python3 -c "from PIL import Image; im=Image.open('artwork/NEW.png'); im=im.crop(im.getbbox()); im.thumbnail((900,900)); im.save('assets/img/cards/new.webp', quality=82, method=6)"
   ```

2. Add an entry anywhere in `_data/tutorials.yml`:

   ```yaml
   - slug: my-new-tutorial        # unique id
     title: My new tutorial
     text: One sentence saying what the reader will do.
     category: qmmm               # an id from _data/categories.yml
     tools: [CP2K, VMD]           # each one becomes a software filter
     url: https://arvpinto.github.io/my_new_tutorial/
     image: new.webp
     alt: What the image shows
     added: 2026-11-01            # first publication; newest is featured, "New" label for 180 days
   ```

3. Push. The latest addition, counts, filters and "New" labels update by themselves.

## Topics and series

- `_data/categories.yml`: topic names and colours. Add a topic here before using it in a tutorial.
- `_data/tracks.yml`: tutorials that form an ordered series. Each one lists tutorial slugs in `steps`, and those cards show "Part N of ..." in the catalogue.

## Files

- `_layouts/default.html`: page markup.
- `assets/css/style.scss`: styles (black theme; no remote theme is used).
- `assets/js/hub.js`: search, filters and paging.
- `assets/img/cards/`, `assets/img/header-*.webp`, `assets/img/about-*.webp`: compressed images used by the page (originals: `assets/img/HEADER.png`, `artwork/ABOUT.png`).
- `assets/img/social.jpg`: landscape crop of the header artwork used for link previews (Slack, LinkedIn, etc.).
- `artwork/`, `assets/img/HEADER.png`: original full-size images, kept as sources. To change the header artwork, replace `HEADER.png` and regenerate `header-800.webp` and `header-1400.webp` from it.
