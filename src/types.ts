export type RenderMode = 'shaded' | 'wireframe' | 'vertice' | 'xray';

export type CameraPreset = 'isometric' | 'front' | 'back' | 'top' | 'bottom' | 'left' | 'right';

export type ProjectionMode = 'perspective' | 'orthographic';

export type LightingPreset = 'studio' | 'daylight' | 'sunset' | 'cyberpunk' | 'dramatic';

export type BackgroundStyle = 'dark' | 'studio' | 'light' | 'grid' | 'gradient';

export type AppViewMode = 'researcher' | 'audience';

export type UiTheme = 'dark' | 'light';

export type AnnotationCategory = string;

export interface ProjectAttributeTemplate {
  key: string;
  defaultValue?: string;
  description?: string;
}

export interface ProjectOptions {
  disciplines: string[];
  categories: string[];
  attributeTemplates: ProjectAttributeTemplate[];
}

export const DEFAULT_PROJECT_DISCIPLINES: string[] = [
  'Archaeology',
  'Architecture',
  'Conservation',
  'Engineering',
  'Geology',
  'Art History',
  'Environmental & Ecology',
  'Surveying & Photogrammetry',
  'General'
];

export const DEFAULT_PROJECT_CATEGORIES: string[] = [
  'Field Note',
  'Photo / Image',
  'PDF Document',
  'Structural Detail',
  'Sample Site',
  'Excavation Layer',
  'Material Analysis',
  'Conservation Intervention',
  'Survey Point',
  'Danger Zone',
  'Custom'
];

export const DEFAULT_ATTRIBUTE_TEMPLATES: ProjectAttributeTemplate[] = [
  { key: 'Surveyor', defaultValue: '', description: 'Name of surveyor / observer' },
  { key: 'Date Recorded', defaultValue: '', description: 'Date of field recording (YYYY-MM-DD)' },
  { key: 'Condition Rating', defaultValue: 'Good', description: 'Conservation status or integrity' }
];

export const DEFAULT_PROJECT_OPTIONS: ProjectOptions = {
  disciplines: DEFAULT_PROJECT_DISCIPLINES,
  categories: DEFAULT_PROJECT_CATEGORIES,
  attributeTemplates: DEFAULT_ATTRIBUTE_TEMPLATES
};

export interface SpatialGroup {
  id: string;
  name: string;
  discipline: string; // e.g., "Art History", "Geology", "Architecture", "Engineering", "Conservation", "Archeology", "General"
  description?: string;
  color: string;
  visible: boolean;
  locked?: boolean;
  createdAt: string;
  author?: string;
}

export interface SpatialAttachmentPDF {
  id: string;
  name: string;
  url: string; // Object URL, base64 data, or remote PDF link
  fileSize?: string;
  description?: string;
}

export interface SpatialAttachmentImage {
  id: string;
  caption?: string;
  url: string; // Object URL, base64 data, or remote image link
}

export interface MetadataAttribute {
  key: string;
  value: string;
}

export type SpatialMarkerGeometryType = 'point' | 'polyline' | 'polygon' | 'box' | 'submesh';

export interface SpatialComment {
  id: string;
  authorName: string;
  authorRole: string; // e.g. "Local Resident", "Epigrapher", "Historian", "Municipal Worker", "Student", "Visitor"
  text: string;
  createdAt: string;
  upvotes: number;
  downvotes: number;
  userVote?: 'up' | 'down';
}

export interface AudienceUserCredentials {
  name: string;
  role: string;
}

export const PRESET_AUDIENCE_ROLES: string[] = [
  'Local Resident',
  'Municipal Worker',
  'Epigrapher',
  'Archaeologist',
  'Historian',
  'Architect',
  'Conservationist',
  'Student / Educator',
  'Site Visitor / Tourist'
];

export type NarrationTone = 
  | 'academic'
  | 'story'
  | 'educational'
  | 'poetic'
  | 'investigative'
  | 'child-friendly'
  | 'concise';

export type NarrationKnowledgeLevel = 
  | 'general'
  | 'elementary'
  | 'enthusiast'
  | 'undergraduate'
  | 'academic';

export interface AudienceNarrationItem {
  id: string;
  title: string; // e.g. "Scholarly Structural Forensics" or "Dramatic General Story"
  text: string;
  tone: NarrationTone | string;
  knowledgeLevel: NarrationKnowledgeLevel | string;
  targetTheme?: string; // Optional focus theme (e.g. "Structural Joinery" or "General Tour")
  source?: string; // 'gemini-3.7-flash', 'curator-edited', 'local-synthesizer'
  compiledAt?: string;
  createdAt?: string;
  isDefault?: boolean;
}

export interface SpatialAnnotation {
  id: string;
  groupId?: string; // Linked Spatial Group / Discipline Layer ID
  title: string;
  category: AnnotationCategory;
  description: string; // Detailed text notes / markdown field observations
  color: string; // Pin / marker theme color hex
  geometryType?: SpatialMarkerGeometryType; // 'point', 'polyline', 'polygon', 'box', 'submesh'
  boxDimensions?: { width: number; height: number; depth: number }; // For 3D box solid volume dimensions
  position: { x: number; y: number; z: number };
  points?: Array<{ x: number; y: number; z: number }>; // For polyline/polygon multi-point boundaries
  normal?: { x: number; y: number; z: number };
  nodeId?: string; // Linked sub-mesh ID if geometryType is 'submesh'
  nodeName?: string;
  images: SpatialAttachmentImage[];
  pdfs: SpatialAttachmentPDF[];
  metadata: MetadataAttribute[];
  interpretiveThemes?: string[]; // Interpretive themes tagged to this spatial feature
  
  // Exhibition Narration Studio multi-narrations
  narrations?: AudienceNarrationItem[];
  // Theme-to-narration bindings: maps theme name to narrationId
  themeNarrationBindings?: Record<string, string>;

  // Backward compatibility fields
  audienceNarration?: string; // AI-compiled & specialist-managed narrated text for audience exhibition board
  audienceNarrationTone?: string; // e.g., 'engaging', 'educational', 'poetic', 'dramatic', 'archaeological', 'child-friendly'
  audienceNarrationSource?: string; // e.g. 'gemini-3.7-flash', 'curator-edited', 'local-synthesizer'
  audienceNarrationCompiledAt?: string; // Timestamp of AI compilation or curation
  comments?: SpatialComment[]; // Audience & community engagement comments with role badges & up/down points
  createdAt: string;
  author?: string;
}

export interface InterpretiveTheme {
  id: string;
  name: string;
  color: string;
  description: string;
  icon?: string;
}

export interface ThemeTourRoute {
  themeId: string;
  themeName: string;
  color: string;
  stops: Array<{
    stopNumber: number;
    annotationId: string;
    annotationTitle: string;
    position: { x: number; y: number; z: number };
    description: string;
    themes: string[];
    narrationText?: string;
    narrationTone?: string;
    narrationTitle?: string;
    narrationKnowledgeLevel?: string;
  }>;
  totalDistance?: number;
}

export interface ModelStats {
  name: string;
  fileSize?: string;
  format: string;
  vertexCount: number;
  triangleCount: number;
  meshCount: number;
  boundingBox: {
    x: number;
    y: number;
    z: number;
  };
  center: {
    x: number;
    y: number;
    z: number;
  };
  boundingSphereRadius?: number;
}

export interface MaterialOverride {
  color?: string;
  roughness?: number;
  metalness?: number;
  opacity?: number;
  textureUrl?: string; // Image / Data URL for Diffuse UV Texture Map
  textureName?: string;
  repeatU?: number;
  repeatV?: number;
  flipY?: boolean;
  normalMapUrl?: string;
  normalMapName?: string;
}

export interface MeshNodeInfo {
  id: string;
  name: string;
  type: string;
  vertexCount: number;
  triangleCount: number;
  visible: boolean;
  materialName?: string;
  color?: string;
  roughness?: number;
  metalness?: number;
  opacity?: number;
  children?: MeshNodeInfo[];
}

export type NavigationMode = 'orbit' | 'terrain';

export interface RenderSettings {
  mode: RenderMode;
  wireframeColor: string;
  pointSize: number;
  markerScale: number; // 0.2x to 3.0x scale multiplier for spatial pins and measurement markers
  markerOcclusionGhost?: boolean; // See-through X-Ray ghosting for spatial markers occluded behind uneven mesh surfaces
  measurementUnit?: 'm' | 'cm'; // 'm' for meters, 'cm' for centimeters
  showGrid: boolean;
  gridSize: number;
  showAxes: boolean;
  showBoundingBox: boolean;
  showShadows: boolean;
  performanceMode?: boolean; // Photogrammetry & Heavy Mesh Mode (disables heavy real-time shadows, throttles hover raycasting, caps pixel ratio)
  resolutionScale?: number; // 0.75x, 1.0x, 1.25x, 1.5x pixel ratio scaling
  doubleSidedMaterials?: boolean; // Option to force double-sided material rendering
  clippingEnabled: boolean;
  clippingAxis: 'x' | 'y' | 'z';
  clippingValue: number; // -1 to 1 normalized position
  clippingInvert: boolean;
  terrainSpeedMultiplier?: number; // 0.2x to 5.0x camera flight movement speed in terrain mode
  fov?: number; // Camera Field of View in vertical degrees (15° telephoto to 90° wide angle, default 45°)
}

export interface EnvironmentSettings {
  lighting: LightingPreset;
  lightIntensity: number;
  background: BackgroundStyle;
  bgColor: string;
  autoRotate: boolean;
  autoRotateSpeed: number;
}

export interface MeasurePoint {
  x: number;
  y: number;
  z: number;
  screenPos?: { x: number; y: number };
}

export interface Measurement {
  id: string;
  p1: MeasurePoint;
  p2: MeasurePoint;
  distance: number; // in units (e.g., meters / units)
  color?: string; // Hex color string for custom measurement styling
}

export interface AnimationClipInfo {
  index: number;
  name: string;
  duration: number;
}

export interface SampleModel {
  id: string;
  name: string;
  category: string;
  description: string;
  thumbnail: string;
  type: 'procedural' | 'url';
  proceduralType?: 'drone' | 'engine' | 'rover' | 'pavilion' | 'robot';
  url?: string;
  format: string;
}

export interface UploadedModelItem {
  id: string;
  name: string;
  fileName: string;
  category: string;
  fileSize?: string;
  type?: 'procedural' | 'uploaded' | 'url';
  proceduralType?: 'drone' | 'engine' | 'rover' | 'pavilion' | 'robot';
  fileDataUrl?: string;
  scene: any; // THREE.Object3D
  stats: ModelStats;
  hierarchy: MeshNodeInfo[];
  animations: AnimationClipInfo[];
  rawClips: any[]; // THREE.AnimationClip[]
  uploadedAt: string;
}

export interface ProjectMetadata {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  author?: string;
}

export interface ModelRecordState {
  modelId: string;
  annotations: SpatialAnnotation[];
  spatialGroups?: SpatialGroup[];
  measurements: Measurement[];
  materialOverrides?: Record<string, MaterialOverride>;
  hiddenNodeIds?: string[];
}

export interface SpatialGroupExportBundle {
  type: 'spatial-group-bundle';
  version: string;
  exportedAt: string;
  modelName?: string;
  group?: SpatialGroup;
  groups?: SpatialGroup[];
  annotations: SpatialAnnotation[];
  projectOptions?: Partial<ProjectOptions>;
}

export interface ExportedProjectFile {
  version?: string;
  project: ProjectMetadata;
  projectOptions?: ProjectOptions;
  projectThemes?: InterpretiveTheme[];
  activeModelId: string | null;
  models: Array<{
    id: string;
    name: string;
    fileName: string;
    category: string;
    fileSize?: string;
    type?: 'procedural' | 'uploaded' | 'url';
    proceduralType?: 'drone' | 'engine' | 'rover' | 'pavilion' | 'robot';
    fileDataUrl?: string;
    modelFile?: string;
    uploadedAt: string;
    uvTextures?: Array<{
      meshUuid?: string;
      meshName?: string;
      materialName?: string;
      textureType: 'map' | 'normalMap' | 'roughnessMap' | 'metalnessMap';
      dataUrl: string;
      repeatU?: number;
      repeatV?: number;
      flipY?: boolean;
    }>;
    materialOverrides?: Record<string, MaterialOverride>;
  }>;
  records: ModelRecordState[];
  renderSettings?: RenderSettings;
  envSettings?: EnvironmentSettings;
}
