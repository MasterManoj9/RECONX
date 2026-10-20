import { forwardRef, useEffect, useImperativeHandle, useRef, useSyncExternalStore } from 'react';
import * as THREE from 'three';

const TWO_PI = 2 * Math.PI;

const subscribeReducedMotion = (callback) => {
  if (typeof window === 'undefined') return () => {};
  const media = window.matchMedia('(prefers-reduced-motion: reduce)');
  media.addEventListener('change', callback);
  return () => media.removeEventListener('change', callback);
};

const getReducedMotion = () => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

const clamp = (val, min, max) => Math.min(max, Math.max(min, val));

let scratchCanvasCtx = null;
const parseCssColor = (colorStr, defaultRgb) => {
  if (!scratchCanvasCtx && typeof document !== 'undefined') {
    scratchCanvasCtx = document.createElement('canvas').getContext('2d');
  }
  if (!scratchCanvasCtx) return defaultRgb;
  scratchCanvasCtx.fillStyle = '#010203';
  scratchCanvasCtx.fillStyle = colorStr;
  const normalized = String(scratchCanvasCtx.fillStyle);
  if (normalized === '#010203' && colorStr.trim().toLowerCase() !== '#010203') {
    return defaultRgb;
  }
  if (normalized.startsWith('#')) {
    const hex = normalized.slice(1);
    return [
      parseInt(hex.slice(0, 2), 16) / 255,
      parseInt(hex.slice(2, 4), 16) / 255,
      parseInt(hex.slice(4, 6), 16) / 255
    ];
  }
  const parts = normalized.match(/[\d.]+/g);
  if (!parts || parts.length < 3) return defaultRgb;
  return [Number(parts[0]) / 255, Number(parts[1]) / 255, Number(parts[2]) / 255];
};

const sRgbToLinear = (c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));

const rgbToOklab = ([r, g, b]) => {
  const lr = sRgbToLinear(r);
  const lg = sRgbToLinear(g);
  const lb = sRgbToLinear(b);
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
  return [
    0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s
  ];
};

const orbitShaderChunk = `
uniform float uTime;
uniform float uSpin;
uniform float uCoreRadius;
uniform float uArms;
uniform float uTwist;
uniform float uEps;
uniform float uPattern;

float omega(float a) {
  return uSpin / sqrt(a * a + uCoreRadius * uCoreRadius);
}

vec3 orbit(float a, float psi, float bulge, out float phase) {
  float th = psi + omega(a) * uTime;
  phase = uArms * (th + uTwist * log(max(a, 1e-3)) - uPattern * uTime);
  float r = a * (1.0 - uEps * cos(phase) * (1.0 - bulge));
  return vec3(r * cos(th), r * sin(th), th);
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
${orbitShaderChunk}
out vec4 fragColor;

void main() {
  ivec2 cell = ivec2(gl_FragCoord.xy);
  vec2 offset = texelFetch(uState, cell, 0).xy;
  if (uGather > 0.0) {
    vec4 star = texelFetch(uStatic, cell, 0);
    float phase;
    vec3 at = orbit(star.x, star.y, star.z, phase);
    vec2 radial = vec2(cos(at.z), sin(at.z));
    vec2 tangent = vec2(-radial.y, radial.x);
    vec2 p = at.xy + radial * offset.x + tangent * offset.y;
    vec2 d = uSegment.zw - uSegment.xy;
    float len = length(d);
    vec2 dir = len > 1e-6 ? d / len : vec2(1.0, 0.0);
    float along = clamp(dot(p - uSegment.xy, dir), 0.0, len);
    vec2 n = p - uSegment.xy - dir * along;
    float w = exp(-dot(n, n) / (uWidth * uWidth)) * (1.0 - 0.7 * star.z) * smoothstep(0.05, 0.3, star.x);
    vec2 delta = (dir * uDrag * uWidth - n * uGather) * w;
    offset += vec2(dot(delta, radial), dot(delta, tangent));
  }
  fragColor = vec4(offset * uDecay, 0.0, 1.0);
}
`;

const starsVertShader = `
in vec4 aOrbit;
in vec4 aTraits;
uniform sampler2D uState;
uniform int uStride;
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
uniform float uVoid;
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
${orbitShaderChunk}
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
  float a = aOrbit.x;
  float bulge = aTraits.x;
  float phase;
  vec3 at = orbit(a, aOrbit.y, bulge, phase);
  vec2 radial = vec2(cos(at.z), sin(at.z));
  vec2 tangent = vec2(-radial.y, radial.x);
  vec2 offset = texelFetch(uState, ivec2(gl_VertexID % uStride, gl_VertexID / uStride), 0).xy;
  vec3 p = vec3(at.xy + radial * offset.x + tangent * offset.y, aOrbit.z);
  float tidal = smoothstep(0.004, 0.03, length(offset));
  float ring = 0.0;
  if (uActive > 0.5) {
    for (int k = 0; k < 6; k++) {
      vec4 wave = uRipples[k];
      if (wave.w <= 0.0) continue;
      float age = uRealTime - wave.z;
      if (age < 0.0 || age > 7.0) continue;
      vec2 rel = p.xy - wave.xy;
      float rr = length(rel);
      float front = 0.05 + 0.32 * age;
      float width = 0.07 + 0.03 * age;
      float g = (rr - front) / width;
      float band = exp(-g * g);
      float envelope = wave.w * smoothstep(0.0, 0.7, age) * exp(-age / 2.2) * smoothstep(0.03, 0.2, front + length(wave.xy));
      p.xy -= rel / max(rr, 1e-4) * (rr - front) * 0.55 * envelope * band;
      p.z += 0.03 * envelope * band;
      ring += envelope * band;
    }
  }

  float ci = cos(uIncline);
  float si = sin(uIncline);
  vec3 q = vec3(p.x, p.y * ci + p.z * si, -p.y * si + p.z * ci);
  float cr = cos(uRoll);
  float sr = sin(uRoll);
  q.xy = vec2(cr * q.x - sr * q.y, sr * q.x + cr * q.y);
  float depth = uDistance - q.z;
  vec2 screen = uCenter + uFocal * q.xy / depth;

  float mk = uArms * uTwist;
  float crest = (cos(phase) - mk * sin(phase)) / sqrt(1.0 + mk * mk);
  float arm = pow(max(crest, 0.0), 2.0) * (1.0 - bulge);
  float laneCrest = (cos(phase - 0.55) - mk * sin(phase - 0.55)) / sqrt(1.0 + mk * mk);
  float lane = pow(max(laneCrest, 0.0), 8.0) * (1.0 - arm) * (1.0 - bulge) * smoothstep(0.1, 0.3, a);

  float reach = smoothstep(0.02, 0.55, a);
  vec3 tone = labToLinear(mix(uLabB, uLabA, reach));
  vec3 core = labToLinear(vec3(min(uLabB.x * 1.08 + 0.06, 0.98), uLabB.yz * 0.45));
  vec3 color = mix(tone, core, bulge * 0.75);
  vec3 youngColor = labToLinear(vec3(min(uLabB.x * 0.92, 0.9), uLabB.yz * 1.25));
  float young = smoothstep(0.84, 0.97, aTraits.z) * arm;
  float kindled = clamp(tidal * 0.7 + ring * 1.5, 0.0, 0.75) * (1.0 - bulge * 0.7);
  color = mix(color, youngColor, max(young * 0.75, kindled));
  float bright = step(1.0 - uSparkle, aTraits.y) * (1.0 - bulge * 0.6);
  color = mix(color, vec3(1.0, 0.97, 1.0), bright * 0.35);

  float twinkle = 1.0 - uTwinkle * 0.55 * (0.5 + 0.5 * sin(uRealTime * (0.6 + 1.6 * aTraits.w) + aTraits.w * 61.0));
  float body = mix(0.5 + 1.2 * arm + young * 1.4, uCore * 1.1, bulge) * (1.0 + bright * 2.2);
  body *= 1.0 - uDust * 0.8 * lane;
  float edge = 1.0 - smoothstep(0.82, 1.08, a);
  float hollow = smoothstep(uVoid * 0.85, uVoid * 1.15 + 0.01, a);
  float near = clamp(0.5 + 0.5 * q.z / 0.9, 0.0, 1.0);
  float gain = body * edge * hollow * twinkle * mix(uBack, 1.0, near) * (1.0 + uEnergy * 0.15);
  gain *= 1.0 + 0.9 * tidal * (1.0 - bulge * 0.7) + 0.5 * min(ring, 1.0);

  vColor = mix(color, labToLinear(vec3(uLabA.x * 0.62, uLabA.yz * 1.15)), uInk * 0.35);
  vGain = gain;
  float size = uSize * uSizeScale * uPixelRatio * mix(0.6, 1.1, fract(aTraits.y * 7.31)) * (1.0 + bright * 0.7 + young * 0.4);
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
  float e = (exp(-r2 * 6.0) + 0.25 * exp(-r2 * 2.0)) * vGain * uStarGain;
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
uniform float uMode;
uniform float uGrain;
in vec2 vUv;
out vec4 fragColor;

float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

vec3 encode(vec3 c) {
  c = clamp(c, 0.0, 1.0);
  return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(vec3(0.0031308), c));
}

void main() {
  vec4 lines = texture(uLines, vUv);
  vec4 bloom = texture(uBloom, vUv);
  vec3 color;
  if (uMode < 0.5) {
    vec3 light = (lines.rgb + bloom.rgb * uGlow) * uExposure;
    vec3 exposed = 1.0 - exp(-light);
    float peak = max(exposed.r, max(exposed.g, exposed.b));
    exposed = mix(exposed, vec3(peak), smoothstep(0.75, 1.0, peak) * 0.35);
    color = uBackground + (1.0 - uBackground) * exposed;
  } else {
    float energy = lines.a + bloom.a * uGlow * 0.2;
    vec3 hue = (lines.rgb + bloom.rgb * uGlow * 0.2) / max(energy, 1e-4);
    float cover = clamp(1.0 - exp(-energy * uExposure * 1.4), 0.0, 0.94);
    color = mix(uBackground, clamp(hue * 0.8, 0.0, 1.0), cover);
  }
  float grain = hash(gl_FragCoord.xy + uGrain * 311.0) - 0.5;
  fragColor = vec4(encode(color) + grain * (1.2 / 255.0), 1.0);
}
`;

export const BinaryOrbits = forwardRef(function BinaryOrbits(
  {
    colors = ['#7B4DFF', '#FFC2EE'],
    backgroundColor = '#0A0A0A',
    mode = 'auto',
    stars = 70000,
    starSize = 1.7,
    sparkle = 0.5,
    arms = 3,
    twist = 3.5,
    armStrength = 0.5,
    dust = 0.5,
    core = 1,
    coreSize = 0.07,
    innerVoid = 0,
    thickness = 0.02,
    tilt = 62,
    roll = -8,
    scale = 1,
    centerX = 0.5,
    centerY = 0.52,
    speed = 1,
    twinkle = 0.35,
    depth = 0.4,
    glow = 0.45,
    intensity = 1,
    interactive = true,
    hoverWake = true,
    clickRipple = true,
    wakeStrength = 1,
    rippleStrength = 1,
    hoverBoost = 0.5,
    paused = false,
    quality = 1,
    className = '',
    style = {},
    children
  },
  ref
) {
  const containerRef = useRef(null);
  const controllerRef = useRef(null);
  const reducedMotion = useSyncExternalStore(subscribeReducedMotion, getReducedMotion, () => false);

  const paramsRef = useRef({
    colors,
    backgroundColor,
    mode,
    stars,
    starSize,
    sparkle,
    arms,
    twist,
    armStrength,
    dust,
    core,
    coreSize,
    innerVoid,
    thickness,
    tilt,
    roll,
    scale,
    centerX,
    centerY,
    speed,
    twinkle,
    depth,
    glow,
    intensity,
    interactive,
    hoverWake,
    clickRipple,
    wakeStrength,
    rippleStrength,
    hoverBoost,
    paused,
    quality,
    reduced: reducedMotion
  });

  useEffect(() => {
    paramsRef.current = {
      colors,
      backgroundColor,
      mode,
      stars,
      starSize,
      sparkle,
      arms,
      twist,
      armStrength,
      dust,
      core,
      coreSize,
      innerVoid,
      thickness,
      tilt,
      roll,
      scale,
      centerX,
      centerY,
      speed,
      twinkle,
      depth,
      glow,
      intensity,
      interactive,
      hoverWake,
      clickRipple,
      wakeStrength,
      rippleStrength,
      hoverBoost,
      paused,
      quality,
      reduced: reducedMotion
    };
    controllerRef.current?.sync();
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const controller = ((container, pRef) => {
      let renderer;
      const canvas = document.createElement('canvas');
      canvas.setAttribute('aria-hidden', 'true');
      canvas.style.position = 'absolute';
      canvas.style.inset = '0';
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
          powerPreference: 'high-performance'
        });
      } catch {
        canvas.remove();
        return null;
      }

      if (!renderer.capabilities.isWebGL2) {
        renderer.dispose();
        canvas.remove();
        return null;
      }

      renderer.autoClear = false;

      const halfFloatType =
        renderer.extensions.has('EXT_color_buffer_float') ||
        renderer.extensions.has('EXT_color_buffer_half_float')
          ? THREE.HalfFloatType
          : THREE.UnsignedByteType;

      const quadCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
      const quadGeo = new THREE.PlaneGeometry(2, 2);
      const ripples = Array.from({ length: 6 }, () => new THREE.Vector4(0, 0, -100, 0));
      const stateTargetType = renderer.extensions.has('EXT_color_buffer_float')
        ? THREE.FloatType
        : THREE.HalfFloatType;

      const orbitUniforms = {
        uTime: { value: 0 },
        uSpin: { value: 0.11 },
        uCoreRadius: { value: 0.12 },
        uArms: { value: 3 },
        uTwist: { value: 3.5 },
        uEps: { value: 0.1 },
        uPattern: { value: 0.04 }
      };

      const starsMaterial = new THREE.ShaderMaterial({
        glslVersion: THREE.GLSL3,
        uniforms: {
          ...orbitUniforms,
          uState: { value: null },
          uStride: { value: 512 },
          uResolution: { value: new THREE.Vector2(1, 1) },
          uCenter: { value: new THREE.Vector2() },
          uFocal: { value: 1 },
          uDistance: { value: 3.6 },
          uIncline: { value: 1 },
          uRoll: { value: 0 },
          uPixelRatio: { value: 1 },
          uRealTime: { value: 0 },
          uDust: { value: 0.5 },
          uCore: { value: 1 },
          uVoid: { value: 0 },
          uSize: { value: 1.4 },
          uSizeScale: { value: 1 },
          uSparkle: { value: 0.08 },
          uTwinkle: { value: 0.4 },
          uBack: { value: 0.5 },
          uEnergy: { value: 0 },
          uInk: { value: 0 },
          uLabA: { value: new THREE.Vector3() },
          uLabB: { value: new THREE.Vector3() },
          uRipples: { value: ripples },
          uActive: { value: 0 },
          uStarGain: { value: 0.3 }
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
        blendDstAlpha: THREE.OneFactor
      });

      const createQuadMaterial = (fragShader, uniforms) =>
        new THREE.ShaderMaterial({
          glslVersion: THREE.GLSL3,
          uniforms,
          vertexShader: quadVertShader,
          fragmentShader: fragShader,
          depthTest: false,
          depthWrite: false,
          blending: THREE.NoBlending
        });

      const stateMaterial = createQuadMaterial(stateFragShader, {
        ...orbitUniforms,
        uStatic: { value: null },
        uState: { value: null },
        uSegment: { value: new THREE.Vector4() },
        uGather: { value: 0 },
        uDrag: { value: 0 },
        uWidth: { value: 0.09 },
        uDecay: { value: 1 }
      });

      const downsampleMaterial = createQuadMaterial(downsampleFragShader, {
        uSource: { value: null },
        uTexel: { value: new THREE.Vector2() }
      });

      const upsampleMaterial = createQuadMaterial(upsampleFragShader, {
        uSource: { value: null },
        uBase: { value: null },
        uTexel: { value: new THREE.Vector2() }
      });

      const compositeMaterial = createQuadMaterial(compositeFragShader, {
        uLines: { value: null },
        uBloom: { value: null },
        uBackground: { value: new THREE.Vector3() },
        uGlow: { value: 0.5 },
        uExposure: { value: 1 },
        uMode: { value: 0 },
        uGrain: { value: 0 }
      });

      const starsMesh = new THREE.Points(new THREE.BufferGeometry(), starsMaterial);
      starsMesh.frustumCulled = false;
      const starsScene = new THREE.Scene();
      starsScene.add(starsMesh);

      const quadMesh = new THREE.Mesh(quadGeo, compositeMaterial);
      quadMesh.frustumCulled = false;
      const quadScene = new THREE.Scene();
      quadScene.add(quadMesh);

      let lastSignature = '';
      let staticTexture = null;
      let stateTargets = [];
      let stateIndex = 0;

      const createRenderTarget = (w, h) =>
        new THREE.WebGLRenderTarget(Math.max(1, w), Math.max(1, h), {
          type: halfFloatType,
          format: THREE.RGBAFormat,
          minFilter: THREE.LinearFilter,
          magFilter: THREE.LinearFilter,
          depthBuffer: false,
          stencilBuffer: false,
          generateMipmaps: false
        });

      let mainTarget = null;
      let downTargets = [];
      let upTargets = [];
      let isDestroyed = false;
      let animFrameId = 0;
      let lastFrameTime = 0;
      let isIntersecting = true;
      let animTime = 40;
      let simTime = 0;
      let hoverEnergy = 0;
      let viewWidth = 1;
      let viewHeight = 1;
      let pixelRatio = 1;
      let grainSeed = 0;
      let lastWakeTime = -100;

      const pointerState = {
        inside: false,
        disc: null,
        trail: null
      };

      const disposeTargets = () => {
        mainTarget?.dispose();
        downTargets.forEach((rt) => rt.dispose());
        upTargets.forEach((rt) => rt.dispose());
        mainTarget = null;
        downTargets = [];
        upTargets = [];
      };

      const renderPass = (material, target) => {
        quadMesh.material = material;
        renderer.setRenderTarget(target);
        renderer.render(quadScene, quadCamera);
      };

      const rebuildGalaxy = () => {
        const p = pRef.current;
        const starsCount = Math.round(clamp(p.stars, 2000, 250000));
        const coreRadius = clamp(p.coreSize, 0.02, 0.3);
        const diskThickness = clamp(p.thickness, 0, 0.2);
        const sig = `${starsCount}|${coreRadius}|${diskThickness}`;
        if (sig === lastSignature) return;
        lastSignature = sig;

        starsMesh.geometry.dispose();
        staticTexture?.dispose();
        stateTargets.forEach((rt) => rt.dispose());

        const genData = ((count, coreR, thick) => {
          let seed = 23;
          const rand = () => {
            seed = (16807 * seed) % 2147483647;
            return seed / 2147483647;
          };
          const randNorm = () =>
            Math.sqrt(-2 * Math.log(Math.max(rand(), 1e-9))) * Math.cos(TWO_PI * rand());
          const rows = Math.ceil(count / 512);
          const buf = new Float32Array(8 * count);
          const staticBuf = new Float32Array(512 * rows * 4);
          for (let i = 0; i < count; i++) {
            let a, z;
            const isBulge = rand() < 0.16;
            if (isBulge) {
              a = Math.min(
                coreR / Math.sqrt(Math.pow(Math.min(Math.max(rand(), 1e-4), 0.995), -2 / 3) - 1),
                4 * coreR
              );
              z = randNorm() * a * 0.5;
            } else {
              do {
                a = -0.32 * Math.log(Math.max(rand() * rand(), 1e-9));
              } while (a > 1.08);
              a = Math.max(a, 0.012);
              z = randNorm() * thick * (0.5 + 0.5 * Math.exp(-a / 0.25));
            }
            const psi = rand() * TWO_PI;
            buf.set([a, psi, z, rand(), isBulge ? 1 : 0, rand(), rand(), rand()], 8 * i);
            staticBuf.set([a, psi, isBulge ? 1 : 0, 0], 4 * i);
          }
          const geo = new THREE.BufferGeometry();
          const interleaved = new THREE.InterleavedBuffer(buf, 8);
          geo.setAttribute('aOrbit', new THREE.InterleavedBufferAttribute(interleaved, 4, 0));
          geo.setAttribute('aTraits', new THREE.InterleavedBufferAttribute(interleaved, 4, 4));
          geo.setAttribute('position', new THREE.InterleavedBufferAttribute(interleaved, 3, 0));
          const tex = new THREE.DataTexture(
            staticBuf,
            512,
            rows,
            THREE.RGBAFormat,
            THREE.FloatType
          );
          tex.minFilter = THREE.NearestFilter;
          tex.magFilter = THREE.NearestFilter;
          tex.generateMipmaps = false;
          tex.needsUpdate = true;
          return { geometry: geo, texture: tex, rows };
        })(starsCount, coreRadius, diskThickness);

        starsMesh.geometry = genData.geometry;
        staticTexture = genData.texture;
        stateTargets = [0, 1].map(
          () =>
            new THREE.WebGLRenderTarget(512, genData.rows, {
              type: stateTargetType,
              format: THREE.RGBAFormat,
              minFilter: THREE.NearestFilter,
              magFilter: THREE.NearestFilter,
              depthBuffer: false,
              stencilBuffer: false,
              generateMipmaps: false
            })
        );
        stateIndex = 0;
        for (const rt of stateTargets) {
          renderer.setRenderTarget(rt);
          renderer.setClearColor(0, 0);
          renderer.clear();
        }
        stateMaterial.uniforms.uStatic.value = staticTexture;
        starsMaterial.uniforms.uState.value = stateTargets[0].texture;
      };

      const getCameraProjection = () => {
        const p = pRef.current;
        const w = viewWidth * pixelRatio;
        const h = viewHeight * pixelRatio;
        const s = 0.36 * clamp(p.scale, 0.2, 4) * Math.min(w, 1.7 * h);
        return {
          incline: (clamp(p.tilt, 0, 85) * Math.PI) / 180,
          roll: (clamp(p.roll, -180, 180) * Math.PI) / 180,
          focal: 3.6 * s,
          center: [clamp(p.centerX, -0.5, 1.5) * w, (1 - clamp(p.centerY, -0.5, 1.5)) * h]
        };
      };

      const screenToGalaxy = (clientX, clientY) => {
        const rect = container.getBoundingClientRect();
        const proj = getCameraProjection();
        const px = (clientX - rect.left) * pixelRatio;
        const py = (rect.height - (clientY - rect.top)) * pixelRatio;
        const nx = (px - proj.center[0]) / proj.focal;
        const ny = (py - proj.center[1]) / proj.focal;
        const cosR = Math.cos(proj.roll);
        const sinR = Math.sin(proj.roll);
        const mx = -sinR * nx + cosR * ny;
        const cosI = Math.cos(proj.incline);
        const sinI = Math.sin(proj.incline);
        const denom = cosI - mx * sinI;
        if (denom <= 0.02) return null;
        const my = (3.6 * mx) / denom;
        return {
          x: (cosR * nx + sinR * ny) * (3.6 + my * sinI),
          y: my
        };
      };

      const triggerRipple = (x = 0, y = 0) => {
        const p = pRef.current;
        if (p.reduced || p.paused) return;
        const strength = clamp(p.rippleStrength, 0, 3);
        let newest = 0;
        let oldest = 0;
        for (let k = 1; k < 6; k++) {
          if (ripples[k].z > ripples[newest].z) newest = k;
          if (ripples[k].z < ripples[oldest].z) oldest = k;
        }
        const curr = ripples[newest];
        if (curr.w > 0 && simTime - curr.z < 0.35 && Math.hypot(curr.x - x, curr.y - y) < 0.15) {
          curr.w = Math.min(curr.w + 0.3 * strength, 1.6 * strength);
        } else if (simTime - ripples[oldest].z > 7) {
          ripples[oldest].set(x, y, simTime, strength);
        } else {
          curr.w = Math.min(curr.w + 0.25 * strength, 1.6 * strength);
        }
        scheduleRender();
      };

      const hasActiveRipples = () => ripples.some((r) => r.w > 0 && simTime - r.z < 7);

      const renderFrame = () => {
        if (!mainTarget || !downTargets.length) return;
        rebuildGalaxy();
        const p = pRef.current;
        const sUniforms = starsMaterial.uniforms;
        const w = viewWidth * pixelRatio;
        const h = viewHeight * pixelRatio;
        const proj = getCameraProjection();
        const bgColor = parseCssColor(p.backgroundColor, [0.04, 0.04, 0.04]);
        const lum = 0.2126 * bgColor[0] + 0.7152 * bgColor[1] + 0.0722 * bgColor[2];
        const isLight = p.mode === 'ink' || (p.mode === 'auto' && lum > 0.5);
        const labA = rgbToOklab(parseCssColor(p.colors[0], [0.48, 0.3, 1]));
        const labB = rgbToOklab(parseCssColor(p.colors[1], [1, 0.78, 0.95]));
        const arms = Math.round(clamp(p.arms, 1, 8));
        const twist = clamp(p.twist, 0.5, 8);
        const armStrength = clamp(p.armStrength, 0, 1);

        sUniforms.uResolution.value.set(w, h);
        sUniforms.uCenter.value.set(proj.center[0], proj.center[1]);
        sUniforms.uFocal.value = proj.focal;
        sUniforms.uIncline.value = proj.incline;
        sUniforms.uRoll.value = proj.roll;
        sUniforms.uPixelRatio.value = pixelRatio;
        orbitUniforms.uTime.value = animTime;
        sUniforms.uRealTime.value = simTime;
        orbitUniforms.uArms.value = arms;
        orbitUniforms.uTwist.value = twist;
        orbitUniforms.uEps.value =
          (0.92 * armStrength) / Math.sqrt(1 + arms * arms * twist * twist);
        sUniforms.uDust.value = clamp(p.dust, 0, 1);
        sUniforms.uCore.value = clamp(p.core, 0, 3);
        sUniforms.uVoid.value = clamp(p.innerVoid, 0, 0.6);
        sUniforms.uSize.value = clamp(p.starSize, 0.3, 6);
        sUniforms.uSparkle.value = 0.2 * clamp(p.sparkle, 0, 1);
        sUniforms.uTwinkle.value = p.reduced ? 0 : clamp(p.twinkle, 0, 1);
        sUniforms.uBack.value = 1 - clamp(p.depth, 0, 1);
        sUniforms.uEnergy.value = hoverEnergy;
        sUniforms.uInk.value = isLight ? 1 : 0;
        sUniforms.uLabA.value.set(labA[0], labA[1], labA[2]);
        sUniforms.uLabB.value.set(labB[0], labB[1], labB[2]);
        sUniforms.uActive.value = hasActiveRipples() ? 1 : 0;

        const starsCount = Math.round(clamp(p.stars, 2000, 250000));
        const areaScale = Math.pow(proj.focal / 3.6 / pixelRatio / 380, 2);
        const drawFraction = clamp(areaScale, 0.2, 1);
        const sizeScale = clamp(Math.pow(areaScale, 0.25), 0.9, 1.22);
        starsMesh.geometry.setDrawRange(0, Math.round(starsCount * drawFraction));
        sUniforms.uSizeScale.value = sizeScale;
        sUniforms.uStarGain.value =
          0.3 *
          Math.sqrt(60000 / starsCount) *
          clamp(areaScale / (drawFraction * sizeScale * sizeScale), 0.5, 1.5);

        const cUniforms = compositeMaterial.uniforms;
        cUniforms.uBackground.value.set(
          sRgbToLinear(bgColor[0]),
          sRgbToLinear(bgColor[1]),
          sRgbToLinear(bgColor[2])
        );
        cUniforms.uGlow.value = clamp(p.glow, 0, 3);
        cUniforms.uExposure.value =
          (isLight ? 4.5 : 1) * clamp(p.intensity, 0, 4) * (1 + 0.08 * hoverEnergy);
        cUniforms.uMode.value = isLight ? 1 : 0;
        cUniforms.uGrain.value = grainSeed;

        renderer.setRenderTarget(mainTarget);
        renderer.setClearColor(0, 0);
        renderer.clear();
        renderer.render(starsScene, quadCamera);

        let currentSource = mainTarget;
        for (const downTarget of downTargets) {
          downsampleMaterial.uniforms.uSource.value = currentSource.texture;
          downsampleMaterial.uniforms.uTexel.value.set(
            1 / currentSource.width,
            1 / currentSource.height
          );
          renderPass(downsampleMaterial, downTarget);
          currentSource = downTarget;
        }

        let currentBloom = downTargets[downTargets.length - 1];
        for (let i = downTargets.length - 2; i >= 0; i--) {
          upsampleMaterial.uniforms.uSource.value = currentBloom.texture;
          upsampleMaterial.uniforms.uBase.value = downTargets[i].texture;
          upsampleMaterial.uniforms.uTexel.value.set(
            1 / currentBloom.width,
            1 / currentBloom.height
          );
          renderPass(upsampleMaterial, upTargets[i]);
          currentBloom = upTargets[i];
        }

        compositeMaterial.uniforms.uLines.value = mainTarget.texture;
        compositeMaterial.uniforms.uBloom.value = currentBloom.texture;
        renderPass(compositeMaterial, null);
      };

      const getTargetHoverBoost = () => {
        const p = pRef.current;
        return pointerState.inside && p.interactive && !p.reduced
          ? clamp(p.hoverBoost, 0, 2)
          : 0;
      };

      const updateSimulation = (dt) => {
        const p = pRef.current;
        if (!stateTargets.length || p.paused || p.reduced || dt <= 0) return;
        let gather = 0;
        let drag = 0;
        const trail = pointerState.trail;
        const disc = pointerState.disc;
        const uniforms = stateMaterial.uniforms;

        if (pointerState.inside && p.interactive && p.hoverWake && trail && disc) {
          const dist = Math.hypot(disc.x - trail.x, disc.y - trail.y);
          if (dist > 1e-5) {
            const speed = clamp((dist / Math.max(dt, 1 / 240) - 0.05) / 1.15, 0, 1);
            gather =
              0.9 *
              clamp(p.wakeStrength, 0, 3) *
              speed *
              speed *
              (3 - 2 * speed) *
              dist /
              (dist + 0.15948);
            drag = 0.25 * gather;
            uniforms.uSegment.value.set(trail.x, trail.y, disc.x, disc.y);
            if (gather > 0) lastWakeTime = simTime;
          }
        }

        pointerState.trail = disc ? { x: disc.x, y: disc.y } : null;

        if (gather > 0 || simTime - lastWakeTime <= 24.5) {
          uniforms.uGather.value = gather;
          uniforms.uDrag.value = drag;
          uniforms.uDecay.value = Math.exp(-dt / 3.5);
          uniforms.uState.value = stateTargets[stateIndex].texture;
          uniforms.uTime.value = animTime;
          quadMesh.material = stateMaterial;
          renderer.setRenderTarget(stateTargets[1 - stateIndex]);
          renderer.render(quadScene, quadCamera);
          stateIndex = 1 - stateIndex;
          starsMaterial.uniforms.uState.value = stateTargets[stateIndex].texture;
        }
      };

      const animate = (timestamp) => {
        animFrameId = 0;
        if (isDestroyed) return;
        const dt = Math.min(0.05, Math.max(0, (timestamp - lastFrameTime) / 1000));
        lastFrameTime = timestamp;
        const p = pRef.current;
        hoverEnergy += (getTargetHoverBoost() - hoverEnergy) * (1 - Math.exp(-dt / 0.5));
        if (!p.paused && !p.reduced) {
          simTime += dt;
          animTime += dt * clamp(p.speed, -4, 4) * (1 + 0.25 * hoverEnergy);
          grainSeed = (grainSeed + 0.618034) % 1;
        }
        rebuildGalaxy();
        updateSimulation(dt);
        renderFrame();

        const isAnimated = !p.paused && !p.reduced;
        const hasActiveEffects =
          Math.abs(hoverEnergy - getTargetHoverBoost()) > 0.002 ||
          hasActiveRipples() ||
          simTime - lastWakeTime < 24.5;

        if (isIntersecting && !document.hidden && (isAnimated || hasActiveEffects)) {
          animFrameId = requestAnimationFrame(animate);
        }
      };

      function scheduleRender() {
        if (isDestroyed || animFrameId || !isIntersecting) return;
        lastFrameTime = performance.now();
        animFrameId = requestAnimationFrame(animate);
      }

      const resize = () => {
        const rect = container.getBoundingClientRect();
        viewWidth = Math.max(1, rect.width);
        viewHeight = Math.max(1, rect.height);
        pixelRatio =
          Math.min(window.devicePixelRatio || 1, 2) *
          clamp(pRef.current.quality, 0.25, 1);
        renderer.setPixelRatio(pixelRatio);
        renderer.setSize(viewWidth, viewHeight, false);
        const w = Math.round(viewWidth * pixelRatio);
        const h = Math.round(viewHeight * pixelRatio);
        disposeTargets();
        mainTarget = createRenderTarget(w, h);
        const levels = clamp(Math.floor(Math.log2(Math.min(w, h) / 8)), 3, 7);
        for (let i = 1; i <= levels; i++) {
          downTargets.push(createRenderTarget(Math.max(1, w >> i), Math.max(1, h >> i)));
          upTargets.push(createRenderTarget(Math.max(1, w >> i), Math.max(1, h >> i)));
        }
        renderFrame();
        scheduleRender();
      };

      const onPointerMove = (e) => {
        const p = pRef.current;
        if (e.pointerType === 'touch' || !p.interactive) return;
        if (!pointerState.inside) {
          pointerState.inside = true;
          pointerState.trail = null;
          scheduleRender();
        }
        const pos = screenToGalaxy(e.clientX, e.clientY);
        pointerState.disc = pos && Math.hypot(pos.x, pos.y) < 1.6 ? pos : null;
        if (!pointerState.disc) pointerState.trail = null;
        scheduleRender();
      };

      const onPointerLeave = () => {
        pointerState.inside = false;
        pointerState.disc = null;
        pointerState.trail = null;
        scheduleRender();
      };

      const onPointerDown = (e) => {
        const p = pRef.current;
        if (e.button !== 0 || !p.interactive || !p.clickRipple) return;
        const pos = screenToGalaxy(e.clientX, e.clientY);
        const isInside = pos && Math.hypot(pos.x, pos.y) < 1.2;
        triggerRipple(isInside ? pos.x : 0, isInside ? pos.y : 0);
      };

      window.addEventListener('pointermove', onPointerMove, { passive: true });
      window.addEventListener('pointerleave', onPointerLeave);
      window.addEventListener('pointercancel', onPointerLeave);
      window.addEventListener('pointerdown', onPointerDown, { passive: true });

      const resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(container);

      const intersectionObserver = new IntersectionObserver(
        (entries) => {
          isIntersecting = entries.some((entry) => entry.isIntersecting);
          if (isIntersecting) scheduleRender();
        },
        { rootMargin: '80px' }
      );
      intersectionObserver.observe(container);

      const onVisibilityChange = () => {
        if (!document.hidden) scheduleRender();
      };
      document.addEventListener('visibilitychange', onVisibilityChange);

      const onContextLost = (e) => e.preventDefault();
      canvas.addEventListener('webglcontextlost', onContextLost);

      resize();

      return {
        sync: () => {
          const currentScale =
            Math.min(window.devicePixelRatio || 1, 2) *
            clamp(pRef.current.quality, 0.25, 1);
          if (Math.abs(currentScale - pixelRatio) > 0.001) {
            resize();
          } else {
            renderFrame();
          }
          scheduleRender();
        },
        destroy: () => {
          isDestroyed = true;
          cancelAnimationFrame(animFrameId);
          window.removeEventListener('pointermove', onPointerMove);
          window.removeEventListener('pointerleave', onPointerLeave);
          window.removeEventListener('pointercancel', onPointerLeave);
          window.removeEventListener('pointerdown', onPointerDown);
          document.removeEventListener('visibilitychange', onVisibilityChange);
          canvas.removeEventListener('webglcontextlost', onContextLost);
          resizeObserver.disconnect();
          intersectionObserver.disconnect();
          disposeTargets();
          starsMesh.geometry.dispose();
          staticTexture?.dispose();
          stateTargets.forEach((rt) => rt.dispose());
          quadGeo.dispose();
          [
            starsMaterial,
            stateMaterial,
            downsampleMaterial,
            upsampleMaterial,
            compositeMaterial
          ].forEach((m) => m.dispose());
          renderer.dispose();
          renderer.forceContextLoss();
          canvas.remove();
        },
        ripple: () => triggerRipple(0, 0)
      };
    })(container, paramsRef);

    controllerRef.current = controller;
    return () => {
      controller?.destroy();
      controllerRef.current = null;
    };
  }, []);

  useImperativeHandle(ref, () => ({
    ripple: () => controllerRef.current?.ripple()
  }), []);

  return (
    <div
      ref={containerRef}
      className={`relative isolate h-full min-h-[240px] w-full overflow-hidden ${className}`}
      style={{ backgroundColor, ...style }}
    >
      {children && <div className="relative z-10 h-full w-full">{children}</div>}
    </div>
  );
});

BinaryOrbits.displayName = 'BinaryOrbits';

export default BinaryOrbits;
