import * as THREE from "three";
import { LAND_POINTS_B64 } from "./land-points";

/**
 * Dotted-earth globe with animated flight routes.
 *
 * Land is a point cloud whose far hemisphere is discarded in the shader, the
 * ocean is a plain dark sphere that also writes depth (so arcs, pins and planes on
 * the back are hidden for free), and each route draws itself as an arc with an
 * airplane riding its head. Labels are left to the caller: `onFrame` reports
 * every place's screen position and whether it faces the camera.
 */

export type GlobePlace = { id: string; lat: number; lng: number };
export type GlobeRoute = { from: string; to: string };
export type ProjectedPlace = { id: string; x: number; y: number; visible: boolean };

export const GLOBE_COLORS = {
  ocean: new THREE.Color("#000000"), // matches the hero background, so the globe has no visible edge
  land: new THREE.Color("#a9f0e4"),
  arc: new THREE.Color("#2ee6c2"),
  pin: new THREE.Color("#5ff7d4"),
  plane: new THREE.Color("#f2fffc"),
};

const RADIUS = 1;
/** A label shows only while its point is this far round the visible face. */
const LABEL_FACING_MIN = 0.12;

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

/** Top-down airliner silhouette, nose toward +Y, white on transparent. */
function planeTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d")!;
  g.fillStyle = "#fff";
  g.translate(64, 64);
  g.beginPath();
  // fuselage
  g.moveTo(0, -56);
  g.bezierCurveTo(7, -50, 7, -36, 7, -24);
  g.lineTo(7, 30);
  g.bezierCurveTo(7, 44, 4, 52, 0, 56);
  g.bezierCurveTo(-4, 52, -7, 44, -7, 30);
  g.lineTo(-7, -24);
  g.bezierCurveTo(-7, -36, -7, -50, 0, -56);
  g.fill();
  // wings
  g.beginPath();
  g.moveTo(6, -8);
  g.lineTo(58, 14);
  g.lineTo(58, 22);
  g.lineTo(6, 12);
  g.lineTo(-6, 12);
  g.lineTo(-58, 22);
  g.lineTo(-58, 14);
  g.lineTo(-6, -8);
  g.fill();
  // tailplane
  g.beginPath();
  g.moveTo(5, 38);
  g.lineTo(24, 48);
  g.lineTo(24, 53);
  g.lineTo(5, 49);
  g.lineTo(-5, 49);
  g.lineTo(-24, 53);
  g.lineTo(-24, 48);
  g.lineTo(-5, 38);
  g.fill();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function glowTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, "rgba(255,255,255,0.9)");
  grad.addColorStop(0.35, "rgba(255,255,255,0.25)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

type Flight = {
  curve: THREE.CatmullRomCurve3;
  uniforms: { uHead: { value: number }; uTail: { value: number }; uColor: { value: THREE.Color } };
  plane: THREE.Group;
  period: number;
  offset: number;
};

const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

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
  private tmp = { a: new THREE.Vector3(), b: new THREE.Vector3(), c: new THREE.Vector3(), d: new THREE.Vector3(), m: new THREE.Matrix4() };
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
    this.renderer.setClearColor(0x000000, 0);
    this.camera.position.set(0, 0, 5.2); // globe fills ~72% of the canvas
    this.scene.add(this.globe);

    this.globe.add(this.buildOcean());
    this.pointsMaterial = this.buildLandMaterial();
    this.globe.add(new THREE.Points(this.buildLandGeometry(), this.pointsMaterial));

    const byId = new Map(places.map((p) => [p.id, p]));
    for (const p of places) {
      this.placeVectors.push({ id: p.id, v: latLngToVector(p.lat, p.lng) });
      this.buildPin(p);
    }
    const planeTex = planeTexture();
    const glowTex = glowTexture();
    routes.forEach((r, i) => {
      const a = byId.get(r.from), b = byId.get(r.to);
      if (a && b) this.buildFlight(a, b, i, routes.length, planeTex, glowTex);
    });
    this.projected = places.map((p) => ({ id: p.id, x: 0, y: 0, visible: false }));
  }

  /* ----------------------------- build ----------------------------- */

  private buildOcean() {
    // flat dark body with no rim or halo, so the dots alone define the edge;
    // it writes depth, which hides arcs, pins and planes on the far side
    const mat = new THREE.MeshBasicMaterial({ color: GLOBE_COLORS.ocean });
    return new THREE.Mesh(new THREE.SphereGeometry(RADIUS * 0.995, 64, 48), mat);
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
        uSize: { value: 2.6 },
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
          float a = smoothstep(0.5, 0.3, d) * mix(0.18, 0.95, smoothstep(0.0, 0.3, vFacing));
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
    const dot = new THREE.Mesh(new THREE.CircleGeometry(0.011, 20), new THREE.MeshBasicMaterial({ color: GLOBE_COLORS.pin }));
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.85, 1, 40),
      new THREE.MeshBasicMaterial({ color: GLOBE_COLORS.pin, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }),
    );
    holder.add(dot, ring);
    this.globe.add(holder);
    this.pins.push({ ring, offset: Math.random() });
  }

  private buildFlight(a: GlobePlace, b: GlobePlace, index: number, total: number, planeTex: THREE.Texture, glowTex: THREE.Texture) {
    const va = latLngToVector(a.lat, a.lng).normalize();
    const vb = latLngToVector(b.lat, b.lng).normalize();
    const angle = va.angleTo(vb);
    const lift = 0.06 + 0.22 * (angle / Math.PI); // longer hops fly higher
    const pts: THREE.Vector3[] = [];
    const q = new THREE.Quaternion();
    const axis = new THREE.Vector3().crossVectors(va, vb).normalize();
    for (let i = 0; i <= 64; i++) {
      const t = i / 64;
      q.setFromAxisAngle(axis, angle * t);
      pts.push(va.clone().applyQuaternion(q).multiplyScalar(RADIUS * (1.004 + Math.sin(t * Math.PI) * lift)));
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    const uniforms = { uHead: { value: 0 }, uTail: { value: 0 }, uColor: { value: GLOBE_COLORS.arc } };
    const tube = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 160, 0.0028, 6, false),
      new THREE.ShaderMaterial({
        uniforms,
        vertexShader: `
          varying float vU;
          void main() { vU = uv.x; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
        fragmentShader: `
          uniform float uHead; uniform float uTail; uniform vec3 uColor; varying float vU;
          void main() {
            if (vU > uHead || vU < uTail || uHead <= uTail) discard;
            float k = (vU - uTail) / max(uHead - uTail, 1e-4);
            float a = smoothstep(0.0, 0.45, k);
            gl_FragColor = vec4(mix(uColor, vec3(1.0), smoothstep(0.85, 1.0, k) * 0.6), a);
          }`,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    this.globe.add(tube);

    // airplane rides the head of the arc; a soft glow keeps it readable at small sizes
    const plane = new THREE.Group();
    const glow = new THREE.Mesh(
      new THREE.PlaneGeometry(0.11, 0.11),
      new THREE.MeshBasicMaterial({ map: glowTex, color: GLOBE_COLORS.arc, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }),
    );
    const body = new THREE.Mesh(
      new THREE.PlaneGeometry(0.052, 0.052),
      new THREE.MeshBasicMaterial({ map: planeTex, color: GLOBE_COLORS.plane, transparent: true, depthWrite: false, side: THREE.DoubleSide }),
    );
    body.position.z = 0.002;
    plane.add(glow, body);
    plane.visible = false;
    this.globe.add(plane);

    this.flights.push({ curve, uniforms, plane, period: 6.5 + (index % 3) * 1.1, offset: index / total });
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
    let head: number, tail: number;
    if (this.opts.reducedMotion) {
      head = 1;
      tail = 0;
    } else {
      // 0–0.55 fly (arc draws behind the plane), 0.45–0.9 the trail retracts, then a short rest
      const p = (time / f.period + f.offset) % 1;
      head = easeInOut(THREE.MathUtils.clamp(p / 0.55, 0, 1));
      tail = easeInOut(THREE.MathUtils.clamp((p - 0.45) / 0.45, 0, 1));
    }
    f.uniforms.uHead.value = head;
    f.uniforms.uTail.value = tail;

    const flying = !this.opts.reducedMotion && head > 0.001 && head < 0.999;
    f.plane.visible = flying;
    if (!flying) return;
    const { a: pos, b: fwd, c: up, d: right, m } = this.tmp;
    f.curve.getPointAt(head, pos);
    f.curve.getTangentAt(head, fwd);
    up.copy(pos).normalize();
    fwd.addScaledVector(up, -fwd.dot(up)).normalize(); // heading, flattened onto the local horizon
    right.crossVectors(fwd, up);
    m.makeBasis(right, fwd, up);
    f.plane.quaternion.setFromRotationMatrix(m);
    f.plane.position.copy(pos);
    // grow on take-off, shrink on landing
    const s = Math.min(1, head / 0.06, (1 - head) / 0.06);
    f.plane.scale.setScalar(0.35 + 0.65 * s);
  }

  render(time: number) {
    this.globe.rotation.set(this.tilt, this.phi, 0, "XYZ");
    for (const f of this.flights) this.updateFlight(f, time);
    for (const p of this.pins) {
      const k = (time * 0.45 + p.offset) % 1;
      p.ring.scale.setScalar(0.012 + k * 0.05);
      (p.ring.material as THREE.MeshBasicMaterial).opacity = (1 - k) * 0.7;
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
