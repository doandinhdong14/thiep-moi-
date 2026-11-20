import * as THREE from "three";

export interface PetalGeometryOptions {
  width: number;
  length: number;
  cupDepth: number;
  archDepth: number;
  curlEdge: number;
  ruffleAmp: number;
  wrapAngleRad?: number;
  innerColor?: string;
  mainColor?: string;
  edgeColor?: string;
  uSegments?: number;
  vSegments?: number;
  family?: "core" | "mid" | "outer";
}

export function createCorePetalGeometry(options: PetalGeometryOptions): THREE.BufferGeometry {
  const {
    width,
    length,
    cupDepth = 0.28,
    archDepth = 0.12,
    innerColor = "#C2185B",
    mainColor = "#F48FB1",
    edgeColor = "#FFE4E8",
    uSegments = 18,
    vSegments = 24,
  } = options;

  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];

  const cInner = new THREE.Color(innerColor);
  const cMain = new THREE.Color(mainColor);
  const cEdge = new THREE.Color(edgeColor);

  const wrapAngleRad = options.wrapAngleRad ?? 1.95;

  for (let j = 0; j <= vSegments; j++) {
    const v = j / vSegments;
    const widthFactor = Math.sin(v * Math.PI * 0.72) * (1.0 - 0.12 * v * v);
    const halfWidth = width * 0.5 * Math.max(0.04, widthFactor * (0.15 + 0.85 * Math.sin(v * Math.PI * 0.5)));
    const localWrap = wrapAngleRad * (1.0 - 0.15 * v);
    const wrapRadius = halfWidth / Math.sin(Math.max(0.06, localWrap));

    for (let i = 0; i <= uSegments; i++) {
      const uNorm = i / uSegments;
      const u = (uNorm - 0.5) * 2;
      const theta = u * localWrap;
      const x = wrapRadius * Math.sin(theta);
      const zWrap = -wrapRadius * (1.0 - Math.cos(theta));
      const cupZ = -cupDepth * (1.0 - u * u) * Math.sin(v * Math.PI * 0.85) * width;
      const arcZ = -archDepth * Math.sin(v * Math.PI * 0.75);
      const crestY = -0.05 * (u * u) * length;
      const y = v * length + crestY;
      const z = zWrap + cupZ + arcZ;

      positions.push(x, y, z);
      normals.push(0, 0, 1);
      uvs.push(uNorm, v);

      const color = new THREE.Color();
      if (v < 0.4) {
        color.copy(cInner).lerp(cMain, v / 0.4);
      } else {
        color.copy(cMain).lerp(cEdge, ((v - 0.4) / 0.6) * 0.65);
      }
      const edgeHighlight = Math.pow(Math.abs(u), 2.2) * Math.pow(v, 1.2) * 0.35;
      color.lerp(cEdge, edgeHighlight);
      colors.push(color.r, color.g, color.b);
    }
  }

  for (let j = 0; j < vSegments; j++) {
    for (let i = 0; i < uSegments; i++) {
      const a = j * (uSegments + 1) + i;
      const b = (j + 1) * (uSegments + 1) + i;
      const c = (j + 1) * (uSegments + 1) + (i + 1);
      const d = j * (uSegments + 1) + (i + 1);
      indices.push(a, b, d, b, c, d);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setIndex(indices);
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  return geometry;
}

export function createMidPetalGeometry(options: PetalGeometryOptions): THREE.BufferGeometry {
  const {
    width,
    length,
    cupDepth = 0.34,
    archDepth = 0.2,
    curlEdge = 0.12,
    ruffleAmp = 0.025,
    innerColor = "#C2185B",
    mainColor = "#F48FB1",
    edgeColor = "#FFE4E8",
    uSegments = 20,
    vSegments = 26,
  } = options;

  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];

  const cInner = new THREE.Color(innerColor);
  const cMain = new THREE.Color(mainColor);
  const cEdge = new THREE.Color(edgeColor);

  const wrapAngleRad = options.wrapAngleRad ?? 1.45;

  for (let j = 0; j <= vSegments; j++) {
    const v = j / vSegments;
    const widthFactor = Math.pow(Math.sin(v * Math.PI * 0.62), 0.75) * (1.0 - 0.08 * v);
    const halfWidth = width * 0.5 * Math.max(0.04, widthFactor * (0.12 + 0.88 * Math.sin(v * Math.PI * 0.5)));
    const localWrap = wrapAngleRad * (1.0 - 0.2 * v);
    const wrapRadius = halfWidth / Math.sin(Math.max(0.06, localWrap));

    for (let i = 0; i <= uSegments; i++) {
      const uNorm = i / uSegments;
      const u = (uNorm - 0.5) * 2;
      const theta = u * localWrap;
      const x = wrapRadius * Math.sin(theta);
      const zWrap = -wrapRadius * (1.0 - Math.cos(theta));
      const cupZ = -cupDepth * (1.0 - u * u) * Math.pow(Math.sin(v * Math.PI * 0.8), 0.85) * width;
      const arcZ = -archDepth * Math.sin(v * Math.PI * 0.75);
      const flareZ = curlEdge * Math.pow(Math.max(0, v - 0.6) / 0.4, 2.2) * length;
      const crestY = (1.0 - 0.1 * u * u) * length;
      const softWaveY = ruffleAmp * Math.sin(u * Math.PI) * Math.pow(v, 2.0) * length;
      const y = v * crestY + softWaveY;
      const z = zWrap + cupZ + arcZ + flareZ;

      positions.push(x, y, z);
      normals.push(0, 0, 1);
      uvs.push(uNorm, v);

      const color = new THREE.Color();
      if (v < 0.35) {
        color.copy(cInner).lerp(cMain, v / 0.35);
      } else {
        color.copy(cMain).lerp(cEdge, ((v - 0.35) / 0.65) * 0.75);
      }
      const edgeHighlight = Math.pow(Math.abs(u), 2.0) * Math.pow(v, 1.2) * 0.4;
      color.lerp(cEdge, edgeHighlight);
      colors.push(color.r, color.g, color.b);
    }
  }

  for (let j = 0; j < vSegments; j++) {
    for (let i = 0; i < uSegments; i++) {
      const a = j * (uSegments + 1) + i;
      const b = (j + 1) * (uSegments + 1) + i;
      const c = (j + 1) * (uSegments + 1) + (i + 1);
      const d = j * (uSegments + 1) + (i + 1);
      indices.push(a, b, d, b, c, d);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setIndex(indices);
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  return geometry;
}

export function createOuterPetalGeometry(options: PetalGeometryOptions): THREE.BufferGeometry {
  const {
    width,
    length,
    cupDepth = 0.38,
    archDepth = 0.24,
    curlEdge = 0.2,
    ruffleAmp = 0.035,
    innerColor = "#C2185B",
    mainColor = "#F48FB1",
    edgeColor = "#FFE4E8",
    uSegments = 22,
    vSegments = 28,
  } = options;

  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];

  const cInner = new THREE.Color(innerColor);
  const cMain = new THREE.Color(mainColor);
  const cEdge = new THREE.Color(edgeColor);

  const wrapAngleRad = options.wrapAngleRad ?? 1.18;

  for (let j = 0; j <= vSegments; j++) {
    const v = j / vSegments;
    const widthFactor = Math.pow(Math.sin(v * Math.PI * 0.58), 0.65) * (1.0 - 0.05 * v);
    const halfWidth = width * 0.5 * Math.max(0.04, widthFactor * (0.1 + 0.9 * Math.sin(v * Math.PI * 0.5)));
    const localWrap = wrapAngleRad * (1.0 - 0.28 * v);
    const wrapRadius = halfWidth / Math.sin(Math.max(0.06, localWrap));

    for (let i = 0; i <= uSegments; i++) {
      const uNorm = i / uSegments;
      const u = (uNorm - 0.5) * 2;
      const theta = u * localWrap;
      const x = wrapRadius * Math.sin(theta);
      const zWrap = -wrapRadius * (1.0 - Math.cos(theta));
      const cupZ = -cupDepth * (1.0 - u * u) * Math.pow(Math.sin(v * Math.PI * 0.72), 0.8) * width;
      const arcZ = -archDepth * Math.sin(v * Math.PI * 0.7);
      const flareZ = curlEdge * Math.pow(Math.max(0, v - 0.52) / 0.48, 2.2) * length;
      const sideRollZ = curlEdge * 0.25 * Math.pow(Math.abs(u), 2.2) * Math.pow(v, 1.4) * width;
      const crestY = (1.0 - 0.08 * u * u) * length;
      const softWaveY = ruffleAmp * Math.sin(u * Math.PI) * Math.pow(v, 2.0) * length;
      const y = v * crestY + softWaveY;
      const z = zWrap + cupZ + arcZ + flareZ + sideRollZ;

      positions.push(x, y, z);
      normals.push(0, 0, 1);
      uvs.push(uNorm, v);

      const color = new THREE.Color();
      if (v < 0.3) {
        color.copy(cInner).lerp(cMain, v / 0.3);
      } else {
        color.copy(cMain).lerp(cEdge, ((v - 0.3) / 0.7) * 0.85);
      }
      const edgeHighlight = Math.pow(Math.abs(u), 2.0) * Math.pow(v, 1.1) * 0.45;
      color.lerp(cEdge, edgeHighlight);
      colors.push(color.r, color.g, color.b);
    }
  }

  for (let j = 0; j < vSegments; j++) {
    for (let i = 0; i < uSegments; i++) {
      const a = j * (uSegments + 1) + i;
      const b = (j + 1) * (uSegments + 1) + i;
      const c = (j + 1) * (uSegments + 1) + (i + 1);
      const d = j * (uSegments + 1) + (i + 1);
      indices.push(a, b, d, b, c, d);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setIndex(indices);
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  return geometry;
}

export function createReceptacleGeometry(
  topRadius = 0.13,
  bottomRadius = 0.042,
  height = 0.24,
  colorHex = "#4A7C59"
): THREE.BufferGeometry {
  const geom = new THREE.CylinderGeometry(topRadius, bottomRadius, height, 24, 6, false);
  geom.translate(0, -height * 0.5, 0);
  const baseCol = new THREE.Color(colorHex);
  const darkCol = new THREE.Color(colorHex).multiplyScalar(0.72);
  const colors: number[] = [];
  const pos = geom.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    const t = Math.max(0, Math.min(1, (y + height) / height));
    const c = new THREE.Color().copy(darkCol).lerp(baseCol, t);
    colors.push(c.r, c.g, c.b);
  }
  geom.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geom.computeVertexNormals();
  return geom;
}

export function createSepalGeometry(
  length = 0.42,
  width = 0.13,
  colorHex = "#4A7C59"
): THREE.BufferGeometry {
  const uSegments = 8;
  const vSegments = 16;
  const positions: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];

  const baseColor = new THREE.Color(colorHex);
  const tipColor = new THREE.Color(colorHex).multiplyScalar(1.22);

  for (let j = 0; j <= vSegments; j++) {
    const v = j / vSegments;
    const w = width * 0.5 * (1.0 - Math.pow(v, 1.3) * 0.95);
    const curveY = (Math.sin(v * Math.PI * 0.65) * 0.35 - Math.pow(v, 2.0) * 0.45) * length;
    const curveZ = (Math.sin(v * Math.PI * 0.55) * 0.38 + Math.pow(v, 2.2) * 0.24) * length;

    for (let i = 0; i <= uSegments; i++) {
      const u = (i / uSegments - 0.5) * 2;
      const x = u * w;
      const zRidge = curveZ - Math.abs(u) * 0.02 * (1 - v);
      positions.push(x, curveY, zRidge);
      const c = new THREE.Color().copy(baseColor).lerp(tipColor, v);
      colors.push(c.r, c.g, c.b);
    }
  }

  for (let j = 0; j < vSegments; j++) {
    for (let i = 0; i < uSegments; i++) {
      const a = j * (uSegments + 1) + i;
      const b = (j + 1) * (uSegments + 1) + i;
      const c = (j + 1) * (uSegments + 1) + (i + 1);
      const d = j * (uSegments + 1) + (i + 1);
      indices.push(a, b, d, b, c, d);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setIndex(indices);
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  return geometry;
}

export function createStemGeometry(colorHex = "#4A7C59"): THREE.BufferGeometry {
  const points = [
    new THREE.Vector3(0, -0.16, 0),
    new THREE.Vector3(0.015, -0.9, 0.01),
    new THREE.Vector3(-0.02, -1.8, -0.01),
    new THREE.Vector3(0.01, -2.7, 0.01),
    new THREE.Vector3(0, -3.6, 0),
  ];
  const curve = new THREE.CatmullRomCurve3(points);
  const geom = new THREE.TubeGeometry(curve, 32, 0.036, 12, false);

  const baseCol = new THREE.Color(colorHex);
  const col = new THREE.Color(colorHex).multiplyScalar(0.88);
  const colors: number[] = [];
  const pos = geom.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    const t = Math.max(0, Math.min(1, (y + 3.6) / 3.44));
    const c = new THREE.Color().copy(col).lerp(baseCol, t);
    colors.push(c.r, c.g, c.b);
  }
  geom.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geom.computeVertexNormals();
  return geom;
}

export function createLeafGeometry(
  length = 0.95,
  width = 0.42,
  colorHex = "#4A7C59"
): THREE.BufferGeometry {
  const uSegments = 10;
  const vSegments = 18;
  const positions: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];

  const stemCol = new THREE.Color(colorHex).multiplyScalar(0.82);
  const leafCol = new THREE.Color(colorHex);
  const edgeCol = new THREE.Color(colorHex).multiplyScalar(1.22);

  for (let j = 0; j <= vSegments; j++) {
    const v = j / vSegments;
    const widthFactor = Math.sin(Math.pow(v, 0.72) * Math.PI);
    const halfW = width * 0.5 * Math.max(0.04, widthFactor);
    const arcZ = Math.sin(v * Math.PI) * 0.08 - Math.pow(v, 2.0) * 0.12;
    const y = v * length;

    for (let i = 0; i <= uSegments; i++) {
      const u = (i / uSegments - 0.5) * 2;
      const x = u * halfW;
      const vFold = Math.abs(u) * 0.045 * (1 - v * 0.4);
      const z = arcZ + vFold;
      positions.push(x, y, z);

      const c = new THREE.Color().copy(stemCol).lerp(leafCol, v);
      c.lerp(edgeCol, Math.abs(u) * 0.35);
      colors.push(c.r, c.g, c.b);
    }
  }

  for (let j = 0; j < vSegments; j++) {
    for (let i = 0; i < uSegments; i++) {
      const a = j * (uSegments + 1) + i;
      const b = (j + 1) * (uSegments + 1) + i;
      const c = (j + 1) * (uSegments + 1) + (i + 1);
      const d = j * (uSegments + 1) + (i + 1);
      indices.push(a, b, d, b, c, d);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setIndex(indices);
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  return geometry;
}

export function createFlyingPetalGeometry(
  width = 0.28,
  length = 0.38,
  innerColor = "#C2185B",
  mainColor = "#F48FB1",
  edgeColor = "#FFE4E8"
): THREE.BufferGeometry {
  return createMidPetalGeometry({
    width,
    length,
    cupDepth: 0.22,
    archDepth: 0.12,
    curlEdge: 0.08,
    ruffleAmp: 0.015,
    wrapAngleRad: 1.35,
    innerColor,
    mainColor,
    edgeColor,
    uSegments: 10,
    vSegments: 14,
  });
}
