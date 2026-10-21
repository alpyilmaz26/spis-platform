import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Lazy Google GenAI initialization
let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (
    !apiKey ||
    apiKey === 'MY_GEMINI_API_KEY' ||
    apiKey === 'undefined' ||
    apiKey === 'null' ||
    apiKey.trim() === '' ||
    apiKey.length < 10
  ) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey: apiKey.trim() });
  }
  return aiClient;
}

// Fallback intelligent compilation when Gemini key is missing or offline
function generateLocalAudienceNarration(data: {
  title: string;
  category?: string;
  discipline?: string;
  description?: string;
  metadata?: Array<{ key: string; value: string }>;
  interpretiveThemes?: string[];
  tone?: string;
  knowledgeLevel?: string;
  targetTheme?: string;
}): string {
  const {
    title,
    category,
    discipline,
    description,
    metadata = [],
    interpretiveThemes = [],
    tone = 'story',
    knowledgeLevel = 'general',
    targetTheme
  } = data;
  
  const validMeta = metadata.filter((m) => m.key && m.value);
  const themeFocus = targetTheme || (interpretiveThemes.length > 0 ? interpretiveThemes.join(' & ') : category || 'Heritage Conservation');

  let toneIntro = `Welcome to this featured exhibit stop highlighting **${title}**.`;
  if (tone === 'academic') {
    toneIntro = `Architectural and conservation assessment of **${title}** demonstrates key diagnostic evidence within ${themeFocus}.`;
  } else if (tone === 'story') {
    toneIntro = `At the very heart of the site stands **${title}**—a compelling chapter in the living story of ${themeFocus}.`;
  } else if (tone === 'poetic') {
    toneIntro = `Standing before **${title}**, one senses the layered echoes of time, memory, and craftsmanship woven into every contour.`;
  } else if (tone === 'educational') {
    toneIntro = `This spatial exhibit station focuses on **${title}**, illustrating fundamental principles of ${discipline || 'applied heritage science'}.`;
  } else if (tone === 'investigative') {
    toneIntro = `Forensic spatial analysis of **${title}** uncovers crucial physical evidence and structural clues regarding its evolution.`;
  } else if (tone === 'child-friendly') {
    toneIntro = `Look closely at **${title}**! Here is an exciting discovery that tells a real-world story of how this monument was engineered and protected.`;
  } else if (tone === 'concise') {
    toneIntro = `**${title}** • Curated highlight for ${themeFocus}.`;
  }

  let body = '';
  if (description && description.trim().length > 0) {
    if (knowledgeLevel === 'academic' || knowledgeLevel === 'undergraduate') {
      body = `Field survey observations document: ${description.trim()}`;
    } else if (knowledgeLevel === 'elementary') {
      body = `Specialists discovered something neat here: ${description.trim()}`;
    } else {
      body = `Curators and field specialists note: ${description.trim()}`;
    }
  } else {
    body = `This location represents a vital anchor within the ${themeFocus} thematic journey, offering visitors a direct window into structural continuity.`;
  }

  let factsSummary = '';
  if (validMeta.length > 0) {
    const formattedHighlights = validMeta.slice(0, 4).map((m) => `**${m.key}** (${m.value})`).join(', ');
    factsSummary = ` Key scientific findings recorded on-site include ${formattedHighlights}. Together, these measurements help conservators ensure this heritage structure endures for future generations.`;
  }

  return `${toneIntro}\n\n${body}${factsSummary}`;
}

// API Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Compile for Audience AI Endpoint
app.post('/api/compile-audience-narration', async (req, res) => {
  try {
    const {
      title,
      category,
      discipline,
      description,
      metadata = [],
      interpretiveThemes = [],
      tone = 'story',
      knowledgeLevel = 'general',
      targetTheme = '',
      customInstruction = '',
      geometryType = 'point'
    } = req.body;

    if (!title || typeof title !== 'string') {
      return res.status(400).json({ error: 'Title is required' });
    }

    const ai = getGenAI();

    // If Gemini API is available, generate using gemini-3.7-flash
    if (ai) {
      const tonePrompts: Record<string, string> = {
        academic: 'Academic, scholarly, rigorous, precise terminology, analytical conservation/architectural perspective',
        story: 'Engaging, immersive dramatic storytelling, narrative prose, captivating atmosphere and historical journey',
        educational: 'Accessible museum educator style, pedagogical clarity, clear concept explanation with engaging tone',
        poetic: 'Evocative, atmospheric, lyrical heritage storytelling with aesthetic appreciation',
        investigative: 'Architectural forensics, investigative enquiry, mystery solving, deduction from physical evidence',
        'child-friendly': 'Curious, enthusiastic, friendly, simplified concepts with fun analogies for young learners and families',
        concise: 'Crisp, high-density museum placard style, concise takeaways, punchy bulleted or brief paragraphs'
      };

      const levelPrompts: Record<string, string> = {
        general: 'General Public / Curious Museum Visitors (accessible vocabulary, engaging explanations, avoid excessive jargon)',
        elementary: 'Elementary / Young Learners & Families (vivid metaphors, simple terms, encouraging active observation of the 3D model)',
        enthusiast: 'Architecture & History Enthusiasts (rich historical context, structural depth, material insights)',
        undergraduate: 'Undergraduate / Architecture & Conservation Students (professional domain terminology, structural typology, survey methodology)',
        academic: 'Academic Specialists & Researchers (scientific rigor, technical precision, pathology diagnostics, engineering dynamics)'
      };

      const selectedToneGuidance = tonePrompts[tone] || tonePrompts.story;
      const selectedLevelGuidance = levelPrompts[knowledgeLevel] || levelPrompts.general;

      const themeContext = targetTheme 
        ? `Target Interpretive Theme / Virtual Tour Focus: "${targetTheme}". Ensure the narrative directly connects this spatial feature to this thematic angle.`
        : `Tagged Interpretive Themes: ${interpretiveThemes.length > 0 ? interpretiveThemes.join(', ') : 'None specified'}`;

      const prompt = `You are a world-class Museum Exhibition Curator, Heritage Interpretation Specialist, and Science Communicator.

A researcher/conservation specialist has recorded technical spatial data for a 3D feature in a Spatial Information System (SPIS). Your job is to translate and compile these raw scientific field notes, measurements, and attributes into an exhibition narrative tailored for a specific audience profile and interpretive theme.

--- TECHNICAL RECORD DATA ---
Feature Title: ${title}
Discipline / Layer: ${discipline || 'General Heritage & Spatial Survey'}
Classification: ${category || 'Spatial Landmark'}
Marker Type: ${geometryType}
${themeContext}

Raw Field Notes & Observations:
${description || 'No raw notes provided.'}

Recorded Field Attributes / Measurements:
${
  metadata.length > 0
    ? metadata.filter((m: any) => m.key && m.value).map((m: any) => `- ${m.key}: ${m.value}`).join('\n')
    : 'None recorded'
}

--- CURATORIAL GUIDELINES ---
1. Tone Mode: ${selectedToneGuidance}.
2. Audience Knowledge Level: ${selectedLevelGuidance}.
${targetTheme ? `3. Thematic Lens: Frame the narrative specifically around the "${targetTheme}" theme so visitors experiencing that specific tour get a dedicated perspective.` : ''}
${customInstruction ? `Additional Specialist Instruction: ${customInstruction}` : ''}
4. Format: 2 to 3 concise, vivid, flowing paragraphs (around 120-220 words total).
5. Do NOT include generic markdown headers (e.g. do not write "### Overview" or "**Narration:**").
6. Highlight what visitors should look for in the 3D model, connect technical measurements to real-world significance, and maintain factual truthfulness without inventing unmentioned data.`;

      // Prioritize lightweight, ultra-fast Gemini Flash Lite models with high throughput and low cost per token, cascading smoothly
      const modelsToTry = ['gemini-3.1-flash-lite', 'gemini-2.5-flash', 'gemini-3.7-flash'];
      for (const modelName of modelsToTry) {
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents: prompt
          });

          if (response.text && response.text.trim().length > 0) {
            return res.json({
              success: true,
              narration: response.text.trim(),
              tone,
              knowledgeLevel,
              targetTheme,
              source: modelName
            });
          }
        } catch (geminiError: any) {
          console.warn(`Gemini model ${modelName} encountered an error:`, geminiError?.message || geminiError);
        }
      }
    }

    // Fallback if API key is not active or offline
    const localNarration = generateLocalAudienceNarration({
      title,
      category,
      discipline,
      description,
      metadata,
      interpretiveThemes,
      tone,
      knowledgeLevel,
      targetTheme
    });

    return res.json({
      success: true,
      narration: localNarration,
      tone,
      knowledgeLevel,
      targetTheme,
      source: 'local-synthesizer'
    });
  } catch (error: any) {
    console.warn('Error processing audience narration request:', error?.message || error);
    
    // Provide graceful fallback
    const fallbackNarration = generateLocalAudienceNarration(req.body || { title: 'Spatial Record' });
    return res.json({
      success: true,
      narration: fallbackNarration,
      tone: req.body?.tone || 'story',
      knowledgeLevel: req.body?.knowledgeLevel || 'general',
      targetTheme: req.body?.targetTheme || '',
      source: 'local-synthesizer'
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`3D SPIS Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
