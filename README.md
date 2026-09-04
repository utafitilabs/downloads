# uhifadhi downloads

This repository is the download home for the uhifadhi field applications. Its
releases are the installable builds themselves, and the page built from this
repository is where people go to get them.

**The apps are free of charge.** Their source is proprietary and is **not** in
this repository — nothing here but the download page and the published builds.

## The apps

- **Doria** — the uhifadhi field app for patrols and observations. Releases are
  tagged `doria-<version>`.

## The page

`index.html` and `assets/` are served by GitHub Pages from `main`. The page reads
this repository's public releases API in the browser, so a new release appears on
the page as soon as it is published — the page itself is not rebuilt. If the API
cannot be reached or the browser is rate-limited, the page says so and links to
the releases list.

The site will later be served at `downloads.uhifadhi.org`; the domain attaches
separately and needs no change to these files.

## How releases get here

Releases are published automatically. Publishing a release in an application's
own repository copies its build and its notes into a matching release here — the
per-app workflow is the source of that. Releases are not created here by hand.

## Verifying a download

Every release records the SHA-256 of its build. After downloading:

```
shasum -a 256 <file>
```

The digest must match the one printed in the release notes.
