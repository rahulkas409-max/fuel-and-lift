// A lit 3D mannequin driven by the joint positions from export-frames.ts.
// Loaded in headless Chromium by render.mjs; exposes window.renderPose(frame) → PNG data URL.
import * as THREE from "three";

const W = 720, H = 480;
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setSize(W, H);
renderer.setPixelRatio(1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NeutralToneMapping;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color("#17191d");
scene.fog = new THREE.Fog("#17191d", 650, 1200);
scene.add(new THREE.HemisphereLight(0xffffff, 0xcfd6e2, 1.5));
const key = new THREE.DirectionalLight(0xffffff, 2.3);
key.position.set(90, 220, 170);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
Object.assign(key.shadow.camera, { left: -180, right: 180, top: 180, bottom: -180, near: 10, far: 700 });
key.shadow.radius = 5;
key.shadow.bias = -0.0005;
scene.add(key);
// Rim light from behind so the figure separates from the dark studio background.
const rim = new THREE.DirectionalLight(0xe8f0ff, 1.6);
rim.position.set(-60, 160, -260);
scene.add(rim);
const fill = new THREE.DirectionalLight(0xdfe8ff, 0.7);
fill.position.set(-160, 90, -80);
scene.add(fill);

// ?style=female renders the women's model: ponytail, tank top & leggings, slimmer shoulders, wider hips.
const FEMALE = new URLSearchParams(location.search).get("style") === "female";
const mat = (color, rough = 0.6) => new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: 0 });
const M = {
  skin: mat(FEMALE ? "#c68660" : "#c98b62", 0.55),
  shirt: mat(FEMALE ? "#e0457b" : "#1a73e8", 0.7),
  pants: mat(FEMALE ? "#2e2940" : "#2b3446", 0.75),
  shoe: mat("#f3f4f6", 0.5),
  sole: mat("#4a5568", 0.6),
  hair: mat(FEMALE ? "#231613" : "#2b1f1a", 0.8),
  eye: mat("#1b1b1b", 0.4),
  prop: mat("#5a606a", 0.8),
  towel: mat("#f28b82", 0.9),
};

const floor = new THREE.Mesh(new THREE.PlaneGeometry(3000, 3000), mat("#202328", 0.95));
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);
const yogaMat = new THREE.Mesh(new THREE.BoxGeometry(200, 1.2, 64), mat("#3b4a14", 0.9));
yogaMat.position.y = 0.6;
yogaMat.receiveShadow = true;
scene.add(yogaMat);

const camera = new THREE.PerspectiveCamera(26, W / H, 1, 3000);

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const UP = V(0, 1, 0);
const add = (m) => {
  m.castShadow = true;
  m.receiveShadow = true;
  scene.add(m);
  return m;
};

/** Tapered cylinder from a to b (radius r1 at a, r2 at b), with an elliptical cross-section via sx/sz. */
function seg(r1, r2, material) {
  const m = add(new THREE.Mesh(new THREE.CylinderGeometry(r2, r1, 1, 28, 1), material));
  return {
    set(a, b, sx = 1, sz = 1) {
      const d = b.clone().sub(a);
      const len = d.length() || 0.001;
      m.position.copy(a).addScaledVector(d, 0.5);
      m.quaternion.setFromUnitVectors(UP, d.normalize());
      m.scale.set(sx, len, sz);
    },
    mesh: m,
  };
}
function ball(r, material, segs = 28) {
  const m = add(new THREE.Mesh(new THREE.SphereGeometry(r, segs, Math.round(segs * 0.7)), material));
  return {
    set(p, s = [1, 1, 1], q) {
      m.position.copy(p);
      m.scale.set(...s);
      if (q) m.quaternion.copy(q);
    },
    mesh: m,
  };
}

// ── Body parts ──
const P = {};
// Body proportions (rig units) for each model.
const B = FEMALE
  ? { sleeve: [4.4, 4.2], ua: [3.7, 3.0], fa: [3.0, 2.4], hand: 2.9, shB: 4.8, th: [7.0, 4.6], kn: 4.6, sh: [4.5, 2.9], hpB: 7.2, shZ: 10, hpZ: 7.2, chest: [11.4, 8.4], waist: [9.2, 7], pelvis: [12, 8.4], sleeveLen: 0.12 }
  : { sleeve: [5.3, 4.8], ua: [4.1, 3.4], fa: [3.3, 2.6], hand: 3.2, shB: 5.6, th: [6.8, 4.9], kn: 4.9, sh: [4.8, 3.2], hpB: 6.8, shZ: 11, hpZ: 6.5, chest: [12.6, 8.6], waist: [10.4, 7.4], pelvis: [11.2, 8], sleeveLen: 0.45 };
for (const h of ["N", "F"]) {
  P[`sleeve${h}`] = seg(...B.sleeve, M.shirt);
  P[`ua${h}`] = seg(...B.ua, M.skin);
  P[`el${h}`] = ball(B.ua[1], M.skin);
  P[`fa${h}`] = seg(...B.fa, M.skin);
  P[`hand${h}`] = ball(B.hand, M.skin);
  P[`shB${h}`] = ball(B.shB, FEMALE ? M.skin : M.shirt);
  P[`th${h}`] = seg(...B.th, M.pants);
  P[`kn${h}`] = ball(B.kn, M.pants);
  P[`sh${h}`] = seg(...B.sh, M.pants);
  P[`ank${h}`] = ball(3.2, M.shoe);
  P[`foot${h}`] = seg(3.3, 2.8, M.shoe);
  P[`toe${h}`] = ball(2.8, M.shoe);
  P[`hpB${h}`] = ball(B.hpB, M.pants);
}
P.pelvis = ball(1, M.pants);
P.waist = seg(1, 1, M.shirt);
P.chest = ball(1, M.shirt);
P.neck = seg(3.5, 3.3, M.skin);
P.head = ball(9.3, M.skin, 40);
const hairGeo = new THREE.SphereGeometry(9.9, 40, 24, 0, Math.PI * 2, 0, Math.PI * 0.56);
P.hair = add(new THREE.Mesh(hairGeo, M.hair));
P.nose = ball(1.7, M.skin, 16);
// Ponytail (women's model only)
P.bun = ball(3.6, M.hair, 20);
P.tail = seg(3.1, 1.4, M.hair);
P.bun.mesh.visible = P.tail.mesh.visible = FEMALE;
P.eyeL = ball(0.95, M.eye, 12);
P.eyeR = ball(0.95, M.eye, 12);
const towel = seg(1.8, 1.8, M.towel);
const props = [];

const clearProps = () => {
  for (const p of props.splice(0)) scene.remove(p);
};

function place(fr) {
  const side = fr.view === "side";
  // Side view: the rig is flat, so push near limbs towards the camera and far limbs away.
  const zOf = (k) => (!side ? 0 : k.endsWith("N") ? (/^(sh|el|ha)/.test(k) ? B.shZ : B.hpZ) : k.endsWith("F") ? (/^(sh|el|ha)/.test(k) ? -B.shZ : -B.hpZ) : 0);
  const J = {};
  for (const k of ["hip", "neck", "head", "shN", "shF", "elN", "elF", "haN", "haF", "hpN", "hpF", "knN", "knF", "anN", "anF", "toN", "toF"]) J[k] = V(fr[k][0], fr[k][1], zOf(k));

  const hip = J.hip, neck = J.neck;
  const u = neck.clone().sub(hip);
  const tl = u.length();
  u.normalize();
  // Spine curve (cat–cow, cobra): push the middle of the spine sideways in the drawing plane.
  const perp = V(-u.y, u.x, 0);
  const mid = hip.clone().addScaledVector(u, tl * 0.5).addScaledVector(perp, side ? -fr.bend : 0);
  const shMid = hip.clone().addScaledVector(u, tl * (41 / 46));
  // lateral / depth scale for the torso's elliptical cross-section
  const lat = (w, d) => (side ? [d, w] : [w, d]);
  const q = new THREE.Quaternion().setFromUnitVectors(UP, u);
  const [px, pz] = lat(...B.pelvis);
  P.pelvis.set(hip.clone().addScaledVector(u, 3), [px, 10, pz], q);
  const [wx, wz] = lat(...B.waist);
  P.waist.set(hip.clone().addScaledVector(u, 6), mid.clone().addScaledVector(mid.clone().sub(hip).normalize(), 4), wx, wz);
  const cu = neck.clone().sub(mid).normalize();
  const cq = new THREE.Quaternion().setFromUnitVectors(UP, cu);
  const [cx, cz] = lat(...B.chest);
  P.chest.set(mid.clone().addScaledVector(cu, tl * 0.26), [cx, tl * 0.36, cz], cq);
  for (const h of ["N", "F"]) {
    const sh = side ? shMid.clone().setZ(J[`sh${h}`].z) : J[`sh${h}`];
    const el = J[`el${h}`], ha = J[`ha${h}`];
    P[`shB${h}`].set(sh);
    P[`sleeve${h}`].set(sh, sh.clone().lerp(el, B.sleeveLen));
    P[`ua${h}`].set(sh, el);
    P[`el${h}`].set(el);
    P[`fa${h}`].set(el, ha);
    P[`hand${h}`].set(ha);
    const hp = side ? hip.clone().setZ(J[`hp${h}`].z) : J[`hp${h}`];
    const kn = J[`kn${h}`], an = J[`an${h}`], to = J[`to${h}`];
    P[`hpB${h}`].set(hp);
    P[`th${h}`].set(hp, kn);
    P[`kn${h}`].set(kn);
    P[`sh${h}`].set(kn, an);
    P[`ank${h}`].set(an);
    // Foot: from the heel (just behind the ankle) to the toes.
    const fd = to.clone().sub(an);
    const heel = an.clone().addScaledVector(fd.clone().normalize(), -1.5);
    P[`foot${h}`].set(heel, side ? an.clone().addScaledVector(fd, 1.05) : an.clone().add(V(0, 0, 9)).addScaledVector(fd, 0.4));
    P[`toe${h}`].set(side ? an.clone().addScaledVector(fd, 1.05) : an.clone().add(V(0, 0, 9)).addScaledVector(fd, 0.4));
  }

  // Head
  const head = J.head;
  const hu = head.clone().sub(neck).normalize();
  P.neck.set(shMid.clone().addScaledVector(u, -2), head.clone().addScaledVector(hu, -4));
  P.head.set(head, [1, 1.06, 0.98], new THREE.Quaternion().setFromUnitVectors(UP, hu));
  let face;
  if (!side || fr.noFace) face = V(0, 0, 1);
  else {
    const a = (fr.faceDir * Math.PI) / 180;
    face = V(Math.sin(a), -Math.cos(a), 0);
  }
  // keep the face perpendicular to the head's up direction
  face.addScaledVector(hu, -face.dot(hu)).normalize();
  const hairUp = hu.clone().multiplyScalar(0.75).addScaledVector(face, -0.66).normalize();
  P.hair.position.copy(head).addScaledVector(face, -0.4);
  P.hair.quaternion.setFromUnitVectors(UP, hairUp);
  if (FEMALE) {
    // Ponytail: tied at the back of the crown, hanging back and down under gravity.
    const base = head.clone().addScaledVector(face, -8.6).addScaledVector(hu, 3.2);
    const hang = face.clone().multiplyScalar(-0.55).add(V(0, -1, 0)).normalize();
    P.bun.set(base);
    P.tail.set(base, base.clone().addScaledVector(hang, 15));
  }
  P.nose.set(head.clone().addScaledVector(face, 9.1).addScaledVector(hu, -1.2));
  const sideV = face.clone().cross(hu).normalize();
  P.eyeL.set(head.clone().addScaledVector(face, 8.2).addScaledVector(hu, 1.6).addScaledVector(sideV, 3.2));
  P.eyeR.set(head.clone().addScaledVector(face, 8.2).addScaledVector(hu, 1.6).addScaledVector(sideV, -3.2));

  // Props
  clearProps();
  towel.mesh.visible = false;
  for (const p of fr.props ?? []) {
    if (p.type === "box") {
      const m = add(new THREE.Mesh(new THREE.BoxGeometry(p.w, Math.max(4, p.top), 44), M.prop));
      m.position.set(p.x, Math.max(4, p.top) / 2, 0);
      props.push(m);
    } else if (p.type === "wall") {
      const m = add(new THREE.Mesh(new THREE.BoxGeometry(6, 230, 150), M.prop));
      m.position.set(p.x, 115, 0);
      props.push(m);
    } else if (p.type === "towel") {
      towel.mesh.visible = true;
      towel.set(J.haN, J.haF);
    }
  }
  return J;
}

/** Fit the camera once per move, around every frame's joints, so the view doesn't jump. */
window.frameMove = (frames, view, focus) => {
  // "upper" (neck moves): frame the head and shoulders so small head movements are easy to see.
  const keys = focus === "upper" ? ["neck", "head", "shN", "shF", "elN", "elF"] : ["hip", "neck", "head", "haN", "haF", "anN", "anF", "toN", "toF", "knN", "knF", "elN", "elF"];
  let x0 = Infinity, x1 = -Infinity, y0 = focus === "upper" ? Infinity : 0, y1 = -Infinity;
  for (const f of frames)
    for (const k of keys) {
      x0 = Math.min(x0, f[k][0]); x1 = Math.max(x1, f[k][0]); y1 = Math.max(y1, f[k][1]);
      if (focus === "upper") y0 = Math.min(y0, f[k][1]);
    }
  x0 -= 14; x1 += 14; y1 += 14;
  if (focus === "upper") { y0 -= 10; x0 -= 20; x1 += 20; }
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2 - 2;
  const hw = (x1 - x0) / 2, hh = (y1 - y0) / 2 + 8;
  const t = Math.tan(((camera.fov / 2) * Math.PI) / 180);
  const D = Math.max(hh / t, hw / (t * camera.aspect), focus === "upper" ? 40 : 125) * 1.08 + 20;
  const yaw = ((view === "side" ? 24 : 16) * Math.PI) / 180, pitch = (13 * Math.PI) / 180;
  camera.position.set(cx + Math.sin(yaw) * D * Math.cos(pitch), cy + Math.sin(pitch) * D, Math.cos(yaw) * D * Math.cos(pitch));
  camera.lookAt(cx, cy, 0);
  yogaMat.position.x = cx;
  key.target.position.set(cx, 0, 0);
  key.position.set(cx + 90, 220, 170);
  key.target.updateMatrixWorld();
};

window.renderPose = (fr) => {
  place(fr);
  renderer.render(scene, camera);
  return renderer.domElement.toDataURL("image/png");
};
window.ready = true;
