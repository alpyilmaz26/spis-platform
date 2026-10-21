import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import JSZip from 'jszip';
import { MapPin, Activity, Square, Component, Check, X, Upload, Box, FolderKanban } from 'lucide-react';
import { ThreeCanvas, ThreeCanvasRef } from './components/ThreeCanvas';
import { TopNavbar } from './components/TopNavbar';
import { ControlBar } from './components/ControlBar';
import { SidebarInspector } from './components/SidebarInspector';
import { UploadModal } from './components/UploadModal';
import { MeasurementOverlay } from './components/MeasurementOverlay';
import { GisDataListPanel } from './components/GisDataListPanel';
import { AnnotationEditorModal } from './components/AnnotationEditorModal';
import { PdfViewerModal } from './components/PdfViewerModal';
import { ImageLightboxModal } from './components/ImageLightboxModal';
import { ProjectModal } from './components/ProjectModal';
import { ProjectOptionsModal } from './components/ProjectOptionsModal';
import { GpuHardwareGuideModal } from './components/GpuHardwareGuideModal';
import { UserRoleSelectionModal } from './components/UserRoleSelectionModal';
import { ThemeTourOverlay } from './components/ThemeTourOverlay';
import { ToastNotification, ToastMessage } from './components/ToastNotification';
import { formatDistance } from './utils/formatUnit';
import { calculateThemeRoute } from './data/interpretiveThemes';
import {
  RenderSettings,
  EnvironmentSettings,
  ProjectionMode,
  NavigationMode,
  CameraPreset,
  ModelStats,
  MeshNodeInfo,
  AnimationClipInfo,
  Measurement,
  SampleModel,
  UploadedModelItem,
  AppViewMode,
  UiTheme,
  SpatialAnnotation,
  SpatialMarkerGeometryType,
  SpatialAttachmentPDF,
  SpatialAttachmentImage,
  MaterialOverride,
  ProjectMetadata,
  ExportedProjectFile,
  ModelRecordState,
  SpatialGroup,
  ThemeTourRoute,
  InterpretiveTheme,
  ProjectOptions,
  DEFAULT_PROJECT_OPTIONS,
  SpatialComment,
  AudienceUserCredentials
} from './types';
import { generateProceduralModel, SAMPLE_MODELS } from './utils/proceduralModels';
import { load3DModelFile, analyzeObject3D, load3DModelFromDataUrl, readFileAsDataUrl, disposeObject3D } from './utils/modelLoader';
import { extractSceneUvTextures, reapplyUvTexturesToScene } from './utils/textureExporter';
import { DEFAULT_SAMPLE_ANNOTATIONS } from './data/sampleAnnotations';

export default function App() {
  const canvasRef = useRef<ThreeCanvasRef>(null);

  // App View Mode (Researcher vs Audience) & UI Theme (Dark vs Light)
  const [viewMode, setViewMode] = useState<AppViewMode>('researcher');
  const [uiTheme, setUiTheme] = useState<UiTheme>('dark');

  const handleToggleUiTheme = () => {
    const nextTheme: UiTheme = uiTheme === 'dark' ? 'light' : 'dark';
    setUiTheme(nextTheme);

    // Synchronize 3D canvas background color when switching theme if on default colors
    setEnvSettings((prev) => {
      if (nextTheme === 'light' && (prev.bgColor === '#0C0C0E' || prev.bgColor === '#000000')) {
        return { ...prev, bgColor: '#f1f5f9' };
      } else if (nextTheme === 'dark' && prev.bgColor === '#f1f5f9') {
        return { ...prev, bgColor: '#0C0C0E' };
      }
      return prev;
    });
  };

  // Project State & Metadata & Themes
  const [projectMeta, setProjectMeta] = useState<ProjectMetadata>({
    id: 'proj_' + Date.now(),
    name: '3D Spatial Survey Project',
    description: 'Model-linked spatial records, field observations, annotations, and measurements.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  const [projectThemes, setProjectThemes] = useState<InterpretiveTheme[]>([]);

  const handleCreateTheme = (newTheme: { name: string; color: string; description?: string }) => {
    const created: InterpretiveTheme = {
      id: 'theme_' + Date.now(),
      name: newTheme.name,
      color: newTheme.color,
      description: newTheme.description || 'Custom project theme'
    };
    setProjectThemes((prev) => [...prev, created]);
    setToastNotification({
      id: 'theme_create_' + Date.now(),
      message: `Created project theme "${created.name}"!`,
      type: 'success'
    });
  };

  const handleUpdateTheme = (id: string, updated: { name: string; color: string; description?: string }) => {
    setProjectThemes((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updated } : t))
    );
  };

  const handleDeleteTheme = (id: string) => {
    setProjectThemes((prev) => prev.filter((t) => t.id !== id));
    setToastNotification({
      id: 'theme_del_' + Date.now(),
      message: 'Deleted project theme.',
      type: 'info'
    });
  };

  // Dynamic Project Options (Disciplines, GIS Categories, Attribute Templates)
  const [projectOptions, setProjectOptions] = useState<ProjectOptions>(DEFAULT_PROJECT_OPTIONS);
  const [isProjectOptionsModalOpen, setIsProjectOptionsModalOpen] = useState<boolean>(false);
  const [projectOptionsInitialTab, setProjectOptionsInitialTab] = useState<'disciplines' | 'categories' | 'attributes'>('disciplines');

  const handleOpenProjectOptions = (tab: 'disciplines' | 'categories' | 'attributes' = 'disciplines') => {
    setProjectOptionsInitialTab(tab);
    setIsProjectOptionsModalOpen(true);
  };

  const handleUpdateProjectOptions = (newOptions: ProjectOptions) => {
    setProjectOptions(newOptions);
    setToastNotification({
      id: 'opts_upd_' + Date.now(),
      message: 'Updated project configuration options!',
      type: 'success'
    });
  };

  const [isRoleModalOpen, setIsRoleModalOpen] = useState<boolean>(true);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState<boolean>(false);
  const [hasCompletedInitialLaunch, setHasCompletedInitialLaunch] = useState<boolean>(false);

  const handleCloseRoleModal = () => {
    setIsRoleModalOpen(false);
    if (!hasCompletedInitialLaunch) {
      setHasCompletedInitialLaunch(true);
      setIsProjectModalOpen(true);
    }
  };

  const handleCloseProjectModal = () => {
    setIsProjectModalOpen(false);
  };

  // Interpretive Theme Virtual Tour State
  const [activeTourRoute, setActiveTourRoute] = useState<ThemeTourRoute | null>(null);
  const [activeStopIndex, setActiveStopIndex] = useState<number>(0);
  const [isTourPlaying, setIsTourPlaying] = useState<boolean>(false);

  // Model-linked Data Store Records
  const [annotationsByModel, setAnnotationsByModel] = useState<Record<string, SpatialAnnotation[]>>({});
  const [spatialGroupsByModel, setSpatialGroupsByModel] = useState<Record<string, SpatialGroup[]>>({});
  const [measurementsByModel, setMeasurementsByModel] = useState<Record<string, Measurement[]>>({});
  const [materialOverridesByModel, setMaterialOverridesByModel] = useState<Record<string, Map<string, MaterialOverride>>>({});
  const [hiddenNodesByModel, setHiddenNodesByModel] = useState<Record<string, Set<string>>>({});

  // Model & Mesh State
  const [modelScene, setModelScene] = useState<THREE.Object3D | null>(null);
  const [stats, setStats] = useState<ModelStats | null>(null);
  const [hierarchy, setHierarchy] = useState<MeshNodeInfo[]>([]);
  const [animations, setAnimations] = useState<AnimationClipInfo[]>([]);
  const [rawClips, setRawClips] = useState<THREE.AnimationClip[]>([]);
  const [activeSampleId, setActiveSampleId] = useState<string>('');

  // User Uploaded Models Collection
  const [userModels, setUserModels] = useState<UploadedModelItem[]>([]);
  const [activeModelId, setActiveModelId] = useState<string | null>(null);

  // Active Model 3D GIS Spatial Annotations & Layer Groups State
  const [annotations, setAnnotations] = useState<SpatialAnnotation[]>([]);
  const [spatialGroups, setSpatialGroups] = useState<SpatialGroup[]>([]);
  const [targetGroupIdForNewRecord, setTargetGroupIdForNewRecord] = useState<string | undefined>(undefined);
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);
  const [isAddingPinMode, setIsAddingPinMode] = useState<boolean>(false);
  const [isGisPanelOpen, setIsGisPanelOpen] = useState<boolean>(true);

  // Interactive 3D Shape Editing State
  const [editingShapeAnnotation, setEditingShapeAnnotation] = useState<SpatialAnnotation | null>(null);
  const [editingShapePoints, setEditingShapePoints] = useState<Array<{ x: number; y: number; z: number }>>([]);

  // Spatial Geometry Drawing State (Point, Polyline, Polygon, Submesh, Box)
  const [activeDrawGeometryType, setActiveDrawGeometryType] = useState<SpatialMarkerGeometryType>('point');
  const [boxCreationMode, setBoxCreationMode] = useState<'surface' | 'bounds'>('surface');
  const [drawingPoints, setDrawingPoints] = useState<Array<{ x: number; y: number; z: number }>>([]);
  const [pendingNodeId, setPendingNodeId] = useState<string | undefined>(undefined);

  // Modals State
  const [editorModalOpen, setEditorModalOpen] = useState<boolean>(false);
  const [editingAnnotation, setEditingAnnotation] = useState<SpatialAnnotation | null>(null);
  const [pendingSurfacePoint, setPendingSurfacePoint] = useState<{ x: number; y: number; z: number } | null>(null);
  const [pendingBoxDimensions, setPendingBoxDimensions] = useState<{ width: number; height: number; depth: number } | null>(null);
  const [activePdf, setActivePdf] = useState<SpatialAttachmentPDF | null>(null);
  const [activeImage, setActiveImage] = useState<SpatialAttachmentImage | null>(null);
  const [gpuGuideModalOpen, setGpuGuideModalOpen] = useState<boolean>(false);

  // Render & Camera Settings
  const [projectionMode, setProjectionMode] = useState<ProjectionMode>('perspective');
  const [navigationMode, setNavigationMode] = useState<NavigationMode>('orbit');
  const [renderSettings, setRenderSettings] = useState<RenderSettings>({
    mode: 'shaded',
    wireframeColor: '#3b82f6',
    pointSize: 2,
    markerScale: 1.0,
    markerOcclusionGhost: true,
    measurementUnit: 'm',
    showGrid: true,
    gridSize: 10,
    showAxes: true,
    showBoundingBox: false,
    showShadows: true,
    performanceMode: false,
    resolutionScale: 1.0,
    doubleSidedMaterials: true,
    clippingEnabled: false,
    clippingAxis: 'x',
    clippingValue: 0,
    clippingInvert: false,
    terrainSpeedMultiplier: 1.0
  });

  const [envSettings, setEnvSettings] = useState<EnvironmentSettings>({
    lighting: 'studio',
    lightIntensity: 1.0,
    background: 'grid',
    bgColor: '#0C0C0E',
    autoRotate: false,
    autoRotateSpeed: 1.0
  });

  // Mesh Node Isolation & Visibility Overrides
  const [isolatedNodeId, setIsolatedNodeId] = useState<string | null>(null);
  const [hiddenNodeIds, setHiddenNodeIds] = useState<Set<string>>(new Set());
  const [highlightedNodeId, setHighlightedNodeId] = useState<string | null>(null);
  const [materialOverrides, setMaterialOverrides] = useState<Map<string, MaterialOverride>>(new Map());

  // Measurement State
  const [measureMode, setMeasureMode] = useState<boolean>(false);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);

  // Animation State
  const [activeAnimationIndex, setActiveAnimationIndex] = useState<number | null>(null);
  const [isPlayingAnimation, setIsPlayingAnimation] = useState<boolean>(true);
  const [animationSpeed, setAnimationSpeed] = useState<number>(1.0);

  // UI Drawer / Modal States
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // GIS Panel Active Tab & Custom Theme Record Orders
  const [gisPanelTab, setGisPanelTab] = useState<'layers' | 'themes'>('layers');
  const [customThemeOrders, setCustomThemeOrders] = useState<Record<string, string[]>>({});

  const handleToggleGisPanel = (targetTab?: 'layers' | 'themes') => {
    if (targetTab) {
      if (!isGisPanelOpen) {
        setIsGisPanelOpen(true);
        setGisPanelTab(targetTab);
      } else if (gisPanelTab === targetTab) {
        setIsGisPanelOpen(false);
      } else {
        setGisPanelTab(targetTab);
      }
    } else {
      setIsGisPanelOpen(!isGisPanelOpen);
    }
  };

  const handleReorderThemeRecords = (themeName: string, newOrderIds: string[]) => {
    setCustomThemeOrders((prev) => {
      const updated = { ...prev, [themeName]: newOrderIds };
      if (activeTourRoute && activeTourRoute.themeName === themeName) {
        const refreshedRoute = calculateThemeRoute(themeName, annotations, activeTourRoute.color, newOrderIds);
        setActiveTourRoute(refreshedRoute);
      }
      return updated;
    });
    setToastNotification({
      id: 'reorder_' + Date.now(),
      message: `Updated tour sequence for theme "${themeName}"!`,
      type: 'info'
    });
  };

  const handleResetThemeOrder = (themeName: string) => {
    setCustomThemeOrders((prev) => {
      const updated = { ...prev };
      delete updated[themeName];
      if (activeTourRoute && activeTourRoute.themeName === themeName) {
        const refreshedRoute = calculateThemeRoute(themeName, annotations, activeTourRoute.color);
        setActiveTourRoute(refreshedRoute);
      }
      return updated;
    });
  };

  // Audience User Identity & Side-by-side Comments Controls
  const [audienceUser, setAudienceUser] = useState<AudienceUserCredentials>({
    name: 'Visitor',
    role: 'Local Resident'
  });
  const [isCommentsWingOpen, setIsCommentsWingOpen] = useState<boolean>(false);

  // Transfer & Toast Notification States
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [toastNotification, setToastNotification] = useState<ToastMessage | null>(null);

  // Switch Active Model with Model-Linked Records Synchronization
  const handleSelectUserModel = (modelId: string) => {
    const model = userModels.find((m) => m.id === modelId);
    if (!model) return;

    // Save current active model records first
    if (activeModelId && activeModelId !== modelId) {
      setAnnotationsByModel((prev) => ({ ...prev, [activeModelId]: annotations }));
      setSpatialGroupsByModel((prev) => ({ ...prev, [activeModelId]: spatialGroups }));
      setMeasurementsByModel((prev) => ({ ...prev, [activeModelId]: measurements }));
      setMaterialOverridesByModel((prev) => ({ ...prev, [activeModelId]: materialOverrides }));
      setHiddenNodesByModel((prev) => ({ ...prev, [activeModelId]: hiddenNodeIds }));
    }

    // Load target model records
    const nextAnnos = annotationsByModel[modelId] ?? [];
    const nextGroups = spatialGroupsByModel[modelId] ?? [];
    const nextMsrs = measurementsByModel[modelId] ?? [];
    const nextOverrides = materialOverridesByModel[modelId] ?? new Map();
    const nextHidden = hiddenNodesByModel[modelId] ?? new Set();

    setActiveModelId(model.id);
    setModelScene(model.scene);
    setStats(model.stats);
    setHierarchy(model.hierarchy);
    setAnimations(model.animations);
    setRawClips(model.rawClips);

    setAnnotations(nextAnnos);
    setSpatialGroups(nextGroups);
    setMeasurements(nextMsrs);
    setMaterialOverrides(nextOverrides);
    setHiddenNodeIds(nextHidden);

    if (model.animations.length > 0) {
      setActiveAnimationIndex(0);
      setIsPlayingAnimation(true);
    } else {
      setActiveAnimationIndex(null);
    }

    setIsolatedNodeId(null);
    setSelectedAnnotationId(null);
    setRenderSettings((prev) => ({ ...prev, clippingEnabled: false }));
  };

  const handleSelectRole = (role: AppViewMode, initialThemeName?: string) => {
    setViewMode(role);
    if (role === 'audience') {
      setGisPanelTab('themes');
      if (initialThemeName) {
        handleStartThemeTour(initialThemeName);
      }
    }
    setIsRoleModalOpen(false);
    if (!hasCompletedInitialLaunch) {
      setHasCompletedInitialLaunch(true);
    }
    setIsProjectModalOpen(true);
  };

  const handleSelectAnnotation = (id: string | null) => {
    setSelectedAnnotationId(id);
    if (!id || id !== selectedAnnotationId) {
      setIsCommentsWingOpen(false);
    }
  };

  const handleStartThemeTour = (themeName: string, themeColor?: string) => {
    const customOrder = customThemeOrders[themeName];
    const route = calculateThemeRoute(themeName, annotations, themeColor, customOrder);
    if (!route || route.stops.length === 0) {
      setToastNotification({
        id: Date.now().toString(),
        type: 'info',
        title: 'No Data Tagged',
        message: `No spatial records are tagged with theme "${themeName}". Tag points in Researcher mode first!`
      });
      return;
    }

    setIsCommentsWingOpen(false);
    setActiveTourRoute(route);
    setActiveStopIndex(0);
    setIsTourPlaying(true);

    const firstStop = route.stops[0];
    if (firstStop) {
      setSelectedAnnotationId(firstStop.annotationId);
      canvasRef.current?.flyToPosition(
        firstStop.position.x,
        firstStop.position.y,
        firstStop.position.z,
        1100
      );
    }
  };

  const handleNextTourStop = () => {
    if (!activeTourRoute || activeTourRoute.stops.length === 0) return;
    setIsCommentsWingOpen(false);
    const nextIndex = (activeStopIndex + 1) % activeTourRoute.stops.length;
    setActiveStopIndex(nextIndex);

    const targetStop = activeTourRoute.stops[nextIndex];
    if (targetStop) {
      setSelectedAnnotationId(targetStop.annotationId);
      canvasRef.current?.flyToPosition(
        targetStop.position.x,
        targetStop.position.y,
        targetStop.position.z,
        1100
      );
    }
  };

  const handlePrevTourStop = () => {
    if (!activeTourRoute || activeTourRoute.stops.length === 0) return;
    setIsCommentsWingOpen(false);
    const prevIndex = (activeStopIndex - 1 + activeTourRoute.stops.length) % activeTourRoute.stops.length;
    setActiveStopIndex(prevIndex);

    const targetStop = activeTourRoute.stops[prevIndex];
    if (targetStop) {
      setSelectedAnnotationId(targetStop.annotationId);
      canvasRef.current?.flyToPosition(
        targetStop.position.x,
        targetStop.position.y,
        targetStop.position.z,
        1100
      );
    }
  };

  const handleSelectTourStopIndex = (index: number) => {
    if (!activeTourRoute || !activeTourRoute.stops[index]) return;
    setIsCommentsWingOpen(false);
    setActiveStopIndex(index);
    const targetStop = activeTourRoute.stops[index];
    setSelectedAnnotationId(targetStop.annotationId);
    canvasRef.current?.flyToPosition(
      targetStop.position.x,
      targetStop.position.y,
      targetStop.position.z,
      1100
    );
  };

  const handleRefreshTourRoutes = () => {
    if (activeTourRoute) {
      const customOrder = customThemeOrders[activeTourRoute.themeName];
      const updatedRoute = calculateThemeRoute(activeTourRoute.themeName, annotations, activeTourRoute.color, customOrder);
      setActiveTourRoute(updatedRoute);
      setToastNotification({
        id: Date.now().toString(),
        type: 'success',
        title: 'Theme Routes Updated',
        message: `Recalculated 3D tour route with latest spatial data for ${activeTourRoute.themeName}.`
      });
    }
  };

  const handleCloseTour = () => {
    setIsCommentsWingOpen(false);
    setActiveTourRoute(null);
    setIsTourPlaying(false);
  };

  // Auto-advance Interpretive Tour Stops when Auto-Play is active
  useEffect(() => {
    if (!isTourPlaying || !activeTourRoute || activeTourRoute.stops.length === 0) return;
    // Pause auto-advance while user is inspecting a modal attachment or comments wing
    if (activePdf || activeImage || isCommentsWingOpen) return;

    const timer = window.setInterval(() => {
      setActiveStopIndex((prevIdx) => {
        const nextIdx = (prevIdx + 1) % activeTourRoute.stops.length;
        const targetStop = activeTourRoute.stops[nextIdx];
        if (targetStop) {
          setSelectedAnnotationId(targetStop.annotationId);
          canvasRef.current?.flyToPosition(
            targetStop.position.x,
            targetStop.position.y,
            targetStop.position.z,
            1100
          );
        }
        return nextIdx;
      });
    }, 6500);

    return () => window.clearInterval(timer);
  }, [isTourPlaying, activeTourRoute, activePdf, activeImage, isCommentsWingOpen]);

  // Global Keyboard Shortcuts for Drawing, Shape Editing, and Measurement Modes
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName;
      if (activeTag === 'INPUT' || activeTag === 'TEXTAREA' || activeTag === 'SELECT') return;
      if (editorModalOpen || isProjectModalOpen || isProjectOptionsModalOpen || isUploadOpen || isRoleModalOpen) return;

      if (e.key === 'Escape') {
        if (isAddingPinMode) {
          setDrawingPoints([]);
          setIsAddingPinMode(false);
        } else if (editingShapeAnnotation) {
          setEditingShapeAnnotation(null);
          setEditingShapePoints([]);
        } else if (measureMode) {
          setMeasureMode(false);
        } else if (selectedAnnotationId) {
          setSelectedAnnotationId(null);
          setIsCommentsWingOpen(false);
        }
      } else if (e.key === 'Enter') {
        if (
          isAddingPinMode &&
          (activeDrawGeometryType === 'polyline' || activeDrawGeometryType === 'polygon') &&
          drawingPoints.length >= (activeDrawGeometryType === 'polygon' ? 3 : 2)
        ) {
          e.preventDefault();
          const avgX = drawingPoints.reduce((acc, p) => acc + p.x, 0) / drawingPoints.length;
          const avgY = drawingPoints.reduce((acc, p) => acc + p.y, 0) / drawingPoints.length;
          const avgZ = drawingPoints.reduce((acc, p) => acc + p.z, 0) / drawingPoints.length;
          setPendingSurfacePoint({ x: avgX, y: avgY, z: avgZ });
          setEditingAnnotation(null);
          setEditorModalOpen(true);
          setIsAddingPinMode(false);
        }
      } else if (e.key === 'Backspace') {
        if (isAddingPinMode && (activeDrawGeometryType === 'polyline' || activeDrawGeometryType === 'polygon') && drawingPoints.length > 0) {
          e.preventDefault();
          setDrawingPoints((prev) => prev.slice(0, -1));
        } else if (editingShapeAnnotation && editingShapeAnnotation.geometryType !== 'box' && editingShapePoints.length > 0) {
          e.preventDefault();
          setEditingShapePoints((prev) => prev.slice(0, -1));
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [
    isAddingPinMode,
    activeDrawGeometryType,
    drawingPoints,
    editingShapeAnnotation,
    editingShapePoints,
    measureMode,
    selectedAnnotationId,
    editorModalOpen,
    isProjectModalOpen,
    isProjectOptionsModalOpen,
    isUploadOpen,
    isRoleModalOpen
  ]);

  const handleDeleteUserModel = (modelId: string) => {
    setUserModels((prev) => {
      const removed = prev.find((m) => m.id === modelId);
      if (removed) {
        if (removed.fileDataUrl?.startsWith('blob:')) {
          URL.revokeObjectURL(removed.fileDataUrl);
        }
        disposeObject3D(removed.scene);
      }

      const next = prev.filter((m) => m.id !== modelId);
      if (activeModelId === modelId) {
        if (next.length > 0) {
          handleSelectUserModel(next[0].id);
        } else {
          setActiveModelId(null);
          setModelScene(null);
          setStats(null);
          setHierarchy([]);
          setAnimations([]);
          setRawClips([]);
          setAnnotations([]);
          setSpatialGroups([]);
          setMeasurements([]);
          setMaterialOverrides(new Map());
          setHiddenNodeIds(new Set());
          setIsolatedNodeId(null);
          setSelectedAnnotationId(null);
          handleCloseTour();
        }
      }
      return next;
    });

    setAnnotationsByModel((prev) => {
      const copy = { ...prev };
      delete copy[modelId];
      return copy;
    });
    setSpatialGroupsByModel((prev) => {
      const copy = { ...prev };
      delete copy[modelId];
      return copy;
    });
    setMeasurementsByModel((prev) => {
      const copy = { ...prev };
      delete copy[modelId];
      return copy;
    });
    setMaterialOverridesByModel((prev) => {
      const copy = { ...prev };
      delete copy[modelId];
      return copy;
    });
    setHiddenNodesByModel((prev) => {
      const copy = { ...prev };
      delete copy[modelId];
      return copy;
    });
  };

  const loadProceduralSample = (sampleId: string) => {
    const sample = SAMPLE_MODELS.find((s) => s.id === sampleId) || SAMPLE_MODELS[0];
    const modelId = 'sample_' + sample.id;

    // Save current active model records first
    if (activeModelId) {
      setAnnotationsByModel((prev) => ({ ...prev, [activeModelId]: annotations }));
      setSpatialGroupsByModel((prev) => ({ ...prev, [activeModelId]: spatialGroups }));
      setMeasurementsByModel((prev) => ({ ...prev, [activeModelId]: measurements }));
      setMaterialOverridesByModel((prev) => ({ ...prev, [activeModelId]: materialOverrides }));
      setHiddenNodesByModel((prev) => ({ ...prev, [activeModelId]: hiddenNodeIds }));
    }

    // Check if model already exists
    const existingModel = userModels.find((m) => m.id === modelId);
    if (existingModel) {
      handleSelectUserModel(modelId);
      return;
    }

    const group = generateProceduralModel(sample.proceduralType || 'building');
    const result = analyzeObject3D(group, sample.name, 'Generated', 'Procedural Mesh');

    const sampleModel: UploadedModelItem = {
      id: modelId,
      name: sample.name,
      fileName: `${sample.name}.obj`,
      category: sample.category || 'PROCEDURAL',
      type: 'procedural',
      proceduralType: sample.proceduralType,
      scene: result.scene,
      stats: result.stats,
      hierarchy: result.hierarchy,
      animations: [],
      rawClips: [],
      uploadedAt: 'Preset'
    };

    setUserModels((prev) => [sampleModel, ...prev]);

    const initAnnos: SpatialAnnotation[] = [];
    const initGroups: SpatialGroup[] = [];

    setActiveModelId(modelId);
    setModelScene(result.scene);
    setStats(result.stats);
    setHierarchy(result.hierarchy);
    setAnimations([]);
    setRawClips([]);

    setAnnotations(initAnnos);
    setAnnotationsByModel((prev) => ({ ...prev, [modelId]: initAnnos }));
    setSpatialGroups(initGroups);
    setSpatialGroupsByModel((prev) => ({ ...prev, [modelId]: initGroups }));
    setMeasurements([]);
    setMeasurementsByModel((prev) => ({ ...prev, [modelId]: [] }));
    setMaterialOverrides(new Map());
    setHiddenNodeIds(new Set());
    setIsolatedNodeId(null);
    setRenderSettings((prev) => ({ ...prev, clippingEnabled: false }));
  };

  // Handle User File Upload (.OBJ, .GLB, .STL, etc.)
  const handleFileUpload = async (file: File) => {
    setIsLoading(true);
    setUploadProgress(10);
    setErrorMessage(null);

    const fileSizeMb = (file.size / (1024 * 1024)).toFixed(1);
    const isLargeFile = file.size > 250 * 1024 * 1024;

    setToastNotification({
      id: 'upload_' + Date.now(),
      message: isLargeFile 
        ? `Processing large 3D asset (${fileSizeMb} MB)... Allocating browser WebGL memory buffers.`
        : `Uploading & processing 3D mesh model (${file.name})...`,
      type: 'loading'
    });

    try {
      // Save current active model records first
      if (activeModelId) {
        setAnnotationsByModel((prev) => ({ ...prev, [activeModelId]: annotations }));
        setSpatialGroupsByModel((prev) => ({ ...prev, [activeModelId]: spatialGroups }));
        setMeasurementsByModel((prev) => ({ ...prev, [activeModelId]: measurements }));
        setMaterialOverridesByModel((prev) => ({ ...prev, [activeModelId]: materialOverrides }));
        setHiddenNodesByModel((prev) => ({ ...prev, [activeModelId]: hiddenNodeIds }));
      }

      // For large files, use Blob URLs directly to prevent V8 base64 string length overflow crashes
      const fileDataUrl = file.size > 25 * 1024 * 1024 
        ? URL.createObjectURL(file) 
        : await readFileAsDataUrl(file);

      const result = await load3DModelFile(file, (percent) => {
        setUploadProgress(percent);
      });

      const modelId = 'model_' + Date.now();
      const newModel: UploadedModelItem = {
        id: modelId,
        name: file.name.replace(/\.[^/.]+$/, ''),
        fileName: file.name,
        category: file.name.split('.').pop()?.toUpperCase() || '3D MODEL',
        fileSize: fileSizeMb + ' MB',
        type: 'uploaded',
        fileDataUrl,
        scene: result.scene,
        stats: result.stats,
        hierarchy: result.hierarchy,
        animations: result.animations,
        rawClips: result.rawClips,
        uploadedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setUserModels((prev) => {
        prev.forEach((m) => {
          if (m.name === newModel.name) {
            if (m.fileDataUrl?.startsWith('blob:')) {
              URL.revokeObjectURL(m.fileDataUrl);
            }
            disposeObject3D(m.scene);
          }
        });
        return [newModel, ...prev.filter((m) => m.name !== newModel.name)];
      });
      setActiveModelId(modelId);

      setModelScene(result.scene);
      setStats(result.stats);
      setHierarchy(result.hierarchy);
      setAnimations(result.animations);
      setRawClips(result.rawClips);

      if (result.animations.length > 0) {
        setActiveAnimationIndex(0);
        setIsPlayingAnimation(true);
      } else {
        setActiveAnimationIndex(null);
      }

      const initGroups: SpatialGroup[] = [];

      setAnnotations([]);
      setAnnotationsByModel((prev) => ({ ...prev, [modelId]: [] }));
      setSpatialGroups(initGroups);
      setSpatialGroupsByModel((prev) => ({ ...prev, [modelId]: initGroups }));
      setMeasurements([]);
      setMeasurementsByModel((prev) => ({ ...prev, [modelId]: [] }));
      setMaterialOverrides(new Map());
      setHiddenNodeIds(new Set());
      setIsolatedNodeId(null);
      setRenderSettings((prev) => ({ ...prev, clippingEnabled: false }));

      setIsUploadOpen(false);
      setToastNotification({
        id: 'upload_succ_' + Date.now(),
        message: `3D model "${newModel.name}" loaded into project workspace!`,
        type: 'success'
      });
    } catch (err: any) {
      console.error('Failed to load 3D model:', err);
      const isMemErr = err?.message?.includes('memory') || err?.message?.includes('RangeError') || err?.name === 'RangeError' || file.size > 800 * 1024 * 1024;
      const msg = isMemErr 
        ? `Browser memory limit reached while parsing ${fileSizeMb} MB model. Try running Draco/Meshopt compression (e.g. gltf-pack or gltf-pipeline) to compress the .glb below 500 MB.`
        : (err.message || 'Error parsing 3D model file. Please ensure it is a valid 3D geometry format.');
      
      setErrorMessage(msg);
      setToastNotification({
        id: 'upload_err_' + Date.now(),
        message: isMemErr ? 'Model exceeds browser memory capacity.' : 'Failed to parse 3D mesh model file.',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 3D GIS Pin Drop & Geometry Drawing Click Handler
  const handleAddPinAtPoint = (point: THREE.Vector3, nodeId?: string, nodeName?: string) => {
    const roundVal = (v: number) => Math.round(v * 1000) / 1000;
    const pt = { x: roundVal(point.x), y: roundVal(point.y), z: roundVal(point.z) };

    if (activeDrawGeometryType === 'polyline' || activeDrawGeometryType === 'polygon') {
      // Accumulate clicked 3D vertices
      setDrawingPoints((prev) => [...prev, pt]);
      return;
    }

    if (activeDrawGeometryType === 'box') {
      if (boxCreationMode === 'surface') {
        // Intuitive 1-Click Surface Placement:
        // Compute default box size based on model scale
        const defaultBoxUnit = Math.max(0.5, Math.round((stats?.boundingSphereRadius || 5) * 0.15 * 10) / 10);
        // Elevate Y by half-height so box base rests cleanly on the surface hit point
        const placedAnchorPoint = {
          x: pt.x,
          y: roundVal(pt.y + defaultBoxUnit / 2),
          z: pt.z
        };
        const computedDims = {
          width: defaultBoxUnit,
          height: defaultBoxUnit,
          depth: defaultBoxUnit
        };

        setPendingSurfacePoint(placedAnchorPoint);
        setPendingBoxDimensions(computedDims);
        setEditingAnnotation(null);
        setEditorModalOpen(true);
        setIsAddingPinMode(false);
        setDrawingPoints([]);
        return;
      } else {
        // 2-Corner Ground Footprint Area Placement
        const nextPts = [...drawingPoints, pt];
        setDrawingPoints(nextPts);

        if (nextPts.length === 2) {
          const [p1, p2] = nextPts;

          const actualWidth = Math.max(0.1, roundVal(Math.abs(p2.x - p1.x)));
          const actualDepth = Math.max(0.1, roundVal(Math.abs(p2.z - p1.z)));
          const height = Math.max(0.2, roundVal(Math.abs(p2.y - p1.y) || (actualWidth + actualDepth) / 3));

          const centerX = roundVal((p1.x + p2.x) / 2);
          const centerZ = roundVal((p1.z + p2.z) / 2);
          const minY = Math.min(p1.y, p2.y);
          const centerY = roundVal(minY + height / 2);

          const computedDims = {
            width: actualWidth,
            height: height,
            depth: actualDepth
          };

          setPendingSurfacePoint({ x: centerX, y: centerY, z: centerZ });
          setPendingBoxDimensions(computedDims);
          setEditingAnnotation(null);
          setEditorModalOpen(true);
          setIsAddingPinMode(false);
          setDrawingPoints([]);
        }
        return;
      }
    }

    // Single point or submesh target
    setPendingSurfacePoint(pt);
    setPendingBoxDimensions(null);
    setPendingNodeId(activeDrawGeometryType === 'submesh' ? nodeId : undefined);
    setEditingAnnotation(null);
    setEditorModalOpen(true);
    setIsAddingPinMode(false);
  };

  // Complete Polyline / Polygon Drawing Action
  const handleCompleteGeometryDrawing = () => {
    if (drawingPoints.length === 0) return;

    const avgX = drawingPoints.reduce((acc, p) => acc + p.x, 0) / drawingPoints.length;
    const avgY = drawingPoints.reduce((acc, p) => acc + p.y, 0) / drawingPoints.length;
    const avgZ = drawingPoints.reduce((acc, p) => acc + p.z, 0) / drawingPoints.length;

    setPendingSurfacePoint({ x: avgX, y: avgY, z: avgZ });
    setEditingAnnotation(null);
    setEditorModalOpen(true);
    setIsAddingPinMode(false);
  };

  const handleCancelDrawing = () => {
    setDrawingPoints([]);
    setIsAddingPinMode(false);
  };

  // Save / Update Spatial Annotation Record
  const handleSaveAnnotation = (savedAnno: SpatialAnnotation) => {
    setAnnotations((prev) => {
      const exists = prev.some((a) => a.id === savedAnno.id);
      const next = exists ? prev.map((a) => (a.id === savedAnno.id ? savedAnno : a)) : [savedAnno, ...prev];
      if (activeModelId) {
        setAnnotationsByModel((map) => ({ ...map, [activeModelId]: next }));
      }
      return next;
    });
    setSelectedAnnotationId(savedAnno.id);
  };

  // Delete Spatial Annotation
  const handleDeleteAnnotation = (id: string) => {
    setAnnotations((prev) => {
      const next = prev.filter((a) => a.id !== id);
      if (activeModelId) {
        setAnnotationsByModel((map) => ({ ...map, [activeModelId]: next }));
      }
      if (activeTourRoute) {
        const customOrder = customThemeOrders[activeTourRoute.themeName];
        const refreshed = calculateThemeRoute(activeTourRoute.themeName, next, activeTourRoute.color, customOrder);
        if (!refreshed || refreshed.stops.length === 0) {
          setActiveTourRoute(null);
          setIsTourPlaying(false);
        } else {
          setActiveTourRoute(refreshed);
          setActiveStopIndex((idx) => Math.min(idx, refreshed.stops.length - 1));
        }
      }
      return next;
    });
    if (selectedAnnotationId === id) {
      setSelectedAnnotationId(null);
      setIsCommentsWingOpen(false);
    }
  };

  // Spatial Record Comments & Discussions Handlers
  const handleAddComment = (annotationId: string, text: string, authorName: string, authorRole: string) => {
    const newComment: SpatialComment = {
      id: 'comm_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      authorName: authorName.trim() || 'Visitor',
      authorRole: authorRole.trim() || 'Contributor',
      text: text.trim(),
      createdAt: new Date().toISOString(),
      upvotes: 0,
      downvotes: 0
    };

    setAnnotations((prev) => {
      const next = prev.map((a) => {
        if (a.id === annotationId) {
          const updatedComments = [...(a.comments || []), newComment];
          return { ...a, comments: updatedComments };
        }
        return a;
      });
      if (activeModelId) {
        setAnnotationsByModel((map) => ({ ...map, [activeModelId]: next }));
      }
      return next;
    });

    setToastNotification({
      id: 'comm_add_' + Date.now(),
      message: 'Comment posted to spatial record!',
      type: 'success'
    });
  };

  const handleVoteComment = (annotationId: string, commentId: string, direction: 'up' | 'down') => {
    setAnnotations((prev) => {
      const next = prev.map((a) => {
        if (a.id === annotationId && a.comments) {
          const updatedComments = a.comments.map((c) => {
            if (c.id === commentId) {
              let up = c.upvotes || 0;
              let down = c.downvotes || 0;
              let currentVote = c.userVote;

              if (direction === 'up') {
                if (currentVote === 'up') {
                  up = Math.max(0, up - 1);
                  currentVote = undefined;
                } else {
                  up += 1;
                  if (currentVote === 'down') down = Math.max(0, down - 1);
                  currentVote = 'up';
                }
              } else {
                if (currentVote === 'down') {
                  down = Math.max(0, down - 1);
                  currentVote = undefined;
                } else {
                  down += 1;
                  if (currentVote === 'up') up = Math.max(0, up - 1);
                  currentVote = 'down';
                }
              }

              return { ...c, upvotes: up, downvotes: down, userVote: currentVote };
            }
            return c;
          });
          return { ...a, comments: updatedComments };
        }
        return a;
      });

      if (activeModelId) {
        setAnnotationsByModel((map) => ({ ...map, [activeModelId]: next }));
      }
      return next;
    });
  };

  const handleDeleteComment = (annotationId: string, commentId: string) => {
    setAnnotations((prev) => {
      const next = prev.map((a) => {
        if (a.id === annotationId && a.comments) {
          return { ...a, comments: a.comments.filter((c) => c.id !== commentId) };
        }
        return a;
      });

      if (activeModelId) {
        setAnnotationsByModel((map) => ({ ...map, [activeModelId]: next }));
      }
      return next;
    });

    setToastNotification({
      id: 'comm_del_' + Date.now(),
      message: 'Comment removed.',
      type: 'info'
    });
  };

  // Focus Camera on Spatial Annotation in 3D
  const handleFocusAnnotation = (anno: SpatialAnnotation) => {
    if (canvasRef.current) {
      canvasRef.current.focusPoint(new THREE.Vector3(anno.position.x, anno.position.y, anno.position.z), true);
    }
  };

  // Focus Camera on 3D Measurement Midpoint
  const handleFocusMeasurement = (m: Measurement) => {
    if (canvasRef.current) {
      const mid = new THREE.Vector3(
        (m.p1.x + m.p2.x) / 2,
        (m.p1.y + m.p2.y) / 2,
        (m.p1.z + m.p2.z) / 2
      );
      canvasRef.current.focusPoint(mid, true);
    }
  };

  // Convert 3D Measurement into a Persistent Spatial GIS Annotation Record
  const handleConvertMeasurementToAnnotation = (m: Measurement) => {
    const unit = renderSettings.measurementUnit || 'm';
    const formattedDist = formatDistance(m.distance, unit);
    const mid = {
      x: Math.round(((m.p1.x + m.p2.x) / 2) * 1000) / 1000,
      y: Math.round(((m.p1.y + m.p2.y) / 2) * 1000) / 1000,
      z: Math.round(((m.p1.z + m.p2.z) / 2) * 1000) / 1000
    };

    const newAnno: SpatialAnnotation = {
      id: 'anno_msr_' + Date.now(),
      title: `Measured Distance (${formattedDist})`,
      category: 'Structural Detail',
      description: `Linear distance measurement taken directly on the 3D surface.\n\n- Distance: **${formattedDist}**\n- Point A: (${m.p1.x.toFixed(2)}, ${m.p1.y.toFixed(2)}, ${m.p1.z.toFixed(2)})\n- Point B: (${m.p2.x.toFixed(2)}, ${m.p2.y.toFixed(2)}, ${m.p2.z.toFixed(2)})`,
      color: m.color || '#38bdf8',
      geometryType: 'polyline',
      position: mid,
      points: [
        { x: m.p1.x, y: m.p1.y, z: m.p1.z },
        { x: m.p2.x, y: m.p2.y, z: m.p2.z }
      ],
      images: [],
      pdfs: [],
      metadata: [
        { key: 'Measurement Distance', value: formattedDist },
        { key: 'Unit Mode', value: unit === 'cm' ? 'Centimeters (cm)' : 'Meters (m)' },
        { key: 'Recorded Timestamp', value: new Date().toLocaleString() }
      ],
      createdAt: new Date().toISOString(),
      author: projectMeta.author || 'Surveyor'
    };

    handleSaveAnnotation(newAnno);
    setSelectedAnnotationId(newAnno.id);
    handleFocusMeasurement(m);
    setToastNotification({
      id: 'msr_conv_' + Date.now(),
      message: `Measurement (${formattedDist}) saved as Spatial GIS Record!`,
      type: 'success'
    });
  };

  // Interactive 3D Shape Editing Handlers
  const handleStartShapeEditing = (anno: SpatialAnnotation) => {
    setEditingShapeAnnotation(anno);
    const initialPts = anno.points && anno.points.length > 0 ? [...anno.points] : [{ ...anno.position }];
    setEditingShapePoints(initialPts);
    setSelectedAnnotationId(anno.id);
    if (canvasRef.current) {
      canvasRef.current.focusPoint(new THREE.Vector3(anno.position.x, anno.position.y, anno.position.z), true);
    }
    setEditorModalOpen(false);
  };

  const handleSaveShapeEditing = () => {
    if (!editingShapeAnnotation) return;
    let anchorPos = editingShapeAnnotation.position;
    if (editingShapePoints.length > 0) {
      const avgX = editingShapePoints.reduce((acc, p) => acc + p.x, 0) / editingShapePoints.length;
      const avgY = editingShapePoints.reduce((acc, p) => acc + p.y, 0) / editingShapePoints.length;
      const avgZ = editingShapePoints.reduce((acc, p) => acc + p.z, 0) / editingShapePoints.length;
      anchorPos = {
        x: Math.round(avgX * 1000) / 1000,
        y: Math.round(avgY * 1000) / 1000,
        z: Math.round(avgZ * 1000) / 1000
      };
    }

    const updatedAnno: SpatialAnnotation = {
      ...editingShapeAnnotation,
      position: anchorPos,
      points: editingShapePoints.map((p) => ({
        x: Math.round(p.x * 1000) / 1000,
        y: Math.round(p.y * 1000) / 1000,
        z: Math.round(p.z * 1000) / 1000
      }))
    };

    handleSaveAnnotation(updatedAnno);
    setEditingShapeAnnotation(null);
    setEditingShapePoints([]);
  };

  const handleRemoveLastShapePoint = () => {
    setEditingShapePoints((prev) => (prev.length > 0 ? prev.slice(0, -1) : prev));
  };

  const handleClearShapePoints = () => {
    setEditingShapePoints([]);
  };

  const handleCancelShapeEditing = () => {
    setEditingShapeAnnotation(null);
    setEditingShapePoints([]);
  };

  // Spatial Discipline Layer Group Handlers
  const handleToggleGroupVisibility = (groupId: string) => {
    setSpatialGroups((prev) => {
      const updated = prev.map((g) => (g.id === groupId ? { ...g, visible: g.visible === false ? true : false } : g));
      if (activeModelId) {
        setSpatialGroupsByModel((pm) => ({ ...pm, [activeModelId]: updated }));
      }
      const targetGrp = updated.find((g) => g.id === groupId);
      if (targetGrp && targetGrp.visible === false && selectedAnnotationId) {
        const selAnno = annotations.find((a) => a.id === selectedAnnotationId);
        if (selAnno && selAnno.groupId === groupId) {
          setSelectedAnnotationId(null);
          setIsCommentsWingOpen(false);
        }
      }
      return updated;
    });
  };

  const handleCreateGroup = (groupData: { name: string; discipline: string; description?: string; color: string }) => {
    const newGrp: SpatialGroup = {
      id: 'grp_' + Date.now(),
      name: groupData.name,
      discipline: groupData.discipline,
      description: groupData.description,
      color: groupData.color,
      visible: true,
      createdAt: new Date().toLocaleDateString(),
      author: projectMeta.author || 'Surveyor'
    };

    setSpatialGroups((prev) => {
      const updated = [...prev, newGrp];
      if (activeModelId) {
        setSpatialGroupsByModel((pm) => ({ ...pm, [activeModelId]: updated }));
      }
      return updated;
    });

    setToastNotification({
      id: 'grp_' + Date.now(),
      message: `Created discipline layer "${newGrp.name}"!`,
      type: 'success'
    });
  };

  const handleDeleteGroup = (groupId: string) => {
    const grp = spatialGroups.find((g) => g.id === groupId);
    if (!grp) return;

    setSpatialGroups((prev) => {
      const updated = prev.filter((g) => g.id !== groupId);
      if (activeModelId) {
        setSpatialGroupsByModel((pm) => ({ ...pm, [activeModelId]: updated }));
      }
      return updated;
    });

    // Unlink records and sync model dictionary
    setAnnotations((prev) => {
      const next = prev.map((a) => (a.groupId === groupId ? { ...a, groupId: undefined } : a));
      if (activeModelId) {
        setAnnotationsByModel((pm) => ({ ...pm, [activeModelId]: next }));
      }
      return next;
    });

    setToastNotification({
      id: 'grp_del_' + Date.now(),
      message: `Deleted discipline layer "${grp.name}". Associated records unlinked.`,
      type: 'info'
    });
  };

  const handleAddRecordToGroup = (groupId: string) => {
    setTargetGroupIdForNewRecord(groupId);
    setEditingAnnotation(null);
    setPendingSurfacePoint(pendingSurfacePoint || { x: 0, y: 0, z: 0 });
    setEditorModalOpen(true);
  };

  const handleReassignRecordGroup = (annotationId: string, newGroupId: string) => {
    setAnnotations((prev) => {
      const next = prev.map((a) => (a.id === annotationId ? { ...a, groupId: newGroupId || undefined } : a));
      if (activeModelId) {
        setAnnotationsByModel((map) => ({ ...map, [activeModelId]: next }));
      }
      return next;
    });
    setToastNotification({
      id: 'anno_reassign_' + Date.now(),
      message: 'Reassigned record layer group!',
      type: 'info'
    });
  };

  const handleToggleRecordTheme = (annotationId: string, themeName: string) => {
    setAnnotations((prev) => {
      const next = prev.map((a) => {
        if (a.id !== annotationId) return a;
        const currentThemes = a.interpretiveThemes || [];
        const hasTheme = currentThemes.some((t) => t.toLowerCase() === themeName.toLowerCase());
        const updatedThemes = hasTheme
          ? currentThemes.filter((t) => t.toLowerCase() !== themeName.toLowerCase())
          : [...currentThemes, themeName];
        return { ...a, interpretiveThemes: updatedThemes };
      });
      if (activeModelId) {
        setAnnotationsByModel((map) => ({ ...map, [activeModelId]: next }));
      }
      return next;
    });
  };

  const handleSetThemeNarrationBinding = (annotationId: string, themeName: string, narrationId: string) => {
    setAnnotations((prev) => {
      const next = prev.map((a) => {
        if (a.id !== annotationId) return a;
        const currentBindings = { ...(a.themeNarrationBindings || {}) };
        if (!narrationId) {
          delete currentBindings[themeName];
        } else {
          currentBindings[themeName] = narrationId;
        }
        return {
          ...a,
          themeNarrationBindings: currentBindings,
          updatedAt: new Date().toISOString()
        };
      });
      if (activeModelId) {
        setAnnotationsByModel((map) => ({ ...map, [activeModelId]: next }));
      }
      return next;
    });
    setToastNotification({
      id: 'narr_bind_' + Date.now(),
      message: `Updated exhibition narrative for theme "${themeName}"`,
      type: 'info'
    });
  };

  const handleExportGroupJson = (groupId: string) => {
    const group = spatialGroups.find((g) => g.id === groupId);
    if (!group) return;

    const groupAnnotations = annotations.filter((a) => a.groupId === groupId);

    const bundle = {
      type: 'spatial-group-bundle',
      version: '1.0',
      exportedAt: new Date().toISOString(),
      group: group,
      annotations: groupAnnotations,
      projectOptions: projectOptions
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(bundle, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${group.discipline}_${group.name.replace(/\s+/g, '_')}_Layer_Export.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    setToastNotification({
      id: 'grp_exp_' + Date.now(),
      message: `Exported layer dataset "${group.name}" with ${groupAnnotations.length} spatial records & options!`,
      type: 'success'
    });
  };

  // Export Spatial GIS Records as JSON File
  const handleExportJson = () => {
    const exportBundle = {
      type: 'spatial-records-export',
      version: '1.0',
      exportedAt: new Date().toISOString(),
      spatialGroups: spatialGroups,
      annotations: annotations,
      projectOptions: projectOptions
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportBundle, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `3D_GIS_Spatial_Records_${stats?.name || 'model'}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import Spatial GIS Records or Group Datasets from JSON File
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);

        // Merge any bundled project options (disciplines, categories, attribute templates)
        if (imported && imported.projectOptions) {
          setProjectOptions((prev) => {
            const baseDisciplines = prev?.disciplines || DEFAULT_PROJECT_OPTIONS.disciplines;
            const baseCategories = prev?.categories || DEFAULT_PROJECT_OPTIONS.categories;
            const baseAttrs = prev?.attributeTemplates || DEFAULT_PROJECT_OPTIONS.attributeTemplates;

            const mergedDisciplines = Array.from(
              new Set([...baseDisciplines, ...(imported.projectOptions.disciplines || [])])
            );
            const mergedCategories = Array.from(
              new Set([...baseCategories, ...(imported.projectOptions.categories || [])])
            );
            const existingKeys = new Set(baseAttrs.map((a) => a.key.toLowerCase().trim()));
            const mergedAttrs = [...baseAttrs];
            (imported.projectOptions.attributeTemplates || []).forEach((attr: any) => {
              if (attr && attr.key && !existingKeys.has(attr.key.toLowerCase().trim())) {
                mergedAttrs.push(attr);
                existingKeys.add(attr.key.toLowerCase().trim());
              }
            });
            return {
              disciplines: mergedDisciplines,
              categories: mergedCategories,
              attributeTemplates: mergedAttrs
            };
          });
        }

        // 1. Single Spatial Group Layer Bundle
        if (imported && imported.type === 'spatial-group-bundle' && imported.group) {
          const importedGroup: SpatialGroup = imported.group;
          const importedAnnos: SpatialAnnotation[] = Array.isArray(imported.annotations) ? imported.annotations : [];

          // Assign new unique ID to group to avoid collision
          const finalGroupId = 'grp_' + Date.now();
          const finalGroup: SpatialGroup = { ...importedGroup, id: finalGroupId };

          const finalAnnos = importedAnnos.map((a) => ({
            ...a,
            id: 'anno_' + Math.random().toString(36).substring(2, 9),
            groupId: finalGroupId
          }));

          setSpatialGroups((prev) => {
            const updatedGroups = [...prev, finalGroup];
            if (activeModelId) {
              setSpatialGroupsByModel((pm) => ({ ...pm, [activeModelId]: updatedGroups }));
            }
            return updatedGroups;
          });

          setAnnotations((prev) => {
            const mergedAnnos = [...prev, ...finalAnnos];
            if (activeModelId) {
              setAnnotationsByModel((pm) => ({ ...pm, [activeModelId]: mergedAnnos }));
            }
            return mergedAnnos;
          });

          setToastNotification({
            id: 'grp_imp_' + Date.now(),
            message: `Imported layer "${importedGroup.name}" with ${importedAnnos.length} spatial records & options!`,
            type: 'success'
          });
          return;
        }

        // 2. Full Spatial Records Export Bundle with Groups
        if (imported && imported.type === 'spatial-records-export') {
          if (Array.isArray(imported.spatialGroups)) {
            setSpatialGroups(imported.spatialGroups);
            if (activeModelId) {
              setSpatialGroupsByModel((pm) => ({ ...pm, [activeModelId]: imported.spatialGroups }));
            }
          }
          if (Array.isArray(imported.annotations)) {
            setAnnotations(imported.annotations);
            if (activeModelId) {
              setAnnotationsByModel((pm) => ({ ...pm, [activeModelId]: imported.annotations }));
            }
          }
          setToastNotification({
            id: 'anno_imp_' + Date.now(),
            message: `Imported spatial records & layer datasets!`,
            type: 'success'
          });
          return;
        }

        // 3. Simple Array of Annotations
        if (Array.isArray(imported)) {
          setAnnotations(imported);
          if (activeModelId) {
            setAnnotationsByModel((prev) => ({ ...prev, [activeModelId]: imported }));
          }
          setToastNotification({
            id: 'anno_imp_' + Date.now(),
            message: `Imported ${imported.length} spatial records!`,
            type: 'success'
          });
        }
      } catch (err) {
        setToastNotification({
          id: 'anno_imp_err_' + Date.now(),
          message: 'Invalid GIS JSON file format. Please select a valid spatial records export file.',
          type: 'error'
        });
      }
    };
    reader.readAsText(file);
  };

async function blobUrlToDataUrl(blobUrl: string): Promise<string> {
  if (!blobUrl || !blobUrl.startsWith('blob:')) {
    return blobUrl;
  }
  try {
    const response = await fetch(blobUrl);
    const blob = await response.blob();
    if (blob.size > 200 * 1024 * 1024) {
      console.warn('Model blob too large for JSON base64 string embedding (>200MB)');
      return blobUrl;
    }
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string) || blobUrl);
      reader.onerror = () => resolve(blobUrl);
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.error('Error converting blob URL to Data URL for export:', err);
    return blobUrl;
  }
}

  // Export Complete 3D GIS Project Bundle (.3dproj ZIP container)
  const handleExportProject = async () => {
    setIsExporting(true);
    setToastNotification({
      id: 'export_' + Date.now(),
      message: `Packaging & exporting ZIP project bundle "${projectMeta.name}"...`,
      type: 'loading'
    });

    try {
      const zip = new JSZip();
      const modelsFolder = zip.folder('models');

      const updatedAnnosByModel = { ...annotationsByModel };
      const updatedGroupsByModel = { ...spatialGroupsByModel };
      const updatedMsrsByModel = { ...measurementsByModel };
      const updatedOverridesByModel = { ...materialOverridesByModel };
      if (activeModelId) {
        updatedAnnosByModel[activeModelId] = annotations;
        updatedGroupsByModel[activeModelId] = spatialGroups;
        updatedMsrsByModel[activeModelId] = measurements;
        updatedOverridesByModel[activeModelId] = materialOverrides;
      }

      const exportedModels = await Promise.all(
        userModels.map(async (m) => {
          const extractedTextures = extractSceneUvTextures(m.scene);
          const mOverridesMap = updatedOverridesByModel[m.id];
          const serialOverrides = mOverridesMap ? Object.fromEntries(mOverridesMap) : undefined;

          let modelFilePath: string | undefined = undefined;

          if (m.fileDataUrl) {
            try {
              let ext = 'glb';
              if (m.fileName && m.fileName.includes('.')) {
                ext = m.fileName.split('.').pop()?.toLowerCase() || 'glb';
              }
              modelFilePath = `models/${m.id}.${ext}`;

              const res = await fetch(m.fileDataUrl);
              const arrayBuffer = await res.arrayBuffer();
              modelsFolder?.file(`${m.id}.${ext}`, arrayBuffer);
            } catch (err) {
              console.error(`Error saving model binary to ZIP for ${m.name}:`, err);
            }
          }

          return {
            id: m.id,
            name: m.name,
            fileName: m.fileName,
            category: m.category,
            fileSize: m.fileSize,
            type: m.type,
            proceduralType: m.proceduralType,
            modelFile: modelFilePath,
            uploadedAt: m.uploadedAt,
            uvTextures: extractedTextures,
            materialOverrides: serialOverrides
          };
        })
      );

      const modelRecordStates: ModelRecordState[] = userModels.map((m) => ({
        modelId: m.id,
        annotations: updatedAnnosByModel[m.id] || [],
        spatialGroups: updatedGroupsByModel[m.id] || [],
        measurements: updatedMsrsByModel[m.id] || []
      }));

      const exportManifest: ExportedProjectFile = {
        version: '2.0.0',
        project: {
          ...projectMeta,
          updatedAt: new Date().toISOString()
        },
        projectThemes,
        projectOptions,
        activeModelId,
        renderSettings,
        envSettings,
        models: exportedModels,
        records: modelRecordStates
      };

      zip.file('manifest.json', JSON.stringify(exportManifest, null, 2));

      const zipBlob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      });

      const downloadUrl = URL.createObjectURL(zipBlob);
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', downloadUrl);
      downloadAnchor.setAttribute(
        'download',
        `${projectMeta.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.3dproj`
      );
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      URL.revokeObjectURL(downloadUrl);

      setToastNotification({
        id: 'export_succ_' + Date.now(),
        message: `Project ZIP bundle "${projectMeta.name}" exported (.3dproj)! Supports models up to 2GB.`,
        type: 'success'
      });
    } catch (err) {
      console.error('Export error:', err);
      setToastNotification({
        id: 'export_err_' + Date.now(),
        message: 'Failed to export project bundle.',
        type: 'error'
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Import Complete 3D GIS Project Bundle (.3dproj or .json)
  const handleImportProjectFile = async (file: File) => {
    setIsImporting(true);
    setToastNotification({
      id: 'import_' + Date.now(),
      message: `Reading & loading project file (${file.name})...`,
      type: 'loading'
    });

    try {
      let parsed: ExportedProjectFile | null = null;
      let zip: JSZip | null = null;

      // Check if file is a ZIP archive (.3dproj)
      try {
        zip = await JSZip.loadAsync(file);
        const manifestFile = zip.file('manifest.json');
        if (manifestFile) {
          const manifestStr = await manifestFile.async('string');
          parsed = JSON.parse(manifestStr);
        }
      } catch (e) {
        zip = null;
      }

      if (!parsed) {
        // Fallback reading as plain text JSON file
        const text = await file.text();
        parsed = JSON.parse(text);
      }

      if (!parsed || !parsed.project || !Array.isArray(parsed.models)) {
        setToastNotification({
          id: 'import_err_' + Date.now(),
          message: 'Invalid 3D Project file format. Missing project manifest or model definitions.',
          type: 'error'
        });
        setIsImporting(false);
        return;
      }

      setIsLoading(true);
      setUploadProgress(20);

      // Restore Project Themes
      if (parsed.projectThemes && Array.isArray(parsed.projectThemes)) {
        setProjectThemes(parsed.projectThemes);
      }

      // Restore Project Options (Disciplines, GIS Categories, Attribute Templates)
      if (parsed.projectOptions) {
        setProjectOptions({
          disciplines: Array.isArray(parsed.projectOptions.disciplines) && parsed.projectOptions.disciplines.length > 0
            ? parsed.projectOptions.disciplines
            : DEFAULT_PROJECT_OPTIONS.disciplines,
          categories: Array.isArray(parsed.projectOptions.categories) && parsed.projectOptions.categories.length > 0
            ? parsed.projectOptions.categories
            : DEFAULT_PROJECT_OPTIONS.categories,
          attributeTemplates: Array.isArray(parsed.projectOptions.attributeTemplates)
            ? parsed.projectOptions.attributeTemplates
            : DEFAULT_PROJECT_OPTIONS.attributeTemplates
        });
      }

      const reconstructedModels: UploadedModelItem[] = [];
      const newOverridesByModel: Record<string, Map<string, MaterialOverride>> = {};

      for (let i = 0; i < parsed.models.length; i++) {
        const m = parsed.models[i];
        let scene: THREE.Object3D;
        let stats: ModelStats;
        let hierarchy: MeshNodeInfo[];
        let animations: AnimationClipInfo[] = [];
        let rawClips: THREE.AnimationClip[] = [];

        let loadedModelSuccess = false;

        let modelDataUrl = m.fileDataUrl;
        if (zip && m.modelFile) {
          const zipModel = zip.file(m.modelFile);
          if (zipModel) {
            const blob = await zipModel.async('blob');
            modelDataUrl = URL.createObjectURL(blob);
          }
        }

        if (m.type === 'procedural' || (!modelDataUrl && m.proceduralType)) {
          const group = generateProceduralModel(m.proceduralType || 'drone');
          const res = analyzeObject3D(group, m.name, 'Generated', 'Procedural');
          scene = res.scene;
          stats = res.stats;
          hierarchy = res.hierarchy;
          loadedModelSuccess = true;
        } else if (modelDataUrl) {
          try {
            const res = await load3DModelFromDataUrl(modelDataUrl, m.fileName);
            scene = res.scene;
            stats = res.stats;
            hierarchy = res.hierarchy;
            animations = res.animations;
            rawClips = res.rawClips;
            loadedModelSuccess = true;
          } catch (err) {
            console.warn(`Could not parse 3D model data for ${m.fileName}:`, err);
          }
        }

        if (!loadedModelSuccess) {
          const group = generateProceduralModel('drone');
          const res = analyzeObject3D(group, m.name || 'Restored Model', 'Restored', 'Procedural');
          scene = res.scene;
          stats = res.stats;
          hierarchy = res.hierarchy;
          setToastNotification({
            id: 'import_warn_' + Date.now() + '_' + i,
            message: `Model "${m.name || m.fileName}" binary mesh data could not be parsed. Loaded default structure. All spatial records, themes, and measurements restored!`,
            type: 'warning'
          });
        }

          // Re-apply preloaded UV textures if included in project bundle
          if (m.uvTextures && m.uvTextures.length > 0) {
            reapplyUvTexturesToScene(scene, m.uvTextures);
          }

          if (m.materialOverrides) {
            const overrideEntries = Object.entries(m.materialOverrides);
            newOverridesByModel[m.id] = new Map(overrideEntries);
          }

          reconstructedModels.push({
            id: m.id,
            name: m.name,
            fileName: m.fileName,
            category: m.category,
            fileSize: m.fileSize,
            type: m.type,
            proceduralType: m.proceduralType,
            fileDataUrl: modelDataUrl,
            scene,
            stats,
            hierarchy,
            animations,
            rawClips,
            uploadedAt: m.uploadedAt
          });
        }

        const newAnnosByModel: Record<string, SpatialAnnotation[]> = {};
        const newGroupsByModel: Record<string, SpatialGroup[]> = {};
        const newMsrsByModel: Record<string, Measurement[]> = {};
        if (Array.isArray(parsed.records)) {
          parsed.records.forEach((r) => {
            newAnnosByModel[r.modelId] = r.annotations || [];
            newGroupsByModel[r.modelId] = r.spatialGroups || [];
            newMsrsByModel[r.modelId] = r.measurements || [];
          });
        }

        // Dispose previous models before replacing workspace
        userModels.forEach((oldModel) => {
          if (oldModel.fileDataUrl?.startsWith('blob:')) {
            URL.revokeObjectURL(oldModel.fileDataUrl);
          }
          disposeObject3D(oldModel.scene);
        });

        setProjectMeta(parsed.project);
        setUserModels(reconstructedModels);
        setAnnotationsByModel(newAnnosByModel);
        setSpatialGroupsByModel(newGroupsByModel);
        setMeasurementsByModel(newMsrsByModel);
        setMaterialOverridesByModel(newOverridesByModel);
        setHiddenNodesByModel({});
        setIsolatedNodeId(null);
        setSelectedAnnotationId(null);
        handleCloseTour();

        if (parsed.renderSettings) setRenderSettings(parsed.renderSettings);
        if (parsed.envSettings) setEnvSettings(parsed.envSettings);

        const targetId = parsed.activeModelId || (reconstructedModels[0] ? reconstructedModels[0].id : null);
        if (targetId && reconstructedModels.some((m) => m.id === targetId)) {
          const target = reconstructedModels.find((m) => m.id === targetId)!;
          setActiveModelId(target.id);
          setModelScene(target.scene);
          setStats(target.stats);
          setHierarchy(target.hierarchy);
          setAnimations(target.animations);
          setRawClips(target.rawClips);
          setAnnotations(newAnnosByModel[target.id] || []);
          setSpatialGroups(newGroupsByModel[target.id] || []);
          setMeasurements(newMsrsByModel[target.id] || []);
          setMaterialOverrides(newOverridesByModel[target.id] || new Map());
          setHiddenNodeIds(new Set());
        } else if (reconstructedModels.length > 0) {
          const first = reconstructedModels[0];
          setActiveModelId(first.id);
          setModelScene(first.scene);
          setStats(first.stats);
          setHierarchy(first.hierarchy);
          setAnimations(first.animations);
          setRawClips(first.rawClips);
          setAnnotations(newAnnosByModel[first.id] || []);
          setSpatialGroups(newGroupsByModel[first.id] || []);
          setMeasurements(newMsrsByModel[first.id] || []);
          setMaterialOverrides(newOverridesByModel[first.id] || new Map());
          setHiddenNodeIds(new Set());
        }

        handleCloseProjectModal();
        setToastNotification({
          id: 'import_succ_' + Date.now(),
          message: `Project "${parsed.project.name}" loaded (${reconstructedModels.length} model(s))!`,
          type: 'success'
        });
      } catch (err) {
        console.error('Error importing project:', err);
        setToastNotification({
          id: 'import_err_' + Date.now(),
          message: 'Could not parse 3D Project file.',
          type: 'error'
        });
      } finally {
        setIsLoading(false);
        setIsImporting(false);
      }
    };

  // Start New Project
  const handleNewProject = (name?: string, author?: string, description?: string) => {
    const projName = name?.trim() || 'New 3D GIS Project';
    setProjectMeta({
      id: 'proj_' + Date.now(),
      name: projName,
      author: author?.trim() || 'Surveyor',
      description: description?.trim() || 'Model-linked spatial documentation project workspace.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // Dispose existing models and revoke blob URLs to free GPU and browser memory
    userModels.forEach((oldModel) => {
      if (oldModel.fileDataUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(oldModel.fileDataUrl);
      }
      disposeObject3D(oldModel.scene);
    });

    // Reset workspace to blank 3D space with no premade models
    setUserModels([]);
    setActiveModelId(null);
    setModelScene(null);
    setStats(null);
    setHierarchy([]);
    setAnimations([]);
    setRawClips([]);

    setAnnotations([]);
    setAnnotationsByModel({});
    setSpatialGroups([]);
    setSpatialGroupsByModel({});
    setMeasurements([]);
    setMeasurementsByModel({});
    setMaterialOverrides(new Map());
    setMaterialOverridesByModel({});
    setHiddenNodeIds(new Set());
    setHiddenNodesByModel({});
    setIsolatedNodeId(null);
    setSelectedAnnotationId(null);
    handleCloseTour();
    setProjectThemes([]);
    setProjectOptions(DEFAULT_PROJECT_OPTIONS);

    // Close project modal and open 3D model upload window on screen
    handleCloseProjectModal();
    setIsUploadOpen(true);
    setToastNotification({
      id: 'new_proj_' + Date.now(),
      message: `Created new project "${projName}". Upload a 3D model to begin.`,
      type: 'info'
    });
  };

  // Take High-Res PNG Screenshot
  const handleTakeScreenshot = () => {
    if (!canvasRef.current) return;
    const dataUrl = canvasRef.current.takeScreenshot();
    if (!dataUrl) return;

    const link = document.createElement('a');
    link.download = `${stats?.name || '3d_gis_model'}_snapshot.png`;
    link.href = dataUrl;
    link.click();

    setToastNotification({
      id: 'screenshot_' + Date.now(),
      message: 'High-res PNG screenshot captured and downloaded!',
      type: 'success'
    });
  };

  // Toggle Node Hide
  const handleToggleHideNode = (nodeId: string) => {
    setHiddenNodeIds((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      if (activeModelId) {
        setHiddenNodesByModel((map) => ({ ...map, [activeModelId]: next }));
      }
      return next;
    });
  };

  // Update Material Override for a Mesh Node or Global Scope
  const handleUpdateMaterialOverride = (
    nodeId: string,
    override: MaterialOverride
  ) => {
    setMaterialOverrides((prev) => {
      const next = new Map(prev);
      next.set(nodeId, override);
      if (activeModelId) {
        setMaterialOverridesByModel((map) => ({ ...map, [activeModelId]: next }));
      }
      return next;
    });
  };

  const handleAddMeasurement = (m: Measurement) => {
    setMeasurements((prev) => {
      const next = [...prev, m];
      if (activeModelId) {
        setMeasurementsByModel((map) => ({ ...map, [activeModelId]: next }));
      }
      return next;
    });
  };

  const handleRemoveMeasurement = (id: string) => {
    setMeasurements((prev) => {
      const next = prev.filter((m) => m.id !== id);
      if (activeModelId) {
        setMeasurementsByModel((map) => ({ ...map, [activeModelId]: next }));
      }
      return next;
    });
  };

  const handleClearMeasurements = () => {
    setMeasurements([]);
    if (activeModelId) {
      setMeasurementsByModel((map) => ({ ...map, [activeModelId]: [] }));
    }
  };

  return (
    <div className={`relative w-screen h-screen overflow-hidden font-sans select-none flex flex-col transition-colors ${
      uiTheme === 'light' ? 'bg-slate-100 text-slate-900' : 'bg-[#09090B] text-zinc-100'
    }`}>
      {/* Top Header Bar */}
      <TopNavbar
        stats={stats}
        viewMode={viewMode}
        onToggleViewMode={() =>
          setViewMode((v) => {
            const next = v === 'researcher' ? 'audience' : 'researcher';
            if (next === 'audience') {
              setIsSidebarOpen(false);
              setIsAddingPinMode(false);
              setGisPanelTab('themes');
            }
            return next;
          })
        }
        uiTheme={uiTheme}
        onToggleUiTheme={handleToggleUiTheme}
        onOpenUpload={() => setIsUploadOpen(true)}
        onSelectSampleModel={(sample) => loadProceduralSample(sample.id)}
        userModels={userModels}
        activeModelId={activeModelId}
        onSelectUserModel={handleSelectUserModel}
        onDeleteUserModel={handleDeleteUserModel}
        onTakeScreenshot={handleTakeScreenshot}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarOpen={isSidebarOpen}
        activeSampleId={activeSampleId}
        isGisPanelOpen={isGisPanelOpen}
        gisPanelTab={gisPanelTab}
        onToggleGisPanel={handleToggleGisPanel}
        spatialRecordCount={annotations.length}
        projectMeta={projectMeta}
        onOpenProjectModal={() => setIsProjectModalOpen(true)}
        onOpenRoleModal={() => setIsRoleModalOpen(true)}
        onExportProject={handleExportProject}
        onImportProjectFile={handleImportProjectFile}
        isExporting={isExporting}
        isImporting={isImporting}
      />

      {/* Main Container Layout */}
      <div className="relative flex-1 w-full h-full flex overflow-hidden pt-14">
        {/* Main 3D Canvas Viewport */}
        <main className="relative flex-1 h-full overflow-hidden">
          {/* Blank Canvas Landing Card when no model is active */}
          {modelScene === null && (
            <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center p-4">
              <div className={`pointer-events-auto max-w-md w-full rounded-3xl p-6 border shadow-2xl backdrop-blur-xl text-center space-y-4 ${
                uiTheme === 'light'
                  ? 'bg-white/95 border-slate-200 text-slate-800'
                  : 'bg-[#0C0C0E]/95 border-zinc-800 text-zinc-100'
              }`}>
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto shadow-lg ${
                  uiTheme === 'light' ? 'bg-blue-100 border border-blue-200 text-blue-600' : 'bg-blue-500/10 border border-blue-500/30 text-blue-400'
                }`}>
                  <Box className="w-8 h-8" />
                </div>

                <div className="space-y-1.5">
                  <h2 className="text-lg font-bold tracking-tight">Blank 3D Canvas Ready</h2>
                  <p className={`text-xs leading-relaxed ${uiTheme === 'light' ? 'text-slate-500' : 'text-zinc-400'}`}>
                    Upload a 3D geometry model (<span className="font-mono text-blue-500 font-semibold">.OBJ, .GLTF, .GLB, .STL, .PLY</span>) to analyze mesh structure, perform measurements, and log 3D spatial annotations.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
                  <button
                    onClick={() => setIsProjectModalOpen(true)}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2"
                  >
                    <FolderKanban className="w-4 h-4" />
                    <span>Open Project Manager</span>
                  </button>

                  <button
                    onClick={() => setIsUploadOpen(true)}
                    className={`w-full sm:w-auto px-4 py-2.5 rounded-xl border font-semibold text-xs transition-colors flex items-center justify-center gap-2 ${
                      uiTheme === 'light'
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
                        : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border-zinc-800'
                    }`}
                  >
                    <Upload className="w-4 h-4 text-blue-500" />
                    <span>Upload 3D Model</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          <ThreeCanvas
            ref={canvasRef}
            modelScene={modelScene}
            renderSettings={renderSettings}
            envSettings={envSettings}
            projectionMode={projectionMode}
            navigationMode={navigationMode}
            measureMode={measureMode}
            measurements={measurements}
            onAddMeasurement={handleAddMeasurement}
            annotations={annotations}
            spatialGroups={spatialGroups}
            selectedAnnotationId={selectedAnnotationId}
            isAddingPinMode={isAddingPinMode}
            activeDrawGeometryType={activeDrawGeometryType}
            boxCreationMode={boxCreationMode}
            drawingPoints={drawingPoints}
            onSelectAnnotation={handleSelectAnnotation}
            onAddPinAtPoint={handleAddPinAtPoint}
            activeAnimationIndex={activeAnimationIndex}
            isPlayingAnimation={isPlayingAnimation}
            animationSpeed={animationSpeed}
            rawClips={rawClips}
            isolatedNodeId={isolatedNodeId}
            hiddenNodeIds={hiddenNodeIds}
            highlightedNodeId={highlightedNodeId}
            materialOverrides={materialOverrides}
            viewMode={viewMode}
            isGisPanelOpen={isGisPanelOpen}
            onOpenGisPanel={() => setIsGisPanelOpen(true)}
            onEditAnnotation={(anno) => {
              setEditingAnnotation(anno);
              setPendingSurfacePoint(anno.position);
              setEditorModalOpen(true);
            }}
            onStartEditShape={handleStartShapeEditing}
            editingShapeAnnotation={editingShapeAnnotation}
            editingShapePoints={editingShapePoints}
            onUpdateEditingShapePoints={setEditingShapePoints}
            onDeleteAnnotation={handleDeleteAnnotation}
            onOpenPdf={setActivePdf}
            onOpenImage={setActiveImage}
            onFocusAnnotation={handleFocusAnnotation}
            onUpdateRenderSettings={(s) => setRenderSettings((prev) => ({ ...prev, ...s }))}
            uiTheme={uiTheme}
            audienceUser={audienceUser}
            onUpdateAudienceUser={setAudienceUser}
            onAddComment={handleAddComment}
            onVoteComment={handleVoteComment}
            onDeleteComment={handleDeleteComment}
            isCommentsWingOpen={isCommentsWingOpen}
            onToggleCommentsWing={() => setIsCommentsWingOpen((prev) => !prev)}
            activeThemeName={activeTourRoute?.themeName}
          />

          {/* Floating Bottom Navigation & Camera Controls */}
          <ControlBar
            onResetCamera={() => canvasRef.current?.resetCamera()}
            onSetCameraPreset={(preset: CameraPreset) => canvasRef.current?.setCameraPreset(preset)}
            projectionMode={projectionMode}
            onToggleProjectionMode={() =>
              setProjectionMode((p) => (p === 'perspective' ? 'orthographic' : 'perspective'))
            }
            navigationMode={navigationMode}
            onToggleNavigationMode={() =>
              setNavigationMode((m) => (m === 'orbit' ? 'terrain' : 'orbit'))
            }
            measureMode={measureMode}
            onToggleMeasureMode={() => setMeasureMode(!measureMode)}
            renderSettings={renderSettings}
            onUpdateRenderSettings={(s) => setRenderSettings((prev) => ({ ...prev, ...s }))}
            envSettings={envSettings}
            onUpdateEnvSettings={(e) => setEnvSettings((prev) => ({ ...prev, ...e }))}
            uiTheme={uiTheme}
            onOpenGpuGuide={() => setGpuGuideModalOpen(true)}
          />

          {/* Spatial Geometry Creation Mode Floating Bar */}
          {isAddingPinMode && (
            <div className={`absolute top-20 left-1/2 -translate-x-1/2 z-40 backdrop-blur-xl border border-blue-500/50 rounded-2xl p-2.5 shadow-2xl flex items-center gap-3 text-xs ${
              uiTheme === 'light' ? 'bg-white/95 text-slate-900' : 'bg-[#0C0C0E]/95 text-white'
            }`}>
              <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-500/20 text-blue-500 font-semibold rounded-xl">
                {activeDrawGeometryType === 'polyline' ? (
                  <Activity className="w-4 h-4 text-amber-500" />
                ) : activeDrawGeometryType === 'polygon' ? (
                  <Square className="w-4 h-4 text-emerald-500" />
                ) : activeDrawGeometryType === 'box' ? (
                  <Box className="w-4 h-4 text-cyan-500" />
                ) : activeDrawGeometryType === 'submesh' ? (
                  <Component className="w-4 h-4 text-purple-500" />
                ) : (
                  <MapPin className="w-4 h-4 text-blue-500" />
                )}
                <span>
                  {activeDrawGeometryType === 'polyline'
                    ? '3D Polyline Mode'
                    : activeDrawGeometryType === 'polygon'
                    ? '3D Polygon Zone Mode'
                    : activeDrawGeometryType === 'box'
                    ? '3D Box Solid Volume Mode'
                    : activeDrawGeometryType === 'submesh'
                    ? 'Sub-Mesh Highlight Mode'
                    : '3D Point Pin Mode'}
                </span>
              </div>

              {/* Geometry Type Selector Pills */}
              <div className={`flex items-center p-1 border rounded-xl gap-1 ${
                uiTheme === 'light' ? 'bg-slate-100 border-slate-200' : 'bg-zinc-950 border-zinc-800'
              }`}>
                <button
                  type="button"
                  onClick={() => {
                    setActiveDrawGeometryType('point');
                    setDrawingPoints([]);
                  }}
                  className={`px-2.5 py-1 rounded-lg flex items-center gap-1 font-medium transition-colors ${
                    activeDrawGeometryType === 'point'
                      ? 'bg-blue-600 text-white font-bold'
                      : uiTheme === 'light' ? 'text-slate-600 hover:text-slate-900' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Point</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveDrawGeometryType('polyline');
                    setDrawingPoints([]);
                  }}
                  className={`px-2.5 py-1 rounded-lg flex items-center gap-1 font-medium transition-colors ${
                    activeDrawGeometryType === 'polyline'
                      ? 'bg-blue-600 text-white font-bold'
                      : uiTheme === 'light' ? 'text-slate-600 hover:text-slate-900' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5 text-amber-500" />
                  <span>Polyline</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveDrawGeometryType('polygon');
                    setDrawingPoints([]);
                  }}
                  className={`px-2.5 py-1 rounded-lg flex items-center gap-1 font-medium transition-colors ${
                    activeDrawGeometryType === 'polygon'
                      ? 'bg-blue-600 text-white font-bold'
                      : uiTheme === 'light' ? 'text-slate-600 hover:text-slate-900' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Square className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Polygon</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveDrawGeometryType('box');
                    setDrawingPoints([]);
                  }}
                  className={`px-2.5 py-1 rounded-lg flex items-center gap-1 font-medium transition-colors ${
                    activeDrawGeometryType === 'box'
                      ? 'bg-blue-600 text-white font-bold'
                      : uiTheme === 'light' ? 'text-slate-600 hover:text-slate-900' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Box className="w-3.5 h-3.5 text-cyan-500" />
                  <span>Box Solid</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveDrawGeometryType('submesh');
                    setDrawingPoints([]);
                  }}
                  className={`px-2.5 py-1 rounded-lg flex items-center gap-1 font-medium transition-colors ${
                    activeDrawGeometryType === 'submesh'
                      ? 'bg-blue-600 text-white font-bold'
                      : uiTheme === 'light' ? 'text-slate-600 hover:text-slate-900' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Component className="w-3.5 h-3.5 text-purple-500" />
                  <span>Sub-Mesh</span>
                </button>
              </div>

              {/* Multi-point & Box Mode Actions */}
              {activeDrawGeometryType === 'box' && (
                <div className={`flex items-center gap-2 pl-2 border-l ${
                  uiTheme === 'light' ? 'border-slate-200' : 'border-zinc-800'
                }`}>
                  <div className={`flex items-center p-0.5 rounded-lg border ${
                    uiTheme === 'light' ? 'bg-slate-200/70 border-slate-300' : 'bg-zinc-900 border-zinc-700'
                  }`}>
                    <button
                      type="button"
                      onClick={() => {
                        setBoxCreationMode('surface');
                        setDrawingPoints([]);
                      }}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-semibold transition-all ${
                        boxCreationMode === 'surface'
                          ? 'bg-cyan-500 text-white shadow-sm'
                          : uiTheme === 'light' ? 'text-slate-700 hover:text-slate-900' : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                      title="Single click on surface to drop box"
                    >
                      🎯 1-Click Surface
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setBoxCreationMode('bounds');
                        setDrawingPoints([]);
                      }}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-semibold transition-all ${
                        boxCreationMode === 'bounds'
                          ? 'bg-cyan-500 text-white shadow-sm'
                          : uiTheme === 'light' ? 'text-slate-700 hover:text-slate-900' : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                      title="Click 2 opposite corners on ground"
                    >
                      📐 2-Corner Area
                    </button>
                  </div>

                  <span className="px-2.5 py-1 bg-cyan-500/15 text-cyan-500 border border-cyan-500/30 text-[11px] font-mono font-semibold rounded-xl animate-pulse">
                    {boxCreationMode === 'surface'
                      ? 'Click anywhere on 3D surface to place box'
                      : drawingPoints.length === 0
                      ? '1/2: Click 1st Base Corner'
                      : '2/2: Click Opposite Corner'}
                  </span>
                </div>
              )}

              {(activeDrawGeometryType === 'polyline' || activeDrawGeometryType === 'polygon') && (
                <div className={`flex items-center gap-2 pl-2 border-l ${
                  uiTheme === 'light' ? 'border-slate-200' : 'border-zinc-800'
                }`}>
                  <span className={`text-[11px] font-mono ${uiTheme === 'light' ? 'text-slate-500' : 'text-zinc-400'}`}>
                    {drawingPoints.length} Vertices
                  </span>
                  <button
                    type="button"
                    onClick={handleCompleteGeometryDrawing}
                    disabled={drawingPoints.length < (activeDrawGeometryType === 'polygon' ? 3 : 2)}
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white font-semibold rounded-xl flex items-center gap-1 shadow-md transition-all"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Done ({drawingPoints.length})</span>
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={handleCancelDrawing}
                className={`p-1.5 rounded-xl transition-colors ${
                  uiTheme === 'light' ? 'hover:bg-slate-200 text-slate-500 hover:text-slate-900' : 'hover:bg-zinc-800 text-zinc-400 hover:text-white'
                }`}
                title="Exit Spatial Creation Mode"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Interactive 3D Shape Editing Floating Bar */}
          {editingShapeAnnotation && (
            <div className={`absolute top-20 left-1/2 -translate-x-1/2 z-40 backdrop-blur-xl border border-amber-500/60 rounded-2xl p-2.5 shadow-2xl flex items-center gap-3 text-xs animate-in fade-in slide-in-from-top-3 ${
              uiTheme === 'light' ? 'bg-white/95 text-slate-900' : 'bg-[#0C0C0E]/95 text-white'
            }`}>
              <div className="flex items-center gap-2 px-2.5 py-1 bg-amber-500/20 text-amber-500 font-semibold rounded-xl border border-amber-500/30">
                <Box className="w-4 h-4 text-amber-400 animate-pulse" />
                <span>
                  {editingShapeAnnotation.geometryType === 'box'
                    ? `Box Volume: ${editingShapeAnnotation.title}`
                    : `Editing 3D Shape: ${editingShapeAnnotation.title}`}
                </span>
              </div>

              {editingShapeAnnotation.geometryType === 'box' ? (
                <div className={`flex items-center gap-2 px-2 border-l border-r ${
                  uiTheme === 'light' ? 'border-slate-200' : 'border-zinc-800'
                }`}>
                  <span className={`text-[11px] font-mono ${uiTheme === 'light' ? 'text-slate-700 font-bold' : 'text-cyan-400 font-bold'}`}>
                    {(editingShapeAnnotation.boxDimensions?.width || 1).toFixed(1)}m × {(editingShapeAnnotation.boxDimensions?.height || 1).toFixed(1)}m × {(editingShapeAnnotation.boxDimensions?.depth || 1).toFixed(1)}m
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        const cur = editingShapeAnnotation.boxDimensions || { width: 1, height: 1, depth: 1 };
                        const updated = {
                          ...editingShapeAnnotation,
                          boxDimensions: {
                            width: Math.round((cur.width + 0.5) * 10) / 10,
                            height: Math.round((cur.height + 0.5) * 10) / 10,
                            depth: Math.round((cur.depth + 0.5) * 10) / 10
                          }
                        };
                        setEditingShapeAnnotation(updated);
                      }}
                      className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                        uiTheme === 'light'
                          ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300'
                          : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
                      }`}
                      title="Enlarge all dimensions by 0.5m"
                    >
                      +0.5m
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const cur = editingShapeAnnotation.boxDimensions || { width: 1, height: 1, depth: 1 };
                        const updated = {
                          ...editingShapeAnnotation,
                          boxDimensions: {
                            width: Math.max(0.2, Math.round((cur.width - 0.5) * 10) / 10),
                            height: Math.max(0.2, Math.round((cur.height - 0.5) * 10) / 10),
                            depth: Math.max(0.2, Math.round((cur.depth - 0.5) * 10) / 10)
                          }
                        };
                        setEditingShapeAnnotation(updated);
                      }}
                      className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                        uiTheme === 'light'
                          ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300'
                          : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
                      }`}
                      title="Reduce all dimensions by 0.5m"
                    >
                      -0.5m
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const h = editingShapeAnnotation.boxDimensions?.height || 1.0;
                        setEditingShapeAnnotation({
                          ...editingShapeAnnotation,
                          position: {
                            ...editingShapeAnnotation.position,
                            y: Math.round((editingShapeAnnotation.position.y + h / 2) * 1000) / 1000
                          }
                        });
                      }}
                      className={`px-2 py-0.5 border rounded text-[10px] font-medium transition-colors ${
                        uiTheme === 'light'
                          ? 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200'
                          : 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border-blue-500/30'
                      }`}
                      title="Elevate box so bottom rests on ground"
                    >
                      Rest on Ground (+H/2)
                    </button>
                  </div>
                </div>
              ) : (
                <div className={`flex items-center gap-2 px-2 border-l border-r ${
                  uiTheme === 'light' ? 'border-slate-200' : 'border-zinc-800'
                }`}>
                  <span className={`text-[11px] font-mono ${uiTheme === 'light' ? 'text-slate-600' : 'text-zinc-300'}`}>
                    {editingShapePoints.length} Vertices
                  </span>
                  <span className={`text-[11px] font-medium hidden sm:inline ${
                    uiTheme === 'light' ? 'text-amber-700' : 'text-amber-400/90'
                  }`}>
                    (Click 3D surface to place/add vertices)
                  </span>
                </div>
              )}

              <div className="flex items-center gap-1.5">
                {editingShapeAnnotation.geometryType !== 'box' && (
                  <>
                    <button
                      type="button"
                      onClick={handleRemoveLastShapePoint}
                      disabled={editingShapePoints.length === 0}
                      className={`px-2.5 py-1 rounded-xl disabled:opacity-40 font-medium transition-colors ${
                        uiTheme === 'light'
                          ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300'
                          : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
                      }`}
                    >
                      Undo Point
                    </button>
                    <button
                      type="button"
                      onClick={handleClearShapePoints}
                      disabled={editingShapePoints.length === 0}
                      className={`px-2.5 py-1 rounded-xl disabled:opacity-40 font-medium transition-colors ${
                        uiTheme === 'light'
                          ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                          : 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300'
                      }`}
                    >
                      Clear All
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={handleSaveShapeEditing}
                  className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl flex items-center gap-1 shadow-md transition-all ml-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Shape</span>
                </button>
                <button
                  type="button"
                  onClick={handleCancelShapeEditing}
                  className={`p-1.5 rounded-xl transition-colors ${
                    uiTheme === 'light' ? 'hover:bg-slate-200 text-slate-500' : 'hover:bg-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                  title="Cancel Shape Editing"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Measurement Active Overlay */}
          <MeasurementOverlay
            measureMode={measureMode}
            measurements={measurements}
            unit={renderSettings.measurementUnit || 'm'}
            onToggleMeasureMode={() => setMeasureMode(!measureMode)}
            onClearMeasurements={handleClearMeasurements}
            onRemoveMeasurement={handleRemoveMeasurement}
            uiTheme={uiTheme}
          />
        </main>

        {/* 3D GIS Spatial Records List Panel (Toggleable via top navbar or close button) */}
        {isGisPanelOpen && (
          <GisDataListPanel
            viewMode={viewMode}
            annotations={annotations}
            spatialGroups={spatialGroups}
            selectedAnnotationId={selectedAnnotationId}
            isAddingPinMode={isAddingPinMode}
            onToggleAddPinMode={() => setIsAddingPinMode(!isAddingPinMode)}
            onSelectAnnotation={handleSelectAnnotation}
            onFocusAnnotation={handleFocusAnnotation}
            onEditAnnotation={(anno) => {
              setEditingAnnotation(anno);
              setPendingSurfacePoint(anno.position);
              setEditorModalOpen(true);
            }}
            onStartEditShape={handleStartShapeEditing}
            onDeleteAnnotation={handleDeleteAnnotation}
            onOpenPdf={setActivePdf}
            onOpenImage={setActiveImage}
            onExportJson={handleExportJson}
            onImportJson={handleImportJson}
            onToggleGroupVisibility={handleToggleGroupVisibility}
            onCreateGroup={handleCreateGroup}
            onDeleteGroup={handleDeleteGroup}
            onExportGroupJson={handleExportGroupJson}
            onAddRecordToGroup={handleAddRecordToGroup}
            onReassignRecordGroup={handleReassignRecordGroup}
            onClosePanel={() => setIsGisPanelOpen(false)}
            uiTheme={uiTheme}
            isSidebarOpen={isSidebarOpen}
            onStartThemeTour={handleStartThemeTour}
            activeThemeName={activeTourRoute?.themeName}
            onRefreshRoutes={handleRefreshTourRoutes}
            activeTab={gisPanelTab}
            onChangeTab={setGisPanelTab}
            customThemeOrders={customThemeOrders}
            onReorderThemeRecords={handleReorderThemeRecords}
            onResetThemeOrder={handleResetThemeOrder}
            onToggleRecordTheme={handleToggleRecordTheme}
            onSetThemeNarrationBinding={handleSetThemeNarrationBinding}
            projectThemes={projectThemes}
            onCreateTheme={handleCreateTheme}
            onUpdateTheme={handleUpdateTheme}
            onDeleteTheme={handleDeleteTheme}
            projectOptions={projectOptions}
            onOpenProjectOptions={handleOpenProjectOptions}
          />
        )}

        {/* Interpretive Theme Virtual Tour Overlay */}
        <ThemeTourOverlay
          activeRoute={activeTourRoute}
          activeStopIndex={activeStopIndex}
          isPlaying={isTourPlaying}
          onTogglePlay={() => setIsTourPlaying(!isTourPlaying)}
          onNextStop={handleNextTourStop}
          onPrevStop={handlePrevTourStop}
          onSelectStopIndex={handleSelectTourStopIndex}
          onRefreshRoutes={handleRefreshTourRoutes}
          onCloseTour={handleCloseTour}
          activeAnnotation={
            activeTourRoute && activeTourRoute.stops[activeStopIndex]
              ? annotations.find((a) => a.id === activeTourRoute.stops[activeStopIndex].annotationId) || null
              : null
          }
          uiTheme={uiTheme}
          onOpenImageLightbox={setActiveImage}
          onOpenPdfViewer={setActivePdf}
        />

        {/* Right Collapsible UX Options & Scene Inspector Drawer */}
        <SidebarInspector
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          hierarchy={hierarchy}
          renderSettings={renderSettings}
          onUpdateRenderSettings={(s) => setRenderSettings((prev) => ({ ...prev, ...s }))}
          envSettings={envSettings}
          onUpdateEnvSettings={(e) => setEnvSettings((prev) => ({ ...prev, ...e }))}
          isolatedNodeId={isolatedNodeId}
          onIsolateNode={setIsolatedNodeId}
          hiddenNodeIds={hiddenNodeIds}
          onToggleHideNode={handleToggleHideNode}
          highlightedNodeId={highlightedNodeId}
          onHighlightNode={setHighlightedNodeId}
          materialOverrides={materialOverrides}
          onUpdateMaterialOverride={handleUpdateMaterialOverride}
          animations={animations}
          activeAnimationIndex={activeAnimationIndex}
          onSelectAnimation={setActiveAnimationIndex}
          isPlayingAnimation={isPlayingAnimation}
          onTogglePlayAnimation={() => setIsPlayingAnimation(!isPlayingAnimation)}
          animationSpeed={animationSpeed}
          onChangeAnimationSpeed={setAnimationSpeed}
          measurements={measurements}
          onRemoveMeasurement={handleRemoveMeasurement}
          onClearMeasurements={handleClearMeasurements}
          onFocusMeasurement={handleFocusMeasurement}
          onConvertMeasurementToAnnotation={handleConvertMeasurementToAnnotation}
          uiTheme={uiTheme}
          modelScene={modelScene}
          onOpenGpuGuide={() => setGpuGuideModalOpen(true)}
          viewMode={viewMode}
        />
      </div>

      {/* GPU & Hardware Performance Guide Modal */}
      <GpuHardwareGuideModal
        isOpen={gpuGuideModalOpen}
        onClose={() => setGpuGuideModalOpen(false)}
        uiTheme={uiTheme}
        renderSettings={renderSettings}
        onUpdateRenderSettings={(s) => setRenderSettings((prev) => ({ ...prev, ...s }))}
      />

      {/* 3D Spatial Record Editor Modal (Researcher) */}
      <AnnotationEditorModal
        isOpen={editorModalOpen}
        annotation={editingAnnotation}
        surfacePoint={pendingSurfacePoint}
        initialGeometryType={activeDrawGeometryType}
        initialPoints={drawingPoints.length > 0 ? drawingPoints : undefined}
        initialBoxDimensions={pendingBoxDimensions || undefined}
        initialNodeId={pendingNodeId}
        initialGroupId={targetGroupIdForNewRecord}
        meshNodes={hierarchy}
        spatialGroups={spatialGroups}
        projectThemes={projectThemes}
        projectOptions={projectOptions}
        onOpenProjectOptions={handleOpenProjectOptions}
        onSave={(savedAnno) => {
          handleSaveAnnotation(savedAnno);
          setEditorModalOpen(false);
          setEditingAnnotation(null);
          setPendingSurfacePoint(null);
          setDrawingPoints([]);
          setPendingNodeId(undefined);
          setPendingBoxDimensions(null);
          setTargetGroupIdForNewRecord(undefined);
        }}
        onStartEditShape={handleStartShapeEditing}
        onClose={() => {
          setEditorModalOpen(false);
          setEditingAnnotation(null);
          setPendingSurfacePoint(null);
          setPendingBoxDimensions(null);
          setDrawingPoints([]);
          setPendingNodeId(undefined);
          setTargetGroupIdForNewRecord(undefined);
        }}
        uiTheme={uiTheme}
      />

      {/* PDF Document Viewer Modal */}
      <PdfViewerModal pdf={activePdf} onClose={() => setActivePdf(null)} uiTheme={uiTheme} />

      {/* Image Lightbox Gallery Modal */}
      <ImageLightboxModal image={activeImage} onClose={() => setActiveImage(null)} uiTheme={uiTheme} />

      {/* Upload 3D Model File Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onFileUpload={handleFileUpload}
        onSelectSampleModel={(sample) => loadProceduralSample(sample.id)}
        isLoading={isLoading}
        uploadProgress={uploadProgress}
        errorMessage={errorMessage}
        uiTheme={uiTheme}
      />

      {/* Project Management Modal */}
      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={handleCloseProjectModal}
        projectMeta={projectMeta}
        viewMode={viewMode}
        onUpdateProjectMeta={(name, description, author) =>
          setProjectMeta((prev) => ({
            ...prev,
            name,
            description,
            author: author ?? prev.author,
            updatedAt: new Date().toISOString()
          }))
        }
        onExportProject={handleExportProject}
        onImportProjectFile={handleImportProjectFile}
        onNewProject={handleNewProject}
        userModels={userModels}
        activeModelId={activeModelId}
        onSelectUserModel={handleSelectUserModel}
        recordsByModel={annotationsByModel}
        measurementsByModel={measurementsByModel}
        uiTheme={uiTheme}
        onOpenUpload={() => setIsUploadOpen(true)}
        onSelectSampleModel={(sample) => loadProceduralSample(sample.id)}
        isExporting={isExporting}
        isImporting={isImporting}
        onOpenProjectOptions={handleOpenProjectOptions}
        onOpenRoleModal={() => setIsRoleModalOpen(true)}
      />

      {/* Project Options Modal (Disciplines, GIS Categories, Attribute Templates) */}
      <ProjectOptionsModal
        isOpen={isProjectOptionsModalOpen}
        onClose={() => setIsProjectOptionsModalOpen(false)}
        options={projectOptions}
        onSave={handleUpdateProjectOptions}
        uiTheme={uiTheme}
        initialTab={projectOptionsInitialTab}
      />

      {/* Launch Role Selection Modal */}
      <UserRoleSelectionModal
        isOpen={isRoleModalOpen}
        onClose={handleCloseRoleModal}
        currentMode={viewMode}
        onSelectRole={handleSelectRole}
        onOpenProjectImport={() => {
          setIsRoleModalOpen(false);
          if (!hasCompletedInitialLaunch) {
            setHasCompletedInitialLaunch(true);
          }
          setIsProjectModalOpen(true);
        }}
        projectThemes={projectThemes}
        uiTheme={uiTheme}
        audienceUser={audienceUser}
        onUpdateAudienceUser={setAudienceUser}
      />

      {/* Floating Status / Transfer Toast Notification */}
      <ToastNotification
        toast={toastNotification}
        onClose={() => setToastNotification(null)}
        uiTheme={uiTheme}
      />
    </div>
  );
}

