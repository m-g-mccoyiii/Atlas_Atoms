import io,re
p='block31.js'; s=io.open(p,encoding='utf-8').read()
def rep(a,b):
    global s
    assert s.count(a)>=1,a[:60]; s=s.replace(a,b,1)
# --- the sprout, on a clock of its own (3 beats' worth whatever the stage) ---
i=s.index("  const v = e.v = u - X.H, rise"); j=s.index("C26.evo = (f0 =>")
new = r'''  const vr = u - X.H, v = e.v = vr * 3 / X.TA, LL = L * X.TA / 3, rise = K.back(v / 0.42), up = Math.min(1, rise); e.old = false; e.a = 1; e.b = 1; e.tight = 1 - K.sm(v / 0.1); e.fw = 1;
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
'''
s=s[:i]+new+s[j:]
rep("e.still = b > 0.88 ? 1 : 0; e.tight = tight; q.big = K.sm(b / 0.5); return; }","e.still = b > 0.88 ? 1 : 0; e.tight = tight; q.big = K.sm(b / 0.5); e.fw = K.sm(b / 0.7); return; }")
rep("still: 0, tight: 0, R0: X.R0, g }","still: 0, tight: 0, fw: 0, hop: 0, R0: X.R0, g }")
# the shell: washed like the ball inside and out, gentler petals, laid flat on the bench as it lies down
rep("'if (!gl_FrontFacing) { wash = mix(vec3(0.36, 0.52, 0.78), vec3(0.50, 0.68, 0.90), band); a9 = 0.92; }',","'if (!gl_FrontFacing) { wash = mix(wash, vec3(0.40, 0.57, 0.82), 0.45); a9 = max(a9, 0.7); }',")
rep("open * (1 + 0.2 * Math.cos(5 * ph + 1.0) + 0.1 * Math.cos(11 * ph))","open * (1 + 0.13 * Math.cos(5 * ph + 1.0) + 0.06 * Math.cos(3 * ph))")
rep("sph.material.uniforms.spin.value = e.spin; }","sph.rotation.x = -hold.rotation.x * e.flat; sph.material.uniforms.spin.value = e.spin; sph.material.uniforms.amt.value = 1 - 0.35 * e.flat; }")
rep("show = e.R > 0.01 && !(e.v > 1.45)","show = e.R > 0.01 && !(e.v > 1.25)")
rep("sink = e.v > 0.95 ? 1 - 0.45 * K.sm((e.v - 0.95) / 0.45) : 1;","sink = e.v > 0.6 ? 1 - 0.6 * K.sm((e.v - 0.6) / 0.6) : 1;")
rep("r0 = Math.max(0, r1 - 0.26 + 0.1 * w) * K.sm(e.v / 0.3); amt = 1.1 * (1 - K.sm((e.v - 1.0) / 1.3));","r0 = Math.max(0, r1 - 0.2 + 0.06 * w) * K.sm(e.v / 0.3); amt = 0.9 * (1 - K.sm((e.v - 0.8) / 1.3));")
# the ring of drops and spray lies level with the bench (the figure's own frame leans to the eye), a little tipped
rep("X.v.set(grp.position.x + Math.cos(an) * rad, cyL + 0.22 * rad * Math.sin(an + 0.6) + 0.1 * rad * Math.sin(2 * an + i), grp.position.z + Math.sin(an) * rad).applyMatrix4(hold.matrixWorld);",
    "const yy = 0.18 * rad * Math.sin(an + 0.6) + 0.08 * rad * Math.sin(2 * an + i), zz = Math.sin(an) * rad, tq = -hold.rotation.x + 0.12, ct = Math.cos(tq), st = Math.sin(tq); X.v.set(grp.position.x + Math.cos(an) * rad, cyL + yy * ct - zz * st, grp.position.z + yy * st + zz * ct).applyMatrix4(hold.matrixWorld);")
rep("pts[j].set(Math.cos(an) * u, 0.22 * u * Math.sin(an + 0.6), Math.sin(an) * u).applyMatrix4(M); }","const yy = 0.18 * u * Math.sin(an + 0.6), zz = Math.sin(an) * u; pts[j].set(Math.cos(an) * u, yy * ct - zz * st, yy * st + zz * ct).applyMatrix4(M); }")
rep("const n = 3 + (e.g > 3 ? 1 : 0), u =","const tq = -X.sph.parent.rotation.x + 0.12, ct = Math.cos(tq), st = Math.sin(tq), n = 3 + (e.g > 3 ? 1 : 0), u =")
rep("r = (0.07 + 0.07 * B.h3) * R0w * (1 - 0.4 * p); y = G0.y + r * 0.8;","r = (0.1 + 0.1 * B.h3) * R0w * (1 - 0.4 * p); y = G0.y + r * 0.8;")
io.open(p,'w',encoding='utf-8',newline='\n').write(s)
p='s31.js'; s=io.open(p,encoding='utf-8').read()
i=s.index("      if (R21.evo) { const Q = HEVO.pos"); j=s.index("      if (e.b >= 0 && tl) once('rise31'")
new = r'''      if (R21.evo) { const Q = HEVO.pos || (HEVO.pos = {}), h0 = homObj.h0 || 3, v = S31.v;
        if (E.big31 == null) { /* how large it may grow and how far it comes toward the eye: the whole of the sprouting form in the picture, its foot above the molecule's row */ let B = 1.6, fw = 0; for (; B >= 1; B -= 0.1) { const Hs = h0 * E.s1 * B * 1.45; for (fw = 0; fw < 9; fw += 0.25) { v.set(HOMP.x, Hs * 0.697, HOMP.z + fw - Hs * 0.717).project(cam); if (v.y < 0.94) break; } v.set(HOMP.x, 0, HOMP.z + fw).project(cam); if (v.y > 0.42) break; } E.big31 = Math.max(1, B); E.fwN = fw; }
        const big = 1 + (E.big31 - 1) * q.big, s = (E.s0 + (E.s1 - E.s0) * e.sk) * big; homObj.s = s; E.ks31 = s / E.s0; Q.sx = 1; Q.sy = 1; Q.x = HOMP.x; Q.z = HOMP.z + E.fwN * (e.fw || 0); E.fw31 = E.fwN * (e.fw || 0); Q.y = e.lift * E.s0 * big + (e.hop || 0) * 0.5 * h0 * E.s1;
        E.g31 = { y: s27K(Q.x, Q.z, 1) > 0.5 ? 0.03 : -0.232 }; }
'''
s=s[:i]+new+s[j:]
s=s.replace("const W = AA.rxKit.spirit26.W31 || {}, L = E.L","const L = E.L").replace("fw: R21.evo.fw31,","fw: R21.evo.fwN, big: R21.evo.big31,")
io.open(p,'w',encoding='utf-8',newline='\n').write(s)
