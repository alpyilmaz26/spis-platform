import React, { useEffect, useRef, useImperativeHandle, forwardRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { Ruler } from 'lucide-react';
import {
  RenderSettings,
  EnvironmentSettings,
  CameraPreset,
  ProjectionMode,
  Measurement,
  MeasurePoint,
  SpatialAnnotation,
  SpatialGroup,
  SpatialMarkerGeometryType,
  NavigationMode,
  AppViewMode,
  SpatialAttachmentPDF,
  SpatialAttachmentImage,
  MaterialOverride,
  UiTheme,
  AudienceUserCredentials
} from '../types';
import { SpatialRecordPopup } from './SpatialRecordPopup';
import { SpatialRecordCommentsWing } from './SpatialRecordCommentsWing';
import { formatDistance } from '../utils/formatUnit';

const MEASURE_PALETTE = ['#38bdf8', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#f97316', '#14b8a6', '#a855f7'];

// Pre-allocated math temporaries to eliminate per-frame garbage collection in the render loop
const _worldUp = new THREE.Vector3(0, 1, 0);
const _forwardVec = new THREE.Vector3();
const _rightVec = new THREE.Vector3();
const _moveDeltaVec = new THREE.Vector3();
const _targetVec = new THREE.Vector3();
const _projectedVec = new THREE.Vector3();
const _camDirVec = new THREE.Vector3();
const _toTargetVec = new THREE.Vector3();
const _p1Vec = new THREE.Vector3();
const _p2Vec = new THREE.Vector3();
const _midVec = new THREE.Vector3();

function getDistanceToLineSegment(p: THREE.Vector3, a: THREE.Vector3, b: THREE.Vector3): number {
  const ab = new THREE.Vector3().subVectors(b, a);
  const ap = new THREE.Vector3().subVectors(p, a);
  const abLenSq = ab.lengthSq();
  if (abLenSq === 0) return p.distanceTo(a);
  let t = ap.dot(ab) / abLenSq;
  t = Math.max(0, Math.min(1, t));
  const proj = new THREE.Vector3().addVectors(a, ab.multiplyScalar(t));
  return p.distanceTo(proj);
}

export interface ThreeCanvasRef {
  resetCamera: () => void;
  setCameraPreset: (preset: CameraPreset) => void;
  takeScreenshot: () => string;
  focusPoint: (point: THREE.Vector3, forceZoomIn?: boolean, durationMs?: number) => void;
  flyToPosition: (x: number, y: number, z: number, durationMs?: number) => void;
}

interface ThreeCanvasProps {
  modelScene: THREE.Object3D | null;
  renderSettings: RenderSettings;
  envSettings: EnvironmentSettings;
  projectionMode: ProjectionMode;
  navigationMode?: NavigationMode;
  measureMode: boolean;
  measurements: Measurement[];
  onAddMeasurement: (m: Measurement) => void;
  annotations: SpatialAnnotation[];
  spatialGroups?: SpatialGroup[];
  selectedAnnotationId: string | null;
  isAddingPinMode: boolean;
  activeDrawGeometryType?: SpatialMarkerGeometryType;
  boxCreationMode?: 'surface' | 'bounds';
  drawingPoints?: Array<{ x: number; y: number; z: number }>;
  onSelectAnnotation: (id: string | null) => void;
  onAddPinAtPoint: (point: THREE.Vector3, nodeId?: string, nodeName?: string) => void;
  activeAnimationIndex: number | null;
  isPlayingAnimation: boolean;
  animationSpeed: number;
  rawClips: THREE.AnimationClip[];
  isolatedNodeId: string | null;
  hiddenNodeIds: Set<string>;
  highlightedNodeId: string | null;
  materialOverrides: Map<string, MaterialOverride>;
  onPointClicked?: (point: THREE.Vector3) => void;
  viewMode?: AppViewMode;
  isGisPanelOpen?: boolean;
  onOpenGisPanel?: () => void;
  onEditAnnotation?: (annotation: SpatialAnnotation) => void;
  onStartEditShape?: (annotation: SpatialAnnotation) => void;
  editingShapeAnnotation?: SpatialAnnotation | null;
  editingShapePoints?: Array<{ x: number; y: number; z: number }>;
  onUpdateEditingShapePoints?: (points: Array<{ x: number; y: number; z: number }>) => void;
  onDeleteAnnotation?: (id: string) => void;
  onOpenPdf?: (pdf: SpatialAttachmentPDF) => void;
  onOpenImage?: (img: SpatialAttachmentImage) => void;
  onFocusAnnotation?: (annotation: SpatialAnnotation) => void;
  onUpdateRenderSettings?: (settings: Partial<RenderSettings>) => void;
  uiTheme?: UiTheme;
  audienceUser?: AudienceUserCredentials;
  onUpdateAudienceUser?: (creds: AudienceUserCredentials) => void;
  onAddComment?: (annotationId: string, text: string, authorName: string, authorRole: string) => void;
  onVoteComment?: (annotationId: string, commentId: string, direction: 'up' | 'down') => void;
  onDeleteComment?: (annotationId: string, commentId: string) => void;
  isCommentsWingOpen?: boolean;
  onToggleCommentsWing?: () => void;
  activeThemeName?: string | null;
}

const roundVal = (v: number) => Math.round(v * 1000) / 1000;
const roundPoint = (pt: { x: number; y: number; z: number }) => ({
  x: Math.round(pt.x * 1000) / 1000,
  y: Math.round(pt.y * 1000) / 1000,
  z: Math.round(pt.z * 1000) / 1000
});

const disposeGroupContents = (grp: THREE.Group) => {
  grp.traverse((child) => {
    if ((child as THREE.Mesh).geometry) {
      (child as THREE.Mesh).geometry.dispose();
    }
    if ((child as THREE.Mesh).material) {
      const mat = (child as THREE.Mesh).material;
      if (Array.isArray(mat)) {
        mat.forEach((m) => m.dispose());
      } else {
        mat.dispose();
      }
    }
  });
  grp.clear();
};

export const ThreeCanvas = forwardRef<ThreeCanvasRef, ThreeCanvasProps>(({
  modelScene,
  renderSettings,
  envSettings,
  projectionMode,
  navigationMode = 'orbit',
  measureMode,
  measurements,
  onAddMeasurement,
  annotations,
  spatialGroups = [],
  selectedAnnotationId,
  isAddingPinMode,
  activeDrawGeometryType,
  boxCreationMode = 'surface',
  drawingPoints,
  onSelectAnnotation,
  onAddPinAtPoint,
  activeAnimationIndex,
  isPlayingAnimation,
  animationSpeed,
  rawClips,
  isolatedNodeId,
  hiddenNodeIds,
  highlightedNodeId,
  materialOverrides,
  onPointClicked,
  viewMode = 'researcher',
  isGisPanelOpen = true,
  onOpenGisPanel,
  onEditAnnotation,
  onStartEditShape,
  editingShapeAnnotation,
  editingShapePoints,
  onUpdateEditingShapePoints,
  onDeleteAnnotation,
  onOpenPdf,
  onOpenImage,
  onFocusAnnotation,
  onUpdateRenderSettings,
  uiTheme = 'dark',
  audienceUser = { name: 'Visitor', role: 'Local Resident' },
  onUpdateAudienceUser = () => {},
  onAddComment = () => {},
  onVoteComment = () => {},
  onDeleteComment = () => {},
  isCommentsWingOpen = false,
  onToggleCommentsWing = () => {},
  activeThemeName
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const popupContainerRef = useRef<HTMLDivElement>(null);
  const commentsContainerRef = useRef<HTMLDivElement>(null);
  const beaconPinRef = useRef<HTMLDivElement>(null);

  const isLight = uiTheme === 'light';

  // Sync annotations & selectedAnnotationId into refs for animation frame loop
  const annotationsRef = useRef(annotations);
  annotationsRef.current = annotations;

  const measurementsRef = useRef(measurements);
  measurementsRef.current = measurements;

  const selectedAnnotationIdRef = useRef(selectedAnnotationId);
  selectedAnnotationIdRef.current = selectedAnnotationId;

  // Live Measurement Preview & Cursor Tracking States
  const [measurePreview, setMeasurePreview] = useState<{
    p1: { x: number; y: number; z: number };
    p2: { x: number; y: number; z: number };
    distance: number;
  } | null>(null);
  const [hoverCursorPos, setHoverCursorPos] = useState<{ x: number; y: number } | null>(null);
  const [hoverBoxPoint, setHoverBoxPoint] = useState<{ x: number; y: number; z: number } | null>(null);
  const [measureLabels, setMeasureLabels] = useState<Array<{ id: string; screenX: number; screenY: number; distance: number; color: string }>>([]);
  
  // Independent 3D screen offsets for detached Main Popup and Comments Wing
  const [popupOffset, setPopupOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const popupOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const [commentsOffset, setCommentsOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const commentsOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const lastBadgesRef = useRef<Array<{ id: string; screenX: number; screenY: number; distance: number; color: string }>>([]);
  const lastPointerMoveTimeRef = useRef<number>(0);

  // Persistent reusable Raycaster and Vector2 to eliminate high-frequency memory allocation
  const raycasterRef = useRef<THREE.Raycaster | null>(null);
  const mouseVecRef = useRef<THREE.Vector2>(new THREE.Vector2());
  if (!raycasterRef.current) {
    const rc = new THREE.Raycaster();
    (rc as any).firstHitOnly = true;
    raycasterRef.current = rc;
  }

  // Adaptive On-Demand Rendering Engine to eliminate idle GPU load
  const demandFramesRef = useRef<number>(60);
  const requestRender = (frames = 30) => {
    demandFramesRef.current = Math.max(demandFramesRef.current, frames);
  };

  useEffect(() => {
    popupOffsetRef.current = { x: 0, y: 0 };
    setPopupOffset({ x: 0, y: 0 });
    commentsOffsetRef.current = { x: 0, y: 0 };
    setCommentsOffset({ x: 0, y: 0 });
  }, [selectedAnnotationId]);

  // Dynamic Settings Refs to prevent stale closures in requestAnimationFrame loop
  const renderSettingsRef = useRef(renderSettings);
  useEffect(() => {
    renderSettingsRef.current = renderSettings;
  }, [renderSettings]);

  const envSettingsRef = useRef(envSettings);
  useEffect(() => {
    envSettingsRef.current = envSettings;
  }, [envSettings]);

  const navigationModeRef = useRef(navigationMode);
  useEffect(() => {
    navigationModeRef.current = navigationMode;
    if (controlsRef.current) {
      if (navigationMode === 'terrain') {
        controlsRef.current.maxPolarAngle = Math.PI / 2 + 0.08;
        controlsRef.current.minPolarAngle = 0.02;
        controlsRef.current.screenSpacePanning = false;
        controlsRef.current.mouseButtons.RIGHT = null as any;
      } else {
        controlsRef.current.maxPolarAngle = Math.PI - 0.05;
        controlsRef.current.minPolarAngle = 0.01;
        controlsRef.current.screenSpacePanning = true;
        controlsRef.current.mouseButtons.RIGHT = THREE.MOUSE.PAN;
      }
    }
  }, [navigationMode]);

  // Right-drag Freelook in Terrain mode (Turn camera around its own position)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let isRightDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;

    const handlePointerDown = (e: PointerEvent) => {
      if (navigationModeRef.current !== 'terrain') return;
      if (e.button === 2) {
        isRightDragging = true;
        prevMouseX = e.clientX;
        prevMouseY = e.clientY;
        container.setPointerCapture(e.pointerId);
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!isRightDragging || navigationModeRef.current !== 'terrain') return;
      if (!controlsRef.current || !activeCameraRef.current) return;

      const deltaX = e.clientX - prevMouseX;
      const deltaY = e.clientY - prevMouseY;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;

      if (deltaX === 0 && deltaY === 0) return;

      const cam = activeCameraRef.current;
      const controls = controlsRef.current;

      const sensitivity = 0.003;
      const yawAngle = -deltaX * sensitivity;
      const pitchAngle = -deltaY * sensitivity;

      const dir = new THREE.Vector3().subVectors(controls.target, cam.position);
      const distance = dir.length();
      if (distance < 1e-5) return;
      dir.normalize();

      // Yaw rotation around World Y axis (0, 1, 0)
      const yawQuaternion = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yawAngle);
      dir.applyQuaternion(yawQuaternion);

      // Pitch rotation around camera local Right axis
      const right = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0, 1, 0)).normalize();
      if (right.lengthSq() > 1e-5) {
        const pitchQuaternion = new THREE.Quaternion().setFromAxisAngle(right, pitchAngle);
        const testDir = dir.clone().applyQuaternion(pitchQuaternion);

        // Keep vertical angle within safe bounds
        const upAngle = testDir.angleTo(new THREE.Vector3(0, 1, 0));
        if (upAngle > 0.03 && upAngle < 3.05) {
          dir.copy(testDir);
        }
      }

      controls.target.copy(cam.position).add(dir.multiplyScalar(distance));
      controls.update();
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (e.button === 2 && isRightDragging) {
        isRightDragging = false;
        try {
          container.releasePointerCapture(e.pointerId);
        } catch (_) {}
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      if (navigationModeRef.current === 'terrain') {
        e.preventDefault();
      }
    };

    container.addEventListener('pointerdown', handlePointerDown);
    container.addEventListener('pointermove', handlePointerMove);
    container.addEventListener('pointerup', handlePointerUp);
    container.addEventListener('contextmenu', handleContextMenu);

    return () => {
      container.removeEventListener('pointerdown', handlePointerDown);
      container.removeEventListener('pointermove', handlePointerMove);
      container.removeEventListener('pointerup', handlePointerUp);
      container.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  // Keyboard Navigation state for Terrain Flight Mode
  const keysPressedRef = useRef<Set<string>>(new Set());
  const modifierKeysRef = useRef<{ shift: boolean; ctrl: boolean; alt: boolean }>({
    shift: false,
    ctrl: false,
    alt: false
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName;
      if (activeTag === 'INPUT' || activeTag === 'TEXTAREA' || activeTag === 'SELECT') return;

      modifierKeysRef.current = {
        shift: e.shiftKey,
        ctrl: e.ctrlKey,
        alt: e.altKey
      };

      const key = e.key.toLowerCase();
      if (['w', 'a', 's', 'd', 'q', 'e', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'pageup', 'pagedown', 'shift', 'control', 'alt'].includes(key)) {
        keysPressedRef.current.add(key);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      modifierKeysRef.current = {
        shift: e.shiftKey,
        ctrl: e.ctrlKey,
        alt: e.altKey
      };

      const key = e.key.toLowerCase();
      keysPressedRef.current.delete(key);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Three.js Core Refs
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const perspectiveCameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const orthographicCameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const activeCameraRef = useRef<THREE.Camera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);

  // Auxiliary Object Refs
  const lightsGroupRef = useRef<THREE.Group | null>(null);
  const gridHelperRef = useRef<THREE.GridHelper | null>(null);
  const axesHelperRef = useRef<THREE.AxesHelper | null>(null);
  const boundingBoxHelperRef = useRef<THREE.BoxHelper | null>(null);
  const shadowPlaneRef = useRef<THREE.Mesh | null>(null);
  const modelWrapperRef = useRef<THREE.Group | null>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const currentActionRef = useRef<THREE.AnimationAction | null>(null);
  const clippingPlaneRef = useRef<THREE.Plane | null>(null);
  const clippingPlaneMeshRef = useRef<THREE.Mesh | null>(null);

  // Measurement & GIS Annotations Refs
  const pendingMeasurePointRef = useRef<MeasurePoint | null>(null);
  const measurementGroupRef = useRef<THREE.Group | null>(null);
  const annotationsGroupRef = useRef<THREE.Group | null>(null);

  // Texture Cache & Original Mesh Materials Backup
  const textureCacheRef = useRef<Map<string, THREE.Texture>>(new Map());
  const originalMapsRef = useRef<Map<string, { map: THREE.Texture | null; normalMap: THREE.Texture | null; color: THREE.Color }>>(new Map());

  // Bounding Sphere & Complexity Info for Camera Resets and Adaptive Rendering
  const modelRadiusRef = useRef<number>(2);
  const modelCenterRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const modelTriangleCountRef = useRef<number>(0);

  // Initialize Scene, Renderer, Cameras, Controls
  useEffect(() => {
    if (!canvasContainerRef.current) return;

    const width = canvasContainerRef.current.clientWidth || window.innerWidth;
    const height = canvasContainerRef.current.clientHeight || window.innerHeight;

    // Renderer Optimized for High Poly Photogrammetric Models
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, renderSettings.performanceMode ? 1.0 : 1.5));
    renderer.shadowMap.enabled = !renderSettings.performanceMode;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.shadowMap.autoUpdate = false; // Prevent wasteful continuous shadow passes on idle frames
    renderer.shadowMap.needsUpdate = true;
    renderer.localClippingEnabled = true;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;

    canvasContainerRef.current.innerHTML = '';
    canvasContainerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Scene & Procedural Studio Environment Map for PBR Reflections
    const scene = new THREE.Scene();
    let studioEnvTexture: THREE.Texture | null = null;
    try {
      const pmremGenerator = new THREE.PMREMGenerator(renderer);
      const roomEnv = new RoomEnvironment();
      studioEnvTexture = pmremGenerator.fromScene(roomEnv, 0.04).texture;
      scene.environment = studioEnvTexture;
      roomEnv.dispose();
      pmremGenerator.dispose();
    } catch (_) {
      // Fallback gracefully if PMREM fails on software WebGL
    }
    sceneRef.current = scene;

    // WebGL Context Loss & Recovery Safeguards
    const handleContextLost = (event: Event) => {
      event.preventDefault();
      if (focusAnimFrameRef.current !== null) {
        cancelAnimationFrame(focusAnimFrameRef.current);
        focusAnimFrameRef.current = null;
      }
    };
    const handleContextRestored = () => {
      if (rendererRef.current && rendererRef.current.shadowMap.enabled) {
        rendererRef.current.shadowMap.needsUpdate = true;
      }
      requestRender(60);
    };
    renderer.domElement.addEventListener('webglcontextlost', handleContextLost, false);
    renderer.domElement.addEventListener('webglcontextrestored', handleContextRestored, false);

    // Cameras
    const aspect = width / height;
    const perspCam = new THREE.PerspectiveCamera(45, aspect, 0.05, 5000);
    perspCam.position.set(4, 3, 5);
    perspectiveCameraRef.current = perspCam;

    const orthoCam = new THREE.OrthographicCamera(
      -3 * aspect,
      3 * aspect,
      3,
      -3,
      0.05,
      5000
    );
    orthoCam.position.set(4, 3, 5);
    orthographicCameraRef.current = orthoCam;

    const activeCam = projectionMode === 'perspective' ? perspCam : orthoCam;
    activeCameraRef.current = activeCam;

    // Orbit Controls
    const controls = new OrbitControls(activeCam, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = true;
    controls.maxPolarAngle = Math.PI - 0.05;
    controls.addEventListener('start', () => {
      if (focusAnimFrameRef.current !== null) {
        cancelAnimationFrame(focusAnimFrameRef.current);
        focusAnimFrameRef.current = null;
      }
      requestRender(20);
    });
    controls.addEventListener('change', () => {
      requestRender(15);
    });
    controlsRef.current = controls;

    // Lights Group
    const lightsGroup = new THREE.Group();
    lightsGroup.name = 'LightsGroup';
    scene.add(lightsGroup);
    lightsGroupRef.current = lightsGroup;

    // Model Wrapper
    const modelWrapper = new THREE.Group();
    modelWrapper.name = 'ModelWrapper';
    scene.add(modelWrapper);
    modelWrapperRef.current = modelWrapper;

    // Measurement Visuals Group
    const measureGroup = new THREE.Group();
    measureGroup.name = 'MeasurementVisuals';
    scene.add(measureGroup);
    measurementGroupRef.current = measureGroup;

    // GIS Annotations Group
    const annoGroup = new THREE.Group();
    annoGroup.name = 'GISAnnotationsVisuals';
    scene.add(annoGroup);
    annotationsGroupRef.current = annoGroup;

    // Helpers
    const gridHelper = new THREE.GridHelper(10, 20, 0x0ea5e9, 0x475569);
    gridHelper.position.y = -0.01;
    scene.add(gridHelper);
    gridHelperRef.current = gridHelper;

    const axesHelper = new THREE.AxesHelper(1.5);
    scene.add(axesHelper);
    axesHelperRef.current = axesHelper;

    // Shadow Floor Receiver Plane
    const shadowGeo = new THREE.PlaneGeometry(100, 100);
    const shadowMat = new THREE.ShadowMaterial({ opacity: 0.3 });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = -0.02;
    shadowMesh.receiveShadow = true;
    shadowMesh.visible = false; // Only visible when model is present
    scene.add(shadowMesh);
    shadowPlaneRef.current = shadowMesh;

    // Clipping Plane Object
    const clipPlane = new THREE.Plane(new THREE.Vector3(1, 0, 0), 0);
    clippingPlaneRef.current = clipPlane;

    // Visual Slice Indicator Plane
    const clipPlaneGeo = new THREE.PlaneGeometry(6, 6);
    const clipPlaneMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.15,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const clipMesh = new THREE.Mesh(clipPlaneGeo, clipPlaneMat);
    clipMesh.visible = false;
    scene.add(clipMesh);
    clippingPlaneMeshRef.current = clipMesh;

    // Animation Loop with Zero-GC Vector Reuse & Adaptive Pixel Ratio Scaling
    let animationFrameId: number;
    let lastTime = performance.now();
    let isDynamicDownscaled = false;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const now = performance.now();
      const delta = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      // Update Animation Mixer
      if (mixerRef.current && isPlayingAnimation) {
        mixerRef.current.update(delta * animationSpeed);
        requestRender(5);
      }

      let isMovingActively = false;

      // Terrain WASD Flight Controls Movement
      if (navigationModeRef.current === 'terrain' && activeCameraRef.current && controlsRef.current) {
        const keys = keysPressedRef.current;
        if (keys.size > 0) {
          requestRender(10);
          isMovingActively = true;
          const cam = activeCameraRef.current;
          cam.getWorldDirection(_forwardVec);
          _forwardVec.y = 0;
          _forwardVec.normalize();

          _rightVec.crossVectors(_forwardVec, _worldUp).normalize();

          // Configured baseline speed multiplier (0.1x to 2.0x)
          const baseSpeedMult = renderSettingsRef.current.terrainSpeedMultiplier || 1.0;
          const moveSpeed = Math.max(modelRadiusRef.current * 0.3, 0.5) * delta * 2.5 * baseSpeedMult;

          _moveDeltaVec.set(0, 0, 0);

          if (keys.has('w') || keys.has('arrowup')) _moveDeltaVec.addScaledVector(_forwardVec, moveSpeed);
          if (keys.has('s') || keys.has('arrowdown')) _moveDeltaVec.addScaledVector(_forwardVec, -moveSpeed);
          if (keys.has('d') || keys.has('arrowright')) _moveDeltaVec.addScaledVector(_rightVec, moveSpeed);
          if (keys.has('a') || keys.has('arrowleft')) _moveDeltaVec.addScaledVector(_rightVec, -moveSpeed);
          if (keys.has('e') || keys.has('pageup')) _moveDeltaVec.y += moveSpeed;
          if (keys.has('q') || keys.has('pagedown')) _moveDeltaVec.y -= moveSpeed;

          if (_moveDeltaVec.lengthSq() > 0) {
            cam.position.add(_moveDeltaVec);
            cam.position.y = Math.max(cam.position.y, 0.05);
            controlsRef.current.target.add(_moveDeltaVec);
          }
        }
      }

      // Auto rotation & OrbitControls damping update
      if (controlsRef.current) {
        controlsRef.current.autoRotate = envSettingsRef.current.autoRotate;
        controlsRef.current.autoRotateSpeed = (envSettingsRef.current.autoRotateSpeed || 1.0) * 2.0;
        const controlsMoving = controlsRef.current.update();
        if (controlsMoving || envSettingsRef.current.autoRotate) {
          isMovingActively = true;
          requestRender(10);
        }
      }

      if (focusAnimFrameRef.current !== null) {
        isMovingActively = true;
        requestRender(5);
      }

      // Automatic Adaptive Pixel Ratio Scaling for complex models (>250k triangles)
      if (rendererRef.current && !renderSettingsRef.current.performanceMode) {
        const isComplexScene = modelTriangleCountRef.current > 250000;
        if (isComplexScene && isMovingActively && !isDynamicDownscaled) {
          const baseRes = renderSettingsRef.current.resolutionScale || 1.0;
          rendererRef.current.setPixelRatio(Math.min(window.devicePixelRatio * baseRes * 0.75, 1.15));
          isDynamicDownscaled = true;
        } else if ((!isMovingActively || !isComplexScene) && isDynamicDownscaled) {
          const baseRes = renderSettingsRef.current.resolutionScale || 1.0;
          rendererRef.current.setPixelRatio(Math.min(window.devicePixelRatio * baseRes, 2.0));
          isDynamicDownscaled = false;
          requestRender(2);
        }
      }

      // 3D Spatial Record Popup & Beacon 3D Projection Screen Position Tracking
      if (selectedAnnotationIdRef.current && activeCameraRef.current && containerRef.current) {
        const selectedAnno = annotationsRef.current.find((a) => a.id === selectedAnnotationIdRef.current);
        if (selectedAnno) {
          _targetVec.set(selectedAnno.position.x, selectedAnno.position.y, selectedAnno.position.z);
          const cam = activeCameraRef.current;
          _projectedVec.copy(_targetVec).project(cam);

          const w = containerRef.current.clientWidth;
          const h = containerRef.current.clientHeight;

          const screenX = (_projectedVec.x * 0.5 + 0.5) * w;
          const screenY = (-_projectedVec.y * 0.5 + 0.5) * h;

          cam.getWorldDirection(_camDirVec);
          _toTargetVec.copy(_targetVec).sub(cam.position);
          const isForward = _toTargetVec.dot(_camDirVec) > 0;
          const isVisible = isForward && _projectedVec.z >= -1 && _projectedVec.z <= 1;

          if (beaconPinRef.current) {
            if (isVisible) {
              beaconPinRef.current.style.display = 'block';
              beaconPinRef.current.style.left = `${screenX}px`;
              beaconPinRef.current.style.top = `${screenY}px`;
            } else {
              beaconPinRef.current.style.display = 'none';
            }
          }

          if (popupContainerRef.current) {
            if (isVisible) {
              popupContainerRef.current.style.display = 'block';
              popupContainerRef.current.style.left = `${screenX + popupOffsetRef.current.x}px`;
              popupContainerRef.current.style.top = `${screenY + popupOffsetRef.current.y}px`;
            } else {
              popupContainerRef.current.style.display = 'none';
            }
          }

          if (commentsContainerRef.current) {
            if (isVisible) {
              commentsContainerRef.current.style.display = 'block';
              commentsContainerRef.current.style.left = `${screenX + commentsOffsetRef.current.x}px`;
              commentsContainerRef.current.style.top = `${screenY + commentsOffsetRef.current.y}px`;
            } else {
              commentsContainerRef.current.style.display = 'none';
            }
          }
        } else {
          if (beaconPinRef.current) beaconPinRef.current.style.display = 'none';
          if (popupContainerRef.current) popupContainerRef.current.style.display = 'none';
          if (commentsContainerRef.current) commentsContainerRef.current.style.display = 'none';
        }
      } else {
        if (beaconPinRef.current) beaconPinRef.current.style.display = 'none';
        if (popupContainerRef.current) popupContainerRef.current.style.display = 'none';
        if (commentsContainerRef.current) commentsContainerRef.current.style.display = 'none';
      }

      // Project 3D Measurement Midpoint Floating Badges
      if (containerRef.current && activeCameraRef.current && measurementsRef.current.length > 0) {
        const w = containerRef.current.clientWidth;
        const h = containerRef.current.clientHeight;
        const cam = activeCameraRef.current;
        cam.getWorldDirection(_camDirVec);
        const badges: Array<{ id: string; screenX: number; screenY: number; distance: number; color: string }> = [];

        measurementsRef.current.forEach((m, idx) => {
          _p1Vec.set(m.p1.x, m.p1.y, m.p1.z);
          _p2Vec.set(m.p2.x, m.p2.y, m.p2.z);
          _midVec.addVectors(_p1Vec, _p2Vec).multiplyScalar(0.5);
          _projectedVec.copy(_midVec).project(cam);
          _toTargetVec.copy(_midVec).sub(cam.position);
          const isForward = _toTargetVec.dot(_camDirVec) > 0;

          if (isForward && _projectedVec.z >= -1 && _projectedVec.z <= 1) {
            const screenX = (_projectedVec.x * 0.5 + 0.5) * w;
            const screenY = (-_projectedVec.y * 0.5 + 0.5) * h;
            if (screenX >= -100 && screenX <= w + 100 && screenY >= -100 && screenY <= h + 100) {
              const c = m.color || MEASURE_PALETTE[idx % MEASURE_PALETTE.length];
              badges.push({ id: m.id, screenX, screenY, distance: m.distance, color: c });
            }
          }
        });

        const prev = lastBadgesRef.current;
        let isDifferent = prev.length !== badges.length;
        if (!isDifferent) {
          for (let i = 0; i < badges.length; i++) {
            if (
              prev[i].id !== badges[i].id ||
              Math.abs(prev[i].screenX - badges[i].screenX) > 0.5 ||
              Math.abs(prev[i].screenY - badges[i].screenY) > 0.5 ||
              prev[i].distance !== badges[i].distance ||
              prev[i].color !== badges[i].color
            ) {
              isDifferent = true;
              break;
            }
          }
        }

        if (isDifferent) {
          lastBadgesRef.current = badges;
          setMeasureLabels(badges);
        }
      } else {
        if (lastBadgesRef.current.length > 0) {
          lastBadgesRef.current = [];
          setMeasureLabels([]);
        }
      }

      // Only execute heavy WebGL fragment rasterization when the scene actually demands rendering!
      if (demandFramesRef.current > 0) {
        demandFramesRef.current--;
        if (rendererRef.current && sceneRef.current && activeCameraRef.current) {
          rendererRef.current.render(sceneRef.current, activeCameraRef.current);
        }
      }
    };

    animate();

    // Resize Observer
    const handleResize = () => {
      const el = canvasContainerRef.current || containerRef.current;
      if (!el || !rendererRef.current) return;
      const w = el.clientWidth;
      const h = el.clientHeight;

      rendererRef.current.setSize(w, h);
      const newAspect = w / h;

      if (perspectiveCameraRef.current) {
        perspectiveCameraRef.current.aspect = newAspect;
        perspectiveCameraRef.current.updateProjectionMatrix();
      }

      if (orthographicCameraRef.current) {
        const d = modelRadiusRef.current * 1.5;
        orthographicCameraRef.current.left = -d * newAspect;
        orthographicCameraRef.current.right = d * newAspect;
        orthographicCameraRef.current.top = d;
        orthographicCameraRef.current.bottom = -d;
        orthographicCameraRef.current.updateProjectionMatrix();
      }

      requestRender(20);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(containerRef.current);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', handleContextRestored);
      shadowGeo.dispose();
      shadowMat.dispose();
      clipPlaneGeo.dispose();
      clipPlaneMat.dispose();
      gridHelper.geometry.dispose();
      if (Array.isArray(gridHelper.material)) {
        gridHelper.material.forEach((m) => m.dispose());
      } else {
        gridHelper.material.dispose();
      }
      axesHelper.geometry.dispose();
      if (Array.isArray(axesHelper.material)) {
        axesHelper.material.forEach((m) => m.dispose());
      } else {
        axesHelper.material.dispose();
      }
      if (studioEnvTexture) {
        studioEnvTexture.dispose();
      }
      textureCacheRef.current.forEach((tex) => tex.dispose());
      textureCacheRef.current.clear();
      controls.dispose();
      renderer.dispose();
    };
  }, []);

  // Projection Mode Switch
  useEffect(() => {
    if (!perspectiveCameraRef.current || !orthographicCameraRef.current || !controlsRef.current) return;

    const w = containerRef.current?.clientWidth || window.innerWidth;
    const h = containerRef.current?.clientHeight || window.innerHeight;
    const aspect = w / h;

    const currentCam = activeCameraRef.current;
    const currentPos = currentCam ? currentCam.position.clone() : new THREE.Vector3(4, 3, 5);
    const target = controlsRef.current.target.clone();

    if (projectionMode === 'perspective') {
      activeCameraRef.current = perspectiveCameraRef.current;
      perspectiveCameraRef.current.position.copy(currentPos);
      perspectiveCameraRef.current.aspect = aspect;
      perspectiveCameraRef.current.updateProjectionMatrix();
    } else {
      activeCameraRef.current = orthographicCameraRef.current;
      const d = modelRadiusRef.current * 1.5;
      orthographicCameraRef.current.position.copy(currentPos);
      orthographicCameraRef.current.left = -d * aspect;
      orthographicCameraRef.current.right = d * aspect;
      orthographicCameraRef.current.top = d;
      orthographicCameraRef.current.bottom = -d;
      orthographicCameraRef.current.updateProjectionMatrix();
    }

    controlsRef.current.object = activeCameraRef.current;
    controlsRef.current.target.copy(target);
    controlsRef.current.update();
    requestRender(30);
  }, [projectionMode]);

  // Update Background & Environment Lighting
  useEffect(() => {
    if (!sceneRef.current || !lightsGroupRef.current) return;

    // Background Styling
    switch (envSettings.background) {
      case 'dark':
        sceneRef.current.background = new THREE.Color(0x090d16);
        break;
      case 'light':
        sceneRef.current.background = new THREE.Color(0xf1f5f9);
        break;
      case 'studio':
        sceneRef.current.background = new THREE.Color(0x1e293b);
        break;
      case 'grid':
        sceneRef.current.background = new THREE.Color(0x0f172a);
        break;
      case 'gradient':
        sceneRef.current.background = new THREE.Color(0x111827);
        break;
      default:
        sceneRef.current.background = new THREE.Color(envSettings.bgColor || '#0f172a');
    }

    // Rebuild Lights Setup
    const lightsGroup = lightsGroupRef.current;
    lightsGroup.clear();

    const mult = envSettings.lightIntensity;

    switch (envSettings.lighting) {
      case 'studio': {
        const ambient = new THREE.AmbientLight(0xffffff, 0.8 * mult);
        lightsGroup.add(ambient);

        const keyLight = new THREE.DirectionalLight(0xfff5ea, 1.2 * mult);
        keyLight.position.set(5, 8, 5);
        keyLight.castShadow = true;
        keyLight.shadow.mapSize.width = 2048;
        keyLight.shadow.mapSize.height = 2048;
        lightsGroup.add(keyLight);

        const fillLight = new THREE.DirectionalLight(0x93c5fd, 0.6 * mult);
        fillLight.position.set(-5, 4, -3);
        lightsGroup.add(fillLight);

        const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.8 * mult);
        rimLight.position.set(0, -4, -5);
        lightsGroup.add(rimLight);
        break;
      }
      case 'daylight': {
        const hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x166534, 0.9 * mult);
        lightsGroup.add(hemiLight);

        const sunLight = new THREE.DirectionalLight(0xfffbeb, 1.5 * mult);
        sunLight.position.set(8, 12, 6);
        sunLight.castShadow = true;
        sunLight.shadow.mapSize.width = 2048;
        sunLight.shadow.mapSize.height = 2048;
        lightsGroup.add(sunLight);
        break;
      }
      case 'sunset': {
        const ambient = new THREE.AmbientLight(0xfed7aa, 0.5 * mult);
        lightsGroup.add(ambient);

        const sunLight = new THREE.DirectionalLight(0xf97316, 1.8 * mult);
        sunLight.position.set(10, 4, -4);
        sunLight.castShadow = true;
        lightsGroup.add(sunLight);

        const skyLight = new THREE.DirectionalLight(0xa855f7, 0.7 * mult);
        skyLight.position.set(-8, 6, 8);
        lightsGroup.add(skyLight);
        break;
      }
      case 'cyberpunk': {
        const ambient = new THREE.AmbientLight(0x1e1b4b, 0.6 * mult);
        lightsGroup.add(ambient);

        const cyanLight = new THREE.DirectionalLight(0x06b6d4, 1.5 * mult);
        cyanLight.position.set(-6, 6, 6);
        lightsGroup.add(cyanLight);

        const magentaLight = new THREE.DirectionalLight(0xec4899, 1.5 * mult);
        magentaLight.position.set(6, -2, -6);
        lightsGroup.add(magentaLight);
        break;
      }
      case 'dramatic': {
        const ambient = new THREE.AmbientLight(0x020617, 0.3 * mult);
        lightsGroup.add(ambient);

        const spotLight = new THREE.SpotLight(0xffffff, 2.5 * mult);
        spotLight.position.set(0, 10, 0);
        spotLight.angle = Math.PI / 4;
        spotLight.penumbra = 0.5;
        spotLight.castShadow = true;
        lightsGroup.add(spotLight);
        break;
      }
    }

    if (rendererRef.current && rendererRef.current.shadowMap.enabled) {
      rendererRef.current.shadowMap.needsUpdate = true;
    }
    requestRender(30);
  }, [envSettings]);

  // Load Model into Scene Wrapper
  useEffect(() => {
    if (!modelWrapperRef.current || !sceneRef.current) return;

    const wrapper = modelWrapperRef.current;
    wrapper.clear();

    if (boundingBoxHelperRef.current) {
      boundingBoxHelperRef.current.geometry.dispose();
      if (Array.isArray(boundingBoxHelperRef.current.material)) {
        boundingBoxHelperRef.current.material.forEach((m) => m.dispose());
      } else {
        boundingBoxHelperRef.current.material.dispose();
      }
      sceneRef.current.remove(boundingBoxHelperRef.current);
      boundingBoxHelperRef.current = null;
    }

    if (modelScene) {
      originalMapsRef.current.clear();
      let totalTriangles = 0;

      // Optimize Photogrammetric single-mesh and multi-part 3D scans
      modelScene.traverse((node) => {
        if (node instanceof THREE.Mesh) {
          node.frustumCulled = true;
          node.castShadow = true;
          node.receiveShadow = true;

          if (node.geometry) {
            if (node.geometry.index) {
              totalTriangles += node.geometry.index.count / 3;
            } else if (node.geometry.attributes.position) {
              totalTriangles += node.geometry.attributes.position.count / 3;
            }
            if (!node.geometry.attributes.normal) {
              node.geometry.computeVertexNormals();
            }
            node.geometry.computeBoundingBox();
            node.geometry.computeBoundingSphere();
          }

          if (node.material) {
            const mats = Array.isArray(node.material) ? node.material : [node.material];
            mats.forEach((m) => {
              if ('roughness' in m && (m.roughness === 0 || m.roughness === undefined)) {
                m.roughness = 0.8;
              }
              m.side = THREE.DoubleSide; // Photogrammetry scans often contain single-sided polygons
            });
          }
        }
      });

      modelTriangleCountRef.current = Math.round(totalTriangles);

      // Add model to scene wrapper
      wrapper.add(modelScene);

      // Compute bounding box & center model at origin
      const box = new THREE.Box3().setFromObject(modelScene);
      const center = new THREE.Vector3();
      const size = new THREE.Vector3();

      if (!box.isEmpty()) {
        box.getCenter(center);
        box.getSize(size);

        // Center scene so model sits cleanly on grid floor
        modelScene.position.sub(center);
        modelScene.position.y += size.y / 2;

        const maxDim = Math.max(size.x, size.y, size.z);
        modelRadiusRef.current = maxDim > 0 ? maxDim : 1;
        modelCenterRef.current.set(0, size.y / 2, 0);

        // Position shadow floor plane under model
        if (shadowPlaneRef.current) {
          shadowPlaneRef.current.position.y = 0;
        }

        // Create bounding box helper
        const boxHelper = new THREE.BoxHelper(modelScene, 0x06b6d4);
        boxHelper.visible = renderSettings.showBoundingBox;
        sceneRef.current.add(boxHelper);
        boundingBoxHelperRef.current = boxHelper;
      }

      // Adjust camera to view full model
      fitCameraToModel();
    } else {
      modelTriangleCountRef.current = 0;
    }

    if (shadowPlaneRef.current) {
      shadowPlaneRef.current.visible = !!modelScene && renderSettings.showShadows && !renderSettings.performanceMode;
    }
    if (rendererRef.current && rendererRef.current.shadowMap.enabled) {
      rendererRef.current.shadowMap.needsUpdate = true;
    }
    requestRender(60);
  }, [modelScene]);

  // Handle Animation Clips Setup
  useEffect(() => {
    if (!modelScene) return;

    if (rawClips && rawClips.length > 0) {
      const mixer = new THREE.AnimationMixer(modelScene);
      mixerRef.current = mixer;

      if (activeAnimationIndex !== null && rawClips[activeAnimationIndex]) {
        if (currentActionRef.current) {
          currentActionRef.current.stop();
        }
        const clip = rawClips[activeAnimationIndex];
        const action = mixer.clipAction(clip);
        action.play();
        currentActionRef.current = action;
      }
    } else {
      mixerRef.current = null;
      currentActionRef.current = null;
    }
  }, [modelScene, rawClips, activeAnimationIndex]);

  // Update Animation Play / Pause State
  useEffect(() => {
    if (currentActionRef.current) {
      currentActionRef.current.paused = !isPlayingAnimation;
    }
  }, [isPlayingAnimation]);

  // Update Render Settings (Mode, Wireframe, Explode, Clipping, Helpers)
  useEffect(() => {
    if (!modelWrapperRef.current) return;

    if (gridHelperRef.current) {
      gridHelperRef.current.visible = renderSettings.showGrid;
    }
    if (axesHelperRef.current) {
      axesHelperRef.current.visible = renderSettings.showAxes;
    }
    if (boundingBoxHelperRef.current) {
      boundingBoxHelperRef.current.visible = renderSettings.showBoundingBox;
    }
    if (shadowPlaneRef.current) {
      shadowPlaneRef.current.visible = renderSettings.showShadows && !renderSettings.performanceMode;
    }

    // Dynamic WebGL Renderer Performance Tuning
    if (rendererRef.current) {
      const isPerf = !!renderSettings.performanceMode;
      const resScale = renderSettings.resolutionScale || 1.0;
      const targetRatio = isPerf ? 0.85 : resScale;
      const pixelRatio = Math.min(window.devicePixelRatio * targetRatio, isPerf ? 1.0 : 2.0);
      rendererRef.current.setPixelRatio(pixelRatio);

      const enableShadows = renderSettings.showShadows && !isPerf;
      rendererRef.current.shadowMap.enabled = enableShadows;
    }

    if (lightsGroupRef.current) {
      const enableShadows = renderSettings.showShadows && !renderSettings.performanceMode;
      lightsGroupRef.current.traverse((light) => {
        if (light instanceof THREE.DirectionalLight) {
          light.castShadow = enableShadows;
        }
      });
    }

    // Configure Section Clipping Plane
    if (rendererRef.current && clippingPlaneRef.current) {
      rendererRef.current.localClippingEnabled = renderSettings.clippingEnabled;

      if (renderSettings.clippingEnabled) {
        const radius = modelRadiusRef.current * 1.5;
        const val = renderSettings.clippingValue * radius; // scale range
        const sign = renderSettings.clippingInvert ? -1 : 1;

        if (renderSettings.clippingAxis === 'x') {
          clippingPlaneRef.current.set(new THREE.Vector3(sign, 0, 0), -sign * val);
        } else if (renderSettings.clippingAxis === 'y') {
          clippingPlaneRef.current.set(new THREE.Vector3(0, sign, 0), -sign * val);
        } else {
          clippingPlaneRef.current.set(new THREE.Vector3(0, 0, sign), -sign * val);
        }

        // Update visual plane indicator
        if (clippingPlaneMeshRef.current) {
          clippingPlaneMeshRef.current.visible = true;
          if (renderSettings.clippingAxis === 'x') {
            clippingPlaneMeshRef.current.rotation.set(0, Math.PI / 2, 0);
            clippingPlaneMeshRef.current.position.set(val, modelRadiusRef.current / 2, 0);
          } else if (renderSettings.clippingAxis === 'y') {
            clippingPlaneMeshRef.current.rotation.set(Math.PI / 2, 0, 0);
            clippingPlaneMeshRef.current.position.set(0, val, 0);
          } else {
            clippingPlaneMeshRef.current.rotation.set(0, 0, 0);
            clippingPlaneMeshRef.current.position.set(0, modelRadiusRef.current / 2, val);
          }
        }
      } else if (clippingPlaneMeshRef.current) {
        clippingPlaneMeshRef.current.visible = false;
      }
    }

    // Traverse scene to update Materials, Wireframe, Node Hiding
    modelWrapperRef.current.traverse((node) => {
      if (node instanceof THREE.Mesh) {
        // Isolated or hidden node check
        let isVisible = true;
        if (hiddenNodeIds.has(node.uuid)) {
          isVisible = false;
        } else if (isolatedNodeId && node.uuid !== isolatedNodeId) {
          isVisible = false;
        }
        node.visible = isVisible;

        // Apply Section Clipping Planes to mesh material
        if (Array.isArray(node.material)) {
          node.material.forEach((mat) => {
            mat.clippingPlanes = renderSettings.clippingEnabled ? [clippingPlaneRef.current!] : [];
            mat.clipShadows = true;
            mat.needsUpdate = true;
          });
        } else if (node.material) {
          node.material.clippingPlanes = renderSettings.clippingEnabled ? [clippingPlaneRef.current!] : [];
          node.material.clipShadows = true;
          node.material.needsUpdate = true;
        }

        // Apply Material Overrides or Render Modes
        const mat = node.material;
        const singleMat = Array.isArray(mat) ? mat[0] : mat;

        if (singleMat) {
          // Highlight check
          if (highlightedNodeId === node.uuid) {
            singleMat.emissive = new THREE.Color(0x06b6d4);
            singleMat.emissiveIntensity = 0.5;
          } else if (singleMat.emissive) {
            singleMat.emissive = new THREE.Color(0x000000);
            singleMat.emissiveIntensity = 0;
          }

          // Custom override for this mesh or global override
          const override = materialOverrides.get(node.uuid) || materialOverrides.get('__GLOBAL__');

          // Render Modes ('shaded' | 'wireframe' | 'vertice' | 'xray')
          if (renderSettings.mode === 'wireframe') {
            singleMat.wireframe = true;
            singleMat.visible = true;
            singleMat.side = THREE.FrontSide;
            singleMat.depthWrite = true;
            const effOpacity = override?.opacity ?? 1.0;
            singleMat.opacity = effOpacity;
            singleMat.transparent = effOpacity < 1.0;
            singleMat.needsUpdate = true;
            if (node.userData.pointsMesh) {
              (node.userData.pointsMesh as THREE.Points).visible = false;
            }
          } else if (renderSettings.mode === 'xray') {
            singleMat.wireframe = false;
            singleMat.visible = true;
            singleMat.side = THREE.DoubleSide;
            singleMat.depthWrite = false;
            singleMat.transparent = true;
            singleMat.opacity = 0.35;
            singleMat.needsUpdate = true;
            if (node.userData.pointsMesh) {
              (node.userData.pointsMesh as THREE.Points).visible = false;
            }
          } else if (renderSettings.mode === 'vertice') {
            singleMat.visible = false; // Hide solid polygon surfaces

            let pointsObj = node.userData.pointsMesh as THREE.Points | undefined;
            if (!pointsObj && node.geometry) {
              const pMat = new THREE.PointsMaterial({
                sizeAttenuation: false,
                transparent: true,
                opacity: 0.95,
              });
              pointsObj = new THREE.Points(node.geometry, pMat);
              pointsObj.name = '__VERTICES_POINTS_CLOUD__';
              node.add(pointsObj);
              node.userData.pointsMesh = pointsObj;
            }

            if (pointsObj) {
              pointsObj.visible = isVisible;
              const pMat = pointsObj.material as THREE.PointsMaterial;
              pMat.sizeAttenuation = false;
              pMat.size = renderSettings.pointSize || 2.5;
              pMat.clippingPlanes = renderSettings.clippingEnabled ? [clippingPlaneRef.current!] : [];
              const colorHex = override?.color || (highlightedNodeId === node.uuid ? '#06b6d4' : '#38bdf8');
              pMat.color = new THREE.Color(colorHex);
              pMat.needsUpdate = true;
            }
          } else {
            // 'shaded' (default)
            singleMat.wireframe = false;
            singleMat.visible = true;
            singleMat.side = THREE.FrontSide;
            singleMat.depthWrite = true;
            const effOpacity = override?.opacity ?? 1.0;
            singleMat.opacity = effOpacity;
            singleMat.transparent = effOpacity < 1.0;
            singleMat.needsUpdate = true;
            if (node.userData.pointsMesh) {
              (node.userData.pointsMesh as THREE.Points).visible = false;
            }
          }

          // Store original material state if not already cached
          if (!originalMapsRef.current.has(node.uuid)) {
            originalMapsRef.current.set(node.uuid, {
              map: singleMat.map || null,
              normalMap: singleMat.normalMap || null,
              color: singleMat.color ? singleMat.color.clone() : new THREE.Color(0xffffff)
            });
          }

          const orig = originalMapsRef.current.get(node.uuid);

          if (override) {
            // Color tinting
            if (override.color && 'color' in singleMat) {
              singleMat.color = new THREE.Color(override.color);
            } else if (!override.textureUrl && orig) {
              singleMat.color = orig.color.clone();
            }

            if (override.roughness !== undefined && 'roughness' in singleMat) {
              singleMat.roughness = override.roughness;
            }
            if (override.metalness !== undefined && 'metalness' in singleMat) {
              singleMat.metalness = override.metalness;
            }

            // UV Texture Map Handling
            if (override.textureUrl) {
              let tex = textureCacheRef.current.get(override.textureUrl);
              if (!tex) {
                const loader = new THREE.TextureLoader();
                tex = loader.load(override.textureUrl, () => {
                  if (rendererRef.current && sceneRef.current && activeCameraRef.current) {
                    rendererRef.current.render(sceneRef.current, activeCameraRef.current);
                  }
                });
                textureCacheRef.current.set(override.textureUrl, tex);
              }
              tex.wrapS = THREE.RepeatWrapping;
              tex.wrapT = THREE.RepeatWrapping;
              const repU = override.repeatU ?? 1.0;
              const repV = override.repeatV ?? 1.0;
              tex.repeat.set(repU, repV);
              if (override.flipY !== undefined) {
                tex.flipY = override.flipY;
              }
              singleMat.map = tex;
              // If color tint not explicitly set, keep white so texture renders accurately
              if (!override.color) {
                singleMat.color = new THREE.Color(0xffffff);
              }
              singleMat.needsUpdate = true;
            } else if (orig) {
              singleMat.map = orig.map;
              singleMat.needsUpdate = true;
            }

            // Normal Map Handling
            if (override.normalMapUrl) {
              let normTex = textureCacheRef.current.get(override.normalMapUrl);
              if (!normTex) {
                const loader = new THREE.TextureLoader();
                normTex = loader.load(override.normalMapUrl, () => {
                  if (rendererRef.current && sceneRef.current && activeCameraRef.current) {
                    rendererRef.current.render(sceneRef.current, activeCameraRef.current);
                  }
                });
                textureCacheRef.current.set(override.normalMapUrl, normTex);
              }
              normTex.wrapS = THREE.RepeatWrapping;
              normTex.wrapT = THREE.RepeatWrapping;
              const repU = override.repeatU ?? 1.0;
              const repV = override.repeatV ?? 1.0;
              normTex.repeat.set(repU, repV);
              singleMat.normalMap = normTex;
              singleMat.needsUpdate = true;
            } else if (orig) {
              singleMat.normalMap = orig.normalMap;
              singleMat.needsUpdate = true;
            }
          } else if (orig) {
            singleMat.map = orig.map;
            singleMat.normalMap = orig.normalMap;
            singleMat.color = orig.color.clone();
            singleMat.needsUpdate = true;
          }
        }
      }
    });

    if (boundingBoxHelperRef.current) {
      boundingBoxHelperRef.current.update();
    }

    // Dynamic Camera FOV adjustment
    if (perspectiveCameraRef.current) {
      const targetFov = renderSettings.fov || 45;
      if (perspectiveCameraRef.current.fov !== targetFov) {
        perspectiveCameraRef.current.fov = targetFov;
        perspectiveCameraRef.current.updateProjectionMatrix();
      }
    }

    if (rendererRef.current && rendererRef.current.shadowMap.enabled) {
      rendererRef.current.shadowMap.needsUpdate = true;
    }
    requestRender(30);
  }, [renderSettings, isolatedNodeId, hiddenNodeIds, highlightedNodeId, materialOverrides]);

  // Fit Camera helper
  const fitCameraToModel = () => {
    if (!activeCameraRef.current || !controlsRef.current) return;

    const radius = modelRadiusRef.current;
    const center = modelCenterRef.current;

    const fov = perspectiveCameraRef.current ? perspectiveCameraRef.current.fov * (Math.PI / 180) : Math.PI / 4;
    let distance = radius / Math.sin(fov / 2);
    distance = Math.max(distance, 2);

    const activeCam = activeCameraRef.current;
    activeCam.position.set(center.x + distance * 0.8, center.y + distance * 0.6, center.z + distance * 1.0);

    controlsRef.current.target.copy(center);
    controlsRef.current.update();
    requestRender(20);
  };

  // Measurement Lines Visual rendering with Through-Mesh Occlusion Ghosting
  useEffect(() => {
    if (!measurementGroupRef.current) return;
    const group = measurementGroupRef.current;
    disposeGroupContents(group);

    const markerScale = renderSettings.markerScale || 1.0;
    const baseScale = Math.max(modelRadiusRef.current * 0.004, 0.001);
    const measureRadius = baseScale * markerScale;
    const sphereGeo = new THREE.SphereGeometry(measureRadius, 16, 16);
    const useGhostPass = renderSettings.markerOcclusionGhost !== false;

    measurements.forEach((m, idx) => {
      const p1 = new THREE.Vector3(m.p1.x, m.p1.y, m.p1.z);
      const p2 = new THREE.Vector3(m.p2.x, m.p2.y, m.p2.z);
      const hexColor = m.color || MEASURE_PALETTE[idx % MEASURE_PALETTE.length];
      const mColor = new THREE.Color(hexColor);

      // 1. Marker Spheres (Foreground + Occluded Ghost)
      if (useGhostPass) {
        const ghostMat = new THREE.MeshStandardMaterial({
          color: mColor,
          emissive: mColor,
          emissiveIntensity: 0.3,
          transparent: true,
          opacity: 0.35,
          depthTest: true,
          depthFunc: THREE.GreaterDepth,
          depthWrite: false
        });
        const g1 = new THREE.Mesh(sphereGeo, ghostMat);
        g1.position.copy(p1);
        g1.renderOrder = 19;
        group.add(g1);

        const g2 = new THREE.Mesh(sphereGeo, ghostMat);
        g2.position.copy(p2);
        g2.renderOrder = 19;
        group.add(g2);
      }

      const mMat = new THREE.MeshStandardMaterial({
        color: mColor,
        emissive: mColor,
        emissiveIntensity: 0.6,
        roughness: 0.3,
        depthTest: true,
        depthFunc: THREE.LessEqualDepth,
        polygonOffset: true,
        polygonOffsetFactor: -1.0,
        polygonOffsetUnits: -1.0
      });
      const s1 = new THREE.Mesh(sphereGeo, mMat);
      s1.position.copy(p1);
      s1.renderOrder = 20;
      group.add(s1);

      const s2 = new THREE.Mesh(sphereGeo, mMat);
      s2.position.copy(p2);
      s2.renderOrder = 20;
      group.add(s2);

      // 2. Line (Foreground + Occluded Ghost)
      const lineGeo = new THREE.BufferGeometry().setFromPoints([p1, p2]);
      if (useGhostPass) {
        const ghostLineMat = new THREE.LineBasicMaterial({
          color: mColor,
          linewidth: 2,
          transparent: true,
          opacity: 0.35,
          depthTest: true,
          depthFunc: THREE.GreaterDepth,
          depthWrite: false
        });
        const ghostLine = new THREE.Line(lineGeo, ghostLineMat);
        ghostLine.renderOrder = 19;
        group.add(ghostLine);
      }

      const lineMat = new THREE.LineBasicMaterial({
        color: mColor,
        linewidth: 3,
        depthTest: true,
        depthFunc: THREE.LessEqualDepth
      });
      const line = new THREE.Line(lineGeo, lineMat);
      line.renderOrder = 20;
      group.add(line);

      // 3. Tube cylinder along line for visibility
      const dir = new THREE.Vector3().subVectors(p2, p1);
      const len = dir.length();
      if (len > 0.001) {
        const tubeGeo = new THREE.CylinderGeometry(measureRadius * 0.3, measureRadius * 0.3, len, 8);
        if (useGhostPass) {
          const ghostTubeMat = new THREE.MeshStandardMaterial({
            color: mColor,
            emissive: mColor,
            emissiveIntensity: 0.2,
            transparent: true,
            opacity: 0.25,
            depthTest: true,
            depthFunc: THREE.GreaterDepth,
            depthWrite: false
          });
          const ghostTubeMesh = new THREE.Mesh(tubeGeo, ghostTubeMat);
          ghostTubeMesh.position.copy(p1).add(p2).multiplyScalar(0.5);
          ghostTubeMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
          ghostTubeMesh.renderOrder = 19;
          group.add(ghostTubeMesh);
        }

        const tubeMat = new THREE.MeshStandardMaterial({
          color: mColor,
          emissive: mColor,
          emissiveIntensity: 0.5,
          transparent: true,
          opacity: 0.85,
          depthTest: true,
          depthFunc: THREE.LessEqualDepth,
          polygonOffset: true,
          polygonOffsetFactor: -1.0,
          polygonOffsetUnits: -1.0
        });
        const tubeMesh = new THREE.Mesh(tubeGeo, tubeMat);
        tubeMesh.position.copy(p1).add(p2).multiplyScalar(0.5);
        tubeMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
        tubeMesh.renderOrder = 20;
        group.add(tubeMesh);
      }
    });

    // Draw pending point 1 & live hover preview
    if (pendingMeasurePointRef.current) {
      const p = pendingMeasurePointRef.current;
      const p1Vec = new THREE.Vector3(p.x, p.y, p.z);
      const sp = new THREE.Mesh(
        sphereGeo,
        new THREE.MeshStandardMaterial({
          color: 0xf59e0b,
          emissive: 0xf59e0b,
          emissiveIntensity: 0.9,
          depthTest: true,
          depthFunc: THREE.LessEqualDepth
        })
      );
      sp.position.copy(p1Vec);
      sp.renderOrder = 20;
      group.add(sp);

      // Pulsing ring at Point 1
      const ringGeo = new THREE.RingGeometry(measureRadius * 1.5, measureRadius * 2.2, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xf59e0b,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8,
        depthTest: true,
        depthFunc: THREE.LessEqualDepth
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.copy(p1Vec);
      ring.rotation.x = Math.PI / 2;
      ring.renderOrder = 20;
      group.add(ring);

      // Live Hover Preview Line & End Point
      if (measurePreview) {
        const p2Vec = new THREE.Vector3(measurePreview.p2.x, measurePreview.p2.y, measurePreview.p2.z);
        const prevLineGeo = new THREE.BufferGeometry().setFromPoints([p1Vec, p2Vec]);

        if (useGhostPass) {
          const ghostPrevLineMat = new THREE.LineBasicMaterial({
            color: 0x10b981,
            linewidth: 2,
            transparent: true,
            opacity: 0.35,
            depthTest: true,
            depthFunc: THREE.GreaterDepth,
            depthWrite: false
          });
          const ghostPrevLine = new THREE.Line(prevLineGeo, ghostPrevLineMat);
          ghostPrevLine.renderOrder = 19;
          group.add(ghostPrevLine);
        }

        const prevLineMat = new THREE.LineBasicMaterial({
          color: 0x10b981,
          linewidth: 2,
          depthTest: true,
          depthFunc: THREE.LessEqualDepth
        });
        const prevLine = new THREE.Line(prevLineGeo, prevLineMat);
        prevLine.renderOrder = 20;
        group.add(prevLine);

        const targetMesh = new THREE.Mesh(
          sphereGeo,
          new THREE.MeshStandardMaterial({
            color: 0x10b981,
            emissive: 0x10b981,
            emissiveIntensity: 1.0,
            depthTest: true,
            depthFunc: THREE.LessEqualDepth
          })
        );
        targetMesh.position.copy(p2Vec);
        targetMesh.renderOrder = 20;
        group.add(targetMesh);
      }
    }

    requestRender(20);

    return () => {
      disposeGroupContents(group);
      sphereGeo.dispose();
    };
  }, [measurements, pendingMeasurePointRef.current, measurePreview, renderSettings.markerScale, renderSettings.markerOcclusionGhost]);

  // GIS 3D Spatial Pins & Geometries Visual rendering (with Through-Mesh Occlusion Ghosting)
  useEffect(() => {
    if (!annotationsGroupRef.current) return;
    const group = annotationsGroupRef.current;
    disposeGroupContents(group);

    const markerScale = renderSettings.markerScale || 1.0;
    const baseScale = Math.max(modelRadiusRef.current * 0.005, 0.001);
    const pinRadius = baseScale * markerScale;
    const sphereGeo = new THREE.SphereGeometry(pinRadius, 24, 24);
    const useGhostPass = renderSettings.markerOcclusionGhost !== false;

    const hiddenGroupIds = new Set(spatialGroups.filter(g => g.visible === false).map(g => g.id));
    const visibleAnnotations = annotations.filter(anno => !anno.groupId || !hiddenGroupIds.has(anno.groupId));

    // Helper: Add mesh with both Foreground pass and Faded Occluded Ghost pass
    const addDualPassMesh = (
      geo: THREE.BufferGeometry,
      frontMat: THREE.Material,
      ghostMat: THREE.Material | null,
      config?: {
        position?: THREE.Vector3;
        quaternion?: THREE.Quaternion;
        scale?: number;
        rotation?: THREE.Euler;
        userData?: any;
        renderOrderFront?: number;
        renderOrderGhost?: number;
      }
    ) => {
      // 1. Ghost Pass (rendered when occluded behind mesh faces)
      if (useGhostPass && ghostMat) {
        ghostMat.depthTest = true;
        ghostMat.depthFunc = THREE.GreaterDepth;
        ghostMat.depthWrite = false;
        const ghostMesh = new THREE.Mesh(geo, ghostMat);
        ghostMesh.renderOrder = config?.renderOrderGhost ?? 19;
        if (config?.position) ghostMesh.position.copy(config.position);
        if (config?.quaternion) ghostMesh.quaternion.copy(config.quaternion);
        if (config?.rotation) ghostMesh.rotation.copy(config.rotation);
        if (config?.scale !== undefined) ghostMesh.scale.setScalar(config.scale);
        if (config?.userData) ghostMesh.userData = { ...config.userData, isGhostPass: true };
        group.add(ghostMesh);
      }

      // 2. Foreground Pass (rendered when in front of mesh)
      frontMat.depthTest = true;
      frontMat.depthFunc = THREE.LessEqualDepth;
      const frontMesh = new THREE.Mesh(geo, frontMat);
      frontMesh.renderOrder = config?.renderOrderFront ?? 20;
      if (config?.position) frontMesh.position.copy(config.position);
      if (config?.quaternion) frontMesh.quaternion.copy(config.quaternion);
      if (config?.rotation) frontMesh.rotation.copy(config.rotation);
      if (config?.scale !== undefined) frontMesh.scale.setScalar(config.scale);
      if (config?.userData) frontMesh.userData = config.userData;
      group.add(frontMesh);
      return frontMesh;
    };

    // Helper: Add line with both Foreground pass and Faded Occluded Ghost pass
    const addDualPassLine = (
      geo: THREE.BufferGeometry,
      color: THREE.Color,
      linewidth: number,
      config?: {
        userData?: any;
        isSelected?: boolean;
        renderOrderFront?: number;
        renderOrderGhost?: number;
      }
    ) => {
      // 1. Ghost Pass
      if (useGhostPass) {
        const ghostLineMat = new THREE.LineBasicMaterial({
          color: color,
          linewidth: Math.max(linewidth - 1, 1),
          transparent: true,
          opacity: config?.isSelected ? 0.45 : 0.28,
          depthTest: true,
          depthFunc: THREE.GreaterDepth,
          depthWrite: false
        });
        const ghostLine = new THREE.Line(geo, ghostLineMat);
        ghostLine.renderOrder = config?.renderOrderGhost ?? 19;
        if (config?.userData) ghostLine.userData = { ...config.userData, isGhostPass: true };
        group.add(ghostLine);
      }

      // 2. Foreground Pass
      const frontLineMat = new THREE.LineBasicMaterial({
        color: color,
        linewidth: linewidth,
        depthTest: true,
        depthFunc: THREE.LessEqualDepth,
        transparent: true,
        opacity: 0.95
      });
      const frontLine = new THREE.Line(geo, frontLineMat);
      frontLine.renderOrder = config?.renderOrderFront ?? 20;
      if (config?.userData) frontLine.userData = config.userData;
      group.add(frontLine);
      return frontLine;
    };

    visibleAnnotations.forEach((anno) => {
      const isSelected = selectedAnnotationId === anno.id;
      const hexColor = new THREE.Color(anno.color || '#3b82f6');
      const geomType = anno.geometryType || 'point';

      // 1. Point / Pin Marker
      if (geomType === 'point' || !anno.points || anno.points.length === 0) {
        const frontMat = new THREE.MeshStandardMaterial({
          color: hexColor,
          emissive: hexColor,
          emissiveIntensity: isSelected ? 0.9 : 0.35,
          roughness: 0.2,
          metalness: 0.5,
          polygonOffset: true,
          polygonOffsetFactor: -1.0,
          polygonOffsetUnits: -1.0
        });
        const ghostMat = new THREE.MeshStandardMaterial({
          color: hexColor,
          emissive: hexColor,
          emissiveIntensity: isSelected ? 0.5 : 0.2,
          transparent: true,
          opacity: isSelected ? 0.45 : 0.25
        });

        addDualPassMesh(sphereGeo, frontMat, ghostMat, {
          position: new THREE.Vector3(anno.position.x, anno.position.y, anno.position.z),
          userData: { annotationId: anno.id }
        });

        if (isSelected) {
          const ringGeo = new THREE.RingGeometry(pinRadius * 1.3, pinRadius * 1.8, 32);
          const ringFrontMat = new THREE.MeshBasicMaterial({
            color: hexColor,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.85
          });
          const ringGhostMat = new THREE.MeshBasicMaterial({
            color: hexColor,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.35
          });
          addDualPassMesh(ringGeo, ringFrontMat, ringGhostMat, {
            position: new THREE.Vector3(anno.position.x, anno.position.y, anno.position.z),
            rotation: new THREE.Euler(Math.PI / 2, 0, 0),
            userData: { annotationId: anno.id }
          });
        }

        const beaconLineGeo = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(anno.position.x, anno.position.y, anno.position.z),
          new THREE.Vector3(anno.position.x, Math.max(anno.position.y - pinRadius * 2.5, 0), anno.position.z)
        ]);
        addDualPassLine(beaconLineGeo, hexColor, 2, {
          userData: { annotationId: anno.id },
          isSelected
        });
      }

      // 2. Polyline / Path 3D Marker
      else if (geomType === 'polyline' && anno.points && anno.points.length >= 2) {
        const linePts = anno.points.map((p) => new THREE.Vector3(p.x, p.y, p.z));
        const lineGeo = new THREE.BufferGeometry().setFromPoints(linePts);

        // Render continuous polyline with dual-pass (foreground + through-mesh ghost)
        addDualPassLine(lineGeo, hexColor, isSelected ? 4 : 2.5, {
          userData: { annotationId: anno.id },
          isSelected
        });

        // Cylindrical line tube segments for easy mouse raycast hitting & 3D body
        for (let i = 0; i < linePts.length - 1; i++) {
          const p1 = linePts[i];
          const p2 = linePts[i + 1];
          const dir = new THREE.Vector3().subVectors(p2, p1);
          const len = dir.length();
          if (len > 0.001) {
            const cylGeo = new THREE.CylinderGeometry(pinRadius * 0.4, pinRadius * 0.4, len, 8);
            const cylFrontMat = new THREE.MeshStandardMaterial({
              color: hexColor,
              emissive: hexColor,
              emissiveIntensity: isSelected ? 0.9 : 0.4,
              transparent: true,
              opacity: 0.85,
              polygonOffset: true,
              polygonOffsetFactor: -1.5,
              polygonOffsetUnits: -1.5
            });
            const cylGhostMat = new THREE.MeshStandardMaterial({
              color: hexColor,
              emissive: hexColor,
              emissiveIntensity: isSelected ? 0.4 : 0.15,
              transparent: true,
              opacity: isSelected ? 0.35 : 0.20
            });
            addDualPassMesh(cylGeo, cylFrontMat, cylGhostMat, {
              position: p1.clone().add(p2).multiplyScalar(0.5),
              quaternion: new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize()),
              userData: { annotationId: anno.id }
            });
          }
        }

        // Joint spheres at each vertex
        linePts.forEach((pt) => {
          const jointFrontMat = new THREE.MeshStandardMaterial({
            color: hexColor,
            emissive: hexColor,
            emissiveIntensity: isSelected ? 0.9 : 0.4,
            polygonOffset: true,
            polygonOffsetFactor: -1.0,
            polygonOffsetUnits: -1.0
          });
          const jointGhostMat = new THREE.MeshStandardMaterial({
            color: hexColor,
            emissive: hexColor,
            emissiveIntensity: isSelected ? 0.4 : 0.15,
            transparent: true,
            opacity: isSelected ? 0.40 : 0.25
          });
          addDualPassMesh(sphereGeo, jointFrontMat, jointGhostMat, {
            position: pt,
            scale: 0.75,
            userData: { annotationId: anno.id }
          });
        });

        // Center Beacon Pin
        const anchorFrontMat = new THREE.MeshStandardMaterial({
          color: hexColor,
          emissive: hexColor,
          emissiveIntensity: 0.85,
          polygonOffset: true,
          polygonOffsetFactor: -1.0,
          polygonOffsetUnits: -1.0
        });
        const anchorGhostMat = new THREE.MeshStandardMaterial({
          color: hexColor,
          emissive: hexColor,
          emissiveIntensity: 0.35,
          transparent: true,
          opacity: 0.35
        });
        addDualPassMesh(sphereGeo, anchorFrontMat, anchorGhostMat, {
          position: new THREE.Vector3(anno.position.x, anno.position.y, anno.position.z),
          userData: { annotationId: anno.id }
        });
      }

      // 3. Polygon / Surface Area Shape Marker
      else if (geomType === 'polygon' && anno.points && anno.points.length >= 3) {
        const polyPts = anno.points.map((p) => new THREE.Vector3(p.x, p.y, p.z));

        // Triangulated 3D surface mesh for polygon face clicking
        const centerPt = polyPts.reduce((acc, pt) => acc.add(pt), new THREE.Vector3()).divideScalar(polyPts.length);
        const polyGeo = new THREE.BufferGeometry();
        const vertices: number[] = [];
        for (let i = 0; i < polyPts.length; i++) {
          const p1 = polyPts[i];
          const p2 = polyPts[(i + 1) % polyPts.length];
          vertices.push(centerPt.x, centerPt.y, centerPt.z);
          vertices.push(p1.x, p1.y, p1.z);
          vertices.push(p2.x, p2.y, p2.z);
        }
        polyGeo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        polyGeo.computeVertexNormals();

        // Polygon face surface dual-pass (Foreground semi-translucent + Through-Mesh Ghost)
        const polyFrontMat = new THREE.MeshStandardMaterial({
          color: hexColor,
          emissive: hexColor,
          emissiveIntensity: isSelected ? 0.5 : 0.25,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: isSelected ? 0.55 : 0.35,
          roughness: 0.3,
          polygonOffset: true,
          polygonOffsetFactor: -2.0,
          polygonOffsetUnits: -2.0
        });
        const polyGhostMat = new THREE.MeshStandardMaterial({
          color: hexColor,
          emissive: hexColor,
          emissiveIntensity: isSelected ? 0.3 : 0.1,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: isSelected ? 0.25 : 0.15
        });
        addDualPassMesh(polyGeo, polyFrontMat, polyGhostMat, {
          userData: { annotationId: anno.id }
        });

        // Boundary line loop dual-pass
        const loopPts = [...polyPts, polyPts[0]];
        const lineGeo = new THREE.BufferGeometry().setFromPoints(loopPts);
        addDualPassLine(lineGeo, hexColor, isSelected ? 4 : 2.5, {
          userData: { annotationId: anno.id },
          isSelected
        });

        // Corner Vertex Dots
        polyPts.forEach((pt) => {
          const jointFrontMat = new THREE.MeshStandardMaterial({
            color: hexColor,
            emissive: hexColor,
            emissiveIntensity: 0.85,
            polygonOffset: true,
            polygonOffsetFactor: -1.0,
            polygonOffsetUnits: -1.0
          });
          const jointGhostMat = new THREE.MeshStandardMaterial({
            color: hexColor,
            emissive: hexColor,
            emissiveIntensity: 0.35,
            transparent: true,
            opacity: 0.35
          });
          addDualPassMesh(sphereGeo, jointFrontMat, jointGhostMat, {
            position: pt,
            scale: 0.75,
            userData: { annotationId: anno.id }
          });
        });

        // Center Beacon Pin
        const anchorFrontMat = new THREE.MeshStandardMaterial({
          color: hexColor,
          emissive: hexColor,
          emissiveIntensity: 1.0,
          polygonOffset: true,
          polygonOffsetFactor: -1.0,
          polygonOffsetUnits: -1.0
        });
        const anchorGhostMat = new THREE.MeshStandardMaterial({
          color: hexColor,
          emissive: hexColor,
          emissiveIntensity: 0.4,
          transparent: true,
          opacity: 0.35
        });
        addDualPassMesh(sphereGeo, anchorFrontMat, anchorGhostMat, {
          position: new THREE.Vector3(anno.position.x, anno.position.y, anno.position.z),
          userData: { annotationId: anno.id }
        });
      }

      // 4. Box / Solid 3D Volume Marker
      else if (geomType === 'box') {
        const defaultBoxUnit = Math.max(0.5, Math.round(modelRadiusRef.current * 0.15 * 10) / 10);
        const width = (anno.boxDimensions?.width ?? defaultBoxUnit) * (renderSettings.markerScale || 1.0);
        const height = (anno.boxDimensions?.height ?? defaultBoxUnit) * (renderSettings.markerScale || 1.0);
        const depth = (anno.boxDimensions?.depth ?? defaultBoxUnit) * (renderSettings.markerScale || 1.0);

        // Solid 3D Box Mesh dual-pass
        const boxGeo = new THREE.BoxGeometry(width, height, depth);
        const boxFrontMat = new THREE.MeshStandardMaterial({
          color: hexColor,
          emissive: hexColor,
          emissiveIntensity: isSelected ? 0.7 : 0.3,
          transparent: true,
          opacity: isSelected ? 0.65 : 0.4,
          roughness: 0.2,
          metalness: 0.3,
          polygonOffset: true,
          polygonOffsetFactor: -1.0,
          polygonOffsetUnits: -1.0
        });
        const boxGhostMat = new THREE.MeshStandardMaterial({
          color: hexColor,
          emissive: hexColor,
          emissiveIntensity: isSelected ? 0.35 : 0.15,
          transparent: true,
          opacity: isSelected ? 0.30 : 0.18
        });
        addDualPassMesh(boxGeo, boxFrontMat, boxGhostMat, {
          position: new THREE.Vector3(anno.position.x, anno.position.y, anno.position.z),
          userData: { annotationId: anno.id }
        });

        // Glowing Edges / Wireframe dual-pass
        const edgesGeo = new THREE.EdgesGeometry(boxGeo);
        if (useGhostPass) {
          const edgesGhostMat = new THREE.LineBasicMaterial({
            color: hexColor,
            linewidth: 1.5,
            transparent: true,
            opacity: isSelected ? 0.45 : 0.3,
            depthTest: true,
            depthFunc: THREE.GreaterDepth,
            depthWrite: false
          });
          const edgesGhostMesh = new THREE.LineSegments(edgesGeo, edgesGhostMat);
          edgesGhostMesh.position.set(anno.position.x, anno.position.y, anno.position.z);
          edgesGhostMesh.renderOrder = 19;
          edgesGhostMesh.userData = { annotationId: anno.id, isGhostPass: true };
          group.add(edgesGhostMesh);
        }

        const edgesFrontMat = new THREE.LineBasicMaterial({
          color: hexColor,
          linewidth: isSelected ? 3 : 1.5,
          transparent: true,
          opacity: isSelected ? 0.95 : 0.7,
          depthTest: true,
          depthFunc: THREE.LessEqualDepth
        });
        const edgesMesh = new THREE.LineSegments(edgesGeo, edgesFrontMat);
        edgesMesh.position.set(anno.position.x, anno.position.y, anno.position.z);
        edgesMesh.renderOrder = 20;
        edgesMesh.userData = { annotationId: anno.id };
        group.add(edgesMesh);

        // 8 Corner Vertices
        const hW = width / 2;
        const hH = height / 2;
        const hD = depth / 2;
        const cornerOffsets = [
          [-hW, -hH, -hD], [hW, -hH, -hD], [-hW, hH, -hD], [hW, hH, -hD],
          [-hW, -hH, hD],  [hW, -hH, hD],  [-hW, hH, hD],  [hW, hH, hD]
        ];
        cornerOffsets.forEach(([ox, oy, oz]) => {
          const cornerFrontMat = new THREE.MeshStandardMaterial({
            color: hexColor,
            emissive: hexColor,
            emissiveIntensity: isSelected ? 1.0 : 0.6,
            polygonOffset: true,
            polygonOffsetFactor: -1.0,
            polygonOffsetUnits: -1.0
          });
          const cornerGhostMat = new THREE.MeshStandardMaterial({
            color: hexColor,
            emissive: hexColor,
            emissiveIntensity: isSelected ? 0.4 : 0.2,
            transparent: true,
            opacity: isSelected ? 0.4 : 0.2
          });
          addDualPassMesh(sphereGeo, cornerFrontMat, cornerGhostMat, {
            position: new THREE.Vector3(anno.position.x + ox, anno.position.y + oy, anno.position.z + oz),
            scale: 0.6,
            userData: { annotationId: anno.id }
          });
        });

        // Center Beacon Pin
        const anchorFrontMat = new THREE.MeshStandardMaterial({
          color: hexColor,
          emissive: hexColor,
          emissiveIntensity: 1.0,
          polygonOffset: true,
          polygonOffsetFactor: -1.0,
          polygonOffsetUnits: -1.0
        });
        const anchorGhostMat = new THREE.MeshStandardMaterial({
          color: hexColor,
          emissive: hexColor,
          emissiveIntensity: 0.4,
          transparent: true,
          opacity: 0.35
        });
        addDualPassMesh(sphereGeo, anchorFrontMat, anchorGhostMat, {
          position: new THREE.Vector3(anno.position.x, anno.position.y, anno.position.z),
          userData: { annotationId: anno.id }
        });

        if (isSelected) {
          const ringGeo = new THREE.RingGeometry(pinRadius * 1.8, pinRadius * 2.5, 32);
          const ringFrontMat = new THREE.MeshBasicMaterial({
            color: hexColor,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.85
          });
          const ringGhostMat = new THREE.MeshBasicMaterial({
            color: hexColor,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.35
          });
          addDualPassMesh(ringGeo, ringFrontMat, ringGhostMat, {
            position: new THREE.Vector3(anno.position.x, anno.position.y, anno.position.z),
            rotation: new THREE.Euler(Math.PI / 2, 0, 0),
            userData: { annotationId: anno.id }
          });
        }
      }

      // 5. Sub-Mesh Component Marker
      else if (geomType === 'submesh') {
        const anchorFrontMat = new THREE.MeshStandardMaterial({
          color: hexColor,
          emissive: hexColor,
          emissiveIntensity: 1.0,
          polygonOffset: true,
          polygonOffsetFactor: -1.0,
          polygonOffsetUnits: -1.0
        });
        const anchorGhostMat = new THREE.MeshStandardMaterial({
          color: hexColor,
          emissive: hexColor,
          emissiveIntensity: 0.4,
          transparent: true,
          opacity: 0.35
        });
        addDualPassMesh(sphereGeo, anchorFrontMat, anchorGhostMat, {
          position: new THREE.Vector3(anno.position.x, anno.position.y, anno.position.z),
          userData: { annotationId: anno.id }
        });

        if (isSelected) {
          const ringGeo = new THREE.RingGeometry(pinRadius * 1.5, pinRadius * 2.2, 32);
          const ringFrontMat = new THREE.MeshBasicMaterial({
            color: hexColor,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.9
          });
          const ringGhostMat = new THREE.MeshBasicMaterial({
            color: hexColor,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.35
          });
          addDualPassMesh(ringGeo, ringFrontMat, ringGhostMat, {
            position: new THREE.Vector3(anno.position.x, anno.position.y, anno.position.z),
            rotation: new THREE.Euler(Math.PI / 2, 0, 0),
            userData: { annotationId: anno.id }
          });
        }
      }
    });

    // Render Live Preview when user is editing an existing record's shape!
    if (editingShapeAnnotation) {
      const goldColor = new THREE.Color('#f59e0b');

      if (editingShapeAnnotation.geometryType === 'box') {
        const defaultBoxUnit = Math.max(0.5, Math.round(modelRadiusRef.current * 0.15 * 10) / 10);
        const bW = (editingShapeAnnotation.boxDimensions?.width ?? defaultBoxUnit) * (renderSettings.markerScale || 1.0);
        const bH = (editingShapeAnnotation.boxDimensions?.height ?? defaultBoxUnit) * (renderSettings.markerScale || 1.0);
        const bD = (editingShapeAnnotation.boxDimensions?.depth ?? defaultBoxUnit) * (renderSettings.markerScale || 1.0);
        const bPos = new THREE.Vector3(
          editingShapeAnnotation.position.x,
          editingShapeAnnotation.position.y,
          editingShapeAnnotation.position.z
        );

        // Active editing box mesh
        const editBoxGeo = new THREE.BoxGeometry(bW, bH, bD);
        const editBoxFrontMat = new THREE.MeshStandardMaterial({
          color: goldColor,
          emissive: goldColor,
          emissiveIntensity: 0.6,
          transparent: true,
          opacity: 0.45,
          roughness: 0.2,
          metalness: 0.3,
          polygonOffset: true,
          polygonOffsetFactor: -1.0,
          polygonOffsetUnits: -1.0
        });
        const editBoxGhostMat = new THREE.MeshStandardMaterial({
          color: goldColor,
          emissive: goldColor,
          emissiveIntensity: 0.25,
          transparent: true,
          opacity: 0.2
        });
        addDualPassMesh(editBoxGeo, editBoxFrontMat, editBoxGhostMat, { position: bPos });

        // Glowing wireframe
        const editEdgesGeo = new THREE.EdgesGeometry(editBoxGeo);
        const editEdgesFrontMat = new THREE.LineBasicMaterial({
          color: goldColor,
          linewidth: 3,
          transparent: true,
          opacity: 0.95,
          depthTest: true,
          depthFunc: THREE.LessEqualDepth
        });
        const editEdgesMesh = new THREE.LineSegments(editEdgesGeo, editEdgesFrontMat);
        editEdgesMesh.position.copy(bPos);
        editEdgesMesh.renderOrder = 20;
        group.add(editEdgesMesh);

        if (useGhostPass) {
          const editEdgesGhostMat = new THREE.LineBasicMaterial({
            color: goldColor,
            linewidth: 1.5,
            transparent: true,
            opacity: 0.4,
            depthTest: true,
            depthFunc: THREE.GreaterDepth,
            depthWrite: false
          });
          const editEdgesGhostMesh = new THREE.LineSegments(editEdgesGeo, editEdgesGhostMat);
          editEdgesGhostMesh.position.copy(bPos);
          editEdgesGhostMesh.renderOrder = 19;
          group.add(editEdgesGhostMesh);
        }

        // 6 Face Resize Handles (+X, -X, +Y, -Y, +Z, -Z)
        const faceOffsets = [
          new THREE.Vector3(bW / 2, 0, 0),
          new THREE.Vector3(-bW / 2, 0, 0),
          new THREE.Vector3(0, bH / 2, 0),
          new THREE.Vector3(0, -bH / 2, 0),
          new THREE.Vector3(0, 0, bD / 2),
          new THREE.Vector3(0, 0, -bD / 2)
        ];
        faceOffsets.forEach((fo) => {
          const handlePos = bPos.clone().add(fo);
          const fFrontMat = new THREE.MeshStandardMaterial({
            color: goldColor,
            emissive: goldColor,
            emissiveIntensity: 1.0,
            polygonOffset: true,
            polygonOffsetFactor: -1.0,
            polygonOffsetUnits: -1.0
          });
          const fGhostMat = new THREE.MeshStandardMaterial({
            color: goldColor,
            emissive: goldColor,
            emissiveIntensity: 0.4,
            transparent: true,
            opacity: 0.35
          });
          addDualPassMesh(sphereGeo, fFrontMat, fGhostMat, {
            position: handlePos,
            scale: 0.8
          });
        });
      } else if (editingShapePoints && editingShapePoints.length > 0) {
        const shapePts = editingShapePoints.map((p) => new THREE.Vector3(p.x, p.y, p.z));

        shapePts.forEach((pt) => {
          const handleFrontMat = new THREE.MeshStandardMaterial({
            color: goldColor,
            emissive: goldColor,
            emissiveIntensity: 1.0,
            polygonOffset: true,
            polygonOffsetFactor: -1.0,
            polygonOffsetUnits: -1.0
          });
          const handleGhostMat = new THREE.MeshStandardMaterial({
            color: goldColor,
            emissive: goldColor,
            emissiveIntensity: 0.4,
            transparent: true,
            opacity: 0.4
          });
          addDualPassMesh(sphereGeo, handleFrontMat, handleGhostMat, {
            position: pt,
            scale: 1.3
          });

          const ringGeo = new THREE.RingGeometry(pinRadius * 1.5, pinRadius * 2.2, 24);
          const ringFrontMat = new THREE.MeshBasicMaterial({
            color: goldColor,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.85
          });
          const ringGhostMat = new THREE.MeshBasicMaterial({
            color: goldColor,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.35
          });
          addDualPassMesh(ringGeo, ringFrontMat, ringGhostMat, {
            position: pt,
            rotation: new THREE.Euler(Math.PI / 2, 0, 0)
          });
        });

        if (shapePts.length >= 2) {
          const isPoly = editingShapeAnnotation.geometryType === 'polygon';
          const linePts = isPoly ? [...shapePts, shapePts[0]] : shapePts;
          const lineGeo = new THREE.BufferGeometry().setFromPoints(linePts);
          addDualPassLine(lineGeo, goldColor, 4, { isSelected: true });

          if (isPoly && shapePts.length >= 3) {
            const centerPt = shapePts.reduce((acc, pt) => acc.add(pt), new THREE.Vector3()).divideScalar(shapePts.length);
            const polyGeo = new THREE.BufferGeometry();
            const vertices: number[] = [];
            for (let i = 0; i < shapePts.length; i++) {
              const p1 = shapePts[i];
              const p2 = shapePts[(i + 1) % shapePts.length];
              vertices.push(centerPt.x, centerPt.y, centerPt.z);
              vertices.push(p1.x, p1.y, p1.z);
              vertices.push(p2.x, p2.y, p2.z);
            }
            polyGeo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
            polyGeo.computeVertexNormals();

            const polyFrontMat = new THREE.MeshStandardMaterial({
              color: goldColor,
              emissive: goldColor,
              emissiveIntensity: 0.4,
              side: THREE.DoubleSide,
              transparent: true,
              opacity: 0.45,
              polygonOffset: true,
              polygonOffsetFactor: -2.0,
              polygonOffsetUnits: -2.0
            });
            const polyGhostMat = new THREE.MeshStandardMaterial({
              color: goldColor,
              emissive: goldColor,
              emissiveIntensity: 0.2,
              side: THREE.DoubleSide,
              transparent: true,
              opacity: 0.2
            });
            addDualPassMesh(polyGeo, polyFrontMat, polyGhostMat);
          }
        }
      }
    }

    // Render Live Preview when user is creating/drawing a Box, Polyline, or Polygon!
    if (isAddingPinMode && activeDrawGeometryType === 'box') {
      const cyanColor = new THREE.Color('#06b6d4');
      const defaultBoxUnit = Math.max(0.5, Math.round(modelRadiusRef.current * 0.15 * 10) / 10);

      if (boxCreationMode === 'bounds' && drawingPoints && drawingPoints.length === 1) {
        // 2-Corner Bounding Box live stretch
        const p1 = drawingPoints[0];
        const p2 = hoverBoxPoint || p1;
        const minX = Math.min(p1.x, p2.x);
        const maxX = Math.max(p1.x, p2.x);
        const minZ = Math.min(p1.z, p2.z);
        const maxZ = Math.max(p1.z, p2.z);
        const w = Math.max(0.08, maxX - minX);
        const d = Math.max(0.08, maxZ - minZ);
        const h = Math.max(0.15, Math.abs(p2.y - p1.y) || (w + d) / 3);
        const cX = (minX + maxX) / 2;
        const cZ = (minZ + maxZ) / 2;
        const cY = Math.min(p1.y, p2.y) + h / 2;
        const boxCenter = new THREE.Vector3(cX, cY, cZ);

        const liveBoundsGeo = new THREE.BoxGeometry(w, h, d);
        const liveBoundsFrontMat = new THREE.MeshStandardMaterial({
          color: cyanColor,
          emissive: cyanColor,
          emissiveIntensity: 0.6,
          transparent: true,
          opacity: 0.4,
          polygonOffset: true,
          polygonOffsetFactor: -1.0,
          polygonOffsetUnits: -1.0
        });
        const liveBoundsGhostMat = new THREE.MeshStandardMaterial({
          color: cyanColor,
          emissive: cyanColor,
          emissiveIntensity: 0.3,
          transparent: true,
          opacity: 0.25
        });
        addDualPassMesh(liveBoundsGeo, liveBoundsFrontMat, liveBoundsGhostMat, { position: boxCenter });

        const liveBoundsEdgesGeo = new THREE.EdgesGeometry(liveBoundsGeo);
        const liveBoundsEdgesMat = new THREE.LineBasicMaterial({
          color: cyanColor,
          linewidth: 2.5,
          transparent: true,
          opacity: 0.95,
          depthTest: true,
          depthFunc: THREE.LessEqualDepth
        });
        const liveBoundsEdgesMesh = new THREE.LineSegments(liveBoundsEdgesGeo, liveBoundsEdgesMat);
        liveBoundsEdgesMesh.position.copy(boxCenter);
        liveBoundsEdgesMesh.renderOrder = 20;
        group.add(liveBoundsEdgesMesh);

        // Marker at Corner 1
        const cornerP1FrontMat = new THREE.MeshStandardMaterial({
          color: cyanColor,
          emissive: cyanColor,
          emissiveIntensity: 1.0,
          polygonOffset: true,
          polygonOffsetFactor: -1.0,
          polygonOffsetUnits: -1.0
        });
        const cornerP1GhostMat = new THREE.MeshStandardMaterial({
          color: cyanColor,
          emissive: cyanColor,
          emissiveIntensity: 0.4,
          transparent: true,
          opacity: 0.4
        });
        addDualPassMesh(sphereGeo, cornerP1FrontMat, cornerP1GhostMat, {
          position: new THREE.Vector3(p1.x, p1.y, p1.z),
          scale: 1.2
        });
      } else if (hoverBoxPoint) {
        // Single-click Surface Anchor Live Preview Box resting on surface
        const bPos = new THREE.Vector3(
          hoverBoxPoint.x,
          hoverBoxPoint.y + defaultBoxUnit / 2,
          hoverBoxPoint.z
        );

        const liveHoverGeo = new THREE.BoxGeometry(defaultBoxUnit, defaultBoxUnit, defaultBoxUnit);
        const liveHoverFrontMat = new THREE.MeshStandardMaterial({
          color: cyanColor,
          emissive: cyanColor,
          emissiveIntensity: 0.65,
          transparent: true,
          opacity: 0.45,
          roughness: 0.2,
          metalness: 0.3,
          polygonOffset: true,
          polygonOffsetFactor: -1.0,
          polygonOffsetUnits: -1.0
        });
        const liveHoverGhostMat = new THREE.MeshStandardMaterial({
          color: cyanColor,
          emissive: cyanColor,
          emissiveIntensity: 0.3,
          transparent: true,
          opacity: 0.22
        });
        addDualPassMesh(liveHoverGeo, liveHoverFrontMat, liveHoverGhostMat, { position: bPos });

        const liveHoverEdgesGeo = new THREE.EdgesGeometry(liveHoverGeo);
        const liveHoverEdgesMat = new THREE.LineBasicMaterial({
          color: cyanColor,
          linewidth: 2.5,
          transparent: true,
          opacity: 0.95,
          depthTest: true,
          depthFunc: THREE.LessEqualDepth
        });
        const liveHoverEdgesMesh = new THREE.LineSegments(liveHoverEdgesGeo, liveHoverEdgesMat);
        liveHoverEdgesMesh.position.copy(bPos);
        liveHoverEdgesMesh.renderOrder = 20;
        group.add(liveHoverEdgesMesh);

        // Ground footprint ring on the surface at contact point
        const footRingGeo = new THREE.RingGeometry(pinRadius * 1.2, pinRadius * 2.0, 24);
        const footRingFrontMat = new THREE.MeshBasicMaterial({
          color: cyanColor,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.9
        });
        const footRingGhostMat = new THREE.MeshBasicMaterial({
          color: cyanColor,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.4
        });
        addDualPassMesh(footRingGeo, footRingFrontMat, footRingGhostMat, {
          position: new THREE.Vector3(hoverBoxPoint.x, hoverBoxPoint.y, hoverBoxPoint.z),
          rotation: new THREE.Euler(Math.PI / 2, 0, 0)
        });
      }
    } else if (drawingPoints && drawingPoints.length > 0) {
      const livePts = drawingPoints.map((p) => new THREE.Vector3(p.x, p.y, p.z));
      const goldColor = new THREE.Color('#f59e0b');

      livePts.forEach((pt) => {
        const liveDotFrontMat = new THREE.MeshStandardMaterial({
          color: goldColor,
          emissive: goldColor,
          emissiveIntensity: 1.0,
          polygonOffset: true,
          polygonOffsetFactor: -1.0,
          polygonOffsetUnits: -1.0
        });
        const liveDotGhostMat = new THREE.MeshStandardMaterial({
          color: goldColor,
          emissive: goldColor,
          emissiveIntensity: 0.4,
          transparent: true,
          opacity: 0.35
        });
        addDualPassMesh(sphereGeo, liveDotFrontMat, liveDotGhostMat, {
          position: pt
        });
      });

      if (livePts.length >= 2) {
        const liveLineGeo = new THREE.BufferGeometry().setFromPoints(
          activeDrawGeometryType === 'polygon' ? [...livePts, livePts[0]] : livePts
        );
        addDualPassLine(liveLineGeo, goldColor, 3, { isSelected: true });
      }

      // Live rubber-band preview line from last vertex to cursor hover point
      if (hoverBoxPoint && livePts.length >= 1) {
        const lastVertex = livePts[livePts.length - 1];
        const hoverVec = new THREE.Vector3(hoverBoxPoint.x, hoverBoxPoint.y, hoverBoxPoint.z);
        const rubberPts = activeDrawGeometryType === 'polygon' && livePts.length >= 2
          ? [lastVertex, hoverVec, livePts[0]]
          : [lastVertex, hoverVec];
        const rubberGeo = new THREE.BufferGeometry().setFromPoints(rubberPts);
        addDualPassLine(rubberGeo, new THREE.Color('#38bdf8'), 2, { isSelected: true });
      }
    }

    requestRender(20);

    return () => {
      disposeGroupContents(group);
      sphereGeo.dispose();
    };
  }, [
    annotations,
    spatialGroups,
    selectedAnnotationId,
    drawingPoints,
    activeDrawGeometryType,
    boxCreationMode,
    hoverBoxPoint,
    isAddingPinMode,
    renderSettings.markerScale,
    renderSettings.markerOcclusionGhost,
    editingShapeAnnotation,
    editingShapePoints
  ]);

  // Pointer Down Tracking & Focus Animation Frame Refs
  const pointerDownPosRef = useRef<{ x: number; y: number } | null>(null);
  const focusAnimFrameRef = useRef<number | null>(null);

  const cancelFocusAnimation = () => {
    if (focusAnimFrameRef.current !== null) {
      cancelAnimationFrame(focusAnimFrameRef.current);
      focusAnimFrameRef.current = null;
    }
  };

  const handleCanvasPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    cancelFocusAnimation();
    pointerDownPosRef.current = { x: e.clientX, y: e.clientY };
    requestRender(15);
  };

  // Helper for smooth, cinematic camera translation focus and zoom-in on spatial markers
  const focusPointSmoothly = (
    targetPoint: THREE.Vector3,
    forceZoomIn: boolean = true,
    durationMs: number = 850,
    explicitEndCamPos?: THREE.Vector3
  ) => {
    cancelFocusAnimation();
    requestRender(60);
    if (!controlsRef.current || !activeCameraRef.current) return;
    const cam = activeCameraRef.current;
    const controls = controlsRef.current;

    const startTarget = controls.target.clone();
    const startCamPos = cam.position.clone();

    // Direction vector from target to camera
    let camDir = new THREE.Vector3().subVectors(startCamPos, startTarget);
    let currentDist = camDir.length();

    if (currentDist < 1e-5) {
      camDir = new THREE.Vector3(0.5, 0.5, 1.0).normalize();
      currentDist = 2.0;
    } else {
      camDir.normalize();
    }

    // Determine optimal local detail inspection distance for spatial record markers / surface points
    const modelR = modelRadiusRef.current > 0 ? modelRadiusRef.current : 2.0;
    const detailDist = Math.min(Math.max(modelR * 0.16, 1.2), 2.8);
    const minSafeDist = 0.35; // Prevent camera clipping inside wall/mesh

    let targetDist = currentDist;
    if (explicitEndCamPos) {
      targetDist = explicitEndCamPos.distanceTo(targetPoint);
    } else if (forceZoomIn || currentDist > detailDist * 2.0) {
      targetDist = detailDist;
    } else if (currentDist < minSafeDist) {
      targetDist = detailDist;
    }

    const endCamPos = explicitEndCamPos
      ? explicitEndCamPos.clone()
      : targetPoint.clone().add(camDir.clone().multiplyScalar(targetDist));

    // Calculate subtle arc elevation so camera moves gracefully over intermediate geometries
    const travelDistance = startCamPos.distanceTo(endCamPos);
    const arcHeight = explicitEndCamPos
      ? 0
      : Math.min(Math.max(travelDistance * 0.18, 0.15), modelR * 0.35);

    const startTime = performance.now();
    const duration = durationMs;

    const animateFocus = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1.0);
      // Smooth easeInOutCubic curve
      const ease = progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      // Arc sine elevation curve for smooth flight trajectory
      const arcSine = Math.sin(progress * Math.PI);
      const arcOffset = new THREE.Vector3(0, arcHeight * arcSine, 0);

      controls.target.lerpVectors(startTarget, targetPoint, ease);
      cam.position.lerpVectors(startCamPos, endCamPos, ease).add(arcOffset);

      if (cam instanceof THREE.OrthographicCamera) {
        const d = targetDist * 1.2;
        const aspect = cam.right / (cam.top || 1);
        cam.left = -d * aspect;
        cam.right = d * aspect;
        cam.top = d;
        cam.bottom = -d;
        cam.updateProjectionMatrix();
      }

      controls.update();
      requestRender(2);

      if (progress < 1.0) {
        focusAnimFrameRef.current = requestAnimationFrame(animateFocus);
      } else {
        focusAnimFrameRef.current = null;
        requestRender(10);
      }
    };

    focusAnimFrameRef.current = requestAnimationFrame(animateFocus);
  };

  // Imperative Handle methods for parent controls
  useImperativeHandle(ref, () => ({
    resetCamera: () => {
      const radius = modelRadiusRef.current;
      const center = modelCenterRef.current;
      const fov = perspectiveCameraRef.current ? perspectiveCameraRef.current.fov * (Math.PI / 180) : Math.PI / 4;
      const distance = Math.max(radius / Math.sin(fov / 2), 2);
      const resetCamPos = new THREE.Vector3(
        center.x + distance * 0.8,
        center.y + distance * 0.6,
        center.z + distance * 1.0
      );
      focusPointSmoothly(center.clone(), false, 650, resetCamPos);
    },
    setCameraPreset: (preset: CameraPreset) => {
      if (!activeCameraRef.current || !controlsRef.current) return;

      const r = modelRadiusRef.current * 2.2;
      const c = modelCenterRef.current;
      const targetPos = new THREE.Vector3();

      switch (preset) {
        case 'front':
          targetPos.set(c.x, c.y, c.z + r);
          break;
        case 'back':
          targetPos.set(c.x, c.y, c.z - r);
          break;
        case 'top':
          targetPos.set(c.x, c.y + r, c.z + 0.001);
          break;
        case 'bottom':
          targetPos.set(c.x, c.y - r, c.z + 0.001);
          break;
        case 'left':
          targetPos.set(c.x - r, c.y, c.z);
          break;
        case 'right':
          targetPos.set(c.x + r, c.y, c.z);
          break;
        case 'isometric':
        default:
          targetPos.set(c.x + r * 0.7, c.y + r * 0.7, c.z + r * 0.7);
          break;
      }

      focusPointSmoothly(c.clone(), false, 600, targetPos);
    },
    takeScreenshot: () => {
      if (!rendererRef.current || !sceneRef.current || !activeCameraRef.current) return '';
      rendererRef.current.render(sceneRef.current, activeCameraRef.current);
      return rendererRef.current.domElement.toDataURL('image/png');
    },
    focusPoint: (targetPoint: THREE.Vector3, forceZoomIn: boolean = true, durationMs: number = 850) => {
      focusPointSmoothly(targetPoint, forceZoomIn, durationMs);
    },
    flyToPosition: (x: number, y: number, z: number, durationMs: number = 1000) => {
      focusPointSmoothly(new THREE.Vector3(x, y, z), true, durationMs);
    }
  }));

  // Canvas Click Handler (For Point Focus, GIS Pins & Measurement)
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || !activeCameraRef.current || !modelWrapperRef.current) return;

    // Ignore click event if user was dragging/orbiting (mouse moved > 8px)
    if (pointerDownPosRef.current) {
      const dx = e.clientX - pointerDownPosRef.current.x;
      const dy = e.clientY - pointerDownPosRef.current.y;
      if (Math.hypot(dx, dy) > 8) {
        return;
      }
    }

    const rect = containerRef.current.getBoundingClientRect();
    const mouse = mouseVecRef.current;
    mouse.set(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    );

    const raycaster = raycasterRef.current!;
    raycaster.setFromCamera(mouse, activeCameraRef.current);

    // 0. Handle interactive shape editing point placement when shape editing mode is active
    if (editingShapeAnnotation && onUpdateEditingShapePoints) {
      const surfaceIntersects = raycaster.intersectObjects(modelWrapperRef.current.children, true);
      if (surfaceIntersects.length > 0) {
        const hitPoint = surfaceIntersects[0].point;
        const pt = {
          x: Math.round(hitPoint.x * 1000) / 1000,
          y: Math.round(hitPoint.y * 1000) / 1000,
          z: Math.round(hitPoint.z * 1000) / 1000
        };
        const currentPts = editingShapePoints || [];
        onUpdateEditingShapePoints([...currentPts, pt]);
        return;
      }
    }

    // 1. Raycast against GIS Pins and 3D Spatial Marker Geometries first
    // DO NOT trigger pin selection if user is in measure mode, add pin mode, or actively drawing points!
    if (!isAddingPinMode && !measureMode && drawingPoints.length === 0 && annotationsGroupRef.current) {
      const pinRadius = Math.max(modelRadiusRef.current * 0.005 * (renderSettings.markerScale || 1.0), 0.001);
      raycaster.params.Line.threshold = Math.max(pinRadius * 0.8, 0.002);
      raycaster.params.Points.threshold = Math.max(pinRadius * 0.8, 0.002);

      const pinIntersects = raycaster.intersectObjects(annotationsGroupRef.current.children, true);
      if (pinIntersects.length > 0) {
        for (const intersect of pinIntersects) {
          let curr: THREE.Object3D | null = intersect.object;
          while (curr) {
            if (curr.userData && curr.userData.annotationId) {
              const annoId = curr.userData.annotationId;
              onSelectAnnotation(annoId);
              const targetAnno = annotationsRef.current.find((a) => a.id === annoId) || annotations.find((a) => a.id === annoId);
              if (targetAnno) {
                focusPointSmoothly(new THREE.Vector3(targetAnno.position.x, targetAnno.position.y, targetAnno.position.z));
              }
              return;
            }
            curr = curr.parent;
          }
        }
      }
    }

    // 2. If in Add Pin Mode, raycast on model surface to place new spatial record
    if (isAddingPinMode) {
      const surfaceIntersects = raycaster.intersectObjects(modelWrapperRef.current.children, true);
      if (surfaceIntersects.length > 0) {
        const hit = surfaceIntersects[0];
        const hitPoint = new THREE.Vector3(roundVal(hit.point.x), roundVal(hit.point.y), roundVal(hit.point.z));
        const hitObj = hit.object;
        onAddPinAtPoint(hitPoint, hitObj.uuid, hitObj.name || 'Submesh Component');
        return;
      }
    }

    // 3. Fallback to general model surface raycast
    const intersects = raycaster.intersectObjects(modelWrapperRef.current.children, true);

    if (intersects.length > 0) {
      const rawHit = intersects[0].point;
      const hitPoint = new THREE.Vector3(roundVal(rawHit.x), roundVal(rawHit.y), roundVal(rawHit.z));
      const hitObj = intersects[0].object;

      if (onPointClicked) {
        onPointClicked(hitPoint);
      }

      // If measure mode is active, handle measurement point selection ONLY and return
      if (measureMode) {
        if (!pendingMeasurePointRef.current) {
          pendingMeasurePointRef.current = { x: hitPoint.x, y: hitPoint.y, z: hitPoint.z };
          setMeasurePreview(null);
        } else {
          const p1 = pendingMeasurePointRef.current;
          const p2 = { x: hitPoint.x, y: hitPoint.y, z: hitPoint.z };
          const dist = new THREE.Vector3(p1.x, p1.y, p1.z).distanceTo(hitPoint);

          const mColor = MEASURE_PALETTE[measurements.length % MEASURE_PALETTE.length];

          const newMeasure: Measurement = {
            id: 'm_' + Date.now(),
            p1,
            p2,
            distance: dist,
            color: mColor
          };

          onAddMeasurement(newMeasure);
          pendingMeasurePointRef.current = null;
          setMeasurePreview(null);
        }
        return;
      }

      // When NOT measuring or adding pins: check if surface location matches an existing spatial record
      const pinRadius = Math.max(modelRadiusRef.current * 0.005 * (renderSettings.markerScale || 1.0), 0.001);
      const clickRadiusThreshold = Math.max(pinRadius * 3.0, 0.003);

      const hiddenGroupIds = new Set(spatialGroups.filter((g) => g.visible === false).map((g) => g.id));
      let bestAnno: SpatialAnnotation | null = null;
      let minDistance = clickRadiusThreshold;

      // 1. Proximity check around visible pin positions and shape vertices
      annotationsRef.current.forEach((a) => {
        if (a.groupId && hiddenGroupIds.has(a.groupId)) return;
        let dMin = new THREE.Vector3(a.position.x, a.position.y, a.position.z).distanceTo(hitPoint);

        if (a.points && a.points.length > 0) {
          a.points.forEach((pt) => {
            const dPt = new THREE.Vector3(pt.x, pt.y, pt.z).distanceTo(hitPoint);
            if (dPt < dMin) {
              dMin = dPt;
            }
          });
        }

        if (dMin < minDistance) {
          minDistance = dMin;
          bestAnno = a;
        }
      });

      // 2. Fallback to Submesh Component match ONLY if no pin point is nearby AND geometryType is explicitly 'submesh'
      if (!bestAnno) {
        const submeshMatch = annotationsRef.current.find(
          (a) =>
            (!a.groupId || !hiddenGroupIds.has(a.groupId)) &&
            a.geometryType === 'submesh' &&
            a.nodeId &&
            a.nodeId === hitObj.uuid
        );
        if (submeshMatch) {
          bestAnno = submeshMatch;
        }
      }

      if (bestAnno) {
        const matched = bestAnno as SpatialAnnotation;
        onSelectAnnotation(matched.id);
        focusPointSmoothly(new THREE.Vector3(matched.position.x, matched.position.y, matched.position.z));
        return;
      } else {
        // Clicked open model surface away from any marker: deselect active spatial marker
        onSelectAnnotation(null);
      }
    } else if (!isAddingPinMode && !measureMode) {
      // Clicked on background: deselect active spatial marker
      onSelectAnnotation(null);
    }
  };

  // Live Pointer Movement Raycasting for Real-Time Measurement Preview, Box Placement & Multi-Vertex Rubber-Banding
  const handleCanvasPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current || !activeCameraRef.current || !modelWrapperRef.current) return;

    const isBoxDrawing = isAddingPinMode && activeDrawGeometryType === 'box';
    const isMultiVertexDrawing =
      isAddingPinMode &&
      (activeDrawGeometryType === 'polyline' || activeDrawGeometryType === 'polygon') &&
      drawingPoints &&
      drawingPoints.length > 0;

    if (!measureMode && !isBoxDrawing && !isMultiVertexDrawing) {
      if (hoverCursorPos) setHoverCursorPos(null);
      if (measurePreview) setMeasurePreview(null);
      if (hoverBoxPoint) setHoverBoxPoint(null);
      return;
    }

    // Throttle raycasting on pointer move for high-poly photogrammetry meshes
    const now = performance.now();
    const interval = renderSettings.performanceMode ? 45 : 30; // ~22fps to 33fps max hover raycasting
    if (now - lastPointerMoveTimeRef.current < interval) {
      return;
    }
    lastPointerMoveTimeRef.current = now;

    const rect = containerRef.current.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    const mouse = mouseVecRef.current;
    mouse.set(
      (screenX / rect.width) * 2 - 1,
      -(screenY / rect.height) * 2 + 1
    );

    const raycaster = raycasterRef.current!;
    raycaster.setFromCamera(mouse, activeCameraRef.current);

    const intersects = raycaster.intersectObjects(modelWrapperRef.current.children, true);
    if (intersects.length > 0) {
      const hitPoint = intersects[0].point;
      setHoverCursorPos({ x: screenX, y: screenY });

      if (isBoxDrawing || isMultiVertexDrawing) {
        setHoverBoxPoint({
          x: roundVal(hitPoint.x),
          y: roundVal(hitPoint.y),
          z: roundVal(hitPoint.z)
        });
      }

      if (measureMode) {
        if (pendingMeasurePointRef.current) {
          const p1 = pendingMeasurePointRef.current;
          const dist = new THREE.Vector3(p1.x, p1.y, p1.z).distanceTo(hitPoint);
          setMeasurePreview({
            p1,
            p2: { x: hitPoint.x, y: hitPoint.y, z: hitPoint.z },
            distance: dist
          });
        } else {
          setMeasurePreview(null);
        }
      }
    } else {
      setHoverCursorPos(null);
      setMeasurePreview(null);
      if (isBoxDrawing || isMultiVertexDrawing) {
        setHoverBoxPoint(null);
      }
    }
  };

  // Double Click Focus Surface Target
  const handleCanvasDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || !activeCameraRef.current || !modelWrapperRef.current || !controlsRef.current) return;

    if (pointerDownPosRef.current) {
      const dx = e.clientX - pointerDownPosRef.current.x;
      const dy = e.clientY - pointerDownPosRef.current.y;
      if (Math.hypot(dx, dy) > 5) {
        return;
      }
    }

    const rect = containerRef.current.getBoundingClientRect();
    const mouse = mouseVecRef.current;
    mouse.set(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    );

    const raycaster = raycasterRef.current!;
    raycaster.setFromCamera(mouse, activeCameraRef.current);

    const intersects = raycaster.intersectObjects(modelWrapperRef.current.children, true);

    if (intersects.length > 0) {
      const hitPoint = intersects[0].point;
      focusPointSmoothly(hitPoint);
    }
  };

  const handlePopupDragStart = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    const initialOffset = { ...popupOffsetRef.current };

    const onPointerMove = (moveEv: PointerEvent) => {
      const dx = moveEv.clientX - startX;
      const dy = moveEv.clientY - startY;
      const newOffset = { x: initialOffset.x + dx, y: initialOffset.y + dy };
      popupOffsetRef.current = newOffset;
      setPopupOffset(newOffset);
      requestRender(20);
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  const handleCommentsDragStart = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    const initialOffset = { ...commentsOffsetRef.current };

    const onPointerMove = (moveEv: PointerEvent) => {
      const dx = moveEv.clientX - startX;
      const dy = moveEv.clientY - startY;
      const newOffset = { x: initialOffset.x + dx, y: initialOffset.y + dy };
      commentsOffsetRef.current = newOffset;
      setCommentsOffset(newOffset);
      requestRender(20);
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  const selectedAnno = selectedAnnotationId ? (annotationsRef.current.find((a) => a.id === selectedAnnotationId) || annotations.find((a) => a.id === selectedAnnotationId)) : null;

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full cursor-grab active:cursor-grabbing select-none outline-none overflow-hidden"
      onPointerDown={handleCanvasPointerDown}
      onPointerMove={handleCanvasPointerMove}
      onPointerUp={() => requestRender(15)}
      onWheel={() => requestRender(15)}
      onClick={handleCanvasClick}
      onDoubleClick={handleCanvasDoubleClick}
    >
      {/* Dedicated Three.js Canvas Container */}
      <div ref={canvasContainerRef} className="absolute inset-0 w-full h-full" />

      {/* Floating 3D Midpoint Distance Badges for Measurements */}
      {measureLabels.map((lbl) => (
        <div
          key={lbl.id}
          className="absolute z-30 pointer-events-none -translate-x-1/2 -translate-y-1/2 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold text-white shadow-2xl border border-white/20 backdrop-blur-md transition-all duration-75 flex items-center gap-1.5"
          style={{
            left: `${lbl.screenX}px`,
            top: `${lbl.screenY}px`,
            backgroundColor: `${lbl.color}dd`,
            boxShadow: `0 4px 16px ${lbl.color}50`
          }}
        >
          <Ruler className="w-3 h-3 text-white" />
          <span>{formatDistance(lbl.distance, renderSettings.measurementUnit || 'm')}</span>
        </div>
      ))}

      {/* Real-Time Live Measurement Preview Floating Badge */}
      {measureMode && measurePreview && hoverCursorPos && (
        <div
          className="absolute z-30 pointer-events-none -translate-x-1/2 -translate-y-full mb-3 px-3 py-1.5 rounded-xl text-xs font-mono font-bold text-white shadow-2xl border border-emerald-400/60 bg-emerald-600/90 backdrop-blur-md animate-bounce flex items-center gap-1.5"
          style={{
            left: `${hoverCursorPos.x}px`,
            top: `${hoverCursorPos.y}px`
          }}
        >
          <Ruler className="w-3.5 h-3.5" />
          <span>Live: {formatDistance(measurePreview.distance, renderSettings.measurementUnit || 'm')}</span>
          <span className="text-[10px] text-emerald-100 font-normal font-sans ml-1">(Click to finish)</span>
        </div>
      )}

      {/* Measurement Mode Cursor Hover Hint */}
      {measureMode && !pendingMeasurePointRef.current && hoverCursorPos && (
        <div
          className="absolute z-30 pointer-events-none -translate-x-1/2 -translate-y-full mb-3 px-2.5 py-1 rounded-lg text-[11px] font-medium text-zinc-200 bg-zinc-900/90 border border-blue-500/40 shadow-lg backdrop-blur-md flex items-center gap-1.5"
          style={{
            left: `${hoverCursorPos.x}px`,
            top: `${hoverCursorPos.y}px`
          }}
        >
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
          <span>Click 3D surface to set Start Point</span>
        </div>
      )}

      {/* Terrain Navigation Mode Overlay Banner */}
      {navigationMode === 'terrain' && (
        <div className={`absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 sm:gap-3 px-3.5 py-2 rounded-2xl border text-xs font-medium shadow-2xl backdrop-blur-md transition-colors ${
          isLight ? 'bg-white/95 border-slate-300 text-slate-800 shadow-slate-200' : 'bg-[#09090b]/90 border-blue-500/40 text-white'
        }`}>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className={`font-bold ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>Terrain Flight</span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-[11px]">
            <span className={isLight ? 'text-slate-600' : 'text-zinc-300'}>
              <kbd className={`px-1.5 py-0.5 rounded border font-mono font-bold text-[10px] ${
                isLight ? 'bg-slate-100 border-slate-300 text-slate-800' : 'bg-zinc-800 border-zinc-700 text-zinc-200'
              }`}>WASD</kbd> / <kbd className={`px-1.5 py-0.5 rounded border font-mono font-bold text-[10px] ${
                isLight ? 'bg-slate-100 border-slate-300 text-slate-800' : 'bg-zinc-800 border-zinc-700 text-zinc-200'
              }`}>Arrows</kbd> Move
            </span>
            <span>•</span>
            <span className={isLight ? 'text-slate-600' : 'text-zinc-300'}>
              <kbd className={`px-1.5 py-0.5 rounded border font-mono font-bold text-[10px] ${
                isLight ? 'bg-slate-100 border-slate-300 text-slate-800' : 'bg-zinc-800 border-zinc-700 text-zinc-200'
              }`}>Q / E</kbd> Altitude
            </span>
          </div>

          <div className="flex items-center gap-1 pl-1 border-l border-slate-300/60 dark:border-zinc-700/60">
            <span className={`text-[10px] font-semibold uppercase ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>Speed:</span>
            {[0.1, 0.25, 0.5, 1.0, 1.5, 2.0].map((s) => (
              <button
                key={s}
                onClick={() => {
                  if (onUpdateRenderSettings) {
                    onUpdateRenderSettings({ terrainSpeedMultiplier: s });
                  }
                }}
                className={`px-1.5 py-0.5 rounded-md font-mono text-[10px] font-bold transition-all ${
                  Math.abs((renderSettings.terrainSpeedMultiplier || 1.0) - s) < 0.05
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : isLight
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                }`}
                title={`Set camera movement speed to ${s}x`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 3D Projected Target Beacon Pin at the Selected Spatial Marker */}
      {selectedAnno && (
        <div
          ref={beaconPinRef}
          className="absolute top-0 left-0 z-30 pointer-events-none -translate-x-1/2 -translate-y-1/2"
        >
          <div className={`w-3.5 h-3.5 rounded-full ${viewMode === 'audience' ? 'bg-amber-500 ring-4 ring-amber-500/40' : 'bg-blue-500 ring-4 ring-blue-500/40'} animate-ping pointer-events-none`} />
          <div className="absolute inset-0 m-auto w-2 h-2 rounded-full bg-white shadow-lg pointer-events-none ring-2 ring-black/40" />
        </div>
      )}

      {/* Main Spatial Record Information Popup (Floating & Offset to Right Side of 3D Marker) */}
      {selectedAnno && (
        <div
          ref={popupContainerRef}
          className="absolute top-0 left-0 z-40 pointer-events-none"
        >
          <div className="pointer-events-auto absolute left-8 sm:left-12 top-0 -translate-y-1/2">
            <SpatialRecordPopup
              annotation={selectedAnno}
              viewMode={viewMode}
              spatialGroups={spatialGroups}
              activeThemeName={activeThemeName}
              onClose={() => onSelectAnnotation(null)}
              onFocusAnnotation={(anno) => {
                focusPointSmoothly(new THREE.Vector3(anno.position.x, anno.position.y, anno.position.z));
                if (onFocusAnnotation) onFocusAnnotation(anno);
              }}
              onEditAnnotation={(anno) => {
                if (onEditAnnotation) onEditAnnotation(anno);
              }}
              onStartEditShape={(anno) => {
                if (onStartEditShape) onStartEditShape(anno);
              }}
              onDeleteAnnotation={(id) => {
                if (onDeleteAnnotation) onDeleteAnnotation(id);
              }}
              onOpenPdf={(pdf) => {
                if (onOpenPdf) onOpenPdf(pdf);
              }}
              onOpenImage={(img) => {
                if (onOpenImage) onOpenImage(img);
              }}
              isGisPanelOpen={isGisPanelOpen}
              onOpenGisPanel={() => {
                if (onOpenGisPanel) onOpenGisPanel();
              }}
              uiTheme={uiTheme}
              onDragStart={handlePopupDragStart}
              isCommentsWingOpen={isCommentsWingOpen}
              onToggleCommentsWing={onToggleCommentsWing}
              audienceUser={audienceUser}
              onAddComment={onAddComment}
            />
          </div>
        </div>
      )}

      {/* Detached Community Comments Window (Floating & Offset to Left Side of 3D Marker) */}
      {selectedAnno && isCommentsWingOpen && (
        <div
          ref={commentsContainerRef}
          className="absolute top-0 left-0 z-40 pointer-events-none"
        >
          <div className="pointer-events-auto absolute right-8 sm:right-12 top-0 -translate-y-1/2">
            <SpatialRecordCommentsWing
              annotation={selectedAnno}
              viewMode={viewMode}
              audienceUser={audienceUser}
              onUpdateAudienceUser={onUpdateAudienceUser}
              onAddComment={onAddComment}
              onVoteComment={onVoteComment}
              onDeleteComment={onDeleteComment}
              onClose={() => {
                if (onToggleCommentsWing) onToggleCommentsWing();
              }}
              uiTheme={uiTheme}
              onDragStart={handleCommentsDragStart}
            />
          </div>
        </div>
      )}
    </div>
  );
});

ThreeCanvas.displayName = 'ThreeCanvas';
