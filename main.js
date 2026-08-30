import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';

/* ============================================================
   ROBOT DOG MAZE INTRO
   A standalone loading experience designed for later portfolio
   integration. The maze route is deliberately authored as straight
   segments so the dog never cuts through a wall at a curved corner.
   ============================================================ */

const canvas = document.querySelector('#scene-canvas');
const statusText = document.querySelector('#status-text');
const finishCard = document.querySelector('#finish-card');
const reveal = document.querySelector('#reveal');

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;

const scene = new THREE.Scene();
scene.fog = new THREE.Fog('#edf0ee', 17, 34);
const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(10, 9, 14);

scene.add(new THREE.HemisphereLight('#ffffff', '#aeb7b1', 2.2));
const keyLight = new THREE.DirectionalLight('#fff7e8', 3.4);
keyLight.position.set(8, 15, 8);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(2048, 2048);
keyLight.shadow.camera.left = -12;
keyLight.shadow.camera.right = 12;
keyLight.shadow.camera.top = 12;
keyLight.shadow.camera.bottom = -12;
scene.add(keyLight);
const fillLight = new THREE.DirectionalLight('#dbe7f2', 1.25);
fillLight.position.set(-9, 8, -8);
scene.add(fillLight);

const world = new THREE.Group();
world.rotation.y = -0.15;
scene.add(world);

// ---------- Materials ----------
const floorMaterial = new THREE.MeshStandardMaterial({ color: '#d9ddda', roughness: 0.9, metalness: 0.02 });
const wallMaterial = new THREE.MeshStandardMaterial({ color: '#e8e5de', roughness: 0.78, metalness: 0.01 });
const trimMaterial = new THREE.MeshStandardMaterial({ color: '#c8cfca', roughness: 0.72, metalness: 0.06 });
const whiteMaterial = new THREE.MeshStandardMaterial({ color: '#f4f4f0', roughness: 0.42, metalness: 0.22 });
const darkMaterial = new THREE.MeshStandardMaterial({ color: '#11181d', roughness: 0.34, metalness: 0.62 });
const accentMaterial = new THREE.MeshStandardMaterial({ color: '#79a6b5', emissive: '#18313b', emissiveIntensity: 0.35, roughness: 0.22, metalness: 0.35 });

// ---------- Maze ----------
const floor = new THREE.Mesh(new THREE.BoxGeometry(16, 0.7, 12), floorMaterial);
floor.position.y = -0.35;
floor.receiveShadow = true;
world.add(floor);
const baseTrim = new THREE.Mesh(new THREE.BoxGeometry(16.5, 0.22, 12.5), trimMaterial);
baseTrim.position.y = -0.78;
baseTrim.receiveShadow = true;
world.add(baseTrim);

function addWall(x, z, width, depth, height = 1.55) {
  const wall = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), wallMaterial);
  wall.position.set(x, height / 2, z);
  wall.castShadow = true;
  wall.receiveShadow = true;
  world.add(wall);
}

// Simple readable maze. Every route corner below has generous clearance.
addWall(0, -5.75, 16, 0.5);
addWall(0, 5.75, 16, 0.5);
addWall(-7.75, 0, 0.5, 12);
addWall(7.75, 0, 0.5, 12);

// Interior blocks create the maze without crossing the dog corridor.
addWall(-4.7, -2.1, 0.5, 5.8);
addWall(-2.3, -3.9, 4.3, 0.5);
addWall(-0.15, -2.0, 0.5, 3.7);
addWall(2.1, -0.15, 4.4, 0.5);
addWall(4.3, 1.85, 0.5, 4.0);
addWall(1.7, 3.7, 5.4, 0.5);
addWall(-1.0, 2.2, 0.5, 3.1);
addWall(-3.2, 1.1, 4.0, 0.5);

// ---------- Robot dog ----------
function roundedBoxGeometry(w, h, d, radius = 0.16) {
  const shape = new THREE.Shape();
  const x = -w / 2, y = -h / 2;
  shape.moveTo(x + radius, y);
  shape.lineTo(x + w - radius, y);
  shape.quadraticCurveTo(x + w, y, x + w, y + radius);
  shape.lineTo(x + w, y + h - radius);
  shape.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  shape.lineTo(x + radius, y + h);
  shape.quadraticCurveTo(x, y + h, x, y + h - radius);
  shape.lineTo(x, y + radius);
  shape.quadraticCurveTo(x, y, x + radius, y);
  return new THREE.ExtrudeGeometry(shape, { depth: d, bevelEnabled: true, bevelThickness: radius * 0.35, bevelSize: radius * 0.35, bevelSegments: 2, curveSegments: 8 });
}

function mesh(geometry, material, position = [0, 0, 0]) {
  const object = new THREE.Mesh(geometry, material);
  object.position.set(...position);
  object.castShadow = true;
  object.receiveShadow = true;
  return object;
}

function createRobotDog() {
  const dog = new THREE.Group();
  const torsoGroup = new THREE.Group();
  dog.add(torsoGroup);

  // Body is long, compact and white, with black mechanical sections like the reference.
  const torso = mesh(new THREE.CapsuleGeometry(0.48, 0.98, 6, 14), whiteMaterial, [0, 1.22, 0]);
  torso.rotation.z = Math.PI / 2;
  torso.scale.z = 1.18;
  torsoGroup.add(torso);

  const belly = mesh(new THREE.BoxGeometry(1.22, 0.22, 0.58), darkMaterial, [0.06, 0.91, 0]);
  torsoGroup.add(belly);

  const rearShell = mesh(new THREE.SphereGeometry(0.43, 20, 14), whiteMaterial, [0.72, 1.17, 0]);
  rearShell.scale.set(1.05, 0.9, 1);
  torsoGroup.add(rearShell);

  // Tall dark neck and a rounded dog-like head.
  const neck = mesh(new THREE.CylinderGeometry(0.24, 0.31, 0.78, 20), darkMaterial, [-0.78, 1.78, 0]);
  neck.rotation.z = -0.13;
  torsoGroup.add(neck);

  const head = new THREE.Group();
  head.position.set(-1.0, 2.22, 0);
  torsoGroup.add(head);
  const skull = mesh(new THREE.SphereGeometry(0.42, 24, 16), whiteMaterial);
  skull.scale.set(1.08, 0.92, 0.92);
  head.add(skull);
  const muzzle = mesh(new THREE.SphereGeometry(0.22, 20, 12), whiteMaterial, [-0.35, -0.1, 0]);
  muzzle.scale.set(1.25, 0.72, 0.78);
  head.add(muzzle);
  const nose = mesh(new THREE.SphereGeometry(0.09, 16, 12), darkMaterial, [-0.58, -0.11, 0]);
  head.add(nose);

  // Drooping ears give it the friendly robotic-pet silhouette from the reference.
  [-1, 1].forEach(side => {
    const earPivot = new THREE.Group();
    earPivot.position.set(-0.02, 0.08, side * 0.34);
    earPivot.rotation.x = side * 0.35;
    head.add(earPivot);
    const ear = mesh(new THREE.CapsuleGeometry(0.11, 0.34, 6, 12), whiteMaterial, [0.02, -0.22, 0]);
    ear.rotation.z = side * 0.22;
    earPivot.add(ear);
  });

  [-1, 1].forEach(side => {
    const eye = mesh(new THREE.SphereGeometry(0.045, 12, 12), accentMaterial, [-0.22, 0.08, side * 0.37]);
    head.add(eye);
  });

  // Small side panel on the torso for the robotic/engineering detail.
  [-1, 1].forEach(side => {
    const panel = mesh(new THREE.BoxGeometry(0.52, 0.34, 0.035), whiteMaterial, [0.2, 1.18, side * 0.49]);
    panel.rotation.y = side * Math.PI / 2;
    torsoGroup.add(panel);
    const port = mesh(new THREE.BoxGeometry(0.09, 0.1, 0.025), darkMaterial, [0.2, 1.18, side * 0.515]);
    port.rotation.y = side * Math.PI / 2;
    torsoGroup.add(port);
  });

  // Four articulated legs. Each leg uses two visible mechanical sections.
  const legs = [];
  const legPositions = [
    [-0.62, -0.34, 0], [-0.62, 0.34, Math.PI],
    [0.62, -0.34, Math.PI], [0.62, 0.34, 0]
  ];

  legPositions.forEach(([x, z, phase]) => {
    const shoulder = new THREE.Group();
    shoulder.position.set(x, 1.12, z);
    torsoGroup.add(shoulder);

    const upper = mesh(new THREE.CapsuleGeometry(0.12, 0.42, 6, 12), whiteMaterial, [0, -0.32, 0]);
    upper.rotation.z = x < 0 ? -0.14 : 0.14;
    shoulder.add(upper);

    const joint = new THREE.Group();
    joint.position.set(x < 0 ? -0.07 : 0.07, -0.66, 0);
    shoulder.add(joint);
    const jointCap = mesh(new THREE.SphereGeometry(0.14, 16, 12), darkMaterial);
    joint.add(jointCap);

    const lowerPivot = new THREE.Group();
    joint.add(lowerPivot);
    const lower = mesh(new THREE.CapsuleGeometry(0.09, 0.58, 6, 12), darkMaterial, [0.04, -0.4, 0]);
    lower.rotation.z = x < 0 ? 0.24 : -0.24;
    lowerPivot.add(lower);
    const foot = mesh(new THREE.SphereGeometry(0.12, 16, 12), darkMaterial, [x < 0 ? 0.16 : -0.12, -0.78, 0]);
    foot.scale.set(1.1, 0.65, 0.82);
    lowerPivot.add(foot);

    legs.push({ shoulder, lowerPivot, phase });
  });

  const tailPivot = new THREE.Group();
  tailPivot.position.set(1.04, 1.42, 0);
  torsoGroup.add(tailPivot);
  const tail = mesh(new THREE.CapsuleGeometry(0.07, 0.45, 6, 12), whiteMaterial, [0.18, 0.12, 0]);
  tail.rotation.z = -0.95;
  tailPivot.add(tail);

  dog.userData = { torsoGroup, head, tailPivot, legs };
  dog.scale.setScalar(0.72);
  return dog;
}

const dog = createRobotDog();
world.add(dog);

// ---------- Safe hand-authored route ----------
// Linear interpolation is intentional: Catmull-Rom curves can bulge into maze walls.
const pathPoints = [
  new THREE.Vector3(-6.2, 0, -4.7),
  new THREE.Vector3(-3.0, 0, -4.7),
  new THREE.Vector3(-3.0, 0, -2.8),
  new THREE.Vector3(0.9, 0, -2.8),
  new THREE.Vector3(0.9, 0, -1.25),
  new THREE.Vector3(-2.4, 0, -1.25),
  new THREE.Vector3(-2.4, 0, 0.2),
  new THREE.Vector3(2.9, 0, 0.2),
  new THREE.Vector3(2.9, 0, 2.6),
  new THREE.Vector3(5.9, 0, 2.6),
  new THREE.Vector3(5.9, 0, 4.65)
];

const segmentLengths = [];
let totalLength = 0;
for (let i = 0; i < pathPoints.length - 1; i++) {
  const length = pathPoints[i].distanceTo(pathPoints[i + 1]);
  segmentLengths.push(length);
  totalLength += length;
}

function getPathState(progress) {
  let targetDistance = THREE.MathUtils.clamp(progress, 0, 1) * totalLength;
  for (let i = 0; i < segmentLengths.length; i++) {
    if (targetDistance <= segmentLengths[i] || i === segmentLengths.length - 1) {
      const local = segmentLengths[i] === 0 ? 0 : targetDistance / segmentLengths[i];
      const position = pathPoints[i].clone().lerp(pathPoints[i + 1], local);
      const direction = pathPoints[i + 1].clone().sub(pathPoints[i]).normalize();
      return { position, direction };
    }
    targetDistance -= segmentLengths[i];
  }
  return { position: pathPoints.at(-1).clone(), direction: new THREE.Vector3(0, 0, 1) };
}

// A small arrival marker makes the end of the maze readable without turning it into a game UI.
const goal = new THREE.Group();
goal.position.set(5.9, 0.03, 4.65);
const goalRing = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.05, 12, 40), accentMaterial);
goalRing.rotation.x = Math.PI / 2;
goalRing.position.y = 0.08;
goal.add(goalRing);
world.add(goal);

// ---------- Animation ----------
const clock = new THREE.Clock();
const totalDuration = 19;
const started = performance.now();
let completed = false;
let statusIndex = 0;
const statuses = ['INITIALIZING', 'CALIBRATING PATH', 'NAVIGATING MAZE', 'PREPARING PORTFOLIO'];

function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function updateDog(progress, time) {
  const { position, direction } = getPathState(Math.min(progress, 1));
  dog.position.copy(position);
  dog.position.y = 0.02 + Math.sin(time * 8) * 0.012;
  dog.rotation.y = Math.atan2(direction.x, direction.z);

  dog.userData.torsoGroup.rotation.z = Math.sin(time * 8) * 0.018;
  dog.userData.head.rotation.z = Math.sin(time * 1.6) * 0.02;
  dog.userData.tailPivot.rotation.y = Math.sin(time * 3.5) * 0.18;

  dog.userData.legs.forEach(leg => {
    const swing = Math.sin(time * 9 + leg.phase);
    leg.shoulder.rotation.z = swing * 0.38;
    leg.lowerPivot.rotation.z = -Math.max(-0.15, swing) * 0.32;
  });
}

function updateCamera(progress, delta) {
  const p = dog.position;
  let offset;
  if (progress < 0.28) offset = new THREE.Vector3(5.4, 6.2, 7.2);
  else if (progress < 0.68) offset = new THREE.Vector3(4.5, 4.1, 5.5);
  else offset = new THREE.Vector3(2.9, 3.1, 4.2);

  const desired = p.clone().add(offset);
  camera.position.lerp(desired, Math.min(delta * 2.1, 0.075));
  camera.lookAt(p.x, p.y + 0.9, p.z);
}

function completeSequence() {
  if (completed) return;
  completed = true;
  statusText.textContent = 'ARRIVED';
  finishCard.setAttribute('aria-hidden', 'false');
  finishCard.classList.add('is-visible');
  window.dispatchEvent(new CustomEvent('robotDogIntroComplete'));
  setTimeout(() => reveal.classList.add('is-active'), 1400);
}

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  const elapsed = (performance.now() - started) / 1000;
  const rawProgress = Math.min(elapsed / totalDuration, 1);
  const progress = easeInOut(rawProgress);

  updateDog(progress, elapsed);
  updateCamera(progress, delta);

  goalRing.rotation.z += delta * 0.8;
  goalRing.position.y = 0.1 + Math.sin(elapsed * 2.4) * 0.04;

  const nextStatus = Math.min(Math.floor(rawProgress * statuses.length), statuses.length - 1);
  if (nextStatus !== statusIndex) {
    statusIndex = nextStatus;
    statusText.textContent = statuses[statusIndex];
  }

  if (rawProgress >= 1) completeSequence();
  renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// Subtle parallax only. The route itself never changes, so this cannot break navigation.
window.addEventListener('pointermove', event => {
  const x = event.clientX / window.innerWidth - 0.5;
  const y = event.clientY / window.innerHeight - 0.5;
  world.rotation.x += (y * 0.025 - world.rotation.x) * 0.04;
  world.rotation.z += (-x * 0.018 - world.rotation.z) * 0.04;
});

animate();
