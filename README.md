# Robot Dog Maze Loading Experience

A cinematic, non-traditional loading screen: instead of a spinner or progress
bar, the visitor watches a small robotic dog autonomously navigate a simple
miniature maze while the (future) portfolio site loads behind the scenes.
This is a **standalone** project — it does not depend on or modify any other
project, and it does not build the actual portfolio site.

## What you'll see

1. A wide shot establishes a small maze sitting on a miniature model base.
2. The camera moves in closer as the robot dog does a small idle motion.
3. The dog walks the maze, turn by turn, with a mechanical trot cycle and a
   camera that follows/reframes at each turn.
4. Near the exit the camera tightens up for a more dramatic approach shot.
5. The dog arrives, settles, and the scene fades out.
6. A `robotDogIntroComplete` event fires, and (in this standalone project) a
   placeholder screen appears where the real site would take over.

## Project structure

```
loading_page_1/
├── index.html          # Canvas, status HUD, WebGL fallback, import map
├── style.css           # Minimal styling, fade transitions, responsive rules
├── main.js             # Orchestration: timeline, movement, HUD, transition
├── js/
│   ├── scene.js         # Renderer, camera, lighting, resize handling
│   ├── robotDog.js       # Procedural robot dog model + walk-cycle animation
│   ├── maze.js           # Procedural maze walls/floor/base, built from path.js
│   ├── path.js            # Waypoints + safe-route math (single source of truth)
│   └── animation.js       # Camera choreography (the cinematic shot sequence)
├── assets/               # Empty — everything is generated procedurally,
│                          # so there are no external model/texture files to ship
└── README.md
```

## How to run locally

Browsers block ES module imports from `file://`, so serve the folder over
HTTP. Any of these work:

```bash
# Python 3
python -m http.server 8000

# Node (if you have it)
npx serve .
```

Then open `http://localhost:8000/loading_page_1/` (adjust the path to
wherever you run the server from).

## Dependencies

- **Three.js r160**, loaded from a CDN (`unpkg.com`) via an HTML import map
  in `index.html`. No build step, no bundler, no npm install required.
- No other libraries.

## External assets

None. The robot dog and the maze are both built procedurally from Three.js
primitive geometry (boxes, a cylinder, spheres) in `robotDog.js` and
`maze.js`. There are no external 3D model or texture files, so there's
nothing to license or attribute — and nothing heavy to download before the
animation can start.

## How the maze/path system works (and why the dog can't clip through walls)

`path.js` defines the maze as a short list of grid waypoints — every turn is
a clean 90°. Both the dog's movement and the maze's walls are generated from
that *same* list, so they can never disagree:

- **Dog movement** (`path.js` → `sampleAlongPath`): the dog's position is
  always a point on the straight line between two waypoints. It cannot leave
  that line, so it cannot wander into a wall.
- **Maze walls** (`maze.js`): for each leg of the path, two parallel wall
  segments are placed at a fixed offset (`CORRIDOR_WIDTH / 2`) from the
  centerline. At every turn, one side is the **convex/outer** corner (its
  two wall pieces need to extend toward each other to close a gap) and the
  other is the **concave/inner** corner (its two wall pieces already meet
  *exactly* at the offset joint point, so extending them would drive a wall
  straight through the incoming corridor instead). `cornerAdjustment()`
  uses the turn's direction (a 2D cross product of the incoming/outgoing
  headings) to tell which side is which at each joint, and extends the
  outer side while trimming the inner side back by the same amount. That
  keeps corridor width constant through every turn.

This was **not** correct on the first pass — an earlier version extended
both sides equally, which looked fine on paper but actually drove a wall
through the middle of the previous corridor at every turn. `verify_path.mjs`
(below) is what caught it.

### Verifying it yourself

`verify_path.mjs` is a small Node script that walks the shared waypoint list
in 2,000 tiny steps and checks the dog's bounding footprint against every
wall's bounding box — the same check described in the brief's "verify
mathematically" step. To run it:

```bash
npm install   # pulls in three.js as a dev dependency, used outside the browser
npm run verify
```

Expected output ends with:

```
Collisions: 0
RESULT: PASS - dog never intersects a wall along the full path
```

Because corridor width is constant and larger than the dog's body width by
construction, clearance is guaranteed everywhere, not just at the sample
points — but `verify_path.mjs` is there to check that claim automatically
any time `path.js` or `maze.js` change, rather than relying on eyeballing
the render.

## How the completion event works

When the dog reaches the final waypoint and its short "arrived" beat
finishes, `main.js` does two things:

```javascript
window.dispatchEvent(new CustomEvent('robotDogIntroComplete'));
```

1. Adds an `is-leaving` class to `#loader-root`, which triggers the CSS
   fade/blur transition.
2. Fires the `robotDogIntroComplete` event immediately (don't wait for the
   CSS transition to *finish* to notify — let the real site start preparing
   itself right away).
3. After the fade finishes, hides the loader, disposes of the Three.js scene
   (geometries, materials, renderer context), and reveals whatever comes
   next.

The same event also fires immediately if WebGL isn't available at all, so a
visitor without WebGL support still reaches the site without waiting on a
3D scene that can't run.

## Integrating into the future portfolio site

This project intentionally has no dependency going the other direction —
the future site should depend on *it*, not vice versa. To integrate:

1. Mount this project's DOM (`#loader-root` and its contents) over your
   site, hidden/on top of everything else (`position: fixed; z-index: 999`).
2. Have your site's own startup code listen for the event instead of using
   the placeholder in `index.html`:

   ```javascript
   window.addEventListener('robotDogIntroComplete', () => {
     // fade in / reveal the real site here
   });
   ```
3. Remove or ignore `#website-placeholder` — it only exists so this project
   is watchable end-to-end on its own.
4. For the "dog continues into the navbar" idea mentioned in the brief:
   `main.js` already disposes the 3D scene *after* the fade, so if a future
   version wants to keep the dog alive into the navbar, swap the `dispose()`
   call for a hand-off that repositions `dog.object3D` into a small
   navbar-sized viewport instead of tearing it down.

## Performance notes

- Device pixel ratio is capped at 2 (`scene.js`) to avoid over-rendering on
  high-DPI displays.
- Geometry is entirely low-cost primitives (a few dozen boxes/cylinders/
  spheres) — there is no per-frame geometry generation.
- The render loop skips work entirely while the browser tab is hidden
  (`visibilitychange` listener in `main.js`).
- The Three.js scene, its geometries, materials, and the renderer's GL
  context are explicitly disposed once the transition finishes, since a
  loading screen shouldn't leave GPU memory allocated for the rest of the
  session.

## Verification performed

- **Ran `verify_path.mjs`** — a 2,000-sample numeric check of the dog's
  bounding footprint against every wall's bounding box along the entire
  path. This is how the corner-mitering bug described above was actually
  found (the first version failed with 270 collisions, all at turns) and
  then confirmed fixed (0 collisions, 0.675 units of clearance at the
  tightest point).
- Syntax-checked every module with `node --check`.
- Read through the full sequence logic (intro → navigate → approach →
  arrived → transition) to confirm phase transitions only fire once and in
  order, and that camera offsets are derived from the maze's own bounding
  box rather than hardcoded per-scene numbers (so they hold up if the path
  in `path.js` is edited).
- Confirmed `robotDogIntroComplete` fires exactly once, on both the normal
  path and the no-WebGL fallback path.

What I could **not** verify in this environment (no browser available
here — please double-check after you run it locally): actual on-screen
camera framing/aspect across real desktop/tablet/mobile viewports, and the
visual read of the walk-cycle animation and lighting. The math and control
flow are verified; the final look is worth a quick eyeball pass on your end.
