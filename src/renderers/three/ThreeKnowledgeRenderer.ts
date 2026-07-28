import {
  AddEquation,
  BufferGeometry,
  Color,
  CustomBlending,
  DynamicDrawUsage,
  Group,
  InstancedBufferAttribute,
  InstancedMesh,
  Line,
  LineBasicMaterial,
  LinearFilter,
  Matrix4,
  MathUtils,
  Mesh,
  OneFactor,
  OneMinusDstColorFactor,
  OneMinusSrcAlphaFactor,
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
import {
  createKnowledgeCardTexture,
  createKnowledgeTitleTexture,
  createNodeGlowTexture,
} from './cardTexture'
import {
  dampGlobalZoom,
  globalZoomPercent,
  isGlobalZoomSettled,
  nextGlobalZoom,
  zoomPanCompensation,
} from './globalZoom'
import {
  SUBSPACE_SCOPE_ENTER_PROGRESS,
  SUBSPACE_SCOPE_EXIT_PROGRESS,
  createSubspaceRevealRange,
  parentScopeWeight,
  subspaceRevealProgress,
} from './subspaceLod'
import {
  RELATED_NODE_LODS,
  RELATED_NODE_MIN_OPACITY,
} from './selectionFocus'
import type {
  SpaceColorTheme,
  ThreeKnowledgeCameraState,
  ThreeKnowledgeRendererCallbacks,
  ThreeKnowledgeRendererOptions,
  ThreeKnowledgeSubspace,
} from './types'

const CARD_WIDTH = 4.1
const CARD_HEIGHT = 1.54
const TITLE_WIDTH = 3.2
const TITLE_HEIGHT = 0.8
const GLOW_SIZE = 0.68
const CLICK_MOVEMENT_LIMIT = 6
const SETTLE_EPSILON = 0.0015
const FAR_LOD_MAX_PX = 24
const TITLE_LOD_MAX_PX = 62
const HIDDEN_OPACITY_EPSILON = 0.001
const LABEL_COLLISION_PADDING_PX = 5
const HOVER_LABEL_WIDTH_PX = 168
const HOVER_LABEL_HEIGHT_PX = 42
const HOVER_LABEL_OFFSET_PX = 34
const FAR_NODE_HIT_RADIUS_PX = 10
const WALK_MIN_SPEED = 4
const WALK_MAX_SPEED = 22
const WALK_DISTANCE_FACTOR = 0.42
const FIELD_RENDER_SCALE = 0.42

const WALK_CODES = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyQ', 'KeyE'])

type NodeLod = 'glow' | 'title' | 'card'

interface NodeRuntime {
  id: string
  subspaceId: string | null
  group: Group
  sprite: Sprite
  material: SpriteMaterial
  cardTexture: Texture | null
  selectedCardTexture: Texture | null
  relatedCardTexture: Texture | null
  titleTexture: Texture | null
  selectedTitleTexture: Texture | null
  relatedTitleTexture: Texture | null
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
}

interface EdgeRuntime {
  id: string
  subspaceId: string | null
  sourceId: string
  targetId: string
  line: Line
  material: LineBasicMaterial
  projection: ProjectedKnowledgeEdge
  currentOpacity: number
  targetOpacity: number
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
  mesh: InstancedMesh<PlaneGeometry, ShaderMaterial>
  material: ShaderMaterial
  opacityAttribute: InstancedBufferAttribute
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
    if (child instanceof Line) {
      child.geometry.dispose()
      child.material.dispose()
    }
  })
}

function edgeColor(edge: ProjectedKnowledgeEdge): string {
  switch (edge.edge.type) {
    case 'prerequisite':
      return '#5b625e'
    case 'application':
      return '#7b6a4e'
    case 'shared-model':
      return '#4d7773'
    case 'analogy':
      return '#777080'
    case 'historical':
      return '#947861'
  }
}

function displayEdgeOpacity(edge: ProjectedKnowledgeEdge, selectedNodeId: string | null): number {
  const base = edge.opacity * 0.24
  if (!selectedNodeId) return base
  const connected = edge.edge.source === selectedNodeId || edge.edge.target === selectedNodeId
  return connected ? Math.min(0.72, 0.2 + edge.opacity * 0.62) : base * 0.12
}

function displayFieldOpacity(field: ProjectedKnowledgeField): number {
  return field.kind === 'domain'
    ? Math.min(0.055, field.opacity * 0.52)
    : Math.min(0.026, field.opacity * 0.58)
}

function createVolumeMaterial(color: string, opacity: number): ShaderMaterial {
  return new ShaderMaterial({
    uniforms: {
      uColor: { value: new Color(color) },
      uOpacity: { value: opacity },
    },
    vertexShader: `
      attribute float instanceOpacity;
      varying vec2 vSplatPosition;
      varying float vInstanceOpacity;
      void main() {
        vec4 centerView = modelViewMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
        float radius = length(instanceMatrix[0].xyz);
        vec4 viewPosition = centerView + vec4(position.xy * radius, 0.0, 0.0);
        vSplatPosition = position.xy;
        vInstanceOpacity = instanceOpacity;
        gl_Position = projectionMatrix * viewPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      uniform float uOpacity;
      varying vec2 vSplatPosition;
      varying float vInstanceOpacity;
      void main() {
        float radiusSquared = dot(vSplatPosition, vSplatPosition);
        if (radiusSquared >= 1.0) discard;
        float remaining = 1.0 - radiusSquared;
        float smoothDensity = remaining * remaining * remaining
          * (remaining * (remaining * 6.0 - 15.0) + 10.0);
        float boundedDensity = 1.0 - exp(-0.72 * smoothDensity);
        float alpha = uOpacity * vInstanceOpacity * boundedDensity;
        if (alpha <= 0.00035) discard;
        gl_FragColor = vec4(uColor * alpha, alpha);
      }
    `,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    premultipliedAlpha: true,
    blending: CustomBlending,
    blendEquation: AddEquation,
    blendSrc: OneMinusDstColorFactor,
    blendDst: OneFactor,
    blendEquationAlpha: AddEquation,
    blendSrcAlpha: OneFactor,
    blendDstAlpha: OneMinusSrcAlphaFactor,
    toneMapped: false,
  })
}

function createFieldCompositeMaterial(texture: Texture): ShaderMaterial {
  return new ShaderMaterial({
    uniforms: { uFieldTexture: { value: texture } },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position.xy, 0.0, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D uFieldTexture;
      varying vec2 vUv;
      void main() {
        gl_FragColor = texture2D(uFieldTexture, vUv);
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
  private readonly fieldScene = new Scene()
  private readonly fieldRenderTarget = new WebGLRenderTarget(1, 1, {
    minFilter: LinearFilter,
    magFilter: LinearFilter,
    depthBuffer: false,
    stencilBuffer: false,
  })
  private readonly fieldCompositeMaterial = createFieldCompositeMaterial(this.fieldRenderTarget.texture)
  private readonly fieldCompositeMesh = new Mesh(
    new PlaneGeometry(2, 2, 1, 1),
    this.fieldCompositeMaterial,
  )
  private readonly edgeLayer = new Group()
  private readonly nodeLayer = new Group()
  private readonly raycaster = new Raycaster()
  private readonly pointer = new Vector2()
  private readonly pointerPlane = new Plane()
  private readonly nodes = new Map<string, NodeRuntime>()
  private readonly edges = new Map<string, EdgeRuntime>()
  private readonly fields = new Map<string, FieldRuntime>()
  private readonly subspaces = new Map<string, SubspaceRuntime>()
  private readonly selectedNeighborIds = new Set<string>()
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
  private projection: KnowledgeSpaceProjection
  private hasPresentedProjection = false
  private frameRequest: number | null = null
  private lastFrameTime = 0
  private pointerGesture: PointerGesture | null = null
  private pointerInside = false
  private hoverPointer: { clientX: number; clientY: number } | null = null
  private hoveredNodeId: string | null = null
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
    this.renderer.domElement.setAttribute('aria-label', '三维知识空间；拖拽平移，滚轮指针定点缩放，按住 Alt 拖拽或右键拖拽时围绕知识球心旋转，行走模式使用 WASD、Q 和 E')
    this.renderer.domElement.style.touchAction = 'none'
    this.renderer.domElement.style.display = 'block'
    this.renderer.domElement.style.width = '100%'
    this.renderer.domElement.style.height = '100%'
    this.host.appendChild(this.renderer.domElement)

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

    this.fieldCompositeMesh.renderOrder = -10
    this.fieldCompositeMesh.frustumCulled = false
    this.fieldCompositeMesh.raycast = () => undefined
    this.edgeLayer.renderOrder = 1
    this.nodeLayer.renderOrder = 2
    this.hoverLabelSprite.visible = false
    this.hoverLabelSprite.renderOrder = 20
    this.hoverLabelSprite.frustumCulled = false
    this.hoverLabelSprite.raycast = () => undefined
    this.nodeLayer.add(this.hoverLabelSprite)
    this.fieldScene.add(this.fieldLayer)
    this.scene.add(this.fieldCompositeMesh, this.edgeLayer, this.nodeLayer)
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
      runtime.targetOpacity = visible ? displayFieldOpacity(runtime.projection) : 0
      if (this.reducedMotion) {
        runtime.currentOpacity = runtime.targetOpacity
        runtime.material.uniforms.uOpacity.value = runtime.currentOpacity
      }
      this.updateFieldVisibility(runtime)
    }
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
      runtime.cardTexture = null
      runtime.selectedCardTexture = null
      runtime.relatedCardTexture = null
      runtime.titleTexture = null
      runtime.selectedTitleTexture = null
      runtime.relatedTitleTexture = null
      runtime.material.map = this.textureForLod(runtime, runtime.lod, runtime.selected)
      runtime.material.needsUpdate = true
    }
    if (this.hoveredNodeId) {
      const runtime = this.nodes.get(this.hoveredNodeId)
      if (runtime) {
        this.hoverLabelMaterial.map = this.textureForLod(runtime, 'title', false)
        this.hoverLabelMaterial.needsUpdate = true
      }
    }
    this.requestRender()
  }

  setSelectedNodeId(nodeId: string | null) {
    if (nodeId === this.selectedNodeId) return
    const previous = this.selectedNodeId
    this.selectedNodeId = nodeId
    if (previous) this.refreshCardSelection(previous)
    if (nodeId) this.refreshCardSelection(nodeId)
    for (const runtime of this.edges.values()) {
      const sourceVisible = this.nodes.get(runtime.sourceId)?.projection.visible === true
      const targetVisible = this.nodes.get(runtime.targetId)?.projection.visible === true
      runtime.targetOpacity = sourceVisible && targetVisible
        ? displayEdgeOpacity(runtime.projection, nodeId)
        : 0
    }
    this.refreshSelectionNeighborhood()
    this.requestRender()
  }

  setProjection(projection: KnowledgeSpaceProjection, immediate = false) {
    const firstPresentation = !this.hasPresentedProjection
    const snap = immediate || firstPresentation || this.reducedMotion
    const previousLensId = this.projection.lens.id
    this.projection = projection
    this.projectionCenter.copy(toVector3(projection.lens.cameraTarget))
    this.domains.clear()
    for (const field of projection.fields) {
      if (field.domain) this.domains.set(field.domain.id, field.domain)
    }

    const activeNodeIds = new Set(projection.nodes.map(({ node }) => node.id))
    const visibleNodeIds = new Set(
      projection.nodes.filter((projected) => projected.visible).map(({ node }) => node.id),
    )
    for (const projected of projection.nodes) {
      const runtime = this.nodes.get(projected.node.id) ?? this.createNode(projected)
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
      const endpointsVisible = visibleNodeIds.has(projected.edge.source)
        && visibleNodeIds.has(projected.edge.target)
      runtime.targetOpacity = endpointsVisible
        ? displayEdgeOpacity(projected, this.selectedNodeId)
        : 0
      if (snap) runtime.currentOpacity = runtime.targetOpacity
    }
    for (const runtime of this.edges.values()) {
      if (runtime.subspaceId) continue
      if (!activeEdgeIds.has(runtime.id)) runtime.targetOpacity = 0
    }
    this.updateSubspaceTargets(snap)
    this.refreshSelectionNeighborhood()

    const activeFieldIds = new Set(projection.fields.map(({ id }) => id))
    for (const projected of projection.fields) {
      const existing = this.fields.get(projected.id)
      const runtime = existing && this.fieldLobesMatch(existing, projected)
        ? existing
        : this.replaceField(existing, projected)
      this.updateFieldTargets(runtime, projected, snap)
    }
    for (const runtime of this.fields.values()) {
      if (!activeFieldIds.has(runtime.id)) {
        runtime.lobes.forEach((lobe) => { lobe.targetOpacity = 0 })
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
    }

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
    this.camera.aspect = safeWidth / safeHeight
    this.camera.updateProjectionMatrix()
    this.requestRender()
  }

  resetCamera(immediate = this.reducedMotion) {
    this.targetCameraPosition.copy(toVector3(this.projection.lens.cameraPosition))
    this.targetLookAt.copy(toVector3(this.projection.lens.cameraTarget))
    this.targetCameraDistance = this.targetCameraPosition.distanceTo(this.targetLookAt)
    this.targetGlobalZoom = 1
    this.activeZoomAnchor = null
    this.resetSubspaces(true)
    if (immediate) {
      this.camera.position.copy(this.targetCameraPosition)
      this.lookAt.copy(this.targetLookAt)
      this.camera.zoom = this.targetGlobalZoom
      this.camera.updateProjectionMatrix()
      this.camera.lookAt(this.lookAt)
      this.camera.updateMatrixWorld()
    }
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
      runtime.glowTexture?.dispose()
    }
    disposeObject(this.scene)
    disposeObject(this.fieldScene)
    this.scene.clear()
    this.fieldScene.clear()
    this.fieldRenderTarget.dispose()
    this.renderer.renderLists.dispose()
    this.renderer.dispose()
    this.renderer.forceContextLoss()
    this.renderer.domElement.remove()
    this.nodes.clear()
    this.edges.clear()
    this.fields.clear()
    this.subspaces.clear()
  }

  private initializeSubspaces(definitions: readonly ThreeKnowledgeSubspace[], snap: boolean) {
    for (const definition of definitions) {
      if (this.subspaces.has(definition.id)) {
        throw new Error(`三维知识空间包含重复子域：${definition.id}`)
      }
      if (!this.nodes.has(definition.ownerNodeId)) {
        throw new Error(`三维子域 ${definition.id} 缺少父节点：${definition.ownerNodeId}`)
      }
      const runtime: SubspaceRuntime = {
        definition,
        nodeIds: definition.nodes.map(({ node }) => node.id),
        edgeIds: definition.edges.map(({ id }) => id),
        progress: 0,
        armed: false,
        hasRevealed: false,
        revealStartPx: definition.revealStartPx,
        revealEndPx: definition.revealEndPx,
      }
      this.subspaces.set(definition.id, runtime)

      for (const child of definition.nodes) {
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
    }
    this.updateSubspaceTargets(snap)
    this.updateSceneObjects()
    this.requestRender()
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
    if (this.activeScopeId !== null) {
      this.activeScopeId = null
      if (notify) this.callbacks.onScopeChange?.(null)
    }
  }

  private publicScopeWeight(): number {
    let maximumProgress = 0
    for (const subspace of this.subspaces.values()) {
      maximumProgress = Math.max(maximumProgress, subspace.progress)
    }
    return parentScopeWeight(maximumProgress)
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

  private armSubspaceForWheel(nodeId: string | null, zoomingIn: boolean) {
    if (!zoomingIn) return
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
  }

  private updateSubspaceProgress(): boolean {
    let moving = false
    for (const subspace of this.subspaces.values()) {
      const previousProgress = subspace.progress
      const owner = this.nodes.get(subspace.definition.ownerNodeId)
      subspace.progress = subspace.armed && owner
        ? subspaceRevealProgress(
          this.projectedCardHeight(owner),
          subspace.revealStartPx,
          subspace.revealEndPx,
        )
        : 0
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
        subspace.progress >= SUBSPACE_SCOPE_ENTER_PROGRESS
        && this.activeScopeId !== subspace.definition.id
      ) {
        this.activeScopeId = subspace.definition.id
        this.callbacks.onScopeChange?.(this.activeScopeId)
      } else if (
        this.activeScopeId === subspace.definition.id
        && subspace.progress <= SUBSPACE_SCOPE_EXIT_PROGRESS
      ) {
        this.activeScopeId = null
        this.callbacks.onScopeChange?.(null)
      }
    }
    return moving
  }

  private createNode(projected: ProjectedKnowledgeNode, subspaceId: string | null = null): NodeRuntime {
    const domain = this.domains.get(projected.node.primaryDomain)
    if (!domain) throw new Error(`三维知识空间缺少领域定义：${projected.node.primaryDomain}`)
    const selected = projected.node.id === this.selectedNodeId
    const initialLod: NodeLod = selected ? 'card' : 'glow'
    const cardTexture: Texture | null = null
    const selectedCardTexture = selected
      ? createKnowledgeCardTexture(projected.node, domain, true, this.colorTheme)
      : null
    const glowTexture = selected ? null : createNodeGlowTexture(domain.color)
    const material = new SpriteMaterial({
      map: selected ? selectedCardTexture : glowTexture,
      transparent: true,
      depthWrite: false,
      depthTest: true,
      opacity: projected.opacity,
      toneMapped: false,
    })
    const sprite = new Sprite(material)
    const initialWidth = selected ? CARD_WIDTH : GLOW_SIZE
    const initialHeight = selected ? CARD_HEIGHT : GLOW_SIZE
    sprite.scale.set(initialWidth, initialHeight, 1)
    sprite.renderOrder = 3
    sprite.userData.nodeId = projected.node.id
    const group = new Group()
    group.add(sprite)
    group.position.copy(toVector3(projected.position))
    group.scale.setScalar(projected.scale)
    this.nodeLayer.add(group)
    const runtime: NodeRuntime = {
      id: projected.node.id,
      subspaceId,
      group,
      sprite,
      material,
      cardTexture,
      selectedCardTexture,
      relatedCardTexture: null,
      titleTexture: null,
      selectedTitleTexture: null,
      relatedTitleTexture: null,
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
    }
    this.nodes.set(runtime.id, runtime)
    return runtime
  }

  private createEdge(projected: ProjectedKnowledgeEdge, subspaceId: string | null = null): EdgeRuntime {
    const source = this.nodes.get(projected.edge.source)
    const target = this.nodes.get(projected.edge.target)
    const points = [source?.currentPosition ?? new Vector3(), target?.currentPosition ?? new Vector3()]
    const geometry = new BufferGeometry().setFromPoints(points)
    const material = new LineBasicMaterial({
      color: new Color(edgeColor(projected)),
      transparent: true,
      opacity: displayEdgeOpacity(projected, this.selectedNodeId),
      depthWrite: false,
      depthTest: true,
      toneMapped: false,
    })
    const line = new Line(geometry, material)
    line.renderOrder = 1
    line.frustumCulled = false
    this.edgeLayer.add(line)
    const runtime: EdgeRuntime = {
      id: projected.edge.id,
      subspaceId,
      sourceId: projected.edge.source,
      targetId: projected.edge.target,
      line,
      material,
      projection: projected,
      currentOpacity: displayEdgeOpacity(projected, this.selectedNodeId),
      targetOpacity: displayEdgeOpacity(projected, this.selectedNodeId),
    }
    this.edges.set(runtime.id, runtime)
    return runtime
  }

  private createField(projected: ProjectedKnowledgeField): FieldRuntime {
    const geometry = new PlaneGeometry(2, 2, 1, 1)
    const opacityAttribute = new InstancedBufferAttribute(
      new Float32Array(projected.lobes.length),
      1,
    )
    opacityAttribute.setUsage(DynamicDrawUsage)
    geometry.setAttribute('instanceOpacity', opacityAttribute)
    const baseOpacity = this.fieldsVisible ? displayFieldOpacity(projected) : 0
    const material = createVolumeMaterial(projected.color, baseOpacity)
    const mesh = new InstancedMesh(geometry, material, projected.lobes.length)
    mesh.instanceMatrix.setUsage(DynamicDrawUsage)
    mesh.renderOrder = projected.kind === 'domain' ? 0 : 1
    mesh.frustumCulled = false
    mesh.raycast = () => undefined
    this.fieldLayer.add(mesh)
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
      mesh,
      material,
      opacityAttribute,
      projection: projected,
      lobes,
      currentOpacity: baseOpacity,
      targetOpacity: baseOpacity,
      hasVisibleLobes: false,
      instancesAnimating: false,
    }
    material.uniforms.uOpacity.value = runtime.currentOpacity
    this.fields.set(runtime.id, runtime)
    this.writeFieldInstances(runtime)
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
      this.fieldLayer.remove(existing.mesh)
      existing.mesh.geometry.dispose()
      existing.material.dispose()
      this.fields.delete(existing.id)
    }
    return this.createField(projected)
  }

  private updateFieldTargets(
    runtime: FieldRuntime,
    projected: ProjectedKnowledgeField,
    snap: boolean,
  ) {
    runtime.projection = projected
    runtime.material.uniforms.uColor.value.set(projected.color)
    runtime.targetOpacity = this.fieldsVisible ? displayFieldOpacity(projected) : 0
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
    if (snap) {
      runtime.currentOpacity = runtime.targetOpacity
      runtime.material.uniforms.uOpacity.value = runtime.currentOpacity
      this.writeFieldInstances(runtime)
    }
  }

  private writeFieldInstances(runtime: FieldRuntime) {
    const matrix = new Matrix4()
    const rotation = new Quaternion()
    const scale = new Vector3()
    let visible = false
    runtime.lobes.forEach((lobe, index) => {
      scale.setScalar(Math.max(0.001, lobe.currentRadius))
      matrix.compose(lobe.currentPosition, rotation, scale)
      runtime.mesh.setMatrixAt(index, matrix)
      runtime.opacityAttribute.setX(index, lobe.currentOpacity)
      if (lobe.currentOpacity > 0.002) visible = true
    })
    runtime.mesh.instanceMatrix.needsUpdate = true
    runtime.opacityAttribute.needsUpdate = true
    runtime.hasVisibleLobes = visible
    this.updateFieldVisibility(runtime)
  }

  private updateFieldVisibility(runtime: FieldRuntime) {
    const scopeWeight = this.publicScopeWeight()
    runtime.mesh.visible = runtime.hasVisibleLobes
      && scopeWeight > 0.002
      && (runtime.currentOpacity > 0.002 || runtime.targetOpacity > 0.002)
  }

  private refreshCardSelection(nodeId: string) {
    const runtime = this.nodes.get(nodeId)
    if (!runtime) return
    const selected = nodeId === this.selectedNodeId
    if (runtime.selected === selected) return
    runtime.material.map = this.textureForLod(runtime, runtime.lod, selected)
    runtime.material.needsUpdate = true
    runtime.selected = selected
  }

  private textureForLod(runtime: NodeRuntime, lod: NodeLod, selected: boolean): Texture {
    const domain = this.domains.get(runtime.projection.node.primaryDomain)
    if (!domain) throw new Error(`三维知识空间缺少领域定义：${runtime.projection.node.primaryDomain}`)
    const related = !selected && this.selectedNeighborIds.has(runtime.id)
    if (lod === 'glow') {
      runtime.glowTexture ??= createNodeGlowTexture(domain.color)
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
      )
      return runtime.relatedCardTexture
    }
    runtime.cardTexture ??= createKnowledgeCardTexture(
      runtime.projection.node,
      domain,
      false,
      this.colorTheme,
    )
    return runtime.cardTexture
  }

  private refreshSelectionNeighborhood() {
    const previousNeighborIds = new Set(this.selectedNeighborIds)
    this.selectedNeighborIds.clear()
    if (this.selectedNodeId) {
      for (const edge of this.edges.values()) {
        if (edge.targetOpacity <= HIDDEN_OPACITY_EPSILON) continue
        if (this.scopeWeightForEdge(edge) <= HIDDEN_OPACITY_EPSILON) continue
        if (edge.sourceId === this.selectedNodeId) this.selectedNeighborIds.add(edge.targetId)
        if (edge.targetId === this.selectedNodeId) this.selectedNeighborIds.add(edge.sourceId)
      }
    }
    const changedNodeIds = new Set([
      ...previousNeighborIds,
      ...this.selectedNeighborIds,
    ])
    for (const nodeId of changedNodeIds) {
      const runtime = this.nodes.get(nodeId)
      if (!runtime) continue
      runtime.material.map = this.textureForLod(runtime, runtime.lod, runtime.selected)
      runtime.material.needsUpdate = true
    }
  }

  private setNodeLod(runtime: NodeRuntime, lod: NodeLod) {
    if (runtime.lod === lod) return
    runtime.lod = lod
    runtime.material.map = this.textureForLod(runtime, lod, runtime.selected)
    runtime.material.needsUpdate = true
    if (lod === 'glow') {
      runtime.targetVisualWidth = GLOW_SIZE
      runtime.targetVisualHeight = GLOW_SIZE
    } else if (lod === 'title') {
      runtime.targetVisualWidth = TITLE_WIDTH
      runtime.targetVisualHeight = TITLE_HEIGHT
    } else {
      runtime.targetVisualWidth = CARD_WIDTH
      runtime.targetVisualHeight = CARD_HEIGHT
    }
  }

  private cameraSpaceDepth(worldPosition: Vector3): number {
    const cameraSpacePosition = worldPosition.clone().applyMatrix4(this.camera.matrixWorldInverse)
    return Math.max(0.01, -cameraSpacePosition.z)
  }

  private projectedCardHeight(runtime: NodeRuntime): number {
    const depth = this.cameraSpaceDepth(runtime.currentPosition)
    const viewportHeight = Math.max(1, this.renderer.domElement.clientHeight)
    const baseHeight = CARD_HEIGHT * runtime.currentScale
    return baseHeight * viewportHeight * this.camera.zoom
      / (2 * depth * Math.tan(MathUtils.degToRad(this.camera.fov * 0.5)))
  }

  private desiredNodeLod(runtime: NodeRuntime): NodeLod {
    const projectedHeight = this.projectedCardHeight(runtime)
    return runtime.selected
      || this.selectedNeighborIds.has(runtime.id)
      || projectedHeight >= TITLE_LOD_MAX_PX
      ? 'card'
      : projectedHeight >= FAR_LOD_MAX_PX
        ? 'title'
        : 'glow'
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

  private resolveNodeLods() {
    this.camera.updateMatrixWorld()
    const placed: Array<{ left: number; right: number; top: number; bottom: number }> = []
    const candidates = [...this.nodes.values()]
      .filter((runtime) => (
        runtime.currentOpacity * this.scopeWeightForNode(runtime) > 0.01
      ))
      .sort((left, right) => {
        const leftPriority = (left.selected ? 10_000 : 0)
          + (this.selectedNeighborIds.has(left.id) ? 1_000 : 0)
          + left.projection.emphasis * 100
          + this.projectedCardHeight(left)
        const rightPriority = (right.selected ? 10_000 : 0)
          + (this.selectedNeighborIds.has(right.id) ? 1_000 : 0)
          + right.projection.emphasis * 100
          + this.projectedCardHeight(right)
        return rightPriority - leftPriority || left.id.localeCompare(right.id)
      })

    const overlaps = (
      candidate: { left: number; right: number; top: number; bottom: number },
      existing: { left: number; right: number; top: number; bottom: number },
    ) => candidate.left < existing.right && candidate.right > existing.left
      && candidate.top < existing.bottom && candidate.bottom > existing.top

    for (const runtime of candidates) {
      const desired = this.desiredNodeLod(runtime)
      const related = this.selectedNeighborIds.has(runtime.id)
      if (related) {
        let fallback: {
          lod: Exclude<NodeLod, 'glow'>
          rect: { left: number; right: number; top: number; bottom: number }
        } | null = null
        let resolved = false
        for (const attempt of RELATED_NODE_LODS) {
          const rect = this.labelRect(runtime, attempt)
          if (!rect) continue
          fallback = { lod: attempt, rect }
          if (placed.some((existing) => overlaps(rect, existing))) continue
          placed.push(rect)
          this.setNodeLod(runtime, attempt)
          resolved = true
          break
        }
        if (resolved) continue
        if (fallback) {
          placed.push(fallback.rect)
          this.setNodeLod(runtime, fallback.lod)
          continue
        }
      }
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
        if (!rect) continue
        const collision = placed.some((existing) => overlaps(rect, existing))
        if (collision) continue
        placed.push(rect)
        resolved = attempt
        break
      }
      this.setNodeLod(runtime, resolved)
    }
  }

  private updateNodePresentation(runtime: NodeRuntime) {
    const scopeWeight = this.scopeWeightForNode(runtime)
    const sphereCenter = this.projectionCenter
    const cameraFromCenter = this.camera.position.clone().sub(sphereCenter)
    const nodeFromCenter = runtime.currentPosition.clone().sub(sphereCenter)
    const cameraInside = cameraFromCenter.lengthSq() < nodeFromCenter.lengthSq() * 0.82
    const hemisphere = cameraFromCenter.lengthSq() > 1e-8 && nodeFromCenter.lengthSq() > 1e-8
      ? cameraFromCenter.normalize().dot(nodeFromCenter.normalize())
      : 1
    const selectedNeighbor = this.selectedNeighborIds.has(runtime.id)
    const occlusion = runtime.selected || selectedNeighbor || cameraInside
      ? 1
      : MathUtils.smoothstep(hemisphere, -0.72, 0.18) * 0.72 + 0.28
    const lodOpacity = runtime.lod === 'glow' ? 0.9 : runtime.lod === 'title' ? 0.94 : 1
    const neighborhoodOpacity = this.selectedNodeId && !runtime.selected && !selectedNeighbor ? 0.46 : 1
    const focusedOpacity = selectedNeighbor
      ? Math.max(runtime.currentOpacity, 0.9)
      : runtime.currentOpacity
    const calculatedOpacity = focusedOpacity
      * scopeWeight
      * occlusion
      * lodOpacity
      * neighborhoodOpacity
    const stableDefaultCard = this.selectedNodeId === null
      && runtime.lod !== 'glow'
      && runtime.currentOpacity >= 0.5
      && runtime.targetOpacity >= 0.5
      && scopeWeight >= 0.98
    runtime.displayOpacity = selectedNeighbor
      ? MathUtils.clamp(calculatedOpacity, RELATED_NODE_MIN_OPACITY * scopeWeight, 1)
      : stableDefaultCard
      ? MathUtils.clamp(calculatedOpacity, 0.58, 0.86)
      : calculatedOpacity
    runtime.material.opacity = runtime.displayOpacity
    runtime.group.visible = runtime.currentOpacity * scopeWeight > 0.004

    const scopeInteractive = runtime.subspaceId
      ? scopeWeight >= SUBSPACE_SCOPE_ENTER_PROGRESS
      : scopeWeight > SUBSPACE_SCOPE_EXIT_PROGRESS
    const eligible = runtime.projection.visible
      && runtime.projection.interactive
      && scopeInteractive
      && runtime.targetOpacity > HIDDEN_OPACITY_EPSILON
      && runtime.displayOpacity > 0.025
      && runtime.group.visible
      && runtime.sprite.visible
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
    const moving = this.advance(deltaSeconds)
    const fieldsVisible = [...this.fields.values()].some((runtime) => runtime.mesh.visible)
    this.fieldCompositeMesh.visible = fieldsVisible
    if (fieldsVisible) {
      this.renderer.setRenderTarget(this.fieldRenderTarget)
      this.renderer.clear(true, false, false)
      this.renderer.render(this.fieldScene, this.camera)
    }
    this.renderer.setRenderTarget(null)
    this.renderer.clear(true, true, true)
    this.renderer.render(this.scene, this.camera)
    this.publishCameraState()
    if (moving || this.pointerGesture !== null || this.movementKeys.size > 0) this.requestRender()
  }

  private advance(deltaSeconds: number): boolean {
    const positionFactor = expLerpFactor(8.5, deltaSeconds)
    const alphaFactor = expLerpFactor(10, deltaSeconds)
    const cameraFactor = expLerpFactor(7.2, deltaSeconds)
    let moving = this.advanceWalking(deltaSeconds)

    for (const runtime of this.nodes.values()) {
      runtime.currentPosition.lerp(runtime.targetPosition, positionFactor)
      runtime.currentOpacity = MathUtils.lerp(runtime.currentOpacity, runtime.targetOpacity, alphaFactor)
      runtime.currentScale = MathUtils.lerp(runtime.currentScale, runtime.targetScale, positionFactor)
      runtime.group.position.copy(runtime.currentPosition)
      runtime.group.scale.setScalar(runtime.currentScale)
      runtime.group.visible = runtime.currentOpacity > 0.004
      if (
        runtime.currentPosition.distanceToSquared(runtime.targetPosition) > SETTLE_EPSILON ||
        Math.abs(runtime.currentOpacity - runtime.targetOpacity) > SETTLE_EPSILON ||
        Math.abs(runtime.currentScale - runtime.targetScale) > SETTLE_EPSILON
      ) moving = true
    }

    for (const runtime of this.edges.values()) {
      runtime.currentOpacity = MathUtils.lerp(runtime.currentOpacity, runtime.targetOpacity, alphaFactor)
      this.updateEdgeGeometry(runtime)
      if (Math.abs(runtime.currentOpacity - runtime.targetOpacity) > SETTLE_EPSILON) moving = true
    }

    for (const runtime of this.fields.values()) {
      runtime.currentOpacity = MathUtils.lerp(runtime.currentOpacity, runtime.targetOpacity, alphaFactor)
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
        this.writeFieldInstances(runtime)
        if (stillAnimating) moving = true
      }
      if (Math.abs(runtime.currentOpacity - runtime.targetOpacity) > SETTLE_EPSILON) moving = true
    }

    this.camera.position.lerp(this.targetCameraPosition, cameraFactor)
    this.lookAt.lerp(this.targetLookAt, cameraFactor)
    this.camera.lookAt(this.lookAt)
    if (
      this.camera.position.distanceToSquared(this.targetCameraPosition) > SETTLE_EPSILON ||
      this.lookAt.distanceToSquared(this.targetLookAt) > SETTLE_EPSILON
    ) moving = true

    const zoomSettled = isGlobalZoomSettled(this.camera.zoom, this.targetGlobalZoom)
    const nextZoom = zoomSettled
      ? this.targetGlobalZoom
      : dampGlobalZoom(this.camera.zoom, this.targetGlobalZoom, deltaSeconds)
    this.applyGlobalZoomStep(nextZoom)
    if (zoomSettled) this.activeZoomAnchor = null
    else moving = true

    if (this.updateSubspaceProgress()) moving = true
    for (const runtime of this.edges.values()) {
      const effectiveOpacity = runtime.currentOpacity * this.scopeWeightForEdge(runtime)
      runtime.material.opacity = effectiveOpacity
      runtime.line.visible = effectiveOpacity > 0.004
    }
    const publicWeight = this.publicScopeWeight()
    for (const runtime of this.fields.values()) {
      runtime.material.uniforms.uOpacity.value = runtime.currentOpacity * publicWeight
      this.updateFieldVisibility(runtime)
    }

    this.resolveNodeLods()
    for (const runtime of this.nodes.values()) {
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
      runtime.sprite.scale.set(runtime.currentVisualWidth, runtime.currentVisualHeight, 1)
      runtime.group.position.copy(runtime.currentPosition)
      this.updateNodePresentation(runtime)
      if (
        Math.abs(runtime.currentVisualWidth - runtime.targetVisualWidth) > SETTLE_EPSILON
        || Math.abs(runtime.currentVisualHeight - runtime.targetVisualHeight) > SETTLE_EPSILON
      ) moving = true
    }
    if (this.hoverPointer && !this.pointerGesture) this.updateHoveredNodeAtPointer()
    this.updateHoverLabelPresentation()

    return moving
  }

  private updateSceneObjects() {
    for (const runtime of this.nodes.values()) {
      runtime.group.position.copy(runtime.currentPosition)
      runtime.group.scale.setScalar(runtime.currentScale)
    }
    for (const runtime of this.edges.values()) {
      this.updateEdgeGeometry(runtime)
      const effectiveOpacity = runtime.currentOpacity * this.scopeWeightForEdge(runtime)
      runtime.material.opacity = effectiveOpacity
      runtime.line.visible = effectiveOpacity > 0.004
    }
    const publicWeight = this.publicScopeWeight()
    for (const runtime of this.fields.values()) {
      this.writeFieldInstances(runtime)
      runtime.material.uniforms.uOpacity.value = runtime.currentOpacity * publicWeight
    }
    this.resolveNodeLods()
    for (const runtime of this.nodes.values()) {
      runtime.group.position.copy(runtime.currentPosition)
      this.updateNodePresentation(runtime)
    }
    this.updateHoverLabelPresentation()
  }

  private updateEdgeGeometry(runtime: EdgeRuntime) {
    const source = this.nodes.get(runtime.sourceId)
    const target = this.nodes.get(runtime.targetId)
    if (!source || !target) {
      runtime.line.visible = false
      return
    }
    const attribute = runtime.line.geometry.getAttribute('position')
    attribute.setXYZ(0, source.currentPosition.x, source.currentPosition.y, source.currentPosition.z)
    attribute.setXYZ(1, target.currentPosition.x, target.currentPosition.y, target.currentPosition.z)
    attribute.needsUpdate = true
  }

  private bindEvents() {
    const canvas = this.renderer.domElement
    canvas.addEventListener('pointerdown', this.handlePointerDown)
    canvas.addEventListener('pointerenter', this.handlePointerEnter)
    canvas.addEventListener('pointermove', this.handlePointerMove)
    canvas.addEventListener('pointerup', this.handlePointerUp)
    canvas.addEventListener('pointercancel', this.handlePointerCancel)
    canvas.addEventListener('pointerleave', this.handlePointerLeave)
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
    const rotationPivot = mode === 'rotate' ? this.projectionCenter.clone() : null
    this.clearHoveredNode()
    this.renderer.domElement.setPointerCapture(event.pointerId)
    this.pointerGesture = {
      id: event.pointerId,
      button: event.button,
      mode,
      rotationPivot,
      startX: event.clientX,
      startY: event.clientY,
      lastX: event.clientX,
      lastY: event.clientY,
      moved: false,
    }
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
    else this.rotateCamera(dx, dy, gesture.rotationPivot ?? this.lookAt)
    this.requestRender()
  }

  private handlePointerUp = (event: PointerEvent) => {
    const gesture = this.pointerGesture
    if (!gesture || gesture.id !== event.pointerId) return
    this.renderer.domElement.releasePointerCapture(event.pointerId)
    this.pointerGesture = null
    this.renderer.domElement.style.cursor = ''
    if (!gesture.moved && gesture.button === 0) this.handleClick(event.clientX, event.clientY)
    this.hoverPointer = { clientX: event.clientX, clientY: event.clientY }
    this.updateHoveredNodeAtPointer()
    this.requestRender()
  }

  private handlePointerCancel = (event: PointerEvent) => {
    if (this.pointerGesture?.id !== event.pointerId) return
    this.pointerGesture = null
    this.hoverPointer = null
    this.renderer.domElement.style.cursor = ''
    this.clearHoveredNode()
  }

  private handlePointerLeave = () => {
    this.pointerInside = false
    if (this.pointerGesture) return
    this.hoverPointer = null
    this.clearHoveredNode()
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
      && sprite.visible
      && displayOpacity > 0.025
      && sprite.userData.interactive === true)
  }

  private pickNodeAtPointer(clientX: number, clientY: number): NodeRuntime | null {
    if (!this.setRayFromClient(clientX, clientY)) return null
    const candidates = this.interactiveNodeRuntimes()
    const hits = this.raycaster.intersectObjects(candidates.map(({ sprite }) => sprite), false)
    const hit = hits.find(({ object }: Intersection<Object3D>) => object.userData.interactive === true)
    const hitNodeId = hit?.object.userData.nodeId
    if (typeof hitNodeId === 'string') return this.nodes.get(hitNodeId) ?? null

    const bounds = this.renderer.domElement.getBoundingClientRect()
    let closest: { runtime: NodeRuntime; screenDistance: number; cameraDistance: number } | null = null
    for (const runtime of candidates) {
      if (runtime.lod !== 'glow') continue
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
      this.interactiveNodeRuntimes().map(({ sprite }) => sprite),
      false,
    )
    if (hits[0]?.point) {
      const nodeId = hits[0].object.userData.nodeId
      return {
        point: hits[0].point.clone(),
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
    const nextId = runtime?.lod === 'glow' ? runtime.id : null
    this.renderer.domElement.style.cursor = runtime ? 'pointer' : ''
    if (nextId === this.hoveredNodeId) return
    this.hoveredNodeId = nextId
    if (!runtime || !nextId) {
      this.hoverLabelSprite.visible = false
    } else {
      this.hoverLabelMaterial.map = this.textureForLod(runtime, 'title', false)
      this.hoverLabelMaterial.needsUpdate = true
      this.hoverLabelSprite.visible = true
    }
    this.requestRender()
  }

  private clearHoveredNode() {
    if (this.hoveredNodeId === null && !this.hoverLabelSprite.visible) return
    this.hoveredNodeId = null
    this.hoverLabelSprite.visible = false
    if (!this.pointerGesture) this.renderer.domElement.style.cursor = ''
    this.requestRender()
  }

  private updateHoverLabelPresentation() {
    if (!this.hoveredNodeId) {
      this.hoverLabelSprite.visible = false
      return
    }
    const runtime = this.nodes.get(this.hoveredNodeId)
    if (
      !runtime
      || runtime.lod !== 'glow'
      || runtime.sprite.userData.interactive !== true
      || runtime.displayOpacity <= 0.025
    ) {
      this.clearHoveredNode()
      return
    }
    const depth = this.cameraSpaceDepth(runtime.currentPosition)
    const viewportHeight = Math.max(1, this.renderer.domElement.clientHeight)
    const worldUnitsPerPixel = 2 * depth * Math.tan(MathUtils.degToRad(this.camera.fov * 0.5))
      / (viewportHeight * this.camera.zoom)
    const cameraUp = new Vector3().setFromMatrixColumn(this.camera.matrixWorld, 1).normalize()
    this.hoverLabelSprite.position.copy(runtime.currentPosition)
      .addScaledVector(cameraUp, HOVER_LABEL_OFFSET_PX * worldUnitsPerPixel)
    this.hoverLabelSprite.scale.set(
      HOVER_LABEL_WIDTH_PX * worldUnitsPerPixel,
      HOVER_LABEL_HEIGHT_PX * worldUnitsPerPixel,
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

  private handleClick(clientX: number, clientY: number) {
    const runtime = this.pickNodeAtPointer(clientX, clientY)
    if (runtime) this.callbacks.onSelectNode?.(runtime.id)
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
