import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { LAND_POINTS_B64 } from "./land-points";

/**
 * Dotted-earth globe with live flights, drawn for a white page.
 *
 * Land is a point cloud whose far hemisphere is discarded in the shader; the
 * ocean is a softly lit sphere that also writes depth, so routes, pins and
 * aircraft on the far side are hidden for free. Each route is flown like a real
 * leg: the aircraft (a small lit 3D airliner) accelerates on take-off, climbs,
 * cruises at constant speed, descends and slows to land, pitching with the
 * climb and descent. A faint dashed line shows the planned route, a contrail
 * fades out behind the aircraft, and a soft shadow follows it on the ground.
 *
 * Labels are left to the caller: `onFrame` reports every place's screen
 * position and whether it faces the camera.
 */

export type GlobePlace = { id: string; lat: number; lng: number };
export type GlobeRoute = { from: string; to: string };
export type ProjectedPlace = { id: string; x: number; y: number; visible: boolean };

export const GLOBE_COLORS = {
  ocean: new THREE.Color("#f2f5f6"),
  land: new THREE.Color("#22414b"),
  route: new THREE.Color("#0f8f7a"),
  contrail: new THREE.Color("#6f8790"), // vapour grey
  pin: new THREE.Color("#0f8f7a"),
  fuselage: new THREE.Color("#f7f9fa"),
  engines: new THREE.Color("#8c969e"),
  tail: new THREE.Color("#0f8f7a"),
};

const RADIUS = 1;
/** A label shows only while its point is this far round the visible face. */
const LABEL_FACING_MIN = 0.12;
/** Share of each cycle spent flying; the rest is turnaround on the ground. */
const FLYING = 0.86;
/** Length of the contrail, as a fraction of the route. */
const CONTRAIL = 0.22;
/** Aircraft size on the globe (model is ~1.1 units nose to tail). */
const PLANE_SCALE = 0.06;

export function latLngToVector(lat: number, lng: number, r = RADIUS) {
  const la = THREE.MathUtils.degToRad(lat);
  const lo = THREE.MathUtils.degToRad(lng);
  return new THREE.Vector3(Math.cos(la) * Math.sin(lo) * r, Math.sin(la) * r, Math.cos(la) * Math.cos(lo) * r);
}

function decodeLand() {
  const bin = atob(LAND_POINTS_B64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const pairs = new Int16Array(bytes.buffer);
  const pos = new Float32Array((pairs.length / 2) * 3);
  for (let i = 0, j = 0; i < pairs.length; i += 2, j += 3) {
    const v = latLngToVector(pairs[i + 1] / 100, pairs[i] / 100, RADIUS * 1.003);
    pos[j] = v.x;
    pos[j + 1] = v.y;
    pos[j + 2] = v.z;
  }
  return pos;
}

/**
 * Twin-engine airliner, built once and shared by every flight.
 * Model space: nose toward +Y, belly toward -Z, right wing toward +X.
 * Returns three geometries so the whole aircraft is three draw calls.
 */
function buildAirlinerGeometry() {
  const prep = (g: THREE.BufferGeometry) => {
    const n = g.index ? g.toNonIndexed() : g;
    n.deleteAttribute("uv");
    return n;
  };

  // fuselage: barrel, rounded nose, tapered tail cone lifted toward the fin
  const barrel = new THREE.CylinderGeometry(0.06, 0.06, 0.7, 20);
  const nose = new THREE.SphereGeometry(0.06, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2);
  nose.scale(1, 2.3, 1);
  nose.translate(0, 0.35, 0);
  const tailCone = new THREE.CylinderGeometry(0.06, 0.016, 0.3, 20);
  tailCone.translate(0, -0.5, 0);
  tailCone.applyMatrix4(new THREE.Matrix4().makeShear(0, 0, 0, 0, 0, 0.12)); // upsweep
  tailCone.translate(0, 0, 0.06);

  // swept wings (span along X, chord along Y), extruded thin along Z
  const wing = (span: number, rootLead: number, rootTrail: number, tipLead: number, tipTrail: number, thick: number) => {
    const s = new THREE.Shape();
    s.moveTo(-span, tipTrail);
    s.lineTo(-span, tipLead);
    s.lineTo(0, rootLead);
    s.lineTo(span, tipLead);
    s.lineTo(span, tipTrail);
    s.lineTo(0, rootTrail);
    s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: thick, bevelEnabled: false });
    g.translate(0, 0, -thick / 2);
    return g;
  };
  const wings = wing(0.58, 0.14, -0.12, -0.14, -0.24, 0.018);
  wings.translate(0, 0.02, -0.03);
  const stab = wing(0.22, -0.4, -0.56, -0.52, -0.6, 0.012);
  stab.translate(0, 0, 0.05);

  // vertical fin: drawn in (forward, up) and turned so it stands on the spine
  const finShape = new THREE.Shape();
  finShape.moveTo(-0.38, 0.04);
  finShape.lineTo(-0.6, 0.27);
  finShape.lineTo(-0.68, 0.27);
  finShape.lineTo(-0.66, 0.04);
  finShape.closePath();
  const fin = new THREE.ExtrudeGeometry(finShape, { depth: 0.014, bevelEnabled: false });
  fin.translate(0, 0, -0.007);
  // shape x → +Y (forward), shape y → +Z (up), extrusion → +X
  fin.applyMatrix4(new THREE.Matrix4().set(0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1));

  const engines: THREE.BufferGeometry[] = [];
  for (const x of [-0.24, 0.24]) {
    const e = new THREE.CylinderGeometry(0.036, 0.03, 0.17, 16);
    e.translate(x, 0.08, -0.075);
    engines.push(e);
  }

  return {
    body: mergeGeometries([barrel, nose, tailCone, wings, stab].map(prep))!,
    tail: prep(fin),
    engines: mergeGeometries(engines.map(prep))!,
  };
}

/** Soft round shadow for the aircraft's ground track. */
function shadowTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, "rgba(10,30,36,0.55)");
  grad.addColorStop(0.5, "rgba(10,30,36,0.18)");
  grad.addColorStop(1, "rgba(10,30,36,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

type Flight = {
  curve: THREE.CatmullRomCurve3;
  /** route progress (0..1) → height above ground, for the shadow */
  altitude: (u: number) => number;
  cruise: number;
  trail: { uHead: { value: number }; uTail: { value: number }; uAlpha: { value: number } };
  plan: { uAlpha: { value: number } };
  plane: THREE.Group;
  shadow: THREE.Mesh;
  period: number;
  offset: number;
};

/**
 * Flight time (0..1) → distance flown (0..1): constant acceleration for the
 * first and last `a` of the leg, constant cruise speed in between.
 */
function flightProgress(s: number, a = 0.14) {
  const v = 1 / (1 - a);
  if (s <= 0) return 0;
  if (s >= 1) return 1;
  if (s < a) return (v * s * s) / (2 * a);
  if (s > 1 - a) return 1 - (v * (1 - s) * (1 - s)) / (2 * a);
  return v * (s - a / 2);
}

const smooth = (e0: number, e1: number, x: number) => {
  const t = THREE.MathUtils.clamp((x - e0) / (e1 - e0), 0, 1);
  return t * t * (3 - 2 * t);
};

export class GlobeScene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(30, 1, 0.1, 20);
  private globe = new THREE.Group();
  private flights: Flight[] = [];
  private pins: { ring: THREE.Mesh; offset: number }[] = [];
  private placeVectors: { id: string; v: THREE.Vector3 }[] = [];
  private pointsMaterial: THREE.ShaderMaterial;
  private width = 1;
  private height = 1;
  private tmp = {
    a: new THREE.Vector3(), b: new THREE.Vector3(), c: new THREE.Vector3(), d: new THREE.Vector3(),
    m: new THREE.Matrix4(),
  };
  private projected: ProjectedPlace[];

  /** Rotation about Y (spin) and X (tilt), radians. */
  phi = 0;
  tilt = 0.25;

  constructor(
    canvas: HTMLCanvasElement,
    places: GlobePlace[],
    routes: GlobeRoute[],
    private opts: { reducedMotion: boolean; onFrame?: (p: ProjectedPlace[]) => void },
  ) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setClearColor(0xffffff, 0);
    this.camera.position.set(0, 0, 5.2); // globe fills ~72% of the canvas
    this.scene.add(this.globe);

    // daylight from the upper left, fixed to the camera rather than the globe
    const sun = new THREE.DirectionalLight(0xffffff, 1.5);
    sun.position.set(-3, 4, 5);
    this.scene.add(sun, new THREE.HemisphereLight(0xffffff, 0xe6ecee, 1.7));

    this.globe.add(this.buildOcean());
    this.pointsMaterial = this.buildLandMaterial();
    this.globe.add(new THREE.Points(this.buildLandGeometry(), this.pointsMaterial));

    const byId = new Map(places.map((p) => [p.id, p]));
    for (const p of places) {
      this.placeVectors.push({ id: p.id, v: latLngToVector(p.lat, p.lng) });
      this.buildPin(p);
    }

    const airliner = buildAirlinerGeometry();
    const planeMats = {
      body: new THREE.MeshStandardMaterial({ color: GLOBE_COLORS.fuselage, roughness: 0.35, metalness: 0.15 }),
      tail: new THREE.MeshStandardMaterial({ color: GLOBE_COLORS.tail, roughness: 0.45, metalness: 0.1 }),
      engines: new THREE.MeshStandardMaterial({ color: GLOBE_COLORS.engines, roughness: 0.4, metalness: 0.5 }),
    };
    const shadowTex = shadowTexture();
    routes.forEach((r, i) => {
      const a = byId.get(r.from), b = byId.get(r.to);
      if (a && b) this.buildFlight(a, b, i, routes.length, airliner, planeMats, shadowTex);
    });
    this.projected = places.map((p) => ({ id: p.id, x: 0, y: 0, visible: false }));
  }

  /* ----------------------------- build ----------------------------- */

  private buildOcean() {
    // pale, matte and lit by the sun, so the sphere reads as a solid ball;
    // it writes depth, which hides routes, pins and aircraft on the far side
    const mat = new THREE.MeshStandardMaterial({ color: GLOBE_COLORS.ocean, roughness: 1, metalness: 0 });
    return new THREE.Mesh(new THREE.SphereGeometry(RADIUS * 0.995, 96, 64), mat);
  }

  private buildLandGeometry() {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(decodeLand(), 3));
    return g;
  }

  private buildLandMaterial() {
    return new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: GLOBE_COLORS.land },
        uSize: { value: 2.5 },
        uPixelRatio: { value: this.renderer.getPixelRatio() },
        uScale: { value: 1 },
      },
      vertexShader: `
        uniform float uSize; uniform float uPixelRatio; uniform float uScale;
        varying float vFacing;
        void main() {
          vec4 wp = modelMatrix * vec4(position, 1.0);
          vFacing = dot(normalize(wp.xyz), normalize(cameraPosition - wp.xyz));
          gl_PointSize = uSize * uPixelRatio * uScale * mix(0.55, 1.0, smoothstep(0.0, 0.35, vFacing));
          gl_Position = projectionMatrix * viewMatrix * wp;
        }`,
      fragmentShader: `
        uniform vec3 uColor; varying float vFacing;
        void main() {
          if (vFacing <= 0.0) discard;           // far hemisphere never shows through
          float d = length(gl_PointCoord - 0.5);
          if (d > 0.5) discard;
          float a = smoothstep(0.5, 0.32, d) * mix(0.15, 0.85, smoothstep(0.0, 0.3, vFacing));
          gl_FragColor = vec4(uColor, a);
        }`,
      transparent: true,
      depthWrite: false,
    });
  }

  private buildPin(p: GlobePlace) {
    const n = latLngToVector(p.lat, p.lng).normalize();
    const holder = new THREE.Object3D();
    holder.position.copy(n).multiplyScalar(RADIUS * 1.004);
    holder.lookAt(n.clone().multiplyScalar(2));
    const dot = new THREE.Mesh(new THREE.CircleGeometry(0.009, 20), new THREE.MeshBasicMaterial({ color: GLOBE_COLORS.pin }));
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.82, 1, 40),
      new THREE.MeshBasicMaterial({ color: GLOBE_COLORS.pin, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false }),
    );
    holder.add(dot, ring);
    this.globe.add(holder);
    this.pins.push({ ring, offset: Math.random() });
  }

  private buildFlight(
    a: GlobePlace,
    b: GlobePlace,
    index: number,
    total: number,
    airliner: ReturnType<typeof buildAirlinerGeometry>,
    mats: Record<"body" | "tail" | "engines", THREE.Material>,
    shadowTex: THREE.Texture,
  ) {
    const va = latLngToVector(a.lat, a.lng).normalize();
    const vb = latLngToVector(b.lat, b.lng).normalize();
    const angle = va.angleTo(vb);
    // cruise height grows with distance; climb and descent take the first and last fifth
    const cruise = 0.03 + 0.07 * (angle / Math.PI);
    const altitude = (u: number) => cruise * smooth(0, 0.2, u) * (1 - smooth(0.8, 1, u));
    const axis = new THREE.Vector3().crossVectors(va, vb).normalize();
    const q = new THREE.Quaternion();
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 96; i++) {
      const u = i / 96;
      q.setFromAxisAngle(axis, angle * u);
      pts.push(va.clone().applyQuaternion(q).multiplyScalar(RADIUS * (1.004 + altitude(u))));
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    const vertex = `
      varying float vU;
      void main() { vU = uv.x; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;

    // planned route: faint dashes for the whole leg
    const plan = { uAlpha: { value: 0 } };
    this.globe.add(
      new THREE.Mesh(
        new THREE.TubeGeometry(curve, 200, 0.0016, 5, false),
        new THREE.ShaderMaterial({
          uniforms: { ...plan, uColor: { value: GLOBE_COLORS.route }, uDashes: { value: Math.max(12, Math.round(angle * 40)) } },
          vertexShader: vertex,
          fragmentShader: `
            uniform float uAlpha; uniform vec3 uColor; uniform float uDashes; varying float vU;
            void main() {
              if (fract(vU * uDashes) > 0.55) discard;
              gl_FragColor = vec4(uColor, uAlpha * 0.32);
            }`,
          transparent: true,
          depthWrite: false,
        }),
      ),
    );

    // contrail: thickest and darkest right behind the aircraft, dissipating behind it
    const trail = { uHead: { value: 0 }, uTail: { value: 0 }, uAlpha: { value: 0 } };
    this.globe.add(
      new THREE.Mesh(
        new THREE.TubeGeometry(curve, 240, 0.0042, 8, false),
        new THREE.ShaderMaterial({
          uniforms: { ...trail, uColor: { value: GLOBE_COLORS.contrail } },
          vertexShader: vertex,
          fragmentShader: `
            uniform float uHead; uniform float uTail; uniform float uAlpha; uniform vec3 uColor; varying float vU;
            void main() {
              if (vU > uHead || vU < uTail || uHead <= uTail) discard;
              float k = (vU - uTail) / max(uHead - uTail, 1e-4);   // 0 at the old end, 1 at the aircraft
              gl_FragColor = vec4(uColor, uAlpha * pow(k, 2.2) * 0.7);
            }`,
          transparent: true,
          depthWrite: false,
        }),
      ),
    );

    const plane = new THREE.Group();
    plane.add(
      new THREE.Mesh(airliner.body, mats.body),
      new THREE.Mesh(airliner.tail, mats.tail),
      new THREE.Mesh(airliner.engines, mats.engines),
    );
    plane.visible = false;
    this.globe.add(plane);

    const shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }),
    );
    shadow.visible = false;
    this.globe.add(shadow);

    this.flights.push({
      curve, altitude, cruise, trail, plan, plane, shadow,
      period: 11 + angle * 4 + (index % 3) * 1.3, // longer legs take longer
      offset: index / total,
    });
  }

  /* ----------------------------- frame ----------------------------- */

  resize(w: number, h: number) {
    this.width = w;
    this.height = h;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    // keep land dots a constant fraction of the globe as the canvas scales
    this.pointsMaterial.uniforms.uScale.value = THREE.MathUtils.clamp(Math.min(w, h) / 900, 0.55, 1.6);
  }

  private updateFlight(f: Flight, time: number) {
    if (this.opts.reducedMotion) {
      f.plan.uAlpha.value = 1;
      f.trail.uAlpha.value = 0;
      f.plane.visible = f.shadow.visible = false;
      return;
    }
    const cycle = (time / f.period + f.offset) % 1;
    const flying = cycle < FLYING;
    const u = flying ? flightProgress(cycle / FLYING) : 1;
    // route fades in before departure and out after arrival
    f.plan.uAlpha.value = flying ? smooth(0, 0.03, cycle) : 1 - smooth(FLYING, FLYING + 0.04, cycle);
    f.trail.uHead.value = u;
    f.trail.uTail.value = Math.max(0, u - CONTRAIL);
    f.trail.uAlpha.value = flying ? 1 : 1 - smooth(FLYING, FLYING + 0.05, cycle);

    f.plane.visible = f.shadow.visible = flying;
    if (!flying) return;

    const { a: pos, b: fwd, c: up, d: right, m } = this.tmp;
    f.curve.getPointAt(u, pos);
    f.curve.getTangentAt(Math.min(u, 0.999), fwd); // true heading, including climb / descent
    up.copy(pos).normalize();
    right.crossVectors(fwd, up).normalize();
    up.crossVectors(right, fwd).normalize(); // re-orthogonalise: wings level, nose follows the path
    m.makeBasis(right, fwd, up);
    f.plane.quaternion.setFromRotationMatrix(m);
    f.plane.position.copy(pos);
    // taxi in small, full size once airborne
    f.plane.scale.setScalar(PLANE_SCALE * (0.55 + 0.45 * smooth(0, 0.03, u) * (1 - smooth(0.97, 1, u))));

    // ground shadow: sits on the surface under the aircraft, softer and wider with height
    const h = f.altitude(u) / f.cruise;
    pos.normalize();
    f.shadow.position.copy(pos).multiplyScalar(RADIUS * 1.002);
    f.shadow.lookAt(pos.multiplyScalar(2));
    f.shadow.scale.setScalar(0.065 + h * 0.04);
    (f.shadow.material as THREE.MeshBasicMaterial).opacity = 0.75 - h * 0.45;
  }

  render(time: number) {
    this.globe.rotation.set(this.tilt, this.phi, 0, "XYZ");
    for (const f of this.flights) this.updateFlight(f, time);
    for (const p of this.pins) {
      const k = (time * 0.4 + p.offset) % 1;
      p.ring.scale.setScalar(0.01 + k * 0.035);
      (p.ring.material as THREE.MeshBasicMaterial).opacity = (1 - k) * 0.55;
    }
    this.renderer.render(this.scene, this.camera);

    if (this.opts.onFrame) {
      this.globe.updateMatrixWorld();
      const { a: w, b: toCam, c: n } = this.tmp;
      for (let i = 0; i < this.placeVectors.length; i++) {
        const pv = this.placeVectors[i];
        w.copy(pv.v).applyMatrix4(this.globe.matrixWorld);
        toCam.subVectors(this.camera.position, w).normalize();
        const facing = n.copy(w).normalize().dot(toCam);
        w.project(this.camera);
        const out = this.projected[i];
        out.x = (w.x * 0.5 + 0.5) * this.width;
        out.y = (-w.y * 0.5 + 0.5) * this.height;
        out.visible = facing > LABEL_FACING_MIN;
      }
      this.opts.onFrame(this.projected);
    }
  }

  dispose() {
    this.renderer.dispose();
    this.scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh && !(o as THREE.Points).isPoints) return;
      m.geometry?.dispose();
      const mats = Array.isArray(m.material) ? m.material : [m.material];
      mats.forEach((x) => {
        (x as THREE.MeshBasicMaterial).map?.dispose();
        x.dispose();
      });
    });
  }
}
