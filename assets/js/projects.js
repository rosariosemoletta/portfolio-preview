/**
 * PROJECTS.JS — Rosario Semoletta
 * ─────────────────────────────────
 * This file is managed by the Studio (the rosario-studio folder): when you save there, the
 * Studio rewrites the whole file and keeps a backup of the previous one. You can still edit
 * it by hand, but notes like these are regenerated, so put your own comments elsewhere.
 *
 * The home carousel, the work grid and the project pages all read this list. The order of
 * the list is the order on the site. On the home carousel the middle card of the list starts
 * in focus, so put your best project in the middle.
 *
 * Fields:
 *   id        → unique string, also used in the URL (e.g. "segnale")
 *   title     → project title
 *   tag       → category, one of: "Motion Design", "Visual Design", "UI/UX Design"
 *   year      → year
 *   longDesc  → description (project page, HTML allowed)
 *   client    → optional. The client (shown on the project page).
 *   tools     → optional. The tools used, e.g. "After Effects, Cinema 4D".
 *   cover     → cover image of the home card, portrait 3:4 (e.g. "assets/img/segnale-cover-900.webp").
 *               Leave "" and a colored card with the title is shown instead.
 *   coverWide → optional. A landscape 4:3 version of the cover, used on the Work page grid.
 *               Without it the Work page uses the cover, cropped to the middle.
 *   media     → the content of the project page, shown on the right in the order you write it.
 *               Every item has a role:
 *                 role: "final"  a final video of the project: full player, sound, full screen
 *                 role: "draft"  accompanying material: images, and videos that play as muted
 *                                loops while they are on screen
 *               If the role is left out, the first item is "final" and the others are "draft".
 *               The first item is also what the card grows into when the project opens.
 *               Item examples:
 *                 { type: "video", role: "final", src: "assets/video/x.mp4", poster: "assets/img/x-poster.webp", ratio: "16:9" }
 *                 { type: "video", role: "final", src: "https://vimeo.com/123456789" }
 *                 { type: "image", role: "draft", src: "assets/img/x-1600.webp", srcset: "assets/img/x-800.webp 800w, assets/img/x-1600.webp 1600w", ratio: "3:2" }
 *                 { type: "placeholder", ratio: "16:9", color: "#e5e9dc" }      a colored block (samples)
 *               Optional on an item: ratio (its shape, so it does not have to be measured),
 *               poster (preview image of a video), webm (a lighter copy of a video file),
 *               avif (an AVIF srcset for an image), span ("full" | "half": force the width),
 *               alpha (true for an image with transparency: it is shown without the grey block behind it).
 *               The layout is automatic: wide items take the full width, tall and square ones
 *               sit two by two, and later items fill the gaps (like tetris).
 *   link      → external URL (Behance, Vimeo, etc.) — empty string "" if none
 *   color     → card background when there is no cover (hex)
 *   blob      → color of the decorative circle on that card (hex)
 *   mood      → optional. The atmosphere of the background sound while this project is in
 *               focus: "calm" (default), "warm", "tense", "open" or "dark".
 *   featured  → optional. true on ONE project = the card that starts in focus on the home
 *               carousel. Without it the middle card of the list starts in focus.
 */

var PROJECTS = [
  {
    id:        "intdev",
    title:     "INTDEV - Brand Motion Graphics",
    tag:       "Motion Design",
    year:      "2026",
    longDesc:  "Created for INTDEV, this motion graphics piece takes a fast, visually refined pass at the brand's identity, centred on the logo — its construction, its underlying structural logic, and the variations it can support — carried through a run of fluid sequences. Two-dimensional motion is paired with subtle 3D elements so every transition stays seamless and the visual language holds together shot to shot. Precision and pacing mattered most here, in service of a clean, minimal result that lets the brand's presence come through motion rather than decoration.",
    client:    "INTDEV",
    cover:     "assets/img/intdevimg.png",
    media: [
      { type: "video", role: "final", src: "assets/video/intdev_brand.mp4" },
      { type: "video", role: "draft", src: "assets/video/segnale-intdevvideo.mp4", poster: "assets/img/segnale-intdevvideo-poster.webp", ratio: "16:9" }
    ],
    link:      "",
    color:     "#e8e2d8",
    blob:      "#c8543a",
    mood:      "calm",
    featured:  true
  },
  {
    id:        "pointcloud",
    title:     "Point Cloud Reconstruction",
    tag:       "Visual Design",
    year:      "2026",
    longDesc:  "A single photograph is the only input: a depth map pulled from it becomes the basis for a procedural reconstruction into a three-dimensional point cloud, assembled node by node in TouchDesigner. The piece sits deliberately between control and experiment — a real-time, node-based system that turns flat imagery into something volumetric, and tests how far depth estimation can push the way an image gets read. It belongs to a longer-running line of work on building spatial experiences out of the least visual information possible, finished with a pass in After Effects.",
    tools:     "TouchDesigner, Adobe After Effects",
    cover:     "assets/img/pointcloud.png",
    media: [
      { type: "video", role: "final", src: "assets/video/orbita-pointcloud-2.mp4", poster: "assets/img/orbita-pointcloud-2-poster.webp", ratio: "1:1" },
      { type: "image", role: "draft", src: "assets/img/orbita-depth1-1080.webp", srcset: "assets/img/orbita-depth1-640.webp 640w, assets/img/orbita-depth1-1080.webp 1080w", avif: "assets/img/orbita-depth1-640.avif 640w, assets/img/orbita-depth1-1080.avif 1080w", ratio: "1:1" },
      { type: "image", role: "draft", src: "assets/img/orbita-depth2-1080.webp", srcset: "assets/img/orbita-depth2-640.webp 640w, assets/img/orbita-depth2-1080.webp 1080w", avif: "assets/img/orbita-depth2-640.avif 640w, assets/img/orbita-depth2-1080.avif 1080w", ratio: "1:1" }
    ],
    link:      "",
    color:     "#dce5e9",
    blob:      "#3f6f8a",
    mood:      "open"
  },
  {
    id:        "particleflow",
    title:     "Particle Flow — Procedural Motion Study",
    tag:       "Motion Design",
    year:      "2026",
    longDesc:  "Houdini supplies the engine for this one: a fully procedural particle system generating fluid movement, shifting density and a controlled amount of chaos, driven by simulation rather than keyframes. Once that setup was locked, the piece moved to Blender for look development, lighting, camera work and rendering, then into After Effects for the compositing pass that shaped its final timing and depth. What holds it together is that three-stage pipeline — simulation, cinematography, post — pushing toward a high-energy study that stays legible even at speed.",
    tools:     "Houdini, Blender, Adobe After Effects",
    cover:     "assets/img/particleflow-cover-1080.webp",
    media: [
      { type: "video", role: "final", src: "assets/video/materia-particles-2.mp4", poster: "assets/img/materia-particles-2-poster.webp", ratio: "9:16" }
    ],
    link:      "",
    color:     "#ece3da",
    blob:      "#a97a3c",
    mood:      "warm"
  },
  {
    id:        "autobuy",
    title:     "AUTOBUY - Product Motion Design for Invity",
    tag:       "Motion Design",
    year:      "2026",
    longDesc:  "A product-led motion piece for Invity, made to explain Auto Buy — the feature that lets users schedule recurring Bitcoin purchases — without a word of narration. Real interface screens carry the story through strategy selection, setup, activation and ongoing management, with small, purposeful micro-interactions standing in for the friction a first-time user would otherwise feel. Every transition was timed in After Effects and Blender against the product's own visual language, so the piece reads as an extension of the app rather than an ad running alongside it.",
    client:    "Invity",
    tools:     "Adobe After Effects, Blender",
    cover:     "assets/img/vertex-cover-2-1200.webp",
    media: [
      { type: "video", role: "final", src: "assets/video/vertex-invity.mp4", poster: "assets/img/vertex-invity-poster.webp", ratio: "16:9" }
    ],
    link:      "",
    color:     "#e3dde9",
    blob:      "#7a5aa6",
    mood:      "tense"
  },
  {
    id:        "comet",
    title:     "COMET – Cinematic Motion Project",
    tag:       "Motion Design",
    year:      "2025",
    longDesc:  "COMET follows a comet crossing space and colliding with a planet, animated entirely by hand in After Effects — a two-dimensional exercise in composition, particle effects and energy simulation as much as it is a piece of storytelling. Timing and rhythm carried more weight than realism here, the goal being a cinematic result without ever leaving a flat 2D frame.",
    tools:     "Adobe After Effects",
    cover:     "assets/img/kinetic-cover-810.webp",
    coverWide: "assets/img/kinetic-cover-wide-1200.webp",
    media: [
      { type: "video", role: "final", src: "assets/video/kinetic-comet.mp4", poster: "assets/img/kinetic-comet-poster.webp", ratio: "16:9" },
      { type: "image", role: "draft", src: "assets/img/comet1-1280.webp", srcset: "assets/img/comet1-640.webp 640w, assets/img/comet1-1280.webp 1280w", avif: "assets/img/comet1-640.avif 640w, assets/img/comet1-1280.avif 1280w", ratio: "16:9" },
      { type: "image", role: "draft", src: "assets/img/comet2-1280.webp", srcset: "assets/img/comet2-640.webp 640w, assets/img/comet2-1280.webp 1280w", avif: "assets/img/comet2-640.avif 640w, assets/img/comet2-1280.avif 1280w", ratio: "16:9" },
      { type: "image", role: "draft", src: "assets/img/comet3-1280.webp", srcset: "assets/img/comet3-640.webp 640w, assets/img/comet3-1280.webp 1280w", avif: "assets/img/comet3-640.avif 640w, assets/img/comet3-1280.avif 1280w", ratio: "16:9" },
      { type: "image", role: "draft", src: "assets/img/comet4-1280.webp", srcset: "assets/img/comet4-640.webp 640w, assets/img/comet4-1280.webp 1280w", avif: "assets/img/comet4-640.avif 640w, assets/img/comet4-1280.avif 1280w", ratio: "16:9" }
    ],
    link:      "",
    color:     "#efe1d4",
    blob:      "#d0702f",
    mood:      "warm"
  },
  {
    id:        "codebreaker",
    title:     "CODEBREAKER - Playing Cards",
    tag:       "Visual Design",
    year:      "2026",
    longDesc:  "Codebreaker is a tribute to the golden age of technology, when green neon screens and cascading binary code stood for innovation and mystery in equal measure. It leans into the thrill of cracking codes, defying systems and courting the unknown — a mood every card was made to hold, balancing a minimalist deck against the sharper, stranger visuals of the digital underground.",
    tools:     "Adobe Illustrator, Blender, Adobe After Effects, HTML/CSS",
    cover:     "assets/img/codebreaker-cover-810.webp",
    coverWide: "assets/img/codebreaker-cover-wide-1200.webp",
    media: [
      { type: "video", role: "final", src: "assets/video/nocturne-codebreakervideo-2.mp4", poster: "assets/img/nocturne-codebreakervideo-2-poster.webp", ratio: "16:9" },
      { type: "image", role: "draft", src: "assets/img/codebreaker1-2-1920.webp", srcset: "assets/img/codebreaker1-2-640.webp 640w, assets/img/codebreaker1-2-1280.webp 1280w, assets/img/codebreaker1-2-1920.webp 1920w", avif: "assets/img/codebreaker1-2-640.avif 640w, assets/img/codebreaker1-2-1280.avif 1280w, assets/img/codebreaker1-2-1920.avif 1920w", ratio: "1.917", alpha: true }
    ],
    link:      "https://www.behance.net/gallery/216350981/Codebreaker-Playing-Cards",
    color:     "#d9dde6",
    blob:      "#34405f",
    mood:      "dark"
  },
  {
    id:        "y2k",
    title:     "Logo Design - Y2K Style",
    tag:       "Visual Design",
    year:      "2025",
    longDesc:  "A logo built around the Y2K aesthetic — that particular mix of futuristic and nostalgic that defined the turn of the millennium. Chrome effects, soft reflections and bold, early-2000s typography do most of the work, standing in for the digital optimism of an era when metallic finishes and glossy gradients were shorthand for progress. The brief, essentially, was to borrow that language and run it through a more contemporary hand.",
    tools:     "Adobe Illustrator, Adobe Photoshop",
    cover:     "assets/img/atlas-cover-810.webp",
    coverWide: "assets/img/atlas-cover-wide-1200.webp",
    media: [
      { type: "image", role: "final", src: "assets/img/atlas-logo-fhd-2-1920.webp", srcset: "assets/img/atlas-logo-fhd-2-640.webp 640w, assets/img/atlas-logo-fhd-2-1280.webp 1280w, assets/img/atlas-logo-fhd-2-1920.webp 1920w", avif: "assets/img/atlas-logo-fhd-2-640.avif 640w, assets/img/atlas-logo-fhd-2-1280.avif 1280w, assets/img/atlas-logo-fhd-2-1920.avif 1920w", ratio: "16:9" },
      { type: "image", role: "draft", src: "assets/img/atlas-logo1-1080.webp", srcset: "assets/img/atlas-logo1-640.webp 640w, assets/img/atlas-logo1-1080.webp 1080w", avif: "assets/img/atlas-logo1-640.avif 640w, assets/img/atlas-logo1-1080.avif 1080w", ratio: "1:1" },
      { type: "image", role: "draft", src: "assets/img/atlas-logo2-1080.webp", srcset: "assets/img/atlas-logo2-640.webp 640w, assets/img/atlas-logo2-1080.webp 1080w", avif: "assets/img/atlas-logo2-640.avif 640w, assets/img/atlas-logo2-1080.avif 1080w", ratio: "1:1" }
    ],
    link:      "",
    color:     "#e9e4d6",
    blob:      "#b39b3a",
    mood:      "calm"
  },
  {
    id:        "visual-principles",
    title:     "Visual Principles - Mini Graphic Guide",
    tag:       "Visual Design",
    year:      "2025",
    longDesc:  "Six infographics, six principles — gradient, contrast, balance, scale, alignment and hierarchy — each explained through the very thing it describes rather than through text alone. Layout, colour and type carry the argument in every panel, turning a fairly dry set of design fundamentals into a small, cohesive series that reads at a glance.",
    tools:     "Adobe Illustrator, Adobe Photoshop",
    cover:     "assets/img/visual-principles-mini-graphic-guide-cover-810.webp",
    coverWide: "assets/img/visual-principles-mini-graphic-guide-cover-wide-1200.webp",
    media: [
      { type: "image", role: "final", src: "assets/img/visual-principles-mini-graphic-guide-basics-1920.webp", srcset: "assets/img/visual-principles-mini-graphic-guide-basics-640.webp 640w, assets/img/visual-principles-mini-graphic-guide-basics-1280.webp 1280w, assets/img/visual-principles-mini-graphic-guide-basics-1920.webp 1920w", avif: "assets/img/visual-principles-mini-graphic-guide-basics-640.avif 640w, assets/img/visual-principles-mini-graphic-guide-basics-1280.avif 1280w, assets/img/visual-principles-mini-graphic-guide-basics-1920.avif 1920w", ratio: "16:9" },
      { type: "image", role: "draft", src: "assets/img/visual-principles-mini-graphic-guide-basic1-1080.webp", srcset: "assets/img/visual-principles-mini-graphic-guide-basic1-640.webp 640w, assets/img/visual-principles-mini-graphic-guide-basic1-1080.webp 1080w", avif: "assets/img/visual-principles-mini-graphic-guide-basic1-640.avif 640w, assets/img/visual-principles-mini-graphic-guide-basic1-1080.avif 1080w", ratio: "4:5" },
      { type: "image", role: "draft", src: "assets/img/visual-principles-mini-graphic-guide-basic2-1080.webp", srcset: "assets/img/visual-principles-mini-graphic-guide-basic2-640.webp 640w, assets/img/visual-principles-mini-graphic-guide-basic2-1080.webp 1080w", avif: "assets/img/visual-principles-mini-graphic-guide-basic2-640.avif 640w, assets/img/visual-principles-mini-graphic-guide-basic2-1080.avif 1080w", ratio: "4:5" },
      { type: "image", role: "draft", src: "assets/img/visual-principles-mini-graphic-guide-basic3-1080.webp", srcset: "assets/img/visual-principles-mini-graphic-guide-basic3-640.webp 640w, assets/img/visual-principles-mini-graphic-guide-basic3-1080.webp 1080w", avif: "assets/img/visual-principles-mini-graphic-guide-basic3-640.avif 640w, assets/img/visual-principles-mini-graphic-guide-basic3-1080.avif 1080w", ratio: "4:5" },
      { type: "image", role: "draft", src: "assets/img/visual-principles-mini-graphic-guide-basic4-1080.webp", srcset: "assets/img/visual-principles-mini-graphic-guide-basic4-640.webp 640w, assets/img/visual-principles-mini-graphic-guide-basic4-1080.webp 1080w", avif: "assets/img/visual-principles-mini-graphic-guide-basic4-640.avif 640w, assets/img/visual-principles-mini-graphic-guide-basic4-1080.avif 1080w", ratio: "4:5" },
      { type: "image", role: "draft", src: "assets/img/visual-principles-mini-graphic-guide-basic5-1080.webp", srcset: "assets/img/visual-principles-mini-graphic-guide-basic5-640.webp 640w, assets/img/visual-principles-mini-graphic-guide-basic5-1080.webp 1080w", avif: "assets/img/visual-principles-mini-graphic-guide-basic5-640.avif 640w, assets/img/visual-principles-mini-graphic-guide-basic5-1080.avif 1080w", ratio: "4:5" },
      { type: "image", role: "draft", src: "assets/img/visual-principles-mini-graphic-guide-basic6-1080.webp", srcset: "assets/img/visual-principles-mini-graphic-guide-basic6-640.webp 640w, assets/img/visual-principles-mini-graphic-guide-basic6-1080.webp 1080w", avif: "assets/img/visual-principles-mini-graphic-guide-basic6-640.avif 640w, assets/img/visual-principles-mini-graphic-guide-basic6-1080.avif 1080w", ratio: "4:5" }
    ],
    link:      "",
    color:     "#ece3da",
    blob:      "#a97a3c"
  },
  {
    id:        "turn-the-lights-off",
    title:     "Turn the Lights Off — 3D Lyrics Visual",
    tag:       "Motion Design",
    year:      "2022",
    longDesc:  "Made for OTASH's remix of Turn the Lights Off, this lyrics visual moves at the same pace as the track. Atmospheric 3D scenes and animated typography were modelled and lit in Blender with an eye on spatial mood more than realism, then carried into After Effects for the edit — compositing, motion typography, transitions — where the piece found its final pacing. Music set the tempo throughout; the lyrics, and everything else on screen, were built to follow it.",
    client:    "OTASH",
    tools:     "Blender, Adobe After Effects",
    cover:     "assets/img/turn-the-lights-off-3d-lyrics-visual-cover-900.webp",
    coverWide: "assets/img/turn-the-lights-off-3d-lyrics-visual-cover-wide-1200.webp",
    media: [
      { type: "video", role: "final", src: "https://youtu.be/Ai5KuwenAyo", ratio: "16:9" }
    ],
    link:      "https://youtu.be/Ai5KuwenAyo",
    color:     "#dcdee9",
    blob:      "#253473"
  },
  {
    id:        "sport-car",
    title:     "Sport Car - Commercial",
    tag:       "Motion Design",
    year:      "2024",
    longDesc:  "Lighting, materials, cinematography, motion: this car animation exists as a deliberate test of all four rather than the result of a client brief. The target was a result convincing enough to sit next to real commercial or product-showcase work, with the process doubling as a way to sharpen the CGI skills a project like that actually demands.",
    client:    "Portfolio",
    tools:     "Blender, After Effects",
    cover:     "assets/img/car-cover-1200.webp",
    media: [
      { type: "video", role: "final", src: "assets/video/corvette.mp4", poster: "assets/img/corvette-poster.webp", ratio: "2.388" },
      { type: "placeholder", ratio: "9:16", color: "#c2ceb1" }
    ],
    link:      "",
    color:     "#e5e9dc",
    blob:      "#6f8f4e",
    mood:      "open"
  },
  {
    id:        "miles-morales",
    title:     "MILES MORALES - 3D Animation",
    tag:       "Motion Design",
    year:      "2022",
    longDesc:  "Composition and mood matter more than movement in this short, 3D-modelled take on Miles Morales. Lighting, texture work and atmosphere do the job of capturing the character rather than any actual motion — part creative exercise, part tribute to one of Spider-Man's more compelling versions.",
    tools:     "Blender, Adobe After Effects",
    cover:     "assets/img/miles-morales-3d-animation-cover-900.webp",
    coverWide: "assets/img/miles-morales-3d-animation-cover-wide-1080.webp",
    media: [
      { type: "video", role: "final", src: "assets/video/miles-morales-3d-animation-morales.mp4", poster: "assets/img/miles-morales-3d-animation-morales-poster.webp", ratio: "9:16" }
    ],
    link:      "",
    color:     "#ece3da",
    blob:      "#a97a3c"
  },
  {
    id:        "parfum",
    title:     "EAU DE PARFUM - Commercial",
    tag:       "Motion Design",
    year:      "2024",
    longDesc:  "A 3D advertising concept for a fragrance, built around one idea: sell the atmosphere, not the bottle. Fluid camera movement, considered lighting and a restrained set of materials stand in for the scent itself, aiming at the kind of premium, understated feel a perfume ad usually reaches for. Blender handled the animation, with Premiere Pro for the final edit and pacing.",
    tools:     "Blender, Adobe Premiere Pro",
    cover:     "assets/img/eau-de-parfum-commercial-cover-900.webp",
    media: [
      { type: "video", role: "final", src: "assets/video/eau-de-parfum-commercial-parfum.mp4", poster: "assets/img/eau-de-parfum-commercial-parfum-poster.webp", ratio: "9:16" }
    ],
    link:      "",
    color:     "#ece3da",
    blob:      "#a97a3c"
  },
  {
    id:        "caustics-in-motion",
    title:     "CAUSTICS IN MOTION",
    tag:       "Motion Design",
    year:      "2023",
    longDesc:  "A hands-on test of glass, caustics and light in a 3D scene, chasing how far reflections and refractions could be pushed toward something photoreal. Octane handled the rendering, Blender the scene, Premiere Pro the edit — less a finished piece than a way to sharpen an eye for how light actually behaves on transparent surfaces.",
    tools:     "Blender, Octane Render, Adobe Premiere Pro",
    cover:     "assets/img/caustics-in-motion-cover-900.webp",
    media: [
      { type: "video", role: "final", src: "assets/video/caustics-in-motion-caustics-2.mp4", poster: "assets/img/caustics-in-motion-caustics-2-poster.webp", ratio: "9:16" }
    ],
    link:      "",
    color:     "#ece3da",
    blob:      "#a97a3c"
  },
  {
    id:        "liminal",
    title:     "LIMINAL (Horror Short)",
    tag:       "Motion Design",
    year:      "2024",
    longDesc:  "A horror short built around the Backrooms and liminal spaces — the fluorescent-lit hallways and empty rooms that feel wrong precisely because nothing in them is. Blender modelled the environments, After Effects layered in the distortion and unease, and Premiere Pro shaped a slow, oppressive pace with almost no cuts to hide behind. The scare here isn't a jump, it's the absence of anyone — or anything — that would explain where you are.",
    tools:     "Blender, Adobe After Effects, Adobe Premiere Pro",
    cover:     "assets/img/liminal-horror-short-cover-540.webp",
    coverWide: "assets/img/liminal-horror-short-cover-wide-960.webp",
    media: [
      { type: "video", role: "final", src: "https://youtu.be/6ljFLh40Muc", ratio: "16:9" },
      { type: "image", role: "draft", src: "assets/img/liminal-horror-short-liminal1-1920.webp", srcset: "assets/img/liminal-horror-short-liminal1-640.webp 640w, assets/img/liminal-horror-short-liminal1-1280.webp 1280w, assets/img/liminal-horror-short-liminal1-1920.webp 1920w", avif: "assets/img/liminal-horror-short-liminal1-640.avif 640w, assets/img/liminal-horror-short-liminal1-1280.avif 1280w, assets/img/liminal-horror-short-liminal1-1920.avif 1920w", ratio: "16:9" },
      { type: "image", role: "draft", src: "assets/img/liminal-horror-short-liminal2-1920.webp", srcset: "assets/img/liminal-horror-short-liminal2-640.webp 640w, assets/img/liminal-horror-short-liminal2-1280.webp 1280w, assets/img/liminal-horror-short-liminal2-1920.webp 1920w", avif: "assets/img/liminal-horror-short-liminal2-640.avif 640w, assets/img/liminal-horror-short-liminal2-1280.avif 1280w, assets/img/liminal-horror-short-liminal2-1920.avif 1920w", ratio: "16:9" },
      { type: "image", role: "draft", src: "assets/img/liminal-horror-short-liminal3-1920.webp", srcset: "assets/img/liminal-horror-short-liminal3-640.webp 640w, assets/img/liminal-horror-short-liminal3-1280.webp 1280w, assets/img/liminal-horror-short-liminal3-1920.webp 1920w", avif: "assets/img/liminal-horror-short-liminal3-640.avif 640w, assets/img/liminal-horror-short-liminal3-1280.avif 1280w, assets/img/liminal-horror-short-liminal3-1920.avif 1920w", ratio: "16:9" },
      { type: "image", role: "draft", src: "assets/img/liminal-horror-short-liminal4-1920.webp", srcset: "assets/img/liminal-horror-short-liminal4-640.webp 640w, assets/img/liminal-horror-short-liminal4-1280.webp 1280w, assets/img/liminal-horror-short-liminal4-1920.webp 1920w", avif: "assets/img/liminal-horror-short-liminal4-640.avif 640w, assets/img/liminal-horror-short-liminal4-1280.avif 1280w, assets/img/liminal-horror-short-liminal4-1920.avif 1920w", ratio: "16:9" }
    ],
    link:      "https://youtu.be/6ljFLh40Muc",
    color:     "#ece3da",
    blob:      "#a97a3c"
  },
  {
    id:        "caesar",
    title:     "CAESAR - NFT Project",
    tag:       "Motion Design",
    year:      "2021",
    longDesc:  "Commissioned by a friend, Jimmy Lee, this collectible card gets brought into 3D, its illustrated character sealed inside a transparent case and lit like a museum piece rather than a screenshot. The priority throughout was giving someone else's artwork a presentation that felt considered rather than automated — reflections, depth and light doing the work of a proper display case, built in Blender and cut together in Premiere Pro.",
    client:    "Jimmy Lee",
    tools:     "Blender, Adobe Premiere Pro",
    cover:     "assets/img/caesar-nft-project-cover-900.webp",
    media: [
      { type: "video", role: "final", src: "assets/video/caesar-nft-project-caesar.mp4", poster: "assets/img/caesar-nft-project-caesar-poster.webp", ratio: "4:5" }
    ],
    link:      "",
    color:     "#ece3da",
    blob:      "#a97a3c"
  },
  {
    id:        "kevin-lavitt",
    title:     "KEVIN LAVITT - Motion Graphics",
    tag:       "Motion Design",
    year:      "2024",
    longDesc:  "For Kevin Lavitt, a sound designer, this video intro leans on a synthwave palette — neon, retro-futuristic grids, light that behaves like it's coming off a CRT. It was cut to Kevin's own sound design rather than the other way around, so the piece reads less like graphics with music under it and more like one continuous audiovisual idea.",
    client:    "Kevin Lavitt",
    tools:     "Adobe After Effects",
    cover:     "assets/img/kevin-lavitt-motion-graphics-cover-810.webp",
    media: [
      { type: "video", role: "final", src: "assets/video/kevin-lavitt-motion-graphics-kl.mp4", poster: "assets/img/kevin-lavitt-motion-graphics-kl-poster.webp", ratio: "16:9" }
    ],
    link:      "www.kevinlavitt.com",
    color:     "#ece3da",
    blob:      "#a97a3c"
  },
  {
    id:        "ethereal-boot",
    title:     "Ethereal Boot",
    tag:       "Motion Design",
    year:      "2025",
    longDesc:  "A looping boot animation styled after early-2000s console startups — the moody, faintly overproduced logo sequences consoles used to open with. Abstract shapes drift through smooth transitions under an ambient soundscape, less concerned with landing any one message than with a mood: somewhere between a dream and a system loading screen, made in Blender and After Effects.",
    tools:     "Blender, Adobe After Effects",
    cover:     "assets/img/ethereal-boot-cover-810.webp",
    media: [
      { type: "video", role: "final", src: "assets/video/ethereal-boot-anim.mp4", poster: "assets/img/ethereal-boot-anim-poster.webp", ratio: "1:1" }
    ],
    link:      "",
    color:     "#ece3da",
    blob:      "#a97a3c"
  },
  {
    id:        "watch-vfx",
    title:     "Watch VFX",
    tag:       "Visual Design",
    year:      "2022",
    longDesc:  "Filmed on a phone — just a watch on a real wrist — then layered with futuristic overlays to push it toward something closer to sci-fi than product photography. The point wasn't the watch itself so much as the process: getting digital elements to sit convincingly on live-action footage, done entirely in After Effects.",
    tools:     "Adobe After Effects",
    cover:     "assets/img/watch-vfx-cover-900.webp",
    media: [
      { type: "video", role: "final", src: "assets/video/watch-vfx-watch.mp4", poster: "assets/img/watch-vfx-watch-poster.webp", ratio: "9:16" }
    ],
    link:      "",
    color:     "#ece3da",
    blob:      "#a97a3c"
  },
  {
    id:        "parfum-concept",
    title:     "EAU DE PARFUM - Commercial Concept",
    tag:       "Motion Design",
    year:      "2022",
    longDesc:  "A second, unofficial pass at a perfume commercial, this time built around the mood of the 'One Million' fragrance rather than an in-house brand. Dynamic lighting and a deliberately opulent composition do the talking here — the exercise being how far 3D animation and pure atmosphere can carry a story with no product ever really shown.",
    cover:     "assets/img/eau-de-parfum-commercial-concept-cover-900.webp",
    media: [
      { type: "video", role: "final", src: "assets/video/eau-de-parfum-commercial-concept-million.mp4", poster: "assets/img/eau-de-parfum-commercial-concept-million-poster.webp", ratio: "9:16" }
    ],
    link:      "",
    color:     "#ece3da",
    blob:      "#a97a3c"
  },
  {
    id:        "fluid-commercial",
    title:     "Concept Commercial - Unfinished",
    tag:       "Motion Design",
    year:      "2022",
    longDesc:  "An unfinished, entirely unofficial 3D concept for a Coca-Cola-style commercial — mostly an excuse to put fluid simulation through its paces on a recognisable product shape. What exists leans on liquid dynamics for energy and realism rather than on a finished script or edit: a sketch of an idea more than a commercial, made in Blender with Premiere Pro for the assembly.",
    tools:     "Blender, Adobe Premiere Pro",
    cover:     "assets/img/concept-commercial-unfinished-cover-810.webp",
    media: [
      { type: "video", role: "final", src: "assets/video/concept-commercial-unfinished-cola.mp4", poster: "assets/img/concept-commercial-unfinished-cola-poster.webp", ratio: "16:9" }
    ],
    link:      "",
    color:     "#ece3da",
    blob:      "#a97a3c"
  },
  {
    id:        "ui-cards-concept",
    title:     "UI Cards Concept",
    tag:       "UI/UX Design",
    year:      "2025",
    longDesc:  "Title, supporting copy, a call to action: a small system of content cards rather than a single screen, repeated across a set of consistent, minimal components. The exercise was less about any one card and more about the rules behind all of them — consistent spacing, type and hierarchy so the pattern would hold up reused dozens of times over, built in Figma.",
    tools:     "Figma",
    cover:     "assets/img/ui-cards-concept-cover-640.webp",
    coverWide: "assets/img/ui-cards-concept-cover-wide-1200.webp",
    media: [
      { type: "image", role: "final", src: "assets/img/ui-cards-concept-cardsui-2-1920.webp", srcset: "assets/img/ui-cards-concept-cardsui-2-640.webp 640w, assets/img/ui-cards-concept-cardsui-2-1280.webp 1280w, assets/img/ui-cards-concept-cardsui-2-1920.webp 1920w", avif: "assets/img/ui-cards-concept-cardsui-2-640.avif 640w, assets/img/ui-cards-concept-cardsui-2-1280.avif 1280w, assets/img/ui-cards-concept-cardsui-2-1920.avif 1920w", ratio: "16:9" }
    ],
    link:      "",
    color:     "#ece3da",
    blob:      "#a97a3c"
  },
  {
    id:        "booking",
    title:     "Booking App - UI Project",
    tag:       "UI/UX Design",
    year:      "2022",
    longDesc:  "A UI concept for a hotel booking app, aimed at getting someone from a search to a confirmed room in as few steps as possible. Hotel details, reviews and an advanced filter set sit around a calm, balanced palette so the interface stays out of the way of the decision, and a consistent type hierarchy keeps every screen — search, details, checkout — reading the same way.",
    tools:     "Figma",
    cover:     "assets/img/learning-copy-cover-810.webp",
    coverWide: "assets/img/learning-copy-cover-wide-1200.webp",
    media: [
      { type: "image", role: "final", src: "assets/img/learning-copy-booking-2-1920.webp", srcset: "assets/img/learning-copy-booking-2-640.webp 640w, assets/img/learning-copy-booking-2-1280.webp 1280w, assets/img/learning-copy-booking-2-1920.webp 1920w", avif: "assets/img/learning-copy-booking-2-640.avif 640w, assets/img/learning-copy-booking-2-1280.avif 1280w, assets/img/learning-copy-booking-2-1920.avif 1920w", ratio: "16:9", alpha: true }
    ],
    link:      "",
    color:     "#e6dcdc",
    blob:      "#b04a55",
    mood:      "tense"
  },
  {
    id:        "learning",
    title:     "E-Learning App - UI Project",
    tag:       "UI/UX Design",
    year:      "2022",
    longDesc:  "An e-learning app with a dark, low-glare theme meant to hold up across long study sessions. Courses, tests and quizzes sit inside a structured, minimal layout that tries to stay out of the way of actually learning something — fewer decisions on screen, more attention left for the material itself.",
    tools:     "Figma",
    cover:     "assets/img/pulse-cover-810.webp",
    coverWide: "assets/img/pulse-cover-wide-1200.webp",
    media: [
      { type: "image", role: "final", src: "assets/img/pulse-elearning-2-1920.webp", srcset: "assets/img/pulse-elearning-2-640.webp 640w, assets/img/pulse-elearning-2-1280.webp 1280w, assets/img/pulse-elearning-2-1920.webp 1920w", avif: "assets/img/pulse-elearning-2-640.avif 640w, assets/img/pulse-elearning-2-1280.avif 1280w, assets/img/pulse-elearning-2-1920.avif 1920w", ratio: "16:9", alpha: true }
    ],
    link:      "",
    color:     "#e6dcdc",
    blob:      "#b04a55",
    mood:      "tense"
  }
];
