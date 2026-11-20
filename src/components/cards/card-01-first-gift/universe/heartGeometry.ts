import * as THREE from "three";

let cachedHeartGeometry: THREE.BufferGeometry | null = null;
let cachedStar3DGeometry: THREE.BufferGeometry | null = null;
let cachedGiftBox3DGeometry: THREE.BufferGeometry | null = null;

export function createHeartGeometry(numTheta = 80, numPhi = 50): THREE.BufferGeometry {
  function F(x: number, y: number, z: number): number {
    const t = x * x + y * y + (9 / 4) * z * z - 1;
    return t * t * t - x * x * y * y * y - (9 / 80) * z * z * y * y * y;
  }

  const y0 = 0.2;
  const rawVertices: number[] = [];
  const uvs: number[] = [];

  for (let j = 0; j <= numPhi; j++) {
    const v = j / numPhi;
    const phi = v * Math.PI - Math.PI / 2;
    const cosPhi = Math.cos(phi);
    const sinPhi = Math.sin(phi);

    for (let i = 0; i <= numTheta; i++) {
      const u = i / numTheta;
      const theta = u * Math.PI * 2 - Math.PI;

      const dx = cosPhi * Math.sin(theta);
      const dy = sinPhi;
      const dz = cosPhi * Math.cos(theta);

      let rMin = 0.1;
      let rMax = 2.5;
      for (let step = 0.2; step <= 2.5; step += 0.05) {
        if (F(step * dx, y0 + step * dy, step * dz) > 0) {
          rMax = step;
          rMin = step - 0.05;
          break;
        }
      }

      for (let it = 0; it < 18; it++) {
        const mid = (rMin + rMax) / 2;
        if (F(mid * dx, y0 + mid * dy, mid * dz) > 0) {
          rMax = mid;
        } else {
          rMin = mid;
        }
      }
      const r = (rMin + rMax) / 2;

      let px = r * dx;
      let py = y0 + r * dy;
      let pz = r * dz;

      const rawCenterY = 0.118068;
      const scaleY = 2.0 / 2.236136;
      py = (py - rawCenterY) * scaleY;
      px = px * scaleY * 1.02;
      pz = pz * 0.58;

      rawVertices.push(px, py, pz);
      uvs.push(u, v);
    }
  }

  const indices: number[] = [];
  for (let j = 0; j < numPhi; j++) {
    for (let i = 0; i < numTheta; i++) {
      const a = j * (numTheta + 1) + i;
      const b = (j + 1) * (numTheta + 1) + i;
      const c = (j + 1) * (numTheta + 1) + (i + 1);
      const d = j * (numTheta + 1) + (i + 1);
      indices.push(a, d, b);
      indices.push(b, d, c);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(rawVertices, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  const normals = geometry.getAttribute("normal") as THREE.BufferAttribute;

  const northPoleNormal = new THREE.Vector3();
  for (let i = 0; i <= numTheta; i++) {
    const idx = numPhi * (numTheta + 1) + i;
    northPoleNormal.add(new THREE.Vector3(normals.getX(idx), normals.getY(idx), normals.getZ(idx)));
  }
  northPoleNormal.normalize();
  for (let i = 0; i <= numTheta; i++) {
    const idx = numPhi * (numTheta + 1) + i;
    normals.setXYZ(idx, northPoleNormal.x, northPoleNormal.y, northPoleNormal.z);
  }

  const southPoleNormal = new THREE.Vector3();
  for (let i = 0; i <= numTheta; i++) {
    const idx = i;
    southPoleNormal.add(new THREE.Vector3(normals.getX(idx), normals.getY(idx), normals.getZ(idx)));
  }
  southPoleNormal.normalize();
  for (let i = 0; i <= numTheta; i++) {
    const idx = i;
    normals.setXYZ(idx, southPoleNormal.x, southPoleNormal.y, southPoleNormal.z);
  }

  normals.needsUpdate = true;
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();

  return geometry;
}

export function getHeartGeometry(): THREE.BufferGeometry {
  if (!cachedHeartGeometry) {
    cachedHeartGeometry = createHeartGeometry();
  }
  return cachedHeartGeometry;
}

export function getStar3DGeometry(): THREE.BufferGeometry {
  if (cachedStar3DGeometry) return cachedStar3DGeometry;
  const numPoints = 5;
  const rOuter = 0.55;
  const rInner = 0.24;
  const depth = 0.22;

  const positions: number[] = [0, 0, depth, 0, 0, -depth];
  const indices: number[] = [];

  for (let i = 0; i < numPoints * 2; i++) {
    const angle = (i * Math.PI) / numPoints - Math.PI / 2;
    const r = i % 2 === 0 ? rOuter : rInner;
    positions.push(Math.cos(angle) * r, Math.sin(angle) * r, 0);
  }

  for (let i = 0; i < 10; i++) {
    const curr = 2 + i;
    const next = 2 + ((i + 1) % 10);
    indices.push(0, curr, next);
    indices.push(1, next, curr);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  cachedStar3DGeometry = geometry;
  return geometry;
}

function mergeGeometries(geos: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const nonIndexed = geos.map((g) => (g.index ? g.toNonIndexed() : g.clone()));
  let totalVerts = 0;
  for (const g of nonIndexed) {
    totalVerts += g.getAttribute("position").count;
  }

  const posArr = new Float32Array(totalVerts * 3);
  const normArr = new Float32Array(totalVerts * 3);
  let offset = 0;

  for (const g of nonIndexed) {
    const p = g.getAttribute("position").array as Float32Array;
    const n = g.getAttribute("normal").array as Float32Array;
    posArr.set(p, offset * 3);
    normArr.set(n, offset * 3);
    offset += g.getAttribute("position").count;
    g.dispose();
  }

  const merged = new THREE.BufferGeometry();
  merged.setAttribute("position", new THREE.BufferAttribute(posArr, 3));
  merged.setAttribute("normal", new THREE.BufferAttribute(normArr, 3));
  merged.computeBoundingBox();
  merged.computeBoundingSphere();
  return merged;
}

export function getGiftBox3DGeometry(): THREE.BufferGeometry {
  if (cachedGiftBox3DGeometry) return cachedGiftBox3DGeometry;
  const boxGeo = new THREE.BoxGeometry(0.55, 0.55, 0.55);
  boxGeo.translate(0, -0.05, 0);
  const lidGeo = new THREE.BoxGeometry(0.6, 0.14, 0.6);
  lidGeo.translate(0, 0.24, 0);
  const ribbonZ = new THREE.BoxGeometry(0.12, 0.65, 0.62);
  ribbonZ.translate(0, 0.01, 0);
  const ribbonX = new THREE.BoxGeometry(0.62, 0.65, 0.12);
  ribbonX.translate(0, 0.01, 0);
  const bowGeo = new THREE.SphereGeometry(0.09, 8, 8);
  bowGeo.scale(1.3, 0.7, 1.3);
  bowGeo.translate(0, 0.33, 0);

  const merged = mergeGeometries([boxGeo, lidGeo, ribbonZ, ribbonX, bowGeo]);
  boxGeo.dispose();
  lidGeo.dispose();
  ribbonZ.dispose();
  ribbonX.dispose();
  bowGeo.dispose();
  cachedGiftBox3DGeometry = merged;
  return merged;
}
