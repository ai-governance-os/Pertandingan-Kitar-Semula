// 宠物园 · Eco Pets — every student's pet, either as a walking 3D park or a
// plain card grid.
//
// Growth and hunger are derived from the star ledger (see data.js petState),
// so this screen is read-only for everyone; teachers only get species/nickname
// tools, never a way to hand out growth directly.
//
// The 3D park loads Three.js ON DEMAND (never on app start) and falls back to
// the card grid when WebGL is unavailable — this school runs entry-level
// phones that already hit Chrome's low-memory warning once, so the other
// screens must not pay for the 3D engine.

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

// Visual traits per species id (ids come from EcoData.PET_SPECIES).
const PET_LOOKS = {
  lion:   { body: 0xF5B841, accent: 0x9A5B2E, ear: "round", tail: true,  wings: false, mane: true  },
  dragon: { body: 0x3FBF9B, accent: 0xE8557A, ear: "horn",  tail: true,  wings: true,  mane: false },
  dino:   { body: 0x7FC65B, accent: 0x4E8C36, ear: "none",  tail: true,  wings: false, mane: false },
  whale:  { body: 0x5AA9E6, accent: 0x2E6FA3, ear: "none",  tail: true,  wings: false, mane: false },
  owl:    { body: 0xC49A6C, accent: 0x7A5A3A, ear: "tuft",  tail: false, wings: true,  mane: false },
  tree:   { body: 0x6BBF59, accent: 0x8B5E3C, ear: "none",  tail: false, wings: false, mane: false },
};

// ─────────────────────────── 3D park ───────────────────────────

function PetPark3D({ report, onPick }) {
  const { useEffect, useRef, useState, useMemo } = React;
  const hostRef = useRef(null);
  const canvasRef = useRef(null);
  const tagsRef = useRef(null);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [errMsg, setErrMsg] = useState("");

  // Rebuild the scene only when the pets themselves change, not on every
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

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0xBFE9F5);
      scene.fog = new THREE.Fog(0xBFE9F5, 38, 72);

      const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 200);
      let camAngle = 0.6, camDist = 26, camHeight = 13, autoRotate = true;

      scene.add(new THREE.HemisphereLight(0xFFFBEF, 0x8FBF7A, 0.85));
      const sun = new THREE.DirectionalLight(0xFFF3D6, 0.85);
      sun.position.set(14, 22, 10);
      sun.castShadow = true;
      sun.shadow.mapSize.set(1024, 1024);
      Object.assign(sun.shadow.camera, { left: -26, right: 26, top: 26, bottom: -26 });
      scene.add(sun);

      // Track everything we create so unmount can free GPU memory.
      const disposables = [];
      const track = (obj) => {
        obj.traverse ? obj.traverse(o => {
          if (o.geometry) disposables.push(o.geometry);
          if (o.material) disposables.push(o.material);
        }) : null;
        return obj;
      };

      const PARK_R = 17;
      const ground = new THREE.Mesh(new THREE.CircleGeometry(PARK_R + 3, 64),
        new THREE.MeshLambertMaterial({ color: 0x8FD46A }));
      ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true;
      scene.add(track(ground));

      const path = new THREE.Mesh(new THREE.RingGeometry(9.2, 11.2, 64),
        new THREE.MeshLambertMaterial({ color: 0xE8D9A8 }));
      path.rotation.x = -Math.PI / 2; path.position.y = 0.02; path.receiveShadow = true;
      scene.add(track(path));

      const pond = new THREE.Mesh(new THREE.CircleGeometry(3.4, 40),
        new THREE.MeshLambertMaterial({ color: 0x66C6E8 }));
      pond.rotation.x = -Math.PI / 2; pond.position.set(-11, 0.03, 7);
      scene.add(track(pond));

      const trunkGeo = new THREE.CylinderGeometry(0.28, 0.36, 1.7, 8);
      const leafGeoA = new THREE.ConeGeometry(1.5, 2.6, 9);
      const leafGeoB = new THREE.ConeGeometry(1.15, 2.0, 9);
      const trunkMat = new THREE.MeshLambertMaterial({ color: 0x8B5E3C });
      const leafMatA = new THREE.MeshLambertMaterial({ color: 0x4FA845 });
      const leafMatB = new THREE.MeshLambertMaterial({ color: 0x63C158 });
      disposables.push(trunkGeo, leafGeoA, leafGeoB, trunkMat, leafMatA, leafMatB);

      [[-14,-8,1.1],[13,-10,1],[16,4,.9],[-16,2,1],[8,13,1.05],[-6,-15,.95],[2,-16,1]]
        .forEach(([x, z, s]) => {
          const g = new THREE.Group();
          const trunk = new THREE.Mesh(trunkGeo, trunkMat); trunk.position.y = 0.85; trunk.castShadow = true;
          const l1 = new THREE.Mesh(leafGeoA, leafMatA); l1.position.y = 2.7; l1.castShadow = true;
          const l2 = new THREE.Mesh(leafGeoB, leafMatB); l2.position.y = 3.7; l2.castShadow = true;
          g.add(trunk, l1, l2); g.position.set(x, 0, z); g.scale.setScalar(s);
          scene.add(g);
        });

      const postGeo = new THREE.BoxGeometry(0.22, 1.1, 0.22);
      const postMat = new THREE.MeshLambertMaterial({ color: 0xF3E2C0 });
      disposables.push(postGeo, postMat);
      for (let i = 0; i < 44; i++) {
        const a = (i / 44) * Math.PI * 2;
        const post = new THREE.Mesh(postGeo, postMat);
        post.position.set(Math.cos(a) * (PARK_R + 1.6), 0.55, Math.sin(a) * (PARK_R + 1.6));
        post.castShadow = true;
        scene.add(post);
      }

      function buildPet(speciesId, stage) {
        const look = PET_LOOKS[speciesId] || PET_LOOKS.lion;
        const g = new THREE.Group();
        const bodyMat = new THREE.MeshLambertMaterial({ color: look.body });
        const accMat = new THREE.MeshLambertMaterial({ color: look.accent });
        const darkMat = new THREE.MeshLambertMaterial({ color: 0x2B2B33 });
        disposables.push(bodyMat, accMat, darkMat);

        const add = (geo, mat, cfg = {}) => {
          const m = new THREE.Mesh(geo, mat);
          disposables.push(geo);
          if (cfg.pos) m.position.set(...cfg.pos);
          if (cfg.scale) m.scale.set(...cfg.scale);
          if (cfg.rotX) m.rotation.x = cfg.rotX;
          m.castShadow = true;
          g.add(m);
          return m;
        };

        if (stage === 0) { // unhatched egg
          const eggMat = new THREE.MeshLambertMaterial({ color: 0xFFF3DA });
          disposables.push(eggMat);
          add(new THREE.SphereGeometry(0.55, 16, 16), eggMat, { pos: [0, 0.7, 0], scale: [1, 1.3, 1] });
          add(new THREE.SphereGeometry(0.14, 10, 10), accMat, { pos: [0.3, 0.85, 0.35] });
          return g;
        }

        add(new THREE.SphereGeometry(0.62, 18, 16), bodyMat, { pos: [0, 0.72, 0], scale: [1, 0.92, 1.25] });
        add(new THREE.SphereGeometry(0.46, 18, 16), bodyMat, { pos: [0, 1.22, 0.55] });

        const snoutMat = new THREE.MeshLambertMaterial({ color: speciesId === "owl" ? 0xF0B24B : 0xFFF0DC });
        disposables.push(snoutMat);
        add(new THREE.SphereGeometry(0.2, 12, 12), snoutMat, { pos: [0, 1.13, 0.92], scale: [1, 1, 1.2] });

        [-0.18, 0.18].forEach(x => {
          add(new THREE.SphereGeometry(0.075, 10, 10), darkMat, { pos: [x, 1.32, 0.88] });
        });

        if (look.ear === "round") {
          [-0.3, 0.3].forEach(x =>
            add(new THREE.SphereGeometry(0.17, 10, 10), accMat, { pos: [x, 1.55, 0.45], scale: [1, 1, 0.5] }));
        } else if (look.ear === "horn") {
          [-0.2, 0.2].forEach(x =>
            add(new THREE.ConeGeometry(0.09, 0.34, 8), accMat, { pos: [x, 1.62, 0.45] }));
        } else if (look.ear === "tuft") {
          [-0.26, 0.26].forEach(x =>
            add(new THREE.ConeGeometry(0.12, 0.3, 7), accMat, { pos: [x, 1.58, 0.5] }));
        }
        if (look.mane) add(new THREE.TorusGeometry(0.5, 0.18, 8, 18), accMat, { pos: [0, 1.22, 0.5] });

        if (look.wings) {
          [-1, 1].forEach(dir => {
            const w = add(new THREE.SphereGeometry(0.3, 10, 10), accMat,
              { pos: [dir * 0.62, 0.85, 0.05], scale: [0.35, 0.75, 1] });
            w.userData.flap = dir;
          });
        }
        if (look.tail) add(new THREE.ConeGeometry(0.16, 0.6, 8), accMat, { pos: [0, 0.78, -0.85], rotX: -Math.PI / 2.4 });

        [[-0.26, 0.42], [0.26, 0.42], [-0.26, -0.3], [0.26, -0.3]].forEach(([x, z]) =>
          add(new THREE.CylinderGeometry(0.11, 0.11, 0.42, 7), accMat, { pos: [x, 0.21, z] }));

        if (stage === 4) {
          const crownMat = new THREE.MeshLambertMaterial({ color: 0xF6C453 });
          disposables.push(crownMat);
          add(new THREE.CylinderGeometry(0.3, 0.36, 0.22, 8), crownMat, { pos: [0, 1.72, 0.5] });
        }
        return g;
      }

      const pets = [];
      report.forEach((row, i) => {
        const p = row.pet;
        // displayStageIndex, not stageIndex: a starving pet literally looks
        // like it shrank back a stage, matching the rule shown in the UI.
        const grp = buildPet(p.species.id, p.displayStageIndex);
        const scale = 0.62 + p.displayStageIndex * 0.2;
        grp.scale.setScalar(scale);

        // Spread wider than the prototype so ~19 name tags don't pile up.
        const a = (i / Math.max(1, report.length)) * Math.PI * 2 + (i * 0.7) % 1;
        const r = 5.5 + ((i * 4.3) % 10.5);
        grp.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);

        if (p.hunger.key === "hungry" || p.hunger.key === "starving") {
          grp.traverse(o => {
            if (o.isMesh && o.material && o.material.color) {
              o.material = o.material.clone();
              disposables.push(o.material);
              o.material.color.lerp(new THREE.Color(0x9AA0A6), p.hunger.key === "starving" ? 0.55 : 0.3);
            }
          });
        }
        scene.add(grp);

        const tag = document.createElement("div");
        tag.className = "park-tag" + (p.isMaxStage ? " legend" : "") + (p.hunger.key === "starving" ? " starving" : "");
        const label = p.nickname || row.name.split(" ").slice(-1)[0];
        tag.innerHTML =
          `<span class="park-tag-mood">${p.hunger.icon}</span>` +
          `<span class="park-tag-name">${label}<span class="stage">${p.stage.zh}</span></span>`;
        tagLayer.appendChild(tag);

        pets.push({
          row, group: grp, tag, scale,
          speed: (p.hunger.key === "starving" || p.displayStageIndex === 0) ? 0 : 0.45 + ((i * 13) % 10) / 20,
          phase: (i * 1.3) % 6.28,
          target: new THREE.Vector3(),
        });
      });

      const tmp = new THREE.Vector3();
      function retarget(p) {
        const a = Math.random() * Math.PI * 2, r = 3 + Math.random() * 12;
        p.target.set(Math.cos(a) * r, 0, Math.sin(a) * r);
      }
      pets.forEach(retarget);

      // ── interaction ──
      const ray = new THREE.Raycaster(), pointer = new THREE.Vector2();
      let dragging = false, lastX = 0, moved = 0;

      const onDown = e => { dragging = true; moved = 0; lastX = (e.touches ? e.touches[0] : e).clientX; };
      const onMove = e => {
        if (!dragging) return;
        const x = (e.touches ? e.touches[0] : e).clientX;
        moved += Math.abs(x - lastX);
        camAngle -= (x - lastX) * 0.006;
        lastX = x;
        if (moved > 6) autoRotate = false;
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
      const onWheel = e => { camDist = Math.max(12, Math.min(42, camDist + e.deltaY * 0.02)); };

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

      // Measure with getBoundingClientRect (not clientWidth) and re-measure on
      // the next frames: mounting inside a still-settling flex/scroll layout
      // otherwise bakes in a stale aspect ratio, which makes the projected
      // name tags drift away from the pets they belong to.
      function resize() {
        const rect = host.getBoundingClientRect();
        const w = Math.round(rect.width), h = Math.round(rect.height);
        if (!w || !h) return;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
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
        if (autoRotate) camAngle += dt * 0.12;
        camera.position.set(Math.cos(camAngle) * camDist, camHeight, Math.sin(camAngle) * camDist);
        camera.lookAt(0, 1.5, 0);

        const rect = host.getBoundingClientRect();
        pets.forEach(p => {
          if (p.speed > 0) {
            tmp.copy(p.target).sub(p.group.position); tmp.y = 0;
            if (tmp.length() < 0.5) retarget(p);
            else {
              tmp.normalize();
              p.group.position.addScaledVector(tmp, p.speed * dt * 2.2);
              p.group.rotation.y = Math.atan2(tmp.x, tmp.z);
              p.phase += dt * 7;
              p.group.position.y = Math.abs(Math.sin(p.phase)) * 0.12 * p.scale;
            }
          } else {
            p.group.position.y = Math.sin(t * 1.6 + p.phase) * 0.03;
          }
          p.group.traverse(o => {
            if (o.userData && o.userData.flap) {
              o.rotation.z = o.userData.flap * (0.25 + Math.sin(t * 6 + p.phase) * 0.25);
            }
          });

          tmp.copy(p.group.position);
          tmp.y += 2.0 * p.scale + 0.4;
          tmp.project(camera);
          p.tag.style.left = ((tmp.x * 0.5 + 0.5) * rect.width) + "px";
          p.tag.style.top = ((-tmp.y * 0.5 + 0.5) * rect.height) + "px";
          p.tag.style.opacity = tmp.z < 1 ? 1 : 0;
        });

        renderer.render(scene, camera);
      }
      frame();

      cleanupFns.push(() => {
        cancelAnimationFrame(raf);
        // Free GPU memory explicitly — leaving this to the GC is exactly how a
        // 3D view ends up crashing a low-RAM phone after a few visits.
        disposables.forEach(d => d && d.dispose && d.dispose());
        renderer.dispose();
        scene.clear && scene.clear();
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
        <div className="park-overlay">🌳 正在打开乐园… · Loading the park…</div>
      )}
      {status === "error" && (
        <div className="park-overlay error">
          ⚠️ {errMsg}<br/><small>可以切换到「📋 列表」查看 · Switch to the list view</small>
        </div>
      )}
      {status === "ready" && (
        <div className="park-hint">🖱️ 拖动转视角 · 点宠物看详情</div>
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
