import { SpatialAnnotation, SpatialGroup } from '../types';

// Sample PDF data URL placeholder (a valid minimal PDF blob URL or downloadable data snippet)
export const SAMPLE_PDF_URL = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';

export const DEFAULT_SAMPLE_GROUPS: SpatialGroup[] = [
  {
    id: 'grp_arthistory',
    name: 'Art History & Iconography',
    discipline: 'Art History',
    description: 'Pigment analysis, artistic style provenance, decorative relief surveys, and iconographic notes.',
    color: '#8b5cf6', // Violet
    visible: true,
    locked: false,
    createdAt: '2026-06-01',
    author: 'Prof. Vance (Art History Dept)'
  },
  {
    id: 'grp_geology',
    name: 'Geology & Petrology',
    discipline: 'Geology',
    description: 'Borehole core borings, rock bed weathering, soil compaction tests, and petrological analysis.',
    color: '#10b981', // Emerald
    visible: true,
    locked: false,
    createdAt: '2026-06-05',
    author: 'Geological Survey Unit'
  },
  {
    id: 'grp_structural',
    name: 'Structural & Materials Engineering',
    discipline: 'Engineering',
    description: 'Load-bearing joints, thermal strain cracks, deflection measurements, and material certifications.',
    color: '#3b82f6', // Blue
    visible: true,
    locked: false,
    createdAt: '2026-06-10',
    author: 'Structural Engineering Team'
  },
  {
    id: 'grp_conservation',
    name: 'Conservation & Site Safety',
    discipline: 'Conservation',
    description: 'Environmental risk zones, temporary scaffolding perimeters, and active stabilization notes.',
    color: '#ef4444', // Red
    visible: true,
    locked: false,
    createdAt: '2026-06-12',
    author: 'Conservator Inspector'
  }
];

export const DEFAULT_SAMPLE_ANNOTATIONS: SpatialAnnotation[] = [
  {
    id: 'anno_1',
    groupId: 'grp_structural',
    title: 'North Canopy Cantilever Beam Junction',
    category: 'Structural Detail',
    geometryType: 'point',
    description: 'Critical structural load node inspected during Phase 2 spatial survey. The aluminum tension rod anchorage shows high stress concentration under thermal expansion modeling.',
    color: '#3b82f6', // Blue
    position: { x: 0.8, y: 1.8, z: 0.5 },
    images: [
      {
        id: 'img_1',
        caption: 'High-resolution field photograph of cantilever connection plate',
        url: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?auto=format&fit=crop&w=800&q=80'
      },
      {
        id: 'img_2',
        caption: 'Stress distribution heat map from FEA simulation',
        url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80'
      }
    ],
    pdfs: [
      {
        id: 'pdf_1',
        name: 'Structural_Inspection_Report_2026.pdf',
        url: SAMPLE_PDF_URL,
        fileSize: '2.4 MB',
        description: 'Complete non-destructive acoustic emission test results and material certs.'
      }
    ],
    metadata: [
      { key: 'Elevation (Z)', value: '+1.85 m' },
      { key: 'Material Spec', value: 'Alloy 6061-T6' },
      { key: 'Safety Factor', value: '2.45' },
      { key: 'Survey Date', value: '2026-06-14' },
      { key: 'Lead Researcher', value: 'Dr. Aris (Thesis Lab)' }
    ],
    interpretiveThemes: ['Engineering Mastery', 'Architectural Anatomy'],
    audienceNarration: 'Look up at this soaring cantilever beam junction! Constructed from precision aeronautic-grade aluminum alloy, this structural node anchors the entire north sheltering canopy over the visitor concourse.\n\nWhile structural engineers monitor micro-deflections caused by summer heat waves, this cantilever provides essential climate protection for visitors below and preserves the heritage courtyard underneath.',
    audienceNarrationTone: 'story',
    audienceNarrationSource: 'gemini-3.7-flash',
    audienceNarrationCompiledAt: '2026-06-14T10:30:00Z',
    narrations: [
      {
        id: 'narr_1_story',
        title: 'Soaring Canopy & The Courtyard Shield',
        tone: 'story',
        knowledgeLevel: 'general',
        targetTheme: 'Architectural Anatomy',
        isDefault: true,
        text: 'Look up at this soaring cantilever beam junction! Constructed from precision aeronautic-grade aluminum alloy, this structural node anchors the entire north sheltering canopy over the visitor concourse.\n\nWhile structural engineers monitor micro-deflections caused by summer heat waves, this cantilever provides essential climate protection for visitors below and preserves the heritage courtyard underneath.',
        createdAt: '2026-06-14T10:30:00Z'
      },
      {
        id: 'narr_1_academic',
        title: 'Cantilever Finite Element Analysis',
        tone: 'academic',
        knowledgeLevel: 'specialist',
        targetTheme: 'Engineering Mastery',
        isDefault: false,
        text: 'Non-linear finite element modeling indicates localized Von Mises stress concentrations of 142 MPa at the alloy 6061-T6 pin connection. Acoustic emission sensors verify that cyclic diurnal thermal expansion remains within elastic design tolerances (Safety Factor: 2.45).',
        createdAt: '2026-06-14T11:15:00Z'
      },
      {
        id: 'narr_1_educational',
        title: 'How Cantilevers Defy Gravity',
        tone: 'educational',
        knowledgeLevel: 'introductory',
        targetTheme: 'Engineering Mastery',
        isDefault: false,
        text: 'Imagine a diving board extending far over a pool without any legs underneath—that is how a cantilever works! Strong anchorage brackets at this joint pull inward with immense counter-balancing force, enabling the roof to float weightlessly above the walkway.',
        createdAt: '2026-06-14T11:45:00Z'
      }
    ],
    themeNarrationBindings: {
      'Architectural Anatomy': 'narr_1_story',
      'Engineering Mastery': 'narr_1_academic'
    },
    comments: [
      {
        id: 'cmt_1',
        authorName: 'Marcus Bennett',
        authorRole: 'Municipal Worker',
        text: 'Our municipal maintenance crew inspected this cantilever during annual bridge upkeep. The vibration dampeners appear intact, but thermal strain should be monitored in summer.',
        createdAt: '2026-06-15T14:22:00Z',
        upvotes: 8,
        downvotes: 0
      },
      {
        id: 'cmt_2',
        authorName: 'Dr. Selen Yilmaz',
        authorRole: 'Epigrapher',
        text: 'Note the stamped foundry seal near the bracket fastener; it matches the 1928 municipal foundry records.',
        createdAt: '2026-06-16T09:15:00Z',
        upvotes: 12,
        downvotes: 1
      },
      {
        id: 'cmt_3',
        authorName: 'Elena Rostova',
        authorRole: 'Local Resident',
        text: 'This canopy provides critical shade for the heritage courtyard pathway during noon hours.',
        createdAt: '2026-06-17T11:40:00Z',
        upvotes: 5,
        downvotes: 0
      }
    ],
    createdAt: '2026-06-14',
    author: 'Thesis Researcher'
  },
  {
    id: 'anno_2',
    groupId: 'grp_structural',
    title: 'Roof Membrane Structural Crack Line',
    category: 'Field Note',
    geometryType: 'polyline',
    description: '3D spatial line tracing of micro-fracture along roof seam coping. 1.8m linear span mapped via photogrammetry drone scan.',
    color: '#f59e0b', // Amber
    position: { x: 0.0, y: 2.2, z: 0.0 },
    points: [
      { x: -0.8, y: 2.1, z: -0.4 },
      { x: -0.2, y: 2.2, z: -0.1 },
      { x: 0.4, y: 2.25, z: 0.2 },
      { x: 0.9, y: 2.2, z: 0.6 }
    ],
    images: [
      {
        id: 'img_crack',
        caption: 'Macro photograph of surface crack expansion',
        url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80'
      }
    ],
    pdfs: [],
    metadata: [
      { key: 'Total Crack Length', value: '1.84 m' },
      { key: 'Max Crack Width', value: '1.2 mm' },
      { key: 'Sealing Status', value: 'Action Required' }
    ],
    interpretiveThemes: ['Conservation Challenges', 'Material Decay & Weathering'],
    audienceNarration: 'Meticulous photogrammetric drone scans captured this delicate 1.84-meter stress fracture along the roof seam coping.\n\nOver decades of seasonal rain and freeze-thaw cycles, moisture has slowly penetrated the micro-crevices. Conservation specialists are applying specialized breathable hydraulic lime mortars to preserve the structural membrane without altering the historic stone patina.',
    audienceNarrationTone: 'story',
    audienceNarrationSource: 'gemini-3.7-flash',
    audienceNarrationCompiledAt: '2026-06-20T14:00:00Z',
    narrations: [
      {
        id: 'narr_2_story',
        title: 'The Scar of Time: Weathering the Monument',
        tone: 'story',
        knowledgeLevel: 'general',
        targetTheme: 'Material Decay & Weathering',
        isDefault: true,
        text: 'Meticulous photogrammetric drone scans captured this delicate 1.84-meter stress fracture along the roof seam coping.\n\nOver decades of seasonal rain and freeze-thaw cycles, moisture has slowly penetrated the micro-crevices. Conservation specialists are applying specialized breathable hydraulic lime mortars to preserve the structural membrane without altering the historic stone patina.',
        createdAt: '2026-06-20T14:00:00Z'
      },
      {
        id: 'narr_2_academic',
        title: 'Hygrothermal Stone Degradation Mechanism',
        tone: 'academic',
        knowledgeLevel: 'specialist',
        targetTheme: 'Conservation Challenges',
        isDefault: false,
        text: 'Micro-photogrammetric profiling reveals sub-millimeter fissure propagation (max aperture 1.2 mm) governed by differential thermal expansion coefficients between mortar beddings and ashlar stone blocks. Capillary condensation during winter isotherm cycles accelerates interstitial salt crystallization.',
        createdAt: '2026-06-20T15:20:00Z'
      }
    ],
    themeNarrationBindings: {
      'Material Decay & Weathering': 'narr_2_story',
      'Conservation Challenges': 'narr_2_academic'
    },
    comments: [
      {
        id: 'cmt_4',
        authorName: 'Tariq Al-Mansoor',
        authorRole: 'Conservationist',
        text: 'Water intrusion risk is severe here before winter frost cycles. We recommend applying breathable hydraulic lime mortar rather than Portland cement.',
        createdAt: '2026-06-21T16:04:00Z',
        upvotes: 14,
        downvotes: 0
      }
    ],
    createdAt: '2026-06-20',
    author: 'Drone Survey Unit'
  },
  {
    id: 'anno_3',
    groupId: 'grp_geology',
    title: 'Soil Foundation Sampling Area',
    category: 'Sample Site',
    geometryType: 'polygon',
    description: 'Enclosed 3D spatial polygon defining soil compaction test perimeter. High clay content detected in core borings.',
    color: '#10b981', // Emerald
    position: { x: -1.0, y: 0.05, z: -0.5 },
    points: [
      { x: -1.5, y: 0.02, z: -1.0 },
      { x: -0.5, y: 0.02, z: -1.0 },
      { x: -0.5, y: 0.02, z: 0.0 },
      { x: -1.5, y: 0.02, z: 0.0 }
    ],
    images: [],
    pdfs: [
      {
        id: 'pdf_2',
        name: 'Geotechnical_Core_Analysis_BH4.pdf',
        url: SAMPLE_PDF_URL,
        fileSize: '1.8 MB',
        description: 'Borehole log sheet and hydrometer grain size distribution curves.'
      }
    ],
    metadata: [
      { key: 'Polygon Surface Area', value: '1.00 m²' },
      { key: 'Borehole Depth', value: '4.50 m' },
      { key: 'Bearing Capacity', value: '280 kPa' }
    ],
    interpretiveThemes: ['Site Geology & Foundations'],
    audienceNarration: 'Below our feet lies the unseen bedrock supporting this entire monument! Geotechnical engineers drilled deep core boreholes down to 4.5 meters, revealing ancient alluvial clay strata with a bearing capacity of 280 kPa that has stabilized the foundation for centuries.',
    audienceNarrationTone: 'educational',
    audienceNarrationSource: 'gemini-3.7-flash',
    audienceNarrationCompiledAt: '2026-06-18T16:20:00Z',
    createdAt: '2026-06-18',
    author: 'Geological Field Unit'
  },
  {
    id: 'anno_4',
    groupId: 'grp_conservation',
    title: 'High Clearance Danger Zone Volume',
    category: 'Danger Zone',
    geometryType: 'polygon',
    description: '3D spatial safety zone boundary during overhead crane maintenance operations.',
    color: '#ef4444', // Red
    position: { x: 0.0, y: 0.1, z: 0.8 },
    points: [
      { x: -0.8, y: 0.05, z: 0.8 },
      { x: 0.8, y: 0.05, z: 0.8 },
      { x: 0.8, y: 0.05, z: 1.8 },
      { x: -0.8, y: 0.05, z: 1.8 }
    ],
    images: [],
    pdfs: [
      {
        id: 'pdf_4',
        name: 'Site_Safety_Standard_Operating_Procedure.pdf',
        url: SAMPLE_PDF_URL,
        fileSize: '950 KB',
        description: 'OSHA compliance documentation and clearance map.'
      }
    ],
    metadata: [
      { key: 'Clearance Area', value: '1.60 m × 1.00 m' },
      { key: 'Risk Rating', value: 'Level 3 (Elevated)' },
      { key: 'Protocol ID', value: 'SOP-3DGIS-09' }
    ],
    interpretiveThemes: ['Site Safety & Stewardship'],
    audienceNarration: 'Preserving monumental architecture requires stringent safety perimeters. This demarcated zone coordinates overhead restoration scaffolding, ensuring public visitors and conservators remain safe while active consolidation works are conducted aloft.',
    audienceNarrationTone: 'engaging',
    audienceNarrationSource: 'gemini-3.7-flash',
    audienceNarrationCompiledAt: '2026-07-10T11:00:00Z',
    createdAt: '2026-07-10',
    author: 'Safety Inspector'
  },
  {
    id: 'anno_5',
    groupId: 'grp_arthistory',
    title: 'Polychrome Pigment Stratigraphy Sample',
    category: 'Photo / Image',
    geometryType: 'point',
    description: 'XRF spectrometer analysis revealed remnants of Egyptian Blue (calcium copper silicate) and lapis lazuli pigment on the capital carving.',
    color: '#8b5cf6', // Violet
    position: { x: -0.5, y: 1.5, z: 0.3 },
    images: [
      {
        id: 'img_pigment',
        caption: 'Microscope micrograph of pigment cross-section',
        url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=800&q=80'
      }
    ],
    pdfs: [],
    metadata: [
      { key: 'Pigment Type', value: 'Egyptian Blue / Lapis' },
      { key: 'Historical Era', value: 'Hellenistic / Classical' },
      { key: 'Analysis Tool', value: 'Handheld XRF Scanner' }
    ],
    interpretiveThemes: ['Art History & Iconography', 'Ancient Pigments & Color'],
    audienceNarration: 'Imagine this monochrome stone alive with brilliant, vibrant colors! Using portable X-ray fluorescence spectroscopy, art historians uncovered microscopic crystalline traces of Egyptian Blue and rare lapis lazuli.\n\nIn antiquity, these luminous pigments would have radiated under bright sunlight, transforming this capital carving into an unforgettable visual masterpiece.',
    audienceNarrationTone: 'poetic',
    audienceNarrationSource: 'gemini-3.7-flash',
    audienceNarrationCompiledAt: '2026-07-15T09:45:00Z',
    narrations: [
      {
        id: 'narr_5_poetic',
        title: 'Luminous Pigments of Antiquity',
        tone: 'poetic',
        knowledgeLevel: 'general',
        targetTheme: 'Ancient Pigments & Color',
        isDefault: true,
        text: 'Imagine this monochrome stone alive with brilliant, vibrant colors! Using portable X-ray fluorescence spectroscopy, art historians uncovered microscopic crystalline traces of Egyptian Blue and rare lapis lazuli.\n\nIn antiquity, these luminous pigments would have radiated under bright sunlight, transforming this capital carving into an unforgettable visual masterpiece.',
        createdAt: '2026-07-15T09:45:00Z'
      },
      {
        id: 'narr_5_academic',
        title: 'Cuprorivaite XRF Spectrometric Characterization',
        tone: 'academic',
        knowledgeLevel: 'specialist',
        targetTheme: 'Art History & Iconography',
        isDefault: false,
        text: 'Handheld energy-dispersive X-ray fluorescence (ED-XRF) detected distinct copper (Cu-Kα at 8.04 keV) and calcium peaks characteristic of synthesized cuprorivaite (CaCuSi4O10). Stratigraphic cross-sections confirm a calcite ground preparatory layer beneath the pigment application.',
        createdAt: '2026-07-15T10:10:00Z'
      }
    ],
    themeNarrationBindings: {
      'Ancient Pigments & Color': 'narr_5_poetic',
      'Art History & Iconography': 'narr_5_academic'
    },
    createdAt: '2026-07-15',
    author: 'Prof. Vance (Art History)'
  }
];
