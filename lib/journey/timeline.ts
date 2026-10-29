import gsap from "gsap";
import { CONTAINER, SHIP, STACKER_SPREADER_DROP, TRAILER_DECK, rowZ } from "./models";
import { JourneyScene, JourneyState, WORLD } from "./scene";

/**
 * The film, in story-seconds. Scroll position maps linearly onto this
 * timeline; every tween writes plain numbers into `state`, and the scene is
 * re-derived from that state each frame — so scrubbing backwards is exact.
 */
/** Length of the courier prologue; the rest of the film starts here. */
export const PROLOGUE = 17;

export const CHAPTERS = [
  { at: 0, key: "pickup", label: "Pickup" },
  { at: PROLOGUE, key: "yard", label: "Yard" },
  { at: PROLOGUE + 19, key: "load", label: "Load" },
  { at: PROLOGUE + 44, key: "road", label: "Road" },
  { at: PROLOGUE + 70, key: "port", label: "Port" },
  { at: PROLOGUE + 91, key: "sea", label: "Sea" },
] as const;

export function buildTimeline(scene: JourneyScene, state: JourneyState) {
  const tl = gsap.timeline({ paused: true, defaults: { ease: "sine.inOut" } });
  tl.add(buildPrologue(state), 0);
  const main = gsap.timeline({ defaults: { ease: "sine.inOut" } });

  const tipX = 5.94; // stacker-local reach to the spreader centre
  const pickZ = WORLD.stackZ + tipX; // stacker position when the spreader is over the stack
  const placeZ = WORLD.laneZ + tipX; // ...and over the trailer
  const stackTop = CONTAINER.H; // the hero waits on the ground
  const onTrailerTop = TRAILER_DECK + CONTAINER.H;
  const slotTop = SHIP.deckY + 0.5 + (SHIP.heroTier + 1) * CONTAINER.H;
  const slotTrolley = WORLD.shipZ + rowZ(SHIP.heroRow) - WORLD.craneZ;
  const tip = (spreaderBottom: number) => spreaderBottom + STACKER_SPREADER_DROP;

  /* ---------------- 1 · YARD: the stacker rolls in and picks ---------------- */
  main.to(state, { stackerZ: pickZ, duration: 10, ease: "power2.out" }, 0)
    .to(state, { tipX, tipY: tip(stackTop + 0.7), duration: 5 }, 3.5)
    .to(state, { spread: 1, duration: 4 }, 5)
    .to(state, { az: 0.72, el: 0.2, dist: 38, tz: -4, shift: 0.14, duration: 10 }, 0)
    .to(state, { tipY: tip(stackTop), duration: 4, ease: "power1.inOut" }, 10)
    .set(state, { mode: 1 }, 14.2)
    .to(state, { tipY: tip(stackTop) + 2.6, duration: 4, ease: "power2.inOut" }, 14.6)
    .to(state, { az: 0.95, el: 0.16, dist: 34, ty: 4.2, duration: 5 }, 10);

  /* ---------------- 2 · LOAD: truck arrives, container goes onto the trailer ---------------- */
  main.to(state, { stackerZ: 12, duration: 7, ease: "power2.inOut" }, 19)
    .to(state, { truckS: scene.sYard, duration: 12, ease: "power3.out" }, 21)
    .to(state, { az: 0.5, el: 0.2, dist: 46, tx: -3, tz: 0, ty: 3.2, shift: 0.12, duration: 9 }, 19)
    .to(state, { stackerZ: placeZ, duration: 4.5, ease: "power2.inOut" }, 33)
    .to(state, { tipY: tip(onTrailerTop), duration: 3.2, ease: "power2.inOut" }, 36.6)
    .set(state, { mode: 2 }, 39.9)
    .to(state, { tipY: tip(onTrailerTop) + 2, spread: 0, duration: 2.5 }, 40.2)
    .to(state, { stackerZ: 13, duration: 2, ease: "power2.inOut" }, 40.6)
    .to(state, { stackerX: -170, stackerYaw: Math.PI, duration: 5, ease: "power2.in" }, 41.8)
    .to(state, { az: 0.28, el: 0.14, dist: 36, tx: 0, tz: -1, duration: 6 }, 34);

  /* ---------------- 3 · ROAD: side tracking shot, then rise to top-down ---------------- */
  const roadEnd = scene.sCrane;
  main.to(state, { follow: 1, az: 0.02, el: 0.05, dist: 34, fov: 30, shift: 0.18, duration: 5 }, 42)
    .to(state, { truckS: roadEnd, duration: 29, ease: "power2.inOut" }, 44)
    .to(state, { el: 1.535, az: 0, dist: 92, fov: 34, shift: 0.0, duration: 9, ease: "power2.inOut" }, 52)
    .to(state, { dist: 110, duration: 6 }, 61)
    .to(state, { bg: 1, duration: 8 }, 64)
    // the long haul: dusk falls on the highway, the port is reached at night
    .to(state, { night: 1, duration: 12, ease: "sine.inOut" }, 52.5);

  /* ---------------- 4 · PORT: quay crane lifts the box onto the vessel ---------------- */
  main.to(state, { tx: WORLD.craneX + 6, ty: 13, tz: WORLD.craneZ - 10, duration: 0.01 }, 66)
    .to(state, { follow: 0.55, el: 0.34, az: 0.42, dist: 78, fov: 32, shift: 0.12, duration: 8, ease: "power2.inOut" }, 67)
    .to(state, { hoist: onTrailerTop, duration: 3.4, ease: "power2.inOut" }, 73.2)
    .set(state, { mode: 3 }, 76.7)
    .to(state, { hoist: 25, duration: 3, ease: "power2.inOut" }, 77)
    .to(state, { truckS: roadEnd + 90, duration: 9, ease: "power2.in" }, 78.4)
    .to(state, { trolleyZ: slotTrolley, duration: 4, ease: "power2.inOut" }, 79.6)
    .to(state, { hoist: slotTop, duration: 3, ease: "power2.inOut" }, 83.4)
    .set(state, { mode: 4 }, 86.5)
    .to(state, { hoist: 24, trolleyZ: -4, duration: 4, ease: "power2.inOut" }, 86.8)
    .to(state, { az: 0.3, el: 0.36, dist: 70, follow: 0.85, duration: 6 }, 79);

  /* ---------------- 5 · SEA: the vessel sails, camera goes overhead ---------------- */
  main.to(state, { shipX: 380, shipZ: -150, shipYaw: 0.38, duration: 12, ease: "power1.in" }, 89)
    .to(state, { wake: 1, duration: 4 }, 90)
    .to(state, { follow: 1, el: 1.53, az: -Math.PI / 2 + 0.001, dist: 150, fov: 34, shift: 0, duration: 9, ease: "power2.inOut" }, 89)
    .to(state, { dist: 190, duration: 4 }, 98);

  tl.add(main, PROLOGUE);
  return tl;
}

/**
 * Prologue: a courier walks up to the open container, slides a parcel onto
 * its floor, the doors swing shut and he leaves behind the box — then the
 * camera pulls back into the opening shot of the yard sequence.
 */
function buildPrologue(state: JourneyState) {
  const tl = gsap.timeline({ defaults: { ease: "sine.inOut" } });
  // stride is the distance walked; it advances with position so legs never slide
  const door = { x: 6.78, z: -5.85 }; // just outside the doors, facing the front step of cargo
  const approach = Math.hypot(door.x - state.courierX, door.z - state.courierZ);
  state.courierYaw = Math.atan2(-(door.z - state.courierZ), door.x - state.courierX);
  let stride = approach;

  // the film opens before dawn: the yard lights fade as the sun comes up over the first steps
  tl.fromTo(state, { night: 1 }, { night: 0, duration: 5, ease: "sine.inOut" }, 0);
  tl.to(state, { courierX: door.x, courierZ: door.z, stride, duration: 6.4 }, 0)
    .to(state, { courierYaw: Math.PI, stride: (stride += 0.5), duration: 1 }, 5.9)
    // lean in and slide the parcel onto the container floor
    .to(state, { lean: 0.55, duration: 1.4 }, 7.1)
    .to(state, { place: 1, duration: 2.2, ease: "power1.inOut" }, 7.3)
    .to(state, { lean: 0, carry: 0, duration: 1.1 }, 9.6)
    // step back, the doors swing shut
    .to(state, { courierX: door.x + 1.2, stride: (stride += 1.2), duration: 1.1 }, 10.3)
    .to(state, { doors: 0, duration: 2.2, ease: "power2.inOut" }, 10.7)
    // round the corner and walk off behind the container (out of sight of the camera)
    .to(state, { courierYaw: 1.8, duration: 0.6 }, 11.5)
    .to(state, { courierX: 7.6, courierZ: -8.5, stride: (stride += 2.7), duration: 1.7 }, 11.6)
    .to(state, { courierYaw: Math.PI, duration: 0.6 }, 13.1)
    .to(state, { courierX: -9.5, courierZ: -8.6, stride: (stride += 17.1), duration: 11, ease: "none" }, 13.3);

  // camera: close on the door, gentle push in, then pull back to the yard wide shot
  tl.to(state, { dist: 12.5, az: 1.12, tx: 6.6, ty: 1.15, duration: 9.5 }, 0)
    .to(state, { az: 0.42, el: 0.1, dist: 30, tx: 0, ty: 3.2, tz: -5, fov: 32, shift: 0.16, duration: 6.5, ease: "power2.inOut" }, 10.5);
  return tl;
}
