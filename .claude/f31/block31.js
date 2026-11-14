// ==== W31 BEGIN
// (builder 31) WATER'S OWN CHANGE OF STAGE, in pen and wash (AA.rxKit.evolve31, on by default; false or ?e31=0 gives builder 30's back).
// It stays where it stands. Three beats on the music's beat (o.L), longer and bigger at each stage:
//  1. THE GATHERING: a start (eyes wide, arms and hair up), then it draws arms, hair and pool in and curls, head to middle, into a ball
//     (the same skin: the pose, then ball31 pulls every joint inside one round). Inked beads run in to it across the bench and the page.
//  2. THE WHIRLPOOL: a ball of wash grows out of the curled body and takes it in (the old stage's skin is changed for the new one inside it).
//     Its wash turns in two arms, pen strokes land, turn and lift on it, a ring of drops and spray goes round it faster and faster, it lifts
//     and grows, a round of wash spreads under it, pencil lines curve in. Then it tightens and everything holds still for an instant.
//  3. THE SPRING: the ball opens from the top like a bud (the same mesh, its upper part bent out and down), the new form shoots up out of it
//     past its height and settles, then arm, hair, arm unroll on the half beats; the shell lies down as the new pool; a ring of wash and ink
//     flecks runs out over the bench; drops fall back. Eyes open, then the proud look.
KIT.evolve31 = KIT.evolve31 == null ? !(typeof location !== 'undefined' && /[?&]e31=0/.test(String(location.search))) : KIT.evolve31;
const W31 = { err: null, BIG: 1.55 };
const on31 = S => KIT.evolve31 !== false && KIT.wash30 !== false && !KIT.style29 && S && S.x28 && S.b27 && !S.jar;
const tl31 = o => { if (o.tl31) return o.tl31; const g = Math.max(2, Math.min(5, o.to || 3)), b = 2.5 + 0.25 * (g - 2), k = Math.max(1, 2500 / (3 * b * o.L)); return (o.tl31 = { g, TG: b * k, TS: b * k, H: 2 * b * k, TA: b * k, R0: 0.4 * ((W26.geo[o.from] || { H: 3 }).H) }); };
const spin31 = (X, bb) => 6.2832 * (0.35 * bb + 0.7 * bb * bb * bb) * X.g / 3;
function evo31(S, t, o, q) { const K = RK, L = o.L, X = tl31(o), u = t / L, g = X.g, m = q.m = { body: 0, armL: 0, hair: 0, armR: 0, face: 0, pool: 0, from: o.from };
  const e = q.e31 = { curl: 0, ball: 0, R: 0, cy: 0, lift: 0, spin: 0, open: 0, flat: 0, old: true, a: 0, b: -1, v: -1, sk: 0, still: 0, tight: 0, fw: 0, hop: 0, R0: X.R0, g };
  q.e = 0; q.n = (u - X.H) * 2; q.big = 0;
  if (t < 0) { const p = K.cl(1 + t / 420); q.wide = p; q.brow = 0.8 * p; q.looky = 0.5 * p; q.sq = -0.07 * p; return; }
  const curled = () => { q.bow = 1.7; q.nod = 1.0; q.sq = -0.42; q.armR = q.armL = -1.3; q.hair = -0.8; q.sink = 0.28; q.px = q.pz = 0.4; q.blink = 1; };
  if (u < X.TG) { const a = e.a = u / X.TG, st = K.pulse(a, -0.1, 0.2, 0.07), cu = K.sm((a - 0.2) / 0.66), jolt = a > 0.02 ? K.ring((a - 0.02) * X.TG * L, 160, 150) : 0;
    q.wide = 1 - 0.5 * cu; q.brow = 0.9 * st + 0.3; q.looky = 0.6 * st - 0.8 * cu; q.blink = K.sm((a - 0.62) / 0.2); q.open = st;
    q.sq = 0.2 * st + 0.06 * jolt * st - 0.42 * cu; q.armR = 0.75 * st - 1.3 * cu; q.armL = 0.6 * st - 1.3 * cu; q.hair = 0.6 * st - 0.8 * cu; q.bow = -0.12 * st + 1.7 * cu; q.nod = 1.0 * cu; q.sink = 0.28 * cu;
    q.px = q.pz = 1 + 0.12 * st - 0.6 * K.sm((a - 0.25) / 0.55); q.lean = 0.08 * Math.sin(a * 19) * cu * (1 - cu) * 4;
    e.curl = cu; const sr = 0.62 * K.sm((a - 0.7) / 0.3); e.R = X.R0 * sr; e.cy = X.R0 * 0.62; e.spin = spin31(X, 0) - 1.2 * (1 - a); return; }
  if (u < X.H) { const b = e.b = (u - X.TG) / X.TS, bb = Math.min(b, 0.88), tight = K.sm((b - 0.78) / 0.1); curled(); e.a = 1; e.curl = 1; e.ball = K.sm(b / 0.22); e.old = b < 0.3; if (!e.old) m.body = 1;
    e.R = X.R0 * (0.62 + 0.38 * K.back(b / 0.3) + (0.3 + 0.07 * g) * K.sm((b - 0.15) / 0.6)) * (1 - 0.13 * tight); e.cy = X.R0 * 0.62 + (e.R - X.R0 * 0.62) * 0.9;
    e.lift = X.R0 * ((0.5 + 0.08 * g) * K.sm(b / 0.45) + 0.07 * Math.sin(bb * X.TS * 3.1416) * (1 - tight)); e.spin = spin31(X, bb); e.still = b > 0.88 ? 1 : 0; e.tight = tight; q.big = K.sm(b / 0.5); e.fw = K.sm(b / 0.7); return; }
  const vr = u - X.H, v = e.v = vr * 3 / X.TA, LL = L * X.TA / 3, rise = K.back(v / 0.42), up = Math.min(1, rise); e.old = false; e.a = 1; e.b = 1; e.tight = 1 - K.sm(v / 0.1); e.fw = 1;
  e.curl = 1 - K.sm(v / 0.3); e.ball = 1 - K.sm(v / 0.16); e.open = K.sm(v / 0.32); e.flat = K.sm((v - 0.3) / 0.6); e.sk = K.sm(v / 0.5);
  e.R = X.R0 * (1.3 + 0.07 * g) * 0.87 * (1 + 0.12 * K.sm(v / 0.12)); e.cy = X.R0 * 0.62 + (e.R - X.R0 * 0.62) * 0.9; e.lift = X.R0 * (0.5 + 0.08 * g) * (1 - K.sm(v / 0.45)); e.spin = spin31(X, 0.88) + 1.6 * K.eo(v / 1.2);
  m.body = 1; m.face = K.sm((v - 0.1) / 0.2); m.pool = K.back((v - 0.4) / 0.6); m.armL = K.back((v - 0.4) / 0.4); m.hair = K.sm((v - 0.8) / 0.45); m.armR = K.back((v - 1.2) / 0.4);
  const c0 = 1 - K.sm(v / 0.3); q.bow = 1.7 * c0 - 0.22 * K.pulse(v, 0.15, 0.6, 0.15); q.nod = c0 - 0.3 * K.pulse(v, 0.15, 0.7, 0.15); q.sink = 0.9 * (1 - up);
  q.sq = -0.42 * c0 + 0.5 * K.pulse(v, 0.08, 0.42, 0.12) + (v > 0.45 ? -0.16 * K.ring((v - 0.45) * LL, 240, 300) : 0);
  for (let i = 1; i <= 3; i++) { const bt = 0.4 * i; q.sq += -0.08 * K.pulse(v, bt - 0.14, bt, 0.05) + (v > bt ? 0.09 * K.ring((v - bt) * LL, 200, 260) : 0); }
  q.px = q.pz = 0.4 + 0.6 * Math.min(1.25, K.back((v - 0.4) / 0.55)) + (v > 0.95 ? 0.1 * K.ring((v - 0.95) * LL, 380, 420) : 0);
  q.armL = 1.1 * (1 - K.sm((v - 0.4) / 0.45)) * K.sm(v / 0.35) - 1.3 * c0 + (v > 0.8 ? 0.25 * K.ring((v - 0.8) * LL, 260, 300) : 0); q.armR = 1.1 * (1 - K.sm((v - 1.2) / 0.45)) * K.sm(v / 0.35) - 1.3 * c0 + (v > 1.6 ? 0.25 * K.ring((v - 1.6) * LL, 260, 300) : 0);
  q.hair = 0.9 * K.pulse(v, 0.1, 0.8, 0.2) - 0.8 * c0 + (v > 1.2 ? -0.3 * K.ring((v - 1.2) * LL, 300, 340) : 0);
  q.blink = 1 - K.sm((v - 0.28) / 0.1); q.wide = 0.9 * K.pulse(v, 0.25, 1.2, 0.2); q.brow = 0.8 * K.pulse(v, 0.25, 1.3, 0.2); q.looky = 0.7 * K.pulse(v, 0.2, 0.8, 0.2); q.open = K.pulse(v, 0.2, 0.6, 0.1);
  q.lookx = -K.pulse(v, 0.45, 0.8, 0.12) + K.pulse(v, 1.2, 1.55, 0.12); q.hturn = -0.45 * K.pulse(v, 0.45, 0.8, 0.15) + 0.45 * K.pulse(v, 1.2, 1.55, 0.15);
  { /* the proud look, held */ const w = K.pulse(v, 1.6, 2.12, 0.14); q.lidx = 0.4 * w; q.smile = 1 + 0.7 * w; q.tilt = 0.16 * w; q.brow += 0.5 * w; q.nod += -0.2 * w; q.sq += 0.06 * w; q.armR += 0.12 * w; q.armL += 0.12 * w; }
  { /* and a hop home: it crouches, goes back in one arc, lands with a slosh */ const p = K.cl((v - 2.2) / 0.45), ld = (v - 2.65) * LL; e.fw = 1 - K.sm(p); e.hop = 4 * p * (1 - p); q.big = 1 - K.sm(p);
    q.sq += -0.2 * K.pulse(v, 2.04, 2.2, 0.05) + 0.22 * K.pulse(v, 2.2, 2.55, 0.08) + (ld > 0 ? -0.2 * K.ring(ld, 220, 280) : 0); if (ld > 0) { const r = K.ring(ld, 300, 340); q.px += 0.14 * r; q.pz += 0.14 * r; q.hair += 0.3 * K.ring(ld, 360, 420); q.smile = 1.4; } q.looky += -0.4 * K.pulse(v, 2.1, 2.5, 0.1); }
  q.lean = v > 0.45 ? 0.08 * K.ring((v - 0.45) * LL, 420, 520) : 0; q.home = v >= 2.65; q.done = v >= 3; }
C26.evo = (f0 => function (S, t, o, q) { if (o && o.e31) return evo31(S, t, o, q); return f0(S, t, o, q); })(C26.evo);
/* curled into one round: every joint is pulled inside a ball about the middle; inside the whirlpool it is drawn right in */
function ball31(S, e, ks) { const k = e.curl, kb = e.ball; if (k < 0.002 && kb < 0.002) return; const B = S.bones, cx = B[0].position.x, cz = B[0].position.z, cy = e.R0 * 0.62 / ks, rho = e.R0 * 0.5 / ks * (1 - 0.7 * kb);
  for (let j = 1; j < B.length; j++) { const p = B[j].position, dx = p.x - cx, dy = p.y - cy, dz = p.z - cz, d = Math.hypot(dx, dy, dz) || 1e-6, f = d > rho ? rho / d : 1, s = 1 + (f - 1) * k; p.set(cx + dx * s, cy + dy * s, cz + dz * s); B[j].scale.multiplyScalar((1 + 0.35 * k * (1 - f)) * (1 - 0.72 * kb)); }
  B[0].scale.x *= 1 - 0.9 * kb; B[0].scale.z *= 1 - 0.9 * kb; }
/* a limb of the new stage unrolls like a fern: rolled up small at its root, it unwinds and lengthens with its own beat */
function fern31(S, m) { const cl = x => Math.max(0, Math.min(1, x)); S.G.chains.forEach(c => { if (c.kind !== 'limb') return; const k = cl(c.side > 0 ? m.armR : c.side < 0 ? m.armL : m.hair); if (k > 0.995) return; const jn = c.jn, B = S.bones, sd = c.side || 1, ln = 0.3 + 0.7 * k; let px = B[jn[0]].position.x, py = B[jn[0]].position.y, pz = B[jn[0]].position.z, ox = px, oy = py, oz = pz;
    for (let i = 1; i < jn.length; i++) { const b = B[jn[i]], p = b.position, dx = (p.x - ox) * ln, dy = (p.y - oy) * ln, dz = (p.z - oz) * ln, an = sd * (1 - k) * 0.85 * i, c0 = Math.cos(an), s0 = Math.sin(an); ox = p.x; oy = p.y; oz = p.z; px += dx * c0 - dy * s0; py += dx * s0 + dy * c0; pz += dz; p.set(px, Math.max(0.03, py), pz); b.scale.multiplyScalar(0.16 + 0.84 * k * k); } }); }
const N31 = N29 + N30;
function make31(T, S) { const U = u29(T), v3 = h => { const c = new T.Color(h); return 'vec3(' + c.r.toFixed(4) + ',' + c.g.toFixed(4) + ',' + c.b.toFixed(4) + ')'; }, X = { live: false, beads: [], v: new T.Vector3(), v2: new T.Vector3(), pts: Array.from({ length: 48 }, () => new T.Vector3()) };
  const NX = 40, NY = 26, T0 = 0.03, T1 = Math.PI - 0.05, g = new T.SphereGeometry(1, NX, NY, 0, 2 * Math.PI, T0, T1 - T0); g.setAttribute('p0', new T.BufferAttribute(new Float32Array(g.attributes.position.array), 3)); g.attributes.position.usage = T.DynamicDrawUsage;
  const m = new T.ShaderMaterial({ transparent: true, side: T.DoubleSide, uniforms: { t29: U.t29, r29: U.r29, spin: { value: 0 }, amt: { value: 1 } },
    vertexShader: 'attribute vec3 p0;\nvarying vec3 vP;\nvarying vec3 vN;\nvarying vec3 vV;\nvoid main() { vP = p0; vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalMatrix * normal; vV = -mv.xyz; gl_Position = projectionMatrix * mv; }',
    fragmentShader: ['uniform sampler2D t29;\nuniform vec2 r29;\nuniform float spin;\nuniform float amt;\nvarying vec3 vP;\nvarying vec3 vN;\nvarying vec3 vV;', N31, '#define PAPER31 ' + v3(W30.C.paper),
      'void main() { vec3 n = normalize(vN); if (!gl_FrontFacing) n = -n; float nv = clamp(dot(n, normalize(vV)), 0.0, 1.0), c = cos(spin), s = sin(spin);',
      'vec3 bp = vec3(c * vP.x - s * vP.z, vP.y, s * vP.x + c * vP.z); float lon = atan(bp.z, bp.x), s9 = r29.y / 720.0, gr = N29(gl_FragCoord.xy / s9 * 0.9);',
      'float nz = N30(bp * 2.3), nz2 = N30(bp * 6.1 + 5.0);',
      'vec3 bg = texture2D(t29, gl_FragCoord.xy / r29).rgb; float lum = dot(bg, vec3(0.3, 0.59, 0.11)); vec3 base = mix(PAPER31 * (0.985 + 0.03 * gr), bg, smoothstep(0.60, 0.74, lum));',
      'float l9 = dot(n, normalize(vec3(-0.6, 0.62, 0.5)));',
      'float sp = sin(lon * 2.0 + vP.y * 4.6 + 2.2 * (nz - 0.5)), band = smoothstep(0.1, 0.7, sp), lite = smoothstep(-0.25, -0.8, sp);',
      'float hl = smoothstep(0.80, 0.87, l9 + 0.42 * (nz - 0.5));',
      'hl = max(hl, lite * smoothstep(0.1, 0.45, l9) * smoothstep(0.50, 0.58, nz2));',
      'float ed = clamp(smoothstep(0.45, 0.95, 1.0 - nv + 0.3 * (nz - 0.5)), 0.0, 1.0), s2 = smoothstep(0.12, -0.14, l9 + 0.3 * (nz - 0.5));',
      'vec3 wash = mix(vec3(0.64, 0.80, 0.945), vec3(0.40, 0.59, 0.84), max(ed, 0.8 * band)); wash = mix(wash, vec3(0.36, 0.52, 0.78), 0.62 * s2); wash = mix(wash, vec3(1.0), 0.4 * lite);',
      'float a9 = (1.0 - hl) * (0.80 + 0.20 * nz2) * (0.93 + 0.07 * gr);',
      'if (!gl_FrontFacing) { wash = mix(wash, vec3(0.40, 0.57, 0.82), 0.45); a9 = max(a9, 0.7); }',
      'gl_FragColor = vec4(base * mix(vec3(1.0), wash, a9 * amt), 1.0); }'].join('\n') });
  const sph = X.sph = new T.Mesh(g, m); sph.renderOrder = 20; sph.frustumCulled = false; sph.visible = false; sph.userData.plain = true; sph.userData.nobox = true; sph.castShadow = false;
  X.NX = NX; X.NY = NY; X.T0 = T0; X.T1 = T1; X.tp = topo30(g); X.src = src30(X.tp, { mesh: sph, rs: 1, seed: 7700, o: { smooth: 2, min: 5, wob: 0.8 } });
  /* the wash on the bench under it: a soft round that spreads, then a ring that runs out and dries */
  const gm = new T.ShaderMaterial({ transparent: true, depthWrite: false, blending: T.MultiplyBlending, uniforms: { r0: { value: 0 }, r1: { value: 0.3 }, amt: { value: 0 }, sd: { value: 1.7 } },
    vertexShader: 'varying vec2 vU;\nvoid main() { vU = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: ['uniform float r0;\nuniform float r1;\nuniform float amt;\nuniform float sd;\nvarying vec2 vU;', N29,
      'void main() { float d = length(vU), nz = N29(vU * 5.0 + sd), n2 = N29(vU * 19.0 + sd * 1.7), dd = d + 0.09 * (nz - 0.5) * (0.4 + r1) + 0.02 * (n2 - 0.5);',
      'float outer = 1.0 - smoothstep(r1 - 0.03, r1, dd), inner = smoothstep(r0 - 0.14, r0 + 0.02, dd), tide = smoothstep(r1 - 0.085, r1 - 0.03, dd) * outer;',
      'float a = clamp(amt * outer * inner * (0.4 + 0.6 * tide) * (0.75 + 0.4 * nz), 0.0, 1.0); gl_FragColor = vec4(mix(vec3(1.0), vec3(0.50, 0.68, 0.88), a), 1.0); }'].join('\n') });
  const gw = X.gw = new T.Mesh(new T.PlaneGeometry(2, 2), gm); gw.rotation.x = -Math.PI / 2; gw.renderOrder = 17; gw.visible = false; gw.userData.plain = true; gw.userData.nobox = true; gw.frustumCulled = false;
  const bm = mat30(T, 'p', { k: 0.3, off: 5.1, hatch: 7, key: 'e31' }), bg = new T.SphereGeometry(1, 12, 9);
  for (let i = 0; i < 18; i++) { const b = new T.Mesh(bg, bm); b.renderOrder = 20; b.visible = false; b.frustumCulled = false; b.castShadow = false; b.userData.plain = true; b.userData.nobox = true; X.beads.push({ m: b, src: src30(W30.sph, { mesh: b, rs: 1, seed: 8100 + i * 700, o: { smooth: 2, min: 3, wob: 0.6 } }), h: h30(i * 97 + 5), h2: h30(i * 131 + 9), h3: h30(i * 53 + 2) }); }
  /* the pencil: a second pen, lighter and thinner */ const P2 = X.pen2 = pen30(T, S), pc = new T.Color(W30.C.pencil); P2.mesh.material.uniforms.col.value.set(pc.r, pc.g, pc.b); P2.mesh.renderOrder = 18; if (P2.mesh.parent) P2.mesh.parent.remove(P2.mesh);
  return X; }
/* the ball's shape for this frame: closed, or opened from the top like a bud (every line of longitude bent out and down above its hinge) */
function shape31(X, open, flat) { const g = X.sph.geometry, pos = g.attributes.position, A = pos.array, NX = X.NX, NY = X.NY, T0 = X.T0, dT = (X.T1 - T0) / NY, TH = 0.66 * Math.PI, ih = Math.round((TH - T0) / dT);
  for (let ix = 0; ix <= NX; ix++) { const ph = ix / NX * 2 * Math.PI, k = Math.min(1.15, open * (1 + 0.13 * Math.cos(5 * ph + 1.0) + 0.06 * Math.cos(3 * ph))), cph = Math.cos(ph), sph = Math.sin(ph), th = T0 + ih * dT, b0 = Math.PI - th; let r = Math.sin(th), y = Math.cos(th);
    for (let iy = NY; iy >= 0; iy--) { const i = 3 * (iy * (NX + 1) + ix), t2 = T0 + iy * dT; if (iy >= ih || k < 0.001) { r = Math.sin(t2); y = Math.cos(t2); } else { const a = (ih - iy - 0.5) * dT, be = b0 + a * (1 - 1.9 * k) - 0.55 * k; r += Math.cos(be) * dT; y += Math.sin(be) * dT; }
      const yy = -1 + (y + 1) * (1 - 0.96 * flat), rr = r * (1 + 0.25 * flat); A[i] = -rr * cph; A[i + 1] = Math.max(-1, yy); A[i + 2] = rr * sph; } }
  pos.needsUpdate = true; g.computeVertexNormals(); const P = X.tp.P, F = X.tp.first; for (let w = 0; w < F.length; w++) { const i = 3 * F[w]; P[3 * w] = A[i]; P[3 * w + 1] = A[i + 1]; P[3 * w + 2] = A[i + 2]; } }
/* one frame of everything that is not the body: the ball, the beads and drops, the wash on the bench */
function stage31(S, X, grp, e, o, ks) { const K = RK, hold = grp.parent, T = S.T; if (!hold) return; const scene = hold.parent || hold, hs = hold.scale.x * grp.scale.x; X.live = true; X.e = e; X.o = o;
  if (X.sph.parent !== hold) hold.add(X.sph); [X.gw, X.pen2.mesh].concat(X.beads.map(b => b.m)).forEach(m => { if (m.parent !== scene) scene.add(m); });
  const R = e.R / ks, sph = X.sph, show = e.R > 0.01 && !(e.v > 1.25), cyL = grp.position.y + (e.cy / ks) * grp.scale.y; sph.visible = show;
  if (show) { const wob = e.b >= 0 && e.v < 0 ? 0.05 * Math.sin(e.spin * 2.0) * (1 - (e.tight || 0)) : 0, sink = e.v > 0.6 ? 1 - 0.6 * K.sm((e.v - 0.6) / 0.6) : 1; shape31(X, e.open, e.flat);
    sph.position.set(grp.position.x, cyL - (e.cy - e.R) / ks * grp.scale.y * e.flat, grp.position.z); sph.scale.set(R * (1 + wob) * sink * grp.scale.x, R * (1 - wob) * grp.scale.y, R * (1 + wob) * sink * grp.scale.z); sph.rotation.x = -hold.rotation.x * e.flat; sph.material.uniforms.spin.value = e.spin; sph.material.uniforms.amt.value = 1 - 0.35 * e.flat; }
  hold.updateMatrixWorld(true); const C = X.c || (X.c = new T.Vector3()), G0 = X.g0 || (X.g0 = new T.Vector3()); C.set(grp.position.x, cyL, grp.position.z).applyMatrix4(hold.matrixWorld); const Rw = X.Rw = Math.max(e.R, e.R0 * 0.62) * hs / ks, R0w = e.R0 * hs / ks, g31 = o.g31 || {};
  G0.setFromMatrixPosition(hold.matrixWorld); if (g31.y != null) G0.y = g31.y; X.gy = G0.y;
  /* the wash under it */ { const gw = X.gw, U = gw.material.uniforms, ext = R0w * 7; gw.position.set(G0.x, G0.y + 0.012, G0.z); gw.scale.set(ext, ext, 1); let r0 = 0, r1 = 0.1, amt = 0;
    if (e.v >= 0) { const w = K.eo(e.v / 1.5); r1 = 0.2 + 0.78 * w; r0 = Math.max(0, r1 - 0.2 + 0.06 * w) * K.sm(e.v / 0.3); amt = 0.9 * (1 - K.sm((e.v - 0.8) / 1.3)); } else if (e.b >= 0) { r1 = 0.1 + 0.1 * K.sm(e.b / 0.9); amt = 0.75 * K.sm(e.b / 0.3); }
    U.r0.value = r0; U.r1.value = r1; U.amt.value = amt; gw.visible = amt > 0.01; }
  /* beads: they run in across the bench; they go round the ball; they are thrown out and fall back */
  X.beads.forEach((B, i) => { const m = B.m; let vis = false, x = 0, y = 0, z = 0, r = 0.1 * R0w;
    if (e.v >= 0) { const Tf = 0.75 + 0.5 * B.h, ta = e.v / Tf, an = i / 18 * 6.2832 + 2 * B.h2, D = (1.6 + 3.2 * B.h3) * R0w * (1 + 0.12 * e.g), Hm = (1.0 + 1.6 * B.h) * R0w; if (ta < 1) { vis = true; x = C.x + Math.cos(an) * D * ta; z = C.z + Math.sin(an) * D * ta * 0.8 + 0.3 * D * ta; y = G0.y + (C.y - G0.y) * (1 - ta) + 4 * Hm * ta * (1 - ta); r = (0.07 + 0.08 * B.h2) * R0w * (1 - 0.3 * ta); } }
    else if (e.b >= 0) { const n = 5 + e.g; if (i < n) { const an = e.spin * 1.7 + i / n * 6.2832, rad = (1.5 - 0.32 * (e.tight || 0)) * Rw / hs, k = K.sm((e.b - 0.05 * i) / 0.2); if (k > 0.02) { vis = true; const yy = 0.18 * rad * Math.sin(an + 0.6) + 0.08 * rad * Math.sin(2 * an + i), zz = Math.sin(an) * rad, tq = -hold.rotation.x + 0.12, ct = Math.cos(tq), st = Math.sin(tq); X.v.set(grp.position.x + Math.cos(an) * rad, cyL + yy * ct - zz * st, grp.position.z + yy * st + zz * ct).applyMatrix4(hold.matrixWorld); x = X.v.x; y = X.v.y; z = X.v.z; r = (0.07 + 0.06 * B.h) * R0w * k; } } }
    else if (i < 12) { const p = K.cl((e.a * 1.3 - 0.08 - 0.06 * i) / 0.5); if (p > 0 && p < 1) { vis = true; const an = i / 12 * 6.2832 + 1.3 * B.h, D = (3.5 + 3.5 * B.h2) * R0w, w = 1 - p * p * p, sw = an + 0.9 * (1 - w); x = G0.x + Math.cos(sw) * D * w; z = G0.z + Math.sin(sw) * D * w * 0.8 + 0.35 * D * w; r = (0.1 + 0.1 * B.h3) * R0w * (1 - 0.4 * p); y = G0.y + r * 0.8; } }
    m.visible = vis; if (vis) { m.position.set(x, y, z); m.scale.setScalar(Math.max(1e-4, r)); } }); }
function end31(S) { const X = S.x31; if (S.e31) { if (S.e31.gg.parent) S.e31.gg.parent.remove(S.e31.gg); S.e31 = null; S.root.visible = true; } if (!X || !X.live) return; X.live = false; X.sph.visible = false; X.gw.visible = false; X.pen2.mesh.visible = false; X.beads.forEach(b => { b.m.visible = false; }); }
/* the pen's part: the ball's outline, the strokes that turn on it, the spray ring, the beads, flecks; the pencil's lines on the bench */
function ink31(T, S, X, ren, cam) { const R = S.pen30, e = X.e, K = RK, sz = ren.getDrawingBufferSize(W30.v2 || (W30.v2 = new T.Vector2())), Wd = sz.x, Ht = sz.y, sc = Ht / 720, pe = cam.projectionMatrix.elements, P10 = pe[10], P11 = pe[11];
  const lw = Math.max(R.lw || 2, 1.9 * sc), fs = lw / (W30.lw * sc), s2 = sc * Math.min(1.6, Math.max(0.5, fs)), Rw = X.Rw, d = 0.06 * Rw, pts = X.pts, cp = X.v.setFromMatrixPosition(cam.matrixWorld), C = X.c, G0 = X.g0, P2 = X.pen2;
  P2.vp = R.vp; P2.boil = R.boil; P2.nv = 0; P2.ni = 0; P2.mesh.visible = true;
  if (X.sph.visible) { X.sph.updateMatrixWorld(true); proj30(R, X.src, R.vp, Wd, Ht, P10, P11, d * 0.3); sil30(R, X.src, lw * 1.05, s2, Wd, Ht); const M = X.sph.matrixWorld;
    if (e.open < 0.5) { /* strokes that land on the turning water, go round with it and lift */ const n = 8 + 2 * e.g, fade = 1 - e.open * 2;
      for (let i = 0; i < n; i++) { const h = h30(i * 71 + 3), h2 = h30(i * 37 + 11), life = K.mod(e.spin * (0.22 + 0.1 * h) + h2, 1), len = (0.8 + 1.2 * h) * Math.sin(Math.PI * life) * fade, lat0 = -0.9 + 1.8 * ((i + 0.5) / n), l0 = -e.spin * (1.15 + 0.5 * h2) + i * 2.4, N = 12; if (len < 0.12) continue; let k = 0;
        for (let j = 0; j <= N; j++) { const lo = l0 - len * j / N, la = lat0 + 0.32 * (j / N - 0.5) * len, cl = Math.cos(la), p = pts[k]; p.set(Math.cos(lo) * cl * 1.012, Math.sin(la) * 1.012, Math.sin(lo) * cl * 1.012).applyMatrix4(M); const fr = (p.x - C.x) * (cp.x - p.x) + (p.y - C.y) * (cp.y - p.y) + (p.z - C.z) * (cp.z - p.z); if (fr > 0.12 * Rw * cp.distanceTo(p)) k++; else if (k) break; }
        if (k >= 3) free30(R, pts.slice(0, k), lw * (0.6 + 0.3 * h), s2, Wd, Ht, P10, P11, d * 0.5, 9700 + i * 40, { smooth: 2, wob: 0.7, min: 4 }); } }
    if (e.b >= 0 && e.v < 0) { /* the ring of spray round it: broken arcs, faster than the water */ const tq = -X.sph.parent.rotation.x + 0.12, ct = Math.cos(tq), st = Math.sin(tq), n = 3 + (e.g > 3 ? 1 : 0), u = (1.5 - 0.32 * (e.tight || 0)) * (Rw / Math.max(1e-6, e.R * X.Rw / Math.max(e.R, e.R0 * 0.62))) * 1.0, kk = K.sm(e.b / 0.25);
      for (let i = 0; i < n; i++) { const a0 = e.spin * 1.7 + i / n * 6.2832 + 0.5, len = (0.5 + 0.7 * kk) * (0.7 + 0.3 * Math.sin(i * 1.7)), N = 10; for (let j = 0; j <= N; j++) { const an = a0 + len * j / N; const yy = 0.18 * u * Math.sin(an + 0.6), zz = Math.sin(an) * u; pts[j].set(Math.cos(an) * u, yy * ct - zz * st, yy * st + zz * ct).applyMatrix4(M); } free30(R, pts.slice(0, N + 1), lw * 0.7, s2, Wd, Ht, P10, P11, d * 0.2, 9900 + i * 40, { smooth: 2, wob: 0.8, min: 4 }); } } }
  X.beads.forEach(B => { if (!B.m.visible) return; B.m.updateMatrixWorld(true); proj30(R, B.src, R.vp, Wd, Ht, P10, P11, d * 0.2); sil30(R, B.src, lw * 0.75, s2, Wd, Ht); });
  const gy = X.gy + 0.03, gp = (i, r, an) => pts[i].set(G0.x + Math.cos(an) * r, gy, G0.z + Math.sin(an) * r * 0.9);
  if (e.b >= 0 && e.v < 0) { /* pencil lines on the bench curve in toward it */ const n = 7 + 2 * e.g; for (let i = 0; i < n; i++) { const h = h30(i * 19 + 7), ph = K.mod(e.b * (2.2 + 1.5 * h) + h30(i * 7 + 1), 1), r1 = Rw * (4.6 - 3.0 * ph), a0 = i / n * 6.2832 + 1.1 * ph + 0.4 * h, len = 0.55 * Math.sin(Math.PI * ph) * K.sm(e.b / 0.2); if (len < 0.08) continue; const N = 8; for (let j = 0; j <= N; j++) gp(j, Math.max(Rw * 1.2, r1 - 0.5 * Rw * j / N), a0 + len * j / N); free30(P2, pts.slice(0, N + 1), lw * 0.6, s2, Wd, Ht, P10, P11, 0.02, 10100 + i * 40, { smooth: 2, wob: 0.9, min: 4 }); } }
  if (e.v >= 0 && e.v < 1.5) { /* the splash runs out: ink flecks and a broken ring */ const w = K.eo(e.v / 1.2), n = 12 + 3 * e.g, fade = 1 - K.sm((e.v - 0.7) / 0.7);
    for (let i = 0; i < n; i++) { const h = h30(i * 23 + 5), an = i / n * 6.2832 + 0.5 * h, r = Rw * (1.2 + (3.0 + 2.6 * h) * w), ln = Rw * (0.7 * (1 - w) + 0.12) * fade; if (ln < 0.04 * Rw) continue; gp(0, r, an); gp(1, r + ln * 0.5, an + 0.02); gp(2, r + ln, an + 0.05); free30(R, pts.slice(0, 3), lw * (0.55 + 0.5 * h), s2, Wd, Ht, P10, P11, 0.02, 10500 + i * 40, { smooth: 1, wob: 0.5, min: 2 }); }
    for (let i = 0; i < 5; i++) { const a0 = i * 1.257 + 0.3 + 0.4 * w, len = 0.75 * fade, N = 8, r = Rw * (1.0 + 4.2 * w); if (len < 0.1) continue; for (let j = 0; j <= N; j++) gp(j, r * (1 + 0.03 * Math.sin(j + i)), a0 + len * j / N); free30(P2, pts.slice(0, N + 1), lw * 0.6, s2, Wd, Ht, P10, P11, 0.02, 10900 + i * 40, { smooth: 2, wob: 0.9, min: 4 }); } }
  R.pa.needsUpdate = R.ua.needsUpdate = R.ia.needsUpdate = true; R.mesh.geometry.setDrawRange(0, R.ni); P2.pa.needsUpdate = P2.ua.needsUpdate = P2.ia.needsUpdate = true; P2.mesh.geometry.setDrawRange(0, P2.ni); }
draw30 = (f0 => function (T, S, ren, cam) { f0(T, S, ren, cam); const M = S.o31 || S, X = M.x31; if (!X || !X.live || !X.e) return; try { ink31(T, S, X, ren, cam); } catch (e) { W31.err = 'ink ' + String(e && e.stack); } })(draw30);
const play31 = (f0 => function (grp, clip, t, o) { const S = grp.userData.rig2.sp; if (!S || S.g28 === 31) return f0(grp, clip, t, o);
  if (!(clip === 'evo' && o && o.from && o.from !== S.st && on31(S))) { if (S.x31 || S.e31) end31(S); return f0(grp, clip, t, o); }
  let r; try { o.e31 = 1; const X = S.x31 || (S.x31 = make31(S.T, S)), g0 = S.g28, ks = o.ks31 || 1; S.g28 = true; try { r = f0(grp, clip, t, o); } finally { S.g28 = g0; }
    const q = S.q0 || {}, e = q.e31; if (!e) return r;
    if (e.old && grp.parent) { let E = S.e31; if (!E || E.from !== o.from) { const gg = fig26(S.T, o.from, { stage: o.from }), sp = gg.userData.rig2.sp; sp.g28 = 31; sp.o31 = S; grp.parent.add(gg); E = S.e31 = { gg, from: o.from, sp }; }
      E.gg.visible = true; E.gg.position.copy(grp.position); E.gg.quaternion.copy(grp.quaternion); E.gg.scale.copy(grp.scale); S.root.visible = false; f0(E.gg, clip, t, o); ball31(E.sp, e, ks); }
    else { if (S.e31) { if (S.e31.gg.parent) S.e31.gg.parent.remove(S.e31.gg); S.e31 = null; } S.root.visible = true; if (q.m) fern31(S, q.m); ball31(S, e, ks); }
    stage31(S, X, grp, e, o, ks); } catch (err) { W31.err = String(err && err.stack); } return r; })(play26);
play26 = play31; KIT.spirit26.play = play31; KIT.spirit26.W31 = W31;
// ==== W31 END
