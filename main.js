import * as THREE from "three";
import { createScene, isWebGLAvailable } from "./js/scene.js";
import { buildMaze } from "./js/maze.js";
import { buildRobotDog } from "./js/robotDog.js";
import { getWaypoints, getPathLength, sampleAlongPath } from "./js/path.js";
import { createCameraDirector } from "./js/animation.js";

// ------------------------------------------------------------------
// Timeline (approximate, matches the design spec):
//   0.0 – 3.0s   INTRO    wide shot -> dolly toward dog, idle motion
//   3.0s – end   NAVIGATE dog walks the path at a constant speed
//   last 12%     APPROACH camera tightens up near the exit
//   on arrival   ARRIVED  dog settles, brief pause
//   completion   dispatch robotDogIntroComplete and keep the standalone
//                experience visible until a future host site takes over.
// ------------------------------------------------------------------

const WALK_SPEED = 1.35; // world units / second
const INTRO_DURATION = 3.0; // seconds
const ARRIVAL_HOLD = 1.6; // seconds standing at the goal before completion

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

function showFallback() {
  document.getElementById("webgl-fallback").hidden = false;
  rootEl.hidden = true;
  // A future host site can still react to the same completion event.
  fireCompletionEvent();
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
  let state = "intro"; // intro -> navigate -> approach -> arrived -> complete
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
    if (isHidden) return; // pause work while the tab isn't visible
    elapsed += dt;

    let dogSpeedFactor = 0;

    if (state === "intro") {
      setStatus(elapsed < 1.2 ? "INITIALIZING" : "CALIBRATING PATH");
      const introBlend = Math.min(elapsed / INTRO_DURATION, 1);
      cameraDirector.setPhase("intro");
      cameraDirector.update(dt, {
        dogPos: dog.object3D.position,
        dogDir: lastFacing,
        introBlend,
      });
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

      // Smoothly rotate the dog to face its direction of travel.
      const targetAngle = Math.atan2(sample.direction.x, sample.direction.z);
      let angleDiff = targetAngle - dog.object3D.rotation.y;
      angleDiff = Math.atan2(Math.sin(angleDiff), Math.cos(angleDiff));
      dog.object3D.rotation.y += angleDiff * Math.min(dt * 8, 1);

      dogSpeedFactor = 1;
      dog.update(dt, dogSpeedFactor);

      if (progress > 0.88 && state !== "approach") {
        state = "approach";
        cameraDirector.setPhase("approach");
        setStatus("PREPARING PORTFOLIO");
      } else if (state === "navigate") {
        setStatus("NAVIGATING");
      }

      cameraDirector.update(dt, {
        dogPos: dog.object3D.position,
        dogDir: lastFacing,
        progress,
      });

      if (progress >= 1) {
        state = "arrived";
        cameraDirector.setPhase("arrived");
        setStatus("ARRIVED");
      }
    } else if (state === "arrived") {
      arrivalTimer += dt;
      dog.update(dt, Math.max(0, 1 - arrivalTimer * 2)); // settle to a stop
      cameraDirector.update(dt, {
        dogPos: dog.object3D.position,
        dogDir: lastFacing,
        progress: 1,
      });

      if (arrivalTimer >= ARRIVAL_HOLD) {
        state = "complete";
        // The event remains available for future portfolio integration, but
        // this standalone repository keeps its finished cinematic frame.
        fireCompletionEvent();
      }
    } else if (state === "complete") {
      dog.update(dt, 0);
      cameraDirector.update(dt, {
        dogPos: dog.object3D.position,
        dogDir: lastFacing,
        progress: 1,
      });
    }

    renderer.render(scene, camera);
  }

  requestAnimationFrame(tick);
}

init();
