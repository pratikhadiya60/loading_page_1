import * as THREE from "three";

/**
 * Sets up the renderer, scene, camera, and soft cinematic "product shot"
 * lighting (key + fill + hemisphere). Returns everything main.js needs to
 * drive the render loop, plus a resize handler and a dispose() for cleanup.
 */
export function createScene(canvas) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xefece5); // off-white / light warm gray

  const camera = new THREE.PerspectiveCamera(
    38,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  );
  camera.position.set(6, 6, 10);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
  });
  // Cap device pixel ratio — a big perf win on high-DPI laptops/phones
  // for what is, after all, just a loading screen.
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  // --- Soft cinematic studio lighting ---
  const keyLight = new THREE.DirectionalLight(0xffffff, 2.4);
  keyLight.position.set(6, 9, 4);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(1024, 1024);
  keyLight.shadow.camera.near = 1;
  keyLight.shadow.camera.far = 30;
  keyLight.shadow.camera.left = -10;
  keyLight.shadow.camera.right = 10;
  keyLight.shadow.camera.top = 10;
  keyLight.shadow.camera.bottom = -10;
  keyLight.shadow.bias = -0.0015;
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0xdfe9ff, 0.5);
  fillLight.position.set(-6, 4, -3);
  scene.add(fillLight);

  const hemiLight = new THREE.HemisphereLight(0xffffff, 0xcfc9ba, 0.6);
  scene.add(hemiLight);

  function resize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }
  window.addEventListener("resize", resize);

  function dispose() {
    window.removeEventListener("resize", resize);
    scene.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
        materials.forEach((m) => m.dispose());
      }
    });
    renderer.dispose();
  }

  return { scene, camera, renderer, resize, dispose };
}

/** True if this browser can create a WebGL context at all. */
export function isWebGLAvailable() {
  try {
    const canvas = document.createElement("canvas");
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
    );
  } catch (e) {
    return false;
  }
}
