# 3D Spatial Survey & GIS Workspace — Stability, Performance & UX Polish Plan

This plan outlines a targeted stability, performance, and bug-prevention pass across the 3D Spatial Survey & GIS Workspace so that every workflow—from high-poly 3D viewport navigation and spatial geometry drawing to interpretive tours and `.3dproj` ZIP archiving—runs smoothly, predictably, and free of memory leaks or state desynchronization.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural and UX priorities were confirmed during our clarification step and govern this implementation pass:

- **Confirmed Decision 1 — All Core Workflows Prioritized**: We will audit and harden all four pillars of the application: (1) 3D viewport performance & smooth camera navigation, (2) spatial annotation drawing & 3D shape editing tools, (3) project export, ZIP import, & data persistence, and (4) interpretive tours, measurements, & Audience mode UX.
- **Confirmed Decision 2 — Automatic Adaptive Rendering with Manual Override Controls**: The 3D viewport will dynamically scale rendering workload (pixel ratio during active camera motion, on-demand frame scheduling, and procedural studio environment reflection) while honoring the user's explicit manual overrides in the Display & Hardware settings (`performanceMode`, `resolutionScale`, shadows, and occlusion ghosting).
- **Confirmed Decision 3 — Comprehensive Safeguards**: We will enforce strict Three.js GPU resource disposal and `blob:` URL revocation, immediate state synchronization across multi-model records and discipline layers, removal of blocking browser `alert()` calls in favor of non-blocking toast notifications, and full Light/Dark theme parity across all floating toolbars and modals.

---

## 1. Overview & Core Concept

- **What It Does**: Provides a dual-mode (**Researcher** and **Audience**) 3D Spatial GIS and Photogrammetric Survey platform for inspecting 3D meshes, organizing discipline layers, drawing 3D spatial markers (Points, Polylines, Polygons, Solid Box Volumes, and Sub-Mesh highlights), taking linear 3D measurements, curating guided Interpretive Theme Tours, and packaging complete multi-model workspaces into portable `.3dproj` ZIP archives.
- **Target Audience / Persona**:
  - **Researchers, Surveyors & Conservators**: Need zero-lag raycasting, accurate 3D geometry drawing/editing, reliable layer visibility filtering, and lossless project export/import.
  - **Audience & Exhibition Visitors**: Need smooth guided camera flights along interpretive tour stops, legible light/dark spatial popups, multimedia lightboxes, and interactive community commentary.
- **Key Value**: Eliminates subtle state desynchronization bugs, prevents WebGL memory accumulation across model switches, smooths camera preset and tour transitions, and ensures consistent visual legibility across both Light and Dark themes.

---

## 2. User Experience & Visual Design

- **Key User Flows**:
  1. **3D Viewport Navigation & Adaptive Inspection**: Users orbit, pan, or fly (`WASD` / `Q` / `E` Terrain Flight) across procedural or uploaded 3D scans. Camera presets (`Front`, `Top`, `Isometric`, etc.), double-click surface focus, and tour stop flights glide smoothly using eased arc trajectories without abrupt snaps.
  2. **Spatial Geometry Drawing & Live 3D Shape Editing**: Researchers place Point pins, multi-vertex Polylines, triangulated Polygons, 1-Click or 2-Corner Box Volumes, and Sub-Mesh highlights with live cursor rubber-banding and keyboard shortcuts (`Enter` to complete multi-point drawing, `Backspace` to undo the last vertex, `Escape` to cancel active drawing/measurement/editing modes).
  3. **Discipline Layer Filtering & Multi-Model Switching**: Toggling discipline layer visibility in the GIS panel immediately hides or reveals associated 3D markers in the viewport. Switching between models or deleting models preserves all model-linked annotations, groups, measurements, material overrides, and hidden nodes without cross-contaminating state.
  4. **Interpretive Theme Virtual Tours (Audience & Researcher)**: Starting an interpretive tour flies the camera smoothly from stop to stop. Toggling **Auto-Play** automatically advances through tour stops on a timed cadence while pausing cleanly if the user manually interacts or opens media attachments.
  5. **Project Archive Export & Import (`.3dproj` ZIP & JSON)**: Exporting packages all models, UV textures, spatial records, discipline groups, measurements, and custom project options into a compressed `.3dproj` archive. Importing restores the entire workspace state cleanly and reports any format or validation issues via non-blocking toast notifications.

- **Visual Identity & Theme**:
  - **Aesthetic Direction**: High-precision spatial instrument and architectural survey studio—unobstructed 3D viewport canvas framed by crisp, high-contrast HUD docks and inspectable data drawers.
  - **Color Palette & Mood**:
    - *Dark Theme*: Deep obsidian canvas (`#09090B` / `#0C0C0E`), subtle zinc structural borders (`border-zinc-800`), crisp zinc typography (`text-zinc-100` / `text-zinc-400`), and high-intent accents (`#3b82f6` blue for Researcher actions, `#f59e0b` amber for Audience tours & shape editing, `#10b981` emerald for measurements).
    - *Light Theme*: Clean slate studio canvas (`#f1f5f9`), pure white elevated surfaces (`bg-white/95`), crisp slate borders (`border-slate-200` / `border-slate-300`), and high-contrast slate typography (`text-slate-900` / `text-slate-700`) across all floating bars, modals, and drawers.
  - **Typography & Hierarchy**: Clean geometric sans (`Inter` / system sans) for UI controls paired with tabular monospace (`JetBrains Mono` / `font-mono tabular-nums`) for 3D coordinates `(X, Y, Z)`, distances, vertex counts, and bounding dimensions.
  - **Interactive Feedback & Motion**: Smooth cubic ease-in-out camera trajectories with subtle vertical arc clearance, responsive hover previews for measurements and multi-vertex geometry creation, and non-blocking toast notifications for all file I/O operations.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Automatic Adaptive Resolution Scaling + Procedural Studio Environment (`RoomEnvironment`)**
  - *Chosen Approach*: Configure a zero-dependency Three.js `RoomEnvironment` via `PMREMGenerator` for realistic PBR metallic/roughness response, pre-allocate reusable `THREE.Vector3` math temporaries outside the `requestAnimationFrame` loop to eliminate per-frame garbage collection, and dynamically lower the effective pixel ratio during active camera motion on heavy meshes (>250k triangles) before snapping back to full crisp resolution on idle frames—while respecting manual `performanceMode` and `resolutionScale` settings.
  - *Why*: Delivers silky 60fps interaction during orbit/flight on dense photogrammetry models without sacrificing sharp visual fidelity when inspecting static details.
  - *Alternatives Considered*: Locking pixel ratio at `1.0` permanently (degrades text/wireframe sharpness on Retina displays) or running continuous 60fps rendering when idle (wastes GPU battery).

- **Decision 2: Strict Multi-Model & Layer State Synchronization**
  - *Chosen Approach*: Pass `spatialGroups` directly into `ThreeCanvas` so layer visibility toggles immediately filter 3D scene markers; synchronize `measurementsByModel`, `annotationsByModel`, `spatialGroupsByModel`, `materialOverridesByModel`, and `hiddenNodesByModel` immediately whenever records or measurements are added, removed, or cleared; and ensure project import fallback branches and new-project resets initialize all state maps uniformly.
  - *Why*: Prevents stale or orphaned records when switching models, opening the Project Manager modal (which reads `recordsByModel` and `measurementsByModel`), or toggling layer visibility.
  - *Alternatives Considered*: Syncing model-linked dictionaries only on model switch (causes the Project Manager modal counts and exports to show stale data for the currently active model).

- **Decision 3: Deterministic GPU & Blob URL Memory Cleanup**
  - *Chosen Approach*: Introduce a dedicated scene & resource disposal utility that traverses removed `THREE.Object3D` scenes to dispose geometries, materials, textures, and vertex point-cloud helpers, clears cached override textures, revokes `blob:` URLs when models are deleted or replaced, and listens for `webglcontextlost` / `webglcontextrestored` events on the WebGL canvas.
  - *Why*: Prevents browser WebGL out-of-memory crashes when users upload, replace, or delete multiple large 3D models during a session.

---

## 4. Technical Architecture & Data Strategy

### Architecture & Component Diagram

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                         App.tsx (Workspace Controller)                       │
│  • Multi-Model Store (userModels, annotationsByModel, measurementsByModel)   │
│  • Active Workspace State (annotations, spatialGroups, measurements, theme)  │
│  • Tour Playback Controller (activeTourRoute, activeStopIndex, autoPlayTimer)│
│  • Project I/O Engine (.3dproj JSZip Exporter/Importer & JSON Layer Sync)    │
└───────┬──────────────────────────┬──────────────────────────┬────────────────┘
        │                          │                          │
        ▼                          ▼                          ▼
┌──────────────────────┐ ┌──────────────────────────┐ ┌────────────────────────┐
│   ThreeCanvas.tsx    │ │   GisDataListPanel.tsx   │ │  SidebarInspector.tsx  │
│ • WebGLRenderer +    │ │ • Discipline Layers &    │ │ • Scene Hierarchy Tree │
│   RoomEnvironment    │ │   Visibility Filtering   │ │ • Display & Clipping   │
│ • Adaptive On-Demand │ │ • Spatial Record Cards   │ │ • PBR Material Studio  │
│   Render Loop (0-GC) │ │ • Interpretive Themes &  │ │ • Lighting & Skybox    │
│ • Smooth Camera Fly  │ │   Custom Route Ordering  │ │ • Skeletal Animations  │
│   & Preset Damping   │ └──────────────────────────┘ │ • Measurements & Export│
│ • Dual-Pass 3D Pins, │                              └────────────────────────┘
│   Polylines, Polygons│ ┌─────────────────────────────────────────────────────┐
│   & Solid Box Volumes│ │           Interactive Overlays & Modals             │
│ • Live Rubber-Band   │ │ • ControlBar (Camera Presets, Orbit/Terrain, Perf)  │
│   Drawing & Measure  │ │ • ThemeTourOverlay (Guided Playback & Auto-Advance) │
│ • Projected DOM      │ │ • SpatialRecordPopup & SpatialRecordCommentsWing    │
│   Popups & Badges    │ │ • AnnotationEditorModal, ProjectModal, UploadModal  │
└──────────────────────┘ └─────────────────────────────────────────────────────┘
```

### Interactive Component & State Mapping

1. **`ThreeCanvas.tsx` (3D Viewport, Adaptive Rendering & Geometry Engine)**:
   - **Layer Visibility Filtering**: Receive `spatialGroups` from `App.tsx` so toggling a layer's visibility (`visible: false`) immediately hides its 3D markers and deselects any hidden active annotation.
   - **Zero-GC Render Loop & Studio Environment**: Pre-allocate reusable `THREE.Vector3` and `THREE.Quaternion` objects outside the `animate()` closure; initialize `RoomEnvironment` reflection map and dispose its `PMREMGenerator`; add `webglcontextlost` / `webglcontextrestored` handlers.
   - **Smooth Camera Presets**: Upgrade `setCameraPreset` to use `focusPointSmoothly` / smooth cubic interpolation to the target preset viewpoint instead of snapping instantaneously.
   - **Live Multi-Vertex Rubber-Band Preview**: Track surface hover coordinates during `polyline` and `polygon` creation as well as 3D shape editing so users see a live preview segment from the last vertex to the cursor.
   - **GPU Resource Disposal**: Dispose generated `__VERTICES_POINTS_CLOUD__` meshes, `BoxHelper` geometries/materials, and `textureCacheRef` textures when switching models or unmounting.

2. **`App.tsx` (State Synchronization, Keyboard Shortcuts, Tour Auto-Play & File I/O)**:
   - **Immediate Model-Linked Dictionary Sync**: Keep `annotationsByModel`, `spatialGroupsByModel`, `measurementsByModel`, `materialOverridesByModel`, and `hiddenNodesByModel` synchronized whenever measurements, groups, or overrides change on the active model so `ProjectModal` and exports always reflect live counts.
   - **Interpretive Tour Auto-Play Timer & Route Sync**: Add an effect that automatically advances `activeStopIndex` every 6 seconds when `isTourPlaying` is active (pausing when media modals are open), preserves `customThemeOrders` when refreshing routes, and keeps `activeTourRoute` valid if annotations are edited or deleted.
   - **Global Keyboard Shortcuts**: Support `Escape` to cleanly exit active pin drawing, shape editing, measurement mode, or open modals; `Enter` to finish active polyline/polygon drawing; and `Backspace` / `Delete` to undo the last drawn vertex during polyline/polygon creation.
   - **Memory Cleanup on Model Delete / Reset**: Traverse and dispose Three.js geometries, materials, and textures and call `URL.revokeObjectURL` when deleting a user model, replacing an uploaded model with the same name, or starting a new project.
   - **Non-Blocking Error Handling**: Replace remaining `alert()` calls in JSON and `.3dproj` import handlers with descriptive `setToastNotification` error messages.

3. **Light/Dark Theme & Modal Consistency (`App.tsx`, `PdfViewerModal.tsx`, `ImageLightboxModal.tsx`)**:
   - Update the 3D Shape Editing floating toolbar buttons (`+0.5m`, `-0.5m`, `Undo Point`, `Clear All`, and vertex hints) in `App.tsx` so they adapt cleanly to `uiTheme === 'light'` instead of using hardcoded dark `bg-zinc-800` styles.
   - Pass `uiTheme` and `Escape`-key close support to `PdfViewerModal` and `ImageLightboxModal` for seamless light/dark visual parity.
