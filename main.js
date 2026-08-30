import * as THREE from "three";
import { createScene, isWebGLAvailable } from "./js/scene.js";
import { buildMaze } from "./js/maze.js";
import { buildRobotDog } from "./js/robotDog.js";
import { getWaypoints, getPathLength, sampleAlongPath } from "./js/path.js";
import { createCameraDirector } from "./js/animation.js";

const WALK_SPEED = 1.35;
const INTRO_DURATION = 3.0;
const ARRIVAL_HOLD = 1.6;

const statusEl = document.getElementById("status-text");
const rootEl = document.getElementById("loader-root");
const canvas = document.getElementById("loader-canvas");

function setStatus(text) {
  if (statusEl.textContent !== text) {
    statusEl.style.opacity = 0;
    setTimeout(() => {
      statusEl.textContent = text;
      statusEl.style.opacity = 0.65;
    }, 180);
  }
}

function fireCompletionEvent() {
  window.dispatchEvent(new CustomEvent("robotDogIntroComplete"));
}

// When WebGL is unavailable, keep the loading concept alive with a lightweight
// CSS/SVG version rather than stopping on an error message. The 3D code and its
// maze/path/dog architecture remain untouched for WebGL-capable browsers.
function showFallback() {
  document.getElementById("webgl-fallback").hidden = false;
  rootEl.hidden = true;

  const dog = document.getElementById("fallback-dog");
  const status = document.getElementById("fallback-status-text");
  const start = performance.now();
  const introMs = 2200;
  const walkMs = 14500;
  const holdMs = 1600;
  let completed = false;

  function fallbackTick(now) {
    const elapsed = now - start;
    let progress = 0;

    if (elapsed < introMs) {
      status.textContent = elapsed < 900 ? "INITIALIZING" : "CALIBRATING PATH";
    } else if (elapsed < introMs + walkMs) {
      progress = (elapsed - introMs) / walkMs;
      status.textContent = progress > 0.88 ? "PREPARING PORTFOLIO" : "NAVIGATING";
      dog.style.offsetDistance = `${progress * 100}%`;
    } else {
      dog.style.offsetDistance = "100%";
      status.textContent = "ARRIVED";
      if (!completed && elapsed >= introMs + walkMs + holdMs) {
        completed = true;
        fireCompletionEvent();
      }
    }

    requestAnimationFrame(fallbackTick);
  }

  requestAnimationFrame(fallbackTick);
}

function init() {
  if (!isWebGLAvailable()) {
    showFallback();
    return;
  }

  const { scene, camera, renderer } = createScene(canvas);
  const waypoints = getWaypoints();
  const totalLength = getPathLength(waypoints);

  const maze = buildMaze(waypoints);
  scene.add(maze);

  const dog = buildRobotDog();
  dog.object3D.position.copy(waypoints[0]);
  scene.add(dog.object3D);

  const cameraDirector = createCameraDirector(camera, {
    center: maze.userData.center,
    size: maze.userData.size,
  });

  let elapsed = 0;
  let travelled = 0;
  let state = "intro";
  let arrivalTimer = 0;
  let lastFacing = new THREE.Vector3(0, 0, 1);
  let isHidden = false;

  document.addEventListener("visibilitychange", () => {
    isHidden = document.hidden;
  });

  const clock = new THREE.Clock();

  function tick() {
    requestAnimationFrame(tick);
    const dt = Math.min(clock.getDelta(), 1 / 30);
    if (isHidden) return;
    elapsed += dt;

    if (state === "intro") {
      setStatus(elapsed < 1.2 ? "INITIALIZING" : "CALIBRATING PATH");
      const introBlend = Math.min(elapsed / INTRO_DURATION, 1);
      cameraDirector.setPhase("intro");
      cameraDirector.update(dt, { dogPos: dog.object3D.position, dogDir: lastFacing, introBlend });
      dog.update(dt, 0);
      if (elapsed >= INTRO_DURATION) {
        state = "navigate";
        cameraDirector.setPhase("follow");
      }
    } else if (state === "navigate" || state === "approach") {
      travelled += WALK_SPEED * dt;
      const progress = Math.min(travelled / totalLength, 1);
      const sample = sampleAlongPath(waypoints, travelled);
      dog.object3D.position.copy(sample.position);
      lastFacing = sample.direction;

      const targetAngle = Math.atan2(sample.direction.x, sample.direction.z);
      let angleDiff = targetAngle - dog.object3D.rotation.y;
      angleDiff = Math.atan2(Math.sin(angleDiff), Math.cos(angleDiff));
      dog.object3D.rotation.y += angleDiff * Math.min(dt * 8, 1);
      dog.update(dt, 1);

      if (progress > 0.88 && state !== "approach") {
        state = "approach";
        cameraDirector.setPhase("approach");
        setStatus("PREPARING PORTFOLIO");
      } else if (state === "navigate") {
        setStatus("NAVIGATING");
      }

      cameraDirector.update(dt, { dogPos: dog.object3D.position, dogDir: lastFacing, progress });
      if (progress >= 1) {
        state = "arrived";
        cameraDirector.setPhase("arrived");
        setStatus("ARRIVED");
      }
    } else if (state === "arrived") {
      arrivalTimer += dt;
      dog.update(dt, Math.max(0, 1 - arrivalTimer * 2));
      cameraDirector.update(dt, { dogPos: dog.object3D.position, dogDir: lastFacing, progress: 1 });
      if (arrivalTimer >= ARRIVAL_HOLD) {
        state = "complete";
        fireCompletionEvent();
      }
    } else if (state === "complete") {
      dog.update(dt, 0);
      cameraDirector.update(dt, { dogPos: dog.object3D.position, dogDir: lastFacing, progress: 1 });
    }

    renderer.render(scene, camera);
  }

  requestAnimationFrame(tick);
}

init();
