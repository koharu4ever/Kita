# Third-Party Notices

This file records third-party material incorporated into Kita. It applies only
to the material listed below and does not grant or describe a license for the
rest of the Kita repository.

## Reviews reaction artwork

The Anki-tan reaction artwork under
`public/reviews/reactions/anki-tan/` is by **Shigeyuki** and is redistributed
unmodified under the Creative Commons Attribution-ShareAlike 4.0 International
license.

- Artist: <https://ankiweb.net/shared/info/1136455830>
- License: <https://creativecommons.org/licenses/by-sa/4.0/>
- The original notice is retained as
  `public/reviews/reactions/anki-tan/NOTICE.txt`.

Kita uses part of this artwork around the Reviews discussion panel and maps
selected images onto Giscus reactions. The latter CSS integration retains
Giscus's native emoji as a compatibility fallback.

## Reviews blog-derived visual assets

The cursor images under `public/reviews/cursor/`, character navigation images
under `public/reviews/navigation/`, and local UI preview images under
`public/reviews/preview/` are reused from the owner's Kral blog source with the
owner's explicit permission for Kita. They are scoped to the `/reviews`
experience and are not represented here as generally redistributable assets
under an open-source license.

## Project-owner supplied legacy visual assets

On 2026-09-01, the project owner chose to restore the visual set used by Kita
immediately before the later generated-art replacement and explicitly confirmed
that Kita may use the corresponding image resources from the owner's local Kral
blog source. The files were restored from the pre-replacement repository tree at
commit `ff957aa`; the optimized homepage WebP versions were first introduced at
commit `3507651`.

- `public/cover.webp`
- `public/home-rain-harbor.webp` and its legacy-path JPEG counterpart
- `public/home-sunset-field.webp` and its legacy-path JPEG counterpart
- `public/home-sea-girl.webp` and its legacy-path JPEG counterpart
- `public/home-night-sky.webp` and its legacy-path JPEG counterpart
- `public/about-bg.jpg`
- `public/P3F.jpg`

This records project-specific authorization and repository provenance; it does
not represent every image as generally redistributable under an open-source
license. The public filenames remain stable because historical migrations, code
references, and existing content may still reference them.

## Tools archive port from the owner's blog

The five Tools views and archive controls are adapted from the owner's
`koharu-hexo/scripts/notes-gallery.js`,
`source/js/notes-gallery-controls.js`, and the Notes section of
`source/css/custom.css`, with explicit permission on 2026-09-02.
The original visual values and class names are retained in
`src/features/tools/components/tools-archive.css`; Hexo DOM initialization
is replaced with React state, and article-only fields are mapped to Tools metadata.

The following existing blog assets were copied with the same permission:

| Kita asset                               | Blog source                                    |
| ---------------------------------------- | ---------------------------------------------- |
| `public/tools/archive/projects.webp`     | `source/img/start/projects.webp`               |
| `public/tools/archive/text-hooking.webp` | `source/img/covers/learning-notes.webp`        |
| `public/tools/archive/runtime.webp`      | `source/img/covers/dev-container.webp`         |
| `public/tools/archive/database.webp`     | `source/img/covers/database-migrations.webp`   |
| `public/tools/archive/capture.webp`      | `source/img/covers/kita-content-workflow.webp` |

These are decorative category illustrations, not screenshots or logos of
the linked tools. This port does not claim original authorship of the artwork
or grant any additional reuse rights.

## Homepage rain audio

- Work: **Lo-Fi Rain Sounds** by **DRAGON-STUDIO**.
- Source: <https://pixabay.com/sound-effects/nature-lo-fi-rain-sounds-444804/>
- License: Pixabay Content License, <https://pixabay.com/service/license-summary/>
  (source and license summary checked 2026-09-02).
- The project owner supplied `dragon-studio-lo-fi-rain-sounds-444804.mp3` for
  this local preview. The original download is not included in the repository.
- `public/audio/home-rain.mp3` contains only source seconds 70–88, converted to
  44.1 kHz stereo MP3 at 160 kbps with +8 dB gain; no music or generated rain
  is mixed in. Runtime playback overlaps the final/initial two seconds using
  an equal-power PCM crossfade, producing a roughly 16-second ambient loop.

This is a third-party sound effect integrated into Kita's interactive homepage,
not a Kita-original recording or a standalone audio download product. The
Pixabay restrictions still apply; it is not relicensed as general open-source
audio. This entry records the local prototype asset and does not claim that
the filename or waveform proves it was recorded against a glass window.

## RainEffect

Kita's rain-on-glass effect is adapted from **Rain & Water Effect Experiments
(RainEffect)** by Lucas Bebber, published by Codrops.

- Upstream source: <https://github.com/codrops/RainEffect>
- Codrops license information: <https://tympanus.net/codrops/licensing/>

The adapted runtime is located in:

- `src/features/home/lib/rain-effect/`

Kita also uses the following RainEffect texture assets:

- `public/rain-effect/drop-alpha.png`
- `public/rain-effect/drop-color.png`
- `public/rain-effect/drop-shine.png`

Kita ports and organizes the effect as TypeScript modules and integrates it
with the React/Next.js lifecycle, viewport-aware initialization, cleanup, and
reduced-motion behavior. It does not redistribute the original demonstration
as an unmodified standalone work.

The RainEffect repository permits integrating or building upon the work in
personal or commercial projects and asks that it not be republished,
redistributed, or sold "as-is." Codrops' general license page states that its
downloadable demos use the MIT License unless a demo says otherwise. Both
upstream references are retained above so the specific RainEffect terms and
the current Codrops license text can be reviewed together.

The MIT notice retrieved from Codrops on 2026-09-01 is reproduced below:

```text
Copyright (c) 2026 Codrops

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
