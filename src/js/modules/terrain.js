/* ============================================================
   TERRAIN — the brand idea, rendered.
   A particle field holds two states: the terraced bowl of a
   depleted open-pit mine, and the ordered rows of a solar
   array. Scrolling drives the transformation between them.
   ============================================================ */

import * as THREE from 'three';

const VERT = /* glsl */ `
  uniform float uTime;
  uniform float uProgress;
  uniform float uSize;
  uniform float uDpr;

  attribute vec3 aPit;
  attribute vec3 aFarm;
  attribute vec3 aRand;
  attribute vec2 aMeta;

  varying float vMix;
  varying float vY;
  varying float vRand;
  varying float vAcross;

  void main() {
    // Points nearer the pit floor convert first, so the change
    // reads as spreading outward from the centre.
    float delay = aRand.x * 0.5;
    float p = clamp((uProgress - delay) / 0.5, 0.0, 1.0);
    p = p * p * (3.0 - 2.0 * p);

    vec3 pos = mix(aPit, aFarm, p);

    // lift through an arc mid-transition
    float arc = sin(p * 3.141592);
    pos.y += arc * (0.22 + aRand.y * 0.85);
    pos.x += arc * (aRand.z - 0.5) * 0.55;

    // idle breathing
    float t = uTime * 0.26;
    pos.x += sin(t + aRand.x * 22.0) * 0.04;
    pos.z += cos(t * 0.87 + aRand.y * 19.0) * 0.04;
    pos.y += sin(t * 1.24 + aRand.z * 26.0) * 0.025;

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * (0.55 + aRand.y * 1.0) * uDpr * (26.0 / max(-mv.z, 0.1));

    vMix = p;
    vY = pos.y;
    vRand = aRand.z;
    vAcross = aMeta.x;
  }
`;

const FRAG = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform float uProgress;
  uniform vec3 uEarth;
  uniform vec3 uSolar;
  uniform vec3 uSpark;

  varying float vMix;
  varying float vY;
  varying float vRand;
  varying float vAcross;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float d = dot(uv, uv);
    if (d > 0.25) discard;
    float mask = smoothstep(0.25, 0.015, d);

    vec3 col = mix(uEarth, uSolar, vMix);
    // depth shading — the pit floor sits in shadow
    col *= 0.42 + 0.58 * smoothstep(-2.9, 0.9, vY);
    // panel shading — dark at the low edge, lit at the raised edge, so the
    // ordered rows separate from one another once the array has formed
    float panel = mix(1.0, 0.34 + 1.05 * smoothstep(-1.0, 0.85, vAcross), vMix);
    col *= panel;

    // occasional specular glint off the panels
    float seed = fract(sin(vRand * 91.7) * 43758.5453);
    float glint = step(0.978, fract(seed + uTime * 0.07));
    col = mix(col, uSpark, glint * vMix * 0.85);

    // Ease the field back mid-transition so overlaid copy stays readable.
    float alpha = mask * mix(0.5, 0.86, vMix) * (1.0 - 0.4 * sin(vMix * 3.141592)) * mix(1.0, 0.5 + 0.6 * smoothstep(-1.0, 0.6, vAcross), vMix);
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
  uniform vec3 uColor;
  varying vec2 vUv;
  void main() {
    vec2 p = vUv - 0.5;
    p.y *= 1.9;
    float r = length(p);
    float core = smoothstep(0.30, 0.0, r);
    float halo = smoothstep(0.5, 0.06, r) * 0.5;
    float a = (core * 0.55 + halo) * (0.22 + uProgress * 0.62);
    gl_FragColor = vec4(uColor, a);
  }
`;

const hex = (h) => new THREE.Color(h);

function buildAttributes(count, R) {
  const pit = new Float32Array(count * 3);
  const farm = new Float32Array(count * 3);
  const rand = new Float32Array(count * 3);
  const meta = new Float32Array(count * 2);   // x: across-panel (-1..1), y: row (0..1)

  const DEPTH = 3.1;
  const STEPS = 7;
  const ROWS = 11;
  const ROW_GAP = (R * 1.92) / ROWS;          // spacing between array rows
  const PANEL = ROW_GAP * 0.34;               // panel half-depth — leaves a clear aisle
  const TILT = 1.55;                          // panel pitch

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    const i2 = i * 2;

    /* — the pit: uniform disc, quantised into terraces — */
    const a = Math.random() * Math.PI * 2;
    const r = R * Math.sqrt(Math.random());
    const inner = Math.min(r / (R * 0.84), 1);
    const t = 1 - inner;                       // 1 at centre, 0 at rim
    const level = Math.floor(t * STEPS) / STEPS;
    const ledge = (Math.random() - 0.5) * 0.06;
    const rim = r > R * 0.84 ? (Math.random() - 0.5) * 0.16 : 0;

    pit[i3] = Math.cos(a) * r;
    pit[i3 + 1] = -DEPTH * level + ledge + rim;
    pit[i3 + 2] = Math.sin(a) * r * 0.86;

    /* — the array: tilted rows on level ground — */
    const row = Math.floor(Math.random() * ROWS);
    const across = (Math.random() - 0.5) * 2;          // position across the panel
    const jitter = (Math.random() - 0.5) * 0.035;
    // taper the rows so the array reads as a field, not a rectangle
    const edge = (row / (ROWS - 1)) * 2 - 1;
    const span = R * 1.04 * Math.sqrt(Math.max(0.22, 1 - edge * edge * 0.62));

    farm[i3] = (Math.random() - 0.5) * 2 * span;
    farm[i3 + 1] = 0.42 + across * PANEL * TILT + jitter;
    farm[i3 + 2] = -R * 0.96 + row * ROW_GAP + across * PANEL;

    meta[i2] = across;
    meta[i2 + 1] = row / (ROWS - 1);

    rand[i3] = Math.random();
    rand[i3 + 1] = Math.random();
    rand[i3 + 2] = Math.random();
  }
  return { pit, farm, rand, meta };
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
  scene.fog = new THREE.FogExp2(0x0a0a0c, 0.052);

  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  // Landscape frames the field low, under the headline. Portrait needs it
  // higher and further back so the pit is not cropped by the copy below.
  const LAND = { pos: new THREE.Vector3(0, 5.6, 17.4), look: -1.35, rise: 5.2, pull: 2.4, glow: 1 };
  const PORT = { pos: new THREE.Vector3(0, 6.2, 15.2), look: -0.35, rise: 3.4, pull: 0.6, glow: 0.62 };
  let frame_ = LAND;
  const camBase = LAND.pos.clone();
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

  /* — glow behind the field — */
  const glow = new THREE.Mesh(
    new THREE.PlaneGeometry(30, 18),
    new THREE.ShaderMaterial({
      vertexShader: GLOW_VERT,
      fragmentShader: GLOW_FRAG,
      uniforms: { uProgress: { value: 0 }, uColor: { value: hex(0xf0a93b) } },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  );
  glow.position.set(0, 0.6, -13);
  scene.add(glow);

  /* — the field — */
  const { pit, farm, rand, meta } = buildAttributes(count, R);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pit.slice(), 3));
  geo.setAttribute('aPit', new THREE.BufferAttribute(pit, 3));
  geo.setAttribute('aFarm', new THREE.BufferAttribute(farm, 3));
  geo.setAttribute('aRand', new THREE.BufferAttribute(rand, 3));
  geo.setAttribute('aMeta', new THREE.BufferAttribute(meta, 2));
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, -1, 0), R * 2.2);

  const uniforms = {
    uTime: { value: 0 },
    uProgress: { value: 0 },
    uSize: { value: small ? 2.5 : 3.1 },
    uDpr: { value: 1 },
    uEarth: { value: hex(0xa4623a) },
    uSolar: { value: hex(0xf0a93b) },
    uSpark: { value: hex(0xfff4e0) },
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
    // keep the field framed on tall/narrow viewports
    const portrait = w / h < 0.95;
    frame_ = portrait ? PORT : LAND;
    camBase.copy(frame_.pos);
    glow.scale.setScalar(frame_.glow);
    glow.position.set(0, frame_.glow < 1 ? 1.4 : 0.6, -13);
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

  const state = { progress: 0, visible: true, running: true };
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
    uniforms.uProgress.value += (state.progress - uniforms.uProgress.value) * 0.075;
    glow.material.uniforms.uProgress.value = uniforms.uProgress.value;

    pointer.x += (pointer.tx - pointer.x) * 0.045;
    pointer.y += (pointer.ty - pointer.y) * 0.045;

    const p = uniforms.uProgress.value;
    tmp.set(
      camBase.x + pointer.x * 0.7,
      camBase.y + p * frame_.rise - pointer.y * 0.5,
      camBase.z - p * frame_.pull
    );
    camera.position.lerp(tmp, 0.08);
    camera.lookAt(0, frame_.look + p * 1.55, 0);

    points.rotation.y = Math.sin(uniforms.uTime.value * 0.045) * 0.06 + p * 0.10;

    renderer.render(scene, camera);
  }
  frame();

  return {
    setProgress(v) { state.progress = Math.max(0, Math.min(1, v)); },
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
