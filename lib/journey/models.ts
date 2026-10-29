import * as THREE from "three";
import {
  headTexture,
  parcelTexture,
  containerBumpTexture,
  containerDoorTexture,
  containerSideTexture,
  containerTopTexture,
  decalTexture,
  hazardTexture,
  rng,
} from "./textures";

/* ------------------------------------------------------------------ */
/* Dimensions (metres). One 40ft ISO high-cube is the hero of the film */
/* ------------------------------------------------------------------ */
export const CONTAINER = { L: 12.19, H: 2.59, W: 2.44 };
export const TRAILER_DECK = 1.45;
/** Vertical distance from the stacker's boom tip to the spreader's lower face. */
export const STACKER_SPREADER_DROP = 1.45;
/** Pivot of the reach stacker boom, stacker-local. */
export const BOOM_PIVOT = new THREE.Vector2(-3.5, 3.25);

export type Mats = ReturnType<typeof createMaterials>;

export function createMaterials() {
  const std = (color: number, metalness = 0.2, roughness = 0.55, extra: THREE.MeshStandardMaterialParameters = {}) =>
    new THREE.MeshStandardMaterial({ color, metalness, roughness, ...extra });
  const hazard = hazardTexture();
  return {
    brand: std(0x1d55d6, 0.35, 0.38),
    brandDark: std(0x143c99, 0.35, 0.42),
    navy: std(0x18233d, 0.3, 0.55),
    charcoal: std(0x2b3038, 0.45, 0.5),
    charcoal2: std(0x3b414b, 0.5, 0.45),
    steel: std(0x9aa1aa, 0.85, 0.32),
    chrome: std(0xe3e7ec, 1, 0.12),
    rubber: std(0x121315, 0, 0.92),
    rim: std(0xb8bec7, 0.9, 0.28),
    glass: std(0x0d1726, 0.95, 0.06, { envMapIntensity: 1.6 }),
    white: std(0xf2f4f6, 0.15, 0.5),
    offwhite: std(0xd9dde3, 0.2, 0.6),
    red: std(0xb4232c, 0.25, 0.5),
    hazard: std(0xffffff, 0.2, 0.55, { map: hazard }),
    lamp: new THREE.MeshStandardMaterial({ color: 0xfff3cf, emissive: 0xfff0c2, emissiveIntensity: 2.2 }),
    tail: new THREE.MeshStandardMaterial({ color: 0x8a0f12, emissive: 0xff2a2a, emissiveIntensity: 1.4 }),
    beacon: new THREE.MeshStandardMaterial({ color: 0xff9a1f, emissive: 0xff7a00, emissiveIntensity: 1.6 }),
    // lit only after dusk — intensities are driven by the scene's `night` value
    windowGlow: std(0x101a2a, 0.6, 0.15, { emissive: 0xffd28a, emissiveIntensity: 0 }),
    flood: new THREE.MeshStandardMaterial({ color: 0xdfe6ee, emissive: 0xfff4dc, emissiveIntensity: 0.2 }),
    skin: std(0xd29a76, 0, 0.62),
    hair: std(0x2b1e16, 0, 0.88),
    // cotton piqué polo — matte, so the courier doesn't read as plastic
    polo: std(0x1f4fb8, 0, 0.92),
    hairLight: std(0x3b2a20, 0, 0.9),
    chinos: std(0x2b303b, 0, 0.8),
    sneaker: std(0xf3f3f1, 0, 0.6),
    sole: std(0x1c1c1e, 0, 0.9),
    eye: std(0x1a1410, 0.2, 0.25),
    lip: std(0xa8645a, 0, 0.6),
    cardboard: std(0xffffff, 0, 0.85),
  };
}

/* ---------------------------- helpers ----------------------------- */
const UNIT_BOX = new THREE.BoxGeometry(1, 1, 1);

/** Box from axis ranges — keeps the model code close to a spec sheet. */
function bx(parent: THREE.Object3D, mat: THREE.Material, x: [number, number], y: [number, number], z: [number, number]) {
  const m = new THREE.Mesh(UNIT_BOX, mat);
  m.scale.set(x[1] - x[0], y[1] - y[0], z[1] - z[0]);
  m.position.set((x[0] + x[1]) / 2, (y[0] + y[1]) / 2, (z[0] + z[1]) / 2);
  parent.add(m);
  return m;
}

const cylCache = new Map<string, THREE.CylinderGeometry>();
function cylGeo(r: number, h: number, seg = 28) {
  const k = `${r}|${h}|${seg}`;
  let g = cylCache.get(k);
  if (!g) {
    g = new THREE.CylinderGeometry(r, r, h, seg);
    cylCache.set(k, g);
  }
  return g;
}

/** Wheel rolling about local Z. Rotate `wheel.rotation.z` to roll. */
function wheel(M: Mats, r: number, w: number) {
  const g = new THREE.Group();
  const tire = new THREE.Mesh(cylGeo(r, w, 32), M.rubber);
  tire.rotation.x = Math.PI / 2;
  g.add(tire);
  for (const s of [-1, 1]) {
    const rim = new THREE.Mesh(cylGeo(r * 0.62, 0.02, 24), M.rim);
    rim.rotation.x = Math.PI / 2;
    rim.position.z = s * (w / 2 + 0.005);
    g.add(rim);
    const hub = new THREE.Mesh(cylGeo(r * 0.22, 0.06, 12), M.charcoal);
    hub.rotation.x = Math.PI / 2;
    hub.position.z = s * (w / 2 + 0.02);
    g.add(hub);
    // lug bolts make rotation readable even at speed
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const b = new THREE.Mesh(cylGeo(r * 0.045, 0.05, 6), M.chrome);
      b.rotation.x = Math.PI / 2;
      b.position.set(Math.cos(a) * r * 0.38, Math.sin(a) * r * 0.38, s * (w / 2 + 0.03));
      g.add(b);
    }
  }
  return g;
}

function decal(tex: THREE.Texture, w: number, h: number) {
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: 0.5, metalness: 0.1, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 })
  );
  return m;
}

/** Orient a unit-height Y cylinder between two points. */
const _up = new THREE.Vector3(0, 1, 0);
const _d = new THREE.Vector3();
export function stretch(mesh: THREE.Object3D, a: THREE.Vector3, b: THREE.Vector3) {
  _d.subVectors(b, a);
  const len = _d.length();
  mesh.position.addVectors(a, b).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(_up, _d.normalize());
  mesh.scale.set(1, Math.max(len, 0.0001), 1);
}

/* --------------------------- container ---------------------------- */
export function containerMaterials(M: Mats, side: THREE.Texture, color = 0xffffff) {
  const bump = containerBumpTexture();
  const door = containerDoorTexture();
  const top = containerTopTexture();
  const sideMat = new THREE.MeshStandardMaterial({ color, map: side, bumpMap: bump, bumpScale: 2.2, metalness: 0.35, roughness: 0.48 });
  const doorMat = new THREE.MeshStandardMaterial({ color, map: door, metalness: 0.35, roughness: 0.5 });
  const topMat = new THREE.MeshStandardMaterial({ color, map: top, metalness: 0.3, roughness: 0.55 });
  const bottomMat = M.charcoal;
  // BoxGeometry face order: +x, -x, +y, -y, +z, -z
  return [doorMat, doorMat, topMat, bottomMat, sideMat, sideMat];
}

/** Container geometry with its origin at the centre of the floor. */
export function containerGeometry() {
  const g = new THREE.BoxGeometry(CONTAINER.L, CONTAINER.H, CONTAINER.W);
  g.translate(0, CONTAINER.H / 2, 0);
  return g;
}

export function buildHeroContainer(M: Mats) {
  const side = containerSideTexture({ text: "ELIV", sub: "LOGISTICS · EVERY LEG OF THE JOURNEY", color: "#1d55d6" });
  const mats: THREE.Material[] = containerMaterials(M, side, 0xffffff);
  const doorMat = mats[0] as THREE.MeshStandardMaterial;
  // the +X end is open; hinged door leaves cover it instead
  mats[0] = new THREE.MeshBasicMaterial({ visible: false });
  const mesh = new THREE.Mesh(containerGeometry(), mats);
  const { L, H, W } = CONTAINER;

  // interior: an inward-facing box so the open doors reveal a real cargo space
  const wall = new THREE.MeshStandardMaterial({ color: 0x5b6169, roughness: 0.8, metalness: 0.3, side: THREE.BackSide });
  const floor = new THREE.MeshStandardMaterial({ color: 0x7a5a3c, roughness: 0.9, side: THREE.BackSide });
  const inner = new THREE.Mesh(new THREE.BoxGeometry(L - 0.12, H - 0.16, W - 0.12), [wall, wall, wall, floor, wall, wall]);
  inner.position.y = H / 2 + 0.02;
  inner.userData.noShadow = true;
  mesh.add(inner);

  const hinges: THREE.Group[] = [];
  for (const s of [1, -1]) {
    const hinge = new THREE.Group();
    hinge.position.set(L / 2, 0, (s * W) / 2);
    const tex = (doorMat.map as THREE.Texture).clone();
    tex.repeat.set(0.5, 1);
    tex.offset.set(s > 0 ? 0 : 0.5, 0);
    tex.needsUpdate = true;
    const leafMat = new THREE.MeshStandardMaterial({ map: tex, metalness: 0.35, roughness: 0.5 });
    bx(hinge, leafMat, [0.0, 0.06], [0.06, H - 0.04], s > 0 ? [-W / 2, 0] : [0, W / 2]);
    for (const z of [0.3, 0.75]) bx(hinge, M.charcoal, [0.06, 0.1], [0.12, H - 0.1], s > 0 ? [-z - 0.03, -z + 0.03] : [z - 0.03, z + 0.03]);
    hinge.userData.sign = s;
    hinges.push(hinge);
    mesh.add(hinge);
  }
  /** 0 = closed, 1 = swung open ~115°. */
  const setDoors = (open: number) => {
    for (const h of hinges) h.rotation.y = -h.userData.sign * open * 2.0;
  };
  setDoors(0);

  // corner castings
  const cast = new THREE.Group();
  const hx = L / 2, hz = W / 2;
  for (const sx of [-1, 1]) for (const top of [false, true]) for (const sz of [-1, 1]) {
    bx(cast, M.charcoal, [sx * hx - 0.1, sx * hx + 0.1], top ? [H - 0.12, H + 0.01] : [-0.01, 0.12], [sz * hz - 0.1, sz * hz + 0.1]);
  }
  mesh.add(cast);

  // already packed: cartons fill it from the back wall, leaving a waist-high step at the doors
  const cargo = buildCargo();
  mesh.add(cargo);

  /** Where the courier's parcel comes to rest: on top of the front step, the last one in. */
  const parcelSocket = new THREE.Object3D();
  parcelSocket.position.set(CARGO.stepX, CARGO.floor + CARGO.stepH, 0.32);
  mesh.add(parcelSocket);
  return { mesh, setDoors, parcelSocket };
}

/* ----------------------------- courier ---------------------------- */
export function buildParcel(M: Mats) {
  const g = new THREE.Group();
  const mat = M.cardboard.clone();
  mat.map = parcelTexture();
  const box = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.42, 0.44), mat);
  box.position.y = 0.21; // origin on the bottom face
  g.add(box);
  return g;
}

/** Cargo packing inside the hero container (container-local metres). */
export const CARGO = { floor: 0.14, stepX: 5.08, stepH: 0.84, frontX: 4.5 };

/**
 * Cartons packed from the back wall to `frontX`, then a two-high step at the
 * doors. One InstancedMesh — a few hundred boxes for a single draw call.
 */
function buildCargo() {
  const r = rng(77);
  const { L, W } = CONTAINER;
  const back = -L / 2 + 0.1;
  const halfW = W / 2 - 0.1;
  const boxes: { x: number; y: number; z: number; w: number; h: number; d: number; tint: number }[] = [];
  const tints = [0xffffff, 0xf3e3cc, 0xe8d2b4, 0xfdf8f0, 0xd9c2a0];
  const column = (x0: number, depth: number, maxH: number) => {
    let z = -halfW;
    while (z < halfW - 0.2) {
      const w = Math.min(halfW - z, 0.42 + r() * 0.3);
      let y = CARGO.floor;
      const top = maxH - r() * 0.35;
      while (true) {
        const h = 0.32 + Math.floor(r() * 3) * 0.09;
        if (y + h > top) break;
        boxes.push({ x: x0 + depth / 2, y, z: z + w / 2, w: w - 0.02, h: h - 0.01, d: depth - 0.02, tint: tints[Math.floor(r() * tints.length)] });
        y += h;
      }
      z += w;
    }
  };
  for (let x = back; x < CARGO.frontX - 0.4; ) {
    const d = 0.48 + r() * 0.2;
    column(x, d, 2.32);
    x += d;
  }
  // the step the courier tops off
  for (const zc of [-0.62, 0.0, 0.62]) {
    for (const y of [0, 0.42]) boxes.push({ x: CARGO.stepX - 0.1, y: CARGO.floor + y, z: zc, w: 0.6, h: 0.41, d: 0.95, tint: tints[Math.floor(r() * tints.length)] });
  }

  const geo = new THREE.BoxGeometry(1, 1, 1);
  geo.translate(0, 0.5, 0);
  const mat = new THREE.MeshStandardMaterial({ map: parcelTexture(), roughness: 0.85 });
  const inst = new THREE.InstancedMesh(geo, mat, boxes.length);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), pos = new THREE.Vector3(), sc = new THREE.Vector3(), col = new THREE.Color();
  boxes.forEach((b, i) => {
    m4.compose(pos.set(b.x, b.y, b.z), q, sc.set(b.d, b.h, b.w));
    inst.setMatrixAt(i, m4);
    inst.setColorAt(i, col.setHex(b.tint));
  });
  inst.userData.noShadow = true;
  return inst;
}

/** Tapered limb segment hanging down from its pivot (length along -Y). */
function limb(parent: THREE.Object3D, mat: THREE.Material, rTop: number, rBottom: number, len: number) {
  const g = new THREE.CylinderGeometry(rTop, rBottom, len, 14);
  g.translate(0, -len / 2, 0);
  const m = new THREE.Mesh(g, mat);
  parent.add(m);
  const joint = new THREE.Mesh(new THREE.SphereGeometry(rBottom, 12, 8), mat);
  joint.position.y = -len;
  parent.add(joint);
  return m;
}

/**
 * Sculpted limb hanging down from its pivot: `profile` is [fraction of length, radius]
 * from the joint down, so thighs and calves get real muscle shape instead of tubes.
 */
function shapedLimb(parent: THREE.Object3D, mat: THREE.Material, len: number, profile: [number, number][], squash = 1) {
  const pts = profile.map(([f, r]) => new THREE.Vector2(r, -f * len));
  pts.unshift(new THREE.Vector2(0.0001, 0));
  pts.push(new THREE.Vector2(0.0001, -len));
  const m = new THREE.Mesh(new THREE.LatheGeometry(pts.reverse(), 18), mat);
  m.scale.z = squash;
  parent.add(m);
  const end = profile[profile.length - 1][1];
  const joint = new THREE.Mesh(new THREE.SphereGeometry(end, 12, 8), mat);
  joint.position.y = -len;
  parent.add(joint);
  return m;
}

function sphere(parent: THREE.Object3D, mat: THREE.Material, r: number, pos: [number, number, number], scale: [number, number, number] = [1, 1, 1]) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 20, 14), mat);
  m.position.set(...pos);
  m.scale.set(...scale);
  parent.add(m);
  return m;
}

/** Low-top sneaker, toe along +X, origin at the ankle. */
function sneaker(parent: THREE.Object3D, M: Mats) {
  const upperGeo = new THREE.CapsuleGeometry(0.046, 0.15, 6, 16);
  upperGeo.rotateZ(Math.PI / 2);
  const upper = new THREE.Mesh(upperGeo, M.sneaker);
  upper.position.set(0.055, -0.04, 0);
  upper.scale.set(1, 0.78, 0.98);
  parent.add(upper);
  // collar around the ankle, a darker toe cap and a chunky cupsole
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.012, 8, 18), M.sole);
  collar.rotation.x = Math.PI / 2;
  collar.position.set(-0.005, -0.012, 0);
  parent.add(collar);
  sphere(parent, M.offwhite, 0.046, [0.15, -0.046, 0], [0.75, 0.62, 0.96]);
  bx(parent, M.sole, [-0.06, 0.205], [-0.083, -0.066], [-0.047, 0.047]);
  bx(parent, M.brand, [-0.01, 0.12], [-0.052, -0.028], [0.044, 0.047]); // side stripe
}

/* two-bone IK scratch */
const _ikD = new THREE.Vector3();
const _ikP = new THREE.Vector3();
const _ikU = new THREE.Vector3();
const _ikE = new THREE.Vector3();
const _ikF = new THREE.Vector3();
const _ikQ = new THREE.Quaternion();
const DOWN = new THREE.Vector3(0, -1, 0);

/**
 * Two-bone IK in the shoulder's parent space: aims the upper arm and bends the
 * elbow so the hand lands on `target`, with the elbow pointing toward `pole`.
 */
function solveArm(shoulder: THREE.Vector3, target: THREE.Vector3, pole: THREE.Vector3, a: number, b: number, qSh: THREE.Quaternion, qEl: THREE.Quaternion) {
  _ikD.subVectors(target, shoulder);
  const L = THREE.MathUtils.clamp(_ikD.length(), Math.abs(a - b) + 1e-3, a + b - 1e-3);
  _ikD.normalize();
  const alpha = Math.acos(THREE.MathUtils.clamp((a * a + L * L - b * b) / (2 * a * L), -1, 1));
  _ikP.copy(pole).addScaledVector(_ikD, -pole.dot(_ikD)).normalize();
  _ikU.copy(_ikD).multiplyScalar(Math.cos(alpha)).addScaledVector(_ikP, Math.sin(alpha));
  _ikE.copy(shoulder).addScaledVector(_ikU, a);
  _ikF.subVectors(target, _ikE).normalize();
  qSh.setFromUnitVectors(DOWN, _ikU);
  _ikF.applyQuaternion(_ikQ.copy(qSh).invert());
  qEl.setFromUnitVectors(DOWN, _ikF);
}

/**
 * Delivery courier, ~1.82 m, athletic build, facing +X, origin between the feet.
 * Jointed hips/knees/shoulders/elbows. `pose(stride, carry, lean)`: stride is
 * distance walked (m) so the gait is scrub-exact; carry 0..1 brings the hands
 * onto the sides of the parcel (two-bone IK); lean 0..1 bends him forward to set it down.
 */
export function buildCourier(M: Mats) {
  const root = new THREE.Group();
  const shirt = M.polo;
  const HIP = 0.95;
  const THIGH = 0.45;
  const SHIN = 0.42;

  // legs: hip → knee → ankle, with thigh and calf muscle in the trouser line
  const legs: { hip: THREE.Group; knee: THREE.Group }[] = [];
  for (const z of [-0.1, 0.1]) {
    const hip = new THREE.Group();
    hip.position.set(0, HIP, z);
    shapedLimb(hip, M.chinos, THIGH, [[0, 0.094], [0.18, 0.092], [0.5, 0.08], [0.82, 0.064], [1, 0.058]], 0.94);
    const knee = new THREE.Group();
    knee.position.y = -THIGH;
    hip.add(knee);
    shapedLimb(knee, M.chinos, SHIN, [[0, 0.058], [0.22, 0.061], [0.55, 0.053], [0.85, 0.047], [1, 0.046]], 0.96);
    const foot = new THREE.Group();
    foot.position.y = -SHIN;
    knee.add(foot);
    sneaker(foot, M);
    root.add(hip);
    legs.push({ hip, knee });
  }

  // upper body bends at the hips
  const upper = new THREE.Group();
  upper.position.y = HIP;
  root.add(upper);
  sphere(upper, M.chinos, 0.13, [-0.008, 0.0, 0], [0.9, 0.72, 1.36]); // pelvis + seat
  bx(upper, M.charcoal, [-0.112, 0.112], [0.035, 0.068], [-0.172, 0.172]); // belt
  bx(upper, M.steel, [0.108, 0.116], [0.038, 0.065], [-0.022, 0.022]); // buckle
  // V-shaped torso: a lathe profile, flattened front-to-back, broad across the shoulders
  const torsoGeo = new THREE.LatheGeometry(
    [[0.0, 0.0], [0.135, 0.0], [0.14, 0.1], [0.152, 0.24], [0.172, 0.38], [0.172, 0.46], [0.136, 0.535], [0.062, 0.568], [0.0, 0.572]].map(([x, y]) => new THREE.Vector2(x, y)),
    32
  );
  const torso = new THREE.Mesh(torsoGeo, shirt);
  torso.position.y = 0.04;
  torso.scale.set(0.74, 1, 1.22);
  upper.add(torso);
  // polo collar + placket + chest logo
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.066, 0.017, 8, 22), M.brandDark);
  collar.rotation.x = Math.PI / 2;
  collar.position.set(0.004, 0.598, 0);
  upper.add(collar);
  bx(upper, M.brandDark, [0.118, 0.13], [0.46, 0.58], [-0.016, 0.016]);
  const logo = decal(decalTexture("ELIV", "#ffffff"), 0.12, 0.035);
  logo.position.set(0.126, 0.47, 0.095);
  logo.rotation.y = Math.PI / 2;
  upper.add(logo);

  // neck + head
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.056, 0.064, 0.08, 16), M.skin);
  neck.position.set(0.008, 0.632, 0);
  upper.add(neck);
  const head = new THREE.Group();
  head.position.set(0.014, 0.762, 0);
  upper.add(head);
  // one egg-shaped skull: broad cranium tapering into the jaw and chin
  const skullProfile = [
    [0, -0.118], [0.036, -0.116], [0.062, -0.1], [0.078, -0.07], [0.087, -0.03], [0.094, 0.01],
    [0.098, 0.05], [0.094, 0.09], [0.078, 0.122], [0.048, 0.142], [0, 0.149],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const skullMat = new THREE.MeshStandardMaterial({ map: headTexture("#d29a76", "#2b1e16"), roughness: 0.7 });
  const skull = new THREE.Mesh(new THREE.LatheGeometry(skullProfile, 40), skullMat);
  skull.scale.set(1.0, 1, 0.86);
  head.add(skull);
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.014, 0.032, 10), M.skin);
  nose.rotation.z = -Math.PI / 2 + 0.7;
  nose.position.set(0.093, -0.01, 0);
  head.add(nose);
  for (const z of [-0.032, 0.032]) {
    sphere(head, M.white, 0.011, [0.083, 0.022, z], [0.55, 0.75, 1.1]); // eye whites
    sphere(head, M.eye, 0.0068, [0.0895, 0.022, z]);
    const brow = bx(head, M.hairLight, [0.084, 0.093], [0.043, 0.049], [z - 0.019, z + 0.019]);
    brow.rotation.x = z > 0 ? -0.06 : 0.06; // relaxed, level brows
    sphere(head, M.skin, 0.02, [0.0, 0.0, z > 0 ? 0.086 : -0.086], [0.55, 1.25, 0.5]); // ears
  }
  bx(head, M.lip, [0.083, 0.09], [-0.06, -0.054], [-0.018, 0.018]); // mouth
  // courier cap in the brand blue: crown, curved brim, front logo
  const cap = new THREE.Group();
  // sits on the crown, above the brows: the brim shades the eyes without covering them
  cap.position.set(-0.008, 0.074, 0);
  head.add(cap);
  const crown = new THREE.Mesh(new THREE.SphereGeometry(0.104, 32, 12, 0, Math.PI * 2, 0, Math.PI * 0.5), M.brand);
  crown.scale.set(1.04, 0.9, 0.94);
  cap.add(crown);
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.108, 0.106, 0.03, 32, 1, true), M.brand);
  band.scale.set(1.04, 1, 0.94);
  band.position.y = -0.012;
  cap.add(band);
  const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.094, 0.094, 0.008, 28, 1, false, 0, Math.PI), M.brandDark);
  brim.scale.set(0.82, 1, 0.98);
  brim.position.set(0.082, -0.022, 0);
  brim.rotation.z = -0.1;
  cap.add(brim);
  sphere(cap, M.brandDark, 0.011, [0, 0.093, 0], [1, 0.5, 1]); // button
  const capLogo = decal(decalTexture("EL", "#ffffff"), 0.06, 0.022);
  capLogo.position.set(0.104, 0.03, 0);
  capLogo.rotation.set(0, Math.PI / 2, 0.22);
  cap.add(capLogo);

  // arms: shoulder → elbow → wrist
  const UPPER_ARM = 0.29;
  const FOREARM = 0.3; // elbow to the middle of the hand
  const arms: { sh: THREE.Group; el: THREE.Group }[] = [];
  for (const z of [-0.214, 0.214]) {
    const sh = new THREE.Group();
    sh.position.set(0, 0.532, z);
    upper.add(sh);
    sphere(sh, shirt, 0.058, [0, -0.012, 0], [0.98, 0.8, 0.94]); // deltoid
    limb(sh, shirt, 0.06, 0.056, 0.16); // short sleeve
    const hem = new THREE.Mesh(new THREE.TorusGeometry(0.056, 0.007, 6, 18), M.brandDark);
    hem.rotation.x = Math.PI / 2;
    hem.position.y = -0.16;
    sh.add(hem);
    limb(sh, M.skin, 0.05, 0.043, UPPER_ARM);
    const el = new THREE.Group();
    el.position.y = -UPPER_ARM;
    sh.add(el);
    limb(el, M.skin, 0.043, 0.032, 0.25);
    // hand: palm block with a thumb, slightly cupped
    sphere(el, M.skin, 0.042, [0.0, -FOREARM, 0], [0.62, 1.15, 0.9]);
    sphere(el, M.skin, 0.016, [0.02, -0.27, z > 0 ? -0.024 : 0.024], [1, 1.6, 1]);
    if (z < 0) {
      const watch = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.038, 0.025, 16), M.charcoal);
      watch.position.y = -0.225;
      el.add(watch);
    }
    arms.push({ sh, el });
  }

  /** Parcel rides here while carried: held against the stomach, its bottom at the hands. */
  const hands = new THREE.Object3D();
  hands.position.set(0.41, 0.3, 0);
  upper.add(hands);

  // IK goals (upper-body space): hands cup the parcel's lower side edges, elbows back and out
  const grips = [new THREE.Vector3(0.4, 0.16, -0.25), new THREE.Vector3(0.4, 0.16, 0.25)];
  const poles = [new THREE.Vector3(-1, -0.35, -0.7), new THREE.Vector3(-1, -0.35, 0.7)];
  const qFreeSh = new THREE.Quaternion(), qFreeEl = new THREE.Quaternion();
  const qIkSh = new THREE.Quaternion(), qIkEl = new THREE.Quaternion();
  const eul = new THREE.Euler();

  const pose = (stride: number, carry: number, lean: number) => {
    const ph = (stride / 0.78) * Math.PI;
    for (let i = 0; i < 2; i++) {
      const p = ph + i * Math.PI;
      const swing = Math.sin(p);
      // thigh swings; the knee folds while that leg travels forward
      legs[i].hip.rotation.z = swing * 0.42 + lean * 0.35;
      legs[i].knee.rotation.z = -(0.06 + Math.max(0, Math.cos(p)) * 0.62) - lean * 0.6;
    }
    upper.position.y = HIP - Math.abs(Math.sin(ph)) * 0.025 + 0.012 - lean * 0.1;
    upper.rotation.z = -lean * 0.62 - 0.04 * (1 - lean);
    for (let i = 0; i < 2; i++) {
      const { sh, el } = arms[i];
      // free: natural counter-swing to the legs
      const freeSwing = -Math.sin(ph + i * Math.PI) * 0.38;
      qFreeSh.setFromEuler(eul.set((i ? 1 : -1) * 0.06, 0, freeSwing + lean * 0.5));
      qFreeEl.setFromEuler(eul.set(0, 0, 0.18 + Math.max(0, freeSwing) * 0.3));
      if (carry > 0) {
        solveArm(sh.position, grips[i], poles[i], UPPER_ARM, FOREARM, qIkSh, qIkEl);
        sh.quaternion.slerpQuaternions(qFreeSh, qIkSh, carry);
        el.quaternion.slerpQuaternions(qFreeEl, qIkEl, carry);
      } else {
        sh.quaternion.copy(qFreeSh);
        el.quaternion.copy(qFreeEl);
      }
    }
  };
  pose(0, 1, 0);
  return { root, pose, hands };
}

/* ---------------------------- spreader ---------------------------- */
/**
 * Telescopic container spreader. Origin = top-centre of the main frame,
 * long axis along local Z. `setExtension(0..1)` slides the arms from a
 * 20ft to a 40ft reach. Lower face sits at y = -0.55.
 */
export function buildSpreader(M: Mats) {
  const g = new THREE.Group();
  bx(g, M.charcoal, [-0.32, 0.32], [-0.5, 0], [-3.0, 3.0]);
  bx(g, M.hazard, [-0.33, 0.33], [-0.42, -0.08], [-1.2, 1.2]);
  const arms: THREE.Group[] = [];
  for (const s of [-1, 1]) {
    const arm = new THREE.Group();
    bx(arm, M.charcoal2, [-0.24, 0.24], [-0.46, -0.06], s > 0 ? [-3.2, 0] : [0, 3.2]);
    const end = bx(arm, M.hazard, [-1.22, 1.22], [-0.55, 0], [-0.16, 0.16]);
    end.position.z = 0;
    // twistlock pins
    for (const x of [-1.05, 1.05]) bx(arm, M.steel, [x - 0.06, x + 0.06], [-0.68, -0.55], [-0.06, 0.06]);
    arms.push(arm);
    g.add(arm);
  }
  const setExtension = (e: number) => {
    const half = 3.0 + 3.095 * e;
    arms[0].position.z = -half;
    arms[1].position.z = half;
  };
  setExtension(0);
  /** Socket where a locked container hangs (container origin = floor centre). */
  const socket = new THREE.Object3D();
  socket.position.y = -0.55 - CONTAINER.H;
  socket.rotation.y = Math.PI / 2;
  g.add(socket);
  return { group: g, setExtension, socket };
}

/* -------------------------- reach stacker ------------------------- */
export function buildReachStacker(M: Mats) {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);

  bx(body, M.brand, [-4.6, 3.2], [0.75, 1.9], [-1.45, 1.45]);
  bx(body, M.navy, [-4.65, 3.25], [0.7, 0.95], [-1.5, 1.5]);
  bx(body, M.brand, [-5.6, -3.9], [0.65, 3.05], [-1.6, 1.6]); // counterweight
  bx(body, M.navy, [-5.65, -3.85], [0.6, 0.95], [-1.65, 1.65]);
  bx(body, M.brandDark, [-3.9, -1.7], [1.9, 2.75], [-1.3, 0.3]); // engine hood
  for (let i = 0; i < 5; i++) bx(body, M.charcoal, [-3.6 + i * 0.35, -3.45 + i * 0.35], [2.76, 2.78], [-1.1, 0.1]);
  // cab, offset to the right of the boom
  bx(body, M.brand, [-1.6, 0.5], [1.9, 2.35], [0.72, 1.98]);
  bx(body, M.glass, [-1.5, 0.4], [2.35, 4.2], [0.82, 1.88]);
  bx(body, M.brand, [-1.7, 0.6], [4.2, 4.42], [0.66, 2.04]);
  for (const x of [-1.6, 0.42]) for (const z of [0.74, 1.9]) bx(body, M.charcoal, [x, x + 0.1], [2.35, 4.2], [z, z + 0.1]);
  const beacon = new THREE.Mesh(cylGeo(0.12, 0.2, 12), M.beacon);
  beacon.position.set(-0.6, 4.55, 1.35);
  body.add(beacon);
  // front axle, pivot bracket
  bx(body, M.charcoal, [2.0, 2.8], [0.55, 1.1], [-2.5, 2.5]);
  bx(body, M.charcoal, [-4.1, -2.9], [1.9, 3.6], [-0.62, 0.62]);
  bx(body, M.lamp, [3.2, 3.26], [1.4, 1.65], [-1.3, -0.95]);
  bx(body, M.lamp, [3.2, 3.26], [1.4, 1.65], [0.95, 1.3]);
  // brand decal on counterweight
  const logo = decal(decalTexture("ELIV", "#ffffff"), 1.9, 0.48);
  logo.position.set(-4.75, 2.2, 1.61);
  body.add(logo);
  const logo2 = logo.clone();
  logo2.position.z = -1.61;
  logo2.rotation.y = Math.PI;
  body.add(logo2);

  const wheels: THREE.Group[] = [];
  for (const z of [-2.35, -1.75, 1.75, 2.35]) {
    const w = wheel(M, 0.85, 0.55);
    w.position.set(2.4, 0.85, z);
    body.add(w);
    wheels.push(w);
  }
  for (const z of [-1.75, 1.75]) {
    const w = wheel(M, 0.8, 0.6);
    w.position.set(-3.2, 0.8, z);
    body.add(w);
    wheels.push(w);
  }

  // boom
  const boom = new THREE.Group();
  boom.position.set(BOOM_PIVOT.x, BOOM_PIVOT.y, 0);
  root.add(boom);
  bx(boom, M.charcoal, [-0.3, 8.6], [-0.46, 0.46], [-0.4, 0.4]);
  const boomLogo = decal(decalTexture("ELIV  ·  REACH 45T", "#ffffff", "transparent", 1024, 96, 800), 5.2, 0.45);
  boomLogo.position.set(4.6, 0, 0.405);
  boom.add(boomLogo);
  const inner = new THREE.Group();
  boom.add(inner);
  bx(inner, M.charcoal2, [-8, 0.15], [-0.36, 0.36], [-0.31, 0.31]);
  bx(inner, M.hazard, [-0.6, 0.15], [-0.37, 0.37], [-0.32, 0.32]);

  // lift cylinders
  const barrels: THREE.Mesh[] = [];
  const rods: THREE.Mesh[] = [];
  for (let i = 0; i < 2; i++) {
    const b = new THREE.Mesh(cylGeo(0.2, 1, 16), M.charcoal);
    const r = new THREE.Mesh(cylGeo(0.11, 1, 12), M.chrome);
    root.add(b, r);
    barrels.push(b);
    rods.push(r);
  }

  // head + spreader
  const head = new THREE.Group();
  root.add(head);
  bx(head, M.charcoal, [-0.42, 0.42], [-0.8, 0.15], [-0.42, 0.42]);
  const rot = new THREE.Mesh(cylGeo(0.6, 0.18, 24), M.charcoal2);
  rot.position.y = -0.82;
  head.add(rot);
  const spreader = buildSpreader(M);
  spreader.group.position.y = -STACKER_SPREADER_DROP + 0.55;
  head.add(spreader.group);

  const A = new THREE.Vector3(), B = new THREE.Vector3(), Mid = new THREE.Vector3();
  /** Inverse kinematics: place the boom tip at stacker-local (x, y). */
  const setTip = (x: number, y: number) => {
    const dx = x - BOOM_PIVOT.x, dy = y - BOOM_PIVOT.y;
    const L = Math.max(8.8, Math.hypot(dx, dy));
    const th = Math.atan2(dy, dx);
    boom.rotation.z = th;
    inner.position.x = L;
    head.position.set(BOOM_PIVOT.x + Math.cos(th) * L, BOOM_PIVOT.y + Math.sin(th) * L, 0);
    for (let i = 0; i < 2; i++) {
      const z = i ? 0.52 : -0.52;
      A.set(0.9, 1.95, z);
      B.set(BOOM_PIVOT.x + Math.cos(th) * 4.8, BOOM_PIVOT.y + Math.sin(th) * 4.8 - 0.4, z);
      Mid.lerpVectors(A, B, 0.58);
      stretch(barrels[i], A, Mid);
      stretch(rods[i], Mid, B);
    }
  };
  setTip(5, 5.5);

  let rolled = 0;
  const roll = (distance: number) => {
    rolled = distance;
    for (const w of wheels) w.rotation.z = -rolled / 0.85;
  };

  return { root, setTip, setExtension: spreader.setExtension, socket: spreader.socket, roll, beacon };
}

/* --------------------------- truck & trailer ----------------------- */
export function buildTruck(M: Mats) {
  /* Tractor: origin on the ground under the fifth wheel, facing +X. */
  const tractor = new THREE.Group();
  bx(tractor, M.charcoal, [-2.4, 4.6], [0.62, 1.0], [-0.5, 0.5]);
  bx(tractor, M.steel, [-0.7, 0.7], [1.0, 1.18], [-0.85, 0.85]); // fifth wheel
  // cab
  bx(tractor, M.brand, [2.55, 4.95], [1.15, 3.95], [-1.25, 1.25]);
  bx(tractor, M.brandDark, [2.5, 4.3], [3.95, 4.45], [-1.2, 1.2]); // roof fairing
  bx(tractor, M.brand, [2.3, 2.6], [1.4, 4.2], [-1.24, 1.24]);
  bx(tractor, M.glass, [4.93, 4.99], [2.35, 3.5], [-1.12, 1.12]); // windscreen
  for (const s of [-1, 1]) {
    bx(tractor, M.glass, [3.95, 4.85], [2.45, 3.45], s > 0 ? [1.249, 1.262] : [-1.262, -1.249]);
    const d = decal(decalTexture("ELIV", "#ffffff"), 1.25, 0.32);
    d.position.set(3.35, 2.0, s * 1.265);
    if (s < 0) d.rotation.y = Math.PI;
    tractor.add(d);
    // mirror
    bx(tractor, M.charcoal, [4.7, 4.82], [2.4, 3.3], s > 0 ? [1.35, 1.5] : [-1.5, -1.35]);
    bx(tractor, M.charcoal, [4.7, 4.8], [3.1, 3.18], s > 0 ? [1.2, 1.4] : [-1.4, -1.2]);
    // fuel tank + steps
    const tank = new THREE.Mesh(cylGeo(0.32, 1.5, 20), M.chrome);
    tank.rotation.z = Math.PI / 2;
    tank.position.set(1.55, 0.85, s * 0.95);
    tractor.add(tank);
    bx(tractor, M.charcoal, [2.7, 3.3], [0.55, 0.62], s > 0 ? [1.0, 1.3] : [-1.3, -1.0]);
    // side skirt
    bx(tractor, M.brandDark, [-0.1, 2.5], [0.55, 0.62], s > 0 ? [1.15, 1.2] : [-1.2, -1.15]);
  }
  bx(tractor, M.charcoal, [4.94, 5.0], [1.3, 2.25], [-0.85, 0.85]); // grille
  for (let i = 0; i < 6; i++) bx(tractor, M.chrome, [4.99, 5.02], [1.38 + i * 0.14, 1.42 + i * 0.14], [-0.8, 0.8]);
  bx(tractor, M.charcoal, [4.6, 5.1], [0.42, 1.2], [-1.25, 1.25]); // bumper
  bx(tractor, M.lamp, [5.08, 5.12], [0.85, 1.05], [-1.15, -0.75]);
  bx(tractor, M.lamp, [5.08, 5.12], [0.85, 1.05], [0.75, 1.15]);
  bx(tractor, M.lamp, [4.3, 4.34], [4.47, 4.55], [-0.8, 0.8]);
  // exhaust stack behind cab
  const ex = new THREE.Mesh(cylGeo(0.11, 2.2, 12), M.chrome);
  ex.position.set(2.2, 3.1, 1.05);
  tractor.add(ex);

  const tractorWheels: THREE.Group[] = [];
  for (const [x, z, w] of [
    [3.75, 1.03, 0.34], [3.75, -1.03, 0.34],
    [0.0, 0.92, 0.62], [0.0, -0.92, 0.62],
    [-1.35, 0.92, 0.62], [-1.35, -0.92, 0.62],
  ] as const) {
    const wh = wheel(M, 0.52, w);
    wh.position.set(x, 0.52, z);
    tractor.add(wh);
    tractorWheels.push(wh);
  }
  for (const x of [-0.68, 0.68]) bx(tractor, M.charcoal, [x - 0.5 - 0.17, x + 0.5 - 0.17], [1.02, 1.08], [-1.3, 1.3]); // mudguards

  /* Trailer: origin on the ground under the kingpin, extending toward -X. */
  const trailer = new THREE.Group();
  for (const z of [-0.45, 0.45]) bx(trailer, M.charcoal, [-12.45, 0.7], [1.08, TRAILER_DECK], [z - 0.08, z + 0.08]);
  for (let x = -12; x <= 0; x += 1.9) bx(trailer, M.charcoal2, [x - 0.07, x + 0.07], [1.25, TRAILER_DECK], [-1.22, 1.22]);
  bx(trailer, M.charcoal, [-0.8, 0.8], [1.18, 1.3], [-0.9, 0.9]);
  for (const x of [-2.4]) for (const z of [-0.9, 0.9]) bx(trailer, M.steel, [x - 0.08, x + 0.08], [0.15, 1.1], [z - 0.08, z + 0.08]);
  bx(trailer, M.charcoal, [-12.6, -12.4], [0.45, 0.85], [-1.22, 1.22]);
  bx(trailer, M.tail, [-12.62, -12.58], [0.55, 0.75], [-1.15, -0.85]);
  bx(trailer, M.tail, [-12.62, -12.58], [0.55, 0.75], [0.85, 1.15]);
  bx(trailer, M.hazard, [-12.63, -12.61], [0.47, 0.53], [-0.7, 0.7]);
  const trailerWheels: THREE.Group[] = [];
  for (const x of [-8.6, -9.9, -11.2]) {
    bx(trailer, M.charcoal, [x - 0.08, x + 0.08], [0.45, 0.6], [-0.95, 0.95]);
    for (const z of [-0.95, 0.95]) {
      const wh = wheel(M, 0.5, 0.55);
      wh.position.set(x, 0.5, z);
      trailer.add(wh);
      trailerWheels.push(wh);
    }
  }
  for (const z of [-1, 1]) bx(trailer, M.charcoal, [-11.9, -7.9], [1.02, 1.08], z > 0 ? [0.68, 1.26] : [-1.26, -0.68]);

  const socket = new THREE.Object3D();
  socket.position.set(-5.0, TRAILER_DECK, 0);
  trailer.add(socket);

  return { tractor, trailer, socket, tractorWheels, trailerWheels };
}

/* --------------------------- quay crane --------------------------- */
export const CRANE = { boomY: 31, legLand: 7, legSea: -9, outreach: -54, back: 22 };

export function buildQuayCrane(M: Mats, withSpreader = true) {
  const root = new THREE.Group();
  const legMat = M.brand;
  for (const x of [-8, 8]) {
    for (const z of [CRANE.legLand, CRANE.legSea]) {
      bx(root, legMat, [x - 0.6, x + 0.6], [1.2, 29], [z - 0.6, z + 0.6]);
      bx(root, M.charcoal, [x - 1.8, x + 1.8], [0, 1.2], [z - 0.8, z + 0.8]); // bogie
    }
    bx(root, legMat, [x - 0.64, x + 0.64], [27, 29.6], [CRANE.legSea - 0.64, CRANE.legLand + 0.64]); // portal beam (proud of the legs)
    bx(root, legMat, [x - 0.45, x + 0.45], [12, 12.9], [CRANE.legSea, CRANE.legLand]); // mid tie
    // apex towers
    bx(root, legMat, [x * 0.42 - 0.5, x * 0.42 + 0.5], [29.6, 50], [-1.5, -0.5]);
    bx(root, legMat, [x * 0.42 - 0.5, x * 0.42 + 0.5], [29.6, 48], [3.5, 4.5]);
  }
  for (const z of [CRANE.legLand, CRANE.legSea]) bx(root, legMat, [-8.68, 8.68], [27.8, 29.62], [z - 0.62, z + 0.62]);
  bx(root, legMat, [-3.9, 3.9], [48.5, 50], [-1.55, 4.55]);
  // boom (white) — two girders and a walkway
  for (const x of [-2.2, 2.2]) bx(root, M.white, [x - 0.45, x + 0.45], [CRANE.boomY - 0.2, CRANE.boomY + 1.6], [CRANE.outreach, CRANE.back]);
  for (let z = CRANE.outreach + 2; z < CRANE.back; z += 4) bx(root, M.offwhite, [-2.2, 2.2], [CRANE.boomY + 1.3, CRANE.boomY + 1.5], [z - 0.15, z + 0.15]);
  // machinery house
  bx(root, M.white, [-4.2, 4.2], [CRANE.boomY + 1.6, CRANE.boomY + 6.5], [12, 22]);
  bx(root, M.brand, [-4.25, 4.25], [CRANE.boomY + 4.8, CRANE.boomY + 5.4], [11.95, 22.05]); // wraps the house, no shared faces
  // forestays / backstays
  const stays: [THREE.Vector3, THREE.Vector3][] = [];
  for (const x of [-2, 2]) {
    stays.push([new THREE.Vector3(x * 0.85, 49.5, -1), new THREE.Vector3(x, CRANE.boomY + 1.6, CRANE.outreach + 1)]);
    stays.push([new THREE.Vector3(x * 0.85, 49.5, -1), new THREE.Vector3(x, CRANE.boomY + 1.6, -26)]);
    stays.push([new THREE.Vector3(x * 0.85, 48, 4), new THREE.Vector3(x, CRANE.boomY + 1.6, CRANE.back - 1)]);
  }
  for (const [a, b] of stays) {
    const s = new THREE.Mesh(cylGeo(0.22, 1, 8), M.white);
    stretch(s, a, b);
    root.add(s);
  }
  for (const z of [-30, -12, 6]) bx(root, M.flood, [-1.2, 1.2], [CRANE.boomY - 0.45, CRANE.boomY - 0.2], [z - 0.5, z + 0.5]);
  const lamp = new THREE.Mesh(cylGeo(0.3, 0.3, 10), M.beacon);
  lamp.position.set(0, 50.4, 1.5);
  root.add(lamp);

  // trolley + hoist
  const trolley = new THREE.Group();
  root.add(trolley);
  bx(trolley, M.charcoal, [-2.9, 2.9], [CRANE.boomY - 1.2, CRANE.boomY - 0.2], [-2.2, 2.2]);
  bx(trolley, M.white, [-1.2, 0.2], [CRANE.boomY - 3.6, CRANE.boomY - 1.2], [-1.5, 0.3]); // operator cab
  bx(trolley, M.glass, [-1.25, 0.25], [CRANE.boomY - 3.3, CRANE.boomY - 1.8], [-1.55, -1.45]);

  let spreader: ReturnType<typeof buildSpreader> | null = null;
  const cables: THREE.Mesh[] = [];
  let headblock: THREE.Group | null = null;
  if (withSpreader) {
    headblock = new THREE.Group();
    trolley.add(headblock);
    bx(headblock, M.charcoal2, [-1.4, 1.4], [0, 0.7], [-0.9, 0.9]);
    spreader = buildSpreader(M);
    spreader.group.rotation.y = Math.PI / 2; // long axis along X, like the truck and the ship
    headblock.add(spreader.group);
    for (const x of [-1.1, 1.1]) for (const z of [-0.7, 0.7]) {
      const c = new THREE.Mesh(cylGeo(0.035, 1, 6), M.charcoal);
      c.userData.anchor = new THREE.Vector3(x, 0, z);
      trolley.add(c);
      cables.push(c);
    }
    spreader.setExtension(1);
  }
  const a = new THREE.Vector3(), b = new THREE.Vector3();
  /** trolleyZ: crane-local Z of the trolley; hoist: crane-local Y of the spreader's lower face. */
  const set = (trolleyZ: number, hoist: number) => {
    trolley.position.z = trolleyZ;
    if (!headblock) return;
    headblock.position.y = hoist + 0.55;
    for (const c of cables) {
      const an = c.userData.anchor as THREE.Vector3;
      a.set(an.x, CRANE.boomY - 1.2, an.z);
      b.set(an.x, hoist + 1.25, an.z);
      stretch(c, a, b);
    }
  };
  set(0, 20);
  return { root, set, socket: spreader?.socket ?? null };
}

/* ------------------------------ ship ------------------------------ */
export const SHIP = { deckY: 5, length: 150, beam: 26, heroBay: 4, heroRow: 6, heroTier: 3 };
export const SHIP_ROWS = 8;
export const bayX = (b: number) => -40 + b * 12.9;
export const rowZ = (r: number) => (r - (SHIP_ROWS - 1) / 2) * 2.48;

export function buildShip(M: Mats, containerMats: THREE.Material[]) {
  const root = new THREE.Group();
  const hw = SHIP.beam / 2;
  const plan = new THREE.Shape();
  plan.moveTo(-74, -hw + 3);
  plan.quadraticCurveTo(-75, -hw, -70, -hw);
  plan.lineTo(48, -hw);
  plan.bezierCurveTo(64, -hw, 76, -6, 80, 0);
  plan.bezierCurveTo(76, 6, 64, hw, 48, hw);
  plan.lineTo(-70, hw);
  plan.quadraticCurveTo(-75, hw, -74, hw - 3);
  plan.lineTo(-74, -hw + 3);
  const hull = (h0: number, h1: number, sideMat: THREE.Material, capMat: THREE.Material, inset = 0) => {
    const g = new THREE.ExtrudeGeometry(plan, { depth: h1 - h0, bevelEnabled: false, curveSegments: 24 });
    g.rotateX(-Math.PI / 2);
    g.translate(0, h0, 0);
    const m = new THREE.Mesh(g, [capMat, sideMat]);
    if (inset) m.scale.set(1 - inset, 1, 1 - inset);
    root.add(m);
    return m;
  };
  hull(-9, -2.4, M.red, M.red);
  hull(-2.4, SHIP.deckY, M.navy, new THREE.MeshStandardMaterial({ color: 0x2a3a55, roughness: 0.8, metalness: 0.2 }));
  const strip = hull(SHIP.deckY - 0.6, SHIP.deckY + 0.25, M.white, M.white);
  strip.scale.set(1.002, 1, 1.004);
  // name on the bow
  for (const s of [-1, 1]) {
    const n = decal(decalTexture("ELIV PACIFIC", "#ffffff", "transparent", 1024, 128, 800), 16, 2);
    n.position.set(30, 1.2, s * (hw + 0.05));
    if (s < 0) n.rotation.y = Math.PI;
    root.add(n);
  }

  // accommodation block near the stern
  bx(root, M.white, [-66, -56], [SHIP.deckY, 23], [-9, 9]);
  for (let y = SHIP.deckY + 2.6; y < 22; y += 2.8) bx(root, M.windowGlow, [-56.06, -55.96], [y, y + 1.2], [-8, 8]);
  bx(root, M.white, [-62, -58], [20.5, 22], [-hw - 1, hw + 1]); // bridge wings
  bx(root, M.windowGlow, [-58.05, -57.95], [20.7, 21.7], [-hw - 0.5, hw + 0.5]);
  bx(root, M.navy, [-71, -67], [SHIP.deckY, 27], [-2.6, 2.6]); // funnel
  bx(root, M.red, [-71.05, -66.95], [24, 25.5], [-2.65, 2.65]);
  bx(root, M.white, [-73, -71], [SHIP.deckY, 8], [-hw + 2, hw - 2]);
  // forecastle
  bx(root, M.navy, [58, 74], [SHIP.deckY, SHIP.deckY + 2.2], [-6, 6]);

  // container bays — one instanced draw call for ~300 boxes
  const r = rng(42);
  const palette = [0xf2f2f2, 0x1b2f8a, 0x2f7fdc, 0xd8322a, 0xe96a1c, 0xc2507f, 0x2e9a48, 0xd9a33a, 0x1e3f7a, 0xc8c8c8];
  const BAYS = 8;
  type Slot = { x: number; z: number; y: number; color: number };
  const slots: Slot[] = [];
  for (let b = 0; b < BAYS; b++) {
    const x = bayX(b);
    bx(root, M.charcoal, [x - 6.3, x + 6.3], [SHIP.deckY, SHIP.deckY + 0.5], [-hw + 1.2, hw - 1.2]); // hatch cover
    if (b < BAYS - 1) bx(root, M.navy, [x + 6.35, x + 6.55], [SHIP.deckY, SHIP.deckY + 6.5], [-hw + 1, hw - 1]); // lashing bridge
    for (let row = 0; row < SHIP_ROWS; row++) {
      let tiers = 2 + Math.floor(r() * 4);
      if (b === SHIP.heroBay && row === SHIP.heroRow) tiers = SHIP.heroTier;
      if (b === SHIP.heroBay && Math.abs(row - SHIP.heroRow) === 1) tiers = Math.max(tiers, SHIP.heroTier);
      for (let t = 0; t < tiers; t++)
        slots.push({ x, z: rowZ(row), y: SHIP.deckY + 0.5 + t * CONTAINER.H, color: palette[Math.floor(r() * palette.length)] });
    }
  }
  const inst = new THREE.InstancedMesh(containerGeometry(), containerMats, slots.length);
  const m4 = new THREE.Matrix4();
  const col = new THREE.Color();
  slots.forEach((s, i) => {
    m4.makeTranslation(s.x, s.y, s.z);
    inst.setMatrixAt(i, m4);
    inst.setColorAt(i, col.setHex(s.color));
  });
  inst.castShadow = true;
  inst.receiveShadow = true;
  root.add(inst);

  const socket = new THREE.Object3D();
  socket.position.set(bayX(SHIP.heroBay), SHIP.deckY + 0.5 + SHIP.heroTier * CONTAINER.H, rowZ(SHIP.heroRow));
  root.add(socket);
  return { root, socket };
}

/** Yard / port container blocks as a single instanced mesh. */
export function buildContainerBlock(containerMats: THREE.Material[], spots: { x: number; y: number; z: number; color: number; rotY?: number }[]) {
  const inst = new THREE.InstancedMesh(containerGeometry(), containerMats, spots.length);
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const col = new THREE.Color();
  const one = new THREE.Vector3(1, 1, 1);
  const p = new THREE.Vector3();
  spots.forEach((s, i) => {
    q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), s.rotY ?? 0);
    m4.compose(p.set(s.x, s.y, s.z), q, one);
    inst.setMatrixAt(i, m4);
    inst.setColorAt(i, col.setHex(s.color));
  });
  inst.castShadow = true;
  inst.receiveShadow = true;
  return inst;
}
