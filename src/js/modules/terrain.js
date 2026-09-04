/* ============================================================
   TERRAIN — the company's work, rendered.

   One particle field holds three states and scroll moves
   between them:

     01  the terraced bowl of a depleted open-pit mine
     02  the ordered rows of an installed solar array
     03  the same array with the land restored around it

   The third state is not a new arrangement so much as a
   settling of the second: a share of the points leave the
   panel rows, drop into the aisles and turn to vegetation,
   which is what restoration actually looks like on a site
   that is already generating.
   ============================================================ */

import * as THREE from 'three';

const VERT = /* glsl */ `
  uniform float uTime;
  uniform float uBuild;      // 0 → 1 : pit becomes array
  uniform float uRestore;    // 0 → 1 : land recovers around the array
  uniform float uSize;
  uniform float uDpr;

  attribute vec3 aPit;
  attribute vec3 aFarm;
  attribute vec3 aLand;
  attribute vec3 aRand;
  attribute vec2 aMeta;      // x: across-panel (-1..1), y: role (0 panel, 1 ground)

  varying float vBuild;
  varying float vGrass;
  varying float vY;
  varying float vRand;
  varying float vAcross;

  void main() {
    // Points nearer the pit floor convert first, so construction
    // reads as spreading outward from the centre.
    float delay = aRand.x * 0.5;
    float b = clamp((uBuild - delay) / 0.5, 0.0, 1.0);
    b = b * b * (3.0 - 2.0 * b);

    vec3 pos = mix(aPit, aFarm, b);

    // lift through an arc mid-construction
    float arc = sin(b * 3.141592);
    pos.y += arc * (0.22 + aRand.y * 0.85);
    pos.x += arc * (aRand.z - 0.5) * 0.55;

    // Restoration: the ground-role points leave the rows and settle
    // into the aisles. Panel-role points hold their position.
    float role = aMeta.y;
    float gDelay = aRand.y * 0.45;
    float g = clamp((uRestore - gDelay) / 0.55, 0.0, 1.0);
    g = g * g * (3.0 - 2.0 * g) * role;
    pos = mix(pos, aLand, g);
    // a small settle as they land, like growth taking hold
    pos.y += sin(g * 3.141592) * 0.28 * role;

    // idle breathing
    float t = uTime * 0.26;
    pos.x += sin(t + aRand.x * 22.0) * 0.04;
    pos.z += cos(t * 0.87 + aRand.y * 19.0) * 0.04;
    pos.y += sin(t * 1.24 + aRand.z * 26.0) * 0.025;

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;

    // vegetation reads finer than panel hardware
    float scale = mix(1.0, 0.7, g);
    gl_PointSize = uSize * (0.55 + aRand.y * 1.0) * scale * uDpr * (26.0 / max(-mv.z, 0.1));

    vBuild = b;
    vGrass = g;
    vY = pos.y;
    vRand = aRand.z;
    vAcross = aMeta.x;
  }
`;

const FRAG = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform vec3 uEarth;
  uniform vec3 uPanel;
  uniform vec3 uFlora;
  uniform vec3 uSpark;

  varying float vBuild;
  varying float vGrass;
  varying float vY;
  varying float vRand;
  varying float vAcross;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float d = dot(uv, uv);
    if (d > 0.25) discard;
    float mask = smoothstep(0.25, 0.015, d);

    vec3 col = mix(uEarth, uPanel, vBuild);
    // depth shading — the pit floor sits in shadow
    col *= 0.42 + 0.58 * smoothstep(-2.9, 0.9, vY);
    // panel shading — dark at the low edge, lit at the raised edge, so the
    // ordered rows separate from one another once the array has formed
    float panel = mix(1.0, 0.34 + 1.05 * smoothstep(-1.0, 0.85, vAcross), vBuild * (1.0 - vGrass));
    col *= panel;

    // vegetation takes over the ground between the rows
    float flora = uFlora.g > 0.0 ? vGrass : 0.0;
    col = mix(col, uFlora * (0.6 + 0.7 * fract(vRand * 13.7)), flora);

    // occasional specular glint off the glass
    float seed = fract(sin(vRand * 91.7) * 43758.5453);
    float glint = step(0.978, fract(seed + uTime * 0.07));
    col = mix(col, uSpark, glint * vBuild * (1.0 - vGrass) * 0.85);

    float alpha = mask * mix(0.5, 0.86, vBuild) * (1.0 - 0.4 * sin(vBuild * 3.141592));
    alpha *= mix(1.0, 0.5 + 0.6 * smoothstep(-1.0, 0.6, vAcross), vBuild * (1.0 - vGrass));
    alpha = mix(alpha, mask * 0.62, vGrass);
    gl_FragColor = vec4(col, alpha);
  }
`;

const GLOW_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const GLOW_FRAG = /* glsl */ `
  precision mediump float;
  uniform float uProgress;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform float uBlend;
  varying vec2 vUv;
  void main() {
    vec2 p = vUv - 0.5;
    p.y *= 1.9;
    float r = length(p);
    float core = smoothstep(0.30, 0.0, r);
    float halo = smoothstep(0.5, 0.06, r) * 0.5;
    float a = (core * 0.55 + halo) * (0.22 + uProgress * 0.62);
    gl_FragColor = vec4(mix(uColorA, uColorB, uBlend), a);
  }
`;

const hex = (h) => new THREE.Color(h);

function buildAttributes(count, R) {
  const pit = new Float32Array(count * 3);
  const farm = new Float32Array(count * 3);
  const land = new Float32Array(count * 3);
  const rand = new Float32Array(count * 3);
  const meta = new Float32Array(count * 2);

  const DEPTH = 3.1;
  const STEPS = 7;
  const ROWS = 11;
  const ROW_GAP = (R * 1.92) / ROWS;
  const PANEL = ROW_GAP * 0.34;
  const TILT = 1.55;
  const GROUND_SHARE = 0.5;       // points that become vegetation in state 03

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    const i2 = i * 2;

    /* — 01 the pit: uniform disc, quantised into terraces — */
    const a = Math.random() * Math.PI * 2;
    const r = R * Math.sqrt(Math.random());
    const inner = Math.min(r / (R * 0.84), 1);
    const t = 1 - inner;
    const level = Math.floor(t * STEPS) / STEPS;
    const ledge = (Math.random() - 0.5) * 0.06;
    const rim = r > R * 0.84 ? (Math.random() - 0.5) * 0.16 : 0;

    pit[i3] = Math.cos(a) * r;
    pit[i3 + 1] = -DEPTH * level + ledge + rim;
    pit[i3 + 2] = Math.sin(a) * r * 0.86;

    /* — 02 the array: tilted rows on level ground — */
    const row = Math.floor(Math.random() * ROWS);
    const across = (Math.random() - 0.5) * 2;
    const jitter = (Math.random() - 0.5) * 0.035;
    const edge = (row / (ROWS - 1)) * 2 - 1;
    const span = R * 1.04 * Math.sqrt(Math.max(0.22, 1 - edge * edge * 0.62));
    const rowZ = -R * 0.96 + row * ROW_GAP;

    farm[i3] = (Math.random() - 0.5) * 2 * span;
    farm[i3 + 1] = 0.42 + across * PANEL * TILT + jitter;
    farm[i3 + 2] = rowZ + across * PANEL;

    /* — 03 restored ground: vegetation filling the aisles — */
    // Vegetation runs in strips down the clear ground between rows, so the
    // green reads as cover on the land rather than colour inside the array.
    const aisleZ = rowZ + ROW_GAP * 0.5;
    const tuft = Math.sin(Math.random() * Math.PI);        // denser mid-aisle
    land[i3] = (Math.random() - 0.5) * 2 * span * 1.02;
    land[i3 + 1] = 0.015 + Math.pow(Math.random(), 2.6) * 0.17;
    land[i3 + 2] = aisleZ + (Math.random() - 0.5) * ROW_GAP * 0.28 * tuft;

    meta[i2] = across;
    meta[i2 + 1] = Math.random() < GROUND_SHARE ? 1 : 0;

    rand[i3] = Math.random();
    rand[i3 + 1] = Math.random();
    rand[i3 + 2] = Math.random();
  }
  return { pit, farm, land, rand, meta };
}

export function initTerrain(container, opts = {}) {
  if (!container) return null;

  // WebGL support probe — bail quietly to the CSS fallback.
  const probe = document.createElement('canvas');
  const supported = !!(
    window.WebGLRenderingContext &&
    (probe.getContext('webgl2') || probe.getContext('webgl'))
  );
  if (!supported) {
    container.classList.add('is-fallback');
    return null;
  }

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const small = window.innerWidth < 768;
  const count = opts.count ?? (small ? 15000 : window.innerWidth < 1300 ? 22000 : 34000);
  const R = 7;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x060b13, 0.052);

  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  // Landscape frames the field low, under the headline. Portrait needs it
  // higher and closer so the field is not cropped by the copy below.
  const LAND_VIEW = { pos: new THREE.Vector3(0, 5.6, 17.4), look: -1.35, rise: 5.2, pull: 2.4, glow: 1 };
  const PORT_VIEW = { pos: new THREE.Vector3(0, 6.2, 15.2), look: -0.35, rise: 3.4, pull: 0.6, glow: 0.62 };
  let view = LAND_VIEW;
  const camBase = LAND_VIEW.pos.clone();
  camera.position.copy(camBase);

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      antialias: false,
      alpha: true,
      powerPreference: 'high-performance',
    });
  } catch (e) {
    container.classList.add('is-fallback');
    return null;
  }
  renderer.setClearColor(0x000000, 0);
  container.appendChild(renderer.domElement);

  /* — glow behind the field, blue while building, green once restored — */
  const glow = new THREE.Mesh(
    new THREE.PlaneGeometry(30, 18),
    new THREE.ShaderMaterial({
      vertexShader: GLOW_VERT,
      fragmentShader: GLOW_FRAG,
      uniforms: {
        uProgress: { value: 0 },
        uColorA: { value: hex(0x3d8bfd) },
        uColorB: { value: hex(0x35c08a) },
        uBlend: { value: 0 },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  );
  glow.position.set(0, 0.6, -13);
  scene.add(glow);

  /* — the field — */
  const { pit, farm, land, rand, meta } = buildAttributes(count, R);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pit.slice(), 3));
  geo.setAttribute('aPit', new THREE.BufferAttribute(pit, 3));
  geo.setAttribute('aFarm', new THREE.BufferAttribute(farm, 3));
  geo.setAttribute('aLand', new THREE.BufferAttribute(land, 3));
  geo.setAttribute('aRand', new THREE.BufferAttribute(rand, 3));
  geo.setAttribute('aMeta', new THREE.BufferAttribute(meta, 2));
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, -1, 0), R * 2.2);

  const uniforms = {
    uTime: { value: 0 },
    uBuild: { value: 0 },
    uRestore: { value: 0 },
    uSize: { value: small ? 2.5 : 3.1 },
    uDpr: { value: 1 },
    uEarth: { value: hex(0x8a7259) },
    uPanel: { value: hex(0x3d8bfd) },
    uFlora: { value: hex(0x35c08a) },
    uSpark: { value: hex(0xdfeeff) },
  };

  const points = new THREE.Points(
    geo,
    new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  );
  scene.add(points);

  /* — sizing — */
  const dprCap = small ? 1.6 : 1.9;
  function resize() {
    const w = container.clientWidth || window.innerWidth;
    const h = container.clientHeight || window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, dprCap);
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const portrait = w / h < 0.95;
    view = portrait ? PORT_VIEW : LAND_VIEW;
    camBase.copy(view.pos);
    glow.scale.setScalar(view.glow);
    glow.position.set(0, view.glow < 1 ? 1.4 : 0.6, -13);
    camera.fov = w / h < 0.7 ? 60 : w / h < 1.1 ? 52 : 42;
    camera.updateProjectionMatrix();
    uniforms.uDpr.value = dpr;
    uniforms.uSize.value = w < 768 ? 2.4 : w < 1300 ? 2.9 : 3.2;
  }
  resize();

  /* — interaction + loop — */
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  const onPointer = (e) => {
    const t = e.touches ? e.touches[0] : e;
    pointer.tx = (t.clientX / window.innerWidth - 0.5) * 2;
    pointer.ty = (t.clientY / window.innerHeight - 0.5) * 2;
  };
  window.addEventListener('pointermove', onPointer, { passive: true });
  window.addEventListener('resize', resize);

  const state = { build: 0, restore: 0, visible: true, running: true };
  const clock = new THREE.Clock();
  let raf = 0;

  const io = new IntersectionObserver(
    ([entry]) => { state.visible = entry.isIntersecting; },
    { threshold: 0 }
  );
  io.observe(container);

  const onVis = () => { state.running = !document.hidden; };
  document.addEventListener('visibilitychange', onVis);

  const tmp = new THREE.Vector3();

  function frame() {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(clock.getDelta(), 0.05);
    if (!state.visible || !state.running) return;

    uniforms.uTime.value += reduced ? 0 : dt;
    uniforms.uBuild.value += (state.build - uniforms.uBuild.value) * 0.075;
    uniforms.uRestore.value += (state.restore - uniforms.uRestore.value) * 0.075;

    const b = uniforms.uBuild.value;
    const g = uniforms.uRestore.value;
    glow.material.uniforms.uProgress.value = b;
    glow.material.uniforms.uBlend.value = g;

    pointer.x += (pointer.tx - pointer.x) * 0.045;
    pointer.y += (pointer.ty - pointer.y) * 0.045;

    // Rise into the aerial view as the array is built and hold it through
    // restoration — the rows and the ground between them only read from above.
    const elevation = b * view.rise + g * view.rise * 0.12;
    tmp.set(
      camBase.x + pointer.x * 0.7,
      camBase.y + elevation - pointer.y * 0.5,
      camBase.z - b * view.pull - g * view.pull * 0.15
    );
    camera.position.lerp(tmp, 0.08);
    camera.lookAt(0, view.look + b * 1.55 + g * 0.12, 0);

    points.rotation.y = Math.sin(uniforms.uTime.value * 0.045) * 0.06 + b * 0.1;

    renderer.render(scene, camera);
  }
  frame();

  return {
    /** 0 → 1 across the pit-to-array construction. */
    setBuild(v) { state.build = Math.max(0, Math.min(1, v)); },
    /** 0 → 1 across the land recovering around the finished array. */
    setRestore(v) { state.restore = Math.max(0, Math.min(1, v)); },
    resize,
    destroy() {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener('pointermove', onPointer);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVis);
      geo.dispose();
      points.material.dispose();
      glow.geometry.dispose();
      glow.material.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
