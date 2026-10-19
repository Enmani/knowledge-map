import {
  AddEquation,
  AdditiveBlending,
  BufferGeometry,
  Color,
  CustomBlending,
  DynamicDrawUsage,
  Float32BufferAttribute,
  Group,
  HalfFloatType,
  InstancedBufferAttribute,
  InstancedMesh,
  LineSegments,
  LinearFilter,
  Matrix4,
  MathUtils,
  Mesh,
  NormalBlending,
  OneFactor,
  Plane,
  PlaneGeometry,
  PerspectiveCamera,
  Quaternion,
  Raycaster,
  Scene,
  ShaderMaterial,
  Sprite,
  SpriteMaterial,
  Texture,
  Vector2,
  Vector3,
  WebGLRenderer,
  WebGLRenderTarget,
  type Intersection,
  type Object3D,
} from 'three'
import type {
  KnowledgeSpaceProjection,
  ProjectedKnowledgeField,
  ProjectedKnowledgeEdge,
  ProjectedKnowledgeNode,
  ScienceDomainDefinition,
} from '../../knowledge/space3d/types'
import { computeFoundationScores } from '../../knowledge/space3d/semanticLayout'
import {
  CARD_FOCUS_CONTEXT_OPACITY,
  getCardFocusRole,
  type CardFocusState,
} from '../core/cardFocus'
import {
  createKnowledgeBubbleTexture,
  createKnowledgeCardTexture,
  createKnowledgeTitleTexture,
  createNodeGlowTexture,
  measureKnowledgeBubble,
  redrawKnowledgeCardTexture,
} from './cardTexture'
import {
  KNOWLEDGE_BUBBLE_CENTER_OFFSET_PX,
  KNOWLEDGE_CARD_PIXEL_HEIGHT,
  KNOWLEDGE_CARD_PIXEL_WIDTH,
  activeBubbleNodeLod,
  knowledgeLabelCenterOffsetPx,
  selectKnowledgeBubbles,
  type KnowledgeBubbleCandidate,
  type KnowledgeBubbleRect,
} from './bubbleLayout'
import {
  DOMAIN_LABEL_MAX_OPACITY,
  createDomainLabelTexture,
  domainOverviewProgress,
  nodeNameOverviewOpacity,
} from './domainOverview'
import {
  EDGE_PULSE_PERIOD_SECONDS,
  displayKnowledgeEdgeOpacity,
  focusedKnowledgeEdgePulse,
  knowledgeEdgeColor,
} from './edgeVisual'
import {
  MAX_GLOBAL_ZOOM,
  dampGlobalZoom,
  globalZoomPercent,
  isGlobalZoomSettled,
  nextGlobalZoom,
  zoomPanCompensation,
} from './globalZoom'
import {
  buildNodeGlowSalience,
  dampNodeGlowValue,
  normalizeNodeHaloLinearRgb,
  NODE_STAR_CORE_SCALE,
  resolveNodeGlowVisual,
} from './nodeGlow'
import {
  SUBSPACE_SCOPE_ENTER_PROGRESS,
  SUBSPACE_SCOPE_EXIT_PROGRESS,
  childFieldScopeWeight,
  createSubspaceRevealRange,
  parentFieldScopeWeight,
  parentScopeWeight,
  shouldEnterSubspaceScope,
  shouldExitSubspaceScope,
  subspaceCardCenter,
  subspaceEntryZoom,
  subspaceRevealProgress,
} from './subspaceLod'
import {
  HOVERED_NODE_VISUAL_SCALE,
  NODE_DISPLAY_RENDER_ORDER,
  RELATED_NODE_LODS,
  RELATED_NODE_MIN_OPACITY,
  SELECTED_NODE_STAR_SCALE,
  relatedNodeDepthRenderOrder,
  resolveNodeDisplayPriority,
  type NodeDisplayPriority,
} from './selectionFocus'
import {
  STABLE_LOD_EVALUATION_INTERVAL_MS,
  STABLE_LOD_MAX_SWAPS_PER_EVALUATION,
  STABLE_LOD_VIEW_REFRESH_DURATION_MS,
  stableDesiredLod,
  stableHemisphereEligibility,
  stableLodChangeReady,
  stableLodDetail,
  stableLodInteractionRetained,
  stableLodLabelBudget,
  stableLodMinimumEmphasis,
  stableLodRetentionBonus,
  stableLodScore,
  stableLodScoreAlpha,
  stableLodSemanticPriority,
  stableLodViewRefreshNeeded,
  type StableNodeLod,
} from './stableLod'
import type {
  SpaceColorTheme,
  ThreeKnowledgeCameraState,
  ThreeKnowledgeRendererCallbacks,
  ThreeKnowledgeRendererOptions,
  ThreeKnowledgeSubspace,
  ThreeKnowledgeSubspaceField,
} from './types'

const CARD_WIDTH = 4.1
const CARD_HEIGHT = 1.54
const TITLE_WIDTH = 3.2
const TITLE_HEIGHT = 0.8
const GLOW_SIZE = 0.68
const STAR_CORE_SIZE = GLOW_SIZE * NODE_STAR_CORE_SCALE
const CLICK_MOVEMENT_LIMIT = 6
const SETTLE_EPSILON = 0.0015
const HIDDEN_OPACITY_EPSILON = 0.001
const LOD_CANDIDATE_OPACITY_EPSILON = 0.01
const LABEL_COLLISION_PADDING_PX = 5
const FAR_NODE_HIT_RADIUS_PX = 10
const WALK_MIN_SPEED = 4
const WALK_MAX_SPEED = 22
const WALK_DISTANCE_FACTOR = 0.42
const FIELD_RENDER_SCALE = 0.42
const FIELD_GLOW_RENDER_SCALE = 0.21
const FIELD_SPLAT_SUPPORT_SCALE = 1.48
const FIELD_GLOW_BLUR_RADIUS = 2.2
const NODE_HALO_RENDER_SCALE = 0.28
const NODE_HALO_SUPPORT_SCALE = 1.55
const NODE_HALO_VISIBLE_EPSILON = 0.002
const NODE_HALO_TITLE_WEIGHT = 1
const NODE_HALO_CARD_WEIGHT = 1
const LINEAR_ALGEBRA_NODE_ID = 'linear-algebra'
const LINEAR_ALGEBRA_ICON_ONE_WAY_MS = 2000
const BUBBLE_VIEW_TRAVEL_RATIO = 0.18
const BUBBLE_VIEW_ANGLE_RADIANS = Math.PI / 15
const BUBBLE_VIEW_ZOOM_OCTAVES = 0.16

const DARK_DOMAIN_FIELD_COLORS: Readonly<Record<string, string>> = {
  mathematics: '#5d8fd2',
  physics: '#9c6fb0',
  chemistry: '#c77d50',
  biology: '#58927a',
  'computer-science': '#4e91a3',
  'earth-environmental': '#9a8d52',
}

const DARK_TAG_FIELD_COLORS: Readonly<Record<string, string>> = {
  '#8aa7a2': '#56a08f',
  '#b39a78': '#b3864f',
  '#9a91ae': '#8372b3',
  '#b88477': '#b56c59',
  '#7897ad': '#548bb6',
  '#9aa778': '#829b4f',
  '#a47f96': '#a65d8b',
  '#7fa39a': '#4d9b8a',
}

const LIGHT_TAG_FIELD_COLORS: Readonly<Record<string, string>> = {
  '#8aa7a2': '#4f776f',
  '#b39a78': '#80623c',
  '#9a91ae': '#685b82',
  '#b88477': '#85544a',
  '#7897ad': '#496c84',
  '#9aa778': '#667341',
  '#a47f96': '#79566d',
  '#7fa39a': '#4d756c',
}

const WALK_CODES = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyQ', 'KeyE'])

type NodeLod = StableNodeLod

interface NodeRuntime {
  id: string
  subspaceId: string | null
  group: Group
  sprite: Sprite
  material: SpriteMaterial
  starSprite: Sprite
  starMaterial: SpriteMaterial
  cardTexture: Texture | null
  selectedCardTexture: Texture | null
  relatedCardTexture: Texture | null
  titleTexture: Texture | null
  selectedTitleTexture: Texture | null
  relatedTitleTexture: Texture | null
  bubbleTexture: Texture | null
  bubblePixelWidth: number
  bubblePixelHeight: number
  glowTexture: Texture | null
  projection: ProjectedKnowledgeNode
  currentPosition: Vector3
  targetPosition: Vector3
  currentOpacity: number
  targetOpacity: number
  currentScale: number
  targetScale: number
  selected: boolean
  lod: NodeLod
  displayOpacity: number
  currentVisualWidth: number
  currentVisualHeight: number
  targetVisualWidth: number
  targetVisualHeight: number
  currentHoverScale: number
  stableLodScore: number
  stableLodChangedAt: number
  stableLodCandidate: NodeLod | null
  stableLodCandidateSince: number
  labelHiddenSince: number
  hemisphereEligible: boolean
  haloInstanceIndex: number
  baseGlowSalience: number
  currentCoreOpacity: number
  targetCoreOpacity: number
  currentBloomCoreDensity: number
  targetBloomCoreDensity: number
  currentHaloOpticalDensity: number
  targetHaloOpticalDensity: number
  currentHaloRadiusScale: number
  targetHaloRadiusScale: number
  haloPresentationWeight: number
}

interface EdgeRuntime {
  id: string
  subspaceId: string | null
  sourceId: string
  targetId: string
  vertexOffset: number
  projection: ProjectedKnowledgeEdge
  currentOpacity: number
  targetOpacity: number
}

interface DomainLabelRuntime {
  domain: ScienceDomainDefinition
  sprite: Sprite
  material: SpriteMaterial
  texture: Texture
  pixelWidth: number
  pixelHeight: number
}

interface FieldLobeRuntime {
  nodeId: string
  currentPosition: Vector3
  targetPosition: Vector3
  currentRadius: number
  targetRadius: number
  currentOpacity: number
  targetOpacity: number
}

interface FieldRuntime {
  id: string
  subspaceId: string | null
  instanceOffset: number
  projection: ProjectedKnowledgeField
  lobes: FieldLobeRuntime[]
  currentOpacity: number
  targetOpacity: number
  hasVisibleLobes: boolean
  instancesAnimating: boolean
}

interface PointerGesture {
  id: number
  button: number
  mode: 'pan' | 'rotate'
  rotationPivot: Vector3 | null
  pressedNodeId: string | null
  startX: number
  startY: number
  lastX: number
  lastY: number
  moved: boolean
}

interface ZoomAnchor {
  point: Vector3
  nodeId: string | null
}

interface SubspaceRuntime {
  definition: ThreeKnowledgeSubspace
  nodeIds: readonly string[]
  edgeIds: readonly string[]
  fieldIds: readonly string[]
  progress: number
  armed: boolean
  hasRevealed: boolean
  revealStartPx: number
  revealEndPx: number
}

function toVector3([x, y, z]: readonly [number, number, number]): Vector3 {
  return new Vector3(x, y, z)
}

function toSpaceVector3(vector: Vector3): readonly [number, number, number] {
  return [vector.x, vector.y, vector.z]
}

function expLerpFactor(speed: number, deltaSeconds: number): number {
  return 1 - Math.exp(-speed * Math.min(deltaSeconds, 0.05))
}

function disposeObject(object: Object3D) {
  object.traverse((child: Object3D) => {
    if (child instanceof Sprite) {
      child.material.dispose()
      return
    }
    if (child instanceof Mesh) {
      child.geometry.dispose()
      child.material.dispose()
      return
    }
    if (child instanceof LineSegments) {
      child.geometry.dispose()
      child.material.dispose()
    }
  })
}

function createEdgeBatchMaterial(): ShaderMaterial {
  return new ShaderMaterial({
    uniforms: {
      edgePulseTime: { value: 0 },
    },
    vertexShader: `
      attribute vec3 edgeColor;
      attribute float edgeOpacity;
      attribute float edgeProgress;
      attribute float edgePulse;
      varying vec3 vEdgeColor;
      varying float vEdgeOpacity;
      varying float vEdgeProgress;
      varying float vEdgePulse;
      void main() {
        vEdgeColor = edgeColor;
        vEdgeOpacity = edgeOpacity;
        vEdgeProgress = edgeProgress;
        vEdgePulse = edgePulse;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float edgePulseTime;
      varying vec3 vEdgeColor;
      varying float vEdgeOpacity;
      varying float vEdgeProgress;
      varying float vEdgePulse;
      void main() {
        if (vEdgeOpacity <= 0.004) discard;
        float cycle = edgePulseTime / ${EDGE_PULSE_PERIOD_SECONDS.toFixed(1)};
        float carrier = 0.5 + 0.5 * cos(6.2831853 * (vEdgeProgress - cycle));
        float pulse = smoothstep(0.72, 1.0, carrier) * clamp(vEdgePulse, 0.0, 1.0);
        vec3 pulseColor = mix(vEdgeColor, vec3(1.0), vEdgePulse * 0.16 + pulse * 0.5);
        float pulseOpacity = clamp(vEdgeOpacity * (1.0 + vEdgePulse * 0.12 + pulse * 0.42) + pulse * 0.14, 0.0, 1.0);
        gl_FragColor = vec4(pulseColor, pulseOpacity);
        #include <colorspace_fragment>
      }
    `,
    transparent: true,
    depthWrite: false,
    depthTest: true,
    toneMapped: false,
  })
}

function displayFieldOpacity(field: ProjectedKnowledgeField, subspace = false): number {
  const base = field.kind === 'domain'
    ? Math.min(0.055, field.opacity * 0.52)
    : Math.min(0.026, field.opacity * 0.58)
  return subspace ? base * 1.8 : base
}

function displayFieldColor(field: ProjectedKnowledgeField, colorTheme: SpaceColorTheme): Color {
  if (field.domain) {
    const color = colorTheme === 'dark'
      ? DARK_DOMAIN_FIELD_COLORS[field.domain.id] ?? field.color
      : field.domain.color
    return new Color(color)
  }
  const key = field.color.toLowerCase()
  const color = colorTheme === 'dark'
    ? DARK_TAG_FIELD_COLORS[key] ?? field.color
    : LIGHT_TAG_FIELD_COLORS[key] ?? field.color
  return new Color(color)
}

function createFieldRenderTarget(): WebGLRenderTarget {
  const target = new WebGLRenderTarget(1, 1, {
    minFilter: LinearFilter,
    magFilter: LinearFilter,
    type: HalfFloatType,
    depthBuffer: false,
    stencilBuffer: false,
  })
  target.texture.generateMipmaps = false
  return target
}

function fieldNearFadeRange(
  field: ProjectedKnowledgeField,
  subspace: boolean,
): readonly [number, number] {
  return subspace
    ? field.kind === 'domain' ? [280, 760] : [220, 620]
    : field.kind === 'domain' ? [150, 440] : [110, 320]
}

function createVolumeMaterial(
  viewportHeight: number,
): ShaderMaterial {
  return new ShaderMaterial({
    uniforms: {
      uSupportScale: { value: FIELD_SPLAT_SUPPORT_SCALE },
      uViewportHeight: { value: viewportHeight },
    },
    vertexShader: `
      attribute float instanceOpacity;
      attribute vec3 instanceColor;
      attribute vec2 instanceNearFade;
      uniform float uSupportScale;
      uniform float uViewportHeight;
      varying vec2 vSplatPosition;
      varying float vInstanceOpacity;
      varying float vNearDetail;
      varying vec3 vInstanceColor;
      void main() {
        vec4 centerView = modelViewMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
        float radius = length(instanceMatrix[0].xyz);
        vec4 viewPosition = centerView + vec4(position.xy * radius * uSupportScale, 0.0, 0.0);
        float viewDistance = max(abs(centerView.z), 0.0001);
        float projectedRadiusPx = radius * projectionMatrix[1][1]
          / viewDistance * 0.5 * uViewportHeight;
        vSplatPosition = position.xy;
        vInstanceOpacity = instanceOpacity;
        vNearDetail = smoothstep(instanceNearFade.x, instanceNearFade.y, projectedRadiusPx);
        vInstanceColor = instanceColor;
        gl_Position = projectionMatrix * viewPosition;
      }
    `,
    fragmentShader: `
      varying vec2 vSplatPosition;
      varying float vInstanceOpacity;
      varying float vNearDetail;
      varying vec3 vInstanceColor;
      void main() {
        float radiusSquared = dot(vSplatPosition, vSplatPosition);
        if (radiusSquared >= 1.0) discard;
        float radius = sqrt(radiusSquared);
        float support = 1.0 - smoothstep(0.76, 1.0, radius);
        float core = exp2(-6.4 * radiusSquared);
        float halo = exp2(-1.7 * radiusSquared);
        float coreNearWeight = mix(1.0, 0.32, vNearDetail);
        float haloNearWeight = mix(1.0, 0.08, vNearDetail);
        float density = (
          0.72 * core * coreNearWeight
          + 0.16 * halo * haloNearWeight
        ) * support;
        float opticalDepth = vInstanceOpacity * density;
        if (opticalDepth <= 0.00001) discard;
        gl_FragColor = vec4(vInstanceColor * opticalDepth, opticalDepth);
      }
    `,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    premultipliedAlpha: true,
    blending: CustomBlending,
    blendEquation: AddEquation,
    blendSrc: OneFactor,
    blendDst: OneFactor,
    blendEquationAlpha: AddEquation,
    blendSrcAlpha: OneFactor,
    blendDstAlpha: OneFactor,
    toneMapped: false,
  })
}

function createNodeHaloMaterial(viewportHeight: number): ShaderMaterial {
  return new ShaderMaterial({
    uniforms: {
      uSupportScale: { value: NODE_HALO_SUPPORT_SCALE },
      uViewportHeight: { value: viewportHeight },
    },
    vertexShader: `
      attribute vec2 instanceOpticalDensity;
      attribute vec3 instanceColor;
      uniform float uSupportScale;
      uniform float uViewportHeight;
      varying vec2 vSplatPosition;
      varying vec2 vOpticalDensity;
      varying float vNearDetail;
      varying vec3 vInstanceColor;
      void main() {
        vec4 centerView = modelViewMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
        float radius = length(instanceMatrix[0].xyz);
        vec4 viewPosition = centerView + vec4(position.xy * radius * uSupportScale, 0.0, 0.0);
        float viewDistance = max(abs(centerView.z), 0.0001);
        float projectedRadiusPx = radius * projectionMatrix[1][1]
          / viewDistance * 0.5 * uViewportHeight;
        vSplatPosition = position.xy;
        vOpticalDensity = instanceOpticalDensity;
        vNearDetail = smoothstep(24.0, 80.0, projectedRadiusPx);
        vInstanceColor = instanceColor;
        gl_Position = projectionMatrix * viewPosition;
      }
    `,
    fragmentShader: `
      varying vec2 vSplatPosition;
      varying vec2 vOpticalDensity;
      varying float vNearDetail;
      varying vec3 vInstanceColor;
      void main() {
        float radiusSquared = dot(vSplatPosition, vSplatPosition);
        if (radiusSquared >= 1.0) discard;
        float radius = sqrt(radiusSquared);
        float support = 1.0 - smoothstep(0.76, 1.0, radius);
        float hotCore = exp2(-104.0 * radiusSquared);
        float innerBloom = exp2(-6.8 * radiusSquared);
        float halo = exp2(-1.9 * radiusSquared);
        float rayDistance = min(abs(vSplatPosition.x), abs(vSplatPosition.y));
        float diffraction = exp2(-92.0 * rayDistance) * exp2(-4.8 * radiusSquared);
        float coreNearWeight = mix(1.0, 0.18, vNearDetail);
        float haloNearWeight = mix(1.0, 0.06, vNearDetail);
        float hotDepth = vOpticalDensity.x * hotCore * 1.9 * coreNearWeight;
        float bloomDepth = vOpticalDensity.x * innerBloom * 0.58 * coreNearWeight;
        float rayDepth = vOpticalDensity.x * diffraction * 0.08 * coreNearWeight;
        float haloDepth = vOpticalDensity.y * halo * haloNearWeight;
        float opticalDepth = (hotDepth + bloomDepth + rayDepth + haloDepth) * support;
        if (opticalDepth <= 0.00001) discard;
        vec3 hotColor = vec3(1.0, 0.985, 0.92);
        vec3 innerColor = mix(vInstanceColor, vec3(1.0), 0.34);
        vec3 radiance = (
          hotColor * (hotDepth * 2.2 + rayDepth * 1.5)
          + innerColor * bloomDepth * 0.94
          + vInstanceColor * haloDepth
        ) * support;
        gl_FragColor = vec4(radiance, opticalDepth);
      }
    `,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    premultipliedAlpha: true,
    blending: CustomBlending,
    blendEquation: AddEquation,
    blendSrc: OneFactor,
    blendDst: OneFactor,
    blendEquationAlpha: AddEquation,
    blendSrcAlpha: OneFactor,
    blendDstAlpha: OneFactor,
    toneMapped: false,
  })
}

function createNodeHaloCompositeMaterial(texture: Texture): ShaderMaterial {
  return new ShaderMaterial({
    uniforms: {
      uSource: { value: texture },
      uExposure: { value: 1.24 },
      uSaturation: { value: 0.82 },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position.xy, 0.0, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D uSource;
      uniform float uExposure;
      uniform float uSaturation;
      varying vec2 vUv;
      void main() {
        vec4 source = texture2D(uSource, vUv);
        if (source.a <= 0.00001) discard;
        vec3 hue = source.rgb / source.a;
        float luminance = dot(hue, vec3(0.2126, 0.7152, 0.0722));
        hue = clamp(mix(vec3(luminance), hue, uSaturation), 0.0, 1.0);
        float alpha = 1.0 - exp(-source.a * uExposure);
        gl_FragColor = vec4(hue, alpha);
        #include <colorspace_fragment>
        #include <premultiplied_alpha_fragment>
      }
    `,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    premultipliedAlpha: true,
    toneMapped: false,
  })
}

function createFieldBlurMaterial(texture: Texture): ShaderMaterial {
  return new ShaderMaterial({
    uniforms: {
      uSource: { value: texture },
      uTexelStep: { value: new Vector2() },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position.xy, 0.0, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D uSource;
      uniform vec2 uTexelStep;
      varying vec2 vUv;
      void main() {
        vec4 color = texture2D(uSource, vUv) * 0.2270270270;
        color += texture2D(uSource, vUv + uTexelStep * 1.3846153846) * 0.3162162162;
        color += texture2D(uSource, vUv - uTexelStep * 1.3846153846) * 0.3162162162;
        color += texture2D(uSource, vUv + uTexelStep * 3.2307692308) * 0.0702702703;
        color += texture2D(uSource, vUv - uTexelStep * 3.2307692308) * 0.0702702703;
        gl_FragColor = color;
      }
    `,
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
  })
}

function createFieldCompositeMaterial(texture: Texture, glowTexture: Texture): ShaderMaterial {
  return new ShaderMaterial({
    uniforms: {
      uFieldTexture: { value: texture },
      uGlowTexture: { value: glowTexture },
      uSourceExposure: { value: 0.85 },
      uGlowExposure: { value: 0.38 },
      uSaturation: { value: 1.12 },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position.xy, 0.0, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D uFieldTexture;
      uniform sampler2D uGlowTexture;
      uniform float uSourceExposure;
      uniform float uGlowExposure;
      uniform float uSaturation;
      varying vec2 vUv;
      vec3 saturatedColor(vec3 color) {
        float luminance = dot(color, vec3(0.2126, 0.7152, 0.0722));
        return clamp(mix(vec3(luminance), color, uSaturation), 0.0, 1.0);
      }
      void main() {
        vec4 source = texture2D(uFieldTexture, vUv);
        vec4 glow = texture2D(uGlowTexture, vUv);
        vec3 sourceHue = saturatedColor(source.rgb / max(source.a, 0.00001));
        vec3 glowHue = saturatedColor(glow.rgb / max(glow.a, 0.00001));
        float sourceAlpha = 1.0 - exp(-source.a * uSourceExposure);
        float glowAlpha = 1.0 - exp(-glow.a * uGlowExposure);
        vec3 premultiplied = sourceHue * sourceAlpha
          + glowHue * glowAlpha * (1.0 - sourceAlpha);
        float alpha = sourceAlpha + glowAlpha * (1.0 - sourceAlpha);
        vec3 straightColor = alpha > 0.00001 ? premultiplied / alpha : vec3(0.0);
        gl_FragColor = vec4(straightColor, alpha);
        #include <colorspace_fragment>
        #include <premultiplied_alpha_fragment>
      }
    `,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    premultipliedAlpha: true,
    toneMapped: false,
  })
}

export class ThreeKnowledgeRenderer {
  readonly renderer: WebGLRenderer
  readonly scene = new Scene()
  readonly camera: PerspectiveCamera

  private readonly host: HTMLElement
  private readonly fieldLayer = new Group()
  private readonly nodeHaloBatchMaterial = createNodeHaloMaterial(1)
  private nodeHaloBatch: InstancedMesh<PlaneGeometry, ShaderMaterial> | null = null
  private nodeHaloOpticalDensityAttribute: InstancedBufferAttribute | null = null
  private nodeHaloColorAttribute: InstancedBufferAttribute | null = null
  private nodeHaloBatchStructureDirty = true
  private nodeHaloMatricesDirty = true
  private nodeHaloStylesDirty = true
  private nodeHaloOpticalDensitiesDirty = true
  private hasVisibleNodeHaloBatch = false
  private readonly nodeHaloMatrixScratch = new Matrix4()
  private readonly nodeHaloRotationScratch = new Quaternion()
  private readonly nodeHaloScaleScratch = new Vector3()
  private readonly nodeHaloColorScratch = new Color()
  private readonly nodeHaloScene = new Scene()
  private readonly nodeHaloRenderTarget = createFieldRenderTarget()
  private readonly nodeHaloCompositeMaterial = createNodeHaloCompositeMaterial(
    this.nodeHaloRenderTarget.texture,
  )
  private readonly nodeHaloCompositeMesh = new Mesh(
    new PlaneGeometry(2, 2, 1, 1),
    this.nodeHaloCompositeMaterial,
  )
  private nodeHaloPassDirty = true
  private readonly fieldBatchMaterial = createVolumeMaterial(1)
  private fieldBatch: InstancedMesh<PlaneGeometry, ShaderMaterial> | null = null
  private fieldOpacityAttribute: InstancedBufferAttribute | null = null
  private fieldColorAttribute: InstancedBufferAttribute | null = null
  private fieldNearFadeAttribute: InstancedBufferAttribute | null = null
  private fieldBatchStructureDirty = true
  private fieldMatricesDirty = true
  private fieldStylesDirty = true
  private fieldOpacitiesDirty = true
  private fieldAnimationActive = false
  private hasVisibleFieldBatch = false
  private readonly fieldMatrixScratch = new Matrix4()
  private readonly fieldRotationScratch = new Quaternion()
  private readonly fieldScaleScratch = new Vector3()
  private readonly cameraSpaceScratch = new Vector3()
  private readonly hemisphereCameraScratch = new Vector3()
  private readonly hemisphereNodeScratch = new Vector3()
  private readonly hemisphereResult = { value: 1, cameraInside: false }
  private readonly fieldScene = new Scene()
  private readonly fieldPostScene = new Scene()
  private readonly fieldRenderTarget = createFieldRenderTarget()
  private readonly fieldBlurTarget = createFieldRenderTarget()
  private readonly fieldGlowTarget = createFieldRenderTarget()
  private readonly fieldBlurMaterial = createFieldBlurMaterial(this.fieldRenderTarget.texture)
  private readonly fieldBlurMesh = new Mesh(
    new PlaneGeometry(2, 2, 1, 1),
    this.fieldBlurMaterial,
  )
  private readonly fieldCompositeMaterial = createFieldCompositeMaterial(
    this.fieldRenderTarget.texture,
    this.fieldGlowTarget.texture,
  )
  private readonly fieldCompositeMesh = new Mesh(
    new PlaneGeometry(2, 2, 1, 1),
    this.fieldCompositeMaterial,
  )
  private readonly edgeLayer = new Group()
  private readonly edgeBatchMaterial = createEdgeBatchMaterial()
  private edgeBatch: LineSegments<BufferGeometry, ShaderMaterial> | null = null
  private edgePositionAttribute: Float32BufferAttribute | null = null
  private edgeColorAttribute: Float32BufferAttribute | null = null
  private edgeOpacityAttribute: Float32BufferAttribute | null = null
  private edgeProgressAttribute: Float32BufferAttribute | null = null
  private edgePulseAttribute: Float32BufferAttribute | null = null
  private edgeBatchStructureDirty = true
  private edgePositionsDirty = true
  private edgeColorsDirty = true
  private edgeOpacitiesDirty = true
  private edgePulsesDirty = true
  private edgeOpacityAnimationActive = false
  private edgePulseActive = false
  private readonly edgeColorScratch = new Color()
  private readonly domainLabelLayer = new Group()
  private readonly domainLabels = new Map<string, DomainLabelRuntime>()
  private readonly domainLabelCenterScratch = new Vector3()
  private readonly nodeLayer = new Group()
  private readonly raycaster = new Raycaster()
  private readonly pointer = new Vector2()
  private readonly pointerPlane = new Plane()
  private readonly nodes = new Map<string, NodeRuntime>()
  private readonly edges = new Map<string, EdgeRuntime>()
  private readonly fields = new Map<string, FieldRuntime>()
  private readonly subspaces = new Map<string, SubspaceRuntime>()
  private readonly selectedNeighborIds = new Set<string>()
  private readonly bubbleNodeIds = new Set<string>()
  private readonly focusedBubbleNodeIds = new Set<string>()
  private readonly domains = new Map<string, ScienceDomainDefinition>()
  private readonly hoverLabelMaterial = new SpriteMaterial({
    transparent: true,
    depthTest: false,
    depthWrite: false,
    opacity: 0.98,
    toneMapped: false,
  })
  private readonly hoverLabelSprite = new Sprite(this.hoverLabelMaterial)
  private readonly movementKeys = new Set<string>()
  private callbacks: ThreeKnowledgeRendererCallbacks
  private selectedNodeId: string | null
  private cardFocus: CardFocusState
  private projection: KnowledgeSpaceProjection
  private hasPresentedProjection = false
  private frameRequest: number | null = null
  private lastFrameTime = 0
  private lastLodEvaluationTime = Number.NEGATIVE_INFINITY
  private lastLodScoreTime = Number.NEGATIVE_INFINITY
  private lastInteractedNodeId: string | null = null
  private readonly lastInteractionCameraPosition = new Vector3()
  private readonly lastInteractionLookAt = new Vector3()
  private lastInteractionCameraDistance = 1
  private lastInteractionZoom = 1
  private readonly lodViewAnchorCameraPosition = new Vector3()
  private readonly lodViewAnchorLookAt = new Vector3()
  private readonly lodViewAnchorForward = new Vector3(0, 0, -1)
  private readonly lodViewCurrentForward = new Vector3(0, 0, -1)
  private lodViewAnchorDistance = 1
  private lodViewAnchorZoom = 1
  private lodViewRefreshUntil = Number.NEGATIVE_INFINITY
  private lodScoreReseedPending = false
  private bubbleLayoutInitialized = false
  private bubbleLayoutDirty = true
  private readonly bubbleViewAnchorCameraPosition = new Vector3()
  private readonly bubbleViewAnchorLookAt = new Vector3()
  private readonly bubbleViewAnchorForward = new Vector3(0, 0, -1)
  private readonly bubbleViewCurrentForward = new Vector3(0, 0, -1)
  private readonly bubbleCameraUpScratch = new Vector3(0, 1, 0)
  private bubbleViewAnchorDistance = 1
  private bubbleViewAnchorZoom = 1
  private bubbleZoomMovedSinceAnchor = false
  private bubbleSpatialMovedSinceAnchor = false
  private pointerGesture: PointerGesture | null = null
  private pointerInside = false
  private hoverPointer: { clientX: number; clientY: number } | null = null
  private hoveredNodeId: string | null = null
  private linearAlgebraIconProgress = 0
  private linearAlgebraIconTarget: 0 | 1 = 0
  private linearAlgebraIconStartProgress = 0
  private linearAlgebraIconStartedAt = 0
  private linearAlgebraIconDurationMs = 0
  private linearAlgebraIconAnimating = false
  private linearAlgebraSelectionOpenPending = false
  private walkingMode: boolean
  private fieldsVisible: boolean
  private colorTheme: SpaceColorTheme
  private disposed = false
  private readonly lookAt = new Vector3()
  private readonly targetLookAt = new Vector3()
  private readonly targetCameraPosition = new Vector3()
  private readonly projectionCenter = new Vector3()
  private targetCameraDistance: number
  private targetGlobalZoom = 1
  private fieldViewportHeight = 1
  private fieldPassDirty = true
  private readonly fieldViewProjection = new Matrix4()
  private readonly lastFieldViewProjection = new Matrix4()
  private activeZoomAnchor: Vector3 | null = null
  private activeScopeId: string | null = null
  private cameraStateSignature = ''
  private readonly reducedMotion: boolean

  constructor(options: ThreeKnowledgeRendererOptions) {
    this.host = options.host
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    this.callbacks = options
    this.projection = options.projection
    this.selectedNodeId = options.selectedNodeId ?? null
    this.cardFocus = options.cardFocus
    this.cardFocus.relatedNodeIds.forEach((nodeId) => this.selectedNeighborIds.add(nodeId))
    this.walkingMode = options.walkingMode ?? false
    this.fieldsVisible = options.fieldsVisible ?? true
    this.colorTheme = options.colorTheme ?? 'light'
    this.renderer = new WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
      premultipliedAlpha: true,
    })
    this.renderer.setClearColor(0x000000, 0)
    this.renderer.autoClear = false
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, options.maxPixelRatio ?? 1.6))
    this.renderer.domElement.className = 'three-knowledge-canvas'
    this.renderer.domElement.tabIndex = 0
    this.renderer.domElement.setAttribute('aria-label', '三维知识空间；拖拽平移，滚轮指针定点缩放，按住 Alt 拖拽或右键拖拽时围绕当前作用域中心旋转，行走模式使用 WASD、Q 和 E')
    this.renderer.domElement.style.touchAction = 'none'
    this.renderer.domElement.style.display = 'block'
    this.renderer.domElement.style.width = '100%'
    this.renderer.domElement.style.height = '100%'
    this.host.appendChild(this.renderer.domElement)
    this.applyFieldTheme()

    this.camera = new PerspectiveCamera(39, 1, 0.1, 300)
    this.camera.position.copy(toVector3(this.projection.lens.cameraPosition))
    this.lookAt.copy(toVector3(this.projection.lens.cameraTarget))
    this.projectionCenter.copy(this.lookAt)
    this.targetLookAt.copy(this.lookAt)
    this.targetCameraPosition.copy(this.camera.position)
    this.targetCameraDistance = this.camera.position.distanceTo(this.lookAt)
    this.camera.zoom = 1
    this.targetGlobalZoom = 1
    this.camera.updateProjectionMatrix()
    this.camera.lookAt(this.lookAt)
    this.resetLodViewAnchor()
    this.resetBubbleViewAnchor()

    this.fieldCompositeMesh.renderOrder = -10
    this.fieldCompositeMesh.frustumCulled = false
    this.fieldCompositeMesh.raycast = () => undefined
    this.nodeHaloCompositeMesh.renderOrder = -5
    this.nodeHaloCompositeMesh.frustumCulled = false
    this.nodeHaloCompositeMesh.raycast = () => undefined
    this.fieldBlurMesh.frustumCulled = false
    this.fieldBlurMesh.raycast = () => undefined
    this.edgeLayer.renderOrder = 1
    this.domainLabelLayer.renderOrder = 2
    this.nodeLayer.renderOrder = 2
    this.hoverLabelSprite.visible = false
    this.hoverLabelSprite.renderOrder = 50
    this.hoverLabelSprite.frustumCulled = false
    this.hoverLabelSprite.raycast = () => undefined
    this.nodeLayer.add(this.hoverLabelSprite)
    this.fieldScene.add(this.fieldLayer)
    this.fieldPostScene.add(this.fieldBlurMesh)
    this.scene.add(
      this.fieldCompositeMesh,
      this.nodeHaloCompositeMesh,
      this.edgeLayer,
      this.domainLabelLayer,
      this.nodeLayer,
    )
    this.bindEvents()
    this.setProjection(this.projection, true)
    this.initializeSubspaces(options.subspaces ?? [], true)
    this.resize(this.host.clientWidth || 1, this.host.clientHeight || 1)
  }

  setCallbacks(callbacks: ThreeKnowledgeRendererCallbacks) {
    this.callbacks = callbacks
  }

  setWalkingMode(enabled: boolean) {
    if (this.walkingMode === enabled) return
    this.walkingMode = enabled
    this.movementKeys.clear()
    this.requestRender()
  }

  setFieldsVisible(visible: boolean) {
    if (this.fieldsVisible === visible) return
    this.fieldsVisible = visible
    for (const runtime of this.fields.values()) {
      runtime.targetOpacity = visible
        ? displayFieldOpacity(runtime.projection, runtime.subspaceId !== null)
        : 0
      if (this.reducedMotion) {
        runtime.currentOpacity = runtime.targetOpacity
      }
    }
    this.fieldAnimationActive = !this.reducedMotion
    this.fieldOpacitiesDirty = true
    this.fieldPassDirty = true
    this.requestRender()
  }

  setColorTheme(colorTheme: SpaceColorTheme) {
    if (this.colorTheme === colorTheme) return
    this.colorTheme = colorTheme
    for (const runtime of this.nodes.values()) {
      runtime.cardTexture?.dispose()
      runtime.selectedCardTexture?.dispose()
      runtime.relatedCardTexture?.dispose()
      runtime.titleTexture?.dispose()
      runtime.selectedTitleTexture?.dispose()
      runtime.relatedTitleTexture?.dispose()
      runtime.bubbleTexture?.dispose()
      runtime.cardTexture = null
      runtime.selectedCardTexture = null
      runtime.relatedCardTexture = null
      runtime.titleTexture = null
      runtime.selectedTitleTexture = null
      runtime.relatedTitleTexture = null
      runtime.bubbleTexture = null
      runtime.material.map = this.textureForBubblePresentation(runtime, runtime.lod)
      runtime.material.needsUpdate = true
    }
    if (this.hoveredNodeId) {
      const runtime = this.nodes.get(this.hoveredNodeId)
      if (runtime) {
        this.hoverLabelMaterial.map = this.bubbleTextureForNode(runtime)
        this.hoverLabelMaterial.needsUpdate = true
      }
    }
    for (const runtime of this.edges.values()) {
      const sourceVisible = this.nodes.get(runtime.sourceId)?.projection.visible === true
      const targetVisible = this.nodes.get(runtime.targetId)?.projection.visible === true
      runtime.targetOpacity = sourceVisible && targetVisible
        ? displayKnowledgeEdgeOpacity(
            runtime.projection.opacity,
            this.cardFocus,
            runtime.sourceId,
            runtime.targetId,
            this.colorTheme,
          )
        : 0
      if (this.reducedMotion) runtime.currentOpacity = runtime.targetOpacity
    }
    this.edgeColorsDirty = true
    this.edgeOpacitiesDirty = true
    this.edgeOpacityAnimationActive = !this.reducedMotion
    this.refreshEdgePulseState()
    this.syncDomainLabels(true)
    this.applyFieldTheme()
    this.requestRender()
  }

  private applyFieldTheme() {
    const dark = this.colorTheme === 'dark'
    this.edgeBatchMaterial.blending = dark ? AdditiveBlending : NormalBlending
    this.edgeBatchMaterial.needsUpdate = true
    this.fieldCompositeMaterial.uniforms.uSourceExposure.value = dark ? 0.85 : 0.58
    this.fieldCompositeMaterial.uniforms.uGlowExposure.value = dark ? 0.38 : 0.2
    this.fieldCompositeMaterial.uniforms.uSaturation.value = dark ? 1.12 : 1.02
    this.nodeHaloCompositeMaterial.uniforms.uExposure.value = dark ? 1.24 : 0.68
    this.nodeHaloCompositeMaterial.uniforms.uSaturation.value = dark ? 0.82 : 0.72
    this.fieldStylesDirty = true
    this.nodeHaloStylesDirty = true
    this.fieldPassDirty = true
    this.nodeHaloPassDirty = true
  }

  private syncDomainLabels(recreateTextures = false) {
    const activeDomainIds = new Set(this.domains.keys())
    for (const [domainId, runtime] of this.domainLabels) {
      if (activeDomainIds.has(domainId)) continue
      this.domainLabelLayer.remove(runtime.sprite)
      runtime.texture.dispose()
      runtime.material.dispose()
      this.domainLabels.delete(domainId)
    }

    for (const domain of this.domains.values()) {
      const existing = this.domainLabels.get(domain.id)
      if (existing && !recreateTextures) {
        existing.domain = domain
        continue
      }
      const created = createDomainLabelTexture(domain, this.colorTheme)
      if (existing) {
        existing.texture.dispose()
        existing.domain = domain
        existing.texture = created.texture
        existing.pixelWidth = created.pixelWidth
        existing.pixelHeight = created.pixelHeight
        existing.material.map = created.texture
        existing.material.needsUpdate = true
        continue
      }
      const material = new SpriteMaterial({
        map: created.texture,
        transparent: true,
        depthWrite: false,
        depthTest: false,
        opacity: 0,
        toneMapped: false,
      })
      const sprite = new Sprite(material)
      sprite.visible = false
      sprite.renderOrder = 2
      sprite.frustumCulled = false
      sprite.raycast = () => undefined
      this.domainLabelLayer.add(sprite)
      this.domainLabels.set(domain.id, {
        domain,
        sprite,
        material,
        texture: created.texture,
        pixelWidth: created.pixelWidth,
        pixelHeight: created.pixelHeight,
      })
    }
  }

  private updateDomainLabelPresentation() {
    const opacity = domainOverviewProgress(this.camera.zoom)
    if (opacity <= 0.001) {
      this.domainLabelLayer.visible = false
      return
    }
    this.domainLabelLayer.visible = true
    const viewportHeight = Math.max(1, this.renderer.domElement.clientHeight)
    for (const runtime of this.domainLabels.values()) {
      this.domainLabelCenterScratch.set(0, 0, 0)
      let memberCount = 0
      for (const nodeRuntime of this.nodes.values()) {
        if (
          nodeRuntime.subspaceId !== null
          || !nodeRuntime.projection.node.domains.includes(runtime.domain.id)
        ) continue
        this.domainLabelCenterScratch.add(nodeRuntime.currentPosition)
        memberCount += 1
      }
      if (memberCount === 0) {
        runtime.sprite.visible = false
        continue
      }
      this.domainLabelCenterScratch.multiplyScalar(1 / memberCount)
      this.cameraSpaceScratch.copy(this.domainLabelCenterScratch).applyMatrix4(this.camera.matrixWorldInverse)
      if (this.cameraSpaceScratch.z >= -0.01) {
        runtime.sprite.visible = false
        continue
      }
      const depth = -this.cameraSpaceScratch.z
      const pixelsPerWorld = viewportHeight * this.camera.zoom
        / (2 * depth * Math.tan(MathUtils.degToRad(this.camera.fov * 0.5)))
      runtime.sprite.position.copy(this.domainLabelCenterScratch)
      runtime.sprite.scale.set(
        runtime.pixelWidth / Math.max(1e-6, pixelsPerWorld),
        runtime.pixelHeight / Math.max(1e-6, pixelsPerWorld),
        1,
      )
      runtime.material.opacity = opacity * DOMAIN_LABEL_MAX_OPACITY
      runtime.sprite.visible = true
    }
  }

  setSelectedNodeId(nodeId: string | null) {
    if (nodeId === this.selectedNodeId) return
    this.selectedNodeId = nodeId
    this.requestRender()
  }

  setCardFocusState(cardFocus: CardFocusState) {
    const previousFocus = this.cardFocus
    const releasedFocusedNode = [...previousFocus.primaryNodeIds, ...previousFocus.relatedNodeIds]
      .some((nodeId) => (
        !cardFocus.primaryNodeIds.has(nodeId) && !cardFocus.relatedNodeIds.has(nodeId)
      ))
    this.cardFocus = cardFocus
    if (releasedFocusedNode) this.lodScoreReseedPending = true
    this.selectedNeighborIds.clear()
    cardFocus.relatedNodeIds.forEach((nodeId) => this.selectedNeighborIds.add(nodeId))

    for (const runtime of this.nodes.values()) {
      const previousRole = getCardFocusRole(previousFocus, runtime.id)
      const nextRole = getCardFocusRole(cardFocus, runtime.id)
      if (previousRole === nextRole) continue
      runtime.selected = nextRole === 'primary'
      if (runtime.selected) this.bubbleNodeIds.add(runtime.id)
    }
    this.rebuildFocusedBubbleLayout(performance.now())
    for (const runtime of this.edges.values()) {
      const sourceVisible = this.nodes.get(runtime.sourceId)?.projection.visible === true
      const targetVisible = this.nodes.get(runtime.targetId)?.projection.visible === true
      runtime.targetOpacity = sourceVisible && targetVisible
        ? displayKnowledgeEdgeOpacity(
            runtime.projection.opacity,
            cardFocus,
            runtime.sourceId,
            runtime.targetId,
            this.colorTheme,
          )
        : 0
    }
    this.edgeOpacityAnimationActive = true
    this.edgeOpacitiesDirty = true
    this.refreshEdgePulseState()
    this.requestRender()
  }

  setProjection(projection: KnowledgeSpaceProjection, immediate = false) {
    const firstPresentation = !this.hasPresentedProjection
    const snap = immediate || firstPresentation || this.reducedMotion
    const previousLensId = this.projection.lens.id
    this.projection = projection
    this.bubbleLayoutDirty = true
    this.projectionCenter.copy(toVector3(projection.lens.cameraTarget))
    this.domains.clear()
    for (const field of projection.fields) {
      if (field.domain) this.domains.set(field.domain.id, field.domain)
    }
    this.syncDomainLabels()
    this.nodeHaloStylesDirty = true

    const activeNodeIds = new Set(projection.nodes.map(({ node }) => node.id))
    const visibleNodeIds = new Set(
      projection.nodes.filter((projected) => projected.visible).map(({ node }) => node.id),
    )
    for (const projected of projection.nodes) {
      const runtime = this.nodes.get(projected.node.id) ?? this.createNode(projected)
      if (runtime.projection.node.title !== projected.node.title) {
        runtime.bubbleTexture?.dispose()
        runtime.bubbleTexture = null
        const bubbleMetrics = measureKnowledgeBubble(projected.node.title)
        runtime.bubblePixelWidth = bubbleMetrics.width
        runtime.bubblePixelHeight = bubbleMetrics.height
      }
      runtime.projection = projected
      runtime.targetPosition.copy(toVector3(projected.position))
      runtime.targetOpacity = projected.visible ? projected.opacity : 0
      runtime.targetScale = projected.scale
      runtime.group.visible = true
      if (snap) {
        runtime.currentPosition.copy(runtime.targetPosition)
        runtime.currentOpacity = runtime.targetOpacity
        runtime.currentScale = runtime.targetScale
      }
    }
    for (const runtime of this.nodes.values()) {
      if (runtime.subspaceId) continue
      if (!activeNodeIds.has(runtime.id)) {
        runtime.targetOpacity = 0
        runtime.targetScale = 0.72
      }
    }

    const activeEdgeIds = new Set(projection.edges.map(({ edge }) => edge.id))
    for (const projected of projection.edges) {
      const runtime = this.edges.get(projected.edge.id) ?? this.createEdge(projected)
      runtime.projection = projected
      this.edgeColorsDirty = true
      const endpointsVisible = visibleNodeIds.has(projected.edge.source)
        && visibleNodeIds.has(projected.edge.target)
      runtime.targetOpacity = endpointsVisible
        ? displayKnowledgeEdgeOpacity(
            projected.opacity,
            this.cardFocus,
            projected.edge.source,
            projected.edge.target,
            this.colorTheme,
          )
        : 0
      if (snap) runtime.currentOpacity = runtime.targetOpacity
    }
    for (const runtime of this.edges.values()) {
      if (runtime.subspaceId) continue
      if (!activeEdgeIds.has(runtime.id)) runtime.targetOpacity = 0
    }
    this.edgeOpacityAnimationActive = !snap
    this.edgePositionsDirty = true
    this.edgeOpacitiesDirty = true
    this.refreshEdgePulseState()
    this.updateSubspaceTargets(snap)

    const activeFieldIds = new Set(projection.fields.map(({ id }) => id))
    for (const projected of projection.fields) {
      const existing = this.fields.get(projected.id)
      const runtime = existing && this.fieldLobesMatch(existing, projected)
        ? existing
        : this.replaceField(existing, projected)
      this.updateFieldTargets(runtime, projected, snap)
    }
    for (const runtime of this.fields.values()) {
      if (runtime.subspaceId) continue
      if (!activeFieldIds.has(runtime.id)) {
        runtime.lobes.forEach((lobe) => {
          lobe.targetOpacity = 0
          if (lobe.currentOpacity > SETTLE_EPSILON) runtime.instancesAnimating = true
        })
        if (runtime.instancesAnimating) this.fieldAnimationActive = true
      }
    }

    if (firstPresentation || previousLensId !== projection.lens.id) {
      this.targetCameraPosition.copy(toVector3(projection.lens.cameraPosition))
      this.targetLookAt.copy(toVector3(projection.lens.cameraTarget))
      this.targetCameraDistance = this.targetCameraPosition.distanceTo(this.targetLookAt)
      this.targetGlobalZoom = 1
      this.activeZoomAnchor = null
      this.resetSubspaces(true)
      if (snap) {
        this.camera.position.copy(this.targetCameraPosition)
        this.lookAt.copy(this.targetLookAt)
        this.camera.zoom = this.targetGlobalZoom
        this.camera.updateProjectionMatrix()
        this.camera.lookAt(this.lookAt)
      }
      if (!firstPresentation) this.beginLodViewRefresh(performance.now())
    }

    this.rebuildNodeGlowTargets(snap)
    this.hasPresentedProjection = true
    this.updateSceneObjects()
    this.requestRender()
  }

  resize(width: number, height: number) {
    const safeWidth = Math.max(1, Math.round(width))
    const safeHeight = Math.max(1, Math.round(height))
    this.renderer.setSize(safeWidth, safeHeight, false)
    const fieldPixelRatio = this.renderer.getPixelRatio() * FIELD_RENDER_SCALE
    this.fieldRenderTarget.setSize(
      Math.max(1, Math.round(safeWidth * fieldPixelRatio)),
      Math.max(1, Math.round(safeHeight * fieldPixelRatio)),
    )
    const fieldGlowPixelRatio = this.renderer.getPixelRatio() * FIELD_GLOW_RENDER_SCALE
    const glowWidth = Math.max(1, Math.round(safeWidth * fieldGlowPixelRatio))
    const glowHeight = Math.max(1, Math.round(safeHeight * fieldGlowPixelRatio))
    this.fieldBlurTarget.setSize(glowWidth, glowHeight)
    this.fieldGlowTarget.setSize(glowWidth, glowHeight)
    const nodeHaloPixelRatio = this.renderer.getPixelRatio() * NODE_HALO_RENDER_SCALE
    this.nodeHaloRenderTarget.setSize(
      Math.max(1, Math.round(safeWidth * nodeHaloPixelRatio)),
      Math.max(1, Math.round(safeHeight * nodeHaloPixelRatio)),
    )
    this.fieldViewportHeight = safeHeight
    this.fieldBatchMaterial.uniforms.uViewportHeight.value = this.fieldViewportHeight
    this.nodeHaloBatchMaterial.uniforms.uViewportHeight.value = this.fieldViewportHeight
    this.camera.aspect = safeWidth / safeHeight
    this.camera.updateProjectionMatrix()
    this.bubbleLayoutDirty = true
    this.fieldPassDirty = true
    this.nodeHaloPassDirty = true
    this.requestRender()
  }

  resetCamera(immediate = this.reducedMotion) {
    this.targetCameraPosition.copy(toVector3(this.projection.lens.cameraPosition))
    this.targetLookAt.copy(toVector3(this.projection.lens.cameraTarget))
    this.targetCameraDistance = this.targetCameraPosition.distanceTo(this.targetLookAt)
    this.targetGlobalZoom = 1
    this.activeZoomAnchor = null
    this.bubbleLayoutDirty = true
    this.resetSubspaces(true)
    if (immediate) {
      this.camera.position.copy(this.targetCameraPosition)
      this.lookAt.copy(this.targetLookAt)
      this.camera.zoom = this.targetGlobalZoom
      this.camera.updateProjectionMatrix()
      this.camera.lookAt(this.lookAt)
      this.camera.updateMatrixWorld()
    }
    this.beginLodViewRefresh(performance.now())
    this.requestRender()
  }

  focus() {
    this.renderer.domElement.focus({ preventScroll: true })
  }

  destroy() {
    if (this.disposed) return
    this.disposed = true
    if (this.frameRequest !== null) cancelAnimationFrame(this.frameRequest)
    this.unbindEvents()
    for (const runtime of this.nodes.values()) {
      runtime.cardTexture?.dispose()
      runtime.selectedCardTexture?.dispose()
      runtime.relatedCardTexture?.dispose()
      runtime.titleTexture?.dispose()
      runtime.selectedTitleTexture?.dispose()
      runtime.relatedTitleTexture?.dispose()
      runtime.bubbleTexture?.dispose()
      runtime.glowTexture?.dispose()
    }
    for (const runtime of this.domainLabels.values()) runtime.texture.dispose()
    disposeObject(this.scene)
    disposeObject(this.nodeHaloScene)
    disposeObject(this.fieldScene)
    disposeObject(this.fieldPostScene)
    this.scene.clear()
    this.nodeHaloScene.clear()
    this.fieldScene.clear()
    this.fieldPostScene.clear()
    this.fieldRenderTarget.dispose()
    this.fieldBlurTarget.dispose()
    this.fieldGlowTarget.dispose()
    this.nodeHaloRenderTarget.dispose()
    this.renderer.renderLists.dispose()
    this.renderer.dispose()
    this.renderer.forceContextLoss()
    this.renderer.domElement.remove()
    this.nodes.clear()
    this.edges.clear()
    this.fields.clear()
    this.subspaces.clear()
    this.domainLabels.clear()
  }

  private initializeSubspaces(definitions: readonly ThreeKnowledgeSubspace[], snap: boolean) {
    for (const definition of definitions) {
      if (this.subspaces.has(definition.id)) {
        throw new Error(`三维知识空间包含重复子域：${definition.id}`)
      }
      if (!this.nodes.has(definition.ownerNodeId)) {
        throw new Error(`三维子域 ${definition.id} 缺少父节点：${definition.ownerNodeId}`)
      }
      if (
        !Number.isFinite(definition.scopeEnterZoom)
        || !Number.isFinite(definition.scopeExitZoom)
        || definition.scopeExitZoom <= 0
        || definition.scopeExitZoom >= definition.scopeEnterZoom
        || definition.scopeEnterZoom > MAX_GLOBAL_ZOOM
      ) {
        throw new Error(`三维子域 ${definition.id} 的进入/退出倍率无效。`)
      }
      const fields = definition.fields ?? []
      const runtime: SubspaceRuntime = {
        definition,
        nodeIds: definition.nodes.map(({ node }) => node.id),
        edgeIds: definition.edges.map(({ id }) => id),
        fieldIds: fields.map(({ id }) => id),
        progress: 0,
        armed: false,
        hasRevealed: false,
        revealStartPx: definition.revealStartPx,
        revealEndPx: definition.revealEndPx,
      }
      this.subspaces.set(definition.id, runtime)

      const childFoundationScores = computeFoundationScores({
        nodes: definition.nodes.map(({ node }) => node),
        edges: definition.edges,
      })
      for (const [childIndex, child] of definition.nodes.entries()) {
        if (this.nodes.has(child.node.id)) {
          throw new Error(`三维子域 ${definition.id} 包含重复节点：${child.node.id}`)
        }
        const position = this.subspaceWorldPosition(definition, child.localPosition, true)
        this.createNode({
          node: child.node,
          position: toSpaceVector3(position),
          opacity: 1,
          scale: child.scale,
          emphasis: child.node.importance ?? 0.86,
          foundationScore: childFoundationScores[childIndex] ?? 0,
          knowledgeDepth: child.node.level,
          radius: position.distanceTo(this.projectionCenter),
          visible: true,
          interactive: true,
          visibility: 'matched',
        }, definition.id)
      }

      for (const edge of definition.edges) {
        if (this.edges.has(edge.id)) {
          throw new Error(`三维子域 ${definition.id} 包含重复关系：${edge.id}`)
        }
        this.createEdge({ edge, opacity: 0.86, emphasis: 1 }, definition.id)
      }

      for (const field of fields) {
        if (this.fields.has(field.id)) {
          throw new Error(`三维子域 ${definition.id} 包含重复场域：${field.id}`)
        }
        const childNodeIds = new Set(runtime.nodeIds)
        if (field.lobes.some(({ nodeId }) => !childNodeIds.has(nodeId))) {
          throw new Error(`三维子域 ${definition.id} 的场域 ${field.id} 引用了域外节点。`)
        }
        this.createField(this.projectSubspaceField(definition, field), definition.id)
      }
    }
    this.rebuildNodeGlowTargets(snap)
    this.updateSubspaceTargets(snap)
    this.bubbleLayoutDirty = true
    this.updateSceneObjects()
    this.requestRender()
  }

  private rebuildNodeGlowTargets(snap: boolean) {
    const scopes = new Map<string, NodeRuntime[]>()
    for (const runtime of this.nodes.values()) {
      const scopeId = runtime.subspaceId ?? '__public__'
      scopes.set(scopeId, [...(scopes.get(scopeId) ?? []), runtime])
    }
    for (const runtimes of scopes.values()) {
      const salienceById = buildNodeGlowSalience(runtimes.map((runtime) => ({
        id: runtime.id,
        importance: runtime.projection.node.importance,
        foundationScore: runtime.projection.foundationScore,
      })))
      for (const runtime of runtimes) {
        runtime.baseGlowSalience = salienceById.get(runtime.id) ?? 0.5
        const visual = resolveNodeGlowVisual(
          runtime.baseGlowSalience,
          runtime.projection.emphasis,
        )
        runtime.targetCoreOpacity = visual.coreOpacity
        runtime.targetBloomCoreDensity = visual.bloomCoreDensity
        runtime.targetHaloOpticalDensity = visual.haloOpticalDensity
        runtime.targetHaloRadiusScale = visual.haloRadiusScale
        if (snap) {
          runtime.currentCoreOpacity = runtime.targetCoreOpacity
          runtime.currentBloomCoreDensity = runtime.targetBloomCoreDensity
          runtime.currentHaloOpticalDensity = runtime.targetHaloOpticalDensity
          runtime.currentHaloRadiusScale = runtime.targetHaloRadiusScale
        }
      }
    }
    this.nodeHaloMatricesDirty = true
    this.nodeHaloOpticalDensitiesDirty = true
    this.nodeHaloPassDirty = true
  }

  private subspaceWorldPosition(
    definition: ThreeKnowledgeSubspace,
    localPosition: readonly [number, number, number],
    useTarget: boolean,
  ): Vector3 {
    const owner = this.nodes.get(definition.ownerNodeId)
    if (!owner) return this.projectionCenter.clone()
    const anchor = (useTarget ? owner.targetPosition : owner.currentPosition).clone()
    const radial = anchor.clone().sub(this.projectionCenter)
    if (radial.lengthSq() < 1e-8) radial.set(0, 0, 1)
    else radial.normalize()
    const reference = Math.abs(radial.y) < 0.9
      ? new Vector3(0, 1, 0)
      : new Vector3(1, 0, 0)
    const tangentX = reference.cross(radial).normalize()
    const tangentY = radial.clone().cross(tangentX).normalize()
    return anchor
      .addScaledVector(tangentX, localPosition[0])
      .addScaledVector(tangentY, localPosition[1])
      .addScaledVector(radial, localPosition[2])
  }

  private projectSubspaceField(
    definition: ThreeKnowledgeSubspace,
    field: ThreeKnowledgeSubspaceField,
  ): ProjectedKnowledgeField {
    const lobes = field.lobes.map((lobe) => ({
      nodeId: lobe.nodeId,
      center: toSpaceVector3(this.subspaceWorldPosition(definition, lobe.localPosition, true)),
      radius: lobe.radius,
      opacity: lobe.opacity,
    }))
    const weightSum = lobes.reduce((sum, lobe) => sum + lobe.opacity, 0) || 1
    const center = lobes.reduce((sum, lobe) => sum.addScaledVector(
      toVector3(lobe.center),
      lobe.opacity / weightSum,
    ), new Vector3())
    const radius = lobes.reduce((maximum, lobe) => Math.max(
      maximum,
      toVector3(lobe.center).distanceTo(center) + lobe.radius,
    ), 0)
    return {
      id: field.id,
      kind: field.kind,
      label: field.label,
      color: field.color,
      domain: field.domainId ? this.domains.get(field.domainId) : undefined,
      tag: field.tag,
      center: toSpaceVector3(center),
      radius,
      opacity: field.opacity,
      lobes,
    }
  }

  private updateSubspaceTargets(snap: boolean) {
    for (const subspace of this.subspaces.values()) {
      subspace.definition.nodes.forEach((child) => {
        const runtime = this.nodes.get(child.node.id)
        if (!runtime) return
        const position = this.subspaceWorldPosition(
          subspace.definition,
          child.localPosition,
          true,
        )
        runtime.targetPosition.copy(position)
        runtime.targetOpacity = 1
        runtime.targetScale = child.scale
        runtime.projection = {
          ...runtime.projection,
          position: toSpaceVector3(position),
          radius: position.distanceTo(this.projectionCenter),
        }
        if (snap) {
          runtime.currentPosition.copy(runtime.targetPosition)
          runtime.currentOpacity = runtime.targetOpacity
          runtime.currentScale = runtime.targetScale
        }
      })
      const fields = subspace.definition.fields ?? []
      fields.forEach((field) => {
        const runtime = this.fields.get(field.id)
        if (!runtime) return
        this.updateFieldTargets(
          runtime,
          this.projectSubspaceField(subspace.definition, field),
          snap,
        )
      })
    }
  }

  private resetSubspaces(notify: boolean) {
    for (const subspace of this.subspaces.values()) {
      subspace.progress = 0
      subspace.armed = false
      subspace.hasRevealed = false
      subspace.revealStartPx = subspace.definition.revealStartPx
      subspace.revealEndPx = subspace.definition.revealEndPx
    }
    this.edgeOpacitiesDirty = true
    this.fieldOpacitiesDirty = true
    this.fieldPassDirty = true
    if (this.activeScopeId !== null) {
      this.activeScopeId = null
      if (notify) this.callbacks.onScopeChange?.(null)
    }
  }

  private maximumSubspaceProgress(): number {
    let maximumProgress = 0
    for (const subspace of this.subspaces.values()) {
      maximumProgress = Math.max(maximumProgress, subspace.progress)
    }
    return maximumProgress
  }

  private publicScopeWeight(): number {
    return parentScopeWeight(this.maximumSubspaceProgress())
  }

  private publicFieldScopeWeight(): number {
    return parentFieldScopeWeight(this.maximumSubspaceProgress())
  }

  private scopeWeightForNode(runtime: NodeRuntime): number {
    return runtime.subspaceId
      ? this.subspaces.get(runtime.subspaceId)?.progress ?? 0
      : this.publicScopeWeight()
  }

  private scopeWeightForEdge(runtime: EdgeRuntime): number {
    return runtime.subspaceId
      ? this.subspaces.get(runtime.subspaceId)?.progress ?? 0
      : this.publicScopeWeight()
  }

  private scopeWeightForField(runtime: FieldRuntime): number {
    return runtime.subspaceId
      ? childFieldScopeWeight(this.subspaces.get(runtime.subspaceId)?.progress ?? 0)
      : this.publicFieldScopeWeight()
  }

  private rotationPivotForActiveScope(): Vector3 | null {
    if (!this.activeScopeId) {
      const visibleNodes = this.projection.nodes.filter((node) => node.visible)
      if (visibleNodes.length === 0) return null
      if (visibleNodes.length === this.projection.nodes.length) return this.projectionCenter.clone()
      const center = new Vector3()
      for (const { node } of visibleNodes) {
        center.add(this.nodes.get(node.id)!.currentPosition)
      }
      return center.divideScalar(visibleNodes.length)
    }
    const subspace = this.subspaces.get(this.activeScopeId)
    if (!subspace) return this.projectionCenter.clone()
    const positions = subspace.nodeIds.flatMap((nodeId) => {
      const runtime = this.nodes.get(nodeId)
      return runtime ? [toSpaceVector3(runtime.currentPosition)] : []
    })
    return toVector3(subspaceCardCenter(
      positions,
      toSpaceVector3(this.projectionCenter),
    ))
  }

  private armSubspace(nodeId: string | null): SubspaceRuntime | null {
    const matched = [...this.subspaces.values()].find(
      ({ definition }) => definition.ownerNodeId === nodeId,
    )
    const transitionInProgress = [...this.subspaces.values()].some(
      (subspace) => subspace !== matched && subspace.progress > HIDDEN_OPACITY_EPSILON,
    )
    for (const subspace of this.subspaces.values()) {
      if (subspace === matched && !transitionInProgress) {
        if (!subspace.armed) {
          const owner = this.nodes.get(subspace.definition.ownerNodeId)
          if (!owner || owner.sprite.userData.interactive !== true) continue
          const range = createSubspaceRevealRange(
            this.projectedCardHeight(owner),
            subspace.definition.revealStartPx,
            subspace.definition.revealEndPx,
          )
          subspace.revealStartPx = range.startPx
          subspace.revealEndPx = range.endPx
          subspace.armed = true
          subspace.hasRevealed = false
        }
      } else if (!subspace.hasRevealed && subspace.progress <= HIDDEN_OPACITY_EPSILON) {
        subspace.armed = false
      }
    }
    return matched?.armed ? matched : null
  }

  private armSubspaceForWheel(nodeId: string | null, zoomingIn: boolean) {
    if (zoomingIn) this.armSubspace(nodeId)
  }

  private updateSubspaceProgress(): boolean {
    let moving = false
    for (const subspace of this.subspaces.values()) {
      const previousProgress = subspace.progress
      const owner = this.nodes.get(subspace.definition.ownerNodeId)
      const rawProgress = subspace.armed && owner
        ? subspaceRevealProgress(
          this.projectedCardHeight(owner),
          subspace.revealStartPx,
          subspace.revealEndPx,
        )
        : 0
      const isActiveScope = this.activeScopeId === subspace.definition.id
      const exitThresholdReached = isActiveScope && shouldExitSubspaceScope(
        this.camera.zoom,
        subspace.definition.scopeExitZoom,
      )
      subspace.progress = isActiveScope && !exitThresholdReached
        ? Math.max(previousProgress, rawProgress)
        : rawProgress
      if (subspace.progress > HIDDEN_OPACITY_EPSILON) subspace.hasRevealed = true
      if (
        subspace.hasRevealed
        && subspace.progress <= HIDDEN_OPACITY_EPSILON
        && this.targetGlobalZoom <= this.camera.zoom
      ) {
        subspace.armed = false
        subspace.hasRevealed = false
      }
      if (Math.abs(previousProgress - subspace.progress) > 1e-5) moving = true

      if (
        this.activeScopeId === null
        && shouldEnterSubspaceScope(
          this.camera.zoom,
          subspace.progress,
          subspace.definition.scopeEnterZoom,
        )
      ) {
        this.activeScopeId = subspace.definition.id
        this.callbacks.onScopeChange?.(this.activeScopeId)
      } else if (exitThresholdReached) {
        this.activeScopeId = null
        this.callbacks.onScopeChange?.(null)
      }
    }
    return moving
  }

  private createNode(projected: ProjectedKnowledgeNode, subspaceId: string | null = null): NodeRuntime {
    const domain = this.domains.get(projected.node.primaryDomain)
    if (!domain) throw new Error(`三维知识空间缺少领域定义：${projected.node.primaryDomain}`)
    const selected = getCardFocusRole(this.cardFocus, projected.node.id) === 'primary'
    const initialLod: NodeLod = activeBubbleNodeLod(selected, false)
    const createdAt = performance.now()
    const initialGlowVisual = resolveNodeGlowVisual(0.5, projected.emphasis)
    const bubbleMetrics = measureKnowledgeBubble(projected.node.title)
    const cardTexture: Texture | null = null
    const selectedCardTexture: Texture | null = null
    const glowTexture = createNodeGlowTexture(domain.fieldColor)
    const bubbleTexture = selected
      ? createKnowledgeBubbleTexture(
          projected.node,
          domain,
          this.colorTheme,
          bubbleMetrics,
        )
      : null
    const material = new SpriteMaterial({
      map: bubbleTexture ?? glowTexture,
      transparent: true,
      depthWrite: false,
      depthTest: true,
      opacity: projected.opacity,
      toneMapped: false,
    })
    const sprite = new Sprite(material)
    const starMaterial = new SpriteMaterial({
      map: glowTexture,
      transparent: true,
      depthWrite: false,
      depthTest: true,
      opacity: projected.opacity * initialGlowVisual.coreOpacity,
      toneMapped: false,
      blending: this.colorTheme === 'dark' ? AdditiveBlending : NormalBlending,
    })
    const starSprite = new Sprite(starMaterial)
    const initialStarScale = selected ? SELECTED_NODE_STAR_SCALE : 1
    starSprite.scale.set(
      STAR_CORE_SIZE * initialStarScale,
      STAR_CORE_SIZE * initialStarScale,
      1,
    )
    starSprite.renderOrder = 2
    starSprite.visible = selected
    starSprite.raycast = () => undefined
    const initialWidth = STAR_CORE_SIZE
    const initialHeight = STAR_CORE_SIZE
    sprite.scale.set(initialWidth, initialHeight, 1)
    sprite.renderOrder = 3
    sprite.userData.nodeId = projected.node.id
    const group = new Group()
    group.add(starSprite, sprite)
    group.position.copy(toVector3(projected.position))
    group.scale.setScalar(projected.scale)
    this.nodeLayer.add(group)
    const runtime: NodeRuntime = {
      id: projected.node.id,
      subspaceId,
      group,
      sprite,
      material,
      starSprite,
      starMaterial,
      cardTexture,
      selectedCardTexture,
      relatedCardTexture: null,
      titleTexture: null,
      selectedTitleTexture: null,
      relatedTitleTexture: null,
      bubbleTexture,
      bubblePixelWidth: bubbleMetrics.width,
      bubblePixelHeight: bubbleMetrics.height,
      glowTexture,
      projection: projected,
      currentPosition: toVector3(projected.position),
      targetPosition: toVector3(projected.position),
      currentOpacity: projected.visible ? projected.opacity : 0,
      targetOpacity: projected.visible ? projected.opacity : 0,
      currentScale: projected.scale,
      targetScale: projected.scale,
      selected,
      lod: initialLod,
      displayOpacity: projected.opacity,
      currentVisualWidth: initialWidth,
      currentVisualHeight: initialHeight,
      targetVisualWidth: initialWidth,
      targetVisualHeight: initialHeight,
      currentHoverScale: 1,
      stableLodScore: stableLodSemanticPriority(
        projected.emphasis,
        projected.foundationScore,
      ),
      stableLodChangedAt: createdAt,
      stableLodCandidate: null,
      stableLodCandidateSince: createdAt,
      labelHiddenSince: createdAt,
      hemisphereEligible: true,
      haloInstanceIndex: 0,
      baseGlowSalience: 0.5,
      currentCoreOpacity: initialGlowVisual.coreOpacity,
      targetCoreOpacity: initialGlowVisual.coreOpacity,
      currentBloomCoreDensity: initialGlowVisual.bloomCoreDensity,
      targetBloomCoreDensity: initialGlowVisual.bloomCoreDensity,
      currentHaloOpticalDensity: initialGlowVisual.haloOpticalDensity,
      targetHaloOpticalDensity: initialGlowVisual.haloOpticalDensity,
      currentHaloRadiusScale: initialGlowVisual.haloRadiusScale,
      targetHaloRadiusScale: initialGlowVisual.haloRadiusScale,
      haloPresentationWeight: 0,
    }
    if (selected) {
      this.updateBubbleWorldSize(runtime)
      runtime.currentVisualWidth = runtime.targetVisualWidth
      runtime.currentVisualHeight = runtime.targetVisualHeight
      runtime.sprite.scale.set(
        runtime.currentVisualWidth,
        runtime.currentVisualHeight,
        1,
      )
    }
    this.nodes.set(runtime.id, runtime)
    this.nodeHaloBatchStructureDirty = true
    return runtime
  }

  private createEdge(projected: ProjectedKnowledgeEdge, subspaceId: string | null = null): EdgeRuntime {
    const displayOpacity = displayKnowledgeEdgeOpacity(
      projected.opacity,
      this.cardFocus,
      projected.edge.source,
      projected.edge.target,
      this.colorTheme,
    )
    const runtime: EdgeRuntime = {
      id: projected.edge.id,
      subspaceId,
      sourceId: projected.edge.source,
      targetId: projected.edge.target,
      vertexOffset: 0,
      projection: projected,
      currentOpacity: displayOpacity,
      targetOpacity: displayOpacity,
    }
    this.edges.set(runtime.id, runtime)
    this.edgeBatchStructureDirty = true
    return runtime
  }

  private refreshEdgePulseState() {
    this.edgePulseActive = !this.reducedMotion && [...this.edges.values()].some((runtime) => (
      runtime.targetOpacity > 0.004
      && focusedKnowledgeEdgePulse(this.cardFocus, runtime.sourceId, runtime.targetId) > 0
    ))
    this.edgePulsesDirty = true
  }

  private ensureEdgeBatch() {
    if (!this.edgeBatchStructureDirty) return
    if (this.edgeBatch) {
      this.edgeLayer.remove(this.edgeBatch)
      this.edgeBatch.geometry.dispose()
    }

    const vertexCount = this.edges.size * 2
    const geometry = new BufferGeometry()
    this.edgePositionAttribute = new Float32BufferAttribute(vertexCount * 3, 3)
    this.edgeColorAttribute = new Float32BufferAttribute(vertexCount * 3, 3)
    this.edgeOpacityAttribute = new Float32BufferAttribute(vertexCount, 1)
    this.edgeProgressAttribute = new Float32BufferAttribute(vertexCount, 1)
    this.edgePulseAttribute = new Float32BufferAttribute(vertexCount, 1)
    this.edgePositionAttribute.setUsage(DynamicDrawUsage)
    this.edgeColorAttribute.setUsage(DynamicDrawUsage)
    this.edgeOpacityAttribute.setUsage(DynamicDrawUsage)
    this.edgePulseAttribute.setUsage(DynamicDrawUsage)
    geometry.setAttribute('position', this.edgePositionAttribute)
    geometry.setAttribute('edgeColor', this.edgeColorAttribute)
    geometry.setAttribute('edgeOpacity', this.edgeOpacityAttribute)
    geometry.setAttribute('edgeProgress', this.edgeProgressAttribute)
    geometry.setAttribute('edgePulse', this.edgePulseAttribute)

    let vertexOffset = 0
    for (const runtime of this.edges.values()) {
      runtime.vertexOffset = vertexOffset
      this.edgeProgressAttribute.setX(vertexOffset, 0)
      this.edgeProgressAttribute.setX(vertexOffset + 1, 1)
      vertexOffset += 2
    }
    this.edgeProgressAttribute.needsUpdate = true

    this.edgeBatch = new LineSegments(geometry, this.edgeBatchMaterial)
    this.edgeBatch.renderOrder = 1
    this.edgeBatch.frustumCulled = false
    this.edgeBatch.raycast = () => undefined
    this.edgeLayer.add(this.edgeBatch)
    this.edgeBatchStructureDirty = false
    this.edgePositionsDirty = true
    this.edgeColorsDirty = true
    this.edgeOpacitiesDirty = true
    this.refreshEdgePulseState()
  }

  private flushEdgeBatch() {
    this.ensureEdgeBatch()
    if (
      !this.edgeBatch
      || !this.edgePositionAttribute
      || !this.edgeColorAttribute
      || !this.edgeOpacityAttribute
      || !this.edgePulseAttribute
    ) return

    if (this.edgePositionsDirty) {
      for (const runtime of this.edges.values()) {
        const source = this.nodes.get(runtime.sourceId)?.currentPosition
        const target = this.nodes.get(runtime.targetId)?.currentPosition
        const offset = runtime.vertexOffset
        this.edgePositionAttribute.setXYZ(offset, source?.x ?? 0, source?.y ?? 0, source?.z ?? 0)
        this.edgePositionAttribute.setXYZ(offset + 1, target?.x ?? 0, target?.y ?? 0, target?.z ?? 0)
      }
      this.edgePositionAttribute.needsUpdate = true
      this.edgePositionsDirty = false
    }

    if (this.edgeColorsDirty) {
      for (const runtime of this.edges.values()) {
        this.edgeColorScratch.set(knowledgeEdgeColor(runtime.projection.edge.type, this.colorTheme))
        const offset = runtime.vertexOffset
        this.edgeColorAttribute.setXYZ(
          offset,
          this.edgeColorScratch.r,
          this.edgeColorScratch.g,
          this.edgeColorScratch.b,
        )
        this.edgeColorAttribute.setXYZ(
          offset + 1,
          this.edgeColorScratch.r,
          this.edgeColorScratch.g,
          this.edgeColorScratch.b,
        )
      }
      this.edgeColorAttribute.needsUpdate = true
      this.edgeColorsDirty = false
    }

    if (this.edgeOpacitiesDirty) {
      let visible = false
      for (const runtime of this.edges.values()) {
        const opacity = runtime.currentOpacity * this.scopeWeightForEdge(runtime)
        const offset = runtime.vertexOffset
        this.edgeOpacityAttribute.setX(offset, opacity)
        this.edgeOpacityAttribute.setX(offset + 1, opacity)
        if (opacity > 0.004) visible = true
      }
      this.edgeOpacityAttribute.needsUpdate = true
      this.edgeBatch.visible = visible
      this.edgeOpacitiesDirty = false
    }

    if (this.edgePulsesDirty) {
      for (const runtime of this.edges.values()) {
        const pulse = this.reducedMotion
          ? 0
          : focusedKnowledgeEdgePulse(this.cardFocus, runtime.sourceId, runtime.targetId)
        const offset = runtime.vertexOffset
        this.edgePulseAttribute.setX(offset, pulse)
        this.edgePulseAttribute.setX(offset + 1, pulse)
      }
      this.edgePulseAttribute.needsUpdate = true
      this.edgePulsesDirty = false
    }
  }

  private ensureNodeHaloBatch() {
    if (!this.nodeHaloBatchStructureDirty) return
    if (this.nodeHaloBatch) {
      this.nodeHaloScene.remove(this.nodeHaloBatch)
      this.nodeHaloBatch.geometry.dispose()
    }

    const instanceCount = this.nodes.size
    if (instanceCount === 0) {
      this.nodeHaloBatch = null
      this.nodeHaloOpticalDensityAttribute = null
      this.nodeHaloColorAttribute = null
      this.hasVisibleNodeHaloBatch = false
      this.nodeHaloBatchStructureDirty = false
      return
    }

    const geometry = new PlaneGeometry(2, 2, 1, 1)
    this.nodeHaloOpticalDensityAttribute = new InstancedBufferAttribute(
      new Float32Array(instanceCount * 2),
      2,
    )
    this.nodeHaloColorAttribute = new InstancedBufferAttribute(
      new Float32Array(instanceCount * 3),
      3,
    )
    this.nodeHaloOpticalDensityAttribute.setUsage(DynamicDrawUsage)
    this.nodeHaloColorAttribute.setUsage(DynamicDrawUsage)
    geometry.setAttribute('instanceOpticalDensity', this.nodeHaloOpticalDensityAttribute)
    geometry.setAttribute('instanceColor', this.nodeHaloColorAttribute)

    let instanceIndex = 0
    for (const runtime of this.nodes.values()) {
      runtime.haloInstanceIndex = instanceIndex
      instanceIndex += 1
    }

    this.nodeHaloBatch = new InstancedMesh(
      geometry,
      this.nodeHaloBatchMaterial,
      instanceCount,
    )
    this.nodeHaloBatch.instanceMatrix.setUsage(DynamicDrawUsage)
    this.nodeHaloBatch.renderOrder = 0
    this.nodeHaloBatch.frustumCulled = false
    this.nodeHaloBatch.raycast = () => undefined
    this.nodeHaloScene.add(this.nodeHaloBatch)
    this.nodeHaloBatchStructureDirty = false
    this.nodeHaloMatricesDirty = true
    this.nodeHaloStylesDirty = true
    this.nodeHaloOpticalDensitiesDirty = true
  }

  private flushNodeHaloBatch() {
    this.ensureNodeHaloBatch()
    if (
      !this.nodeHaloBatch
      || !this.nodeHaloOpticalDensityAttribute
      || !this.nodeHaloColorAttribute
    ) return

    if (this.nodeHaloMatricesDirty) {
      for (const runtime of this.nodes.values()) {
        const radius = GLOW_SIZE * 0.5
          * runtime.currentScale
          * runtime.currentHaloRadiusScale
        this.nodeHaloScaleScratch.setScalar(Math.max(0.001, radius))
        this.nodeHaloMatrixScratch.compose(
          runtime.currentPosition,
          this.nodeHaloRotationScratch,
          this.nodeHaloScaleScratch,
        )
        this.nodeHaloBatch.setMatrixAt(
          runtime.haloInstanceIndex,
          this.nodeHaloMatrixScratch,
        )
      }
      this.nodeHaloBatch.instanceMatrix.needsUpdate = true
      this.nodeHaloMatricesDirty = false
      this.nodeHaloPassDirty = true
    }

    if (this.nodeHaloStylesDirty) {
      for (const runtime of this.nodes.values()) {
        const domain = this.domains.get(runtime.projection.node.primaryDomain)
        this.nodeHaloColorScratch.set(domain?.fieldColor ?? '#b9ae9a')
        const normalizedColor = normalizeNodeHaloLinearRgb(this.nodeHaloColorScratch)
        this.nodeHaloColorAttribute.setXYZ(
          runtime.haloInstanceIndex,
          normalizedColor.r,
          normalizedColor.g,
          normalizedColor.b,
        )
      }
      this.nodeHaloColorAttribute.needsUpdate = true
      this.nodeHaloStylesDirty = false
      this.nodeHaloPassDirty = true
    }

    if (this.nodeHaloOpticalDensitiesDirty) {
      let visible = false
      for (const runtime of this.nodes.values()) {
        const weight = runtime.haloPresentationWeight
        const coreDensity = runtime.currentBloomCoreDensity * weight
        const haloDensity = runtime.currentHaloOpticalDensity * weight
        this.nodeHaloOpticalDensityAttribute.setXY(
          runtime.haloInstanceIndex,
          coreDensity,
          haloDensity,
        )
        if (coreDensity + haloDensity > NODE_HALO_VISIBLE_EPSILON) visible = true
      }
      this.nodeHaloOpticalDensityAttribute.needsUpdate = true
      this.nodeHaloBatch.visible = visible
      this.hasVisibleNodeHaloBatch = visible
      this.nodeHaloOpticalDensitiesDirty = false
      this.nodeHaloPassDirty = true
    }
  }

  private createField(
    projected: ProjectedKnowledgeField,
    subspaceId: string | null = null,
  ): FieldRuntime {
    const baseOpacity = this.fieldsVisible ? displayFieldOpacity(projected, subspaceId !== null) : 0
    const lobes = projected.lobes.map((lobe) => ({
      nodeId: lobe.nodeId,
      currentPosition: toVector3(lobe.center),
      targetPosition: toVector3(lobe.center),
      currentRadius: lobe.radius,
      targetRadius: lobe.radius,
      currentOpacity: lobe.opacity,
      targetOpacity: lobe.opacity,
    }))
    const runtime: FieldRuntime = {
      id: projected.id,
      subspaceId,
      instanceOffset: 0,
      projection: projected,
      lobes,
      currentOpacity: baseOpacity,
      targetOpacity: baseOpacity,
      hasVisibleLobes: false,
      instancesAnimating: false,
    }
    this.fields.set(runtime.id, runtime)
    this.fieldBatchStructureDirty = true
    return runtime
  }

  private fieldLobesMatch(runtime: FieldRuntime, projected: ProjectedKnowledgeField): boolean {
    return runtime.lobes.length === projected.lobes.length
      && runtime.lobes.every((lobe, index) => lobe.nodeId === projected.lobes[index]?.nodeId)
  }

  private replaceField(
    existing: FieldRuntime | undefined,
    projected: ProjectedKnowledgeField,
  ): FieldRuntime {
    if (existing) {
      this.fields.delete(existing.id)
      this.fieldBatchStructureDirty = true
    }
    return this.createField(projected)
  }

  private updateFieldTargets(
    runtime: FieldRuntime,
    projected: ProjectedKnowledgeField,
    snap: boolean,
  ) {
    runtime.projection = projected
    this.fieldStylesDirty = true
    runtime.targetOpacity = this.fieldsVisible
      ? displayFieldOpacity(projected, runtime.subspaceId !== null)
      : 0
    let instancesAnimating = false
    projected.lobes.forEach((lobe, index) => {
      const state = runtime.lobes[index]
      state.targetPosition.copy(toVector3(lobe.center))
      state.targetRadius = lobe.radius
      state.targetOpacity = lobe.opacity
      if (snap) {
        state.currentPosition.copy(state.targetPosition)
        state.currentRadius = state.targetRadius
        state.currentOpacity = state.targetOpacity
      } else if (
        state.currentPosition.distanceToSquared(state.targetPosition) > SETTLE_EPSILON
        || Math.abs(state.currentRadius - state.targetRadius) > SETTLE_EPSILON
        || Math.abs(state.currentOpacity - state.targetOpacity) > SETTLE_EPSILON
      ) {
        instancesAnimating = true
      }
    })
    runtime.instancesAnimating = instancesAnimating
    this.fieldAnimationActive = this.fieldAnimationActive
      || instancesAnimating
      || Math.abs(runtime.currentOpacity - runtime.targetOpacity) > SETTLE_EPSILON
    this.fieldMatricesDirty = true
    this.fieldOpacitiesDirty = true
    this.fieldPassDirty = true
    if (snap) {
      runtime.currentOpacity = runtime.targetOpacity
    }
  }

  private ensureFieldBatch() {
    if (!this.fieldBatchStructureDirty) return
    if (this.fieldBatch) {
      this.fieldLayer.remove(this.fieldBatch)
      this.fieldBatch.geometry.dispose()
    }

    const instanceCount = [...this.fields.values()].reduce(
      (count, runtime) => count + runtime.lobes.length,
      0,
    )
    if (instanceCount === 0) {
      this.fieldBatch = null
      this.fieldOpacityAttribute = null
      this.fieldColorAttribute = null
      this.fieldNearFadeAttribute = null
      this.hasVisibleFieldBatch = false
      this.fieldBatchStructureDirty = false
      return
    }

    const geometry = new PlaneGeometry(2, 2, 1, 1)
    this.fieldOpacityAttribute = new InstancedBufferAttribute(
      new Float32Array(instanceCount),
      1,
    )
    this.fieldColorAttribute = new InstancedBufferAttribute(
      new Float32Array(instanceCount * 3),
      3,
    )
    this.fieldNearFadeAttribute = new InstancedBufferAttribute(
      new Float32Array(instanceCount * 2),
      2,
    )
    this.fieldOpacityAttribute.setUsage(DynamicDrawUsage)
    this.fieldColorAttribute.setUsage(DynamicDrawUsage)
    this.fieldNearFadeAttribute.setUsage(DynamicDrawUsage)
    geometry.setAttribute('instanceOpacity', this.fieldOpacityAttribute)
    geometry.setAttribute('instanceColor', this.fieldColorAttribute)
    geometry.setAttribute('instanceNearFade', this.fieldNearFadeAttribute)

    let instanceOffset = 0
    for (const runtime of this.fields.values()) {
      runtime.instanceOffset = instanceOffset
      instanceOffset += runtime.lobes.length
    }

    this.fieldBatch = new InstancedMesh(geometry, this.fieldBatchMaterial, instanceCount)
    this.fieldBatch.instanceMatrix.setUsage(DynamicDrawUsage)
    this.fieldBatch.renderOrder = 0
    this.fieldBatch.frustumCulled = false
    this.fieldBatch.raycast = () => undefined
    this.fieldLayer.add(this.fieldBatch)
    this.fieldBatchStructureDirty = false
    this.fieldMatricesDirty = true
    this.fieldStylesDirty = true
    this.fieldOpacitiesDirty = true
  }

  private flushFieldBatch() {
    this.ensureFieldBatch()
    if (
      !this.fieldBatch
      || !this.fieldOpacityAttribute
      || !this.fieldColorAttribute
      || !this.fieldNearFadeAttribute
    ) return

    if (this.fieldMatricesDirty) {
      for (const runtime of this.fields.values()) {
        runtime.lobes.forEach((lobe, index) => {
          this.fieldScaleScratch.setScalar(Math.max(0.001, lobe.currentRadius))
          this.fieldMatrixScratch.compose(
            lobe.currentPosition,
            this.fieldRotationScratch,
            this.fieldScaleScratch,
          )
          this.fieldBatch?.setMatrixAt(runtime.instanceOffset + index, this.fieldMatrixScratch)
        })
      }
      this.fieldBatch.instanceMatrix.needsUpdate = true
      this.fieldMatricesDirty = false
      this.fieldPassDirty = true
    }

    if (this.fieldStylesDirty) {
      for (const runtime of this.fields.values()) {
        const color = displayFieldColor(runtime.projection, this.colorTheme)
        const nearFade = fieldNearFadeRange(runtime.projection, runtime.subspaceId !== null)
        runtime.lobes.forEach((_, index) => {
          const instanceIndex = runtime.instanceOffset + index
          this.fieldColorAttribute?.setXYZ(instanceIndex, color.r, color.g, color.b)
          this.fieldNearFadeAttribute?.setXY(instanceIndex, nearFade[0], nearFade[1])
        })
      }
      this.fieldColorAttribute.needsUpdate = true
      this.fieldNearFadeAttribute.needsUpdate = true
      this.fieldStylesDirty = false
      this.fieldPassDirty = true
    }

    if (this.fieldOpacitiesDirty) {
      let visible = false
      for (const runtime of this.fields.values()) {
        const fieldOpacity = runtime.currentOpacity * this.scopeWeightForField(runtime)
        let fieldHasVisibleLobes = false
        runtime.lobes.forEach((lobe, index) => {
          const opacity = fieldOpacity * lobe.currentOpacity
          this.fieldOpacityAttribute?.setX(runtime.instanceOffset + index, opacity)
          if (opacity > 0.002) {
            visible = true
            fieldHasVisibleLobes = true
          }
        })
        runtime.hasVisibleLobes = fieldHasVisibleLobes
      }
      this.fieldOpacityAttribute.needsUpdate = true
      this.fieldBatch.visible = visible
      this.hasVisibleFieldBatch = visible
      this.fieldOpacitiesDirty = false
      this.fieldPassDirty = true
    }
  }

  private fieldCameraChanged(): boolean {
    this.camera.updateMatrixWorld()
    this.fieldViewProjection.multiplyMatrices(
      this.camera.projectionMatrix,
      this.camera.matrixWorldInverse,
    )
    if (this.fieldViewProjection.equals(this.lastFieldViewProjection)) return false
    this.lastFieldViewProjection.copy(this.fieldViewProjection)
    return true
  }

  private textureForLod(runtime: NodeRuntime, lod: NodeLod, selected: boolean): Texture {
    const domain = this.domains.get(runtime.projection.node.primaryDomain)
    if (!domain) throw new Error(`三维知识空间缺少领域定义：${runtime.projection.node.primaryDomain}`)
    const related = !selected && (
      this.selectedNeighborIds.has(runtime.id)
      || runtime.id === this.hoveredNodeId
    )
    if (lod === 'glow') {
      runtime.glowTexture ??= createNodeGlowTexture(domain.fieldColor)
      return runtime.glowTexture
    }
    if (lod === 'title') {
      if (selected) {
        runtime.selectedTitleTexture ??= createKnowledgeTitleTexture(
          runtime.projection.node,
          domain,
          true,
          this.colorTheme,
        )
        return runtime.selectedTitleTexture
      }
      if (related) {
        runtime.relatedTitleTexture ??= createKnowledgeTitleTexture(
          runtime.projection.node,
          domain,
          false,
          this.colorTheme,
          true,
        )
        return runtime.relatedTitleTexture
      }
      runtime.titleTexture ??= createKnowledgeTitleTexture(
        runtime.projection.node,
        domain,
        false,
        this.colorTheme,
      )
      return runtime.titleTexture
    }
    if (selected) {
      runtime.selectedCardTexture ??= createKnowledgeCardTexture(
        runtime.projection.node,
        domain,
        true,
        this.colorTheme,
        false,
        runtime.id === LINEAR_ALGEBRA_NODE_ID ? this.linearAlgebraIconProgress : 0,
      )
      return runtime.selectedCardTexture
    }
    if (related) {
      runtime.relatedCardTexture ??= createKnowledgeCardTexture(
        runtime.projection.node,
        domain,
        false,
        this.colorTheme,
        true,
        runtime.id === LINEAR_ALGEBRA_NODE_ID ? this.linearAlgebraIconProgress : 0,
      )
      return runtime.relatedCardTexture
    }
    runtime.cardTexture ??= createKnowledgeCardTexture(
      runtime.projection.node,
      domain,
      false,
      this.colorTheme,
      false,
      runtime.id === LINEAR_ALGEBRA_NODE_ID ? this.linearAlgebraIconProgress : 0,
    )
    return runtime.cardTexture
  }

  private bubbleTextureForNode(runtime: NodeRuntime): Texture {
    const domain = this.domains.get(runtime.projection.node.primaryDomain)
    if (!domain) throw new Error(`三维知识空间缺少领域定义：${runtime.projection.node.primaryDomain}`)
    runtime.bubbleTexture ??= createKnowledgeBubbleTexture(
      runtime.projection.node,
      domain,
      this.colorTheme,
      {
        width: runtime.bubblePixelWidth,
        height: runtime.bubblePixelHeight,
      },
    )
    return runtime.bubbleTexture
  }

  private textureForBubblePresentation(runtime: NodeRuntime, lod: NodeLod): Texture {
    return lod === 'title'
      ? this.bubbleTextureForNode(runtime)
      : this.textureForLod(runtime, lod, runtime.selected)
  }

  private updateBubbleWorldSize(runtime: NodeRuntime) {
    this.updateFixedPixelWorldSize(
      runtime,
      runtime.bubblePixelWidth,
      runtime.bubblePixelHeight,
    )
  }

  private updateCardWorldSize(
    runtime: NodeRuntime,
    preserveCurrentPixelSize = false,
  ) {
    const previousTargetWidth = runtime.targetVisualWidth
    const previousTargetHeight = runtime.targetVisualHeight
    this.updateFixedPixelWorldSize(
      runtime,
      KNOWLEDGE_CARD_PIXEL_WIDTH,
      KNOWLEDGE_CARD_PIXEL_HEIGHT,
    )
    if (!preserveCurrentPixelSize) return
    if (previousTargetWidth > 1e-6) {
      runtime.currentVisualWidth *= runtime.targetVisualWidth / previousTargetWidth
    }
    if (previousTargetHeight > 1e-6) {
      runtime.currentVisualHeight *= runtime.targetVisualHeight / previousTargetHeight
    }
  }

  private updateFixedPixelWorldSize(
    runtime: NodeRuntime,
    pixelWidth: number,
    pixelHeight: number,
  ) {
    const depth = this.cameraSpaceDepth(runtime.currentPosition)
    const viewportHeight = Math.max(1, this.renderer.domElement.clientHeight)
    const pixelsPerWorld = viewportHeight * this.camera.zoom
      / (2 * depth * Math.tan(MathUtils.degToRad(this.camera.fov * 0.5)))
    const localPixelsPerWorld = Math.max(1e-6, runtime.currentScale * pixelsPerWorld)
    runtime.targetVisualWidth = pixelWidth / localPixelsPerWorld
    runtime.targetVisualHeight = pixelHeight / localPixelsPerWorld
  }

  private updateBubbleSpriteOffset(runtime: NodeRuntime) {
    if (runtime.lod === 'glow') {
      runtime.sprite.position.set(0, 0, 0)
      return
    }
    const depth = this.cameraSpaceDepth(runtime.currentPosition)
    const viewportHeight = Math.max(1, this.renderer.domElement.clientHeight)
    const pixelsPerWorld = viewportHeight * this.camera.zoom
      / (2 * depth * Math.tan(MathUtils.degToRad(this.camera.fov * 0.5)))
    const pixelHeight = runtime.currentVisualHeight
      * runtime.currentScale
      * pixelsPerWorld
      * runtime.currentHoverScale
    const centerOffsetPx = knowledgeLabelCenterOffsetPx(pixelHeight)
    const worldUnitsPerPixel = 1 / Math.max(1e-6, pixelsPerWorld)
    this.bubbleCameraUpScratch.setFromMatrixColumn(this.camera.matrixWorld, 1).normalize()
    runtime.sprite.position.copy(this.bubbleCameraUpScratch).multiplyScalar(
      centerOffsetPx
        * worldUnitsPerPixel
        / Math.max(1e-6, runtime.currentScale),
    )
  }

  private setBubbleNodeLod(runtime: NodeRuntime, lod: NodeLod, time: number): boolean {
    const previousLod = runtime.lod
    const changed = previousLod !== lod
    runtime.lod = lod
    const texture = this.textureForBubblePresentation(runtime, lod)
    if (runtime.material.map !== texture) {
      runtime.material.map = texture
      runtime.material.needsUpdate = true
    }
    if (lod === 'glow') {
      runtime.targetVisualWidth = STAR_CORE_SIZE
      runtime.targetVisualHeight = STAR_CORE_SIZE
    } else if (lod === 'title') {
      this.updateBubbleWorldSize(runtime)
    } else {
      this.updateCardWorldSize(runtime)
    }
    if (changed) {
      runtime.stableLodChangedAt = time
      runtime.stableLodCandidate = null
      runtime.stableLodCandidateSince = time
      if (previousLod !== 'glow' && lod === 'glow') runtime.labelHiddenSince = time
    }
    if (
      runtime.id === LINEAR_ALGEBRA_NODE_ID
      && lod === 'card'
      && runtime.selected
      && this.linearAlgebraSelectionOpenPending
    ) {
      this.linearAlgebraSelectionOpenPending = false
      this.setLinearAlgebraIconTarget(1)
    }
    return changed
  }

  private syncBubbleNodeLods(time: number): boolean {
    let changed = false
    const displayedBubbleNodeIds = this.cardFocus.primaryNodeIds.size > 0
      ? this.focusedBubbleNodeIds
      : this.bubbleNodeIds
    for (const runtime of this.nodes.values()) {
      const lod: NodeLod = activeBubbleNodeLod(
        runtime.selected,
        displayedBubbleNodeIds.has(runtime.id),
      )
      if (this.setBubbleNodeLod(runtime, lod, time)) changed = true
    }
    return changed
  }

  // Legacy stable-card LOD setter retained for rollback. The active renderer uses
  // setBubbleNodeLod and never asks the automatic layout to create full cards.
  private setNodeLod(runtime: NodeRuntime, lod: NodeLod) {
    if (runtime.lod === lod) return
    runtime.lod = lod
    runtime.material.map = this.textureForLod(runtime, lod, runtime.selected)
    runtime.material.needsUpdate = true
    if (lod === 'glow') {
      runtime.targetVisualWidth = STAR_CORE_SIZE
      runtime.targetVisualHeight = STAR_CORE_SIZE
    } else if (lod === 'title') {
      runtime.targetVisualWidth = TITLE_WIDTH
      runtime.targetVisualHeight = TITLE_HEIGHT
    } else {
      runtime.targetVisualWidth = CARD_WIDTH
      runtime.targetVisualHeight = CARD_HEIGHT
    }
    if (
      runtime.id === LINEAR_ALGEBRA_NODE_ID
      && lod === 'card'
      && runtime.selected
      && this.linearAlgebraSelectionOpenPending
    ) {
      this.linearAlgebraSelectionOpenPending = false
      this.setLinearAlgebraIconTarget(1)
    }
  }

  private cameraSpaceDepth(worldPosition: Vector3): number {
    this.cameraSpaceScratch.copy(worldPosition).applyMatrix4(this.camera.matrixWorldInverse)
    return Math.max(0.01, -this.cameraSpaceScratch.z)
  }

  private projectedCardHeight(runtime: NodeRuntime): number {
    const depth = this.cameraSpaceDepth(runtime.currentPosition)
    const viewportHeight = Math.max(1, this.renderer.domElement.clientHeight)
    const baseHeight = CARD_HEIGHT * runtime.currentScale
    return baseHeight * viewportHeight * this.camera.zoom
      / (2 * depth * Math.tan(MathUtils.degToRad(this.camera.fov * 0.5)))
  }

  private hemisphereForNode(runtime: NodeRuntime): { value: number; cameraInside: boolean } {
    const cameraFromCenter = this.hemisphereCameraScratch.copy(this.camera.position).sub(this.projectionCenter)
    const nodeFromCenter = this.hemisphereNodeScratch.copy(runtime.currentPosition).sub(this.projectionCenter)
    const cameraInside = cameraFromCenter.lengthSq() < nodeFromCenter.lengthSq() * 0.82
    const value = cameraFromCenter.lengthSq() > 1e-8 && nodeFromCenter.lengthSq() > 1e-8
      ? cameraFromCenter.normalize().dot(nodeFromCenter.normalize())
      : 1
    this.hemisphereResult.value = value
    this.hemisphereResult.cameraInside = cameraInside
    return this.hemisphereResult
  }

  private displayPriorityForNode(runtime: NodeRuntime): NodeDisplayPriority {
    return resolveNodeDisplayPriority(
      runtime.selected,
      runtime.id === this.hoveredNodeId,
    )
  }

  private preferredNodeHit(
    hits: readonly Intersection<Object3D>[],
  ): Intersection<Object3D> | undefined {
    return hits.reduce<Intersection<Object3D> | undefined>((preferred, hit) => {
      if (hit.object.userData.interactive !== true) return preferred
      if (!preferred) return hit
      const hitRuntime = this.nodes.get(hit.object.userData.nodeId)
      const preferredRuntime = this.nodes.get(preferred.object.userData.nodeId)
      const hitOrder = hitRuntime
        ? NODE_DISPLAY_RENDER_ORDER[this.displayPriorityForNode(hitRuntime)]
        : NODE_DISPLAY_RENDER_ORDER.default
      const preferredOrder = preferredRuntime
        ? NODE_DISPLAY_RENDER_ORDER[this.displayPriorityForNode(preferredRuntime)]
        : NODE_DISPLAY_RENDER_ORDER.default
      if (hitOrder !== preferredOrder) return hitOrder > preferredOrder ? hit : preferred
      return hit.distance < preferred.distance ? hit : preferred
    }, undefined)
  }

  private labelRect(
    runtime: NodeRuntime,
    lod: Exclude<NodeLod, 'glow'>,
  ) {
    const width = Math.max(lod === 'card' ? CARD_WIDTH : TITLE_WIDTH, runtime.currentVisualWidth)
    const height = Math.max(lod === 'card' ? CARD_HEIGHT : TITLE_HEIGHT, runtime.currentVisualHeight)
    const point = runtime.currentPosition.clone().project(this.camera)
    if (point.z < -1 || point.z > 1) return null
    const canvas = this.renderer.domElement
    const viewportWidth = Math.max(1, canvas.clientWidth)
    const viewportHeight = Math.max(1, canvas.clientHeight)
    const depth = this.cameraSpaceDepth(runtime.currentPosition)
    const pixelsPerWorld = viewportHeight * this.camera.zoom
      / (2 * depth * Math.tan(MathUtils.degToRad(this.camera.fov * 0.5)))
    const pixelWidth = width * runtime.currentScale * pixelsPerWorld
    const pixelHeight = height * runtime.currentScale * pixelsPerWorld
    const centerX = (point.x * 0.5 + 0.5) * viewportWidth
    const centerY = (-point.y * 0.5 + 0.5) * viewportHeight
    return {
      left: centerX - pixelWidth / 2 - LABEL_COLLISION_PADDING_PX,
      right: centerX + pixelWidth / 2 + LABEL_COLLISION_PADDING_PX,
      top: centerY - pixelHeight / 2 - LABEL_COLLISION_PADDING_PX,
      bottom: centerY + pixelHeight / 2 + LABEL_COLLISION_PADDING_PX,
    }
  }

  private bubbleScreenRect(runtime: NodeRuntime): KnowledgeBubbleRect | null {
    this.cameraSpaceScratch.copy(runtime.currentPosition).applyMatrix4(this.camera.matrixWorldInverse)
    if (this.cameraSpaceScratch.z >= -0.01) return null
    const point = runtime.currentPosition.clone().project(this.camera)
    if (point.z < -1 || point.z > 1) return null
    const canvas = this.renderer.domElement
    const viewportWidth = Math.max(1, canvas.clientWidth)
    const viewportHeight = Math.max(1, canvas.clientHeight)
    const centerX = (point.x * 0.5 + 0.5) * viewportWidth
    const centerY = (-point.y * 0.5 + 0.5) * viewportHeight
      - KNOWLEDGE_BUBBLE_CENTER_OFFSET_PX
    return {
      left: centerX - runtime.bubblePixelWidth / 2,
      right: centerX + runtime.bubblePixelWidth / 2,
      top: centerY - runtime.bubblePixelHeight / 2,
      bottom: centerY + runtime.bubblePixelHeight / 2,
    }
  }

  private labelRectIntersectsViewport(
    rect: { left: number; right: number; top: number; bottom: number },
  ): boolean {
    const canvas = this.renderer.domElement
    const viewportWidth = Math.max(1, canvas.clientWidth)
    const viewportHeight = Math.max(1, canvas.clientHeight)
    return rect.right > 0
      && rect.left < viewportWidth
      && rect.bottom > 0
      && rect.top < viewportHeight
  }

  private applyStableNodeLod(runtime: NodeRuntime, lod: NodeLod, time: number) {
    const previousLod = runtime.lod
    this.setNodeLod(runtime, lod)
    runtime.stableLodChangedAt = time
    runtime.stableLodCandidate = null
    runtime.stableLodCandidateSince = time
    if (previousLod !== 'glow' && lod === 'glow') runtime.labelHiddenSince = time
  }

  private rememberNodeInteraction(runtime: NodeRuntime) {
    this.lastInteractedNodeId = runtime.id
    this.bubbleNodeIds.add(runtime.id)
    this.lastInteractionCameraPosition.copy(this.camera.position)
    this.lastInteractionLookAt.copy(this.lookAt)
    this.lastInteractionCameraDistance = Math.max(
      1e-6,
      this.camera.position.distanceTo(this.lookAt),
    )
    this.lastInteractionZoom = this.camera.zoom
  }

  private retainedInteractionNodeId(): string | null {
    const nodeId = this.lastInteractedNodeId
    if (!nodeId || !this.nodes.has(nodeId)) {
      this.lastInteractedNodeId = null
      return null
    }
    const retained = stableLodInteractionRetained({
      cameraTravel: this.camera.position.distanceTo(this.lastInteractionCameraPosition),
      lookAtTravel: this.lookAt.distanceTo(this.lastInteractionLookAt),
      referenceDistance: this.lastInteractionCameraDistance,
      referenceZoom: this.lastInteractionZoom,
      currentZoom: this.camera.zoom,
    })
    if (retained) return nodeId
    this.lastInteractedNodeId = null
    return null
  }

  private resetLodViewAnchor() {
    this.lodViewAnchorCameraPosition.copy(this.camera.position)
    this.lodViewAnchorLookAt.copy(this.lookAt)
    this.lodViewAnchorForward.copy(this.lookAt).sub(this.camera.position)
    if (this.lodViewAnchorForward.lengthSq() < 1e-8) this.lodViewAnchorForward.set(0, 0, -1)
    else this.lodViewAnchorForward.normalize()
    this.lodViewAnchorDistance = Math.max(
      1e-6,
      this.camera.position.distanceTo(this.lookAt),
    )
    this.lodViewAnchorZoom = this.camera.zoom
  }

  private beginLodViewRefresh(time: number) {
    this.lodViewRefreshUntil = Math.max(
      this.lodViewRefreshUntil,
      time + STABLE_LOD_VIEW_REFRESH_DURATION_MS,
    )
  }

  private updateLodViewRefresh(time: number, zoomAnchorWasActive: boolean): boolean {
    const viewMotionActive = this.pointerGesture !== null
      || this.movementKeys.size > 0
      || this.camera.position.distanceToSquared(this.targetCameraPosition) > SETTLE_EPSILON
      || this.lookAt.distanceToSquared(this.targetLookAt) > SETTLE_EPSILON
    const refreshActive = time <= this.lodViewRefreshUntil

    if (refreshActive) {
      if (viewMotionActive && !zoomAnchorWasActive) this.beginLodViewRefresh(time)
      return true
    }

    if (Number.isFinite(this.lodViewRefreshUntil)) {
      this.lodViewRefreshUntil = Number.NEGATIVE_INFINITY
      this.resetLodViewAnchor()
    }
    if (zoomAnchorWasActive) {
      this.resetLodViewAnchor()
      return false
    }

    const currentForward = this.lodViewCurrentForward.copy(this.lookAt).sub(this.camera.position)
    if (currentForward.lengthSq() < 1e-8) currentForward.set(0, 0, -1)
    else currentForward.normalize()
    const viewChanged = stableLodViewRefreshNeeded({
      cameraTravel: this.camera.position.distanceTo(this.lodViewAnchorCameraPosition),
      lookAtTravel: this.lookAt.distanceTo(this.lodViewAnchorLookAt),
      referenceDistance: this.lodViewAnchorDistance,
      referenceZoom: this.lodViewAnchorZoom,
      viewAngleRadians: this.lodViewAnchorForward.angleTo(currentForward),
    })
    if (!viewChanged) return false
    this.beginLodViewRefresh(time)
    return true
  }

  private resetBubbleViewAnchor() {
    this.bubbleViewAnchorCameraPosition.copy(this.camera.position)
    this.bubbleViewAnchorLookAt.copy(this.lookAt)
    this.bubbleViewAnchorForward.copy(this.lookAt).sub(this.camera.position)
    if (this.bubbleViewAnchorForward.lengthSq() < 1e-8) {
      this.bubbleViewAnchorForward.set(0, 0, -1)
    } else {
      this.bubbleViewAnchorForward.normalize()
    }
    this.bubbleViewAnchorDistance = Math.max(
      1e-6,
      this.camera.position.distanceTo(this.lookAt),
    )
    this.bubbleViewAnchorZoom = Math.max(1e-6, this.camera.zoom)
    this.bubbleZoomMovedSinceAnchor = false
    this.bubbleSpatialMovedSinceAnchor = false
  }

  private bubbleViewChanged(): boolean {
    this.bubbleViewCurrentForward.copy(this.lookAt).sub(this.camera.position)
    if (this.bubbleViewCurrentForward.lengthSq() < 1e-8) {
      this.bubbleViewCurrentForward.set(0, 0, -1)
    } else {
      this.bubbleViewCurrentForward.normalize()
    }
    const effectiveViewDistance = this.bubbleViewAnchorDistance / this.bubbleViewAnchorZoom
    const travelRatio = Math.max(
      this.camera.position.distanceTo(this.bubbleViewAnchorCameraPosition),
      this.lookAt.distanceTo(this.bubbleViewAnchorLookAt),
    ) / Math.max(1e-6, effectiveViewDistance)
    const viewAngle = this.bubbleViewAnchorForward.angleTo(this.bubbleViewCurrentForward)
    const zoomOctaves = Math.abs(Math.log2(
      Math.max(1e-6, this.camera.zoom) / this.bubbleViewAnchorZoom,
    ))
    return travelRatio > BUBBLE_VIEW_TRAVEL_RATIO
      || viewAngle > BUBBLE_VIEW_ANGLE_RADIANS
      || zoomOctaves > BUBBLE_VIEW_ZOOM_OCTAVES
  }

  private bubbleCandidates(): KnowledgeBubbleCandidate[] {
    this.camera.updateMatrixWorld()
    return [...this.nodes.values()].flatMap((runtime) => {
      const effectiveOpacity = runtime.currentOpacity * this.scopeWeightForNode(runtime)
      if (
        effectiveOpacity <= LOD_CANDIDATE_OPACITY_EPSILON
        || !runtime.projection.visible
        || !runtime.projection.interactive
      ) return []
      const hemisphere = this.hemisphereForNode(runtime)
      if (!hemisphere.cameraInside && hemisphere.value < -0.18) return []
      const rect = this.bubbleScreenRect(runtime)
      if (!rect || !this.labelRectIntersectsViewport(rect)) return []
      return [{
        id: runtime.id,
        importance: Math.max(0, runtime.projection.foundationScore),
        cameraDistance: this.camera.position.distanceTo(runtime.currentPosition),
        rect,
      }]
    })
  }

  private updateFocusedBubbleNodeIds(): boolean {
    const hasFocusedNode = this.cardFocus.primaryNodeIds.size > 0
    const nextIds = new Set<string>()
    if (hasFocusedNode) {
      this.camera.updateMatrixWorld()
      for (const nodeId of this.selectedNeighborIds) {
        const runtime = this.nodes.get(nodeId)
        if (!runtime) continue
        const rect = this.bubbleScreenRect(runtime)
        if (rect && this.labelRectIntersectsViewport(rect)) nextIds.add(nodeId)
      }
    }
    const changed = nextIds.size !== this.focusedBubbleNodeIds.size
      || [...nextIds].some((id) => !this.focusedBubbleNodeIds.has(id))
    this.focusedBubbleNodeIds.clear()
    nextIds.forEach((id) => this.focusedBubbleNodeIds.add(id))
    return changed
  }

  private rebuildFocusedBubbleLayout(time: number): boolean {
    const changed = this.updateFocusedBubbleNodeIds()
    return this.syncBubbleNodeLods(time) || changed
  }

  private rebuildBubbleLayout(time: number, addOnly: boolean): boolean {
    const candidates = this.bubbleCandidates()
    const canvas = this.renderer.domElement
    const nextIds = selectKnowledgeBubbles({
      candidates,
      viewportWidth: Math.max(1, canvas.clientWidth),
      viewportHeight: Math.max(1, canvas.clientHeight),
      existingIds: this.bubbleNodeIds,
      pinnedId: this.retainedInteractionNodeId(),
      addOnly,
    })
    const changed = nextIds.size !== this.bubbleNodeIds.size
      || [...nextIds].some((id) => !this.bubbleNodeIds.has(id))
    this.bubbleNodeIds.clear()
    nextIds.forEach((id) => this.bubbleNodeIds.add(id))
    const focusedChanged = this.updateFocusedBubbleNodeIds()
    this.bubbleLayoutInitialized = true
    this.bubbleLayoutDirty = false
    this.resetBubbleViewAnchor()
    return this.syncBubbleNodeLods(time) || changed || focusedChanged
  }

  private resolveNodeBubbles(
    time: number,
    force = false,
    zoomAnchorWasActive = false,
  ): boolean {
    this.camera.updateMatrixWorld()
    const positionMoving = this.camera.position.distanceToSquared(this.targetCameraPosition)
      > SETTLE_EPSILON
    const lookAtMoving = this.lookAt.distanceToSquared(this.targetLookAt) > SETTLE_EPSILON
    const spatialMotionActive = this.pointerGesture !== null
      || this.movementKeys.size > 0
      || positionMoving
      || lookAtMoving
    const zoomMotionActive = zoomAnchorWasActive
      || !isGlobalZoomSettled(this.camera.zoom, this.targetGlobalZoom)
    const nodeMotionActive = [...this.nodes.values()].some((runtime) => (
      runtime.currentPosition.distanceToSquared(runtime.targetPosition) > SETTLE_EPSILON
      || Math.abs(runtime.currentOpacity - runtime.targetOpacity) > SETTLE_EPSILON
      || Math.abs(runtime.currentScale - runtime.targetScale) > SETTLE_EPSILON
    ))
    if (spatialMotionActive) this.bubbleSpatialMovedSinceAnchor = true
    if (zoomMotionActive) this.bubbleZoomMovedSinceAnchor = true
    if (spatialMotionActive || zoomMotionActive || nodeMotionActive) {
      const addOnly = !force
        && !this.bubbleLayoutDirty
        && zoomMotionActive
        && !spatialMotionActive
        && this.camera.zoom >= this.bubbleViewAnchorZoom
      return this.rebuildBubbleLayout(time, addOnly)
    }

    const viewChanged = this.bubbleViewChanged()
    if (force || this.bubbleLayoutDirty || !this.bubbleLayoutInitialized || viewChanged) {
      const addOnly = !force
        && !this.bubbleLayoutDirty
        && viewChanged
        && this.bubbleZoomMovedSinceAnchor
        && !this.bubbleSpatialMovedSinceAnchor
        && this.camera.zoom > this.bubbleViewAnchorZoom
      return this.rebuildBubbleLayout(time, addOnly)
    }
    return this.syncBubbleNodeLods(time)
  }

  // Legacy stable LOD resolver retained intact for rollback. It is intentionally
  // disconnected from advance() and updateSceneObjects().
  private resolveNodeLods(time: number, force = false, zoomAnchorWasActive = false): boolean {
    this.camera.updateMatrixWorld()
    const retainedInteractionNodeId = this.retainedInteractionNodeId()
    const nearbyViewRefreshActive = this.updateLodViewRefresh(time, zoomAnchorWasActive)
    const scoreReseedActive = this.lodScoreReseedPending
    const reseedActive = nearbyViewRefreshActive || scoreReseedActive
    const allNodes = [...this.nodes.values()]
    for (const runtime of allNodes) {
      const effectiveOpacity = runtime.currentOpacity * this.scopeWeightForNode(runtime)
      if (runtime.lod !== 'glow' && effectiveOpacity <= LOD_CANDIDATE_OPACITY_EPSILON) {
        this.applyStableNodeLod(runtime, 'glow', time)
      }
    }
    const candidates = allNodes
      .filter((runtime) => (
        runtime.currentOpacity * this.scopeWeightForNode(runtime) > LOD_CANDIDATE_OPACITY_EPSILON
      ))
    if (candidates.length === 0) {
      this.lodScoreReseedPending = false
      return nearbyViewRefreshActive
    }

    const projectedHeights = new Map<NodeRuntime, number>()
    const hemispheres = new Map<NodeRuntime, number>()
    const cameraDistances = new Map<NodeRuntime, number>()
    for (const runtime of candidates) {
      projectedHeights.set(runtime, this.projectedCardHeight(runtime))
      const hemisphereState = this.hemisphereForNode(runtime)
      hemispheres.set(runtime, hemisphereState.value)
      cameraDistances.set(runtime, this.camera.position.distanceTo(runtime.currentPosition))
    }
    const detail = stableLodDetail([...projectedHeights.values()])
    const minimumEmphasis = stableLodMinimumEmphasis(detail)
    const scoreElapsed = Number.isFinite(this.lastLodScoreTime)
      ? time - this.lastLodScoreTime
      : Number.POSITIVE_INFINITY
    const scoreAlpha = force || reseedActive ? 1 : stableLodScoreAlpha(scoreElapsed)
    for (const runtime of candidates) {
      const hemisphere = hemispheres.get(runtime) ?? 1
      runtime.hemisphereEligible = stableHemisphereEligibility(
        force ? false : runtime.hemisphereEligible,
        hemisphere,
      )
      const hiddenForMs = runtime.lod === 'glow' ? time - runtime.labelHiddenSince : 0
      const score = stableLodScore({
        emphasis: runtime.projection.emphasis,
        foundationScore: runtime.projection.foundationScore,
        hemisphere,
        projectedHeight: projectedHeights.get(runtime) ?? 0,
        detail,
        hiddenForMs,
      })
      runtime.stableLodScore = MathUtils.lerp(runtime.stableLodScore, score, scoreAlpha)
    }
    this.lastLodScoreTime = time

    const evaluationDue = force
      || this.reducedMotion
      || time - this.lastLodEvaluationTime >= STABLE_LOD_EVALUATION_INTERVAL_MS
    if (!evaluationDue) return true
    this.lastLodEvaluationTime = time

    candidates.sort((left, right) => {
      const leftPriority = left.selected
        ? 3
        : this.selectedNeighborIds.has(left.id)
          ? 2
          : left.id === retainedInteractionNodeId
            ? 1
            : 0
      const rightPriority = right.selected
        ? 3
        : this.selectedNeighborIds.has(right.id)
          ? 2
          : right.id === retainedInteractionNodeId
            ? 1
            : 0
      if (leftPriority !== rightPriority) return rightPriority - leftPriority
      if (nearbyViewRefreshActive) {
        const distanceDelta = (cameraDistances.get(left) ?? Number.POSITIVE_INFINITY)
          - (cameraDistances.get(right) ?? Number.POSITIVE_INFINITY)
        if (Math.abs(distanceDelta) > 1e-6) return distanceDelta
      }
      const retainCurrentLabels = !reseedActive
      const leftScore = left.stableLodScore + (
        !retainCurrentLabels || left.lod === 'glow'
          ? 0
          : stableLodRetentionBonus(left.projection.foundationScore)
      )
      const rightScore = right.stableLodScore + (
        !retainCurrentLabels || right.lod === 'glow'
          ? 0
          : stableLodRetentionBonus(right.projection.foundationScore)
      )
      return rightScore - leftScore || left.id.localeCompare(right.id)
    })

    const canvas = this.renderer.domElement
    const labelBudget = stableLodLabelBudget(canvas.clientWidth, canvas.clientHeight, detail)
    const placed: Array<{ left: number; right: number; top: number; bottom: number }> = []
    const proposedLods = new Map<NodeRuntime, NodeLod>(
      candidates.map((runtime) => [runtime, 'glow']),
    )
    let usedLabels = 0

    const overlaps = (
      candidate: { left: number; right: number; top: number; bottom: number },
      existing: { left: number; right: number; top: number; bottom: number },
    ) => candidate.left < existing.right && candidate.right > existing.left
      && candidate.top < existing.bottom && candidate.bottom > existing.top

    for (const runtime of candidates) {
      const holdsLinearAlgebraClosingCard = runtime.id === LINEAR_ALGEBRA_NODE_ID
        && runtime.lod === 'card'
        && this.linearAlgebraIconAnimating
        && this.linearAlgebraIconTarget === 0
      if (holdsLinearAlgebraClosingCard) {
        const rect = this.labelRect(runtime, 'card')
        const inViewport = rect !== null && this.labelRectIntersectsViewport(rect)
        if (inViewport) placed.push(rect)
        proposedLods.set(runtime, 'card')
        if (inViewport) usedLabels += 1
        continue
      }
      if (runtime.selected) {
        const rect = this.labelRect(runtime, 'card')
        const inViewport = rect !== null && this.labelRectIntersectsViewport(rect)
        if (inViewport) placed.push(rect)
        proposedLods.set(runtime, 'card')
        if (inViewport) usedLabels += 1
        continue
      }
      const related = this.selectedNeighborIds.has(runtime.id)
      if (related) {
        let fallback: {
          lod: Exclude<NodeLod, 'glow'>
          rect: { left: number; right: number; top: number; bottom: number }
        } | null = null
        let resolved = false
        for (const attempt of RELATED_NODE_LODS) {
          const rect = this.labelRect(runtime, attempt)
          if (!rect || !this.labelRectIntersectsViewport(rect)) continue
          fallback = { lod: attempt, rect }
          if (placed.some((existing) => overlaps(rect, existing))) continue
          placed.push(rect)
          proposedLods.set(runtime, attempt)
          usedLabels += 1
          resolved = true
          break
        }
        if (resolved) continue
        if (fallback) {
          placed.push(fallback.rect)
          proposedLods.set(runtime, fallback.lod)
          usedLabels += 1
          continue
        }
      }
      if (runtime.id === retainedInteractionNodeId) {
        const retainedLod: Exclude<NodeLod, 'glow'> = runtime.lod === 'glow'
          ? 'title'
          : runtime.lod
        const rect = this.labelRect(runtime, retainedLod)
        if (rect) {
          const inViewport = this.labelRectIntersectsViewport(rect)
          if (inViewport) placed.push(rect)
          proposedLods.set(runtime, retainedLod)
          if (inViewport) usedLabels += 1
          continue
        }
      }
      if (
        usedLabels >= labelBudget
        || !runtime.hemisphereEligible
        || stableLodSemanticPriority(
          runtime.projection.emphasis,
          runtime.projection.foundationScore,
        ) < minimumEmphasis
      ) continue
      const desired = stableDesiredLod(
        projectedHeights.get(runtime) ?? 0,
        runtime.lod,
        runtime.projection.foundationScore,
      )
      const attempts: NodeLod[] = desired === 'card'
        ? ['card', 'title', 'glow']
        : desired === 'title'
          ? ['title', 'glow']
          : ['glow']
      let resolved: NodeLod = 'glow'
      for (const attempt of attempts) {
        if (attempt === 'glow') {
          resolved = attempt
          break
        }
        const rect = this.labelRect(runtime, attempt)
        if (!rect || !this.labelRectIntersectsViewport(rect)) continue
        const collision = placed.some((existing) => overlaps(rect, existing))
        if (collision) continue
        placed.push(rect)
        resolved = attempt
        break
      }
      proposedLods.set(runtime, resolved)
      if (resolved !== 'glow') usedLabels += 1
    }

    const ready: Array<{ runtime: NodeRuntime; lod: NodeLod }> = []
    let pending = false
    for (const runtime of candidates) {
      const proposed = proposedLods.get(runtime) ?? 'glow'
      if (proposed === runtime.lod) {
        runtime.stableLodCandidate = null
        continue
      }
      if (force || this.reducedMotion || runtime.selected || this.selectedNeighborIds.has(runtime.id)) {
        this.applyStableNodeLod(runtime, proposed, time)
        continue
      }
      if (runtime.stableLodCandidate !== proposed) {
        runtime.stableLodCandidate = proposed
        runtime.stableLodCandidateSince = time
        pending = true
        continue
      }
      if (!stableLodChangeReady(
        time,
        runtime.stableLodChangedAt,
        runtime.stableLodCandidateSince,
        proposed === 'glow' || (proposed === 'title' && runtime.lod === 'card'),
        reseedActive ? 0 : runtime.projection.foundationScore,
      )) {
        pending = true
        continue
      }
      ready.push({ runtime, lod: proposed })
    }

    ready.sort((left, right) => {
      const leftDowngrade = left.lod === 'glow' || (left.lod === 'title' && left.runtime.lod === 'card')
      const rightDowngrade = right.lod === 'glow' || (right.lod === 'title' && right.runtime.lod === 'card')
      if (leftDowngrade !== rightDowngrade) return leftDowngrade ? -1 : 1
      if (nearbyViewRefreshActive) {
        const leftDistance = cameraDistances.get(left.runtime) ?? Number.POSITIVE_INFINITY
        const rightDistance = cameraDistances.get(right.runtime) ?? Number.POSITIVE_INFINITY
        return leftDowngrade ? rightDistance - leftDistance : leftDistance - rightDistance
      }
      if (leftDowngrade) return left.runtime.stableLodScore - right.runtime.stableLodScore
      return right.runtime.stableLodScore - left.runtime.stableLodScore
    })
    ready.slice(0, STABLE_LOD_MAX_SWAPS_PER_EVALUATION).forEach(({ runtime, lod }) => {
      this.applyStableNodeLod(runtime, lod, time)
    })
    if (ready.length > STABLE_LOD_MAX_SWAPS_PER_EVALUATION) pending = true
    if (!pending) this.lodScoreReseedPending = false
    return pending || nearbyViewRefreshActive
  }

  private updateNodePresentation(runtime: NodeRuntime) {
    const scopeWeight = this.scopeWeightForNode(runtime)
    const { value: hemisphere, cameraInside } = this.hemisphereForNode(runtime)
    const focusRole = getCardFocusRole(this.cardFocus, runtime.id)
    const selectedNeighbor = this.selectedNeighborIds.has(runtime.id)
    const interactionFocused = this.cardFocus.primaryNodeIds.size > 0
      && (runtime.selected || selectedNeighbor)
    const hovered = runtime.id === this.hoveredNodeId
    const displayPriority = this.displayPriorityForNode(runtime)
    const occlusion = runtime.selected || selectedNeighbor || hovered || cameraInside
      ? 1
      : MathUtils.smoothstep(hemisphere, -0.72, 0.18) * 0.72 + 0.28
    const lodOpacity = runtime.lod === 'glow' ? 0.9 : runtime.lod === 'title' ? 0.94 : 1
    const neighborhoodOpacity = focusRole === 'context' && !hovered ? CARD_FOCUS_CONTEXT_OPACITY : 1
    const focusedOpacity = hovered
      ? Math.max(runtime.currentOpacity, 0.96)
      : selectedNeighbor
      ? Math.max(runtime.currentOpacity, 0.9)
      : runtime.currentOpacity
    const calculatedOpacity = focusedOpacity
      * scopeWeight
      * occlusion
      * lodOpacity
      * neighborhoodOpacity
    const glowCalculatedOpacity = focusedOpacity
      * scopeWeight
      * occlusion
      * 0.9
      * neighborhoodOpacity
    const glowDisplayOpacity = hovered
      ? MathUtils.clamp(glowCalculatedOpacity, 0.94 * scopeWeight, 1)
      : selectedNeighbor
        ? MathUtils.clamp(glowCalculatedOpacity, RELATED_NODE_MIN_OPACITY * scopeWeight, 1)
        : glowCalculatedOpacity
    const stableDefaultCard = !this.cardFocus.active
      && runtime.lod !== 'glow'
      && runtime.currentOpacity >= 0.5
      && runtime.targetOpacity >= 0.5
      && scopeWeight >= 0.98
    runtime.displayOpacity = hovered
      ? MathUtils.clamp(calculatedOpacity, 0.94 * scopeWeight, 1)
      : selectedNeighbor
      ? MathUtils.clamp(calculatedOpacity, RELATED_NODE_MIN_OPACITY * scopeWeight, 1)
      : stableDefaultCard
      ? MathUtils.clamp(calculatedOpacity, 0.58, 0.86)
      : calculatedOpacity
    const nodeNameOpacity = runtime.lod === 'title'
      ? nodeNameOverviewOpacity(this.camera.zoom, interactionFocused)
      : 1
    runtime.material.opacity = runtime.lod === 'glow'
      ? Math.min(1, runtime.displayOpacity * runtime.currentCoreOpacity)
      : runtime.displayOpacity * nodeNameOpacity
    runtime.sprite.visible = runtime.lod !== 'title' || runtime.material.opacity > 0.004
    const targetBlending = runtime.lod === 'glow' && this.colorTheme === 'dark'
      ? AdditiveBlending
      : NormalBlending
    if (runtime.material.blending !== targetBlending) {
      runtime.material.blending = targetBlending
      runtime.material.needsUpdate = true
    }
    const haloLodWeight = runtime.lod === 'glow'
      ? 1
      : runtime.lod === 'title'
        ? NODE_HALO_TITLE_WEIGHT
        : NODE_HALO_CARD_WEIGHT
    const nextHaloPresentationWeight = (
      runtime.lod === 'glow' ? runtime.displayOpacity : glowDisplayOpacity
    ) * haloLodWeight
    if (Math.abs(runtime.haloPresentationWeight - nextHaloPresentationWeight) > 1e-5) {
      runtime.haloPresentationWeight = nextHaloPresentationWeight
      this.nodeHaloOpticalDensitiesDirty = true
    }
    const cameraDepth = this.cameraSpaceDepth(runtime.currentPosition)
    runtime.sprite.renderOrder = selectedNeighbor && displayPriority === 'default'
      ? relatedNodeDepthRenderOrder(cameraDepth)
      : NODE_DISPLAY_RENDER_ORDER[displayPriority]
    runtime.material.depthTest = displayPriority === 'default' && !selectedNeighbor
    runtime.group.visible = runtime.currentOpacity * scopeWeight > 0.004
    runtime.starSprite.visible = runtime.lod !== 'glow' && runtime.group.visible
    const selectedStarScale = runtime.selected ? SELECTED_NODE_STAR_SCALE : 1
    runtime.starSprite.scale.set(
      STAR_CORE_SIZE * selectedStarScale,
      STAR_CORE_SIZE * selectedStarScale,
      1,
    )
    runtime.starMaterial.opacity = Math.min(
      1,
      glowDisplayOpacity * runtime.currentCoreOpacity,
    )
    const starBlending = this.colorTheme === 'dark' ? AdditiveBlending : NormalBlending
    if (runtime.starMaterial.blending !== starBlending) {
      runtime.starMaterial.blending = starBlending
      runtime.starMaterial.needsUpdate = true
    }

    const scopeInteractive = runtime.subspaceId
      ? scopeWeight >= SUBSPACE_SCOPE_ENTER_PROGRESS
      : scopeWeight > SUBSPACE_SCOPE_EXIT_PROGRESS
    const eligible = runtime.projection.visible
      && runtime.projection.interactive
      && scopeInteractive
      && runtime.targetOpacity > HIDDEN_OPACITY_EPSILON
      && runtime.displayOpacity > 0.025
      && runtime.group.visible
    runtime.sprite.userData.interactive = eligible
  }

  private requestRender = () => {
    if (this.disposed || this.frameRequest !== null) return
    this.frameRequest = requestAnimationFrame(this.renderFrame)
  }

  private renderFrame = (time: number) => {
    this.frameRequest = null
    if (this.disposed) return
    const deltaSeconds = this.lastFrameTime > 0 ? (time - this.lastFrameTime) / 1000 : 1 / 60
    this.lastFrameTime = time
    const moving = this.advance(deltaSeconds, time)
    this.flushEdgeBatch()
    this.flushFieldBatch()
    this.flushNodeHaloBatch()
    if (this.fieldCameraChanged()) {
      this.fieldPassDirty = true
      this.nodeHaloPassDirty = true
    }
    const hasVisibleNodeHalos = this.hasVisibleNodeHaloBatch
    this.nodeHaloCompositeMesh.visible = hasVisibleNodeHalos
    if (hasVisibleNodeHalos && this.nodeHaloPassDirty) {
      this.renderer.setRenderTarget(this.nodeHaloRenderTarget)
      this.renderer.setScissorTest(false)
      this.renderer.clear(true, false, false)
      this.renderer.render(this.nodeHaloScene, this.camera)
      this.nodeHaloPassDirty = false
    }
    const hasVisibleFields = this.hasVisibleFieldBatch
    this.fieldCompositeMesh.visible = hasVisibleFields
    if (hasVisibleFields && this.fieldPassDirty) {
      this.renderer.setRenderTarget(this.fieldRenderTarget)
      this.renderer.setScissorTest(false)
      this.renderer.clear(true, false, false)
      this.renderer.render(this.fieldScene, this.camera)

      this.fieldBlurMaterial.uniforms.uSource.value = this.fieldRenderTarget.texture
      this.fieldBlurMaterial.uniforms.uTexelStep.value.set(
        FIELD_GLOW_BLUR_RADIUS / this.fieldRenderTarget.width,
        0,
      )
      this.renderer.setRenderTarget(this.fieldBlurTarget)
      this.renderer.clear(true, false, false)
      this.renderer.render(this.fieldPostScene, this.camera)

      this.fieldBlurMaterial.uniforms.uSource.value = this.fieldBlurTarget.texture
      this.fieldBlurMaterial.uniforms.uTexelStep.value.set(
        0,
        FIELD_GLOW_BLUR_RADIUS / this.fieldBlurTarget.height,
      )
      this.renderer.setRenderTarget(this.fieldGlowTarget)
      this.renderer.clear(true, false, false)
      this.renderer.render(this.fieldPostScene, this.camera)
      this.fieldPassDirty = false
    }
    this.renderer.setRenderTarget(null)
    this.renderer.clear(true, true, true)
    this.renderer.render(this.scene, this.camera)
    this.publishCameraState()
    if (moving || this.pointerGesture !== null || this.movementKeys.size > 0) this.requestRender()
  }

  private advance(deltaSeconds: number, time: number): boolean {
    const positionFactor = expLerpFactor(8.5, deltaSeconds)
    const alphaFactor = expLerpFactor(10, deltaSeconds)
    const cameraFactor = expLerpFactor(7.2, deltaSeconds)
    const hoverFactor = expLerpFactor(14, deltaSeconds)
    let moving = this.advanceWalking(deltaSeconds)
    if (this.edgePulseActive) {
      this.edgeBatchMaterial.uniforms.edgePulseTime.value = time / 1000
      moving = true
    }
    if (this.advanceLinearAlgebraIcon(time)) moving = true

    let nodePositionsChanged = false
    for (const runtime of this.nodes.values()) {
      const previousX = runtime.currentPosition.x
      const previousY = runtime.currentPosition.y
      const previousZ = runtime.currentPosition.z
      const previousScale = runtime.currentScale
      const previousCoreOpacity = runtime.currentCoreOpacity
      const previousBloomCoreDensity = runtime.currentBloomCoreDensity
      const previousHaloOpticalDensity = runtime.currentHaloOpticalDensity
      const previousHaloRadiusScale = runtime.currentHaloRadiusScale
      runtime.currentPosition.lerp(runtime.targetPosition, positionFactor)
      runtime.currentOpacity = MathUtils.lerp(runtime.currentOpacity, runtime.targetOpacity, alphaFactor)
      runtime.currentScale = MathUtils.lerp(runtime.currentScale, runtime.targetScale, positionFactor)
      runtime.currentCoreOpacity = dampNodeGlowValue(
        runtime.currentCoreOpacity,
        runtime.targetCoreOpacity,
        deltaSeconds,
        this.reducedMotion,
      )
      runtime.currentBloomCoreDensity = dampNodeGlowValue(
        runtime.currentBloomCoreDensity,
        runtime.targetBloomCoreDensity,
        deltaSeconds,
        this.reducedMotion,
      )
      runtime.currentHaloOpticalDensity = dampNodeGlowValue(
        runtime.currentHaloOpticalDensity,
        runtime.targetHaloOpticalDensity,
        deltaSeconds,
        this.reducedMotion,
      )
      runtime.currentHaloRadiusScale = dampNodeGlowValue(
        runtime.currentHaloRadiusScale,
        runtime.targetHaloRadiusScale,
        deltaSeconds,
        this.reducedMotion,
      )
      runtime.group.position.copy(runtime.currentPosition)
      runtime.group.scale.setScalar(runtime.currentScale)
      runtime.group.visible = runtime.currentOpacity > 0.004
      if (
        runtime.currentPosition.x !== previousX
        || runtime.currentPosition.y !== previousY
        || runtime.currentPosition.z !== previousZ
      ) {
        nodePositionsChanged = true
        this.nodeHaloMatricesDirty = true
      }
      if (runtime.currentScale !== previousScale) this.nodeHaloMatricesDirty = true
      if (
        runtime.currentBloomCoreDensity !== previousBloomCoreDensity
        || runtime.currentHaloOpticalDensity !== previousHaloOpticalDensity
      ) this.nodeHaloOpticalDensitiesDirty = true
      if (runtime.currentHaloRadiusScale !== previousHaloRadiusScale) {
        this.nodeHaloMatricesDirty = true
      }
      if (
        runtime.currentPosition.distanceToSquared(runtime.targetPosition) > SETTLE_EPSILON ||
        Math.abs(runtime.currentOpacity - runtime.targetOpacity) > SETTLE_EPSILON ||
        Math.abs(runtime.currentScale - runtime.targetScale) > SETTLE_EPSILON ||
        Math.abs(runtime.currentCoreOpacity - runtime.targetCoreOpacity) > 1e-4 ||
        Math.abs(runtime.currentBloomCoreDensity - runtime.targetBloomCoreDensity) > 1e-4 ||
        Math.abs(runtime.currentHaloOpticalDensity - runtime.targetHaloOpticalDensity) > 1e-4 ||
        Math.abs(runtime.currentHaloRadiusScale - runtime.targetHaloRadiusScale) > 1e-4
      ) moving = true
      if (runtime.currentCoreOpacity !== previousCoreOpacity) moving = true
    }
    if (nodePositionsChanged) this.edgePositionsDirty = true

    if (this.edgeOpacityAnimationActive) {
      let edgeOpacityAnimationActive = false
      for (const runtime of this.edges.values()) {
        const previousOpacity = runtime.currentOpacity
        runtime.currentOpacity = MathUtils.lerp(runtime.currentOpacity, runtime.targetOpacity, alphaFactor)
        if (Math.abs(runtime.currentOpacity - runtime.targetOpacity) <= SETTLE_EPSILON) {
          runtime.currentOpacity = runtime.targetOpacity
        } else {
          edgeOpacityAnimationActive = true
          moving = true
        }
        if (runtime.currentOpacity !== previousOpacity) this.edgeOpacitiesDirty = true
      }
      this.edgeOpacityAnimationActive = edgeOpacityAnimationActive
    }

    if (this.fieldAnimationActive) {
      let fieldAnimationActive = false
      for (const runtime of this.fields.values()) {
        const previousOpacity = runtime.currentOpacity
        runtime.currentOpacity = MathUtils.lerp(runtime.currentOpacity, runtime.targetOpacity, alphaFactor)
        if (Math.abs(runtime.currentOpacity - runtime.targetOpacity) <= SETTLE_EPSILON) {
          runtime.currentOpacity = runtime.targetOpacity
        } else {
          fieldAnimationActive = true
          moving = true
        }
        if (runtime.currentOpacity !== previousOpacity) this.fieldOpacitiesDirty = true

        if (runtime.instancesAnimating) {
          let stillAnimating = false
          for (const lobe of runtime.lobes) {
            lobe.currentPosition.lerp(lobe.targetPosition, positionFactor)
            lobe.currentRadius = MathUtils.lerp(lobe.currentRadius, lobe.targetRadius, positionFactor)
            lobe.currentOpacity = MathUtils.lerp(lobe.currentOpacity, lobe.targetOpacity, alphaFactor)
            const unsettled = lobe.currentPosition.distanceToSquared(lobe.targetPosition) > SETTLE_EPSILON
              || Math.abs(lobe.currentRadius - lobe.targetRadius) > SETTLE_EPSILON
              || Math.abs(lobe.currentOpacity - lobe.targetOpacity) > SETTLE_EPSILON
            if (unsettled) {
              stillAnimating = true
            } else {
              lobe.currentPosition.copy(lobe.targetPosition)
              lobe.currentRadius = lobe.targetRadius
              lobe.currentOpacity = lobe.targetOpacity
            }
          }
          runtime.instancesAnimating = stillAnimating
          this.fieldMatricesDirty = true
          this.fieldOpacitiesDirty = true
          if (stillAnimating) {
            fieldAnimationActive = true
            moving = true
          }
        }
      }
      this.fieldAnimationActive = fieldAnimationActive
    }

    this.camera.position.lerp(this.targetCameraPosition, cameraFactor)
    this.lookAt.lerp(this.targetLookAt, cameraFactor)
    this.camera.lookAt(this.lookAt)
    if (
      this.camera.position.distanceToSquared(this.targetCameraPosition) > SETTLE_EPSILON ||
      this.lookAt.distanceToSquared(this.targetLookAt) > SETTLE_EPSILON
    ) moving = true

    const zoomAnchorWasActive = this.activeZoomAnchor !== null
    const zoomSettled = isGlobalZoomSettled(this.camera.zoom, this.targetGlobalZoom)
    const nextZoom = zoomSettled
      ? this.targetGlobalZoom
      : dampGlobalZoom(this.camera.zoom, this.targetGlobalZoom, deltaSeconds)
    this.applyGlobalZoomStep(nextZoom)
    if (zoomSettled) this.activeZoomAnchor = null
    else moving = true

    if (this.updateSubspaceProgress()) {
      this.fieldOpacitiesDirty = true
      this.edgeOpacitiesDirty = true
      moving = true
    }

    if (this.resolveNodeBubbles(time, false, zoomAnchorWasActive)) moving = true
    for (const runtime of this.nodes.values()) {
      if (runtime.lod === 'title') {
        this.updateBubbleWorldSize(runtime)
        runtime.currentVisualWidth = runtime.targetVisualWidth
        runtime.currentVisualHeight = runtime.targetVisualHeight
      } else {
        if (runtime.lod === 'card') this.updateCardWorldSize(runtime, true)
        runtime.currentVisualWidth = MathUtils.lerp(
          runtime.currentVisualWidth,
          runtime.targetVisualWidth,
          positionFactor,
        )
        runtime.currentVisualHeight = MathUtils.lerp(
          runtime.currentVisualHeight,
          runtime.targetVisualHeight,
          positionFactor,
        )
      }
      const targetHoverScale = runtime.id === this.hoveredNodeId
        ? HOVERED_NODE_VISUAL_SCALE
        : 1
      runtime.currentHoverScale = this.reducedMotion
        ? targetHoverScale
        : MathUtils.lerp(runtime.currentHoverScale, targetHoverScale, hoverFactor)
      runtime.sprite.scale.set(
        runtime.currentVisualWidth * runtime.currentHoverScale,
        runtime.currentVisualHeight * runtime.currentHoverScale,
        1,
      )
      this.updateBubbleSpriteOffset(runtime)
      runtime.group.position.copy(runtime.currentPosition)
      this.updateNodePresentation(runtime)
      if (
        Math.abs(runtime.currentVisualWidth - runtime.targetVisualWidth) > SETTLE_EPSILON
        || Math.abs(runtime.currentVisualHeight - runtime.targetVisualHeight) > SETTLE_EPSILON
        || Math.abs(runtime.currentHoverScale - targetHoverScale) > SETTLE_EPSILON
      ) moving = true
    }
    this.updateDomainLabelPresentation()
    if (this.hoverPointer && !this.pointerGesture) this.updateHoveredNodeAtPointer()
    this.updateHoverLabelPresentation()

    return moving
  }

  private updateSceneObjects() {
    for (const runtime of this.nodes.values()) {
      runtime.group.position.copy(runtime.currentPosition)
      runtime.group.scale.setScalar(runtime.currentScale)
    }
    this.edgePositionsDirty = true
    this.edgeOpacitiesDirty = true
    this.flushEdgeBatch()
    this.fieldMatricesDirty = true
    this.fieldOpacitiesDirty = true
    this.flushFieldBatch()
    this.resolveNodeBubbles(
      performance.now(),
      !this.bubbleLayoutInitialized,
    )
    for (const runtime of this.nodes.values()) {
      if (runtime.lod === 'title') {
        this.updateBubbleWorldSize(runtime)
        runtime.currentVisualWidth = runtime.targetVisualWidth
        runtime.currentVisualHeight = runtime.targetVisualHeight
      } else if (runtime.lod === 'card') {
        this.updateCardWorldSize(runtime, true)
      }
      runtime.group.position.copy(runtime.currentPosition)
      runtime.sprite.scale.set(
        runtime.currentVisualWidth * runtime.currentHoverScale,
        runtime.currentVisualHeight * runtime.currentHoverScale,
        1,
      )
      this.updateBubbleSpriteOffset(runtime)
      this.updateNodePresentation(runtime)
    }
    this.updateDomainLabelPresentation()
    this.nodeHaloMatricesDirty = true
    this.nodeHaloOpticalDensitiesDirty = true
    this.flushNodeHaloBatch()
    this.updateHoverLabelPresentation()
  }

  private bindEvents() {
    const canvas = this.renderer.domElement
    canvas.addEventListener('pointerdown', this.handlePointerDown)
    canvas.addEventListener('pointerenter', this.handlePointerEnter)
    canvas.addEventListener('pointermove', this.handlePointerMove)
    canvas.addEventListener('pointerup', this.handlePointerUp)
    canvas.addEventListener('pointercancel', this.handlePointerCancel)
    canvas.addEventListener('pointerleave', this.handlePointerLeave)
    canvas.addEventListener('dblclick', this.handleDoubleClick)
    canvas.addEventListener('wheel', this.handleWheel, { passive: false })
    canvas.addEventListener('contextmenu', this.handleContextMenu)
    window.addEventListener('keydown', this.handleKeyDown)
    window.addEventListener('keyup', this.handleKeyUp)
    window.addEventListener('blur', this.handleWindowBlur)
  }

  private unbindEvents() {
    const canvas = this.renderer.domElement
    canvas.removeEventListener('pointerdown', this.handlePointerDown)
    canvas.removeEventListener('pointerenter', this.handlePointerEnter)
    canvas.removeEventListener('pointermove', this.handlePointerMove)
    canvas.removeEventListener('pointerup', this.handlePointerUp)
    canvas.removeEventListener('pointercancel', this.handlePointerCancel)
    canvas.removeEventListener('pointerleave', this.handlePointerLeave)
    canvas.removeEventListener('dblclick', this.handleDoubleClick)
    canvas.removeEventListener('wheel', this.handleWheel)
    canvas.removeEventListener('contextmenu', this.handleContextMenu)
    window.removeEventListener('keydown', this.handleKeyDown)
    window.removeEventListener('keyup', this.handleKeyUp)
    window.removeEventListener('blur', this.handleWindowBlur)
  }

  private handlePointerDown = (event: PointerEvent) => {
    if (event.button !== 0 && event.button !== 2) return
    if (this.pointerGesture) return
    const mode = event.button === 2 || event.altKey ? 'rotate' : 'pan'
    const rotationPivot = mode === 'rotate' ? this.rotationPivotForActiveScope() : null
    const pressedNodeId = mode === 'pan'
      ? this.pickNodeAtPointer(event.clientX, event.clientY)?.id ?? null
      : null
    this.renderer.domElement.setPointerCapture(event.pointerId)
    this.pointerGesture = {
      id: event.pointerId,
      button: event.button,
      mode,
      rotationPivot,
      pressedNodeId,
      startX: event.clientX,
      startY: event.clientY,
      lastX: event.clientX,
      lastY: event.clientY,
      moved: false,
    }
    this.clearHoveredNode()
    this.renderer.domElement.style.cursor = this.pointerGesture.mode === 'rotate' ? 'grabbing' : 'move'
    this.requestRender()
  }

  private handlePointerEnter = () => {
    this.pointerInside = true
  }

  private handlePointerMove = (event: PointerEvent) => {
    this.pointerInside = true
    const gesture = this.pointerGesture
    if (!gesture) {
      this.hoverPointer = { clientX: event.clientX, clientY: event.clientY }
      this.updateHoveredNodeAtPointer()
      return
    }
    if (gesture.id !== event.pointerId) return
    const dx = event.clientX - gesture.lastX
    const dy = event.clientY - gesture.lastY
    gesture.lastX = event.clientX
    gesture.lastY = event.clientY
    if (Math.hypot(event.clientX - gesture.startX, event.clientY - gesture.startY) > CLICK_MOVEMENT_LIMIT) {
      gesture.moved = true
    }
    if (gesture.mode === 'pan') this.panCamera(dx, dy)
    else if (gesture.rotationPivot) this.rotateCamera(dx, dy, gesture.rotationPivot)
    this.requestRender()
  }

  private handlePointerUp = (event: PointerEvent) => {
    const gesture = this.pointerGesture
    if (!gesture || gesture.id !== event.pointerId) return
    this.renderer.domElement.releasePointerCapture(event.pointerId)
    this.pointerGesture = null
    this.renderer.domElement.style.cursor = ''
    if (!gesture.moved && gesture.button === 0) {
      this.handleClick(event.clientX, event.clientY, gesture.pressedNodeId)
    }
    this.hoverPointer = { clientX: event.clientX, clientY: event.clientY }
    this.updateHoveredNodeAtPointer()
    this.closeLinearAlgebraIconIfInactive()
    this.requestRender()
  }

  private handlePointerCancel = (event: PointerEvent) => {
    if (this.pointerGesture?.id !== event.pointerId) return
    this.pointerGesture = null
    this.hoverPointer = null
    this.renderer.domElement.style.cursor = ''
    this.clearHoveredNode()
    this.closeLinearAlgebraIconIfInactive()
  }

  private handlePointerLeave = () => {
    this.pointerInside = false
    if (this.pointerGesture) return
    this.hoverPointer = null
    this.clearHoveredNode()
  }

  private handleDoubleClick = (event: MouseEvent) => {
    if (event.button !== 0) return
    const runtime = this.pickNodeAtPointer(event.clientX, event.clientY)
    if (!runtime) return
    const subspace = this.armSubspace(runtime.id)
    const owner = subspace ? this.nodes.get(subspace.definition.ownerNodeId) : null
    if (!subspace || !owner) return
    event.preventDefault()
    this.clearHoveredNode()
    this.targetGlobalZoom = subspaceEntryZoom(
      this.camera.zoom,
      this.projectedCardHeight(owner),
      subspace.revealEndPx,
      subspace.definition.scopeEnterZoom,
      MAX_GLOBAL_ZOOM,
    )
    this.activeZoomAnchor = owner.currentPosition.clone()
    if (this.reducedMotion) {
      this.applyGlobalZoomStep(this.targetGlobalZoom)
      this.activeZoomAnchor = null
    }
    this.requestRender()
  }

  private handleWheel = (event: WheelEvent) => {
    event.preventDefault()
    const anchor = this.zoomAnchorUnderPointer(event.clientX, event.clientY)
    this.armSubspaceForWheel(anchor.nodeId, event.deltaY < 0)
    const nextZoom = nextGlobalZoom(
      this.targetGlobalZoom,
      event.deltaY,
      event.deltaMode,
      event.ctrlKey,
    )
    if (Math.abs(nextZoom - this.targetGlobalZoom) < 1e-8) return
    this.targetGlobalZoom = nextZoom
    this.activeZoomAnchor = anchor.point
    if (this.reducedMotion) {
      this.applyGlobalZoomStep(this.targetGlobalZoom)
      this.activeZoomAnchor = null
    }
    this.requestRender()
  }

  private handleKeyDown = (event: KeyboardEvent) => {
    if (
      !this.walkingMode
      || !this.pointerInside
      || !WALK_CODES.has(event.code)
      || this.isTextEntryTarget(event.target)
    ) return
    event.preventDefault()
    this.movementKeys.add(event.code)
    this.clearHoveredNode()
    this.requestRender()
  }

  private handleKeyUp = (event: KeyboardEvent) => {
    if (!WALK_CODES.has(event.code)) return
    const wasMoving = this.movementKeys.delete(event.code)
    if (wasMoving) event.preventDefault()
  }

  private handleWindowBlur = () => {
    this.movementKeys.clear()
  }

  private isTextEntryTarget(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) return false
    return target.isContentEditable
      || target instanceof HTMLInputElement
      || target instanceof HTMLTextAreaElement
      || target instanceof HTMLSelectElement
  }

  private setRayFromClient(clientX: number, clientY: number): boolean {
    const bounds = this.renderer.domElement.getBoundingClientRect()
    if (bounds.width <= 0 || bounds.height <= 0) return false
    this.pointer.x = ((clientX - bounds.left) / bounds.width) * 2 - 1
    this.pointer.y = -((clientY - bounds.top) / bounds.height) * 2 + 1
    this.camera.updateMatrixWorld()
    this.raycaster.setFromCamera(this.pointer, this.camera)
    return true
  }

  private interactiveNodeRuntimes(): NodeRuntime[] {
    return [...this.nodes.values()].filter(({ group, sprite, displayOpacity }) => group.visible
      && displayOpacity > 0.025
      && sprite.userData.interactive === true)
  }

  private pickNodeAtPointer(clientX: number, clientY: number): NodeRuntime | null {
    if (!this.setRayFromClient(clientX, clientY)) return null
    const candidates = this.interactiveNodeRuntimes()
    const hits = this.raycaster.intersectObjects(
      candidates.filter(({ sprite }) => sprite.visible).map(({ sprite }) => sprite),
      false,
    )
    const hit = this.preferredNodeHit(hits)
    const hitNodeId = hit?.object.userData.nodeId
    if (typeof hitNodeId === 'string') return this.nodes.get(hitNodeId) ?? null

    const bounds = this.renderer.domElement.getBoundingClientRect()
    let closest: { runtime: NodeRuntime; screenDistance: number; cameraDistance: number } | null = null
    for (const runtime of candidates) {
      const point = runtime.currentPosition.clone().project(this.camera)
      if (point.z < -1 || point.z > 1) continue
      const screenX = bounds.left + (point.x * 0.5 + 0.5) * bounds.width
      const screenY = bounds.top + (-point.y * 0.5 + 0.5) * bounds.height
      const screenDistance = Math.hypot(clientX - screenX, clientY - screenY)
      if (screenDistance > FAR_NODE_HIT_RADIUS_PX) continue
      const cameraDistance = this.camera.position.distanceTo(runtime.currentPosition)
      if (
        !closest
        || screenDistance < closest.screenDistance - 0.5
        || (Math.abs(screenDistance - closest.screenDistance) <= 0.5
          && cameraDistance < closest.cameraDistance)
      ) {
        closest = { runtime, screenDistance, cameraDistance }
      }
    }
    return closest?.runtime ?? null
  }

  private zoomAnchorUnderPointer(clientX: number, clientY: number): ZoomAnchor {
    if (!this.setRayFromClient(clientX, clientY)) {
      return { point: this.lookAt.clone(), nodeId: null }
    }
    const hits = this.raycaster.intersectObjects(
      this.interactiveNodeRuntimes()
        .filter(({ sprite }) => sprite.visible)
        .map(({ sprite }) => sprite),
      false,
    )
    const preferredHit = this.preferredNodeHit(hits)
    if (preferredHit?.point) {
      const nodeId = preferredHit.object.userData.nodeId
      return {
        point: preferredHit.point.clone(),
        nodeId: typeof nodeId === 'string' ? nodeId : null,
      }
    }

    const nearbyNode = this.pickNodeAtPointer(clientX, clientY)
    const forward = new Vector3()
    this.camera.getWorldDirection(forward)
    const anchorPlanePoint = nearbyNode?.currentPosition ?? this.lookAt
    this.pointerPlane.setFromNormalAndCoplanarPoint(forward, anchorPlanePoint)
    return {
      point: this.raycaster.ray.intersectPlane(this.pointerPlane, new Vector3())
        ?? anchorPlanePoint.clone(),
      nodeId: nearbyNode?.id ?? null,
    }
  }

  private applyGlobalZoomStep(nextZoom: number) {
    const previousZoom = this.camera.zoom
    if (Math.abs(nextZoom - previousZoom) < 1e-8) return

    if (this.activeZoomAnchor) {
      this.camera.lookAt(this.lookAt)
      this.camera.updateMatrixWorld()
      const cameraSpaceAnchor = this.activeZoomAnchor.clone().applyMatrix4(this.camera.matrixWorldInverse)
      const compensation = zoomPanCompensation(
        cameraSpaceAnchor.x,
        cameraSpaceAnchor.y,
        previousZoom,
        nextZoom,
      )
      const right = new Vector3().setFromMatrixColumn(this.camera.matrixWorld, 0).normalize()
      const up = new Vector3().setFromMatrixColumn(this.camera.matrixWorld, 1).normalize()
      const offset = right.multiplyScalar(compensation.x).add(up.multiplyScalar(compensation.y))
      this.camera.position.add(offset)
      this.lookAt.add(offset)
      this.targetCameraPosition.add(offset)
      this.targetLookAt.add(offset)
    }

    this.camera.zoom = nextZoom
    this.camera.updateProjectionMatrix()
    this.camera.updateMatrixWorld()
  }

  private updateHoveredNodeAtPointer() {
    if (!this.hoverPointer || this.pointerGesture) {
      this.clearHoveredNode()
      return
    }
    const runtime = this.pickNodeAtPointer(this.hoverPointer.clientX, this.hoverPointer.clientY)
    const nextId = runtime?.id ?? null
    this.renderer.domElement.style.cursor = runtime ? 'pointer' : ''
    if (nextId === this.hoveredNodeId) return
    const previousId = this.hoveredNodeId
    this.hoveredNodeId = nextId
    this.handleLinearAlgebraHoverChange(previousId, nextId)
    this.refreshNodeTexture(previousId)
    this.refreshNodeTexture(nextId)
    if (!runtime || !nextId || runtime.lod !== 'glow') {
      this.hoverLabelSprite.visible = false
    } else {
      this.hoverLabelMaterial.map = this.bubbleTextureForNode(runtime)
      this.hoverLabelMaterial.needsUpdate = true
      this.hoverLabelSprite.visible = true
    }
    this.requestRender()
  }

  private clearHoveredNode() {
    if (this.hoveredNodeId === null && !this.hoverLabelSprite.visible) return
    const previousId = this.hoveredNodeId
    this.hoveredNodeId = null
    this.hoverLabelSprite.visible = false
    this.handleLinearAlgebraHoverChange(previousId, null)
    this.refreshNodeTexture(previousId)
    if (!this.pointerGesture) this.renderer.domElement.style.cursor = ''
    this.requestRender()
  }

  private refreshNodeTexture(nodeId: string | null) {
    if (!nodeId) return
    const runtime = this.nodes.get(nodeId)
    if (!runtime) return
    runtime.material.map = this.textureForBubblePresentation(runtime, runtime.lod)
    runtime.material.needsUpdate = true
  }

  private handleLinearAlgebraSelectionChange(selected: boolean) {
    const runtime = this.nodes.get(LINEAR_ALGEBRA_NODE_ID)
    if (!selected) {
      this.linearAlgebraSelectionOpenPending = false
      this.setLinearAlgebraIconTarget(0)
      return
    }
    if (runtime?.lod === 'card') {
      this.linearAlgebraSelectionOpenPending = false
      this.setLinearAlgebraIconTarget(1)
      return
    }
    this.linearAlgebraSelectionOpenPending = true
  }

  private handleLinearAlgebraHoverChange(previousId: string | null, nextId: string | null) {
    const runtime = this.nodes.get(LINEAR_ALGEBRA_NODE_ID)
    if (nextId === LINEAR_ALGEBRA_NODE_ID && previousId !== LINEAR_ALGEBRA_NODE_ID) {
      if (runtime?.lod === 'card') this.setLinearAlgebraIconTarget(1)
      return
    }
    if (previousId !== LINEAR_ALGEBRA_NODE_ID || nextId === LINEAR_ALGEBRA_NODE_ID) return
    const pressedLinearAlgebraCard = this.pointerGesture?.pressedNodeId === LINEAR_ALGEBRA_NODE_ID
    if (!runtime?.selected && !pressedLinearAlgebraCard) this.setLinearAlgebraIconTarget(0)
  }

  private closeLinearAlgebraIconIfInactive() {
    const runtime = this.nodes.get(LINEAR_ALGEBRA_NODE_ID)
    const active = runtime?.selected === true
      || this.hoveredNodeId === LINEAR_ALGEBRA_NODE_ID
      || this.pointerGesture?.pressedNodeId === LINEAR_ALGEBRA_NODE_ID
    if (!active) this.setLinearAlgebraIconTarget(0)
  }

  private setLinearAlgebraIconTarget(target: 0 | 1) {
    if (
      this.linearAlgebraIconTarget === target
      && (this.linearAlgebraIconAnimating || Math.abs(this.linearAlgebraIconProgress - target) < 0.0001)
    ) return

    const now = performance.now()
    this.advanceLinearAlgebraIcon(now)
    this.linearAlgebraIconTarget = target
    if (this.reducedMotion) {
      this.linearAlgebraIconProgress = target
      this.linearAlgebraIconStartProgress = target
      this.linearAlgebraIconDurationMs = 0
      this.linearAlgebraIconAnimating = false
      this.redrawLinearAlgebraCardTextures()
      this.requestRender()
      return
    }

    const distance = Math.abs(target - this.linearAlgebraIconProgress)
    this.linearAlgebraIconStartProgress = this.linearAlgebraIconProgress
    this.linearAlgebraIconStartedAt = now
    this.linearAlgebraIconDurationMs = LINEAR_ALGEBRA_ICON_ONE_WAY_MS * distance
    this.linearAlgebraIconAnimating = distance > 0.0001
    this.requestRender()
  }

  private advanceLinearAlgebraIcon(time: number): boolean {
    if (!this.linearAlgebraIconAnimating) return false
    const normalizedTime = this.linearAlgebraIconDurationMs <= 0
      ? 1
      : MathUtils.clamp(
          (time - this.linearAlgebraIconStartedAt) / this.linearAlgebraIconDurationMs,
          0,
          1,
        )
    const eased = normalizedTime < 0.5
      ? 4 * normalizedTime * normalizedTime * normalizedTime
      : 1 - Math.pow(-2 * normalizedTime + 2, 3) / 2
    this.linearAlgebraIconProgress = this.linearAlgebraIconStartProgress
      + (this.linearAlgebraIconTarget - this.linearAlgebraIconStartProgress) * eased
    if (normalizedTime >= 1) {
      this.linearAlgebraIconProgress = this.linearAlgebraIconTarget
      this.linearAlgebraIconAnimating = false
    }
    this.redrawLinearAlgebraCardTextures()
    return this.linearAlgebraIconAnimating
  }

  private redrawLinearAlgebraCardTextures() {
    const runtime = this.nodes.get(LINEAR_ALGEBRA_NODE_ID)
    if (!runtime) return
    const domain = this.domains.get(runtime.projection.node.primaryDomain)
    if (!domain) return
    const redraw = (texture: Texture | null, selected: boolean, related: boolean) => {
      if (!texture) return
      redrawKnowledgeCardTexture(
        texture,
        runtime.projection.node,
        domain,
        selected,
        this.colorTheme,
        related,
        this.linearAlgebraIconProgress,
      )
    }
    redraw(runtime.cardTexture, false, false)
    redraw(runtime.selectedCardTexture, true, false)
    redraw(runtime.relatedCardTexture, false, true)
  }

  private updateHoverLabelPresentation() {
    if (!this.hoveredNodeId) {
      this.hoverLabelSprite.visible = false
      return
    }
    const runtime = this.nodes.get(this.hoveredNodeId)
    if (
      !runtime
      || runtime.sprite.userData.interactive !== true
      || runtime.displayOpacity <= 0.025
    ) {
      this.clearHoveredNode()
      return
    }
    if (runtime.lod !== 'glow') {
      this.hoverLabelSprite.visible = false
      return
    }
    const depth = this.cameraSpaceDepth(runtime.currentPosition)
    const viewportHeight = Math.max(1, this.renderer.domElement.clientHeight)
    const worldUnitsPerPixel = 2 * depth * Math.tan(MathUtils.degToRad(this.camera.fov * 0.5))
      / (viewportHeight * this.camera.zoom)
    const cameraUp = this.bubbleCameraUpScratch
      .setFromMatrixColumn(this.camera.matrixWorld, 1)
      .normalize()
    this.hoverLabelSprite.position.copy(runtime.currentPosition)
      .addScaledVector(cameraUp, KNOWLEDGE_BUBBLE_CENTER_OFFSET_PX * worldUnitsPerPixel)
    this.hoverLabelSprite.scale.set(
      runtime.bubblePixelWidth * worldUnitsPerPixel,
      runtime.bubblePixelHeight * worldUnitsPerPixel,
      1,
    )
    this.hoverLabelMaterial.opacity = MathUtils.clamp(runtime.displayOpacity, 0.72, 1)
    this.hoverLabelSprite.visible = true
  }

  private handleContextMenu = (event: MouseEvent) => {
    event.preventDefault()
  }

  private panCamera(dx: number, dy: number) {
    const distance = this.camera.position.distanceTo(this.lookAt)
    const scale = distance * 0.00135 / this.camera.zoom
    const right = new Vector3().setFromMatrixColumn(this.camera.matrixWorld, 0)
    const up = new Vector3().setFromMatrixColumn(this.camera.matrixWorld, 1)
    const offset = right.multiplyScalar(-dx * scale).add(up.multiplyScalar(dy * scale))
    this.camera.position.add(offset)
    this.lookAt.add(offset)
    this.targetCameraPosition.add(offset)
    this.targetLookAt.add(offset)
  }

  private advanceWalking(deltaSeconds: number): boolean {
    if (!this.walkingMode || this.movementKeys.size === 0) return false
    const forward = this.lookAt.clone().sub(this.camera.position)
    forward.y = 0
    if (forward.lengthSq() < 1e-8) forward.set(0, 0, -1)
    else forward.normalize()
    const worldUp = new Vector3(0, 1, 0)
    const right = forward.clone().cross(worldUp).normalize()
    const movement = new Vector3()
    if (this.movementKeys.has('KeyW')) movement.add(forward)
    if (this.movementKeys.has('KeyS')) movement.sub(forward)
    if (this.movementKeys.has('KeyD')) movement.add(right)
    if (this.movementKeys.has('KeyA')) movement.sub(right)
    if (this.movementKeys.has('KeyQ')) movement.add(worldUp)
    if (this.movementKeys.has('KeyE')) movement.sub(worldUp)
    if (movement.lengthSq() < 1e-8) return false
    const baseSpeed = MathUtils.clamp(
      this.targetCameraDistance * WALK_DISTANCE_FACTOR,
      WALK_MIN_SPEED,
      WALK_MAX_SPEED,
    )
    const speed = baseSpeed / this.camera.zoom
    movement.normalize().multiplyScalar(speed * Math.min(deltaSeconds, 0.05))
    this.camera.position.add(movement)
    this.lookAt.add(movement)
    this.targetCameraPosition.add(movement)
    this.targetLookAt.add(movement)
    return true
  }

  private rotateCamera(dx: number, dy: number, pivot: Vector3) {
    if (Math.abs(dx) < 1e-8 && Math.abs(dy) < 1e-8) return
    this.camera.updateMatrixWorld()
    const worldUp = new Vector3(0, 1, 0)
    const yaw = new Quaternion().setFromAxisAngle(worldUp, -dx * 0.006)
    const pitchAxis = new Vector3()
      .setFromMatrixColumn(this.camera.matrixWorld, 0)
      .normalize()
      .applyQuaternion(yaw)
    const forwardAfterYaw = this.lookAt.clone()
      .sub(this.camera.position)
      .normalize()
      .applyQuaternion(yaw)
    const currentElevation = Math.asin(MathUtils.clamp(forwardAfterYaw.dot(worldUp), -1, 1))
    const maxElevation = Math.PI * 0.5 - 0.28
    const nextElevation = MathUtils.clamp(
      currentElevation - dy * 0.005,
      -maxElevation,
      maxElevation,
    )
    const pitch = new Quaternion().setFromAxisAngle(
      pitchAxis,
      nextElevation - currentElevation,
    )
    const rotation = pitch.multiply(yaw)
    this.camera.position.sub(pivot).applyQuaternion(rotation).add(pivot)
    this.lookAt.sub(pivot).applyQuaternion(rotation).add(pivot)
    this.targetCameraPosition.copy(this.camera.position)
    this.targetLookAt.copy(this.lookAt)
    this.targetCameraDistance = this.camera.position.distanceTo(this.lookAt)
    this.camera.lookAt(this.lookAt)
    this.camera.updateMatrixWorld()
  }

  private handleClick(clientX: number, clientY: number, pressedNodeId: string | null = null) {
    const pressedRuntime = pressedNodeId ? this.nodes.get(pressedNodeId) : null
    const runtime = pressedRuntime?.sprite.userData.interactive === true
      ? pressedRuntime
      : this.pickNodeAtPointer(clientX, clientY)
    if (runtime) {
      this.rememberNodeInteraction(runtime)
      this.callbacks.onSelectNode?.(runtime.id)
    }
    else this.callbacks.onBlankClick?.()
  }

  private publishCameraState() {
    const distance = this.camera.position.distanceTo(this.lookAt)
    const zoomPercent = globalZoomPercent(this.camera.zoom)
    const signature = `${distance.toFixed(2)}:${zoomPercent}`
    if (signature === this.cameraStateSignature) return
    this.cameraStateSignature = signature
    const state: ThreeKnowledgeCameraState = { distance, zoomPercent }
    this.callbacks.onCameraChange?.(state)
  }
}
