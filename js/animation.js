import * as THREE from "three";

// ------------------------------------------------------------------
// Camera choreography. Rather than hand-key a timeline independent of
// where the dog actually is (risking a shot that's still "establishing"
// after the dog has already finished the maze on a slow device), every
// shot is driven by the DOG'S PROGRESS (0..1 along the path) and a
// smoothing factor, so the camera direction always matches reality.
// ------------------------------------------------------------------

function smoothDamp(current, target, lerpFactor) {
  return current + (target - current) * lerpFactor;
}

export function createCameraDirector(camera, mazeInfo) {
  const center = mazeInfo.center;
  const size = mazeInfo.size;
  const mazeRadius = Math.max(size.x, size.z);

  // Reused vectors to avoid per-frame allocation
  const desiredPos = new THREE.Vector3();
  const desiredLookAt = new THREE.Vector3();
  const currentLookAt = new THREE.Vector3(center.x, 0.4, center.z);

  let phase = "intro"; // intro -> follow -> approach -> arrived

  function setPhase(next) {
    phase = next;
  }

  /**
   * dogPos/dogDir: current dog position + facing direction
   * progress: 0..1 of total path distance travelled
   * introBlend: 0..1, eases the intro dolly-in (independent of dog progress)
   */
  function update(dt, { dogPos, dogDir, progress, introBlend }) {
    if (phase === "intro") {
      // SHOT 1 -> SHOT 2: wide establishing shot slowly dollying toward
      // the start of the maze.
      const wide = new THREE.Vector3(center.x + mazeRadius * 0.9, mazeRadius * 0.85, center.z + mazeRadius * 1.1);
      const closer = new THREE.Vector3(dogPos.x + 1.6, 1.6, dogPos.z + 2.4);
      desiredPos.lerpVectors(wide, closer, introBlend);
      desiredLookAt.set(dogPos.x, 0.4, dogPos.z);
    } else if (phase === "follow") {
      // SHOT 3 -> SHOT 4: trail behind the dog at a fixed offset that
      // rotates with its current heading, so turns read as a smooth
      // cinematic pan rather than the camera snapping.
      const behind = dogDir.clone().multiplyScalar(-2.6);
      const lift = new THREE.Vector3(0, 1.7, 0);
      desiredPos.copy(dogPos).add(behind).add(lift);
      desiredLookAt.copy(dogPos).add(dogDir.clone().multiplyScalar(1.2));
      desiredLookAt.y = 0.4;
    } else if (phase === "approach") {
      // SHOT 5: closer, slightly lower, more dramatic as the dog nears
      // the exit.
      const behind = dogDir.clone().multiplyScalar(-1.5);
      const lift = new THREE.Vector3(0, 1.0, 0);
      desiredPos.copy(dogPos).add(behind).add(lift);
      desiredLookAt.copy(dogPos).add(dogDir.clone().multiplyScalar(1.5));
      desiredLookAt.y = 0.35;
    } else if (phase === "arrived") {
      // SHOT 6: settle into a calm three-quarter portrait, priming the
      // transition to the website.
      const orbit = dogDir.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 4).multiplyScalar(-2.2);
      desiredPos.copy(dogPos).add(orbit).add(new THREE.Vector3(0, 1.3, 0));
      desiredLookAt.copy(dogPos);
      desiredLookAt.y = 0.5;
    }

    // Smooth (critically-damped-ish) interpolation avoids any hard cuts
    // between phases while still feeling responsive.
    const lerpFactor = 1 - Math.pow(0.0025, dt);
    camera.position.lerp(desiredPos, lerpFactor);
    currentLookAt.lerp(desiredLookAt, lerpFactor);
    camera.lookAt(currentLookAt);
  }

  return { update, setPhase };
}
