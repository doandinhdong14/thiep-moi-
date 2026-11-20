import * as THREE from "three";

export const flipUvVertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const flipUvFragmentShader = /* glsl */ `
  uniform sampler2D map;
  uniform vec3 uColor;
  uniform float uOpacity;
  varying vec2 vUv;

  void main() {
    if (uOpacity <= 0.001) discard;
    vec2 uv = gl_FrontFacing ? vUv : vec2(1.0 - vUv.x, vUv.y);
    vec4 tex = texture2D(map, uv);
    if (tex.a < 0.002) discard;
    gl_FragColor = vec4(tex.rgb * uColor * uOpacity, tex.a * uOpacity);
  }
`;

export const flipUvHaloFragmentShader = /* glsl */ `
  uniform sampler2D map;
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uGlowIntensity;
  varying vec2 vUv;

  void main() {
    if (uOpacity <= 0.001 || uGlowIntensity <= 0.001) discard;
    vec2 uv = gl_FrontFacing ? vUv : vec2(1.0 - vUv.x, vUv.y);
    vec4 tex = texture2D(map, uv);
    if (tex.a < 0.002) discard;

    float energy = pow(max(0.0, uGlowIntensity), 1.15);
    vec3 light = uColor * energy;
    float alpha = tex.a * uOpacity;

    gl_FragColor = vec4(light, alpha);
  }
`;

export function createFlipUvMaterial(
  texture: THREE.Texture,
  color: string | THREE.Color = "#FFFFFF",
  opacity = 1.0,
  blending: THREE.Blending = THREE.NormalBlending
): THREE.ShaderMaterial {
  const threeColor = color instanceof THREE.Color ? color : new THREE.Color(color);

  return new THREE.ShaderMaterial({
    uniforms: {
      map: { value: texture },
      uColor: { value: threeColor },
      uOpacity: { value: opacity },
    },
    vertexShader: flipUvVertexShader,
    fragmentShader: flipUvFragmentShader,
    side: THREE.DoubleSide,
    transparent: true,
    depthWrite: false,
    blending,
  });
}

export function createHaloGlowMaterial(
  texture: THREE.Texture,
  color: string | THREE.Color = "#FFBE28",
  opacity = 1.0,
  glowIntensity = 1.0
): THREE.ShaderMaterial {
  const threeColor = color instanceof THREE.Color ? color : new THREE.Color(color);

  return new THREE.ShaderMaterial({
    uniforms: {
      map: { value: texture },
      uColor: { value: threeColor },
      uOpacity: { value: opacity },
      uGlowIntensity: { value: glowIntensity },
    },
    vertexShader: flipUvVertexShader,
    fragmentShader: flipUvHaloFragmentShader,
    side: THREE.DoubleSide,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
}
