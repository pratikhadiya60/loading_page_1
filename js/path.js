import * as THREE from "three";

// ------------------------------------------------------------------
// The maze path is authored as simple grid coordinates (columns, rows),
// then scaled into world units by CELL_SIZE. Every turn is a clean 90°
// turn, which is what lets maze.js build walls that never clip the path
// (see the "miter" comment in maze.js).
//
// Grid picture (not to scale):
//
//   (0,0) START
//     |
//     +----------+ (4,0)
//                |
//                +----------+ (4,3)
//                           |
//     +---------------------+
//     | (1,3)
//     |
//     +---------+ (1,6)
//               |
//               +----------+ (5,6) EXIT
// ------------------------------------------------------------------

export const CELL_SIZE = 3;
export const CORRIDOR_WIDTH = 2.2;
export const WALL_HEIGHT = 1.8;
export const WALL_THICKNESS = 0.25;

const GRID_WAYPOINTS = [
  { x: 0, z: 0 },
  { x: 4, z: 0 },
  { x: 4, z: 3 },
  { x: 1, z: 3 },
  { x: 1, z: 6 },
  { x: 5, z: 6 },
];

/** World-space waypoints (Y is always 0; the dog rides on top of the floor). */
export function getWaypoints() {
  return GRID_WAYPOINTS.map(
    (p) => new THREE.Vector3(p.x * CELL_SIZE, 0, p.z * CELL_SIZE)
  );
}

/** Total length of the path, used to time the walk at a constant speed. */
export function getPathLength(waypoints) {
  let total = 0;
  for (let i = 0; i < waypoints.length - 1; i++) {
    total += waypoints[i].distanceTo(waypoints[i + 1]);
  }
  return total;
}

/**
 * Given how far the dog has travelled along the path (0..totalLength),
 * returns its position and the direction it should be facing.
 * This is the core of the "safe route" system: the dog can only ever be
 * on the straight line between two waypoints, so it can never wander into
 * a wall.
 */
export function sampleAlongPath(waypoints, distanceTravelled) {
  let remaining = distanceTravelled;

  for (let i = 0; i < waypoints.length - 1; i++) {
    const a = waypoints[i];
    const b = waypoints[i + 1];
    const segLength = a.distanceTo(b);

    if (remaining <= segLength || i === waypoints.length - 2) {
      const t = segLength === 0 ? 0 : Math.min(remaining / segLength, 1);
      const position = new THREE.Vector3().lerpVectors(a, b, t);
      const direction = new THREE.Vector3().subVectors(b, a).normalize();
      return { position, direction, segmentIndex: i, segmentT: t };
    }

    remaining -= segLength;
  }

  // Fallback: end of path
  const last = waypoints[waypoints.length - 1];
  const prev = waypoints[waypoints.length - 2];
  return {
    position: last.clone(),
    direction: new THREE.Vector3().subVectors(last, prev).normalize(),
    segmentIndex: waypoints.length - 2,
    segmentT: 1,
  };
}
