// Maurice RJ 3D scenes (three.js r128 must load first).
// Any element with data-scene="yard|garden|concrete|repairs|snow" gets a live scene.
(function () {
  const T3 = window.THREE;
  if (!T3) return;
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const C = {
    blue: 0x0b5ed7, navy: 0x0a2f6b, yellow: 0xf2b705, dark: 0x1d232c, steel: 0x39424f, white: 0xf4f6f8,
    concrete: 0xd3d8de, wet: 0x7d848d, cured: 0xc3c8ce, gravel: 0xb9b2a6, soil: 0x6f5238, mulch: 0x5b3a25,
    leaf: 0x4e9b46, leaf2: 0x6cb54a, leaf3: 0x3f8a3a, grass: 0x7fbe52, red: 0xc8102e, wood: 0x9a6b40,
    rot: 0x4a3524, glass: 0x24303f, snow: 0xf8fbfd, orange: 0xf26b1d, siding: 0xe6eaef, roof: 0x4b5563,
  };
  const matCache = {};
  const M = (c, r = 0.8) => {
    const k = c + ':' + r;
    return matCache[k] || (matCache[k] = new T3.MeshStandardMaterial({ color: c, roughness: r, metalness: 0 }));
  };
  function place(p, mesh, x, y, z, cast = true) {
    mesh.position.set(x, y, z);
    mesh.castShadow = cast;
    mesh.receiveShadow = true;
    p.add(mesh);
    return mesh;
  }
  const box = (p, w, h, d, c, x, y, z, cast = true, r = 0.8) => place(p, new T3.Mesh(new T3.BoxGeometry(w, h, d), M(c, r)), x, y, z, cast);
  const cyl = (p, rt, rb, h, c, x, y, z, seg = 16, r = 0.7) => place(p, new T3.Mesh(new T3.CylinderGeometry(rt, rb, h, seg), M(c, r)), x, y, z);
  const ico = (p, r, c, x, y, z, detail = 0) => place(p, new T3.Mesh(new T3.IcosahedronGeometry(r, detail), M(c, 0.9)), x, y, z);
  const cone = (p, r, h, c, x, y, z, seg = 8) => place(p, new T3.Mesh(new T3.ConeGeometry(r, h, seg), M(c, 0.8)), x, y, z);
  function wheel(p, r, w, x, y, z, axis = 'x') {
    const g = new T3.CylinderGeometry(r, r, w, 20);
    if (axis === 'x') g.rotateZ(Math.PI / 2); else g.rotateX(Math.PI / 2);
    const m = place(p, new T3.Mesh(g, M(C.dark, 0.7)), x, y, z);
    const hubG = new T3.CylinderGeometry(r * 0.45, r * 0.45, w + 0.02, 12);
    if (axis === 'x') hubG.rotateZ(Math.PI / 2); else hubG.rotateX(Math.PI / 2);
    place(p, new T3.Mesh(hubG, M(0xc9ced6, 0.5)), x, y, z, false);
    return m;
  }
  function tree(p, x, z, s) {
    cyl(p, 0.12 * s, 0.17 * s, 1.0 * s, 0x7a5a3c, x, 0.5 * s, z, 8);
    ico(p, 0.75 * s, C.leaf3, x, 1.45 * s, z);
    ico(p, 0.52 * s, C.leaf2, x + 0.18 * s, 2.0 * s, z - 0.05);
  }
  const ease = t => (t < 0 ? 0 : t > 1 ? 1 : t * t * (3 - 2 * t));
  const backOut = t => { t = Math.min(1, Math.max(0, t)); const s = 1.7; return 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2); };
  const tmp = new T3.Object3D();

  // A pickup truck, length along z, front toward -z. Returns the group.
  function pickup(p, x, z, color) {
    const g = new T3.Group();
    box(g, 1.85, 0.55, 4.6, color, 0, 0.78, 0, true, 0.45);
    box(g, 1.75, 0.85, 1.7, color, 0, 1.45, -0.75, true, 0.45);
    box(g, 1.6, 0.5, 0.06, C.glass, 0, 1.55, -1.61, false, 0.2);
    box(g, 0.06, 0.45, 1.2, C.glass, 0.88, 1.57, -0.75, false, 0.2);
    box(g, 0.06, 0.45, 1.2, C.glass, -0.88, 1.57, -0.75, false, 0.2);
    for (const sx of [0.9, -0.9]) box(g, 0.08, 0.35, 2.4, color, sx, 1.22, 1.05, true, 0.45);
    box(g, 1.85, 0.35, 0.08, color, 0, 1.22, 2.26, true, 0.45);
    box(g, 1.7, 0.18, 0.1, C.dark, 0, 0.72, -2.32);
    for (const sx of [0.62, -0.62]) box(g, 0.32, 0.14, 0.06, 0xfff2b0, sx, 0.92, -2.31, false, 0.3);
    for (const sx of [0.95, -0.95]) for (const sz of [-1.45, 1.45]) wheel(g, 0.42, 0.32, sx, 0.42, sz, 'x');
    g.position.set(x, 0, z);
    p.add(g);
    return g;
  }

  // ======================= Scenes =======================

  // Hero yard: mower cutting wide stripes, truck + dump trailer, yard sign.
  function yard(w) {
    const COLS = 24, ROWS = 16, T = 0.6, W = COLS * T, D = ROWS * T;
    box(w, W + 0.1, 0.16, D + 0.1, C.soil, 0, 0.08, 0, false);

    // Sidewalk along the front and a driveway on the right
    for (let x = -W / 2 - 3; x < W / 2 + 5.6; x += 1.2) box(w, 1.15, 0.1, 1.0, C.concrete, x + 0.6, 0.05, D / 2 + 1.0, false, 0.95);
    const dx0 = W / 2 + 1.6, dz0 = -D / 2 - 1.4, dz1 = D / 2 + 0.5;
    for (let i = 0; i < 3; i++) for (let z = dz0; z < dz1 - 0.1; z += 1.2) box(w, 1.17, 0.1, 1.17, C.concrete, dx0 + 0.6 + i * 1.2, 0.05, z + 0.6, false, 0.95);

    // Truck with the red dump trailer full of mulch
    const tz = dz0 + 2.5;
    pickup(w, dx0 + 1.8, tz, C.blue);
    const tr = new T3.Group();
    box(tr, 1.95, 0.85, 3.4, C.red, 0, 1.05, 0, true, 0.5);
    box(tr, 1.75, 0.2, 3.2, C.mulch, 0, 1.5, 0, false, 1);
    ico(tr, 0.9, C.mulch, 0, 1.45, 0.2, 1).scale.set(0.95, 0.35, 1.6);
    box(tr, 0.12, 0.12, 1.0, C.dark, 0, 0.62, -2.15);
    for (const sx of [1.0, -1.0]) for (const sz of [-0.45, 0.45]) wheel(tr, 0.36, 0.28, sx, 0.36, sz, 'x');
    tr.position.set(dx0 + 1.8, 0, tz + 2.3 + 0.55 + 1.7);
    w.add(tr);

    // Shrub bed and trees behind the lawn
    box(w, W * 0.62, 0.08, 1.0, C.mulch, -W * 0.12, 0.04, -D / 2 - 1.05, false, 1);
    for (let k = 0; k < 6; k++) ico(w, 0.32 + (k % 2) * 0.08, k % 2 ? C.leaf : C.leaf2, -W * 0.12 - W * 0.27 + k * (W * 0.54 / 5), 0.34, -D / 2 - 1.05, 1);
    tree(w, -W / 2 - 1.9, -D / 2 - 1.4, 1.4);
    tree(w, W / 2 + 0.5, -D / 2 - 2.2, 1.1);
    tree(w, -W / 2 - 2.6, D / 2 - 2.2, 0.9);

    // Yard sign with the logo, facing the viewer
    const sign = new T3.Group();
    for (const sx of [-0.75, 0.75]) box(sign, 0.06, 1.1, 0.06, C.white, sx, 0.55, 0);
    box(sign, 2.0, 0.85, 0.06, 0xffffff, 0, 1.25, 0, true, 0.6);
    const tex = new T3.TextureLoader().load('images/logo-640.png');
    const logo = new T3.Mesh(new T3.PlaneGeometry(1.8, 0.68), new T3.MeshBasicMaterial({ map: tex, transparent: true }));
    logo.position.set(0, 1.25, 0.035);
    sign.add(logo);
    sign.position.set(-W / 2 - 2.5, 0, D / 2 - 0.4);
    sign.rotation.y = Math.PI / 4;
    w.add(sign);

    // Orange marker flags at the lawn corners
    for (const [x, z] of [[-W / 2 - 0.35, -D / 2 - 0.35], [W / 2 + 0.35, -D / 2 - 0.35], [W / 2 + 0.35, D / 2 + 0.35], [-W / 2 - 0.35, D / 2 + 0.35]]) {
      cyl(w, 0.025, 0.025, 0.9, C.white, x, 0.45, z, 6);
      box(w, 0.3, 0.2, 0.02, C.orange, x + 0.15, 0.8, z, true, 0.6);
    }

    // Grass
    const N = COLS * ROWS;
    const tileGeo = new T3.BoxGeometry(T * 1.001, 1, T * 1.001);
    tileGeo.translate(0, 0.5, 0);
    const grass = new T3.InstancedMesh(tileGeo, M(0xffffff, 1), N);
    grass.receiveShadow = true;
    w.add(grass);
    const tuftGeo = new T3.ConeGeometry(0.05, 0.2, 4);
    tuftGeo.translate(0, 0.1, 0);
    const tufts = new T3.InstancedMesh(tuftGeo, M(0x9ad06a, 1), N * 2);
    w.add(tufts);
    const TALL = 0.36, CUT = 0.13;
    const h = new Float32Array(N), target = new Float32Array(N), jit = new Float32Array(N), mowed = new Uint8Array(N), delay = new Float32Array(N);
    const tuftOff = [];
    const tallC = new T3.Color(0x7fbe52), stripeA = new T3.Color(0x3f8a33), stripeB = new T3.Color(0x67b346), col = new T3.Color();
    const tileX = c => -W / 2 + T / 2 + c * T, tileZ = r => -D / 2 + T / 2 + r * T;
    for (let i = 0; i < N; i++) {
      jit[i] = Math.random();
      h[i] = target[i] = TALL + jit[i] * 0.05;
      for (let k = 0; k < 2; k++) tuftOff.push([(Math.random() - 0.5) * T * 0.7, (Math.random() - 0.5) * T * 0.7, 0.5 + Math.random() * 0.4]);
    }
    function setTile(i) {
      const c = i % COLS, r = (i / COLS) | 0;
      tmp.rotation.set(0, 0, 0);
      tmp.position.set(tileX(c), 0.16, tileZ(r)); tmp.scale.set(1, h[i], 1); tmp.updateMatrix();
      grass.setMatrixAt(i, tmp.matrix);
      const grow = Math.max(0, (h[i] - CUT) / (TALL - CUT));
      for (let k = 0; k < 2; k++) {
        const [ox, oz, s] = tuftOff[i * 2 + k];
        const sc = Math.min(1, grow) * s || 0.0001;
        tmp.position.set(tileX(c) + ox, 0.16 + h[i], tileZ(r) + oz); tmp.scale.set(sc, sc, sc); tmp.updateMatrix();
        tufts.setMatrixAt(i * 2 + k, tmp.matrix);
      }
    }
    function paint(i) {
      const r = (i / COLS) | 0;
      if (mowed[i]) col.copy(((r / 2) | 0) % 2 ? stripeA : stripeB);
      else col.copy(tallC).offsetHSL(0, 0, (jit[i] - 0.5) * 0.025);
      grass.setColorAt(i, col);
    }
    for (let i = 0; i < N; i++) { setTile(i); paint(i); }

    // Mower (Maurice blue), travels along +x
    const mower = new T3.Group();
    box(mower, 0.95, 0.24, 0.78, C.blue, 0, 0.32, 0, true, 0.45);
    box(mower, 1.0, 0.08, 0.84, C.navy, 0, 0.2, 0, true, 0.6);
    cyl(mower, 0.2, 0.24, 0.26, 0x2b3442, 0.05, 0.57, 0);
    cyl(mower, 0.12, 0.12, 0.08, C.yellow, 0.05, 0.74, 0, 16, 0.5);
    box(mower, 0.4, 0.34, 0.56, C.steel, -0.62, 0.38, 0, true, 0.9);
    for (const [x, z] of [[0.34, 0.43], [0.34, -0.43], [-0.34, 0.43], [-0.34, -0.43]]) wheel(mower, 0.15, 0.09, x, 0.15, z, 'z');
    for (const z of [0.28, -0.28]) { const b = cyl(mower, 0.03, 0.03, 1.05, C.dark, -0.8, 0.8, z, 8, 0.5); b.rotation.z = 0.75; }
    const grip = cyl(mower, 0.035, 0.035, 0.66, C.yellow, -1.15, 1.17, 0, 8, 0.5);
    grip.rotation.x = Math.PI / 2;
    mower.scale.setScalar(1.6);
    w.add(mower);

    // Path: two tile rows per pass, then back up the left side
    const LANES = ROWS / 2, laneZ = k => -D / 2 + T * (2 * k + 1);
    const xa = -W / 2 - 1.1, xb = W / 2 + 1.1;
    const pts = [];
    for (let k = 0; k < LANES; k++) {
      const z = laneZ(k), l2r = k % 2 === 0;
      pts.push(l2r ? [xa, z] : [xb, z], l2r ? [xb, z] : [xa, z]);
      if (k < LANES - 1) pts.push(l2r ? [xb + 0.6, z + T] : [xa - 0.6, z + T]);
    }
    const retIdx = pts.length;
    pts.push([xa - 0.9, laneZ(LANES - 1) - 0.4], [xa - 0.9, laneZ(0) + 0.4], [xa, laneZ(0)]);
    const lens = [0];
    for (let i = 1; i < pts.length; i++) lens.push(lens[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    const total = lens[lens.length - 1], returnAt = lens[retIdx - 1];
    function pointAt(d) {
      let i = 1;
      while (i < lens.length - 1 && lens[i] < d) i++;
      const t = (d - lens[i - 1]) / Math.max(1e-6, lens[i] - lens[i - 1]);
      const a = pts[i - 1], b = pts[i];
      return { x: a[0] + (b[0] - a[0]) * t, z: a[1] + (b[1] - a[1]) * t, hx: b[0] - a[0], hz: b[1] - a[1] };
    }
    function cutAt(x, z) {
      const c = Math.round((x - tileX(0)) / T);
      if (c < 0 || c >= COLS) return false;
      let any = false;
      for (let r = 0; r < ROWS; r++) {
        if (Math.abs(tileZ(r) - z) >= T * 0.99) continue;
        const i = r * COLS + c;
        if (!mowed[i]) { mowed[i] = 1; target[i] = CUT; paint(i); any = true; }
      }
      if (any) grass.instanceColor.needsUpdate = true;
      return any;
    }

    // Clippings
    const CLIP = 80;
    const clips = new T3.InstancedMesh(new T3.BoxGeometry(0.07, 0.03, 0.07), M(0x5fae45, 1), CLIP);
    w.add(clips);
    const cp = Array.from({ length: CLIP }, () => ({ x: 0, y: -5, z: 0, vx: 0, vy: 0, vz: 0, life: 0 }));
    let nextClip = 0;

    let dist = 0, heading = 0, regrow = false;
    function placeMower(p, dt) {
      mower.position.set(p.x, 0.12, p.z);
      const want = Math.atan2(-p.hz, p.hx);
      let diff = want - heading;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      heading += diff * Math.min(1, dt * 6);
      mower.rotation.y = heading;
    }
    function update(dt) {
      dist += dt * 3.2;
      if (dist >= total) { dist -= total; regrow = false; }
      const p = pointAt(dist);
      placeMower(p, dt);
      if (cutAt(p.x, p.z)) {
        for (let k = 0; k < 3; k++) {
          const q = cp[nextClip]; nextClip = (nextClip + 1) % CLIP;
          const side = -heading + Math.PI / 2;
          Object.assign(q, { x: p.x, y: 0.5, z: p.z, vx: Math.cos(side) * (1 + Math.random()) + (Math.random() - 0.5), vz: -Math.sin(side) * (1 + Math.random()) + (Math.random() - 0.5), vy: 1.4 + Math.random() * 1.2, life: 0.9 });
        }
      }
      if (!regrow && dist >= returnAt) { regrow = true; for (let i = 0; i < N; i++) delay[i] = Math.random() * 2.4; }
      let dirty = false;
      for (let i = 0; i < N; i++) {
        if (regrow && mowed[i]) { delay[i] -= dt; if (delay[i] <= 0) { mowed[i] = 0; target[i] = TALL + jit[i] * 0.05; paint(i); dirty = true; } }
        const nh = h[i] + (target[i] - h[i]) * Math.min(1, dt * (target[i] > h[i] ? 2.5 : 12));
        if (Math.abs(nh - h[i]) > 0.0005) { h[i] = nh; setTile(i); }
      }
      if (dirty) grass.instanceColor.needsUpdate = true;
      grass.instanceMatrix.needsUpdate = true;
      tufts.instanceMatrix.needsUpdate = true;
      for (let i = 0; i < CLIP; i++) {
        const q = cp[i];
        if (q.life > 0) { q.life -= dt; q.vy -= 6 * dt; q.x += q.vx * dt; q.y = Math.max(0.2, q.y + q.vy * dt); q.z += q.vz * dt; }
        const s = q.life > 0 ? Math.min(1, q.life * 2) : 0.0001;
        tmp.position.set(q.x, q.life > 0 ? q.y : -5, q.z); tmp.rotation.set(q.life * 6, q.life * 4, 0); tmp.scale.set(s, s, s); tmp.updateMatrix();
        clips.setMatrixAt(i, tmp.matrix);
      }
      clips.instanceMatrix.needsUpdate = true;
    }
    function still() {
      let d = 0;
      while (d < total * 0.45) { const p = pointAt(d); cutAt(p.x, p.z); d += 0.1; }
      for (let i = 0; i < N; i++) { h[i] = target[i]; setTile(i); }
      grass.instanceMatrix.needsUpdate = true; tufts.instanceMatrix.needsUpdate = true;
      const p = pointAt(d);
      mower.position.set(p.x, 0.12, p.z); mower.rotation.y = Math.atan2(-p.hz, p.hx);
    }
    return { update, still, hero: true };
  }

  // A low-poly worker facing +x. Hips at y=0.8; `upper` bends at the hips, arms swing at the shoulders.
  function person(p, o = {}) {
    const shirt = o.shirt ?? C.blue, pants = o.pants ?? C.navy, skin = o.skin ?? 0xc68a5e, cap = o.cap ?? C.yellow;
    const g = new T3.Group();
    const leg = z => {
      const L = new T3.Group();
      L.position.set(0, 0.8, z);
      box(L, 0.18, 0.78, 0.2, pants, 0, -0.39, 0);
      box(L, 0.3, 0.12, 0.22, C.dark, 0.05, -0.76, 0);
      g.add(L);
      return L;
    };
    const legL = leg(0.12), legR = leg(-0.12);
    const upper = new T3.Group();
    upper.position.set(0, 0.8, 0);
    g.add(upper);
    box(upper, 0.3, 0.68, 0.5, shirt, 0, 0.36, 0, true, 0.7);
    if (o.vest) {
      box(upper, 0.32, 0.4, 0.52, C.yellow, 0, 0.42, 0, false, 0.6);
      box(upper, 0.33, 0.05, 0.53, 0xd7dde4, 0, 0.36, 0, false, 0.4);
    }
    ico(upper, 0.17, skin, 0, 0.88, 0, 1);
    cyl(upper, 0.185, 0.185, 0.1, cap, 0, 1.0, 0, 14, 0.6);
    box(upper, 0.2, 0.03, 0.3, cap, 0.14, 0.96, 0, true, 0.6);
    const arm = z => {
      const A = new T3.Group();
      A.position.set(0, 0.64, z);
      box(A, 0.13, 0.58, 0.13, shirt, 0, -0.29, 0, true, 0.7);
      ico(A, 0.075, skin, 0, -0.6, 0, 0);
      upper.add(A);
      return A;
    };
    const armL = arm(0.32), armR = arm(-0.32);
    g.scale.setScalar(o.scale ?? 1);
    p.add(g);
    return { g, upper, legL, legR, armL, armR };
  }
  function walkPose(w, phase, amount = 1) {
    const s = Math.sin(phase) * 0.55 * amount;
    w.legL.rotation.z = s; w.legR.rotation.z = -s;
    w.armL.rotation.z = -s * 0.8; w.armR.rotation.z = s * 0.8;
  }
  // Turn smoothly toward an angle instead of snapping
  function turnTo(obj, want, dt) {
    let d = want - obj.rotation.y;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    obj.rotation.y += d * Math.min(1, dt * 8);
  }
  function standPose(w) { walkPose(w, 0, 0); w.upper.rotation.z = 0; }

  // 01 Landscaping: one worker shovels mulch from the wheelbarrow, another plants shrubs.
  function garden(w) {
    box(w, 7.4, 0.14, 5.2, C.grass, 0, -0.02, 0, false, 1);
    const bed = box(w, 5.2, 0.12, 3.0, 0x7a5a40, 0, 0.06, 0, false, 1);
    const fresh = new T3.Color(C.mulch), bare = new T3.Color(0x8a6a4c);
    for (let i = 0; i < 14; i++) {
      const x = -2.5 + (i / 13) * 5.0;
      box(w, 0.36, 0.2, 0.22, 0xbfb6a8, x, 0.1, 1.6, true, 0.9);
      box(w, 0.36, 0.2, 0.22, 0xbfb6a8, x, 0.1, -1.6, true, 0.9);
    }
    for (let i = 0; i < 8; i++) {
      box(w, 0.22, 0.2, 0.36, 0xbfb6a8, -2.7, 0.1, -1.4 + i * 0.4, true, 0.9);
      box(w, 0.22, 0.2, 0.36, 0xbfb6a8, 2.7, 0.1, -1.4 + i * 0.4, true, 0.9);
    }
    // Shrubs the planter puts in, in order, and the spot he stands at for each
    const spots = [[-1.9, -0.7, 0.42, C.leaf], [-0.8, -0.8, 0.38, C.leaf2], [0.4, -0.7, 0.44, C.leaf3], [1.6, -0.8, 0.38, C.leaf], [1.2, 0.45, 0.32, C.leaf2], [0.0, 0.5, 0.36, C.leaf], [-1.2, 0.45, 0.32, C.leaf2]];
    const shrubs = spots.map(([x, z, r, c]) => ({ m: ico(w, r, c, x, r * 0.85, z, 1), x, z }));
    const flowers = [];
    const fc = [0xf2b705, 0xe94f7c, 0xffffff, 0xf26b1d, 0xb36ad9];
    for (let i = 0; i < 10; i++) {
      const g = new T3.Group();
      cyl(g, 0.02, 0.02, 0.28, C.leaf3, 0, 0.14, 0, 5);
      ico(g, 0.11, fc[i % fc.length], 0, 0.32, 0, 0);
      g.position.set(-2.2 + (i % 5) * 1.1, 0.1, i < 5 ? 1.2 : -1.25);
      w.add(g);
      flowers.push(g);
    }
    // Wheelbarrow at the right end with a mulch pile that goes down as it is shoveled out
    const wb = new T3.Group();
    box(wb, 0.95, 0.35, 0.7, C.blue, 0, 0.55, 0, true, 0.5);
    const pile = ico(wb, 0.36, C.mulch, 0, 0.72, 0, 1);
    pile.scale.set(1.2, 0.55, 0.9);
    wheel(wb, 0.18, 0.1, 0.6, 0.18, 0, 'z');
    for (const z of [0.24, -0.24]) box(wb, 0.95, 0.05, 0.05, C.dark, -0.6, 0.45, z);
    for (const z of [0.2, -0.2]) box(wb, 0.05, 0.4, 0.05, C.dark, -0.25, 0.2, z);
    wb.position.set(3.3, 0, 1.3);
    wb.rotation.y = Math.PI;
    w.add(wb);
    // Shoveler stands beside the wheelbarrow, facing the bed (-x)
    const shov = person(w, { shirt: C.blue, cap: C.yellow, scale: 0.72 });
    shov.g.position.set(3.0, 0, 0.45);
    shov.g.rotation.y = Math.PI * 0.85;
    const shovel = new T3.Group();
    box(shovel, 0.04, 0.9, 0.04, 0x8a6a48, 0, -0.45, 0);
    box(shovel, 0.04, 0.22, 0.2, C.steel, 0.02, -0.98, 0, true, 0.4);
    shovel.position.set(0, -0.55, 0);
    shov.armR.add(shovel);
    // Planter walks to each shrub spot and bends down
    const plant = person(w, { shirt: 0x2f7d4f, cap: C.blue, scale: 0.72 });
    // Flying mulch
    const BITS = 18;
    const bits = new T3.InstancedMesh(new T3.BoxGeometry(0.08, 0.05, 0.08), M(C.mulch, 1), BITS);
    w.add(bits);
    const bp = Array.from({ length: BITS }, () => ({ t: 1, x: 0, z: 0, tx: 0, tz: 0 }));
    let nextBit = 0, lastScoop = -1;

    const STEP = 1.15, PLANT_END = shrubs.length * STEP, CYCLE = PLANT_END + 3.2;
    let t = 0;
    const startPos = { x: -3.1, z: 0 };
    function update(dt) {
      t = (t + dt) % CYCLE;
      // Planter: walk to spot k (first 0.6s of each step), bend and plant (rest of step)
      const k = Math.max(0, Math.min(shrubs.length - 1, Math.floor(t / STEP)));
      const local = t - k * STEP;
      const from = k === 0 ? startPos : { x: shrubs[k - 1].x - 0.55, z: shrubs[k - 1].z + 0.35 };
      const to = { x: shrubs[k].x - 0.55, z: shrubs[k].z + 0.35 };
      if (t < PLANT_END) {
        const mv = ease(local / 0.6);
        plant.g.position.set(from.x + (to.x - from.x) * mv, 0.12, from.z + (to.z - from.z) * mv);
        turnTo(plant.g, Math.atan2(-(to.z - from.z), to.x - from.x || 0.001), dt);
        if (local < 0.6) { walkPose(plant, t * 12, 1); plant.upper.rotation.z = 0; }
        else { walkPose(plant, 0, 0); plant.upper.rotation.z = -Math.sin(Math.min(1, (local - 0.6) / 0.5) * Math.PI) * 0.9; plant.armL.rotation.z = plant.armR.rotation.z = 0.9; }
      } else {
        // Pause, then walk back to the start so the loop restarts without a jump
        const last = { x: shrubs[shrubs.length - 1].x - 0.55, z: shrubs[shrubs.length - 1].z + 0.35 };
        const back = ease((t - PLANT_END - 0.8) / (CYCLE - PLANT_END - 0.8));
        plant.g.position.set(last.x + (startPos.x - last.x) * back, 0.12, last.z + (startPos.z - last.z) * back);
        plant.upper.rotation.z = 0;
        if (t < PLANT_END + 0.8) { standPose(plant); }
        else {
          turnTo(plant.g, Math.atan2(-(startPos.z - last.z), startPos.x - last.x), dt);
          walkPose(plant, t * 10, back < 0.98 ? 1 : 0);
        }
      }
      shrubs.forEach((s, i) => {
        const popAt = i * STEP + 0.85;
        const sc = t < CYCLE - 1 ? backOut((t - popAt) / 0.5) : 1 - ease((t - (CYCLE - 1)) / 0.8);
        s.m.scale.setScalar(Math.max(0.0001, sc));
      });
      flowers.forEach((f, i) => {
        const at = 0.4 + i * (PLANT_END / flowers.length);
        const sc = t < CYCLE - 1 ? backOut((t - at) / 0.4) : 1 - ease((t - (CYCLE - 1)) / 0.8);
        f.scale.setScalar(Math.max(0.0001, sc));
      });
      // Shoveler: scoop every 1.4s while planting is going on
      const sp = (t % 1.4) / 1.4;
      const working = t < PLANT_END;
      // Ease the shoveling in at the start and out at the end instead of snapping
      const amp = working ? ease(t / 0.5) : 1 - ease((t - PLANT_END) / 0.6);
      shov.upper.rotation.z = -Math.sin(sp * Math.PI) * 0.6 * amp;
      shov.armR.rotation.z = shov.armL.rotation.z = (0.4 + Math.sin(sp * Math.PI * 2) * 0.6) * amp;
      const scoop = Math.floor(t / 1.4);
      if (working && scoop !== lastScoop && sp > 0.45) {
        lastScoop = scoop;
        for (let n = 0; n < 3; n++) {
          const q = bp[nextBit]; nextBit = (nextBit + 1) % BITS;
          Object.assign(q, { t: 0, x: 2.75, z: 0.6, tx: 1.2 + Math.random() * 1.2 - n * 0.4, tz: -0.8 + Math.random() * 1.6 });
        }
      }
      for (let i = 0; i < BITS; i++) {
        const q = bp[i];
        if (q.t < 1) q.t = Math.min(1, q.t + dt * 1.8);
        const live = q.t < 1;
        tmp.position.set(q.x + (q.tx - q.x) * q.t, 0.9 + Math.sin(q.t * Math.PI) * 0.7 - q.t * 0.7, q.z + (q.tz - q.z) * q.t);
        tmp.rotation.set(q.t * 5, q.t * 3, 0);
        tmp.scale.setScalar(live ? 1 : 0.0001);
        tmp.updateMatrix();
        bits.setMatrixAt(i, tmp.matrix);
      }
      bits.instanceMatrix.needsUpdate = true;
      // Mulch pile goes down while working, then refills while the planter walks back
      const progress = t < PLANT_END ? t / PLANT_END : 1 - ease((t - PLANT_END - 0.8) / (CYCLE - PLANT_END - 0.8));
      pile.scale.set(1.2 * (1 - progress * 0.7), Math.max(0.05, 0.55 * (1 - progress * 0.8)), 0.9 * (1 - progress * 0.7));
      bed.material.color.copy(bare).lerp(fresh, progress);
    }
    function still() {
      shrubs.forEach(s => s.m.scale.setScalar(1)); flowers.forEach(f => f.scale.setScalar(1));
      plant.g.position.set(-2.4, 0.12, 0.8); bed.material.color.copy(fresh);
    }
    bed.material = bed.material.clone();
    return { update, still, skipFit: [bits] };
  }

  // 02 Concrete: the mixer's chute pours onto the slab, one worker rakes, one drags the screed board.
  function concrete(w) {
    const L = 4.6, Wd = 2.6;
    box(w, L + 0.4, 0.08, Wd + 0.4, C.gravel, 0, 0.04, 0, false, 1);
    box(w, L + 0.2, 0.34, 0.08, C.wood, 0, 0.2, Wd / 2 + 0.04);
    box(w, L + 0.2, 0.34, 0.08, C.wood, 0, 0.2, -Wd / 2 - 0.04);
    box(w, 0.08, 0.34, Wd, C.wood, L / 2 + 0.06, 0.2, 0);
    box(w, 0.08, 0.34, Wd, C.wood, -L / 2 - 0.06, 0.2, 0);
    for (const z of [Wd / 2 + 0.2, -Wd / 2 - 0.2]) for (let x = -L / 2; x <= L / 2 + 0.01; x += L / 3) box(w, 0.06, 0.45, 0.06, C.wood, x, 0.2, z);
    const slabGeo = new T3.BoxGeometry(1, 0.24, Wd - 0.02);
    slabGeo.translate(0.5, 0, 0);
    const slabMat = new T3.MeshStandardMaterial({ color: C.wet, roughness: 0.3, metalness: 0 });
    const slab = place(w, new T3.Mesh(slabGeo, slabMat), -L / 2, 0.2, 0, false);
    const SLAB_TOP = 0.32;

    // Mixer truck behind the forms (front toward +x), rear end at the slab's left corner
    const tr = new T3.Group();
    box(tr, 4.0, 0.5, 1.7, C.dark, 0, 0.75, 0);
    box(tr, 1.3, 1.2, 1.7, C.blue, 1.4, 1.55, 0, true, 0.45);
    box(tr, 0.06, 0.5, 1.4, C.glass, 2.06, 1.75, 0, false, 0.2);
    const drumG = new T3.Group();
    const drumGeo = new T3.CylinderGeometry(0.62, 0.9, 2.3, 20);
    drumGeo.rotateZ(Math.PI / 2);
    const drum = new T3.Mesh(drumGeo, M(C.white, 0.5));
    drum.castShadow = true;
    drumG.add(drum);
    const stripe = new T3.Mesh(new T3.BoxGeometry(2.0, 0.12, 1.86), M(C.blue, 0.5));
    stripe.rotation.x = 0.5;
    drumG.add(stripe);
    drumG.position.set(-0.6, 1.7, 0);
    drumG.rotation.z = 0.18;
    tr.add(drumG);
    for (const x of [-1.4, -0.6, 1.4]) for (const z of [0.82, -0.82]) wheel(tr, 0.42, 0.3, x, 0.42, z, 'z');
    tr.position.set(-L / 2 + 1.6, 0, -Wd / 2 - 1.6);
    w.add(tr);

    // Chute: from the back of the drum down to a point right above the slab
    const top = new T3.Vector3(-L / 2 - 0.25, 1.45, -Wd / 2 - 1.1);
    const mouth = new T3.Vector3(-L / 2 + 0.45, 0.95, -Wd / 2 + 0.55);
    const len = top.distanceTo(mouth);
    const chute = place(w, new T3.Mesh(new T3.BoxGeometry(0.32, 0.08, len), M(0x9aa3ad, 0.5)), (top.x + mouth.x) / 2, (top.y + mouth.y) / 2, (top.z + mouth.z) / 2);
    chute.lookAt(mouth);
    for (const s of [1, -1]) {
      const side = place(w, new T3.Mesh(new T3.BoxGeometry(0.04, 0.14, len), M(0x8a939d, 0.5)), (top.x + mouth.x) / 2, (top.y + mouth.y) / 2 + 0.05, (top.z + mouth.z) / 2);
      side.lookAt(mouth.clone().setY(mouth.y + 0.05));
      side.translateX(0.16 * s);
    }
    // Wet puddle where the stream lands
    const landing = new T3.Vector3(mouth.x + 0.15, SLAB_TOP, mouth.z + 0.1);
    const puddle = ico(w, 0.35, C.wet, landing.x, landing.y, landing.z, 1);
    puddle.material = slabMat;
    // Stream of concrete: drops travel from the chute mouth straight down onto the slab
    const DROPS = 30;
    const drops = new T3.InstancedMesh(new T3.SphereGeometry(0.09, 7, 7), slabMat, DROPS);
    w.add(drops);
    const dp = Array.from({ length: DROPS }, (_, i) => i / DROPS);

    // Screed board dragged by a worker on the near side
    const screed = box(w, 0.12, 0.08, Wd + 0.6, 0xd9b26b, -L / 2, SLAB_TOP + 0.05, 0, true, 0.7);
    const screeder = person(w, { vest: true, shirt: C.blue, scale: 0.62 });
    screeder.g.rotation.y = Math.PI / 2;
    // Raker on the far left, working the pour
    const raker = person(w, { vest: true, shirt: 0x2f3a4a, cap: C.blue, scale: 0.62 });
    raker.g.position.set(-L / 2 - 0.75, 0.04, 0.1);
    const rake = new T3.Group();
    box(rake, 0.04, 1.0, 0.04, 0x8a6a48, 0, -0.5, 0);
    box(rake, 0.06, 0.06, 0.4, C.steel, 0, -1.0, 0, true, 0.4);
    rake.position.set(0, -0.5, 0);
    rake.rotation.z = 1.0;
    raker.armR.add(rake);
    // Cones
    for (const [x, z] of [[L / 2 + 0.9, Wd / 2 + 0.6], [L / 2 + 0.9, -Wd / 2 - 0.2]]) {
      cone(w, 0.2, 0.55, C.orange, x, 0.3, z, 12);
      box(w, 0.42, 0.05, 0.42, C.orange, x, 0.025, z);
    }

    const wetC = new T3.Color(C.wet), curedC = new T3.Color(C.cured);
    let t = 0;
    const POUR = 7, CYCLE = 11;
    function update(dt) {
      t = (t + dt) % CYCLE;
      const fill = ease(t / POUR);
      slab.scale.x = Math.max(0.0001, fill * (L - 0.02));
      const edge = -L / 2 + fill * L;
      screed.position.x = -L / 2 + Math.max(0.05, fill * L - 0.45);
      screeder.g.position.set(screed.position.x, 0.04, Wd / 2 + 0.75);
      const moving = t < POUR && fill < 0.99;
      walkPose(screeder, t * 9, moving ? 0.7 : 0);
      screeder.upper.rotation.z = -0.35;
      screeder.armL.rotation.z = screeder.armR.rotation.z = 0.8 + Math.sin(t * 9) * 0.15;
      screed.position.y = SLAB_TOP + 0.05 + Math.sin(t * 9) * 0.015;
      raker.upper.rotation.z = -0.3 - Math.max(0, Math.sin(t * 4)) * 0.25;
      raker.armR.rotation.z = raker.armL.rotation.z = 0.6 + Math.sin(t * 4) * 0.35;
      slabMat.color.copy(wetC).lerp(curedC, ease((t - POUR - 0.5) / 2.2));
      drumG.rotation.x += dt * 2.2;
      const pouring = t < POUR;
      puddle.scale.set(pouring ? 1 : Math.max(0.0001, 1 - ease((t - POUR) / 0.6)), 0.25, pouring ? 1 : Math.max(0.0001, 1 - ease((t - POUR) / 0.6)));
      for (let i = 0; i < DROPS; i++) {
        dp[i] = (dp[i] + dt * 2.2) % 1;
        const q = dp[i];
        tmp.position.set(mouth.x + 0.05 + q * 0.12, mouth.y - q * (mouth.y - SLAB_TOP), mouth.z + q * 0.1);
        tmp.rotation.set(0, 0, 0);
        tmp.scale.setScalar(pouring ? 1 - q * 0.25 : 0.0001);
        tmp.updateMatrix();
        drops.setMatrixAt(i, tmp.matrix);
      }
      drops.instanceMatrix.needsUpdate = true;
      void edge;
    }
    function still() {
      slab.scale.x = 0.65 * L; screed.position.x = -L / 2 + 0.65 * L - 0.45;
      screeder.g.position.set(screed.position.x, 0.04, Wd / 2 + 0.75);
    }
    return { update, still, skipFit: [drops] };
  }

  // 03 Repairs: a worker swaps a rotten siding board on the front wall; another paints from the ladder.
  function repairs(w) {
    const L = 4.2, Dp = 2.6, Hh = 2.4, FZ = Dp / 2;
    box(w, L, Hh, Dp, C.siding, 0, Hh / 2, 0, true, 0.85);
    const lines = [];
    for (let y = 0.3; y < Hh - 0.05; y += 0.3) lines.push(y);
    lines.forEach(y => box(w, L + 0.02, 0.025, 0.02, 0xc9d0d8, 0, y, FZ + 0.01, false));
    box(w, 0.9, 1.0, 0.06, C.glass, -1.15, 1.45, FZ + 0.03, false, 0.2);
    box(w, 1.0, 0.08, 0.1, C.white, -1.15, 0.92, FZ + 0.06);
    box(w, 0.8, 1.7, 0.06, C.navy, 1.25, 0.85, FZ + 0.03, false, 0.5);
    const roofA = box(w, L + 0.5, 0.14, 2.1, C.roof, 0, Hh + 0.55, 0.75, true, 0.9);
    roofA.rotation.x = 0.55;
    const roofB = box(w, L + 0.5, 0.14, 2.1, C.roof, 0, Hh + 0.55, -0.75, true, 0.9);
    roofB.rotation.x = -0.55;
    box(w, L + 0.5, 0.22, 0.08, C.white, 0, Hh - 0.02, FZ + 0.55);

    // The board being replaced: one siding course on the front wall, between the window and door
    const BX = 0.1, BY = 0.75, BW = 1.3;
    const oldBoard = box(w, BW, 0.28, 0.06, C.rot, BX, BY, FZ + 0.04, true, 0.9);
    const newBoard = box(w, BW, 0.28, 0.06, 0xffffff, BX, BY, FZ + 0.04, true, 0.6);
    const pileBoard = box(w, BW, 0.06, 0.28, C.rot, BX + 1.0, 0.04, FZ + 1.4, true, 0.9);
    pileBoard.rotation.y = 0.3;
    // Carpenter standing in front of the wall, facing it (-z)
    const carp = person(w, { vest: true, shirt: C.blue, scale: 0.72 });
    carp.g.position.set(BX + 0.1, 0.02, FZ + 0.95);
    carp.g.rotation.y = Math.PI / 2;
    const hammer = new T3.Group();
    box(hammer, 0.04, 0.4, 0.04, 0x8a6a48, 0, -0.2, 0);
    box(hammer, 0.16, 0.08, 0.08, C.steel, 0.02, -0.42, 0, true, 0.4);
    hammer.position.set(0, -0.55, 0);
    carp.armR.add(hammer);
    // Ladder and painter on the right side of the front wall
    const ladder = new T3.Group();
    for (const x of [-0.25, 0.25]) box(ladder, 0.06, 2.6, 0.06, C.yellow, x, 1.3, 0, true, 0.5);
    for (let y = 0.3; y < 2.5; y += 0.32) box(ladder, 0.5, 0.04, 0.04, C.yellow, 0, y, 0, true, 0.5);
    ladder.position.set(-1.55, 0, FZ + 0.55);
    ladder.rotation.x = -0.22;
    w.add(ladder);
    const painter = person(w, { shirt: 0xffffff, pants: 0x5b6b80, cap: C.blue, scale: 0.62 });
    painter.g.position.set(-1.55, 0.98, FZ + 0.62);
    painter.g.rotation.y = Math.PI / 2;
    const roller = new T3.Group();
    box(roller, 0.03, 0.5, 0.03, C.dark, 0, -0.25, 0);
    cyl(roller, 0.06, 0.06, 0.3, 0xffffff, 0, -0.52, 0, 10).rotation.x = Math.PI / 2;
    roller.position.set(0, -0.5, 0);
    painter.armR.add(roller);
    // Fresh paint stripe that grows across the upper wall
    const paintGeo = new T3.BoxGeometry(1, 0.6, 0.02);
    paintGeo.translate(0.5, 0, 0);
    const paint = place(w, new T3.Mesh(paintGeo, M(0xd8e6f7, 0.6)), -2.05, 1.95, FZ + 0.02, false);
    // Toolbox and paint can
    box(w, 0.7, 0.35, 0.35, C.red, 1.0, 0.18, FZ + 0.9, true, 0.5);
    box(w, 0.4, 0.06, 0.06, C.dark, 1.0, 0.42, FZ + 0.9);
    cyl(w, 0.18, 0.18, 0.3, C.blue, -0.9, 0.15, FZ + 0.85, 16, 0.5);

    let t = 0;
    const CYCLE = 9;
    function update(dt) {
      t = (t + dt) % CYCLE;
      // 0 to 1.2: pull the old board off and drop it; 1.4 to 2.6: set the new board; 2.6 to 5: hammer; 7.8 to 9: reset
      const pull = ease(t / 0.7), drop = ease((t - 0.7) / 0.5);
      oldBoard.visible = t < 1.25 || t > 8.4;
      oldBoard.position.set(BX, BY - drop * (BY - 0.05), FZ + 0.04 + pull * 0.45);
      oldBoard.rotation.x = drop * 1.3;
      pileBoard.visible = t > 1.15 && t < 8.4;
      const set = ease((t - 1.4) / 1.2);
      newBoard.visible = t > 1.4 && t < 8.4;
      newBoard.position.set(BX, BY, FZ + 0.04 + (1 - set) * 0.5);
      if (t > 8.4) { oldBoard.position.set(BX, BY, FZ + 0.04); oldBoard.rotation.x = 0; }
      const hammering = t > 2.6 && t < 5;
      carp.armR.rotation.z = hammering ? 1.6 + Math.sin(t * 14) * 0.5 : (t < 2.6 ? 1.3 : 0.2);
      carp.armL.rotation.z = t < 2.6 ? 1.2 : 0.2;
      carp.upper.rotation.z = t < 1.2 ? -0.15 : 0;
      // Painter rolls up and down while the stripe grows, then it resets with the cycle
      painter.armR.rotation.z = 1.9 + Math.sin(t * 4) * 0.35;
      painter.armL.rotation.z = 0.3;
      paint.scale.x = Math.max(0.0001, Math.min(1.6, ease(t / 7.5) * 1.6));
      paint.visible = t < 8.4;
    }
    function still() { oldBoard.visible = false; newBoard.visible = true; pileBoard.visible = true; paint.scale.x = 1.2; carp.armR.rotation.z = 1.6; }
    return { update, still };
  }

  // 04 Snow: snow falls, then a plow clears the driveway into a pile.
  function snow(w) {
    const COLS = 7, ROWS = 14, T = 0.48, W = COLS * T, D = ROWS * T;
    box(w, W + 0.3, 0.1, D + 0.3, C.concrete, 0, 0.05, 0, false, 0.95);
    box(w, 2.4, 0.14, D + 1.2, 0xeef3f8, -W / 2 - 1.4, 0.07, 0, false, 1);
    box(w, 2.4, 0.14, D + 1.2, 0xeef3f8, W / 2 + 1.4, 0.07, 0, false, 1);
    for (const [x, z, s] of [[-W / 2 - 1.5, -D / 2 + 0.6, 1.1], [W / 2 + 1.6, -D / 2 + 1.5, 0.9], [-W / 2 - 1.7, D / 2 - 1.2, 0.8]]) {
      cyl(w, 0.1 * s, 0.14 * s, 0.5 * s, 0x7a5a3c, x, 0.25 * s, z, 8);
      cone(w, 0.75 * s, 1.3 * s, C.leaf3, x, 1.05 * s, z, 8);
      cone(w, 0.55 * s, 1.0 * s, C.leaf3, x, 1.6 * s, z, 8);
      cone(w, 0.3 * s, 0.4 * s, C.snow, x, 2.05 * s, z, 8);
    }
    const N = COLS * ROWS;
    const tile = new T3.BoxGeometry(T * 1.001, 1, T * 1.001);
    tile.translate(0, 0.5, 0);
    const cover = new T3.InstancedMesh(tile, M(C.snow, 1), N);
    cover.receiveShadow = true;
    w.add(cover);
    const FULL = 0.22;
    const h = new Float32Array(N).fill(FULL), target = new Float32Array(N).fill(FULL);
    const tz = r => -D / 2 + T / 2 + r * T;
    function setTile(i) {
      const c = i % COLS, r = (i / COLS) | 0;
      tmp.rotation.set(0, 0, 0);
      tmp.position.set(-W / 2 + T / 2 + c * T, 0.1, tz(r)); tmp.scale.set(1, Math.max(0.0001, h[i]), 1); tmp.updateMatrix();
      cover.setMatrixAt(i, tmp.matrix);
    }
    for (let i = 0; i < N; i++) setTile(i);
    const pile = ico(w, 1.0, C.snow, 0, 0.1, -D / 2 - 0.6, 1);
    pile.scale.set(0.0001, 0.0001, 0.0001);
    const truck = pickup(w, 0, D / 2 + 2.8, C.blue);
    const blade = box(truck, 2.5, 0.6, 0.12, C.yellow, 0, 0.45, -2.75, true, 0.5);
    blade.rotation.x = -0.15;
    box(truck, 0.2, 0.2, 0.4, C.dark, 0, 0.5, -2.5);
    box(truck, 0.5, 0.1, 0.2, C.orange, 0, 1.95, -0.75, false, 0.4);
    // Falling snowflakes
    const F = 90;
    const flakes = new T3.InstancedMesh(new T3.SphereGeometry(0.05, 6, 6), new T3.MeshBasicMaterial({ color: 0xffffff }), F);
    w.add(flakes);
    const fl = Array.from({ length: F }, () => ({ x: (Math.random() - 0.5) * 9, y: Math.random() * 6, z: (Math.random() - 0.5) * 9, s: 0.6 + Math.random() * 0.8 }));
    let t = 0;
    const CYCLE = 12, startZ = D / 2 + 2.8, endZ = -D / 2 + 2.6;
    function update(dt) {
      t = (t + dt) % CYCLE;
      let z;
      if (t < 1) z = startZ;
      else if (t < 5) z = startZ + (endZ - startZ) * ease((t - 1) / 4);
      else if (t < 6) z = endZ;
      else if (t < 9) z = endZ + (startZ - endZ) * ease((t - 6) / 3);
      else z = startZ;
      truck.position.z = z;
      const bladeZ = z - 2.85;
      for (let i = 0; i < N; i++) {
        const r = (i / COLS) | 0;
        if (t >= 1 && t < 6 && tz(r) > bladeZ) target[i] = 0;
        if (t >= 9) target[i] = FULL;
        const rate = target[i] > h[i] ? 0.9 : 14;
        const nh = h[i] + (target[i] - h[i]) * Math.min(1, dt * rate);
        if (Math.abs(nh - h[i]) > 0.0005) { h[i] = nh; setTile(i); }
      }
      cover.instanceMatrix.needsUpdate = true;
      const ps = t < 1 ? 0.0001 : t < 6 ? ease((t - 1) / 4) : t < 9 ? 1 : 1 - ease((t - 9) / 2.5);
      pile.scale.set(Math.max(0.0001, ps * 1.3), Math.max(0.0001, ps * 0.7), Math.max(0.0001, ps));
      for (let i = 0; i < F; i++) {
        const q = fl[i];
        q.y -= dt * 0.9 * q.s;
        q.x += Math.sin(t * 1.3 + i) * dt * 0.15;
        if (q.y < 0.1) { q.y = 6; q.x = (Math.random() - 0.5) * 9; q.z = (Math.random() - 0.5) * 9; }
        tmp.position.set(q.x, q.y, q.z); tmp.rotation.set(0, 0, 0); tmp.scale.setScalar(q.s); tmp.updateMatrix();
        flakes.setMatrixAt(i, tmp.matrix);
      }
      flakes.instanceMatrix.needsUpdate = true;
    }
    function still() {
      truck.position.z = (startZ + endZ) / 2;
      for (let i = 0; i < N; i++) { const r = (i / COLS) | 0; if (tz(r) > truck.position.z - 2.85) { h[i] = 0; setTile(i); } }
      cover.instanceMatrix.needsUpdate = true;
      pile.scale.set(0.7, 0.4, 0.55);
      for (let i = 0; i < F; i++) { const q = fl[i]; tmp.position.set(q.x, q.y, q.z); tmp.scale.setScalar(q.s); tmp.updateMatrix(); flakes.setMatrixAt(i, tmp.matrix); }
      flakes.instanceMatrix.needsUpdate = true;
    }
    return { update, still, skipFit: [flakes] };
  }

  const BUILDERS = { yard, garden, concrete, repairs, snow };

  // ======================= Mounting, fitting, shared loop =======================
  const live = [];
  let tiltTarget = 0;
  window.addEventListener('pointermove', e => { if (e.pointerType !== 'mouse') return; tiltTarget = ((e.clientX / window.innerWidth) - 0.5) * 0.22; }, { passive: true });

  function mount(host) {
    const build = BUILDERS[host.dataset.scene];
    if (!build) return;
    let renderer;
    try { renderer = new T3.WebGLRenderer({ antialias: true, alpha: true }); }
    catch (e) { host.classList.add('no-webgl'); return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = T3.PCFSoftShadowMap;
    host.appendChild(renderer.domElement);

    const scene = new T3.Scene();
    const camera = new T3.OrthographicCamera(-1, 1, 1, -1, 0.1, 300);
    camera.position.set(30, 25, 30);
    camera.lookAt(0, 0, 0);
    scene.add(new T3.HemisphereLight(0xffffff, 0xa8b8cc, 0.85));
    const sun = new T3.DirectionalLight(0xffffff, 0.85);
    sun.position.set(-10, 22, 12);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -20, right: 20, top: 20, bottom: -20, near: 1, far: 80 });
    sun.shadow.bias = -0.0006;
    scene.add(sun);
    const ground = new T3.Mesh(new T3.PlaneGeometry(200, 200), new T3.ShadowMaterial({ opacity: 0.22 }));
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);
    const world = new T3.Group();
    scene.add(world);
    const api = build(world);
    api.update(0.0001); // put workers and vehicles at their starting spots before measuring
    const skip = new Set(api.skipFit || []);

    // Measure the scene from the camera's angle once (vertices of every plain mesh).
    camera.updateMatrixWorld(true);
    world.updateMatrixWorld(true);
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    const v = new T3.Vector3();
    world.traverse(o => {
      if (!o.isMesh || o.isInstancedMesh || skip.has(o)) return;
      const pos = o.geometry.attributes.position;
      for (let k = 0; k < pos.count; k++) {
        v.fromBufferAttribute(pos, k).applyMatrix4(o.matrixWorld).applyMatrix4(camera.matrixWorldInverse);
        minX = Math.min(minX, v.x); maxX = Math.max(maxX, v.x); minY = Math.min(minY, v.y); maxY = Math.max(maxY, v.y);
      }
    });

    function fit() {
      const w = host.clientWidth, h = host.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      const aspect = w / h;
      const sw = maxX - minX, sh = maxY - minY;
      let x0 = 0.04, x1 = 0.96, y0 = 0.06, y1 = 0.94;
      if (api.hero) {
        if (w > 900) { x0 = 0.42; x1 = 1.03; y0 = 0.04; y1 = 0.96; }  // big scene on the right, running off the edge
        else { x0 = 0.03; x1 = 0.97; y0 = 0.03; y1 = 0.97; }  // phones: whole yard, centered
      }
      let fw = sw / (x1 - x0), fh = fw / aspect;
      if (sh / (y1 - y0) > fh) { fh = sh / (y1 - y0); fw = fh * aspect; }
      // The wide hero hugs the right edge; everything else is centered in its box
      const left = api.hero && w > 900 ? minX - x0 * fw : (minX + maxX) / 2 - fw / 2 + (0.5 - (x0 + x1) / 2) * fw;
      const cy = (minY + maxY) / 2 + (0.5 - (y0 + y1) / 2) * fh;
      Object.assign(camera, { left, right: left + fw, top: cy + fh / 2, bottom: cy - fh / 2 });
      camera.updateProjectionMatrix();
      renderer.render(scene, camera);
    }
    if (window.ResizeObserver) new ResizeObserver(fit).observe(host);
    else window.addEventListener('resize', fit);
    fit();

    const entry = { host, renderer, scene, camera, world, api, visible: true, tilt: 0 };
    if (reduce) { api.still && api.still(); renderer.render(scene, camera); return; }
    if (window.IntersectionObserver) new IntersectionObserver(es => { entry.visible = es[0].isIntersecting; }, { rootMargin: '100px' }).observe(host);
    live.push(entry);
  }

  document.querySelectorAll('[data-scene]').forEach(host => {
    try { mount(host); } catch (err) { console.error('Scene failed to start:', host.dataset.scene, err); }
  });
  if (reduce || !live.length) return;
  let last = performance.now();
  function frame(now) {
    // RAF timestamps can be slightly earlier than performance.now(), so never let time run backward
    const dt = Math.max(0, Math.min(0.05, (now - last) / 1000));
    last = now;
    if (!document.hidden) {
      for (const e of live) {
        if (!e.visible || e.failed) continue;
        // One broken scene must not freeze the others
        try {
          e.api.update(dt);
          e.tilt += (tiltTarget * (e.api.hero ? 0.6 : 1) - e.tilt) * Math.min(1, dt * 3);
          e.world.rotation.y = e.tilt;
          e.renderer.render(e.scene, e.camera);
        } catch (err) {
          e.failed = true;
          console.error('Scene stopped:', e.host.dataset.scene, err);
        }
      }
    }
    window.__sceneFrames = (window.__sceneFrames || 0) + 1;
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
