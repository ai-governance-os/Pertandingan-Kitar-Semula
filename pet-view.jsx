// 宠物园 · Eco Pets — every student's mythic beast, either as a living 3D park
// or a plain card grid.
//
// Growth and hunger are derived from the star ledger (see data.js petState),
// so this screen is read-only for everyone; teachers only get species/nickname
// tools, never a way to hand out growth directly.
//
// The 3D park loads Three.js ON DEMAND (never on app start) and falls back to
// the card grid when WebGL is unavailable — this school runs entry-level
// phones that already hit Chrome's low-memory warning once, so the other
// screens must not pay for the 3D engine.
//
// Art direction: 晨曦林间 / Dawn Grove, picked from the design canvas. The
// light intensities, palette and camera numbers below come from its spec sheet.

const THREE_CDN = "https://unpkg.com/three@0.128.0/build/three.min.js";

function loadThree() {
  if (window.THREE) return Promise.resolve(window.THREE);
  if (!window.__ecoThreePromise) {
    window.__ecoThreePromise = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = THREE_CDN;
      s.async = true;
      s.onload = () => resolve(window.THREE);
      s.onerror = () => {
        window.__ecoThreePromise = null;
        reject(new Error("3D 引擎载入失败，请检查网络 · Could not load the 3D engine"));
      };
      document.head.appendChild(s);
    });
  }
  return window.__ecoThreePromise;
}

function webglSupported() {
  try {
    const c = document.createElement("canvas");
    return !!(window.WebGLRenderingContext && (c.getContext("webgl") || c.getContext("experimental-webgl")));
  } catch (e) {
    return false;
  }
}

// ─────────────────────── Dawn Grove palette ───────────────────────
const SKY_TOP = 0xBBD9E8, SKY_MID = 0xE4E0EC, SKY_LOW = 0xFBE4CE;
const GRASS = 0x74B054, GRASS_RIM = 0x4C8A38, PATH_SAND = 0xD9B978;
const WATER = 0x4FB2D6, WATER_RIM = 0xC6DBA6;
const BARK = 0x7A4B24, LEAF_A = 0x3F9138, LEAF_B = 0x54AC48;

// Every beast shares one base creature — big head, big eyes, stubby legs —
// wearing a different set of mythic features. That keeps 19 of them on screen
// affordable while still making each one recognisable at a glance.
const PET_LOOKS = {
  qilin:     { body: 0xE8AE4E, belly: 0xFFE0A8, accent: 0xA9631F, aura: 0xFFC45C, horns: "antler", mane: "flame", tail: "flame", wings: false, extra: "none" },
  phoenix:   { body: 0xF07A48, belly: 0xFFC9A4, accent: 0xC8402E, aura: 0xFF7A6A, horns: "none",   mane: "crest", tail: "plume", wings: true,  extra: "beak" },
  ninetail:  { body: 0xC9AEF0, belly: 0xEADCFB, accent: 0x9668D4, aura: 0xBE8CFF, horns: "ears",   mane: "none",  tail: "multi", wings: false, extra: "none" },
  yinglong:  { body: 0x5BC0DC, belly: 0xBEEBFA, accent: 0x2A87AE, aura: 0x5AC8FF, horns: "horn",   mane: "none",  tail: "spike", wings: true,  extra: "none" },
  baize:     { body: 0xDCE6F2, belly: 0xF7FAFF, accent: 0xA9C2DE, aura: 0xE8F0FF, horns: "single", mane: "none",  tail: "tuft",  wings: false, extra: "thirdeye" },
  lingui:    { body: 0x6CCB9C, belly: 0xBCEDD6, accent: 0x2E7357, aura: 0x5ADCAA, horns: "none",   mane: "none",  tail: "tuft",  wings: false, extra: "shell" },
  stardeer:  { body: 0x9DB2EC, belly: 0xD2DDF8, accent: 0x6C86C8, aura: 0x8CAAFF, horns: "antler", mane: "none",  tail: "tuft",  wings: false, extra: "stars" },
  cloudpard: { body: 0xF0D081, belly: 0xFFEDC0, accent: 0xC79C45, aura: 0xFFE196, horns: "ears",   mane: "none",  tail: "cloud", wings: false, extra: "spots" },
  seakirin:  { body: 0x72CFE2, belly: 0xC4EDF6, accent: 0x2A88A4, aura: 0x50BEDC, horns: "fin",    mane: "none",  tail: "fin",   wings: false, extra: "none" },
  pixiu:     { body: 0xE4B26A, belly: 0xFBDCAE, accent: 0x9A5C24, aura: 0xFFB45A, horns: "single", mane: "flame", tail: "tuft",  wings: true,  extra: "none" },
  thunder:   { body: 0xF2DC81, belly: 0xFFF3C0, accent: 0xD09A1E, aura: 0xFFE66E, horns: "none",   mane: "crest", tail: "plume", wings: true,  extra: "beak" },
  bamboo:    { body: 0x8ECC66, belly: 0xC5E9A6, accent: 0x477F2E, aura: 0x96DC78, horns: "leaf",   mane: "none",  tail: "tuft",  wings: false, extra: "leaves" },
  // the four 四象 plus three more, so all 19 children get a different beast
  zhuque:     { body: 0xE0453C, belly: 0xFFB9A0, accent: 0xFFC93C, aura: 0xFF5A48, horns: "none",  mane: "crest", tail: "fan",     wings: true,  extra: "halo" },
  xuanwu:     { body: 0x4A6B84, belly: 0x9FBED4, accent: 0x2C4358, aura: 0x6FA8CC, horns: "horn",  mane: "none",  tail: "coil",    wings: false, extra: "shell" },
  baihu:      { body: 0xF0F3F8, belly: 0xFFFFFF, accent: 0x3A3F4A, aura: 0xDCE9FF, horns: "ears",  mane: "none",  tail: "banded",  wings: false, extra: "stripes" },
  qinglong:   { body: 0x3FBF9A, belly: 0xBFF0DF, accent: 0x1E7A66, aura: 0x46E0B4, horns: "antler", mane: "none", tail: "serpent", wings: false, extra: "serpentine" },
  griffin:    { body: 0xD9A64E, belly: 0xF7E3B6, accent: 0xF2EFE6, aura: 0xFFD98A, horns: "none",  mane: "flame", tail: "tuft",    wings: true,  extra: "beak" },
  snowferret: { body: 0xEDF4FF, belly: 0xFFFFFF, accent: 0x9CC8E8, aura: 0xBFE6FF, horns: "ears",  mane: "none",  tail: "sweep",   wings: false, extra: "frost" },
  firemouse:  { body: 0xE8663A, belly: 0xFFC49A, accent: 0xB2321A, aura: 0xFF8A3D, horns: "round", mane: "none",  tail: "flame",   wings: false, extra: "embers" },
};

// ─────────────────────────── 3D park ───────────────────────────

function PetPark3D({ report, onPick }) {
  const { useEffect, useRef, useState, useMemo } = React;
  const hostRef = useRef(null);
  const canvasRef = useRef(null);
  const tagsRef = useRef(null);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [errMsg, setErrMsg] = useState("");

  // Rebuild the scene only when the beasts themselves change, not on every
  // unrelated state write (a weigh-in shouldn't restart the park).
  const signature = useMemo(
    () => report.map(r => `${r.id}:${r.pet.species.id}:${r.pet.displayStageIndex}:${r.pet.hunger.key}:${r.pet.nickname}`).join("|"),
    [report]
  );

  useEffect(() => {
    let alive = true;
    let raf = 0;
    let cleanupFns = [];

    loadThree().then(THREE => {
      if (!alive || !canvasRef.current) return;
      setStatus("ready");

      const canvas = canvasRef.current;
      const host = hostRef.current;
      const tagLayer = tagsRef.current;
      tagLayer.innerHTML = "";

      const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      // NOTE: no outputEncoding here. In three r128 the material colours are
      // authored in sRGB but treated as linear, so encoding the output again
      // lifts every midtone and the whole park reads washed out.

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 300);

      // Track every geometry/material so unmount can free GPU memory.
      const disposables = [];
      const keep = (x) => { disposables.push(x); return x; };
      const mat = (color, opts) => keep(new THREE.MeshStandardMaterial(
        Object.assign({ color: color, roughness: 0.85, metalness: 0 }, opts || {})));
      const hex = (n) => "#" + n.toString(16).padStart(6, "0");

      // ── sky dome: dawn gradient, warm at the horizon ──
      const skyCanvas = document.createElement("canvas");
      skyCanvas.width = 8; skyCanvas.height = 256;
      const sctx = skyCanvas.getContext("2d");
      const grad = sctx.createLinearGradient(0, 0, 0, 256);
      grad.addColorStop(0, hex(SKY_TOP));
      grad.addColorStop(0.5, hex(SKY_MID));
      grad.addColorStop(1, hex(SKY_LOW));
      sctx.fillStyle = grad;
      sctx.fillRect(0, 0, 8, 256);
      const skyTex = keep(new THREE.CanvasTexture(skyCanvas));
      const sky = new THREE.Mesh(
        keep(new THREE.SphereGeometry(150, 24, 16)),
        keep(new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide, fog: false }))
      );
      scene.add(sky);
      scene.fog = new THREE.Fog(SKY_LOW, 85, 150);

      // ── light: total intensity stays near 1.3 so colours never wash out.
      // The first version summed to ~1.85 and turned the whole park pastel. ──
      scene.add(new THREE.HemisphereLight(0xEAF3FF, 0x6FA85A, 0.34));
      const sun = new THREE.DirectionalLight(0xFFF2D0, 0.72);
      sun.position.set(24, 18, 14);              // low angle = long dawn shadows
      sun.castShadow = true;
      sun.shadow.mapSize.set(1024, 1024);
      Object.assign(sun.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30 });
      sun.shadow.bias = -0.0006;
      scene.add(sun);
      const rimLight = new THREE.DirectionalLight(0xCFE6FF, 0.24);
      rimLight.position.set(-20, 12, -18);       // cool backlight separates beasts
      scene.add(rimLight);

      // ── ground, path, pond ──
      const R = 20;
      const ground = new THREE.Mesh(keep(new THREE.CircleGeometry(R + 7, 64)), mat(GRASS));
      ground.rotation.x = -Math.PI / 2;
      ground.receiveShadow = true;
      scene.add(ground);

      const rimRing = new THREE.Mesh(keep(new THREE.RingGeometry(R + 6.2, R + 7, 64)), mat(GRASS_RIM));
      rimRing.rotation.x = -Math.PI / 2;
      rimRing.position.y = 0.01;
      scene.add(rimRing);

      const path = new THREE.Mesh(keep(new THREE.RingGeometry(10.5, 13, 64)), mat(PATH_SAND));
      path.rotation.x = -Math.PI / 2;
      path.position.y = 0.02;
      path.receiveShadow = true;
      scene.add(path);

      const pond = new THREE.Group();
      const water = new THREE.Mesh(keep(new THREE.CircleGeometry(4, 40)), mat(WATER, { roughness: 0.25 }));
      water.rotation.x = -Math.PI / 2;
      pond.add(water);
      const pondRim = new THREE.Mesh(keep(new THREE.TorusGeometry(4, 0.32, 6, 28)), mat(WATER_RIM));
      pondRim.rotation.x = -Math.PI / 2;
      pondRim.castShadow = true;
      pond.add(pondRim);
      const padGeo = keep(new THREE.CircleGeometry(0.5, 10));
      const padMat = mat(0x63B84E);
      for (let i = 0; i < 4; i++) {
        const a = i * 1.5, r = 1.3 + i * 0.5;
        const pad = new THREE.Mesh(padGeo, padMat);
        pad.rotation.x = -Math.PI / 2;
        pad.position.set(Math.cos(a) * r, 0.05, Math.sin(a) * r);
        pond.add(pad);
      }
      pond.position.set(-12, 0.03, 8);
      scene.add(pond);

      // ── trees, bushes, rocks ──
      const trunkGeo = keep(new THREE.CylinderGeometry(0.32, 0.42, 2.2, 8));
      const canopyGeo = keep(new THREE.SphereGeometry(1.5, 12, 10));
      const trunkMat = mat(BARK), leafMatA = mat(LEAF_A), leafMatB = mat(LEAF_B);
      const TREES = [[-16,-9,1.15],[15,-12,1],[18,5,0.92],[-18,3,1.05],[9,15,1.1],[-7,-17,1],[3,-18,0.95],[13,11,0.85]];
      TREES.forEach(spot => {
        const g = new THREE.Group();
        const tr = new THREE.Mesh(trunkGeo, trunkMat);
        tr.position.y = 1.1; tr.castShadow = true;
        const c1 = new THREE.Mesh(canopyGeo, leafMatA);
        c1.position.y = 2.9; c1.castShadow = true;
        const c2 = new THREE.Mesh(canopyGeo, leafMatB);
        c2.position.set(0.8, 2.3, 0.4); c2.scale.setScalar(0.66); c2.castShadow = true;
        const c3 = new THREE.Mesh(canopyGeo, leafMatB);
        c3.position.set(-0.7, 2.45, -0.3); c3.scale.setScalar(0.58);
        g.add(tr, c1, c2, c3);
        g.position.set(spot[0], 0, spot[1]);
        g.scale.setScalar(spot[2]);
        scene.add(g);
      });

      const bushGeo = keep(new THREE.SphereGeometry(0.85, 10, 8));
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2 + 0.3, r = 14 + (i % 3) * 1.8;
        const b = new THREE.Mesh(bushGeo, i % 2 ? leafMatA : leafMatB);
        b.position.set(Math.cos(a) * r, 0.5, Math.sin(a) * r);
        b.scale.setScalar(0.75 + (i % 4) * 0.14);
        b.castShadow = true;
        scene.add(b);
      }

      const rockGeo = keep(new THREE.IcosahedronGeometry(0.6, 0));
      const rockMat = mat(0xC8C3B4);
      for (let i = 0; i < 6; i++) {
        const a = i * 1.05, r = 8 + (i % 4) * 2.4;
        const k = new THREE.Mesh(rockGeo, rockMat);
        k.position.set(Math.cos(a) * r, 0.28, Math.sin(a) * r);
        k.rotation.set(i, i * 2, i * 3);
        k.scale.setScalar(0.5 + (i % 3) * 0.2);
        k.castShadow = true;
        scene.add(k);
      }

      // fence
      const postGeo = keep(new THREE.BoxGeometry(0.28, 1.4, 0.28));
      const railGeo = keep(new THREE.BoxGeometry(0.14, 0.14, 3.2));
      const woodMat = mat(0xE7D2A6);
      for (let i = 0; i < 20; i++) {
        const a = (i / 20) * Math.PI * 2;
        const p = new THREE.Mesh(postGeo, woodMat);
        p.position.set(Math.cos(a) * (R + 2), 0.7, Math.sin(a) * (R + 2));
        p.lookAt(0, 0.7, 0);
        p.castShadow = true;
        scene.add(p);
        const a2 = a + Math.PI / 20;
        const rl = new THREE.Mesh(railGeo, woodMat);
        rl.position.set(Math.cos(a2) * (R + 2), 1.0, Math.sin(a2) * (R + 2));
        rl.lookAt(0, 1.0, 0);
        rl.rotateY(Math.PI / 2);
        scene.add(rl);
      }

      // soft glow disc shared by the pollen motes and every beast's aura
      const auraCanvas = document.createElement("canvas");
      auraCanvas.width = auraCanvas.height = 64;
      const actx = auraCanvas.getContext("2d");
      const ag = actx.createRadialGradient(32, 32, 0, 32, 32, 32);
      ag.addColorStop(0, "rgba(255,255,255,0.95)");
      ag.addColorStop(0.45, "rgba(255,255,255,0.32)");
      ag.addColorStop(1, "rgba(255,255,255,0)");
      actx.fillStyle = ag;
      actx.fillRect(0, 0, 64, 64);
      const auraTex = keep(new THREE.CanvasTexture(auraCanvas));

      // ── dawn atmosphere: pollen drifting through the light ──
      const moteGeo = keep(new THREE.BufferGeometry());
      const motePos = new Float32Array(120 * 3);
      for (let i = 0; i < 120; i++) {
        const a = (i * 2.399), r = 3 + (i % 20) * 1.05;
        motePos[i * 3] = Math.cos(a) * r;
        motePos[i * 3 + 1] = 1 + (i % 9);
        motePos[i * 3 + 2] = Math.sin(a) * r;
      }
      moteGeo.setAttribute("position", new THREE.BufferAttribute(motePos, 3));
      const motes = new THREE.Points(moteGeo, keep(new THREE.PointsMaterial({
        color: 0xFFF3CE, size: 0.26, map: auraTex, transparent: true, opacity: 0.7,
        blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
      })));
      scene.add(motes);

      // ── the mythic beasts ──
      const ballGeo = keep(new THREE.SphereGeometry(1, 14, 11));
      const eyeGeo = keep(new THREE.SphereGeometry(1, 10, 8));
      const coneGeo = keep(new THREE.ConeGeometry(1, 1, 7));
      const eyeWhite = keep(new THREE.MeshBasicMaterial({ color: 0xFFFFFF }));
      const pupilMat = keep(new THREE.MeshBasicMaterial({ color: 0x2A2118 }));
      const blushMat = keep(new THREE.MeshBasicMaterial({ color: 0xFF9BB0, transparent: true, opacity: 0.7 }));
      const starMat = keep(new THREE.MeshBasicMaterial({ color: 0xFFF6C4 }));
      const ringGeo = keep(new THREE.TorusGeometry(0.95, 0.07, 6, 20));

      function buildBeast(speciesId, stage) {
        const L = PET_LOOKS[speciesId] || PET_LOOKS.qilin;
        const g = new THREE.Group();
        const bodyM = mat(L.body), bellyM = mat(L.belly), accM = mat(L.accent);

        function place(parent, geo, material, pos, scale, rot) {
          const mesh = new THREE.Mesh(geo, material);
          if (pos) mesh.position.set(pos[0], pos[1], pos[2]);
          if (scale) mesh.scale.set(scale[0], scale[1], scale[2]);
          if (rot) mesh.rotation.set(rot[0] || 0, rot[1] || 0, rot[2] || 0);
          mesh.castShadow = true;
          parent.add(mesh);
          return mesh;
        }
        const add = (geo, m, pos, scale, rot) => place(g, geo, m, pos, scale, rot);

        if (stage === 0) { // unhatched egg
          add(ballGeo, mat(0xFFF3DA), [0, 0.78, 0], [0.6, 0.78, 0.6]);
          add(ballGeo, accM, [0.3, 0.95, 0.4], [0.11, 0.11, 0.11]);
          return g;
        }

        add(ballGeo, bodyM, [0, 0.68, 0], [0.72, 0.62, 0.78]);
        add(ballGeo, bellyM, [0, 0.62, 0.55], [0.5, 0.42, 0.3]);

        const head = new THREE.Group();
        head.position.set(0, 1.3, 0.2);
        g.add(head);
        const hAdd = (geo, m, pos, scale, rot) => place(head, geo, m, pos, scale, rot);

        hAdd(ballGeo, bodyM, [0, 0, 0], [0.62, 0.62, 0.62]);
        hAdd(ballGeo, L.extra === "beak" ? accM : bellyM, [0, -0.12, 0.55], [0.28, 0.22, 0.24]);

        const eyes = [];
        [-1, 1].forEach(s => {
          eyes.push(hAdd(eyeGeo, eyeWhite, [s * 0.24, 0.1, 0.5], [0.17, 0.2, 0.14]));
          hAdd(eyeGeo, pupilMat, [s * 0.25, 0.09, 0.6], [0.1, 0.12, 0.1]);
          hAdd(eyeGeo, blushMat, [s * 0.42, -0.1, 0.44], [0.12, 0.08, 0.06]);
        });
        if (L.extra === "thirdeye") hAdd(eyeGeo, pupilMat, [0, 0.4, 0.5], [0.08, 0.1, 0.08]);

        // horns / ears — the main silhouette cue
        if (L.horns === "antler") {
          [-1, 1].forEach(s => {
            hAdd(coneGeo, accM, [s * 0.3, 0.62, 0], [0.1, 0.55, 0.1], [0, 0, -s * 0.35]);
            hAdd(coneGeo, accM, [s * 0.46, 0.86, 0.05], [0.07, 0.3, 0.07], [0, 0, -s * 0.9]);
          });
        } else if (L.horns === "horn") {
          [-1, 1].forEach(s => hAdd(coneGeo, accM, [s * 0.26, 0.6, 0], [0.11, 0.42, 0.11], [0, 0, -s * 0.25]));
        } else if (L.horns === "single") {
          hAdd(coneGeo, accM, [0, 0.68, 0.12], [0.1, 0.5, 0.1]);
        } else if (L.horns === "ears") {
          [-1, 1].forEach(s => hAdd(coneGeo, accM, [s * 0.34, 0.56, 0.02], [0.15, 0.34, 0.12], [0, 0, -s * 0.3]));
        } else if (L.horns === "fin") {
          hAdd(coneGeo, accM, [0, 0.6, -0.05], [0.06, 0.42, 0.22]);
        } else if (L.horns === "round") {
          [-1, 1].forEach(s => hAdd(ballGeo, accM, [s * 0.44, 0.44, -0.02], [0.26, 0.26, 0.07]));
          [-1, 1].forEach(s => hAdd(ballGeo, bellyM, [s * 0.44, 0.44, 0.03], [0.17, 0.17, 0.05]));
        } else if (L.horns === "leaf") {
          [-1, 1].forEach(s => hAdd(ballGeo, mat(0x6FCB55), [s * 0.34, 0.52, 0], [0.26, 0.08, 0.14], [0, 0, s * 0.5]));
        }

        if (L.mane === "flame") {
          hAdd(ballGeo, accM, [0, 0.05, -0.2], [0.72, 0.72, 0.42]);
          hAdd(coneGeo, accM, [0, 0.66, -0.3], [0.16, 0.4, 0.16], [0.4, 0, 0]);
        } else if (L.mane === "crest") {
          hAdd(coneGeo, accM, [0, 0.62, 0.1], [0.12, 0.42, 0.12], [-0.25, 0, 0]);
          hAdd(coneGeo, accM, [0, 0.56, -0.14], [0.1, 0.32, 0.1], [0.3, 0, 0]);
        }

        if (L.wings) {
          [-1, 1].forEach(s => {
            const w = add(ballGeo, accM, [s * 0.76, 0.78, -0.06], [0.12, 0.36, 0.28]);
            w.userData.flap = s;
          });
        }

        if (L.tail === "flame") {
          add(coneGeo, accM, [0, 0.8, -0.86], [0.2, 0.55, 0.2], [-1.1, 0, 0]);
        } else if (L.tail === "plume") {
          [-0.22, 0, 0.22].forEach((o, i) =>
            add(coneGeo, i === 1 ? accM : bodyM, [o, 0.8 + i * 0.05, -0.95], [0.13, 0.7, 0.13], [-1.25, 0, o * 1.2]));
        } else if (L.tail === "multi") {
          [-0.3, 0, 0.3].forEach(o => add(coneGeo, accM, [o, 0.85, -0.85], [0.12, 0.5, 0.12], [-1.15, 0, o]));
        } else if (L.tail === "spike") {
          add(coneGeo, accM, [0, 0.7, -0.9], [0.22, 0.7, 0.22], [-1.5, 0, 0]);
        } else if (L.tail === "fin") {
          add(ballGeo, accM, [0, 0.82, -0.85], [0.06, 0.32, 0.28]);
        } else if (L.tail === "cloud") {
          add(ballGeo, bellyM, [0, 0.85, -0.85], [0.26, 0.2, 0.26]);
        } else if (L.tail === "tuft") {
          add(ballGeo, accM, [0, 0.78, -0.82], [0.2, 0.2, 0.2]);
        } else if (L.tail === "fan") {
          // 朱雀 — five plumes opened out flat, the widest silhouette in the park
          [-2, -1, 0, 1, 2].forEach(o =>
            add(coneGeo, o % 2 ? accM : bodyM, [o * 0.16, 0.86 + Math.abs(o) * 0.04, -0.95],
                [0.11, 0.75 - Math.abs(o) * 0.09, 0.11], [-1.3, 0, o * 0.26]));
        } else if (L.tail === "coil") {
          // 玄武 — the serpent coiled at the shell's rim, head raised
          [0, 1, 2].forEach(i =>
            add(ballGeo, accM, [Math.sin(i * 1.7) * 0.34, 0.5 + i * 0.16, -0.72 - i * 0.05], [0.17, 0.15, 0.17]));
          add(ballGeo, accM, [0.3, 1.0, -0.66], [0.16, 0.13, 0.2]);
        } else if (L.tail === "banded") {
          [0, 1, 2].forEach(i =>
            add(ballGeo, i % 2 ? accM : bodyM, [0, 0.74 + i * 0.05, -0.8 - i * 0.22], [0.16, 0.16, 0.16]));
        } else if (L.tail === "serpent") {
          // 青龙 — no wings, so the body itself trails away in segments
          [0, 1, 2, 3].forEach(i =>
            add(ballGeo, i === 3 ? accM : bodyM,
                [Math.sin(i * 1.1) * 0.22, 0.72 - i * 0.06, -0.78 - i * 0.28],
                [0.3 - i * 0.05, 0.26 - i * 0.045, 0.3 - i * 0.05]));
        } else if (L.tail === "sweep") {
          [0, 1, 2].forEach(i =>
            add(ballGeo, accM, [0, 0.6 - i * 0.1, -0.82 - i * 0.26], [0.19 - i * 0.03, 0.15 - i * 0.02, 0.24]));
        }

        if (L.extra === "shell") {
          add(ballGeo, accM, [0, 0.8, -0.05], [0.76, 0.5, 0.7]);
        } else if (L.extra === "spots") {
          [[-0.35, 0.8, 0.2], [0.3, 0.9, -0.1], [0, 0.72, -0.4]].forEach(p => add(ballGeo, accM, p, [0.1, 0.06, 0.1]));
        } else if (L.extra === "stars") {
          [-1, 1].forEach(s => hAdd(ballGeo, starMat, [s * 0.5, 0.95, 0.05], [0.07, 0.07, 0.07]));
        } else if (L.extra === "leaves") {
          add(ballGeo, mat(0x6FCB55), [0.5, 0.9, -0.3], [0.22, 0.07, 0.14], [0, 0.6, 0.4]);
        } else if (L.extra === "halo") {
          const halo = new THREE.Mesh(ringGeo, keep(new THREE.MeshBasicMaterial({
            color: L.aura, transparent: true, opacity: 0.6, depthWrite: false,
          })));
          halo.scale.setScalar(0.62);
          halo.position.set(0, 1.42, -0.42);
          g.add(halo);
        } else if (L.extra === "stripes") {
          [[0, 0.92, 0.12], [0, 0.86, -0.16], [0, 0.76, -0.44]].forEach(p =>
            add(ballGeo, accM, p, [0.74, 0.05, 0.5]));
          hAdd(ballGeo, accM, [0, 0.5, 0.12], [0.5, 0.04, 0.4]);
        } else if (L.extra === "serpentine") {
          [-1, 1].forEach(s => hAdd(coneGeo, accM, [s * 0.3, -0.06, 0.5], [0.04, 0.6, 0.04], [1.4, 0, s * 0.5]));
          [0, 1, 2].forEach(i => hAdd(coneGeo, accM, [0, 0.5 - i * 0.02, -0.1 - i * 0.18], [0.07, 0.16, 0.07]));
        } else if (L.extra === "frost") {
          [[-0.5, 1.5, 0.1], [0.46, 1.72, -0.2], [0.1, 1.86, 0.25]].forEach(p =>
            add(coneGeo, starMat, p, [0.09, 0.16, 0.09]));
        } else if (L.extra === "embers") {
          [[-0.45, 1.4, -0.3], [0.4, 1.6, -0.1], [0.05, 1.78, -0.42]].forEach(p =>
            add(ballGeo, mat(0xFFD08A), p, [0.08, 0.08, 0.08]));
        }

        [[-0.3, 0.3], [0.3, 0.3], [-0.3, -0.32], [0.3, -0.32]].forEach(leg =>
          add(ballGeo, accM, [leg[0], 0.17, leg[1]], [0.18, 0.15, 0.22]));

        if (stage === 4) { // 传说 — a slowly turning ring of light
          const ring = new THREE.Mesh(
            ringGeo,
            keep(new THREE.MeshBasicMaterial({ color: L.aura, transparent: true, opacity: 0.85 }))
          );
          ring.rotation.x = Math.PI / 2;
          ring.position.y = 0.12;
          ring.userData.spin = true;
          g.add(ring);
        }

        g.userData.head = head;
        g.userData.eyes = eyes;
        return g;
      }

      // Portrait canvases (phones) see a much narrower slice of the world at a
      // given camera distance, so both the ring of beasts and the camera pull
      // in/back to keep the whole park in frame.
      const startRect = host.getBoundingClientRect();
      const startAspect = startRect.height > 0 ? startRect.width / startRect.height : 1.4;
      const spreadScale = startAspect < 1 ? 0.7 : startAspect < 1.15 ? 0.85 : 1;

      const pets = [];
      report.forEach((row, i) => {
        const p = row.pet;
        // displayStageIndex, not stageIndex: a starving beast is literally
        // smaller in the park, matching the rule the UI already states.
        const grp = buildBeast(p.species.id, p.displayStageIndex);
        const scale = 0.9 + p.displayStageIndex * 0.26;
        grp.scale.setScalar(scale);

        const a = (i / Math.max(1, report.length)) * Math.PI * 2 + (i * 0.7) % 1;
        // A phone's canvas is taller than it is wide, so a ring sized for a
        // desktop frame spills out both sides. Pack it in on portrait.
        const r = (5.5 + ((i * 4.3) % 10.5)) * spreadScale;
        grp.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);

        const look = PET_LOOKS[p.species.id] || PET_LOOKS.qilin;
        const aura = new THREE.Sprite(keep(new THREE.SpriteMaterial({
          map: auraTex,
          color: look.aura,
          transparent: true,
          opacity: p.hunger.key === "starving" ? 0.12 : (p.hunger.key === "hungry" ? 0.22 : 0.45),
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        })));
        aura.scale.set(3.2 * scale, 3.2 * scale, 1);
        aura.position.set(grp.position.x, 0.9 * scale, grp.position.z);
        scene.add(aura);

        if (p.hunger.key === "hungry" || p.hunger.key === "starving") {
          grp.traverse(o => {
            if (o.isMesh && o.material && o.material.color) {
              o.material = o.material.clone();
              keep(o.material);
              o.material.color.lerp(new THREE.Color(0x9AA0A6), p.hunger.key === "starving" ? 0.5 : 0.28);
            }
          });
        }
        scene.add(grp);

        const tag = document.createElement("div");
        tag.className = "park-tag" + (p.isMaxStage ? " legend" : "") + (p.hunger.key === "starving" ? " starving" : "");
        const shortName = row.name.split(" ").slice(-1)[0];
        const label = p.nickname || (shortName + "的" + p.species.zh);
        tag.innerHTML =
          '<span class="park-tag-mood">' + p.hunger.icon + "</span>" +
          '<span class="park-tag-name">' + label + '<span class="stage">' + p.stage.zh + "</span></span>";
        tagLayer.appendChild(tag);

        pets.push({
          row: row, group: grp, aura: aura, tag: tag, scale: scale,
          speed: (p.hunger.key === "starving" || p.displayStageIndex === 0) ? 0 : 0.4 + ((i * 13) % 10) / 24,
          phase: (i * 1.3) % 6.28,
          blink: 1 + (i % 5),
          target: new THREE.Vector3(),
        });
      });

      const tmp = new THREE.Vector3();
      function retarget(p) {
        const a = Math.random() * Math.PI * 2, r = 3 + Math.random() * 13;
        p.target.set(Math.cos(a) * r, 0, Math.sin(a) * r);
      }
      pets.forEach(retarget);

      // ── camera: a HELD composition, not an auto-orbit ──
      // The old version span forever, which made the park unwatchable and left
      // students unable to look at their own beast. Now it sits at one composed
      // angle with a barely-perceptible drift; dragging looks around and it
      // eases back to the composition a few seconds after release.
      const BASE_ANGLE = 0.7, BASE_DIST = 29, BASE_HEIGHT = 20;
      let fitScale = 1;
      let userAngle = 0, userDist = 0, idleSince = 0;
      let dragging = false, lastX = 0, moved = 0;
      const ray = new THREE.Raycaster(), pointer = new THREE.Vector2();

      const onDown = e => { dragging = true; moved = 0; lastX = (e.touches ? e.touches[0] : e).clientX; };
      const onMove = e => {
        if (!dragging) return;
        const x = (e.touches ? e.touches[0] : e).clientX;
        moved += Math.abs(x - lastX);
        userAngle -= (x - lastX) * 0.006;
        lastX = x;
        idleSince = 0;
      };
      const onUp = e => {
        if (dragging && moved < 6) {
          const pt = e.changedTouches ? e.changedTouches[0] : e;
          const rect = canvas.getBoundingClientRect();
          pointer.x = ((pt.clientX - rect.left) / rect.width) * 2 - 1;
          pointer.y = -((pt.clientY - rect.top) / rect.height) * 2 + 1;
          ray.setFromCamera(pointer, camera);
          const hits = ray.intersectObjects(pets.map(p => p.group), true);
          if (hits.length) {
            let obj = hits[0].object;
            while (obj.parent && !pets.find(p => p.group === obj)) obj = obj.parent;
            const found = pets.find(p => p.group === obj);
            if (found && onPick) onPick(found.row.id);
          }
        }
        dragging = false;
      };
      const onWheel = e => {
        userDist = Math.max(-14, Math.min(10, userDist + e.deltaY * 0.02));
        idleSince = 0;
      };

      canvas.addEventListener("pointerdown", onDown);
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      canvas.addEventListener("wheel", onWheel, { passive: true });
      cleanupFns.push(() => {
        canvas.removeEventListener("pointerdown", onDown);
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        canvas.removeEventListener("wheel", onWheel);
      });

      // Measure with getBoundingClientRect and re-measure on the next frames:
      // mounting inside a still-settling layout otherwise bakes in a stale
      // aspect ratio and the projected name tags drift off their beasts.
      function resize() {
        const rect = host.getBoundingClientRect();
        const w = Math.round(rect.width), h = Math.round(rect.height);
        if (!w || !h) return;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        // Visible half-width at the look-at point is d * tan(fov/2) * aspect.
        // Below the desktop aspect that shrinks fast, so scale the distance by
        // how much narrower the frame is — capped, or a phone ends up so far
        // back the beasts are specks.
        fitScale = Math.min(1.7, Math.max(1, 1.35 / (w / h)));
      }
      resize();
      requestAnimationFrame(resize);
      const settle = setTimeout(resize, 300);
      cleanupFns.push(() => clearTimeout(settle));
      const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(resize) : null;
      if (ro) ro.observe(host); else window.addEventListener("resize", resize);
      cleanupFns.push(() => { if (ro) ro.disconnect(); else window.removeEventListener("resize", resize); });

      let t = 0;
      const dt = 0.016;
      function frame() {
        raf = requestAnimationFrame(frame);
        t += dt;

        // ±3° over a 20 s cycle — alive, but nobody notices it moving
        const drift = Math.sin(t * 0.05) * 0.05;
        if (!dragging) {
          idleSince += dt;
          if (idleSince > 4) {              // ease back to the composition
            userAngle *= 0.985;
            userDist *= 0.985;
            if (Math.abs(userAngle) < 0.001) userAngle = 0;
            if (Math.abs(userDist) < 0.01) userDist = 0;
          }
        }
        const angle = BASE_ANGLE + drift + userAngle;
        const dist = BASE_DIST * fitScale + userDist;
        camera.position.set(
          Math.cos(angle) * dist,
          BASE_HEIGHT * fitScale + userDist * 0.5,
          Math.sin(angle) * dist
        );
        // Pulled back on a phone the park sinks to the bottom of a tall frame
        // under a slab of empty sky; aiming lower tips it back up into view.
        camera.lookAt(0, 1.5 - (fitScale - 1) * 7, 0);

        motes.rotation.y += dt * 0.02;

        const rect = host.getBoundingClientRect();
        pets.forEach(p => {
          const g = p.group;
          if (p.speed > 0) {
            tmp.copy(p.target).sub(g.position);
            tmp.y = 0;
            if (tmp.length() < 0.6) retarget(p);
            else {
              tmp.normalize();
              g.position.addScaledVector(tmp, p.speed * dt * 2.2);
              g.rotation.y = Math.atan2(tmp.x, tmp.z);
              p.phase += dt * 6.5;
              const hop = Math.abs(Math.sin(p.phase));
              g.position.y = hop * 0.13 * p.scale;
              // squash and stretch sells the bounce more than the height does
              g.scale.set(
                p.scale * (1 + (1 - hop) * 0.05),
                p.scale * (1 + hop * 0.07),
                p.scale * (1 + (1 - hop) * 0.05)
              );
              if (g.userData.head) g.userData.head.rotation.x = Math.sin(p.phase) * 0.06;
            }
          } else {
            g.position.y = Math.sin(t * 1.5 + p.phase) * 0.035;
          }

          p.aura.position.set(g.position.x, 0.9 * p.scale, g.position.z);

          p.blink -= dt;
          const shut = p.blink < 0 && p.blink > -0.12;
          if (p.blink < -0.12) p.blink = 2 + (p.phase % 3);
          if (g.userData.eyes) g.userData.eyes.forEach(e => { e.scale.y = shut ? 0.02 : 0.2; });

          g.traverse(o => {
            if (o.userData && o.userData.flap) o.rotation.z = o.userData.flap * (0.3 + Math.sin(t * 6 + p.phase) * 0.28);
            if (o.userData && o.userData.spin) o.rotation.z += dt * 0.6;
          });

          tmp.copy(g.position);
          tmp.y += 2.1 * p.scale + 0.4;
          tmp.project(camera);
          p.sx = (tmp.x * 0.5 + 0.5) * rect.width;
          p.sy = (-tmp.y * 0.5 + 0.5) * rect.height;
          p.sz = tmp.z;
        });

        // Nearest beast keeps its label; anything overlapping it hides, so a
        // crowded corner stays readable instead of turning into a pile.
        const placed = [];
        pets.slice().sort((a, b) => a.sz - b.sz).forEach(p => {
          if (p.sz >= 1) { p.tag.style.opacity = 0; return; }
          const w = p.tag.offsetWidth || 90, h = p.tag.offsetHeight || 34;
          const box = { l: p.sx - w / 2, r: p.sx + w / 2, t: p.sy - h, b: p.sy };
          // A tag clipped by the canvas edge reads as a broken half-name, so
          // hide it rather than show "…依的白虎".
          if (box.l < 2 || box.r > rect.width - 2 || box.t < 0 || box.b > rect.height) {
            p.tag.style.opacity = 0;
            return;
          }
          const hit = placed.some(q => !(box.r < q.l || box.l > q.r || box.b < q.t || box.t > q.b));
          p.tag.style.opacity = hit ? 0 : 1;
          if (!hit) {
            placed.push(box);
            p.tag.style.left = p.sx + "px";
            p.tag.style.top = p.sy + "px";
          }
        });

        renderer.render(scene, camera);
      }
      frame();

      cleanupFns.push(() => {
        cancelAnimationFrame(raf);
        // Free GPU memory explicitly — leaving this to the GC is exactly how a
        // 3D view ends up crashing a low-RAM phone after a few visits.
        disposables.forEach(d => { if (d && d.dispose) d.dispose(); });
        renderer.dispose();
        if (scene.clear) scene.clear();
        tagLayer.innerHTML = "";
      });
    }).catch(err => {
      if (!alive) return;
      setStatus("error");
      setErrMsg(err.message || String(err));
    });

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      cleanupFns.forEach(fn => { try { fn(); } catch (e) {} });
      cleanupFns = [];
    };
  }, [signature]);

  return (
    <div className="park-wrap" ref={hostRef}>
      <canvas ref={canvasRef} className="park-canvas" />
      <div ref={tagsRef} className="park-tags" />
      {status === "loading" && (
        <div className="park-overlay">🌄 天亮了，神兽正在醒来… · Waking the beasts…</div>
      )}
      {status === "error" && (
        <div className="park-overlay error">
          ⚠️ {errMsg}<br/><small>可以切换到「📋 列表」查看 · Switch to the list view</small>
        </div>
      )}
      {status === "ready" && (
        <div className="park-hint">🖱️ 拖动看四周 · 放手后自动回原位 · 点神兽看详情</div>
      )}
    </div>
  );
}

function PetGardenView({ state, setState, authed = false, requireAuth = (fn) => fn && fn() }) {
  const { useState, useMemo } = React;

  const [teamFilter, setTeamFilter] = useState("all");
  const [selectedId, setSelectedId] = useState(null);
  // Default to the park, but only where WebGL actually exists.
  const [viewMode, setViewMode] = useState(() => (webglSupported() ? "park" : "grid"));

  const report = useMemo(() => EcoData.petReport(state), [state]);
  const filtered = teamFilter === "all" ? report : report.filter(r => r.teamId === teamFilter);
  const selected = selectedId ? report.find(r => r.id === selectedId) : null;

  const hungryCount = report.filter(r => r.pet.hunger.key === "hungry" || r.pet.hunger.key === "starving").length;
  const legendCount = report.filter(r => r.pet.isMaxStage).length;

  return (
    <div className="mobile-view teacher-entry">
      <div className="mobile-frame teacher-frame pet-frame">
        <div style={{display:'flex', justifyContent:'center', marginBottom:10}}>
          <SchoolStamp size={64} />
        </div>
        <div className="mobile-header compact">
          <h1>🐾 宠物园 <span style={{opacity:.6, fontSize:'0.7em'}}>· Eco Pets</span></h1>
          <p>做环保、拿星星 → 宠物就会长大 · Earn stars, your pet grows</p>
        </div>

        <div className="pet-rule-note">
          🍽️ 宠物会自动吃你赚到的星星 —— <b>换礼物不会让宠物变小</b>。
          太久没有新星星，宠物会饿哦！
        </div>

        <div className="pet-summary">
          <div className="pet-summary-item">
            <b>{report.length}</b><span>只宠物</span>
          </div>
          <div className="pet-summary-item">
            <b>{legendCount}</b><span>传说 ✨</span>
          </div>
          <div className={`pet-summary-item ${hungryCount > 0 ? "warn" : ""}`}>
            <b>{hungryCount}</b><span>肚子饿 😟</span>
          </div>
        </div>

        <div className="team-tabs">
          <button
            className={`team-tab ${teamFilter === "all" ? "active" : ""}`}
            onClick={() => setTeamFilter("all")}
          >
            全部 · All ({report.length})
          </button>
          {state.teams.map(t => (
            <button
              key={t.id}
              className={`team-tab ${teamFilter === t.id ? "active" : ""}`}
              onClick={() => setTeamFilter(t.id)}
              style={{borderColor: teamFilter === t.id ? t.primary : undefined}}
            >
              {t.icon} {t.zh} ({report.filter(r => r.teamId === t.id).length})
            </button>
          ))}
        </div>

        <div className="pet-view-toggle">
          <button
            className={`team-tab ${viewMode === "park" ? "active" : ""}`}
            onClick={() => setViewMode("park")}
            disabled={!webglSupported()}
            title={webglSupported() ? "" : "这台设备不支持 3D · This device can't run 3D"}
          >
            🎡 乐园 · Park
          </button>
          <button
            className={`team-tab ${viewMode === "grid" ? "active" : ""}`}
            onClick={() => setViewMode("grid")}
          >
            📋 列表 · List
          </button>
        </div>

        {viewMode === "park" ? (
          filtered.length > 0
            ? <PetPark3D report={filtered} onPick={setSelectedId} />
            : <div className="ai-history-empty">还没有学生记录 · No students.</div>
        ) : (
          <div className="pet-grid">
            {filtered.map(row => (
              <PetCard key={row.id} row={row} onClick={() => setSelectedId(row.id)} />
            ))}
            {filtered.length === 0 && (
              <div className="ai-history-empty" style={{gridColumn:'1 / -1'}}>还没有学生记录 · No students.</div>
            )}
          </div>
        )}
      </div>

      {selected && (
        <PetDetailModal
          state={state}
          setState={setState}
          row={selected}
          authed={authed}
          requireAuth={requireAuth}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}

function PetCard({ row, onClick }) {
  const p = row.pet;
  return (
    <button
      className={`pet-card hunger-${p.hunger.key} ${p.isMaxStage ? "is-legend" : ""}`}
      onClick={onClick}
      style={{'--team-color': row.teamColor}}
    >
      <div className="pet-avatar">
        <span className="pet-emoji">{p.icon}</span>
        {p.isMaxStage && <span className="pet-badge-legend">✨</span>}
        <span className="pet-mood">{p.hunger.icon}</span>
      </div>
      <div className="pet-name">
        {p.nickname || row.name.split(" ").slice(-1)[0]}
      </div>
      <div className="pet-stage-label">
        {row.teamIcon} {p.stage.zh}
        {p.isRegressed && <span className="pet-regress-tag">虚弱</span>}
      </div>
      <div className="pet-bar">
        <div className="pet-bar-fill" style={{width: `${Math.round(p.stageProgress * 100)}%`}} />
      </div>
      <div className="pet-exp">{p.exp} ⭐</div>
    </button>
  );
}

function PetDetailModal({ state, setState, row, authed, requireAuth, onClose }) {
  const p = row.pet;

  function changeSpecies() {
    if (!requireAuth()) return;
    const names = EcoData.PET_SPECIES.map((s, i) => `${i + 1}. ${s.stages[3]} ${s.zh}`).join("\n");
    const answer = window.prompt(
      `帮 ${row.name} 换一只宠物？输入编号：\nPick a species for ${row.name}:\n\n${names}`,
      String(EcoData.PET_SPECIES.findIndex(s => s.id === p.species.id) + 1)
    );
    if (answer === null) return;
    const index = Number(answer) - 1;
    const picked = EcoData.PET_SPECIES[index];
    if (!picked) { alert("编号不对 · Invalid number"); return; }
    setState(EcoData.setPetSpecies(state, row.id, picked.id));
  }

  function rename() {
    if (!requireAuth()) return;
    const answer = window.prompt(
      `给 ${row.name} 的宠物取名字（留空 = 用学生名字）：\nPet nickname:`,
      p.nickname || ""
    );
    if (answer === null) return;
    setState(EcoData.setPetNickname(state, row.id, answer.trim()));
  }

  const hungerHint = p.neverFed
    ? "还没有拿过星星，蛋还没孵化 · No stars yet — the egg hasn't hatched"
    : p.daysSinceFed === 0
      ? "今天刚吃过 · Fed today"
      : `已经 ${p.daysSinceFed} 天没有新星星 · ${p.daysSinceFed} day(s) without a new star`;

  return (
    <div className="login-modal-backdrop" onClick={onClose}>
      <div className="star-modal pet-modal" onClick={e => e.stopPropagation()}>
        <button type="button" className="login-modal-close" onClick={onClose} aria-label="Close">×</button>

        <div className={`pet-modal-hero hunger-${p.hunger.key}`}>
          <span className="pet-modal-emoji">{p.icon}</span>
          {p.isMaxStage && <span className="pet-badge-legend big">✨</span>}
        </div>

        <h2 className="star-modal-title" style={{textAlign:'center'}}>
          {p.nickname || `${row.name} 的宠物`}
          <small>{row.teamIcon} {row.teamName} · {p.species.zh} · {p.stage.zh}</small>
        </h2>

        <div className="pet-modal-stats">
          <div className="pet-stat">
            <b>{p.exp}</b><span>成长值 ⭐</span>
          </div>
          <div className="pet-stat">
            <b>{p.hunger.icon}</b><span>{p.hunger.zh}</span>
          </div>
          <div className="pet-stat">
            <b>{p.stageIndex + 1}/{EcoData.PET_STAGES.length}</b><span>进化阶段</span>
          </div>
        </div>

        <div className="pet-progress-block">
          {p.isMaxStage ? (
            <div className="pet-next-note">🏆 已经是最终形态 · Fully evolved!</div>
          ) : (
            <>
              <div className="pet-bar big">
                <div className="pet-bar-fill" style={{width: `${Math.round(p.stageProgress * 100)}%`}} />
              </div>
              <div className="pet-next-note">
                再赚 <b>{p.expToNext} ⭐</b> 就进化成「{p.nextStage.zh}」
                <br/><span>{p.expToNext} more star(s) to evolve</span>
              </div>
            </>
          )}
        </div>

        <div className={`pet-hunger-note ${p.hunger.key}`}>
          {p.hunger.icon} {hungerHint}
          {p.isRegressed && (
            <div className="pet-regress-note">
              ⚠️ 太久没吃，宠物虚弱了，外表退回上一阶段。<br/>
              <b>成长值没有减少 —— 拿到新星星马上恢复！</b>
            </div>
          )}
        </div>

        {authed && (
          <div className="pet-admin-row">
            <button className="chunky-btn small-btn" onClick={changeSpecies}>🔄 换宠物</button>
            <button className="chunky-btn small-btn" onClick={rename}>✏️ 改名字</button>
          </div>
        )}
      </div>
    </div>
  );
}

window.PetGardenView = PetGardenView;
