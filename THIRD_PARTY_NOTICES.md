# Third-Party Notices

This file records third-party material incorporated into Kita. It applies only
to the material listed below and does not grant or describe a license for the
rest of the Kita repository.

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
