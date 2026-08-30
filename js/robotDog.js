import * as THREE from "three";

// ------------------------------------------------------------------
// Built procedurally (no external model file) from primitive geometry,
// grouped into reusable "joint" pivots so a walk cycle just has to
// rotate a small number of Object3D groups. This keeps the asset tiny
// and fast — important since this loads before the rest of the site.
//
// Materials/colors follow the brief: white/light shell, black
// mechanical joints and legs, subtle cyan eyes only.
// ------------------------------------------------------------------

const shellMaterial = new THREE.MeshStandardMaterial({
  color: 0xf5f3ee,
  roughness: 0.45,
  metalness: 0.15,
});

const jointMaterial = new THREE.MeshStandardMaterial({
  color: 0x1c1c1e,
  roughness: 0.35,
  metalness: 0.4,
});

const eyeMaterial = new THREE.MeshStandardMaterial({
  color: 0x7fe7ec,
  emissive: 0x4fd0d6,
  emissiveIntensity: 0.9,
  roughness: 0.3,
});

function buildLeg() {
  // Returns an unpositioned hip/knee pivot pair; the caller places it at
  // one of the four leg offsets (front/rear, left/right).
  const hip = new THREE.Group();

  const upperGeo = new THREE.BoxGeometry(0.13, 0.34, 0.13);
  const upper = new THREE.Mesh(upperGeo, jointMaterial);
  upper.position.y = -0.17;
  upper.castShadow = true;
  hip.add(upper);

  const knee = new THREE.Group();
  knee.position.y = -0.34;
  hip.add(knee);

  const lowerGeo = new THREE.BoxGeometry(0.1, 0.32, 0.1);
  const lower = new THREE.Mesh(lowerGeo, jointMaterial);
  lower.position.y = -0.16;
  lower.castShadow = true;
  knee.add(lower);

  const foot = new THREE.Mesh(
    new THREE.BoxGeometry(0.14, 0.06, 0.18),
    jointMaterial
  );
  foot.position.y = -0.32 - 0.03;
  foot.castShadow = true;
  knee.add(foot);

  return { hip, knee };
}

/**
 * Returns { object3D, update(dt, normalizedSpeed) }.
 * normalizedSpeed is 0 (standing still) to 1 (full walking speed) and
 * drives how strongly the legs/body/tail animate, so the walk fades in
 * and out smoothly instead of snapping on/off.
 */
export function buildRobotDog() {
  const root = new THREE.Group();
  root.name = "robotDog";

  // Body
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.32, 0.85),
    shellMaterial
  );
  body.position.y = 0.55;
  body.castShadow = true;
  root.add(body);

  // A darker mechanical spine strip along the back for detail
  const spine = new THREE.Mesh(
    new THREE.BoxGeometry(0.16, 0.06, 0.8),
    jointMaterial
  );
  spine.position.set(0, 0.72, 0);
  root.add(spine);

  // Neck + head group (used for idle head motion)
  const headPivot = new THREE.Group();
  headPivot.position.set(0, 0.62, 0.5);
  root.add(headPivot);

  const neck = new THREE.Mesh(
    new THREE.BoxGeometry(0.16, 0.14, 0.14),
    jointMaterial
  );
  neck.position.set(0, 0.06, 0.05);
  headPivot.add(neck);

  const head = new THREE.Mesh(
    new THREE.BoxGeometry(0.3, 0.24, 0.32),
    shellMaterial
  );
  head.position.set(0, 0.2, 0.16);
  head.castShadow = true;
  headPivot.add(head);

  const muzzle = new THREE.Mesh(
    new THREE.BoxGeometry(0.16, 0.14, 0.16),
    shellMaterial
  );
  muzzle.position.set(0, 0.14, 0.34);
  headPivot.add(muzzle);

  const eyeGeo = new THREE.SphereGeometry(0.025, 12, 12);
  const eyeL = new THREE.Mesh(eyeGeo, eyeMaterial);
  eyeL.position.set(-0.09, 0.22, 0.32);
  headPivot.add(eyeL);
  const eyeR = eyeL.clone();
  eyeR.position.x = 0.09;
  headPivot.add(eyeR);

  // Hanging/floppy ears
  const earGeo = new THREE.BoxGeometry(0.05, 0.22, 0.13);
  const earL = new THREE.Mesh(earGeo, jointMaterial);
  earL.position.set(-0.15, 0.18, 0.14);
  earL.rotation.z = 0.25;
  headPivot.add(earL);
  const earR = new THREE.Mesh(earGeo, jointMaterial);
  earR.position.set(0.15, 0.18, 0.14);
  earR.rotation.z = -0.25;
  headPivot.add(earR);

  // Tail
  const tailPivot = new THREE.Group();
  tailPivot.position.set(0, 0.62, -0.42);
  root.add(tailPivot);
  const tail = new THREE.Mesh(
    new THREE.CylinderGeometry(0.02, 0.035, 0.32, 8),
    jointMaterial
  );
  tail.position.set(0, 0.08, -0.1);
  tail.rotation.x = Math.PI / 2.6;
  tailPivot.add(tail);

  // Legs: front-left, front-right, rear-left, rear-right
  const legOffsets = [
    { x: -0.19, z: 0.3, name: "FL" },
    { x: 0.19, z: 0.3, name: "FR" },
    { x: -0.19, z: -0.3, name: "BL" },
    { x: 0.19, z: -0.3, name: "BR" },
  ];

  const legs = legOffsets.map((offset) => {
    const { hip, knee } = buildLeg();
    hip.position.set(offset.x, 0.42, offset.z);
    root.add(hip);
    return { hip, knee, name: offset.name };
  });

  // Diagonal trot gait: FL+BR share a phase, FR+BL are offset by PI.
  const phaseOf = { FL: 0, BR: 0, FR: Math.PI, BL: Math.PI };

  let elapsed = 0;
  const WALK_FREQUENCY = 6.5; // radians/sec
  const HIP_AMPLITUDE = 0.45;
  const KNEE_AMPLITUDE = 0.55;

  function update(dt, normalizedSpeed) {
    elapsed += dt * normalizedSpeed;

    for (const leg of legs) {
      const phase = phaseOf[leg.name];
      const swing = Math.sin(elapsed * WALK_FREQUENCY + phase);
      // Hip swings the whole leg forward/back.
      leg.hip.rotation.x = swing * HIP_AMPLITUDE * normalizedSpeed;
      // Knee only bends while the leg is lifting through the front half
      // of its swing, approximated with a clamped, offset sine so the
      // foot doesn't dig into the floor on the push-back half.
      const kneeRaw = Math.sin(elapsed * WALK_FREQUENCY + phase - 0.6);
      leg.knee.rotation.x = Math.max(0, kneeRaw) * KNEE_AMPLITUDE * normalizedSpeed;
    }

    // Subtle body bob at double frequency (one bob per footfall pair)
    body.position.y = 0.55 + Math.sin(elapsed * WALK_FREQUENCY * 2) * 0.012 * normalizedSpeed;
    spine.position.y = body.position.y + 0.17;

    // Idle/ambient head and tail motion, always present (even standing)
    headPivot.rotation.y = Math.sin(elapsed * 1.1 + 10) * 0.06 * (1 - normalizedSpeed * 0.5);
    headPivot.rotation.x = Math.sin(elapsed * 0.7) * 0.03;
    tailPivot.rotation.y = Math.sin(elapsed * 3.2) * (0.15 + 0.15 * normalizedSpeed);
  }

  return { object3D: root, update, headPivot, tailPivot };
}
