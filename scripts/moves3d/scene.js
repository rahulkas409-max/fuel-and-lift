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
scene.background = new THREE.Color("#eef3fa");
scene.fog = new THREE.Fog("#eef3fa", 700, 1300);
scene.add(new THREE.HemisphereLight(0xffffff, 0xcfd6e2, 1.5));
const key = new THREE.DirectionalLight(0xffffff, 2.3);
key.position.set(90, 220, 170);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
Object.assign(key.shadow.camera, { left: -180, right: 180, top: 180, bottom: -180, near: 10, far: 700 });
key.shadow.radius = 5;
key.shadow.bias = -0.0005;
scene.add(key);
const fill = new THREE.DirectionalLight(0xdfe8ff, 0.7);
fill.position.set(-160, 90, -80);
scene.add(fill);

const mat = (color, rough = 0.6) => new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: 0 });
const M = {
  skin: mat("#c98b62", 0.55),
  shirt: mat("#1a73e8", 0.7),
  pants: mat("#2b3446", 0.75),
  shoe: mat("#f3f4f6", 0.5),
  sole: mat("#4a5568", 0.6),
  hair: mat("#2b1f1a", 0.8),
  eye: mat("#1b1b1b", 0.4),
  prop: mat("#cbd3df", 0.8),
  towel: mat("#f28b82", 0.9),
};

const floor = new THREE.Mesh(new THREE.PlaneGeometry(3000, 3000), mat("#e6ecf5", 0.95));
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);
const yogaMat = new THREE.Mesh(new THREE.BoxGeometry(200, 1.2, 64), mat("#a8dcc0", 0.9));
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
for (const h of ["N", "F"]) {
  P[`sleeve${h}`] = seg(5.3, 4.8, M.shirt);
  P[`ua${h}`] = seg(4.1, 3.4, M.skin);
  P[`el${h}`] = ball(3.4, M.skin);
  P[`fa${h}`] = seg(3.3, 2.6, M.skin);
  P[`hand${h}`] = ball(3.2, M.skin);
  P[`shB${h}`] = ball(5.6, M.shirt);
  P[`th${h}`] = seg(6.8, 4.9, M.pants);
  P[`kn${h}`] = ball(4.9, M.pants);
  P[`sh${h}`] = seg(4.8, 3.2, M.pants);
  P[`ank${h}`] = ball(3.2, M.shoe);
  P[`foot${h}`] = seg(3.3, 2.8, M.shoe);
  P[`toe${h}`] = ball(2.8, M.shoe);
  P[`hpB${h}`] = ball(6.8, M.pants);
}
P.pelvis = ball(1, M.pants);
P.waist = seg(1, 1, M.shirt);
P.chest = ball(1, M.shirt);
P.neck = seg(3.5, 3.3, M.skin);
P.head = ball(9.3, M.skin, 40);
const hairGeo = new THREE.SphereGeometry(9.9, 40, 24, 0, Math.PI * 2, 0, Math.PI * 0.56);
P.hair = add(new THREE.Mesh(hairGeo, M.hair));
P.nose = ball(1.7, M.skin, 16);
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
  const zOf = (k) => (!side ? 0 : k.endsWith("N") ? (/^(sh|el|ha)/.test(k) ? 11 : 6.5) : k.endsWith("F") ? (/^(sh|el|ha)/.test(k) ? -11 : -6.5) : 0);
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
  const [px, pz] = lat(11.2, 8);
  P.pelvis.set(hip.clone().addScaledVector(u, 3), [px, 10, pz], q);
  const [wx, wz] = lat(10.4, 7.4);
  P.waist.set(hip.clone().addScaledVector(u, 6), mid.clone().addScaledVector(mid.clone().sub(hip).normalize(), 4), wx, wz);
  const cu = neck.clone().sub(mid).normalize();
  const cq = new THREE.Quaternion().setFromUnitVectors(UP, cu);
  const [cx, cz] = lat(12.6, 8.6);
  P.chest.set(mid.clone().addScaledVector(cu, tl * 0.26), [cx, tl * 0.36, cz], cq);
  for (const h of ["N", "F"]) {
    const sh = side ? shMid.clone().setZ(J[`sh${h}`].z) : J[`sh${h}`];
    const el = J[`el${h}`], ha = J[`ha${h}`];
    P[`shB${h}`].set(sh);
    P[`sleeve${h}`].set(sh, sh.clone().lerp(el, 0.45));
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
window.frameMove = (frames, view) => {
  let x0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const f of frames)
    for (const k of ["hip", "neck", "head", "haN", "haF", "anN", "anF", "toN", "toF", "knN", "knF", "elN", "elF"]) {
      x0 = Math.min(x0, f[k][0]); x1 = Math.max(x1, f[k][0]); y1 = Math.max(y1, f[k][1]);
    }
  x0 -= 14; x1 += 14; y1 += 14;
  const cx = (x0 + x1) / 2, cy = y1 / 2 - 2;
  const hw = (x1 - x0) / 2, hh = y1 / 2 + 8;
  const t = Math.tan(((camera.fov / 2) * Math.PI) / 180);
  const D = Math.max(hh / t, hw / (t * camera.aspect), 125) * 1.08 + 20;
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
