import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  X,
  MapPin,
  FileText,
  Image as ImageIcon,
  FileCode,
  Plus,
  Trash2,
  Tag,
  Upload,
  Check,
  AlignLeft,
  Layers,
  Activity,
  Square,
  Box,
  Component,
  Sliders,
  RotateCcw,
  Edit2,
  Sparkles,
  Wand2,
  Bot,
  UserCheck,
  RefreshCw,
  Volume2,
  Compass,
  MessageSquare,
  Loader2,
  BookOpen,
  Info,
  GraduationCap,
  Sparkle,
  Copy,
  Layers3,
  CheckCircle2,
  SlidersHorizontal,
  FileEdit,
  Radio,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import {
  SpatialAnnotation,
  AnnotationCategory,
  SpatialMarkerGeometryType,
  SpatialAttachmentImage,
  SpatialAttachmentPDF,
  MetadataAttribute,
  MeshNodeInfo,
  UiTheme,
  SpatialGroup,
  InterpretiveTheme,
  ProjectOptions,
  AudienceNarrationItem,
  NarrationTone,
  NarrationKnowledgeLevel,
  DEFAULT_PROJECT_CATEGORIES,
  DEFAULT_ATTRIBUTE_TEMPLATES
} from '../types';

interface AnnotationEditorModalProps {
  isOpen: boolean;
  annotation: SpatialAnnotation | null;
  surfacePoint: { x: number; y: number; z: number } | null;
  initialGeometryType?: SpatialMarkerGeometryType;
  initialPoints?: Array<{ x: number; y: number; z: number }>;
  initialBoxDimensions?: { width: number; height: number; depth: number };
  initialNodeId?: string;
  initialGroupId?: string;
  meshNodes: MeshNodeInfo[];
  spatialGroups?: SpatialGroup[];
  onSave: (annotation: SpatialAnnotation) => void;
  onClose: () => void;
  onStartEditShape?: (annotation: SpatialAnnotation) => void;
  uiTheme?: UiTheme;
  projectThemes?: InterpretiveTheme[];
  projectOptions?: ProjectOptions;
  onOpenProjectOptions?: () => void;
}

const PRESET_COLORS = [
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#8b5cf6', // Violet
  '#06b6d4', // Cyan
  '#ec4899', // Pink
  '#64748b'  // Slate
];

export const AnnotationEditorModal: React.FC<AnnotationEditorModalProps> = ({
  isOpen,
  annotation,
  surfacePoint,
  initialGeometryType,
  initialPoints,
  initialBoxDimensions,
  initialNodeId,
  initialGroupId,
  meshNodes,
  spatialGroups = [],
  onSave,
  onClose,
  onStartEditShape,
  uiTheme = 'dark',
  projectThemes = [],
  projectOptions,
  onOpenProjectOptions
}) => {
  const activeThemes: InterpretiveTheme[] = projectThemes || [];

  const availableCategories = useMemo(() => {
    const list = projectOptions?.categories && projectOptions.categories.length > 0
      ? [...projectOptions.categories]
      : [...DEFAULT_PROJECT_CATEGORIES];
    if (annotation?.category && !list.includes(annotation.category)) {
      list.push(annotation.category);
    }
    return list;
  }, [projectOptions?.categories, annotation?.category]);

  const getInitialAttributes = useCallback((): MetadataAttribute[] => {
    if (projectOptions?.attributeTemplates && projectOptions.attributeTemplates.length > 0) {
      return projectOptions.attributeTemplates.map((t) => ({
        key: t.key,
        value: t.defaultValue || (t.key.toLowerCase().includes('date') ? new Date().toISOString().split('T')[0] : '')
      }));
    }
    return [
      { key: 'Surveyor', value: '' },
      { key: 'Date Recorded', value: new Date().toISOString().split('T')[0] }
    ];
  }, [projectOptions?.attributeTemplates]);

  const isEditing = !!annotation;
  const isLight = uiTheme === 'light';

  // Form State
  const [geometryType, setGeometryType] = useState<SpatialMarkerGeometryType>(
    annotation?.geometryType || initialGeometryType || 'point'
  );

  const [boxDimensions, setBoxDimensions] = useState<{ width: number; height: number; depth: number }>(
    annotation?.boxDimensions || initialBoxDimensions || { width: 1.0, height: 1.0, depth: 1.0 }
  );

  const [selectedGroupId, setSelectedGroupId] = useState<string>(
    annotation?.groupId || initialGroupId || (spatialGroups.length > 0 ? spatialGroups[0].id : '')
  );

  const [title, setTitle] = useState(
    annotation?.title ||
      (geometryType === 'polyline'
        ? '3D Path Line'
        : geometryType === 'polygon'
        ? '3D Shape Zone'
        : geometryType === 'box'
        ? '3D Solid Box Volume'
        : geometryType === 'submesh'
        ? 'Sub-Mesh Highlight'
        : 'New Spatial Record')
  );

  const [category, setCategory] = useState<AnnotationCategory>(
    annotation?.category || availableCategories[0] || 'Field Note'
  );
  const [description, setDescription] = useState(annotation?.description || '');
  const [color, setColor] = useState(annotation?.color || '#3b82f6');
  
  const [position, setPosition] = useState({
    x: annotation?.position.x ?? surfacePoint?.x ?? 0,
    y: annotation?.position.y ?? surfacePoint?.y ?? 0,
    z: annotation?.position.z ?? surfacePoint?.z ?? 0
  });

  const [points, setPoints] = useState<Array<{ x: number; y: number; z: number }>>(
    annotation?.points || initialPoints || (surfacePoint ? [surfacePoint] : [{ x: 0, y: 0, z: 0 }])
  );

  const [selectedNodeId, setSelectedNodeId] = useState<string | undefined>(
    annotation?.nodeId || initialNodeId
  );

  // Attachments State
  const [images, setImages] = useState<SpatialAttachmentImage[]>(annotation?.images || []);
  const [pdfs, setPdfs] = useState<SpatialAttachmentPDF[]>(annotation?.pdfs || []);
  const [metadata, setMetadata] = useState<MetadataAttribute[]>(
    annotation?.metadata || getInitialAttributes()
  );

  // Interpretive Themes State
  const [interpretiveThemes, setInterpretiveThemes] = useState<string[]>(
    annotation?.interpretiveThemes || []
  );
  const [customThemeInput, setCustomThemeInput] = useState('');

  // Exhibition Narration Studio State (Multi-narrations & Thematic Bindings)
  const [narrations, setNarrations] = useState<AudienceNarrationItem[]>(
    annotation?.narrations || []
  );
  const [themeNarrationBindings, setThemeNarrationBindings] = useState<Record<string, string>>(
    annotation?.themeNarrationBindings || {}
  );
  const [activeNarrationId, setActiveNarrationId] = useState<string | null>(null);

  // Studio Interactive Deck Configuration Options
  const [studioTone, setStudioTone] = useState<NarrationTone>('story');
  const [studioKnowledgeLevel, setStudioKnowledgeLevel] = useState<NarrationKnowledgeLevel>('general');
  const [studioTargetTheme, setStudioTargetTheme] = useState<string>('');
  const [studioCustomInstruction, setStudioCustomInstruction] = useState<string>('');
  const [isCompilingNarration, setIsCompilingNarration] = useState<boolean>(false);
  const [compileStatusMessage, setCompileStatusMessage] = useState<string | null>(null);
  const [isNarrationStudioExpanded, setIsNarrationStudioExpanded] = useState<boolean>(
    (annotation?.narrations && annotation.narrations.length > 0) || Boolean(annotation?.audienceNarration) || false
  );

  const toggleInterpretiveTheme = (themeName: string) => {
    setInterpretiveThemes((prev) =>
      prev.includes(themeName) ? prev.filter((t) => t !== themeName) : [...prev, themeName]
    );
  };

  const handleAddCustomTheme = () => {
    const trimmed = customThemeInput.trim();
    if (!trimmed) return;
    if (!interpretiveThemes.includes(trimmed)) {
      setInterpretiveThemes((prev) => [...prev, trimmed]);
    }
    setCustomThemeInput('');
  };

  // Helper to extract or initialize default narrations array
  const initializeNarrationsList = useCallback((targetAnno: SpatialAnnotation | null): AudienceNarrationItem[] => {
    if (targetAnno?.narrations && targetAnno.narrations.length > 0) {
      return [...targetAnno.narrations];
    }
    if (targetAnno?.audienceNarration && targetAnno.audienceNarration.trim()) {
      return [
        {
          id: 'narr_initial_1',
          title: 'Curatorial Overview Narrative',
          text: targetAnno.audienceNarration.trim(),
          tone: (targetAnno.audienceNarrationTone as NarrationTone) || 'story',
          knowledgeLevel: 'general',
          source: targetAnno.audienceNarrationSource || 'curator-edited',
          compiledAt: targetAnno.audienceNarrationCompiledAt || new Date().toISOString(),
          isDefault: true
        }
      ];
    }
    return [];
  }, []);

  // Reset form to clean default state for a new spatial record
  const resetFormToDefaults = useCallback(() => {
    const defaultGeom = initialGeometryType || 'point';
    setGeometryType(defaultGeom);
    setBoxDimensions(initialBoxDimensions || { width: 1.0, height: 1.0, depth: 1.0 });
    const targetGid = initialGroupId || (spatialGroups.length > 0 ? spatialGroups[0].id : '');
    setSelectedGroupId(targetGid);
    const matchedGrp = spatialGroups.find((g) => g.id === targetGid);
    if (matchedGrp) {
      setColor(matchedGrp.color);
    } else {
      setColor('#3b82f6');
    }
    setCategory(availableCategories[0] || 'Field Note');
    setTitle(
      defaultGeom === 'polyline'
        ? '3D Linear Profile / Crack Line'
        : defaultGeom === 'polygon'
        ? '3D Surface Zone Area'
        : defaultGeom === 'box'
        ? '3D Solid Box Volume'
        : defaultGeom === 'submesh'
        ? 'Sub-Mesh Component Record'
        : '3D Spatial Pin Marker'
    );
    setDescription('');
    const pX = surfacePoint ? Math.round(surfacePoint.x * 1000) / 1000 : 0;
    const pY = surfacePoint ? Math.round(surfacePoint.y * 1000) / 1000 : 0;
    const pZ = surfacePoint ? Math.round(surfacePoint.z * 1000) / 1000 : 0;
    setPosition({ x: pX, y: pY, z: pZ });
    setPoints(
      initialPoints && initialPoints.length > 0
        ? initialPoints.map((p) => ({
            x: Math.round(p.x * 1000) / 1000,
            y: Math.round(p.y * 1000) / 1000,
            z: Math.round(p.z * 1000) / 1000
          }))
        : surfacePoint
        ? [{ x: pX, y: pY, z: pZ }]
        : [{ x: 0, y: 0, z: 0 }]
    );
    setSelectedNodeId(initialNodeId);
    setImages([]);
    setPdfs([]);
    setMetadata(getInitialAttributes());
    setInterpretiveThemes([]);
    setNarrations([]);
    setThemeNarrationBindings({});
    setActiveNarrationId(null);
    setStudioTone('story');
    setStudioKnowledgeLevel('general');
    setStudioTargetTheme('');
    setStudioCustomInstruction('');
    setIsCompilingNarration(false);
    setCompileStatusMessage(null);
    setImageUrlInput('');
    setImageCaptionInput('');
    setPdfNameInput('');
    setPdfUrlInput('');
    setPdfDescInput('');
    setCustomThemeInput('');
  }, [
    initialGeometryType,
    initialBoxDimensions,
    initialGroupId,
    spatialGroups,
    availableCategories,
    surfacePoint,
    initialPoints,
    initialNodeId,
    getInitialAttributes
  ]);

  // Sync state on modal open
  useEffect(() => {
    if (!isOpen) return;

    if (annotation) {
      setGeometryType(annotation.geometryType || 'point');
      setBoxDimensions(annotation.boxDimensions || { width: 1.0, height: 1.0, depth: 1.0 });
      setSelectedGroupId(annotation.groupId || (spatialGroups.length > 0 ? spatialGroups[0].id : ''));
      setTitle(annotation.title);
      setCategory(annotation.category);
      setDescription(annotation.description || '');
      setColor(annotation.color || '#3b82f6');
      setPosition({
        x: Math.round((annotation.position?.x ?? 0) * 1000) / 1000,
        y: Math.round((annotation.position?.y ?? 0) * 1000) / 1000,
        z: Math.round((annotation.position?.z ?? 0) * 1000) / 1000
      });
      setPoints(
        annotation.points && annotation.points.length > 0
          ? annotation.points.map((p) => ({
              x: Math.round(p.x * 1000) / 1000,
              y: Math.round(p.y * 1000) / 1000,
              z: Math.round(p.z * 1000) / 1000
            }))
          : [annotation.position]
      );
      setSelectedNodeId(annotation.nodeId);
      setImages(annotation.images || []);
      setPdfs(annotation.pdfs || []);
      setMetadata(annotation.metadata && annotation.metadata.length > 0 ? annotation.metadata : getInitialAttributes());
      setInterpretiveThemes(annotation.interpretiveThemes || []);

      const initialNarrations = initializeNarrationsList(annotation);
      setNarrations(initialNarrations);
      setThemeNarrationBindings(annotation.themeNarrationBindings || {});
      setActiveNarrationId(initialNarrations.length > 0 ? initialNarrations[0].id : null);
      
      setStudioTone((annotation.audienceNarrationTone as NarrationTone) || 'story');
      setStudioKnowledgeLevel('general');
      setStudioTargetTheme(annotation.interpretiveThemes?.[0] || '');
      setStudioCustomInstruction('');
      setIsCompilingNarration(false);
      setCompileStatusMessage(null);
      setImageUrlInput('');
      setImageCaptionInput('');
      setPdfNameInput('');
      setPdfUrlInput('');
      setPdfDescInput('');
      setCustomThemeInput('');
    } else {
      resetFormToDefaults();
    }
  }, [
    isOpen,
    annotation,
    resetFormToDefaults,
    spatialGroups,
    getInitialAttributes,
    initializeNarrationsList
  ]);

  // New Image Input State
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [imageCaptionInput, setImageCaptionInput] = useState('');

  // New PDF Input State
  const [pdfNameInput, setPdfNameInput] = useState('');
  const [pdfUrlInput, setPdfUrlInput] = useState('');
  const [pdfDescInput, setPdfDescInput] = useState('');

  // Local file upload handlers
  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    (Array.from(files) as File[]).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const newImg: SpatialAttachmentImage = {
            id: 'img_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
            caption: file.name,
            url: event.target.result as string
          };
          setImages((prev) => [...prev, newImg]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handlePdfFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    (Array.from(files) as File[]).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const newPdf: SpatialAttachmentPDF = {
            id: 'pdf_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
            name: file.name,
            url: event.target.result as string,
            fileSize: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
            description: 'Attached research document'
          };
          setPdfs((prev) => [...prev, newPdf]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleAddImageUrl = () => {
    if (!imageUrlInput.trim()) return;
    const newImg: SpatialAttachmentImage = {
      id: 'img_' + Date.now(),
      caption: imageCaptionInput.trim() || 'Attached Image',
      url: imageUrlInput.trim()
    };
    setImages((prev) => [...prev, newImg]);
    setImageUrlInput('');
    setImageCaptionInput('');
  };

  const handleAddPdfUrl = () => {
    if (!pdfUrlInput.trim()) return;
    const newPdf: SpatialAttachmentPDF = {
      id: 'pdf_' + Date.now(),
      name: pdfNameInput.trim() || 'Research_Document.pdf',
      url: pdfUrlInput.trim(),
      fileSize: 'External Link',
      description: pdfDescInput.trim() || 'Attached PDF Document'
    };
    setPdfs((prev) => [...prev, newPdf]);
    setPdfNameInput('');
    setPdfUrlInput('');
    setPdfDescInput('');
  };

  // Metadata key-value handlers
  const handleAddMetadataRow = () => {
    setMetadata((prev) => [...prev, { key: '', value: '' }]);
  };

  const handleUpdateMetadata = (index: number, field: 'key' | 'value', val: string) => {
    setMetadata((prev) => {
      const updated = [...prev];
      updated[index][field] = val;
      return updated;
    });
  };

  const handleRemoveMetadata = (index: number) => {
    setMetadata((prev) => prev.filter((_, i) => i !== index));
  };

  // Multi-point handlers for polyline/polygon
  const handleUpdatePoint = (index: number, axis: 'x' | 'y' | 'z', val: number) => {
    setPoints((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [axis]: val };
      return updated;
    });
  };

  const handleAddPointRow = () => {
    const lastP = points[points.length - 1] || position;
    setPoints((prev) => [...prev, { x: lastP.x + 0.2, y: lastP.y, z: lastP.z + 0.2 }]);
  };

  const handleRemovePointRow = (index: number) => {
    if (points.length <= 1) return;
    setPoints((prev) => prev.filter((_, i) => i !== index));
  };

  // Compile for Audience Narration Studio AI Handler
  const handleCompileStudioNarration = async () => {
    if (isCompilingNarration) return;

    setIsCompilingNarration(true);
    setCompileStatusMessage(null);

    const selectedGroup = spatialGroups.find((g) => g.id === selectedGroupId);

    try {
      const response = await fetch('/api/compile-audience-narration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim() || 'Spatial Record',
          category,
          discipline: selectedGroup?.discipline || selectedGroup?.name,
          description: description.trim(),
          metadata: metadata.filter((m) => m.key.trim() !== ''),
          interpretiveThemes,
          tone: studioTone,
          knowledgeLevel: studioKnowledgeLevel,
          targetTheme: studioTargetTheme || undefined,
          customInstruction: studioCustomInstruction.trim() || undefined,
          geometryType
        })
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const data = await response.json();
      if (data.narration) {
        const toneLabel = studioTone.charAt(0).toUpperCase() + studioTone.slice(1);
        const levelLabel = studioKnowledgeLevel.charAt(0).toUpperCase() + studioKnowledgeLevel.slice(1);
        const generatedTitle = studioTargetTheme
          ? `${studioTargetTheme}: ${toneLabel} (${levelLabel})`
          : `${toneLabel} Narrative (${levelLabel})`;

        const newNarrationItem: AudienceNarrationItem = {
          id: 'narr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
          title: generatedTitle,
          text: data.narration,
          tone: studioTone,
          knowledgeLevel: studioKnowledgeLevel,
          targetTheme: studioTargetTheme || undefined,
          source: data.source || 'gemini-3.7-flash',
          compiledAt: new Date().toISOString(),
          isDefault: narrations.length === 0
        };

        setNarrations((prev) => [...prev, newNarrationItem]);
        setActiveNarrationId(newNarrationItem.id);

        // If target theme is set and selected, automatically bind it if not bound yet
        if (studioTargetTheme && interpretiveThemes.includes(studioTargetTheme)) {
          setThemeNarrationBindings((prev) => ({
            ...prev,
            [studioTargetTheme]: newNarrationItem.id
          }));
        }

        setCompileStatusMessage(
          data.source === 'gemini-3.7-flash'
            ? `Generated new "${toneLabel}" studio narrative with Gemini AI!`
            : `Generated new "${toneLabel}" exhibition narrative!`
        );
      }
    } catch (err: any) {
      console.error('Failed to compile audience narration:', err);
      // Fallback local synthesis
      const toneLabel = studioTone.charAt(0).toUpperCase() + studioTone.slice(1);
      const levelLabel = studioKnowledgeLevel.charAt(0).toUpperCase() + studioKnowledgeLevel.slice(1);
      const validMeta = metadata.filter((m) => m.key && m.value);
      const facts = validMeta.map((m) => `${m.key}: ${m.value}`).join(', ');
      
      let synthesisLead = `Welcome to **${title.trim() || 'this exhibit location'}**.`;
      if (studioTone === 'academic') {
        synthesisLead = `Diagnostic assessment of **${title.trim() || 'this feature'}** exhibits notable architectural and material attributes.`;
      } else if (studioTone === 'story') {
        synthesisLead = `Step closer to discover the storied past etched into **${title.trim() || 'this feature'}**.`;
      } else if (studioTone === 'poetic') {
        synthesisLead = `Here, at **${title.trim() || 'this sacred threshold'}**, history whispers through enduring stone and craft.`;
      } else if (studioTone === 'child-friendly') {
        synthesisLead = `Look closely at **${title.trim() || 'this cool spot'}**! Can you spot the special details?`;
      }

      const fallbackText = `${synthesisLead}\n\n${description.trim() ? `${description.trim()}\n\n` : ''}${facts ? `Key recorded measurements: ${facts}.` : 'This spatial record highlights essential historical and structural details for site visitors.'}`;
      
      const newNarrationItem: AudienceNarrationItem = {
        id: 'narr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        title: studioTargetTheme
          ? `${studioTargetTheme}: ${toneLabel} (${levelLabel})`
          : `${toneLabel} Draft Narrative`,
        text: fallbackText,
        tone: studioTone,
        knowledgeLevel: studioKnowledgeLevel,
        targetTheme: studioTargetTheme || undefined,
        source: 'local-curator-synthesis',
        compiledAt: new Date().toISOString(),
        isDefault: narrations.length === 0
      };

      setNarrations((prev) => [...prev, newNarrationItem]);
      setActiveNarrationId(newNarrationItem.id);
      if (studioTargetTheme && interpretiveThemes.includes(studioTargetTheme)) {
        setThemeNarrationBindings((prev) => ({
          ...prev,
          [studioTargetTheme]: newNarrationItem.id
        }));
      }
      setCompileStatusMessage(`Created local "${toneLabel}" draft narrative. You can edit this text freely.`);
    } finally {
      setIsCompilingNarration(false);
    }
  };

  // Create a blank draft narrative for curator authoring from scratch
  const handleCreateBlankDraft = () => {
    const toneLabel = studioTone.charAt(0).toUpperCase() + studioTone.slice(1);
    const newDraft: AudienceNarrationItem = {
      id: 'narr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      title: studioTargetTheme ? `${studioTargetTheme}: Curator Draft` : `Custom Curatorial Draft`,
      text: '',
      tone: studioTone,
      knowledgeLevel: studioKnowledgeLevel,
      targetTheme: studioTargetTheme || undefined,
      source: 'specialist-authored',
      compiledAt: new Date().toISOString(),
      isDefault: narrations.length === 0
    };
    setNarrations((prev) => [...prev, newDraft]);
    setActiveNarrationId(newDraft.id);
    setCompileStatusMessage('Created new draft in Studio. Type your custom text below.');
  };

  // Update fields of the currently active narration
  const handleUpdateActiveNarration = (updates: Partial<AudienceNarrationItem>) => {
    if (!activeNarrationId) return;
    setNarrations((prev) =>
      prev.map((n) => (n.id === activeNarrationId ? { ...n, ...updates, source: 'curator-edited' } : n))
    );
  };

  // Delete a specific narration
  const handleDeleteNarration = (id: string) => {
    setNarrations((prev) => {
      const remaining = prev.filter((n) => n.id !== id);
      if (activeNarrationId === id) {
        setActiveNarrationId(remaining.length > 0 ? remaining[0].id : null);
      }
      return remaining;
    });
    // Clean up theme bindings pointing to this narration
    setThemeNarrationBindings((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((k) => {
        if (next[k] === id) {
          delete next[k];
        }
      });
      return next;
    });
  };

  // Set default narration for general / unthemed views
  const handleSetDefaultNarration = (id: string) => {
    setNarrations((prev) =>
      prev.map((n) => ({
        ...n,
        isDefault: n.id === id
      }))
    );
  };

  // Bind a specific narration to an interpretive theme
  const handleSetThemeNarrationBinding = (themeName: string, narrationId: string) => {
    setThemeNarrationBindings((prev) => {
      const next = { ...prev };
      if (!narrationId) {
        delete next[themeName];
      } else {
        next[themeName] = narrationId;
      }
      return next;
    });
  };

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const selectedNode = meshNodes.find((n) => n.id === selectedNodeId);

    // Calculate primary position anchor
    let anchorPos = position;
    if (geometryType !== 'box' && geometryType !== 'point' && points.length > 0) {
      const avgX = points.reduce((acc, p) => acc + p.x, 0) / points.length;
      const avgY = points.reduce((acc, p) => acc + p.y, 0) / points.length;
      const avgZ = points.reduce((acc, p) => acc + p.z, 0) / points.length;
      anchorPos = { x: avgX, y: avgY, z: avgZ };
    }

    // Determine primary/default narration for backward compatibility
    const defaultNarrationItem =
      narrations.find((n) => n.isDefault) || (narrations.length > 0 ? narrations[0] : null);

    const savedAnnotation: SpatialAnnotation = {
      id: annotation?.id || 'anno_' + Date.now(),
      groupId: selectedGroupId || undefined,
      title: title.trim() || 'Untitled Spatial Record',
      category,
      geometryType,
      boxDimensions: geometryType === 'box' ? {
        width: Math.round((boxDimensions.width || 1.0) * 1000) / 1000,
        height: Math.round((boxDimensions.height || 1.0) * 1000) / 1000,
        depth: Math.round((boxDimensions.depth || 1.0) * 1000) / 1000,
      } : undefined,
      description: description.trim(),
      color,
      position: {
        x: Math.round(anchorPos.x * 1000) / 1000,
        y: Math.round(anchorPos.y * 1000) / 1000,
        z: Math.round(anchorPos.z * 1000) / 1000
      },
      points: points.map((p) => ({
        x: Math.round(p.x * 1000) / 1000,
        y: Math.round(p.y * 1000) / 1000,
        z: Math.round(p.z * 1000) / 1000
      })),
      nodeId: selectedNodeId,
      nodeName: selectedNode?.name,
      images,
      pdfs,
      metadata: metadata.filter((m) => m.key.trim() !== ''),
      interpretiveThemes: interpretiveThemes || [],
      // Studio multi-narrations & theme bindings
      narrations: narrations.filter((n) => n.text.trim() !== ''),
      themeNarrationBindings,
      // Backward compatibility fields
      audienceNarration: defaultNarrationItem?.text.trim() || undefined,
      audienceNarrationTone: defaultNarrationItem?.tone || studioTone,
      audienceNarrationSource: defaultNarrationItem?.source || (defaultNarrationItem?.text.trim() ? 'specialist-authored' : undefined),
      audienceNarrationCompiledAt: defaultNarrationItem?.compiledAt || (defaultNarrationItem?.text.trim() ? new Date().toISOString() : undefined),
      comments: annotation?.comments,
      createdAt: annotation?.createdAt || new Date().toISOString().split('T')[0],
      author: annotation?.author || 'Researcher'
    };

    onSave(savedAnnotation);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className={`border rounded-3xl p-6 max-w-2xl w-full shadow-2xl relative my-8 max-h-[90vh] flex flex-col transition-colors ${
        isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#0C0C0E] border-zinc-800 text-zinc-200'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between pb-4 border-b shrink-0 ${
          isLight ? 'border-slate-200' : 'border-zinc-800'
        }`}>
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold shadow-md"
              style={{ backgroundColor: color }}
            >
              {geometryType === 'polyline' ? (
                <Activity className="w-4 h-4" />
              ) : geometryType === 'polygon' ? (
                <Square className="w-4 h-4" />
              ) : geometryType === 'submesh' ? (
                <Component className="w-4 h-4" />
              ) : (
                <MapPin className="w-4 h-4" />
              )}
            </div>
            <div>
              <h2 className={`text-lg font-bold leading-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {isEditing ? 'Edit 3D GIS Spatial Record' : 'New 3D GIS Spatial Record'}
              </h2>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                Attach research notes, photos, and PDF documents to 3D surface points, lines, shapes, or sub-meshes.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isEditing && (
              <button
                type="button"
                onClick={resetFormToDefaults}
                className={`px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-colors ${
                  isLight
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-300'
                    : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-zinc-700'
                }`}
                title="Reset all form inputs, notes, and attachments to blank defaults"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
            <button
              onClick={onClose}
              className={`p-1.5 rounded-full transition-colors ${
                isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900' : 'bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="space-y-5 py-4 overflow-y-auto flex-1 pr-1 text-xs">
          {/* Spatial Geometry Marker Type Selector */}
          <div>
            <label className={`block text-xs font-semibold mb-2 ${isLight ? 'text-slate-700' : 'text-zinc-300'}`}>
              Spatial Marker Geometry Type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              <button
                type="button"
                onClick={() => setGeometryType('point')}
                className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border text-center transition-all ${
                  geometryType === 'point'
                    ? isLight
                      ? 'bg-blue-600/15 border-blue-500 text-blue-700 font-bold shadow-sm'
                      : 'bg-blue-600/20 border-blue-500 text-blue-300 font-semibold shadow-md'
                    : isLight
                    ? 'bg-slate-100 border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-200/80'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <MapPin className="w-4 h-4 text-blue-500" />
                <span className="text-[10px] leading-tight">Point Pin</span>
              </button>

              <button
                type="button"
                onClick={() => setGeometryType('polyline')}
                className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border text-center transition-all ${
                  geometryType === 'polyline'
                    ? isLight
                      ? 'bg-blue-600/15 border-blue-500 text-blue-700 font-bold shadow-sm'
                      : 'bg-blue-600/20 border-blue-500 text-blue-300 font-semibold shadow-md'
                    : isLight
                    ? 'bg-slate-100 border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-200/80'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <Activity className="w-4 h-4 text-amber-500" />
                <span className="text-[10px] leading-tight">3D Polyline</span>
              </button>

              <button
                type="button"
                onClick={() => setGeometryType('polygon')}
                className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border text-center transition-all ${
                  geometryType === 'polygon'
                    ? isLight
                      ? 'bg-blue-600/15 border-blue-500 text-blue-700 font-bold shadow-sm'
                      : 'bg-blue-600/20 border-blue-500 text-blue-300 font-semibold shadow-md'
                    : isLight
                    ? 'bg-slate-100 border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-200/80'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <Square className="w-4 h-4 text-emerald-500" />
                <span className="text-[10px] leading-tight">3D Polygon</span>
              </button>

              <button
                type="button"
                onClick={() => setGeometryType('box')}
                className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border text-center transition-all ${
                  geometryType === 'box'
                    ? isLight
                      ? 'bg-blue-600/15 border-blue-500 text-blue-700 font-bold shadow-sm'
                      : 'bg-blue-600/20 border-blue-500 text-blue-300 font-semibold shadow-md'
                    : isLight
                    ? 'bg-slate-100 border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-200/80'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <Box className="w-4 h-4 text-cyan-500" />
                <span className="text-[10px] leading-tight">3D Box Solid</span>
              </button>

              <button
                type="button"
                onClick={() => setGeometryType('submesh')}
                className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border text-center transition-all ${
                  geometryType === 'submesh'
                    ? isLight
                      ? 'bg-blue-600/15 border-blue-500 text-blue-700 font-bold shadow-sm'
                      : 'bg-blue-600/20 border-blue-500 text-blue-300 font-semibold shadow-md'
                    : isLight
                    ? 'bg-slate-100 border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-200/80'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <Component className="w-4 h-4 text-purple-500" />
                <span className="text-[10px] leading-tight">Sub-Mesh</span>
              </button>
            </div>
          </div>

          {/* Title & Category Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={`block font-medium mb-1 ${isLight ? 'text-slate-700 font-semibold' : 'text-zinc-300'}`}>Feature Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Roof Crack Line or Canopy Cantilever"
                className={`w-full rounded-xl px-3 py-2 focus:border-blue-500 focus:outline-none transition-colors ${
                  isLight
                    ? 'bg-slate-50 border border-slate-300 text-slate-900 focus:bg-white'
                    : 'bg-zinc-900 border border-zinc-800 text-white'
                }`}
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className={`block font-medium ${isLight ? 'text-slate-700 font-semibold' : 'text-zinc-300'}`}>GIS Category</label>
                {onOpenProjectOptions && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenProjectOptions();
                    }}
                    className="text-[10px] text-blue-500 hover:underline flex items-center gap-1 font-medium"
                    title="Configure project categories list in Project Options"
                  >
                    <Sliders className="w-2.5 h-2.5" /> Manage
                  </button>
                )}
              </div>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as AnnotationCategory)}
                className={`w-full rounded-xl px-3 py-2 focus:border-blue-500 focus:outline-none transition-colors ${
                  isLight
                    ? 'bg-slate-50 border border-slate-300 text-slate-900 focus:bg-white'
                    : 'bg-zinc-900 border border-zinc-800 text-white'
                }`}
              >
                {availableCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Discipline Group / Layer Selector */}
          <div>
            <label className={`block font-medium mb-1 flex items-center justify-between ${isLight ? 'text-slate-700 font-semibold' : 'text-zinc-300'}`}>
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-purple-500" />
                Spatial Discipline Group / Layer
              </span>
              {selectedGroupId && (
                <span
                  className="w-2.5 h-2.5 rounded-full inline-block shadow-sm"
                  style={{ backgroundColor: spatialGroups.find(g => g.id === selectedGroupId)?.color || color }}
                />
              )}
            </label>
            <select
              value={selectedGroupId}
              onChange={(e) => {
                const gid = e.target.value;
                setSelectedGroupId(gid);
                const matchedGrp = spatialGroups.find(g => g.id === gid);
                if (matchedGrp) {
                  setColor(matchedGrp.color);
                }
              }}
              className={`w-full rounded-xl px-3 py-2 focus:border-blue-500 focus:outline-none transition-colors ${
                isLight
                  ? 'bg-slate-50 border border-slate-300 text-slate-900 focus:bg-white'
                  : 'bg-zinc-900 border border-zinc-800 text-white'
              }`}
            >
              <option value="">-- General / Ungrouped Layer --</option>
              {spatialGroups.map((grp) => (
                <option key={grp.id} value={grp.id}>
                  {grp.name} ({grp.discipline})
                </option>
              ))}
            </select>
          </div>

          {/* Interpretive Themes Section */}
          <div className={`p-4 border rounded-2xl space-y-3 transition-colors ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-zinc-900/60 border-zinc-800'
          }`}>
            <label className={`block font-semibold text-xs flex items-center justify-between ${
              isLight ? 'text-slate-800' : 'text-zinc-200'
            }`}>
              <span className="flex items-center gap-1.5">
                <Tag className="w-4 h-4 text-amber-500" />
                Interpretive Themes Tagging
              </span>
              <span className="text-[11px] text-zinc-400 font-normal">
                Tag features for auto-generated Virtual Tours
              </span>
            </label>

            {/* Theme Preset Badges */}
            <div className="flex flex-wrap gap-2">
              {activeThemes.map((theme) => {
                const isSelected = interpretiveThemes.includes(theme.name);
                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => toggleInterpretiveTheme(theme.name)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 border ${
                      isSelected
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
                        : isLight
                        ? 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                        : 'bg-zinc-800/60 border-zinc-700 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full inline-block"
                      style={{ backgroundColor: theme.color }}
                    />
                    {theme.name}
                    {isSelected && <Check className="w-3.5 h-3.5 text-amber-400" />}
                  </button>
                );
              })}

              {/* Custom Themes already added */}
              {interpretiveThemes
                .filter((t) => !activeThemes.some((p) => p.name === t))
                .map((customT) => (
                  <button
                    key={customT}
                    type="button"
                    onClick={() => toggleInterpretiveTheme(customT)}
                    className="px-3 py-1.5 rounded-xl text-xs font-medium bg-purple-500/20 text-purple-300 border border-purple-500/50 flex items-center gap-1.5"
                  >
                    <Tag className="w-3 h-3 text-purple-400" />
                    {customT}
                    <X className="w-3 h-3 text-purple-400" />
                  </button>
                ))}
            </div>

            {/* Custom Theme Tag Input */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={customThemeInput}
                onChange={(e) => setCustomThemeInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomTheme();
                  }
                }}
                placeholder="Add custom interpretive theme..."
                className={`flex-1 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-amber-500 transition-colors ${
                  isLight
                    ? 'bg-white border border-slate-300 text-slate-900'
                    : 'bg-zinc-950 border border-zinc-800 text-white'
                }`}
              />
              <button
                type="button"
                onClick={handleAddCustomTheme}
                className="px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-semibold hover:bg-amber-500/30 transition-colors flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Tag
              </button>
            </div>
          </div>

          {/* Sub-Mesh Target Selector (When geometryType === 'submesh') */}
          {geometryType === 'submesh' && (
            <div className={`p-3 border rounded-2xl space-y-2 transition-colors ${
              isLight ? 'bg-blue-50/80 border-blue-200' : 'bg-blue-950/20 border-blue-500/30'
            }`}>
              <label className={`block text-xs font-semibold flex items-center gap-1.5 ${
                isLight ? 'text-blue-800' : 'text-blue-300'
              }`}>
                <Component className="w-4 h-4" />
                Target Sub-Mesh Component of 3D Model
              </label>
              <select
                value={selectedNodeId || ''}
                onChange={(e) => setSelectedNodeId(e.target.value || undefined)}
                className={`w-full rounded-xl px-3 py-2 focus:border-blue-500 focus:outline-none text-xs transition-colors ${
                  isLight
                    ? 'bg-white border border-slate-300 text-slate-900'
                    : 'bg-zinc-900 border border-zinc-700 text-white'
                }`}
              >
                <option value="">-- Select Model Mesh Part --</option>
                {meshNodes.map((node) => (
                  <option key={node.id} value={node.id}>
                    {node.name} ({node.triangleCount.toLocaleString()} △ faces)
                  </option>
                ))}
              </select>
              <p className={`text-[11px] ${isLight ? 'text-slate-600' : 'text-zinc-400'}`}>
                Selecting a sub-mesh component highlights that specific part of the photogrammetry model in 3D.
              </p>
            </div>
          )}

          {/* 3D Box Solid Dimensions & Spatial Placement */}
          {geometryType === 'box' && (
            <div className={`p-4 border rounded-2xl space-y-4 transition-colors ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-zinc-900/80 border-zinc-800'
            }`}>
              <div className="flex items-center justify-between">
                <label className={`text-xs font-semibold flex items-center gap-1.5 ${
                  isLight ? 'text-slate-800' : 'text-zinc-200'
                }`}>
                  <Box className="w-4 h-4 text-cyan-500" />
                  3D Box Solid Volume & Dimensions
                </label>
                {annotation && onStartEditShape && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onStartEditShape(annotation);
                    }}
                    className="px-2.5 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-600 dark:text-cyan-400 border border-cyan-500/40 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors"
                    title="Interactively edit and resize box in the 3D viewport"
                  >
                    <Box className="w-3 h-3" />
                    <span>Edit in 3D View</span>
                  </button>
                )}
              </div>

              {/* Quick Dimension Presets */}
              <div>
                <span className={`text-[10px] font-semibold block mb-1.5 ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                  Quick Size Presets:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: '0.5m Cube', w: 0.5, h: 0.5, d: 0.5 },
                    { label: '1.0m Std Cube', w: 1.0, h: 1.0, d: 1.0 },
                    { label: '2.0m Box', w: 2.0, h: 1.5, d: 2.0 },
                    { label: '3.0m Zone', w: 3.0, h: 2.0, d: 3.0 },
                    { label: '5.0m Section', w: 5.0, h: 3.0, d: 5.0 },
                    { label: '10.0m Sector', w: 10.0, h: 4.0, d: 10.0 }
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setBoxDimensions({ width: preset.w, height: preset.h, depth: preset.d })}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-medium border transition-colors ${
                        boxDimensions.width === preset.w && boxDimensions.height === preset.h && boxDimensions.depth === preset.d
                          ? 'bg-cyan-500/20 border-cyan-500 text-cyan-700 dark:text-cyan-300 font-bold'
                          : isLight
                          ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                          : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dimension Numeric Inputs */}
              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className={`text-[10px] font-bold ${isLight ? 'text-slate-600' : 'text-zinc-400'}`}>
                      Width (X) [m]
                    </label>
                  </div>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step="any"
                      min="0.01"
                      max="1000"
                      value={boxDimensions.width}
                      onChange={(e) => setBoxDimensions((prev) => ({ ...prev, width: Math.max(0.01, parseFloat(e.target.value) || 0.1) }))}
                      className={`w-full rounded-xl px-2.5 py-1.5 text-xs focus:border-cyan-500 focus:outline-none ${
                        isLight ? 'bg-white border border-slate-300 text-slate-900' : 'bg-zinc-900 border border-zinc-700 text-white'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className={`text-[10px] font-bold ${isLight ? 'text-slate-600' : 'text-zinc-400'}`}>
                      Height (Y) [m]
                    </label>
                  </div>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step="any"
                      min="0.01"
                      max="1000"
                      value={boxDimensions.height}
                      onChange={(e) => setBoxDimensions((prev) => ({ ...prev, height: Math.max(0.01, parseFloat(e.target.value) || 0.1) }))}
                      className={`w-full rounded-xl px-2.5 py-1.5 text-xs focus:border-cyan-500 focus:outline-none ${
                        isLight ? 'bg-white border border-slate-300 text-slate-900' : 'bg-zinc-900 border border-zinc-700 text-white'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className={`text-[10px] font-bold ${isLight ? 'text-slate-600' : 'text-zinc-400'}`}>
                      Depth (Z) [m]
                    </label>
                  </div>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step="any"
                      min="0.01"
                      max="1000"
                      value={boxDimensions.depth}
                      onChange={(e) => setBoxDimensions((prev) => ({ ...prev, depth: Math.max(0.01, parseFloat(e.target.value) || 0.1) }))}
                      className={`w-full rounded-xl px-2.5 py-1.5 text-xs focus:border-cyan-500 focus:outline-none ${
                        isLight ? 'bg-white border border-slate-300 text-slate-900' : 'bg-zinc-900 border border-zinc-700 text-white'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* 3D Placement & Ground Elevation Alignment */}
              <div className={`p-2.5 rounded-xl border ${
                isLight ? 'bg-white/80 border-slate-200' : 'bg-zinc-950/60 border-zinc-800'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[10px] font-bold ${isLight ? 'text-slate-700' : 'text-zinc-300'}`}>
                    3D Position Anchor (X, Y, Z)
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        // Offset Y so base rests on the hit surface
                        const halfHeight = (boxDimensions.height || 1.0) / 2;
                        setPosition((prev) => ({ ...prev, y: Math.round((prev.y + halfHeight) * 1000) / 1000 }));
                      }}
                      className="px-2 py-0.5 bg-blue-500/15 hover:bg-blue-500/25 text-blue-600 dark:text-blue-400 border border-blue-500/30 rounded text-[10px] font-semibold transition-colors"
                      title="Raise box so its bottom face rests exactly on the surface hit"
                    >
                      Rest on Ground (+H/2)
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-1.5 text-[11px]">
                  <div>
                    <span className={`text-[9px] block ${isLight ? 'text-slate-500' : 'text-zinc-500'}`}>X</span>
                    <input
                      type="number"
                      step="any"
                      value={position.x}
                      onChange={(e) => setPosition((prev) => ({ ...prev, x: parseFloat(e.target.value) || 0 }))}
                      className={`w-full rounded px-1.5 py-1 ${
                        isLight ? 'bg-slate-50 border border-slate-300 text-slate-900' : 'bg-zinc-900 border border-zinc-800 text-white'
                      }`}
                    />
                  </div>
                  <div>
                    <span className={`text-[9px] block ${isLight ? 'text-slate-500' : 'text-zinc-500'}`}>Y (Elev)</span>
                    <input
                      type="number"
                      step="any"
                      value={position.y}
                      onChange={(e) => setPosition((prev) => ({ ...prev, y: parseFloat(e.target.value) || 0 }))}
                      className={`w-full rounded px-1.5 py-1 ${
                        isLight ? 'bg-slate-50 border border-slate-300 text-slate-900' : 'bg-zinc-900 border border-zinc-800 text-white'
                      }`}
                    />
                  </div>
                  <div>
                    <span className={`text-[9px] block ${isLight ? 'text-slate-500' : 'text-zinc-500'}`}>Z</span>
                    <input
                      type="number"
                      step="any"
                      value={position.z}
                      onChange={(e) => setPosition((prev) => ({ ...prev, z: parseFloat(e.target.value) || 0 }))}
                      className={`w-full rounded px-1.5 py-1 ${
                        isLight ? 'bg-slate-50 border border-slate-300 text-slate-900' : 'bg-zinc-900 border border-zinc-800 text-white'
                      }`}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Polyline / Polygon 3D Point Array Coordinates */}
          {(geometryType === 'polyline' || geometryType === 'polygon') && (
            <div className={`p-3 border rounded-2xl space-y-2.5 transition-colors ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-zinc-900/80 border-zinc-800'
            }`}>
              <div className="flex items-center justify-between">
                <label className={`text-xs font-semibold flex items-center gap-1.5 ${
                  isLight ? 'text-slate-800' : 'text-zinc-200'
                }`}>
                  <Activity className="w-4 h-4 text-amber-500" />
                  3D Coordinates Path ({points.length} vertices)
                </label>
                <div className="flex items-center gap-1.5">
                  {annotation && onStartEditShape && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onStartEditShape(annotation);
                      }}
                      className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-600 border border-amber-500/40 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors"
                      title="Directly click surface to edit 3D shape vertices on canvas"
                    >
                      <Activity className="w-3 h-3" />
                      <span>Edit Shape in 3D View</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleAddPointRow}
                    className={`px-2 py-1 rounded-lg text-[11px] flex items-center gap-1 transition-colors ${
                      isLight ? 'bg-slate-200 hover:bg-slate-300 text-slate-800 font-medium' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
                    }`}
                  >
                    <Plus className="w-3 h-3" /> Add Point Vertex
                  </button>
                </div>
              </div>

              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {points.map((pt, idx) => (
                  <div
                    key={`point-vertex-${idx}`}
                    className={`flex items-center gap-2 p-2 rounded-xl border transition-colors ${
                      isLight ? 'bg-white border-slate-200' : 'bg-zinc-950/60 border-zinc-800/80'
                    }`}
                  >
                    <span className={`text-[10px] w-4 ${isLight ? 'text-slate-400 font-medium' : 'text-zinc-500'}`}>#{idx + 1}</span>
                    <div className="grid grid-cols-3 gap-1.5 flex-1 text-[11px]">
                      <div>
                        <span className={`text-[9px] block ${isLight ? 'text-slate-500' : 'text-zinc-500'}`}>X</span>
                        <input
                          type="number"
                          step="any"
                          value={pt.x}
                          onChange={(e) => handleUpdatePoint(idx, 'x', parseFloat(e.target.value) || 0)}
                          className={`w-full rounded px-1.5 py-0.5 transition-colors ${
                            isLight ? 'bg-slate-50 border border-slate-300 text-slate-900' : 'bg-zinc-900 border border-zinc-800 text-white'
                          }`}
                        />
                      </div>
                      <div>
                        <span className={`text-[9px] block ${isLight ? 'text-slate-500' : 'text-zinc-500'}`}>Y</span>
                        <input
                          type="number"
                          step="any"
                          value={pt.y}
                          onChange={(e) => handleUpdatePoint(idx, 'y', parseFloat(e.target.value) || 0)}
                          className={`w-full rounded px-1.5 py-0.5 transition-colors ${
                            isLight ? 'bg-slate-50 border border-slate-300 text-slate-900' : 'bg-zinc-900 border border-zinc-800 text-white'
                          }`}
                        />
                      </div>
                      <div>
                        <span className={`text-[9px] block ${isLight ? 'text-slate-500' : 'text-zinc-500'}`}>Z</span>
                        <input
                          type="number"
                          step="any"
                          value={pt.z}
                          onChange={(e) => handleUpdatePoint(idx, 'z', parseFloat(e.target.value) || 0)}
                          className={`w-full rounded px-1.5 py-0.5 transition-colors ${
                            isLight ? 'bg-slate-50 border border-slate-300 text-slate-900' : 'bg-zinc-900 border border-zinc-800 text-white'
                          }`}
                        />
                      </div>
                    </div>
                    {points.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemovePointRow(idx)}
                        className="text-slate-400 hover:text-red-500 p-1 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Single Point / Submesh 3D Coordinates Anchor (3 Decimal Precision) */}
          {(geometryType === 'point' || geometryType === 'submesh') && (
            <div className={`p-3 border rounded-2xl space-y-2 transition-colors ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-zinc-900/80 border-zinc-800'
            }`}>
              <div className="flex items-center justify-between">
                <label className={`text-xs font-semibold flex items-center gap-1.5 ${
                  isLight ? 'text-slate-800' : 'text-zinc-200'
                }`}>
                  <MapPin className="w-4 h-4 text-blue-500" />
                  <span>3D Marker Coordinates (3-Decimal Precision)</span>
                </label>
                <span className="text-[10px] font-mono text-zinc-400">
                  Precision: 0.001m (1mm)
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-[11px]">
                <div>
                  <span className={`text-[9px] font-bold block mb-0.5 ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>X Coordinate [m]</span>
                  <input
                    type="number"
                    step="0.001"
                    value={position.x}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setPosition((prev) => ({ ...prev, x: Math.round(val * 1000) / 1000 }));
                    }}
                    className={`w-full rounded-xl px-2.5 py-1.5 font-mono text-xs focus:border-blue-500 focus:outline-none transition-colors ${
                      isLight ? 'bg-white border border-slate-300 text-slate-900' : 'bg-zinc-950 border border-zinc-800 text-white'
                    }`}
                  />
                </div>
                <div>
                  <span className={`text-[9px] font-bold block mb-0.5 ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>Y (Elevation) [m]</span>
                  <input
                    type="number"
                    step="0.001"
                    value={position.y}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setPosition((prev) => ({ ...prev, y: Math.round(val * 1000) / 1000 }));
                    }}
                    className={`w-full rounded-xl px-2.5 py-1.5 font-mono text-xs focus:border-blue-500 focus:outline-none transition-colors ${
                      isLight ? 'bg-white border border-slate-300 text-slate-900' : 'bg-zinc-950 border border-zinc-800 text-white'
                    }`}
                  />
                </div>
                <div>
                  <span className={`text-[9px] font-bold block mb-0.5 ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>Z Coordinate [m]</span>
                  <input
                    type="number"
                    step="0.001"
                    value={position.z}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setPosition((prev) => ({ ...prev, z: Math.round(val * 1000) / 1000 }));
                    }}
                    className={`w-full rounded-xl px-2.5 py-1.5 font-mono text-xs focus:border-blue-500 focus:outline-none transition-colors ${
                      isLight ? 'bg-white border border-slate-300 text-slate-900' : 'bg-zinc-950 border border-zinc-800 text-white'
                    }`}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Color Palette Picker */}
          <div>
            <label className={`block font-medium mb-1.5 ${isLight ? 'text-slate-700 font-semibold' : 'text-zinc-300'}`}>
              Theme Accent Color
            </label>
            <div className="flex items-center gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-6 h-6 rounded-full border-2 transition-transform ${
                    color === c ? 'scale-125 border-blue-500 shadow-lg' : 'border-transparent hover:scale-110'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-7 h-7 rounded-lg bg-transparent cursor-pointer border-0"
              />
            </div>
          </div>

          {/* Detailed Research Notes Field */}
          <div>
            <label className={`block font-medium mb-1 flex items-center gap-1.5 ${isLight ? 'text-slate-700 font-semibold' : 'text-zinc-300'}`}>
              <AlignLeft className="w-3.5 h-3.5 text-blue-500" />
              Detailed Field Observations & Notes
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Record structural measurements, environmental conditions, or laboratory findings..."
              className={`w-full rounded-xl px-3 py-2 focus:border-blue-500 focus:outline-none resize-none transition-colors ${
                isLight
                  ? 'bg-slate-50 border border-slate-300 text-slate-900 focus:bg-white'
                  : 'bg-zinc-900 border border-zinc-800 text-white'
              }`}
            />
          </div>

          {/* Attachments Section: Photos & Images */}
          <div className={`p-3.5 border rounded-2xl space-y-3 transition-colors ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-zinc-900/60 border-zinc-800/80'
          }`}>
            <div className="flex items-center justify-between">
              <span className={`font-semibold flex items-center gap-1.5 ${isLight ? 'text-slate-800' : 'text-zinc-200'}`}>
                <ImageIcon className="w-4 h-4 text-emerald-500" />
                Attached Photographs ({images.length})
              </span>

              {/* Upload Image File Button */}
              <label className={`cursor-pointer px-2.5 py-1 rounded-lg text-[11px] flex items-center gap-1 transition-colors ${
                isLight ? 'bg-slate-200 hover:bg-slate-300 text-slate-800 font-medium' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
              }`}>
                <Upload className="w-3 h-3" />
                <span>Upload Photos</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* List of Current Attached Images */}
            {images.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {images.map((img) => (
                  <div key={img.id} className={`relative group rounded-xl overflow-hidden border aspect-video ${
                    isLight ? 'bg-slate-100 border-slate-200' : 'bg-zinc-950 border-zinc-800'
                  }`}>
                    <img src={img.url} alt={img.caption || 'Attachment'} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setImages((prev) => prev.filter((i) => i.id !== img.id))}
                      className="absolute top-1 right-1 bg-red-600/90 hover:bg-red-500 text-white p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                    {img.caption && (
                      <p className={`absolute bottom-0 inset-x-0 px-1.5 py-0.5 text-[9px] truncate ${
                        isLight ? 'bg-white/90 text-slate-800 font-medium' : 'bg-black/70 text-zinc-300'
                      }`}>
                        {img.caption}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Add Image URL Input */}
            <div className={`grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t ${isLight ? 'border-slate-200' : 'border-zinc-800/60'}`}>
              <input
                type="url"
                placeholder="Paste Image URL..."
                value={imageUrlInput}
                onChange={(e) => setImageUrlInput(e.target.value)}
                className={`sm:col-span-2 rounded-xl px-2.5 py-1.5 transition-colors ${
                  isLight ? 'bg-white border border-slate-300 text-slate-900' : 'bg-zinc-950 border border-zinc-800 text-white'
                }`}
              />
              <button
                type="button"
                onClick={handleAddImageUrl}
                className={`rounded-xl px-2 py-1.5 font-medium flex items-center justify-center gap-1 transition-colors ${
                  isLight ? 'bg-slate-200 hover:bg-slate-300 text-slate-800' : 'bg-zinc-800 hover:bg-zinc-700 text-white'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add URL</span>
              </button>
            </div>
          </div>

          {/* Attachments Section: PDF Documents */}
          <div className={`p-3.5 border rounded-2xl space-y-3 transition-colors ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-zinc-900/60 border-zinc-800/80'
          }`}>
            <div className="flex items-center justify-between">
              <span className={`font-semibold flex items-center gap-1.5 ${isLight ? 'text-slate-800' : 'text-zinc-200'}`}>
                <FileCode className="w-4 h-4 text-blue-500" />
                Attached PDF Documents ({pdfs.length})
              </span>

              {/* Upload PDF File Button */}
              <label className={`cursor-pointer px-2.5 py-1 rounded-lg text-[11px] flex items-center gap-1 transition-colors ${
                isLight ? 'bg-slate-200 hover:bg-slate-300 text-slate-800 font-medium' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
              }`}>
                <Upload className="w-3 h-3" />
                <span>Upload PDF File</span>
                <input
                  type="file"
                  accept="application/pdf"
                  multiple
                  onChange={handlePdfFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* List of Current Attached PDFs */}
            {pdfs.length > 0 && (
              <div className="space-y-1.5">
                {pdfs.map((pdf) => (
                  <div
                    key={pdf.id}
                    className={`flex items-center justify-between p-2 rounded-xl border text-xs transition-colors ${
                      isLight ? 'bg-white border-slate-200' : 'bg-zinc-950 border-zinc-800'
                    }`}
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                      <div className="truncate">
                        <p className={`font-medium truncate ${isLight ? 'text-slate-800' : 'text-zinc-200'}`}>{pdf.name}</p>
                        <p className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-zinc-500'}`}>{pdf.fileSize || 'PDF Document'}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPdfs((prev) => prev.filter((p) => p.id !== pdf.id))}
                      className="text-slate-400 hover:text-red-500 p-1 rounded-md transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add External PDF Link Input */}
            <div className={`grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t ${isLight ? 'border-slate-200' : 'border-zinc-800/60'}`}>
              <input
                type="text"
                placeholder="PDF File Name..."
                value={pdfNameInput}
                onChange={(e) => setPdfNameInput(e.target.value)}
                className={`rounded-xl px-2.5 py-1.5 transition-colors ${
                  isLight ? 'bg-white border border-slate-300 text-slate-900' : 'bg-zinc-950 border border-zinc-800 text-white'
                }`}
              />
              <input
                type="url"
                placeholder="PDF Document URL..."
                value={pdfUrlInput}
                onChange={(e) => setPdfUrlInput(e.target.value)}
                className={`rounded-xl px-2.5 py-1.5 transition-colors ${
                  isLight ? 'bg-white border border-slate-300 text-slate-900' : 'bg-zinc-950 border border-zinc-800 text-white'
                }`}
              />
              <button
                type="button"
                onClick={handleAddPdfUrl}
                className={`rounded-xl px-2 py-1.5 font-medium flex items-center justify-center gap-1 transition-colors ${
                  isLight ? 'bg-slate-200 hover:bg-slate-300 text-slate-800' : 'bg-zinc-800 hover:bg-zinc-700 text-white'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Link</span>
              </button>
            </div>
          </div>

          {/* Key-Value GIS Attributes & Metadata */}
          <div className={`p-3.5 border rounded-2xl space-y-2.5 transition-colors ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-zinc-900/60 border-zinc-800/80'
          }`}>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className={`font-semibold flex items-center gap-1.5 ${isLight ? 'text-slate-800' : 'text-zinc-200'}`}>
                <Tag className="w-4 h-4 text-amber-500" />
                Custom Attributes & Metadata ({metadata.length})
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {projectOptions?.attributeTemplates && projectOptions.attributeTemplates.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      const currentKeys = new Set(metadata.map((m) => m.key.toLowerCase().trim()));
                      const toAdd: MetadataAttribute[] = [];
                      projectOptions.attributeTemplates.forEach((t) => {
                        if (!currentKeys.has(t.key.toLowerCase().trim())) {
                          toAdd.push({
                            key: t.key,
                            value: t.defaultValue || (t.key.toLowerCase().includes('date') ? new Date().toISOString().split('T')[0] : '')
                          });
                        }
                      });
                      if (toAdd.length > 0) {
                        setMetadata((prev) => [...prev, ...toAdd]);
                      } else {
                        if (window.confirm('Reset/reload all attributes from project templates schema?')) {
                          setMetadata(getInitialAttributes());
                        }
                      }
                    }}
                    className={`px-2 py-1 rounded-lg text-[11px] flex items-center gap-1 transition-colors ${
                      isLight ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 font-medium' : 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300'
                    }`}
                    title="Load project template fields configured in Project Options"
                  >
                    <RotateCcw className="w-3 h-3" /> Load Template Fields
                  </button>
                )}
                {onOpenProjectOptions && (
                  <button
                    type="button"
                    onClick={() => onOpenProjectOptions()}
                    className={`px-2 py-1 rounded-lg text-[11px] flex items-center gap-1 transition-colors ${
                      isLight ? 'bg-slate-200 hover:bg-slate-300 text-slate-700' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                    }`}
                    title="Configure attribute templates in Project Options"
                  >
                    <Sliders className="w-3 h-3" /> Manage Templates
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleAddMetadataRow}
                  className={`px-2 py-1 rounded-lg text-[11px] flex items-center gap-1 transition-colors ${
                    isLight ? 'bg-slate-200 hover:bg-slate-300 text-slate-800 font-medium' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
                  }`}
                >
                  <Plus className="w-3 h-3" /> Add Attribute
                </button>
              </div>
            </div>

            {/* Table Header to clearly differentiate Attribute Key from Recorded Value */}
            {metadata.length > 0 && (
              <div className="grid grid-cols-[1fr,auto,1.2fr,auto] items-center gap-2 px-1 pt-1 pb-0.5 text-[10px] font-bold uppercase tracking-wider select-none">
                <div className={`flex items-center gap-1 ${isLight ? 'text-purple-700' : 'text-purple-400'}`}>
                  <Tag className="w-3 h-3 text-purple-400" />
                  <span>Attribute / Field Key</span>
                </div>
                <div className="w-4 text-center opacity-30"></div>
                <div className={`flex items-center gap-1 ${isLight ? 'text-blue-700' : 'text-cyan-400'}`}>
                  <Edit2 className="w-3 h-3 text-cyan-400" />
                  <span>Recorded Value / Data</span>
                </div>
                <div className="w-7"></div>
              </div>
            )}

            <div className="space-y-2">
              {metadata.length === 0 ? (
                <div className={`p-3 rounded-xl border border-dashed text-center text-xs ${
                  isLight ? 'border-slate-300 text-slate-500 bg-white/50' : 'border-zinc-800 text-zinc-500 bg-zinc-950/40'
                }`}>
                  No attributes defined yet. Click <strong>+ Add Attribute</strong> or <strong>Load Template Fields</strong> above.
                </div>
              ) : (
                metadata.map((attr, idx) => {
                  const isFromTemplate = projectOptions?.attributeTemplates?.some(
                    (t) => t.key.trim().toLowerCase() === attr.key.trim().toLowerCase()
                  );

                  return (
                    <div
                      key={`attr-row-${idx}`}
                      className={`grid grid-cols-[1fr,auto,1.2fr,auto] items-center gap-2 p-1.5 rounded-xl border transition-all ${
                        isLight
                          ? 'bg-white border-slate-200/80 shadow-xs'
                          : 'bg-zinc-950/70 border-zinc-800/80'
                      }`}
                    >
                      {/* Left: Attribute / Schema Property Key */}
                      <div className="relative flex items-center min-w-0">
                        <input
                          type="text"
                          placeholder="Attribute Key (e.g. Elevation)"
                          value={attr.key}
                          onChange={(e) => handleUpdateMetadata(idx, 'key', e.target.value)}
                          className={`w-full rounded-lg pl-2.5 pr-2 py-1.5 text-xs font-semibold transition-colors focus:outline-none ${
                            isLight
                              ? 'bg-purple-50/70 border border-purple-200 text-purple-950 focus:border-purple-500 placeholder:text-purple-400'
                              : 'bg-purple-950/30 border border-purple-500/30 text-purple-200 focus:border-purple-400 placeholder:text-purple-400/50'
                          }`}
                        />
                        {isFromTemplate && (
                          <span
                            title="Defined in Project Schema Templates"
                            className="absolute right-2 text-[9px] font-mono px-1 py-0.2 rounded bg-purple-500/20 text-purple-300 pointer-events-none hidden sm:inline-block"
                          >
                            Schema
                          </span>
                        )}
                      </div>

                      {/* Directional Connector Arrow */}
                      <span className="text-zinc-500 text-xs font-bold select-none text-center w-4">
                        →
                      </span>

                      {/* Right: Recorded Value / Measurement */}
                      <div className="min-w-0">
                        <input
                          type="text"
                          placeholder="Recorded value (e.g. +2.4m, Limestone, Layer 3...)"
                          value={attr.value}
                          onChange={(e) => handleUpdateMetadata(idx, 'value', e.target.value)}
                          className={`w-full rounded-lg px-2.5 py-1.5 text-xs font-mono transition-colors focus:outline-none ${
                            isLight
                              ? 'bg-slate-50 border border-slate-300 text-slate-900 focus:border-blue-500 focus:bg-white placeholder:text-slate-400'
                              : 'bg-zinc-900/90 border border-zinc-700 text-zinc-100 focus:border-cyan-400 focus:bg-zinc-900 placeholder:text-zinc-600'
                          }`}
                        />
                      </div>

                      {/* Remove Row Button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveMetadata(idx)}
                        className="text-slate-400 hover:text-red-500 p-1 rounded-lg transition-colors flex items-center justify-center w-7 h-7 hover:bg-red-500/10"
                        title="Remove this attribute"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* EXHIBITION NARRATION STUDIO (COLLAPSIBLE, CLEAN MULTI-NARRATIVE SUITE) */}
          <div
            id="exhibition-narration-studio-section"
            className={`rounded-2xl border transition-all overflow-hidden ${
              isLight
                ? 'bg-amber-50/40 border-amber-200/80 shadow-xs'
                : 'bg-[#101014] border-zinc-800 shadow-md'
            }`}
          >
            {/* Studio Collapsible Header Bar */}
            <button
              type="button"
              onClick={() => setIsNarrationStudioExpanded(!isNarrationStudioExpanded)}
              className={`w-full p-4 flex items-center justify-between text-left transition-colors select-none ${
                isLight ? 'hover:bg-amber-100/50' : 'hover:bg-zinc-850/60'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className={`text-xs sm:text-sm font-bold uppercase tracking-wider ${
                      isLight ? 'text-slate-900' : 'text-zinc-100'
                    }`}>
                      Exhibition Narration Studio
                    </h4>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                      narrations.length > 0
                        ? isLight
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : isLight
                        ? 'bg-slate-200/80 text-slate-600'
                        : 'bg-zinc-800 text-zinc-400'
                    }`}>
                      {narrations.length} {narrations.length === 1 ? 'Narrative' : 'Narratives'}
                    </span>
                  </div>
                  <p className={`text-[11px] truncate ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                    Multi-perspective visitor interpretation & theme audio tours
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 ml-2">
                <span className={`text-xs font-semibold hidden sm:inline ${
                  isLight ? 'text-amber-800' : 'text-amber-400'
                }`}>
                  {isNarrationStudioExpanded ? 'Collapse' : 'Open Studio'}
                </span>
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-transform ${
                  isLight ? 'bg-amber-200/50 text-amber-900' : 'bg-zinc-800 text-zinc-300'
                }`}>
                  {isNarrationStudioExpanded ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </div>
            </button>

            {/* Collapsible Studio Content Body */}
            {isNarrationStudioExpanded && (
              <div className="p-4 sm:p-5 pt-0 space-y-4 border-t border-amber-200/40 dark:border-zinc-800/80">
                {/* STUDIO GENERATOR CONTROL DECK */}
                <div className={`p-4 rounded-2xl border space-y-3.5 mt-3 ${
                  isLight ? 'bg-white border-slate-200 shadow-2xs' : 'bg-zinc-950/70 border-zinc-800'
                }`}>
                  <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-zinc-800/60">
                    <span className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                      isLight ? 'text-slate-800' : 'text-zinc-200'
                    }`}>
                      <SlidersHorizontal className="w-3.5 h-3.5 text-amber-500" />
                      <span>Studio Synthesis Parameters</span>
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">
                      Gemini Flash Lite + Curator Workflow
                    </span>
                  </div>

                  {/* Section 1: Interpretive Tone */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className={`text-xs font-semibold ${isLight ? 'text-slate-700' : 'text-zinc-300'}`}>
                        Interpretive Tone:
                      </label>
                      <span className={`text-[10px] font-mono ${isLight ? 'text-amber-800' : 'text-amber-400'}`}>
                        {studioTone === 'academic' && 'Scholarly & diagnostic analysis'}
                        {studioTone === 'story' && 'Atmospheric & vivid storytelling'}
                        {studioTone === 'educational' && 'Pedagogical & clear museum guide'}
                        {studioTone === 'poetic' && 'Lyrical & heritage contemplation'}
                        {studioTone === 'investigative' && 'Forensic architectural inquiry'}
                        {studioTone === 'child-friendly' && 'Engaging for young visitors'}
                        {studioTone === 'concise' && 'Brevity-focused placard synopsis'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      {[
                        { id: 'story' as NarrationTone, label: 'Story', icon: '📖' },
                        { id: 'academic' as NarrationTone, label: 'Academic', icon: '🔬' },
                        { id: 'educational' as NarrationTone, label: 'Educational', icon: '🏛️' },
                        { id: 'poetic' as NarrationTone, label: 'Poetic', icon: '✨' },
                        { id: 'investigative' as NarrationTone, label: 'Investigative', icon: '🔍' },
                        { id: 'child-friendly' as NarrationTone, label: 'Young Explorers', icon: '🎒' },
                        { id: 'concise' as NarrationTone, label: 'Concise Placard', icon: '🏷️' }
                      ].map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setStudioTone(t.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 ${
                            studioTone === t.id
                              ? isLight
                                ? 'bg-amber-500 text-zinc-950 font-bold shadow-xs'
                                : 'bg-amber-500 text-zinc-950 font-bold shadow-xs'
                              : isLight
                              ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                              : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800'
                          }`}
                        >
                          <span>{t.icon}</span>
                          <span>{t.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Section 2: Knowledge Level & Target Tour Theme in balanced 2-column grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2 border-t border-slate-100 dark:border-zinc-850">
                    {/* Knowledge Level Selector */}
                    <div className="space-y-1.5">
                      <label className={`text-xs font-semibold block ${isLight ? 'text-slate-700' : 'text-zinc-300'}`}>
                        Audience Knowledge Level:
                      </label>
                      <div className="flex items-center gap-1 flex-wrap">
                        {[
                          { id: 'general' as NarrationKnowledgeLevel, label: 'General' },
                          { id: 'young' as NarrationKnowledgeLevel, label: 'Young' },
                          { id: 'enthusiast' as NarrationKnowledgeLevel, label: 'Enthusiast' },
                          { id: 'undergraduate' as NarrationKnowledgeLevel, label: 'Undergrad' },
                          { id: 'specialist' as NarrationKnowledgeLevel, label: 'Specialist' }
                        ].map((lvl) => (
                          <button
                            key={lvl.id}
                            type="button"
                            onClick={() => setStudioKnowledgeLevel(lvl.id)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                              studioKnowledgeLevel === lvl.id
                                ? isLight
                                  ? 'bg-blue-600 text-white font-bold shadow-2xs'
                                  : 'bg-blue-500 text-white font-bold shadow-2xs'
                                : isLight
                                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300'
                            }`}
                          >
                            {lvl.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Target Interpretive Theme Focus */}
                    <div className="space-y-1.5">
                      <label className={`text-xs font-semibold block ${isLight ? 'text-slate-700' : 'text-zinc-300'}`}>
                        Target Thematic Tour Lens:
                      </label>
                      <select
                        value={studioTargetTheme}
                        onChange={(e) => setStudioTargetTheme(e.target.value)}
                        className={`w-full rounded-xl px-3 py-1.5 text-xs font-medium transition-colors focus:outline-none ${
                          isLight
                            ? 'bg-slate-50 border border-slate-300 text-slate-800 focus:border-amber-500'
                            : 'bg-zinc-900 border border-zinc-700 text-zinc-200 focus:border-amber-400'
                        }`}
                      >
                        <option value="">Universal / General Exhibit View</option>
                        {interpretiveThemes.map((t, idx) => (
                          <option key={idx} value={t}>
                            Theme: {t}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Section 3: Optional Custom Prompt Guidance */}
                  <div className="space-y-1 pt-1">
                    <input
                      type="text"
                      placeholder="Optional curator notes (e.g. 'Highlight 14th century stone joinery' or 'Emphasize structural decay')..."
                      value={studioCustomInstruction}
                      onChange={(e) => setStudioCustomInstruction(e.target.value)}
                      className={`w-full rounded-xl px-3.5 py-2 text-xs transition-colors focus:outline-none ${
                        isLight
                          ? 'bg-slate-50 border border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-amber-500'
                          : 'bg-zinc-900 border border-zinc-800 text-zinc-200 placeholder:text-zinc-600 focus:border-amber-400'
                      }`}
                    />
                  </div>

                  {/* Action Buttons: Compile for Audience & New Blank Draft */}
                  <div className="flex items-center justify-between gap-2.5 pt-2 border-t border-slate-100 dark:border-zinc-850 flex-wrap">
                    <button
                      type="button"
                      onClick={handleCreateBlankDraft}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                        isLight
                          ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
                          : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-750'
                      }`}
                    >
                      <FileEdit className="w-3.5 h-3.5" />
                      <span>+ Add Blank Draft</span>
                    </button>

                    <button
                      id="compile-for-audience-button"
                      type="button"
                      onClick={handleCompileStudioNarration}
                      disabled={isCompilingNarration}
                      className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-md active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed ${
                        isCompilingNarration
                          ? 'bg-amber-400 text-zinc-900 cursor-wait'
                          : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 shadow-amber-500/20'
                      }`}
                      title="Generate a curated narrative in the studio using the selected tone and parameters"
                    >
                      {isCompilingNarration ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Compiling Narrative with AI...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          <span>Compile for Audience ({studioTone})</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Status Banner */}
                  {compileStatusMessage && (
                    <div className={`px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 animate-fadeIn ${
                      isLight ? 'bg-amber-100/90 text-amber-900 border border-amber-300/80' : 'bg-amber-950/60 text-amber-200 border border-amber-500/30'
                    }`}>
                      <Check className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span>{compileStatusMessage}</span>
                    </div>
                  )}
                </div>

                {/* NARRATIVES LIBRARY TABS STRIP */}
                {narrations.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between px-0.5">
                      <span className={`text-[11px] font-bold uppercase tracking-wider ${
                        isLight ? 'text-slate-700' : 'text-zinc-300'
                      }`}>
                        Compiled Narratives ({narrations.length}):
                      </span>
                      <span className="text-[10px] text-zinc-400">
                        Click a draft below to inspect and refine
                      </span>
                    </div>

                    <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none">
                      {narrations.map((narr, idx) => {
                        const isSelected = narr.id === activeNarrationId;
                        const boundThemes = Object.keys(themeNarrationBindings).filter(
                          (k) => themeNarrationBindings[k] === narr.id
                        );

                        return (
                          <button
                            key={narr.id}
                            type="button"
                            onClick={() => setActiveNarrationId(narr.id)}
                            className={`px-3 py-2 rounded-xl border text-left shrink-0 transition-all flex flex-col gap-0.5 ${
                              isSelected
                                ? 'bg-amber-500 text-zinc-950 border-amber-500 shadow-sm font-semibold'
                                : isLight
                                ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                                : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 text-xs font-bold truncate max-w-[200px]">
                              <span>{narr.title || `Narrative #${idx + 1}`}</span>
                              {narr.isDefault && (
                                <span
                                  title="Default narrative for general exhibit view"
                                  className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold uppercase ${
                                    isSelected ? 'bg-zinc-950/20 text-zinc-950' : 'bg-amber-500/20 text-amber-600 dark:text-amber-300'
                                  }`}
                                >
                                  ★ Default
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1 text-[10px] opacity-85">
                              <span className="capitalize">{narr.tone}</span>
                              <span>•</span>
                              <span className="capitalize">{narr.knowledgeLevel || 'General'}</span>
                              {boundThemes.length > 0 && (
                                <>
                                  <span>•</span>
                                  <span className="font-semibold text-[9px] truncate max-w-[80px]">
                                    {boundThemes[0]}
                                  </span>
                                </>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ACTIVE NARRATIVE WORKSPACE & EDITOR */}
                {(() => {
                  const activeNarr = narrations.find((n) => n.id === activeNarrationId) || narrations[0];
                  if (!activeNarr) {
                    return (
                      <div className={`p-5 rounded-2xl border border-dashed text-center text-xs space-y-1.5 ${
                        isLight ? 'bg-white/60 border-slate-300 text-slate-500' : 'bg-zinc-950/50 border-zinc-800 text-zinc-400'
                      }`}>
                        <p className="font-semibold">No exhibition narratives compiled yet.</p>
                        <p className="text-[11px] opacity-80">
                          Click <strong>Compile for Audience</strong> above or click <strong>+ Add Blank Draft</strong> to start.
                        </p>
                      </div>
                    );
                  }

                  const boundThemes = Object.keys(themeNarrationBindings).filter(
                    (k) => themeNarrationBindings[k] === activeNarr.id
                  );

                  return (
                    <div className={`p-4 rounded-2xl border space-y-3 animate-fadeIn ${
                      isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-[#121216] border-zinc-800 shadow-md'
                    }`}>
                      {/* Narrative Header & Settings */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-zinc-800">
                        <div className="flex-1 min-w-0">
                          <input
                            type="text"
                            value={activeNarr.title}
                            onChange={(e) => handleUpdateActiveNarration({ title: e.target.value })}
                            placeholder="Narrative Title"
                            className={`w-full font-bold text-xs sm:text-sm rounded-lg px-2.5 py-1 transition-colors focus:outline-none ${
                              isLight
                                ? 'bg-slate-100 text-slate-900 focus:bg-white focus:ring-1 focus:ring-amber-500'
                                : 'bg-zinc-900 text-zinc-100 focus:bg-zinc-850 focus:ring-1 focus:ring-amber-400'
                            }`}
                          />
                        </div>

                        {/* Quick Narrative Properties Controls */}
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleSetDefaultNarration(activeNarr.id)}
                            className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold flex items-center gap-1 transition-all ${
                              activeNarr.isDefault
                                ? isLight
                                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                : isLight
                                ? 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400'
                            }`}
                            title="Mark as default narrative for general exhibit view"
                          >
                            <CheckCircle2 className={`w-3 h-3 ${activeNarr.isDefault ? 'text-amber-500' : 'opacity-40'}`} />
                            <span>{activeNarr.isDefault ? 'Default Narration' : 'Set as Default'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteNarration(activeNarr.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                            title="Delete this narrative draft"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Badges for Tone, Knowledge Level, & Theme Lens */}
                      <div className="flex items-center gap-2 flex-wrap text-[10px]">
                        <span className={`px-2 py-0.5 rounded-md font-semibold capitalize ${
                          isLight ? 'bg-amber-100 text-amber-800' : 'bg-amber-900/40 text-amber-300'
                        }`}>
                          Tone: {activeNarr.tone}
                        </span>
                        <span className={`px-2 py-0.5 rounded-md font-semibold capitalize ${
                          isLight ? 'bg-blue-100 text-blue-800' : 'bg-blue-900/40 text-blue-300'
                        }`}>
                          Level: {activeNarr.knowledgeLevel || 'General'}
                        </span>
                        {activeNarr.targetTheme && (
                          <span className={`px-2 py-0.5 rounded-md font-semibold flex items-center gap-1 ${
                            isLight ? 'bg-purple-100 text-purple-800' : 'bg-purple-900/40 text-purple-300'
                          }`}>
                            <Compass className="w-2.5 h-2.5" />
                            <span>Lens: {activeNarr.targetTheme}</span>
                          </span>
                        )}
                        {boundThemes.length > 0 && (
                          <span className={`px-2 py-0.5 rounded-md font-semibold flex items-center gap-1 ${
                            isLight ? 'bg-emerald-100 text-emerald-800' : 'bg-emerald-900/40 text-emerald-300'
                          }`}>
                            <Check className="w-2.5 h-2.5" />
                            <span>Assigned to: {boundThemes.join(', ')}</span>
                          </span>
                        )}
                      </div>

                      {/* Editable Textarea */}
                      <div className="relative">
                        <textarea
                          id="active-narration-textarea"
                          rows={4}
                          value={activeNarr.text}
                          onChange={(e) => handleUpdateActiveNarration({ text: e.target.value })}
                          placeholder="Narrative text will appear here. You can refine and edit freely..."
                          className={`w-full rounded-xl p-3 text-xs leading-relaxed transition-all focus:outline-none resize-y min-h-[90px] ${
                            isLight
                              ? 'bg-slate-50 border border-slate-300 text-slate-800 focus:border-amber-500 focus:bg-white focus:ring-1 focus:ring-amber-500/20'
                              : 'bg-zinc-950 border border-zinc-700 text-zinc-100 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/20'
                          }`}
                        />

                        {/* Word Count and Meta Details */}
                        <div className="flex items-center justify-between mt-1 px-1 text-[10px] text-zinc-500">
                          <div className="flex items-center gap-2">
                            <span>
                              {activeNarr.text ? `${activeNarr.text.trim().split(/\s+/).filter(Boolean).length} words` : 'Empty text'}
                            </span>
                            <span className="text-amber-500/80 font-medium">
                              • {activeNarr.source || 'specialist-authored'}
                            </span>
                          </div>
                          <span className="opacity-75">
                            {activeNarr.compiledAt ? new Date(activeNarr.compiledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* THEMATIC TOUR NARRATION BINDINGS MATRIX */}
                {interpretiveThemes.length > 0 && (
                  <div className={`p-3.5 rounded-2xl border space-y-2.5 ${
                    isLight ? 'bg-white border-slate-200' : 'bg-zinc-950/70 border-zinc-800'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Compass className="w-3.5 h-3.5 text-amber-500" />
                        <span className={`text-[11px] font-bold uppercase tracking-wider ${
                          isLight ? 'text-slate-800' : 'text-zinc-200'
                        }`}>
                          Tour Theme Narration Assignments
                        </span>
                      </div>
                      <span className="text-[10px] text-zinc-400">
                        Map which narrative plays for each theme tour
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      {interpretiveThemes.map((themeName) => {
                        const currentBoundId = themeNarrationBindings[themeName] || '';
                        const matchedNarr = narrations.find((n) => n.id === currentBoundId);

                        return (
                          <div
                            key={themeName}
                            className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 rounded-xl border transition-all ${
                              isLight ? 'bg-slate-50 border-slate-200' : 'bg-zinc-900/60 border-zinc-800'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg flex items-center gap-1 ${
                                isLight ? 'bg-amber-100 text-amber-900' : 'bg-amber-500/20 text-amber-300'
                              }`}>
                                <Compass className="w-3 h-3" />
                                <span>{themeName}</span>
                              </span>
                            </div>

                            <div className="flex items-center gap-2 flex-1 sm:justify-end">
                              <select
                                value={currentBoundId}
                                onChange={(e) => handleSetThemeNarrationBinding(themeName, e.target.value)}
                                className={`w-full sm:max-w-xs rounded-lg px-2 py-1 text-xs font-medium transition-colors focus:outline-none ${
                                  isLight
                                    ? 'bg-white border border-slate-300 text-slate-800 focus:border-amber-500'
                                    : 'bg-zinc-900 border border-zinc-700 text-zinc-200 focus:border-amber-400'
                                }`}
                              >
                                <option value="">(Use Default Narration)</option>
                                {narrations.map((narr, idx) => (
                                  <option key={narr.id} value={narr.id}>
                                    #{idx + 1}: {narr.title || `Narrative (${narr.tone})`}
                                  </option>
                                ))}
                              </select>

                              {matchedNarr && (
                                <span className={`text-[10px] px-2 py-0.5 rounded-md shrink-0 font-medium capitalize ${
                                  isLight ? 'bg-amber-100 text-amber-800' : 'bg-amber-900/40 text-amber-300'
                                }`}>
                                  {matchedNarr.tone}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Save Action */}
          <div className={`pt-3 border-t flex items-center justify-end gap-3 shrink-0 ${
            isLight ? 'border-slate-200' : 'border-zinc-800'
          }`}>
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-xl transition-colors font-medium ${
                isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center gap-1.5 shadow-lg shadow-blue-600/20 transition-all"
            >
              <Check className="w-4 h-4" />
              <span>Save Spatial Record</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
