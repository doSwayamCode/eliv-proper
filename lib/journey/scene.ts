import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import {
  CONTAINER,
  SHIP,
  bayX,
  buildContainerBlock,
  buildCourier,
  buildHeroContainer,
  buildParcel,
  buildQuayCrane,
  buildReachStacker,
  buildShip,
  buildTruck,
  containerMaterials,
  createMaterials,
  rowZ,
} from "./models";
import { beamTexture, concreteTexture, containerSideTexture, rng, roadTexture, wakeTexture, waterNormalTexture } from "./textures";

/* ------------------------------------------------------------------ */
/* World layout                                                         */
/* ------------------------------------------------------------------ */
export const WORLD = {
  laneZ: -1,
  stackZ: -6,
  quayEdgeZ: -160,
  craneX: 215,
  craneZ: -148,
  shipZ: -175,
  waterY: -3,
};

/** Kingpin path of the truck: yard → highway bend → port quay. */
const PATH_POINTS: [number, number][] = [
  [-320, -1], [-200, -1], [-100, -1], [0, -1], [60, -1], [95, -4], [118, -20], [128, -45],
  [131, -75], [133, -105], [142, -131], [165, -146], [195, -148], [240, -148], [300, -148], [420, -148],
];

/** Everything the timeline animates. The scene is a pure function of this. */
export type JourneyState = {
  // reach stacker (stacker-local tip coordinates)
  stackerX: number;
  stackerZ: number;
  stackerYaw: number;
  tipX: number;
  tipY: number;
  spread: number;
  // who holds the hero container: 0 stack, 1 stacker, 2 trailer, 3 quay crane, 4 ship
  mode: number;
  truckS: number;
  trolleyZ: number;
  hoist: number;
  shipX: number;
  shipZ: number;
  shipYaw: number;
  wake: number;
  // camera rig
  tx: number;
  ty: number;
  tz: number;
  follow: number;
  az: number;
  el: number;
  dist: number;
  fov: number;
  shift: number;
  bg: number;
  // prologue: courier hands a parcel into the open container
  courierX: number;
  courierZ: number;
  courierYaw: number;
  stride: number;
  carry: number;
  lean: number;
  place: number;
  doors: number;
  // 0 = midday, 1 = night
  night: number;
};

const BG_STUDIO = new THREE.Color(0xeef0f3);
const BG_PORT = new THREE.Color(0xdde5ee);
const BG_NIGHT = new THREE.Color(0x070d1b);
const SUN_DAY = new THREE.Color(0xffffff);
const SUN_NIGHT = new THREE.Color(0x7d96d8); // moonlight
const SKY_DAY = new THREE.Color(0xffffff);
const SKY_NIGHT = new THREE.Color(0x3a4f86);
const GROUND_DAY = new THREE.Color(0xb9bec7);
const GROUND_NIGHT = new THREE.Color(0x10131c);

export class JourneyScene {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(35, 1, 1.5, 2500); // tight range = more depth precision, no flicker
  readonly path: THREE.CatmullRomCurve3;
  readonly pathLength: number;
  readonly sYard: number;
  readonly sCrane: number;
  /** Speed of the vehicle on screen, for the HUD. */
  speed = 0;

  private M = createMaterials();
  private stacker!: ReturnType<typeof buildReachStacker>;
  private truck!: ReturnType<typeof buildTruck>;
  private crane!: ReturnType<typeof buildQuayCrane>;
  private ship!: ReturnType<typeof buildShip>;
  private hero!: THREE.Mesh;
  private heroCtl!: ReturnType<typeof buildHeroContainer>;
  private courier!: ReturnType<typeof buildCourier>;
  private parcel!: THREE.Group;
  private hemi = new THREE.HemisphereLight(0xffffff, 0xb9bec7, 0.9);
  private headlight = new THREE.SpotLight(0xfff1d0, 0, 90, 0.42, 0.6, 1);
  private beams: THREE.Mesh[] = [];
  private floods: THREE.PointLight[] = [];
  private night = -1;
  private sockets: THREE.Object3D[] = [];
  private sun = new THREE.DirectionalLight(0xffffff, 2.4);
  private sunTarget = new THREE.Object3D();
  private waterNormal!: THREE.Texture;
  private wake!: THREE.Mesh;
  private bowWave!: THREE.Mesh;
  private shipBaseX = WORLD.craneX - bayX(SHIP.heroBay);
  private width = 1;
  private height = 1;
  private prev = { t: 0, s: 0, ship: 0 };
  private v = new THREE.Vector3();
  private target = new THREE.Vector3();
  private tmp = { k: new THREE.Vector3(), f: new THREE.Vector3(), q: new THREE.Vector3() };

  constructor(canvas: HTMLCanvasElement, private opts: { mobile: boolean }) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance", alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, opts.mobile ? 1.5 : 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environmentIntensity = 0.55;
    pmrem.dispose();
    this.scene.background = BG_STUDIO.clone();
    this.scene.fog = new THREE.Fog(BG_STUDIO.clone(), 100, 400);

    this.path = new THREE.CatmullRomCurve3(PATH_POINTS.map(([x, z]) => new THREE.Vector3(x, 0, z)), false, "centripetal");
    this.path.arcLengthDivisions = 6000;
    this.pathLength = this.path.getLength();
    // stop so the container centre (5 m behind the kingpin) lines up with the stacker / crane
    this.sYard = this.sAtX(WORLD.laneZ, 5.0, 0, 0.5);
    this.sCrane = this.sAtX(WORLD.craneZ, WORLD.craneX + 5.0, 0.7, 1);

    this.buildLights();
    this.buildWorld();
    this.buildActors();
  }

  /** Binary search the arc-length parameter where the path reaches a given x. */
  private sAtX(_z: number, x: number, u0: number, u1: number) {
    let lo = u0, hi = u1;
    for (let i = 0; i < 60; i++) {
      const mid = (lo + hi) / 2;
      if (this.path.getPointAt(mid).x < x) lo = mid;
      else hi = mid;
    }
    return ((lo + hi) / 2) * this.pathLength;
  }

  private buildLights() {
    this.scene.add(this.hemi);
    this.sun.castShadow = true;
    const size = this.opts.mobile ? 1024 : 2048;
    this.sun.shadow.mapSize.set(size, size);
    this.sun.shadow.bias = -0.0004;
    this.sun.shadow.normalBias = 0.04;
    this.sun.target = this.sunTarget;
    this.scene.add(this.sun, this.sunTarget);
  }

  private buildWorld() {
    const M = this.M;
    const r = rng(9);

    // land: one slab whose seaward face is the quay wall
    const land = new THREE.Mesh(
      new THREE.BoxGeometry(2400, 6, 1400),
      [
        M.offwhite, M.offwhite,
        new THREE.MeshStandardMaterial({ color: 0xf3f4f6, roughness: 0.95, metalness: 0 }),
        M.offwhite,
        M.offwhite,
        new THREE.MeshStandardMaterial({ color: 0x6f747c, roughness: 0.9 }),
      ]
    );
    land.position.set(200, -3, WORLD.quayEdgeZ + 700);
    land.receiveShadow = true;
    this.scene.add(land);

    // concrete aprons: container yard and quay
    const conc = concreteTexture();
    const apron = (x0: number, x1: number, z0: number, z1: number) => {
      const t = conc.clone();
      t.needsUpdate = true;
      t.repeat.set((x1 - x0) / 24, (z1 - z0) / 24);
      const m = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, z1 - z0), new THREE.MeshStandardMaterial({ map: t, roughness: 0.92, color: 0xe2e4e7 }));
      m.rotation.x = -Math.PI / 2;
      m.position.set((x0 + x1) / 2, 0.01, (z0 + z1) / 2);
      m.receiveShadow = true;
      this.scene.add(m);
    };
    apron(-60, 60, -40, 30);
    apron(110, 340, WORLD.quayEdgeZ, -100);

    // quay edge: fenders and bollards
    for (let x = 100; x < 350; x += 9) {
      const f = new THREE.Mesh(new THREE.BoxGeometry(1.4, 2.4, 0.8), M.rubber);
      f.position.set(x, -1.6, WORLD.quayEdgeZ - 0.4);
      this.scene.add(f);
      const b = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 0.9, 12), M.charcoal);
      b.position.set(x + 4.5, 0.45, WORLD.quayEdgeZ + 1.2);
      this.scene.add(b);
    }
    // crane rails
    for (const z of [WORLD.craneZ + 7, WORLD.craneZ - 9])
      for (const dz of [-0.4, 0.4]) {
        const rail = new THREE.Mesh(new THREE.BoxGeometry(260, 0.08, 0.12), M.steel);
        rail.position.set(225, 0.05, z + dz);
        this.scene.add(rail);
      }

    // road ribbon along the truck path
    const road = roadTexture();
    const N = 1600, W = 7.4;
    const pos: number[] = [], uv: number[] = [], idx: number[] = [];
    const p = new THREE.Vector3(), tan = new THREE.Vector3();
    for (let i = 0; i <= N; i++) {
      const u = i / N;
      this.path.getPointAt(u, p);
      this.path.getTangentAt(u, tan);
      const nx = -tan.z, nz = tan.x;
      pos.push(p.x + nx * W / 2, 0.03, p.z + nz * W / 2, p.x - nx * W / 2, 0.03, p.z - nz * W / 2);
      const v = (u * this.pathLength) / 14;
      uv.push(0, v, 1, v);
      if (i < N) {
        const a = i * 2;
        idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
      }
    }
    const rg = new THREE.BufferGeometry();
    rg.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    rg.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    rg.setIndex(idx);
    rg.computeVertexNormals();
    const roadMesh = new THREE.Mesh(rg, new THREE.MeshStandardMaterial({ map: road, roughness: 0.85, metalness: 0.05 }));
    roadMesh.receiveShadow = true;
    this.scene.add(roadMesh);

    // water
    this.waterNormal = waterNormalTexture();
    this.waterNormal.repeat.set(220, 220);
    const water = new THREE.Mesh(
      new THREE.PlaneGeometry(4000, 4000),
      new THREE.MeshStandardMaterial({
        color: 0x0a2f6e,
        roughness: 0.38,
        metalness: 0.15,
        normalMap: this.waterNormal,
        normalScale: new THREE.Vector2(0.22, 0.22),
        envMapIntensity: 0.9,
      })
    );
    water.rotation.x = -Math.PI / 2;
    water.position.set(200, WORLD.waterY, WORLD.quayEdgeZ - 1990);
    water.receiveShadow = true;
    this.scene.add(water);

    // container blocks (instanced)
    const genericMats = containerMaterials(M, containerSideTexture());
    const yard: { x: number; y: number; z: number; color: number }[] = [];
    const muted = [0x1b2f8a, 0x1e3f7a, 0xc8c8c8, 0xe96a1c, 0xf2f2f2, 0x2a3a55];
    // front row kept sparse so the pick reads clearly; the hero stands alone at x = 0
    yard.push({ x: -13.5, y: 0, z: WORLD.stackZ, color: 0xe96a1c });
    yard.push({ x: -13.5, y: CONTAINER.H, z: WORLD.stackZ, color: 0x1b2f8a });
    yard.push({ x: 17, y: 0, z: WORLD.stackZ, color: 0x1e3f7a });
    yard.push({ x: 17, y: CONTAINER.H, z: WORLD.stackZ, color: 0xc8c8c8 });
    for (const z of [-22, -24.6, -27.2])
      for (const x of [-38, -25, -12, 1, 14, 27, 40]) {
        const tiers = 1 + Math.floor(r() * 3);
        for (let t = 0; t < tiers; t++) yard.push({ x, y: t * CONTAINER.H, z, color: muted[Math.floor(r() * muted.length)] });
      }
    this.scene.add(buildContainerBlock(genericMats, yard));

    const port: { x: number; y: number; z: number; color: number }[] = [];
    for (let z = -122; z <= -110; z += 2.6)
      for (let x = 240; x <= 330; x += 12.6) {
        const tiers = 1 + Math.floor(r() * 3);
        for (let t = 0; t < tiers; t++) port.push({ x, y: t * CONTAINER.H, z, color: muted[Math.floor(r() * muted.length)] });
      }
    this.scene.add(buildContainerBlock(genericMats, port));

    // the vessel
    this.ship = buildShip(M, genericMats);
    this.scene.add(this.ship.root);
    const wakeTex = wakeTexture();
    this.wake = new THREE.Mesh(
      new THREE.PlaneGeometry(200, 70),
      new THREE.MeshBasicMaterial({ map: wakeTex, transparent: true, opacity: 0, depthWrite: false, fog: true })
    );
    this.wake.rotation.x = -Math.PI / 2;
    this.wake.rotation.z = Math.PI; // bright end of the texture at the stern
    this.wake.position.set(-74 - 100, WORLD.waterY + 0.05, 0);
    this.ship.root.add(this.wake);
    this.bowWave = new THREE.Mesh(
      new THREE.PlaneGeometry(60, 44),
      new THREE.MeshBasicMaterial({ map: wakeTex, transparent: true, opacity: 0, depthWrite: false })
    );
    this.bowWave.rotation.x = -Math.PI / 2;
    this.bowWave.rotation.z = Math.PI;
    this.bowWave.position.set(70, WORLD.waterY + 0.06, 0);
    this.ship.root.add(this.bowWave);

    // neighbouring cranes for a believable terminal
    for (const dx of [-56]) {
      const c = buildQuayCrane(M, false);
      c.set(dx < 0 ? -6 : 10, 20);
      c.root.position.set(WORLD.craneX + dx, 0, WORLD.craneZ);
      this.scene.add(c.root);
    }
  }

  private buildActors() {
    const M = this.M;
    this.stacker = buildReachStacker(M);
    this.stacker.root.rotation.y = Math.PI / 2; // faces -Z, toward the stack
    this.scene.add(this.stacker.root);

    this.truck = buildTruck(M);
    this.scene.add(this.truck.tractor, this.truck.trailer);

    this.crane = buildQuayCrane(M, true);
    this.crane.root.position.set(WORLD.craneX, 0, WORLD.craneZ);
    this.scene.add(this.crane.root);
    for (const [dx, dz] of [[0, -18], [0, 4]]) {
      const p = new THREE.PointLight(0xffe7c2, 0, 140, 1);
      p.position.set(WORLD.craneX + dx, 27, WORLD.craneZ + dz);
      this.floods.push(p);
      this.scene.add(p);
    }

    // truck headlights: one spotlight for the road pool, two additive cones for the beams
    this.headlight.position.set(5.1, 1.1, 0);
    this.headlight.target.position.set(30, -1.5, 0);
    this.truck.tractor.add(this.headlight, this.headlight.target);
    const beamGeo = new THREE.ConeGeometry(2.6, 16, 24, 1, true);
    beamGeo.translate(0, -8, 0);
    beamGeo.rotateZ(Math.PI / 2); // apex at the lamp, opening toward +X
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0xfff0c8, alphaMap: beamTexture(), transparent: true, opacity: 0,
      blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
    });
    for (const z of [-0.95, 0.95]) {
      const b = new THREE.Mesh(beamGeo, beamMat);
      b.position.set(5.1, 0.95, z);
      b.rotation.z = -0.06;
      b.userData.noShadow = true;
      this.beams.push(b);
      this.truck.tractor.add(b);
    }

    // courier + parcel
    this.courier = buildCourier(M);
    this.scene.add(this.courier.root);
    this.parcel = buildParcel(M);
    this.scene.add(this.parcel);

    this.heroCtl = buildHeroContainer(M);
    this.hero = this.heroCtl.mesh;
    // the hero waits on the ground, doors open, so the courier can load it
    const stackSocket = new THREE.Object3D();
    stackSocket.position.set(0, 0, WORLD.stackZ);
    this.scene.add(stackSocket);
    this.sockets = [stackSocket, this.stacker.socket, this.truck.socket, this.crane.socket!, this.ship.socket];
    stackSocket.add(this.hero);

    this.scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      const mats = Array.isArray(m.material) ? m.material : [m.material];
      if (mats.some((x) => (x as THREE.MeshStandardMaterial).transparent)) return;
      if (m.geometry.type === "PlaneGeometry" || m.userData.noShadow) return;
      m.castShadow = true;
      m.receiveShadow = true;
    });
  }

  /** Initial state = first frame of the film. */
  initialState(): JourneyState {
    return {
      stackerX: 0, stackerZ: 46, stackerYaw: Math.PI / 2, tipX: 5.0, tipY: 5.5, spread: 0, mode: 0,
      truckS: this.sYard - 140, trolleyZ: 0, hoist: 20, shipX: 0, shipZ: 0, shipYaw: 0, wake: 0,
      tx: 7, ty: 1.3, tz: -5.2, follow: 0, az: 0.98, el: 0.1, dist: 15.5, fov: 30, shift: 0.12, bg: 0,
      courierX: 12.5, courierZ: 3.5, courierYaw: 0, stride: 0, carry: 1, lean: 0, place: 0, doors: 1, night: 1,
    };
  }

  resize(w: number, h: number) {
    this.width = w;
    this.height = h;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  private placeTruck(s: number) {
    const L = this.pathLength;
    const at = (d: number, out: THREE.Vector3) => this.path.getPointAt(THREE.MathUtils.clamp(d / L, 0, 1), out);
    const { k, f, q } = this.tmp;
    at(s, k);
    at(s + 3.8, f);
    at(s - 9.9, q);
    const { tractor, trailer } = this.truck;
    tractor.position.copy(k);
    tractor.rotation.y = Math.atan2(-(f.z - k.z), f.x - k.x);
    trailer.position.copy(k);
    trailer.rotation.y = Math.atan2(-(k.z - q.z), k.x - q.x);
    for (const w of this.truck.tractorWheels) w.rotation.z = -s / 0.52;
    for (const w of this.truck.trailerWheels) w.rotation.z = -s / 0.5;
  }

  /** Apply a state. `t` is timeline time, used for the speed readout. */
  update(S: JourneyState, t: number) {
    // reach stacker
    this.stacker.root.position.set(S.stackerX, 0, S.stackerZ);
    this.stacker.root.rotation.y = S.stackerYaw;
    this.stacker.setTip(S.tipX, S.tipY);
    this.stacker.setExtension(S.spread);
    this.stacker.roll(46 - S.stackerZ - S.stackerX);
    this.stacker.root.visible = S.stackerX > -150;

    this.placeTruck(S.truckS);
    this.crane.set(S.trolleyZ, S.hoist);

    this.ship.root.position.set(this.shipBaseX + S.shipX, 0, WORLD.shipZ + S.shipZ);
    this.ship.root.rotation.y = S.shipYaw;
    (this.wake.material as THREE.MeshBasicMaterial).opacity = S.wake * 0.9;
    (this.bowWave.material as THREE.MeshBasicMaterial).opacity = S.wake * 0.6;

    const socket = this.sockets[Math.round(THREE.MathUtils.clamp(S.mode, 0, 4))];
    if (this.hero.parent !== socket) socket.add(this.hero);

    this.updatePrologue(S);
    this.applyNight(S.night);

    // HUD speed: truck in km/h, ship in knots
    const dt = t - this.prev.t;
    if (Math.abs(dt) > 1e-4) {
      const vTruck = Math.abs(S.truckS - this.prev.s) / Math.abs(dt);
      const vShip = Math.abs(S.shipX - this.prev.ship) / Math.abs(dt);
      const raw = S.mode >= 4 ? vShip * 1.1 : vTruck * 3.6;
      this.speed += (raw - this.speed) * 0.25;
    } else this.speed *= 0.9;
    this.prev = { t, s: S.truckS, ship: S.shipX };

    // background / fog tone
    const bg = this.scene.background as THREE.Color;
    bg.copy(BG_STUDIO).lerp(BG_PORT, S.bg).lerp(BG_NIGHT, S.night);
    this.scene.fog!.color.copy(bg);

    this.updateCamera(S);
  }

  private pa = new THREE.Vector3();
  private pb = new THREE.Vector3();
  private updatePrologue(S: JourneyState) {
    const c = this.courier;
    c.root.position.set(S.courierX, 0, S.courierZ);
    c.root.rotation.y = S.courierYaw;
    c.root.visible = S.courierX > -9; // hidden once he is behind the neighbouring stack
    c.pose(S.stride, S.carry, S.lean);
    this.heroCtl.setDoors(S.doors);

    // parcel: carried → slid onto the container floor → travels with the container
    if (S.place >= 1) {
      if (this.parcel.parent !== this.heroCtl.parcelSocket) {
        this.heroCtl.parcelSocket.add(this.parcel);
        this.parcel.position.set(0, 0, 0);
        this.parcel.rotation.set(0, 0, 0);
      }
      return;
    }
    if (this.parcel.parent !== this.scene) this.scene.add(this.parcel);
    this.scene.updateMatrixWorld();
    c.hands.getWorldPosition(this.pa);
    this.pa.y -= 0.21;
    this.heroCtl.parcelSocket.getWorldPosition(this.pb);
    const k = THREE.MathUtils.smootherstep(S.place, 0, 1);
    this.parcel.position.lerpVectors(this.pa, this.pb, k);
    this.parcel.position.y += Math.sin(k * Math.PI) * 0.12;
    this.parcel.rotation.set(0, S.courierYaw * (1 - k), 0);
  }

  /** Day → night: sky, sun → moon, exposure, and the lights that switch on after dusk. */
  private applyNight(n: number) {
    if (Math.abs(n - this.night) < 1e-4) return;
    this.night = n;
    const lerp = THREE.MathUtils.lerp;
    this.sun.color.copy(SUN_DAY).lerp(SUN_NIGHT, n);
    this.sun.intensity = lerp(2.4, 0.42, n);
    this.hemi.color.copy(SKY_DAY).lerp(SKY_NIGHT, n);
    this.hemi.groundColor.copy(GROUND_DAY).lerp(GROUND_NIGHT, n);
    this.hemi.intensity = lerp(0.9, 0.38, n);
    this.scene.environmentIntensity = lerp(0.55, 0.12, n);
    this.renderer.toneMappingExposure = lerp(1.05, 1.12, n);
    // lights come on through dusk rather than popping
    const lit = THREE.MathUtils.smoothstep(n, 0.35, 0.9);
    this.headlight.intensity = lit * 40;
    for (const b of this.beams) (b.material as THREE.MeshBasicMaterial).opacity = lit * 0.22;
    for (const f of this.floods) f.intensity = lit * 70;
    const M = this.M;
    M.lamp.emissiveIntensity = 2.2 + lit * 6;
    M.tail.emissiveIntensity = 1.4 + lit * 3;
    M.windowGlow.emissiveIntensity = lit * 2.4;
    M.flood.emissiveIntensity = 0.2 + lit * 6;
  }

  private updateCamera(S: JourneyState) {
    this.scene.updateMatrixWorld();
    this.hero.getWorldPosition(this.v);
    this.v.y += CONTAINER.H / 2;
    this.target.set(S.tx, S.ty, S.tz).lerp(this.v, S.follow);

    const aspect = this.width / this.height;
    // keep the same horizontal coverage on portrait screens
    const ref = 1.55;
    const k = aspect < ref ? Math.pow(ref / aspect, 0.82) : 1;
    const dist = S.dist * k;
    const cam = this.camera;
    cam.fov = S.fov;
    // portrait: frame the subject in the upper part, the chapter copy sits below it
    if (aspect < 1) cam.setViewOffset(this.width, this.height, 0, this.height * 0.15, this.width, this.height);
    else cam.clearViewOffset();
    cam.updateProjectionMatrix();

    const shift = this.opts.mobile || aspect < 1 ? 0 : S.shift;
    const visW = 2 * dist * Math.tan(THREE.MathUtils.degToRad(S.fov) / 2) * aspect;
    const rx = Math.cos(S.az), rz = -Math.sin(S.az);
    this.target.x -= rx * shift * visW;
    this.target.z -= rz * shift * visW;

    const ce = Math.cos(S.el);
    cam.position.set(
      this.target.x + Math.sin(S.az) * ce * dist,
      this.target.y + Math.sin(S.el) * dist,
      this.target.z + Math.cos(S.az) * ce * dist
    );
    cam.lookAt(this.target);

    const fog = this.scene.fog as THREE.Fog;
    fog.near = dist * 1.3;
    fog.far = dist * 5.5;

    // shadow frustum follows what we look at
    const ext = THREE.MathUtils.clamp(dist * 0.75, 22, 150);
    const sc = this.sun.shadow.camera;
    if (sc.right !== ext) {
      sc.left = -ext; sc.right = ext; sc.top = ext; sc.bottom = -ext;
      sc.near = 1; sc.far = 600;
      sc.updateProjectionMatrix();
    }
    this.sunTarget.position.copy(this.target);
    this.sun.position.copy(this.target).add(this.v.set(60, 120, 70));
  }

  /** Per-frame ambience that is independent of scroll. */
  tick(time: number) {
    this.waterNormal.offset.set(time * 0.006, time * 0.011);
    (this.M.beacon as THREE.MeshStandardMaterial).emissiveIntensity = 1.2 + Math.sin(time * 7) * 0.9;
    this.ship.root.position.y = Math.sin(time * 0.6) * 0.08;
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.renderer.dispose();
    this.scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) {
        m.geometry?.dispose();
        const mats = Array.isArray(m.material) ? m.material : [m.material];
        mats.forEach((x) => x.dispose());
      }
    });
  }
}

export { rowZ };
