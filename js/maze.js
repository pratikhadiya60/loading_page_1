import * as THREE from "three";
import { CORRIDOR_WIDTH, WALL_HEIGHT, WALL_THICKNESS } from "./path.js";

const HALF_CORRIDOR = CORRIDOR_WIDTH / 2;

const wallMaterial = new THREE.MeshStandardMaterial({
  color: 0xf3efe6, // soft ivory / warm white
  roughness: 0.75,
  metalness: 0.02,
});

const floorMaterial = new THREE.MeshStandardMaterial({
  color: 0xdad6cd, // muted neutral gray
  roughness: 0.95,
  metalness: 0.0,
});

const baseMaterial = new THREE.MeshStandardMaterial({
  color: 0xe4e0d6,
  roughness: 0.9,
});

/**
 * At an interior turn, one side of the corridor is CONVEX (the "outer"
 * corner — the two walls there need to extend toward each other to close
 * a gap) and the other side is CONCAVE (the "inner" corner — the two
 * walls there already meet *exactly* at the offset joint point, so
 * extending them would drive them straight through the other segment's
 * corridor instead of closing a gap).
 *
 * side = +1 for the left wall (offset = (-dir.z, 0, dir.x)), -1 for the
 * right wall. Returns the signed adjustment to apply at that joint:
 * positive = extend outward (outer corner), negative = trim back
 * (inner corner), so the two walls meet cleanly either way.
 */
function cornerAdjustment(dirIn, dirOut, side) {
  const cross = dirIn.x * dirOut.z - dirIn.z * dirOut.x;
  if (Math.abs(cross) < 1e-6) return 0; // straight-through, no turn
  const turnSign = Math.sign(cross);
  return -turnSign * side * HALF_CORRIDOR;
}

/**
 * Builds the maze as a group containing:
 *  - a base "miniature model" platform
 *  - a floor matching the path's bounding box
 *  - wall segments alongside every leg of the path, mitered at each turn
 *    (see cornerAdjustment above) so corridor width — and therefore the
 *    dog's clearance — stays constant through every turn, never just at
 *    the straight sections.
 */
export function buildMaze(waypoints) {
  const group = new THREE.Group();
  group.name = "maze";

  const wallGeometries = [];
  const dirs = [];
  for (let i = 0; i < waypoints.length - 1; i++) {
    dirs.push(new THREE.Vector3().subVectors(waypoints[i + 1], waypoints[i]).normalize());
  }

  for (let i = 0; i < waypoints.length - 1; i++) {
    const a = waypoints[i];
    const b = waypoints[i + 1];
    const dir = dirs[i];
    const perp = new THREE.Vector3(-dir.z, 0, dir.x).multiplyScalar(HALF_CORRIDOR);

    // side = +1 is the left wall, -1 is the right wall.
    for (const side of [1, -1]) {
      const startAdjust =
        i > 0 ? cornerAdjustment(dirs[i - 1], dir, side) : 0;
      const endAdjust =
        i < waypoints.length - 2 ? cornerAdjustment(dir, dirs[i + 1], side) : 0;

      // Positive adjustment extends the wall outward past the joint;
      // negative trims it back short of the joint.
      const segStart = a.clone().sub(dir.clone().multiplyScalar(startAdjust));
      const segEnd = b.clone().add(dir.clone().multiplyScalar(endAdjust));
      const segLength = segStart.distanceTo(segEnd);
      const mid = new THREE.Vector3().addVectors(segStart, segEnd).multiplyScalar(0.5);
      const sidePerp = perp.clone().multiplyScalar(side);

      wallGeometries.push({
        length: segLength,
        position: mid.add(sidePerp),
        rotationY: Math.atan2(dir.x, dir.z),
      });
    }
  }

  for (const wall of wallGeometries) {
    const geometry = new THREE.BoxGeometry(WALL_THICKNESS, WALL_HEIGHT, wall.length);
    const mesh = new THREE.Mesh(geometry, wallMaterial);
    mesh.position.copy(wall.position);
    mesh.position.y = WALL_HEIGHT / 2;
    mesh.rotation.y = wall.rotationY;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  }

  // --- Floor sized to the path's bounding box, plus margin ---
  const bounds = new THREE.Box3();
  waypoints.forEach((p) => bounds.expandByPoint(p));
  const margin = CORRIDOR_WIDTH * 1.4;
  const size = new THREE.Vector3();
  bounds.getSize(size);
  const center = new THREE.Vector3();
  bounds.getCenter(center);

  const floorWidth = size.x + margin * 2;
  const floorDepth = size.z + margin * 2;

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(floorWidth, floorDepth),
    floorMaterial
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(center.x, 0, center.z);
  floor.receiveShadow = true;
  group.add(floor);

  // --- A slightly larger, slightly recessed base plate underneath, to
  // read as a physical miniature architecture model sitting on a table. ---
  const baseHeight = 0.4;
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(floorWidth + 1.2, baseHeight, floorDepth + 1.2),
    baseMaterial
  );
  base.position.set(center.x, -baseHeight / 2 - 0.01, center.z);
  base.receiveShadow = true;
  base.castShadow = true;
  group.add(base);

  group.userData.bounds = bounds;
  group.userData.center = center;
  group.userData.size = new THREE.Vector3(floorWidth, WALL_HEIGHT, floorDepth);

  return group;
}
