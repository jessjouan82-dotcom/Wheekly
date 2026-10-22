# Building Wheekly's CSS

Styles come from `tailwind.css`, built from the classes used in `index.html`
(config in `tailwind.config.js`). Rebuild whenever you add or change Tailwind
classes, and commit the result:

    tailwindcss -c tailwind.config.js -i src/input.css -o tailwind.css --minify

`src/input.css` is just:

    @tailwind base;
    @tailwind components;
    @tailwind utilities;

Use the standalone Tailwind CLI v3.4.17 (no Node needed):
https://github.com/tailwindlabs/tailwindcss/releases/tag/v3.4.17

Class names must appear in full in `index.html` (e.g. `bg-rose-600`). Names built
by string concatenation (`bg-${colour}-600`) will not be picked up.

Libraries in `vendor/` are pinned copies (Chart.js 4.5.1, supabase-js 2.118.0).
To upgrade, replace the file, update the `<script>` tag and `sw.js`, and bump
`CACHE_VERSION` in `sw.js`.

## Tests

`tests/sync.test.mjs` checks the cloud-sync logic (merge, offline edits, two devices,
write races) against a mock cloud. It reads the sync code straight out of `index.html`.
Run it with Bun or Node 18+:

    bun tests/sync.test.mjs

Keep the `<sync-merge>` markers in `index.html`; the test finds the merge code with them.
