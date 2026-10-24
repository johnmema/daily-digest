# Editorial cover reader

Preview-only branch. No publishing, ingestion, queue mode, or database migration changes.

The home page uses live paper records with native vertical scroll snap. Each cover continuously reveals the essay sheet over the same full-size cover, with canonical paper history. Tapping the exposed cover reverses the reveal and returns to its selected position. Next advances to the next older paper's cover. No Close button. The full library remains at /library. Reader markdown, sources, highlights, progress and sharing are retained.

Artwork is keyed by paper ID in lib/cover-art.json; assets are local in public/covers. Photo provenance is recorded in docs/cover-photo-sources.txt and lib/cover-art-sources.json. All 42 current records have mapped local photography. No.45 CC BY2.0 and Quantum Error Correction CC BY-SA4.0 photo credits, source links, license links and crop/darkening notices are rendered at the essay footer. ShareAlike is scoped to the Quantum cover photo adaptation, not the essay or app. New publications without mapped artwork currently use a solid-color titled cover. A future artwork production workflow needs separate approval; this branch does not alter daily writing or publishing semantics.

Before merging: inspect phone320px/390px and desktop, snap/cover-return/next/deep links, source list, attribution and live archive completeness. Never mutate real articles or create test annotations solely for UI checks.

Opening always starts at the cover. A saved reading position is available through Resume reading rather than jumping past the reveal. Native snap is not claimed as an exact tactile match to the reference custom scroller.
