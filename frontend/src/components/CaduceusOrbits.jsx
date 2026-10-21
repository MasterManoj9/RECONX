import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import basePoints from './caduceus_base_points.json';

const TWO_PI = Math.PI * 2;

function clamp(v, min, max) {
  return Math.min(Math.max(v, min), max);
}

function parseCssColor(color, fallback = [1, 1, 1]) {
  if (typeof color !== 'string') return fallback;
  const s = color.trim();
  if (s.startsWith('#')) {
    const hex = s.slice(1);
    if (hex.length === 3) {
      return [
        parseInt(hex[0] + hex[0], 16) / 255,
        parseInt(hex[1] + hex[1], 16) / 255,
        parseInt(hex[2] + hex[2], 16) / 255,
      ];
    }
    if (hex.length === 6) {
      return [
        parseInt(hex.slice(0, 2), 16) / 255,
        parseInt(hex.slice(2, 4), 16) / 255,
        parseInt(hex.slice(4, 6), 16) / 255,
      ];
    }
  }
  return fallback;
}

function sRgbToLinear(c) {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function rgbToOklab([r, g, b]) {
  const lr = sRgbToLinear(r);
  const lg = sRgbToLinear(g);
  const lb = sRgbToLinear(b);
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

const starsVertShader = `
precision highp float;

uniform vec2 uResolution;
uniform vec2 uCenter;
uniform float uFocal;
uniform float uDistance;
uniform float uIncline;
uniform float uRoll;
uniform float uPixelRatio;
uniform float uRealTime;
uniform float uDust;
uniform float uCore;
uniform float uSize;
uniform float uSizeScale;
uniform float uSparkle;
uniform float uTwinkle;
uniform float uBack;
uniform float uEnergy;
uniform float uInk;
uniform vec3 uLabA;
uniform vec3 uLabB;
uniform vec4 uRipples[6];
uniform float uActive;
uniform sampler2D uState;
uniform int uStride;
uniform vec2 uPointer;

// aPos: x, y, z, isCaduceus
in vec4 aPos;
// aTraits: wingWeight, serpentWeight, randVal, twinklePhase
in vec4 aTraits;

out vec3 vColor;
out float vGain;

vec3 labToLinear(vec3 lab) {
  float l = lab.x + 0.3963377774 * lab.y + 0.2158037573 * lab.z;
  float m = lab.x - 0.1055613458 * lab.y - 0.0638541728 * lab.z;
  float s = lab.x - 0.0894841775 * lab.y - 1.2914855480 * lab.z;
  l = l * l * l;
  m = m * m * m;
  s = s * s * s;
  return max(vec3(
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s
  ), 0.0);
}

void main() {
  float isCad = aPos.w;
  vec3 p = aPos.xyz;

  vec2 offset = texelFetch(uState, ivec2(gl_VertexID % uStride, gl_VertexID / uStride), 0).xy;
  p.xy += offset * 0.8;
  float tidal = smoothstep(0.004, 0.03, length(offset));

  // Ripple shockwaves
  float ring = 0.0;
  if (uActive > 0.5) {
    for (int k = 0; k < 6; k++) {
      vec4 wave = uRipples[k];
      if (wave.w <= 0.0) continue;
      float age = uRealTime - wave.z;
      if (age < 0.0 || age > 7.0) continue;
      vec2 rel = p.xy - wave.xy;
      float rr = length(rel);
      float front = 0.05 + 0.35 * age;
      float width = 0.08 + 0.03 * age;
      float g = (rr - front) / width;
      float band = exp(-g * g);
      float envelope = wave.w * smoothstep(0.0, 0.6, age) * exp(-age / 2.0);
      p.xy -= rel / max(rr, 1e-4) * (rr - front) * 0.45 * envelope * band;
      p.z += 0.05 * envelope * band;
      ring += envelope * band;
    }
  }

  vec3 q;
  vec3 color;
  float gain;

  if (isCad > 0.5) {
    // 3D holographic rotation around Y-axis + mouse parallax
    // Keep staff perfectly STRAIGHT and upright!
    float sway = sin(uRealTime * 0.8) * 0.025;
    float rot = sway + uPointer.x * 0.18;
    float cy = cos(rot);
    float sy = sin(rot);
    vec3 rotated = vec3(
      p.x * cy + p.z * sy,
      p.y,
      -p.x * sy + p.z * cy
    );

    // Dynamic tilt reacting gently to mouse Y
    float tiltAngle = 0.05 - uPointer.y * 0.1;
    float ct = cos(tiltAngle);
    float st = sin(tiltAngle);
    q = vec3(rotated.x, rotated.y * ct - rotated.z * st, rotated.y * st + rotated.z * ct);

    // Pulse wave traveling upward along the staff & serpents
    float pulse = 0.5 + 0.5 * sin(p.y * 10.0 - uRealTime * 5.0);

    // Wing color (cyan / teal), Serpent color (purple / violet), Core staff (white / cyan)
    vec3 wingCol = labToLinear(uLabA);
    vec3 serpentCol = labToLinear(uLabB);
    vec3 staffCol = vec3(1.0, 1.0, 1.0);

    float wingW = aTraits.x;
    float serpentW = aTraits.y;
    color = mix(staffCol, wingCol, wingW);
    color = mix(color, serpentCol, serpentW);
    color = mix(color, vec3(1.0, 1.0, 1.0), pulse * 0.35);

    // Soften the dense top sphere so particles stay distinct
    bool isTopSphere = (wingW < 0.05 && serpentW < 0.05 && p.y > 0.35);
    float sphereDamp = isTopSphere ? 0.62 : 1.0;

    float twinkle = 1.0 - uTwinkle * 0.3 * sin(uRealTime * 3.0 + aTraits.w * 50.0);
    gain = (1.2 + 0.6 * pulse + 1.0 * tidal + 0.8 * ring) * twinkle * (1.0 + uEnergy * 0.25) * sphereDamp;
  } else {
    // Ambient cosmic dust rotating around the outer disc
    float orbitSpeed = 0.08 / max(0.4, length(p.xy));
    float angle = uRealTime * orbitSpeed;
    float ca = cos(angle);
    float sa = sin(angle);
    vec3 orb = vec3(p.x * ca - p.y * sa, p.x * sa + p.y * ca, p.z);
    
    float ci = cos(uIncline);
    float si = sin(uIncline);
    q = vec3(orb.x, orb.y * ci + orb.z * si, -orb.y * si + orb.z * ci);

    color = labToLinear(mix(uLabB, uLabA, 0.5));
    float twinkle = 1.0 - uTwinkle * 0.5 * sin(uRealTime * 2.0 + aTraits.w * 40.0);
    gain = 0.45 * twinkle * (1.0 + tidal * 0.8 + ring * 0.5);
  }

  float depth = uDistance - q.z;
  vec2 screen = uCenter + uFocal * q.xy / depth;

  vColor = color;
  vGain = gain;

  float size = uSize * uSizeScale * uPixelRatio * (isCad > 0.5 ? 1.2 : 0.85);
  gl_PointSize = max(size * uDistance / depth, 1.0);
  gl_Position = vec4(screen / uResolution * 2.0 - 1.0, 0.0, 1.0);
}
`;

const starsFragShader = `
precision highp float;
uniform float uStarGain;
in vec3 vColor;
in float vGain;
out vec4 fragColor;

void main() {
  vec2 q = gl_PointCoord * 2.0 - 1.0;
  float r2 = dot(q, q);
  float e = (exp(-r2 * 5.5) + 0.28 * exp(-r2 * 1.8)) * vGain * uStarGain;
  fragColor = vec4(vColor * e, e);
}
`;

const quadVertShader = `
out vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

const stateFragShader = `
precision highp float;

uniform sampler2D uStatic;
uniform sampler2D uState;
uniform vec4 uSegment;
uniform float uGather;
uniform float uDrag;
uniform float uWidth;
uniform float uDecay;
uniform float uTime;

out vec4 fragState;

void main() {
  ivec2 coord = ivec2(gl_FragCoord.xy);
  vec4 st = texelFetch(uState, coord, 0);
  vec4 base = texelFetch(uStatic, coord, 0);

  vec2 p = base.xy + st.xy;
  vec2 segA = uSegment.xy;
  vec2 segB = uSegment.zw;
  vec2 ab = segB - segA;
  float lenSq = dot(ab, ab);
  float t = lenSq > 1e-6 ? clamp(dot(p - segA, ab) / lenSq, 0.0, 1.0) : 0.0;
  vec2 close = segA + t * ab;
  vec2 disp = p - close;
  float dist = length(disp);

  vec2 delta = vec2(0.0);
  if (uGather > 0.001) {
    float falloff = exp(-dist * dist / (2.0 * uWidth * uWidth));
    vec2 toMouse = close - p;
    delta += toMouse * (uGather * falloff * 0.08);
  }

  vec2 next = st.xy * uDecay + delta;
  fragState = vec4(next, 0.0, 1.0);
}
`;

const downsampleFragShader = `
precision highp float;
uniform sampler2D uSource;
uniform vec2 uTexel;
in vec2 vUv;
out vec4 fragColor;

void main() {
  vec4 a = texture(uSource, vUv + uTexel * vec2(-1.0, -1.0));
  vec4 b = texture(uSource, vUv + uTexel * vec2(1.0, -1.0));
  vec4 c = texture(uSource, vUv + uTexel * vec2(-1.0, 1.0));
  vec4 d = texture(uSource, vUv + uTexel * vec2(1.0, 1.0));
  fragColor = (a + b + c + d) * 0.125 + texture(uSource, vUv) * 0.5;
}
`;

const upsampleFragShader = `
precision highp float;
uniform sampler2D uSource;
uniform sampler2D uBase;
uniform vec2 uTexel;
in vec2 vUv;
out vec4 fragColor;

void main() {
  vec4 sum = texture(uSource, vUv) * 4.0;
  sum += texture(uSource, vUv + uTexel * vec2(-1.0, 0.0)) * 2.0;
  sum += texture(uSource, vUv + uTexel * vec2(1.0, 0.0)) * 2.0;
  sum += texture(uSource, vUv + uTexel * vec2(0.0, -1.0)) * 2.0;
  sum += texture(uSource, vUv + uTexel * vec2(0.0, 1.0)) * 2.0;
  sum += texture(uSource, vUv + uTexel * vec2(-1.0, -1.0));
  sum += texture(uSource, vUv + uTexel * vec2(1.0, -1.0));
  sum += texture(uSource, vUv + uTexel * vec2(-1.0, 1.0));
  sum += texture(uSource, vUv + uTexel * vec2(1.0, 1.0));
  fragColor = texture(uBase, vUv) + sum / 16.0;
}
`;

const compositeFragShader = `
precision highp float;
uniform sampler2D uLines;
uniform sampler2D uBloom;
uniform vec3 uBackground;
uniform float uGlow;
uniform float uExposure;
in vec2 vUv;
out vec4 fragColor;

vec3 encode(vec3 c) {
  c = clamp(c, 0.0, 1.0);
  return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(vec3(0.0031308), c));
}

void main() {
  vec4 direct = texture(uLines, vUv);
  vec4 bloom = texture(uBloom, vUv);
  vec3 rgb = direct.rgb + bloom.rgb * uGlow;
  rgb *= uExposure;
  fragColor = vec4(encode(rgb + uBackground), 1.0);
}
`;

export default function CaduceusOrbits({
  colors = ['#2dd4bf', '#c084fc'],
  backgroundColor = '#0A0A0A',
  starSize = 1.7,
  scale = 0.95,
  centerX = 0.5,
  centerY = 0.5,
  glow = 0.55,
  intensity = 1.1,
  speed = 1.0,
  paused = false,
  interactive = true,
  clickRipple = true,
  style = {},
}) {
  const containerRef = useRef(null);
  const pRef = useRef({
    colors,
    backgroundColor,
    starSize,
    scale,
    centerX,
    centerY,
    glow,
    intensity,
    speed,
    paused,
    interactive,
    clickRipple,
  });

  useEffect(() => {
    pRef.current = {
      colors,
      backgroundColor,
      starSize,
      scale,
      centerX,
      centerY,
      glow,
      intensity,
      speed,
      paused,
      interactive,
      clickRipple,
    };
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let renderer;
    const canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.display = 'block';
    canvas.style.pointerEvents = 'none';
    container.prepend(canvas);

    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: false,
        antialias: false,
        powerPreference: 'high-performance',
      });
    } catch {
      canvas.remove();
      return;
    }

    if (!renderer.capabilities.isWebGL2) {
      renderer.dispose();
      canvas.remove();
      return;
    }

    renderer.autoClear = false;

    const quadCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const quadGeo = new THREE.PlaneGeometry(2, 2);
    const ripples = Array.from({ length: 6 }, () => new THREE.Vector4(0, 0, -100, 0));

    // Particle geometry generation
    const numBase = basePoints.length; // ~4338
    const repeats = 8;
    const caduceusCount = numBase * repeats; // ~34,704
    const ambientCount = 20000;
    const totalCount = caduceusCount + ambientCount;

    const buf = new Float32Array(totalCount * 8); // [x, y, z, isCad, wingW, serpentW, randVal, twinkle]
    const staticBuf = new Float32Array(512 * Math.ceil(totalCount / 512) * 4);

    let seed = 42;
    const rand = () => {
      seed = (16807 * seed) % 2147483647;
      return seed / 2147483647;
    };
    const randNorm = () =>
      Math.sqrt(-2 * Math.log(Math.max(rand(), 1e-9))) * Math.cos(TWO_PI * rand());

    // 1. Caduceus particles
    for (let i = 0; i < caduceusCount; i++) {
      const bIdx = i % numBase;
      const bp = basePoints[bIdx];
      const scale = 0.68;
      const jx = (rand() - 0.5) * 0.016;
      const jy = (rand() - 0.5) * 0.016;
      const x = bp[0] * scale + jx;
      const y = bp[1] * scale + jy + 0.04;

      let z = 0;
      const absX = Math.abs(x);
      const isWing = y > 0.15 * scale && absX > 0.1 * scale;
      const isSphere = y > 0.65 * scale && absX < 0.15 * scale;
      const isSerpent = !isWing && !isSphere && absX >= 0.038 * scale && y > -0.65 * scale && y < 0.45 * scale;

      if (isSphere) {
        const rSphere = 0.12 * scale;
        const dy = y - 0.76 * scale;
        z = (rand() > 0.5 ? 1 : -1) * Math.sqrt(Math.max(0, rSphere * rSphere - x * x - dy * dy));
      } else if (isWing) {
        z = Math.sin(absX * 3.5) * 0.06 * (rand() > 0.5 ? 1 : -1);
      } else if (isSerpent) {
        z = randNorm() * 0.015;
      } else {
        z = randNorm() * 0.025;
      }

      const wingWeight = isWing ? 1.0 : 0.0;
      const serpentWeight = isSerpent ? 1.0 : 0.0;
      const rVal = rand();
      const twPhase = rand();

      buf.set([x, y, z, 1.0, wingWeight, serpentWeight, rVal, twPhase], 8 * i);
      staticBuf.set([x, y, 1.0, 0], 4 * i);
    }

    // 2. Ambient cosmic stars
    for (let i = 0; i < ambientCount; i++) {
      const idx = caduceusCount + i;
      const r = 0.15 + 1.6 * Math.sqrt(rand());
      const theta = rand() * TWO_PI;
      const x = r * Math.cos(theta);
      const y = r * Math.sin(theta);
      const z = randNorm() * 0.18;

      buf.set([x, y, z, 0.0, 0.0, 0.0, rand(), rand()], 8 * idx);
      staticBuf.set([x, y, 0.0, 0], 4 * idx);
    }

    const geo = new THREE.BufferGeometry();
    const interleaved = new THREE.InterleavedBuffer(buf, 8);
    geo.setAttribute('aPos', new THREE.InterleavedBufferAttribute(interleaved, 4, 0));
    geo.setAttribute('aTraits', new THREE.InterleavedBufferAttribute(interleaved, 4, 4));
    geo.setAttribute('position', new THREE.InterleavedBufferAttribute(interleaved, 3, 0));

    const rows = Math.ceil(totalCount / 512);
    const staticTexture = new THREE.DataTexture(
      staticBuf,
      512,
      rows,
      THREE.RGBAFormat,
      THREE.FloatType
    );
    staticTexture.minFilter = THREE.NearestFilter;
    staticTexture.magFilter = THREE.NearestFilter;
    staticTexture.needsUpdate = true;

    const starsMaterial = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      uniforms: {
        uResolution: { value: new THREE.Vector2(1, 1) },
        uCenter: { value: new THREE.Vector2() },
        uFocal: { value: 1 },
        uDistance: { value: 3.6 },
        uIncline: { value: 0.3 },
        uRoll: { value: 0 },
        uPixelRatio: { value: 1 },
        uRealTime: { value: 0 },
        uDust: { value: 0.5 },
        uCore: { value: 1.2 },
        uSize: { value: 1.8 },
        uSizeScale: { value: 1 },
        uSparkle: { value: 0.5 },
        uTwinkle: { value: 0.4 },
        uBack: { value: 0.5 },
        uEnergy: { value: 0 },
        uInk: { value: 0 },
        uLabA: { value: new THREE.Vector3() },
        uLabB: { value: new THREE.Vector3() },
        uRipples: { value: ripples },
        uActive: { value: 0 },
        uStarGain: { value: 0.35 },
        uState: { value: null },
        uStride: { value: 512 },
        uPointer: { value: new THREE.Vector2() },
      },
      vertexShader: starsVertShader,
      fragmentShader: starsFragShader,
      depthTest: false,
      depthWrite: false,
      transparent: true,
      blending: THREE.CustomBlending,
      blendEquation: THREE.AddEquation,
      blendSrc: THREE.OneFactor,
      blendDst: THREE.OneFactor,
      blendSrcAlpha: THREE.OneFactor,
      blendDstAlpha: THREE.OneFactor,
    });

    const starsMesh = new THREE.Points(geo, starsMaterial);
    starsMesh.frustumCulled = false;
    const starsScene = new THREE.Scene();
    starsScene.add(starsMesh);

    const quadMesh = new THREE.Mesh(quadGeo);
    quadMesh.frustumCulled = false;
    const quadScene = new THREE.Scene();
    quadScene.add(quadMesh);

    const createQuadMaterial = (fragShader, uniforms) =>
      new THREE.ShaderMaterial({
        glslVersion: THREE.GLSL3,
        uniforms,
        vertexShader: quadVertShader,
        fragmentShader: fragShader,
        depthTest: false,
        depthWrite: false,
        blending: THREE.NoBlending,
      });

    const stateMaterial = createQuadMaterial(stateFragShader, {
      uStatic: { value: staticTexture },
      uState: { value: null },
      uSegment: { value: new THREE.Vector4() },
      uGather: { value: 0 },
      uDrag: { value: 0 },
      uWidth: { value: 0.12 },
      uDecay: { value: 0.94 },
      uTime: { value: 0 },
    });

    const downsampleMaterial = createQuadMaterial(downsampleFragShader, {
      uSource: { value: null },
      uTexel: { value: new THREE.Vector2() },
    });

    const upsampleMaterial = createQuadMaterial(upsampleFragShader, {
      uSource: { value: null },
      uBase: { value: null },
      uTexel: { value: new THREE.Vector2() },
    });

    const compositeMaterial = createQuadMaterial(compositeFragShader, {
      uLines: { value: null },
      uBloom: { value: null },
      uBackground: { value: new THREE.Vector3() },
      uGlow: { value: 0.55 },
      uExposure: { value: 1.1 },
    });

    let mainTarget = null;
    let downTargets = [];
    let upTargets = [];
    const stateTargetType = renderer.extensions.has('EXT_color_buffer_float')
      ? THREE.FloatType
      : THREE.HalfFloatType;
    let stateTargets = [0, 1].map(
      () =>
        new THREE.WebGLRenderTarget(512, rows, {
          type: stateTargetType,
          format: THREE.RGBAFormat,
          minFilter: THREE.NearestFilter,
          magFilter: THREE.NearestFilter,
          depthBuffer: false,
          stencilBuffer: false,
        })
    );
    let stateIndex = 0;
    for (const rt of stateTargets) {
      renderer.setRenderTarget(rt);
      renderer.setClearColor(0, 0);
      renderer.clear();
    }

    let animFrameId = 0;
    let lastTime = 0;
    let simTime = 0;
    let viewWidth = 1024;
    let viewHeight = 768;
    let pixelRatio = 1;

    const pointerState = {
      x: 0,
      y: 0,
      prevX: 0,
      prevY: 0,
      inside: false,
    };

    const disposeTargets = () => {
      mainTarget?.dispose();
      downTargets.forEach((t) => t.dispose());
      upTargets.forEach((t) => t.dispose());
      downTargets = [];
      upTargets = [];
    };

    const createRenderTarget = (w, h) =>
      new THREE.WebGLRenderTarget(Math.max(1, w), Math.max(1, h), {
        type: THREE.HalfFloatType,
        format: THREE.RGBAFormat,
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        depthBuffer: false,
      });

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const wVal = rect.width > 50 ? rect.width : window.innerWidth;
      const hVal = rect.height > 50 ? rect.height : window.innerHeight;
      viewWidth = Math.max(1, wVal);
      viewHeight = Math.max(1, hVal);
      pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

      renderer.setPixelRatio(pixelRatio);
      renderer.setSize(viewWidth, viewHeight, false);

      const w = Math.round(viewWidth * pixelRatio);
      const h = Math.round(viewHeight * pixelRatio);

      disposeTargets();
      mainTarget = createRenderTarget(w, h);
      const levels = 4;
      for (let i = 1; i <= levels; i++) {
        downTargets.push(createRenderTarget(Math.max(1, w >> i), Math.max(1, h >> i)));
        upTargets.push(createRenderTarget(Math.max(1, w >> i), Math.max(1, h >> i)));
      }
    };

    const renderPass = (material, target) => {
      quadMesh.material = material;
      renderer.setRenderTarget(target);
      renderer.render(quadScene, quadCamera);
    };

    const triggerRipple = (x = 0, y = 0) => {
      let oldest = 0;
      for (let k = 1; k < 6; k++) {
        if (ripples[k].z < ripples[oldest].z) oldest = k;
      }
      ripples[oldest].set(x, y, simTime, 1.2);
    };

    const animate = (timestamp) => {
      if (!lastTime) lastTime = timestamp;
      const dt = Math.min(0.05, (timestamp - lastTime) / 1000);
      lastTime = timestamp;
      simTime += dt * pRef.current.speed;

      const p = pRef.current;
      const w = viewWidth * pixelRatio;
      const h = viewHeight * pixelRatio;

      // Update simulation state
      stateMaterial.uniforms.uState.value = stateTargets[stateIndex].texture;
      stateMaterial.uniforms.uSegment.value.set(
        pointerState.prevX,
        pointerState.prevY,
        pointerState.x,
        pointerState.y
      );
      stateMaterial.uniforms.uGather.value = pointerState.inside ? 0.7 : 0.0;
      stateMaterial.uniforms.uTime.value = simTime;

      renderPass(stateMaterial, stateTargets[1 - stateIndex]);
      stateIndex = 1 - stateIndex;

      // Render stars
      const sUniforms = starsMaterial.uniforms;
      sUniforms.uResolution.value.set(w, h);
      sUniforms.uCenter.value.set(p.centerX * w, (1.0 - p.centerY) * h);
      sUniforms.uFocal.value = 3.6 * 0.35 * p.scale * Math.min(w, 1.6 * h);
      sUniforms.uRealTime.value = simTime;
      sUniforms.uSize.value = p.starSize;
      sUniforms.uPointer.value.set(pointerState.x, pointerState.y);
      sUniforms.uState.value = stateTargets[stateIndex].texture;
      sUniforms.uActive.value = ripples.some((r) => r.w > 0 && simTime - r.z < 7) ? 1.0 : 0.0;

      const labA = rgbToOklab(parseCssColor(p.colors[0], [0.17, 0.83, 0.75]));
      const labB = rgbToOklab(parseCssColor(p.colors[1], [0.75, 0.52, 0.99]));
      sUniforms.uLabA.value.set(labA[0], labA[1], labA[2]);
      sUniforms.uLabB.value.set(labB[0], labB[1], labB[2]);

      renderer.setRenderTarget(mainTarget);
      renderer.setClearColor(0, 0);
      renderer.clear();
      renderer.render(starsScene, quadCamera);

      // Bloom passes
      let currentSource = mainTarget;
      for (const downTarget of downTargets) {
        downsampleMaterial.uniforms.uSource.value = currentSource.texture;
        downsampleMaterial.uniforms.uTexel.value.set(1 / currentSource.width, 1 / currentSource.height);
        renderPass(downsampleMaterial, downTarget);
        currentSource = downTarget;
      }

      let currentBloom = downTargets[downTargets.length - 1];
      for (let i = downTargets.length - 2; i >= 0; i--) {
        upsampleMaterial.uniforms.uSource.value = currentBloom.texture;
        upsampleMaterial.uniforms.uBase.value = downTargets[i].texture;
        upsampleMaterial.uniforms.uTexel.value.set(1 / currentBloom.width, 1 / currentBloom.height);
        renderPass(upsampleMaterial, upTargets[i]);
        currentBloom = upTargets[i];
      }

      // Composite pass to screen
      const cUniforms = compositeMaterial.uniforms;
      cUniforms.uLines.value = mainTarget.texture;
      cUniforms.uBloom.value = currentBloom.texture;
      const bg = parseCssColor(p.backgroundColor, [0.04, 0.04, 0.04]);
      cUniforms.uBackground.value.set(sRgbToLinear(bg[0]), sRgbToLinear(bg[1]), sRgbToLinear(bg[2]));
      cUniforms.uGlow.value = p.glow;
      cUniforms.uExposure.value = p.intensity;

      renderPass(compositeMaterial, null);

      pointerState.prevX = pointerState.x;
      pointerState.prevY = pointerState.y;

      animFrameId = requestAnimationFrame(animate);
    };

    const onPointerMove = (e) => {
      const rect = container.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width * 2 - 1;
      const py = -((e.clientY - rect.top) / rect.height * 2 - 1);
      pointerState.x = px;
      pointerState.y = py;
      pointerState.inside = true;
    };

    const onPointerLeave = () => {
      pointerState.inside = false;
    };

    const onPointerDown = (e) => {
      if (e.button !== 0 || !pRef.current.clickRipple) return;
      triggerRipple(pointerState.x, pointerState.y);
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerleave', onPointerLeave);
    window.addEventListener('pointerdown', onPointerDown, { passive: true });
    window.addEventListener('resize', resize);

    resize();
    animFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animFrameId);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerleave', onPointerLeave);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('resize', resize);
      renderer.dispose();
      canvas.remove();
      disposeTargets();
      staticTexture.dispose();
      stateTargets.forEach((t) => t.dispose());
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: '240px',
        overflow: 'hidden',
        ...style,
      }}
    />
  );
}
