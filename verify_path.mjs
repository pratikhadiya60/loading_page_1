import * as THREE from "three";
import { getWaypoints, getPathLength, sampleAlongPath, CORRIDOR_WIDTH, WALL_THICKNESS } from "./js/path.js";
import { buildMaze } from "./js/maze.js";

const DOG_HALF_WIDTH = 0.3; // wider than the actual ~0.25 body half-width, for margin

const waypoints = getWaypoints();
const totalLength = getPathLength(waypoints);
const maze = buildMaze(waypoints);

// Collect wall meshes (skip floor/base)
const wallBoxes = [];
maze.children.forEach((child) => {
  if (child.geometry && child.geometry.type === "BoxGeometry" && child.geometry.parameters.height > 1) {
    const box = new THREE.Box3().setFromObject(child);
    wallBoxes.push(box);
  }
});

console.log(`Path length: ${totalLength.toFixed(2)} units`);
console.log(`Wall segments found: ${wallBoxes.length}`);
console.log(`Corridor width: ${CORRIDOR_WIDTH}, wall thickness: ${WALL_THICKNESS}`);

// Sample the path densely and confirm the dog's bounding footprint never
// overlaps a wall's bounding box.
const SAMPLES = 2000;
let worstClearance = Infinity;
let failures = 0;

for (let i = 0; i <= SAMPLES; i++) {
  const dist = (i / SAMPLES) * totalLength;
  const { position } = sampleAlongPath(waypoints, dist);

  const dogBox = new THREE.Box3(
    new THREE.Vector3(position.x - DOG_HALF_WIDTH, 0.05, position.z - DOG_HALF_WIDTH),
    new THREE.Vector3(position.x + DOG_HALF_WIDTH, 0.9, position.z + DOG_HALF_WIDTH)
  );

  for (const wallBox of wallBoxes) {
    const intersects = dogBox.intersectsBox(wallBox);
    if (intersects) {
      failures++;
      console.log(`  COLLISION at distance ${dist.toFixed(2)} (pos ${position.x.toFixed(2)}, ${position.z.toFixed(2)})`);
    }

    // Track minimum clearance for reporting (distance between box centers
    // along the tightest axis, as a rough clearance figure)
    const dx = Math.max(wallBox.min.x - dogBox.max.x, dogBox.min.x - wallBox.max.x, 0);
    const dz = Math.max(wallBox.min.z - dogBox.max.z, dogBox.min.z - wallBox.max.z, 0);
    const clearance = Math.sqrt(dx * dx + dz * dz);
    if (clearance < worstClearance) worstClearance = clearance;
  }
}

console.log(`Samples checked: ${SAMPLES + 1}`);
console.log(`Collisions: ${failures}`);
console.log(`Worst-case clearance between dog footprint and nearest wall: ${worstClearance.toFixed(3)} units`);

if (failures > 0) {
  console.log("RESULT: FAIL - path intersects a wall");
  process.exit(1);
} else {
  console.log("RESULT: PASS - dog never intersects a wall along the full path");
}
