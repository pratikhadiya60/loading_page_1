# Robot Dog Maze Loading Page

A standalone WebGL loading-screen prototype built for later integration into a portfolio website.

## What it contains

- Procedural semi-mechanical robot dog built with Three.js geometry
- Small minimalist 3D maze
- Soft studio lighting and shadows
- Hand-authored route through the maze
- Walking leg animation
- Three-stage cinematic follow camera
- Subtle mouse parallax
- Completion event for future website integration

## Run locally

Because the project uses JavaScript ES modules, serve the folder with a local development server instead of opening `index.html` directly.

Examples:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Project structure

```text
loading_page_1/
├── index.html      # HTML shell and overlay UI
├── style.css       # Full-screen layout and transition styles
├── main.js         # Three.js world, maze, robot and animation
└── README.md
```

## Future portfolio integration

The sequence dispatches this browser event when the dog reaches the end:

```js
window.addEventListener('robotDogIntroComplete', () => {
  // Reveal the real portfolio here.
});
```

The current robot is procedural so the prototype has no external model asset. A higher-quality open-source or properly licensed GLB robot-dog model can later replace `createRobotDog()` without changing the maze, camera, or loading-screen architecture.
