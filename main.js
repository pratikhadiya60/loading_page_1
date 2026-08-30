import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';

/* ============================================================
   ROBOT DOG MAZE INTRO
   ------------------------------------------------------------
   The project deliberately uses procedural geometry instead of
   a downloaded character model. This keeps the first prototype
   lightweight and makes the code easy to move into the portfolio.
   A real GLB robot-dog model can later replace createRobotDog().
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
renderer.toneMappingExposure = 1.05;

const scene = new THREE.Scene();
scene.fog = new THREE.Fog('#edf0ee', 16, 34);

const camera = new THREE.PerspectiveCamera(38, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(11, 12, 15);

// Soft studio lighting keeps the scene clean rather than cartoon-like.
scene.add(new THREE.HemisphereLight('#ffffff', '#aeb7b1', 2.3));
const keyLight = new THREE.DirectionalLight('#fff8e8', 3.2);
keyLight.position.set(8, 15, 8);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(2048, 2048);
keyLight.shadow.camera.left = -12;
keyLight.shadow.camera.right = 12;
keyLight.shadow.camera.top = 12;
keyLight.shadow.camera.bottom = -12;
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight('#dfe9f5', 1.4);
fillLight.position.set(-10, 7, -8);
scene.add(fillLight);

const world = new THREE.Group();
world.rotation.y = -0.18;
scene.add(world);

// ---------- Materials ----------
const floorMaterial = new THREE.MeshStandardMaterial({ color: '#d9ddda', roughness: 0.88, metalness: 0.03 });
const wallMaterial = new THREE.MeshStandardMaterial({ color: '#e9e7e0', roughness: 0.74, metalness: 0.02 });
const trimMaterial = new THREE.MeshStandardMaterial({ color: '#c9cfcb', roughness: 0.7, metalness: 0.08 });
const whiteMaterial = new THREE.MeshStandardMaterial({ color: '#f4f5f2', roughness: 0.48, metalness: 0.22 });
const darkMaterial = new THREE.MeshStandardMaterial({ color: '#151b20', roughness: 0.38, metalness: 0.65 });
const accentMaterial = new THREE.MeshStandardMaterial({ color: '#7697a3', roughness: 0.3, metalness: 0.35 });

// ---------- Maze ----------
const floor = new THREE.Mesh(new THREE.BoxGeometry(15.5, 0.7, 12), floorMaterial);
floor.position.y = -0.35;
floor.receiveShadow = true;
world.add(floor);

const baseTrim = new THREE.Mesh(new THREE.BoxGeometry(16.1, 0.24, 12.6), trimMaterial);
baseTrim.position.y = -0.78;
baseTrim.receiveShadow = true;
world.add(baseTrim);

function addWall(x, z, width, depth, height = 1.45) {
  const wall = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), wallMaterial);
  wall.position.set(x, height / 2, z);
  wall.castShadow = true;
  wall.receiveShadow = true;
  world.add(wall);
}

// Outer frame plus a deliberately simple path through the maze.
addWall(0, -5.6, 15.5, 0.45);
addWall(-7.55, 0, 0.45, 11.2);
addWall(7.55, 0, 0.45, 11.2);
addWall(-3.7, 5.6, 7.3, 0.45);
addWall(4.8, 5.6, 5.0, 0.45);

addWall(-3.6, -3.5, 0.45, 4.1);
addWall(-1.2, -1.55, 4.9, 0.45);
addWall(1.0, -3.7, 0.45, 4.2);
addWall(3.8, -2.2, 4.8, 0.45);
addWall(5.8, 0.2, 0.45, 4.4);
addWall(2.8, 1.7, 5.8, 0.45);
addWall(-0.1, 3.4, 0.45, 3.4);
addWall(-2.0, 3.0, 3.8, 0.45);
addWall(-5.1, 1.8, 0.45, 5.0);
addWall(-3.9, 0.1, 2.4, 0.45);
addWall(-5.4, -1.7, 2.7, 0.45);

// ---------- Robot dog ----------
function roundedBox(width, height, depth, radius = 0.18) {
  // A simple box is used here to keep the project dependency-free.
  return new THREE.BoxGeometry(width, height, depth, 2, 2, 2);
}

function createRobotDog() {
  const dog = new THREE.Group();
  const body = new THREE.Group();
  dog.add(body);

  const torso = new THREE.Mesh(roundedBox(1.55, 0.7, 0.82), whiteMaterial);
  torso.position.y = 1.02;
  torso.castShadow = true;
  body.add(torso);

  const chest = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.46, 0.66), darkMaterial);
  chest.position.set(-0.72, 1.04, 0);
  chest.castShadow = true;
  body.add(chest);

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 0.58, 16), darkMaterial);
  neck.rotation.z = -0.25;
  neck.position.set(-0.88, 1.53, 0);
  neck.castShadow = true;
  body.add(neck);

  const head = new THREE.Group();
  head.position.set(-1.08, 1.82, 0);
  body.add(head);

  const skull = new THREE.Mesh(roundedBox(0.7, 0.5, 0.6), whiteMaterial);
  skull.castShadow = true;
  head.add(skull);

  const snout = new THREE.Mesh(roundedBox(0.38, 0.22, 0.48), whiteMaterial);
  snout.position.set(-0.42, -0.08, 0);
  snout.castShadow = true;
  head.add(snout);

  const earGeometry = new THREE.CapsuleGeometry(0.09, 0.32, 5, 10);
  [-1, 1].forEach(side => {
    const ear = new THREE.Mesh(earGeometry, whiteMaterial);
    ear.position.set(0.05, 0.13, side * 0.32);
    ear.rotation.z = side * 0.28;
    ear.castShadow = true;
    head.add(ear);
  });

  const eye = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 12), accentMaterial);
  eye.position.set(-0.22, 0.06, -0.305);
  head.add(eye);

  const tail = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.52, 5, 10), whiteMaterial);
  tail.position.set(0.98, 1.23, 0);
  tail.rotation.z = -0.95;
  tail.castShadow = true;
  body.add(tail);

  const legs = [];
  const legPositions = [
    [-0.45, -0.3], [-0.45, 0.3],
    [0.55, -0.3], [0.55, 0.3]
  ];

  legPositions.forEach(([x, z], index) => {
    const hip = new THREE.Group();
    hip.position.set(x, 0.82, z);
    body.add(hip);

    const upper = new THREE.Mesh(new THREE.CapsuleGeometry(0.105, 0.55, 5, 10), whiteMaterial);
    upper.position.y = -0.35;
    upper.castShadow = true;
    hip.add(upper);

    const joint = new THREE.Group();
    joint.position.y = -0.68;
    hip.add(joint);

    const lower = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.52, 5, 10), darkMaterial);
    lower.position.y = -0.32;
    lower.castShadow = true;
    joint.add(lower);

    legs.push({ hip, joint, phase: index % 2 === 0 ? 0 : Math.PI });
  });

  dog.userData.legs = legs;
  dog.userData.head = head;
  dog.scale.setScalar(0.88);
  return dog;
}

const dog = createRobotDog();
dog.position.set(-5.8, 0, -4.5);
dog.rotation.y = 0.25;
world.add(dog);

// The route is hand-authored. It looks intentional and avoids unnecessary AI/pathfinding.
const pathPoints = [
  new THREE.Vector3(-5.8, 0, -4.5),
  new THREE.Vector3(-2.7, 0, -4.5),
  new THREE.Vector3(-2.7, 0, -2.3),
  new THREE.Vector3(0.2, 0, -2.3),
  new THREE.Vector3(0.2, 0, 0.6),
  new THREE.Vector3(-3.7, 0, 0.6),
  new THREE.Vector3(-3.7, 0, 3.9),
  new THREE.Vector3(1.8, 0, 3.9),
  new THREE.Vector3(4.7, 0, 3.9),
  new THREE.Vector3(6.2, 0, 4.8)
];

const curve = new THREE.CatmullRomCurve3(pathPoints, false, 'centripetal');
const pathLine = new THREE.Line(
  new THREE.BufferGeometry().setFromPoints(curve.getPoints(100)),
  new THREE.LineBasicMaterial({ color: '#9aa7a0', transparent: true, opacity: 0.22 })
);
pathLine.position.y = 0.03;
world.add(pathLine);

// ---------- Animation ----------
const clock = new THREE.Clock();
const totalDuration = 18;
let started = performance.now();
let completed = false;
let statusIndex = 0;
const statuses = ['INITIALIZING', 'CALIBRATING PATH', 'NAVIGATING MAZE', 'PREPARING PORTFOLIO'];

function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function updateDog(progress, time) {
  const t = Math.min(progress, 0.995);
  const position = curve.getPointAt(t);
  const tangent = curve.getTangentAt(t).normalize();
  dog.position.copy(position);
  dog.position.y = 0.02 + Math.sin(time * 7.5) * 0.018;
  dog.rotation.y = Math.atan2(tangent.x, tangent.z);

  dog.userData.legs.forEach((leg, i) => {
    const swing = Math.sin(time * 8 + leg.phase) * 0.5;
    leg.hip.rotation.z = swing * 0.42;
    leg.joint.rotation.z = -Math.max(0, swing) * 0.7;
  });

  dog.userData.head.rotation.z = Math.sin(time * 1.8) * 0.025;
}

function updateCamera(progress, delta) {
  const dogPosition = dog.position.clone();
  let desired;

  // Three simple cinematic shots. Controlled choreography looks better here than a free game camera.
  if (progress < 0.26) {
    desired = dogPosition.clone().add(new THREE.Vector3(5.2, 6.6, 7.4));
  } else if (progress < 0.68) {
    desired = dogPosition.clone().add(new THREE.Vector3(4.8, 4.1, 5.7));
  } else {
    desired = dogPosition.clone().add(new THREE.Vector3(2.8, 3.4, 4.2));
  }

  camera.position.lerp(desired, Math.min(delta * 1.9, 0.06));
  const lookTarget = dogPosition.clone().add(new THREE.Vector3(0, 0.75, 0));
  camera.lookAt(lookTarget);
}

function completeSequence() {
  if (completed) return;
  completed = true;
  statusText.textContent = 'ARRIVED';
  finishCard.setAttribute('aria-hidden', 'false');
  finishCard.classList.add('is-visible');

  // Integration hook: the future portfolio can listen for this event,
  // then replace this intro with the actual website while keeping the fade.
  window.dispatchEvent(new CustomEvent('robotDogIntroComplete'));

  setTimeout(() => reveal.classList.add('is-active'), 1200);
}

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  const elapsed = (performance.now() - started) / 1000;
  const rawProgress = Math.min(elapsed / totalDuration, 1);
  const progress = easeInOut(rawProgress);

  updateDog(progress, elapsed);
  updateCamera(progress, delta);

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

// Mouse movement adds a subtle cinematic parallax without turning the intro into a game.
window.addEventListener('pointermove', event => {
  const x = event.clientX / window.innerWidth - 0.5;
  const y = event.clientY / window.innerHeight - 0.5;
  world.rotation.x = THREE.MathUtils.lerp(world.rotation.x, y * 0.035, 0.06);
  world.rotation.z = THREE.MathUtils.lerp(world.rotation.z, -x * 0.025, 0.06);
});

animate();
