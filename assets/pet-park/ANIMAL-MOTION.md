# Animal-only sound and full-library body motion — 2026-09-12

Scope: 50 existing species, 250 post-egg forms (stages 1–5), 300 stage-specific
nonverbal call waveforms. Eggs keep their existing shell choreography. No roster,
team, reward threshold, student ledger or teacher quota changes.

- `pet-body-rigs.js` holds measured paw/claw/tentacle tips for all 250 bodies.
  Wing/fin shoulder and tip regions cover 73 illustrated forms in 18 species.
  Coordinates use the actual 192px source contact sheets, converted at runtime.
- All species, including hornbeetle, use `LivingPetActor` for idle and interaction.
  Feet turn around a joint and lift; wings fan around their shoulder. Species
  seeds and stage timing distinguish their movement. Original artwork is intact.
- This is continuous **2D illustration mesh articulation**, not a new 3D model
  or an animation of unseen anatomy. Do not advertise independent 3D limbs.
- Reused rigs, 8 fps/8-grid thumbnails, 12 fps park actors and offscreen pause
  bound mobile work; a selected performance runs at 30 fps. Reduced-motion
  preference gives a still body rather than persistent limb movement.
- Body taps trigger performances. The lower play button scrolls the creature
  into view; detail choreography is contained so the body stays visible.
- Sound is stylized synthesized animal/creature calls: purring, cooing,
  chirping, squeaking, frog croaks, beetle trills, wing rustles and water calls.
  It is not human speech or a claim of real-animal field recordings. The owner
  and stage dialogue remains text only.
- Human voice packs and system narration are disabled at their API boundary.
  Historic voice assets remain in git but are never fetched by the app. Old
  saved device-voice settings cannot reactivate speech.
- Mute, close, stage change and backgrounding stop calls. A cancellation token
  also prevents a pending AudioContext unlock from playing after dismissal.

Verification: 50 species / 250 bodies passed body-part displacement tests and
real browser canvas-pixel tests **with blink, head and breathing disabled**.
The weakest form still changed 788 pixels within measured limb regions over
the sampled idle frames. All 73 wing/fin forms passed independent wing-region
pixel checks. Mobile 390×844 interaction and close/stage/mute cleanup passed,
with zero human audio calls or media requests and no page errors.

Reproducible checks: `scripts/test-pet-body-motion.cjs`,
`scripts/test-living-beetle.cjs`, `scripts/test-pet-character-voice.cjs`, and the
isolated-lab `scripts/verify-*-browser.js` helpers. The lab does not connect to
student cloud data; never run its UI test helpers on production.
