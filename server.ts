import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import JSZip from 'jszip';
import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new Error(
      'GEMINI_API_KEY is not configured. Add your key in the Settings > Secrets panel to run AI analysis.'
    );
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function decodeXmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(Number(num)))
    .replace(/\s+/g, ' ')
    .trim();
}

function stripXmlTags(xml: string): string {
  return decodeXmlEntities(
    xml
      .replace(/<\/(w:p|a:p|p|row|si|tr|div|br)>/gi, '\n')
      .replace(/<[^>]+>/g, ' ')
  );
}

async function extractDocumentText(
  name: string,
  mimeType: string,
  dataBase64: string
): Promise<{
  supportedForAi: boolean;
  extractionMode: 'text' | 'multimodal' | 'unsupported';
  extractedText: string | null;
  reason?: string;
}> {
  const ext = path.extname(name).toLowerCase();
  const buffer = Buffer.from(dataBase64, 'base64');

  if (
    ext === '.txt' ||
    ext === '.csv' ||
    ext === '.md' ||
    ext === '.json' ||
    ext === '.tsv' ||
    mimeType.startsWith('text/')
  ) {
    const text = buffer.toString('utf8').trim();
    return {
      supportedForAi: text.length > 0,
      extractionMode: text.length > 0 ? 'text' : 'unsupported',
      extractedText: text || null,
      reason: text.length === 0 ? 'The uploaded text file appears to be empty.' : undefined,
    };
  }

  if (
    ext === '.pdf' ||
    mimeType === 'application/pdf' ||
    ext === '.png' ||
    ext === '.jpg' ||
    ext === '.jpeg' ||
    ext === '.webp' ||
    mimeType.startsWith('image/')
  ) {
    return {
      supportedForAi: true,
      extractionMode: 'multimodal',
      extractedText: null,
    };
  }

  if (ext === '.docx') {
    try {
      const zip = await JSZip.loadAsync(buffer);
      const docXml = await zip.file('word/document.xml')?.async('string');
      if (!docXml) {
        return {
          supportedForAi: false,
          extractionMode: 'unsupported',
          extractedText: null,
          reason: 'Could not read document body from this .docx file. File retained in project.',
        };
      }
      const extracted = stripXmlTags(docXml);
      return {
        supportedForAi: extracted.length > 0,
        extractionMode: extracted.length > 0 ? 'text' : 'unsupported',
        extractedText: extracted || null,
        reason: extracted.length === 0 ? 'No readable text found in .docx file.' : undefined,
      };
    } catch {
      return {
        supportedForAi: false,
        extractionMode: 'unsupported',
        extractedText: null,
        reason: 'This .docx archive could not be parsed. File retained in project.',
      };
    }
  }

  if (ext === '.pptx') {
    try {
      const zip = await JSZip.loadAsync(buffer);
      const slideNames = Object.keys(zip.files)
        .filter((f) => /^ppt\/slides\/slide\d+\.xml$/i.test(f))
        .sort((a, b) => {
          const na = Number(a.match(/slide(\d+)/i)?.[1] || 0);
          const nb = Number(b.match(/slide(\d+)/i)?.[1] || 0);
          return na - nb;
        });

      const chunks: string[] = [];
      for (const slideName of slideNames) {
        const xml = await zip.file(slideName)?.async('string');
        if (xml) {
          const slideText = stripXmlTags(xml);
          if (slideText) {
            const slideNum = slideName.match(/slide(\d+)/i)?.[1] || '';
            chunks.push(`[Slide ${slideNum}]\n${slideText}`);
          }
        }
      }
      const extracted = chunks.join('\n\n').trim();
      return {
        supportedForAi: extracted.length > 0,
        extractionMode: extracted.length > 0 ? 'text' : 'unsupported',
        extractedText: extracted || null,
        reason: extracted.length === 0 ? 'No readable slide text found in .pptx file.' : undefined,
      };
    } catch {
      return {
        supportedForAi: false,
        extractionMode: 'unsupported',
        extractedText: null,
        reason: 'This .pptx presentation could not be parsed. File retained in project.',
      };
    }
  }

  if (ext === '.xlsx') {
    try {
      const zip = await JSZip.loadAsync(buffer);
      const sharedStringsXml = await zip.file('xl/sharedStrings.xml')?.async('string');
      const sharedStrings: string[] = [];
      if (sharedStringsXml) {
        const siMatches = sharedStringsXml.match(/<si[\s\S]*?<\/si>/gi) || [];
        for (const si of siMatches) {
          sharedStrings.push(stripXmlTags(si));
        }
      }

      const sheetFiles = Object.keys(zip.files)
        .filter((f) => /^xl\/worksheets\/sheet\d+\.xml$/i.test(f))
        .sort();

      const sheetTexts: string[] = [];
      for (const sheetFile of sheetFiles) {
        const xml = await zip.file(sheetFile)?.async('string');
        if (!xml) continue;
        const rows: string[] = [];
        const rowMatches = xml.match(/<row[\s\S]*?<\/row>/gi) || [];
        for (const rowXml of rowMatches) {
          const cells: string[] = [];
          const cellMatches = rowXml.match(/<c[\s\S]*?<\/c>/gi) || [];
          for (const cellXml of cellMatches) {
            const isShared = /\bt="s"/.test(cellXml);
            const inlineMatch = cellXml.match(/<is>[\s\S]*?<\/is>/i);
            const valMatch = cellXml.match(/<v>([\s\S]*?)<\/v>/i);
            if (inlineMatch) {
              cells.push(stripXmlTags(inlineMatch[0]));
            } else if (valMatch) {
              const rawVal = valMatch[1].trim();
              if (isShared) {
                const idx = Number(rawVal);
                if (!Number.isNaN(idx) && sharedStrings[idx] !== undefined) {
                  cells.push(sharedStrings[idx]);
                }
              } else {
                cells.push(rawVal);
              }
            }
          }
          if (cells.some(Boolean)) {
            rows.push(cells.join(' | '));
          }
        }
        if (rows.length > 0) {
          sheetTexts.push(`[${path.basename(sheetFile, '.xml')}]\n${rows.join('\n')}`);
        }
      }

      const extracted = sheetTexts.join('\n\n').trim();
      return {
        supportedForAi: extracted.length > 0,
        extractionMode: extracted.length > 0 ? 'text' : 'unsupported',
        extractedText: extracted || null,
        reason: extracted.length === 0 ? 'No readable cells found in .xlsx workbook.' : undefined,
      };
    } catch {
      return {
        supportedForAi: false,
        extractionMode: 'unsupported',
        extractedText: null,
        reason: 'This .xlsx workbook could not be parsed. File retained in project.',
      };
    }
  }

  if (ext === '.doc') {
    const headerHex = buffer.subarray(0, 4).toString('hex').toLowerCase();
    // Plain text or RTF saved with .doc extension
    if (headerHex !== 'd0cf11e0') {
      const raw = buffer.toString('utf8');
      if (raw.startsWith('{\\rtf')) {
        const plain = raw
          .replace(/\\par[d]?/g, '\n')
          .replace(/\\[a-z]+-?\d*\s?/gi, '')
          .replace(/[{}]/g, '')
          .trim();
        if (plain.length > 10) {
          return {
            supportedForAi: true,
            extractionMode: 'text',
            extractedText: plain,
          };
        }
      }
    }
    return {
      supportedForAi: false,
      extractionMode: 'unsupported',
      extractedText: null,
      reason:
        'Legacy binary .doc (Word 97–2003) cannot be analysed directly. Your file has been retained—save as .docx, .pdf, or .txt to analyse its text.',
    };
  }

  return {
    supportedForAi: false,
    extractionMode: 'unsupported',
    extractedText: null,
    reason: `The "${ext || mimeType || 'unknown'}" format cannot be extracted for AI analysis. Your file has been retained in the project.`,
  };
}

function parseFigmaFileKey(input: string): string | null {
  const trimmed = input.trim();
  const match = trimmed.match(/figma\.com\/(?:file|design|proto)\/([a-zA-Z0-9]+)/i);
  if (match?.[1]) return match[1];
  if (/^[a-zA-Z0-9]{10,40}$/.test(trimmed)) return trimmed;
  return null;
}

async function startServer() {
  const app = express();
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
      res.sendStatus(204);
      return;
    }
    next();
  });
  app.use(express.json({ limit: '50mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.post('/api/extract-document', async (req, res) => {
    try {
      const { name, mimeType, dataBase64 } = req.body as {
        name: string;
        mimeType: string;
        dataBase64: string;
      };
      if (!name || !dataBase64) {
        res.status(400).json({ error: 'Missing file name or data.' });
        return;
      }
      const result = await extractDocumentText(name, mimeType || '', dataBase64);
      res.json(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to read uploaded file.';
      res.status(500).json({ error: message });
    }
  });

  app.post('/api/analyze-research', async (req, res) => {
    try {
      const { projectName, files, manualNotes } = req.body as {
        projectName: string;
        files: Array<{
          id: string;
          name: string;
          mimeType: string;
          extractedText?: string | null;
          dataBase64?: string | null;
          extractionMode?: string;
          supportedForAi?: boolean;
        }>;
        manualNotes: string;
      };

      const ai = getGeminiClient();
      const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];
      const warnings: string[] = [];
      let analyzableCount = 0;

      if (manualNotes && manualNotes.trim().length > 0) {
        analyzableCount++;
        parts.push({
          text: `=== SOURCE: Manual Research Notes ===\n${manualNotes.trim()}`,
        });
      }

      for (const file of files || []) {
        if (file.supportedForAi === false) {
          warnings.push(`${file.name}: retained in project but skipped from AI synthesis (unsupported format).`);
          continue;
        }
        if (file.extractedText && file.extractedText.trim().length > 0) {
          analyzableCount++;
          parts.push({
            text: `=== SOURCE FILE: ${file.name} ===\n${file.extractedText.slice(0, 60000)}`,
          });
        } else if (file.extractionMode === 'multimodal' && file.dataBase64) {
          analyzableCount++;
          parts.push({
            text: `=== SOURCE FILE (Document/Image): ${file.name} ===`,
          });
          parts.push({
            inlineData: {
              mimeType: file.mimeType || 'application/pdf',
              data: file.dataBase64,
            },
          });
        }
      }

      if (analyzableCount === 0) {
        res.status(400).json({
          error:
            'No readable research text, PDFs, images, or notes were found to analyse. Please add research notes or upload a supported file (.pdf, .docx, .txt, .csv, .xlsx, .pptx, or images).',
        });
        return;
      }

      parts.push({
        text: `Analyse the research materials above for project "${projectName || 'Untitled Project'}".
Strict grounding rules:
1. Extract ONLY findings, patterns, user needs, and research gaps that are directly supported by the provided files or manual notes.
2. NEVER invent quotes, participant IDs, metrics, or findings not present in the provided sources.
3. For every insight, include an accurate "evidence" quote or factual excerpt from the source and the exact "sourceName" (filename or "Manual Notes").
4. Keep titles and summaries concise, clear, and practical for a UX designer.`,
      });

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: { parts },
        config: {
          systemInstruction:
            'You are a rigorous UX research synthesis assistant. You strictly ground every insight in the actual user-provided artifacts and never fabricate quotes or findings.',
          thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              insights: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    category: {
                      type: Type.STRING,
                      description:
                        'One of: key_finding, common_pattern, user_need, research_gap',
                    },
                    tag: {
                      type: Type.STRING,
                      description: 'Short 1-3 word theme label (e.g. Checkout Friction)',
                    },
                    title: {
                      type: Type.STRING,
                      description: 'Concise 1-sentence insight statement',
                    },
                    evidence: {
                      type: Type.STRING,
                      description: 'Verbatim quote or factual evidence excerpt from the source',
                    },
                    sourceName: {
                      type: Type.STRING,
                      description: 'Exact filename or "Manual Notes"',
                    },
                  },
                  required: ['category', 'tag', 'title', 'evidence', 'sourceName'],
                },
              },
            },
            required: ['insights'],
          },
        },
      });

      const parsed = JSON.parse((response.text ?? '{"insights":[]}').trim()) as {
        insights: Array<{
          category: string;
          tag: string;
          title: string;
          evidence: string;
          sourceName: string;
        }>;
      };

      const validCategories = new Set([
        'key_finding',
        'common_pattern',
        'user_need',
        'research_gap',
      ]);

      const normalized = (parsed.insights || []).map((item, idx) => ({
        id: `insight_${Date.now()}_${idx}`,
        category: validCategories.has(item.category) ? item.category : 'key_finding',
        tag: item.tag || 'Finding',
        title: item.title,
        evidence: item.evidence,
        sourceName: item.sourceName,
      }));

      res.json({ insights: normalized, warnings });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Research analysis failed.';
      res.status(500).json({ error: message });
    }
  });

  app.post('/api/trace-analysis', async (req, res) => {
    try {
      const { projectName, insights, screens } = req.body as {
        projectName: string;
        insights: Array<{
          id: string;
          category: string;
          tag: string;
          title: string;
          evidence: string;
          sourceName: string;
        }>;
        screens: Array<{
          id: string;
          name: string;
          mimeType: string;
          dataBase64: string;
        }>;
      };

      if (!insights || insights.length === 0) {
        res.status(400).json({
          error: 'At least one research insight is required before running Trace Analysis.',
        });
        return;
      }
      if (!screens || screens.length === 0) {
        res.status(400).json({
          error: 'Please upload at least one design screenshot or load Figma frames first.',
        });
        return;
      }

      const ai = getGeminiClient();
      const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];

      const insightsSummary = insights
        .map(
          (ins) =>
            `- ID: ${ins.id}\n  Category: ${ins.category}\n  Insight: ${ins.title}\n  Evidence: "${ins.evidence}" (Source: ${ins.sourceName})`
        )
        .join('\n');

      parts.push({
        text: `Project: ${projectName || 'Untitled Project'}\n\n=== VERIFIED RESEARCH INSIGHTS ===\n${insightsSummary}`,
      });

      for (const screen of screens) {
        parts.push({
          text: `=== DESIGN SCREEN (id: "${screen.id}", name: "${screen.name}") ===`,
        });
        if (screen.dataBase64) {
          parts.push({
            inlineData: {
              mimeType: screen.mimeType || 'image/png',
              data: screen.dataBase64,
            },
          });
        }
      }

      parts.push({
        text: `Perform a strict UX Research-to-Design Trace Analysis comparing ONLY the research insights above with ONLY the uploaded design screens above.
Rules:
1. "supportedTraces": For UI elements/decisions visibly present in one of the uploaded screens that directly address a provided research insight, create a trace chain:
   - evidence: exact evidence/source from the provided insight
   - keyInsight: the matching insight statement
   - relatedScreenId: exact id of the matching screen
   - relatedScreenName: exact name of the matching screen
   - designDecision: concrete description of the UI decision visible in that screen
   - confidenceLabel: "High Confidence" or "Moderate Match"
2. "unsupportedDecisions": Visible UI patterns or design decisions in the uploaded screens that have NO supporting research insight among the provided insights (or conflict with them).
3. "unmatchedInsights": Provided research insights that are NOT visibly addressed in any of the uploaded screens.
4. NEVER invent research quotes or fabricate UI elements not visible in the uploaded screens.`,
      });

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: { parts },
        config: {
          systemInstruction:
            'You are a UX design provenance auditor. Correlate actual research insights with actual UI screens accurately without fabricating evidence or screen elements.',
          thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              supportedTraces: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    evidence: { type: Type.STRING },
                    keyInsight: { type: Type.STRING },
                    relatedScreenId: { type: Type.STRING },
                    relatedScreenName: { type: Type.STRING },
                    designDecision: { type: Type.STRING },
                    confidenceLabel: { type: Type.STRING },
                  },
                  required: [
                    'evidence',
                    'keyInsight',
                    'relatedScreenId',
                    'relatedScreenName',
                    'designDecision',
                    'confidenceLabel',
                  ],
                },
              },
              unsupportedDecisions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    screenId: { type: Type.STRING },
                    screenName: { type: Type.STRING },
                    designDecision: { type: Type.STRING },
                    reason: { type: Type.STRING },
                  },
                  required: ['screenId', 'screenName', 'designDecision', 'reason'],
                },
              },
              unmatchedInsights: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    insightId: { type: Type.STRING },
                    keyInsight: { type: Type.STRING },
                    evidence: { type: Type.STRING },
                    sourceName: { type: Type.STRING },
                    reason: { type: Type.STRING },
                  },
                  required: ['insightId', 'keyInsight', 'evidence', 'sourceName', 'reason'],
                },
              },
            },
            required: ['supportedTraces', 'unsupportedDecisions', 'unmatchedInsights'],
          },
        },
      });

      const parsed = JSON.parse((response.text ?? '{}').trim()) as {
        supportedTraces?: Array<{
          evidence: string;
          keyInsight: string;
          relatedScreenId: string;
          relatedScreenName: string;
          designDecision: string;
          confidenceLabel: string;
        }>;
        unsupportedDecisions?: Array<{
          screenId: string;
          screenName: string;
          designDecision: string;
          reason: string;
        }>;
        unmatchedInsights?: Array<{
          insightId: string;
          keyInsight: string;
          evidence: string;
          sourceName: string;
          reason: string;
        }>;
      };

      res.json({
        supportedTraces: (parsed.supportedTraces || []).map((t, i) => ({
          id: `trace_${Date.now()}_${i}`,
          ...t,
          confirmed: false,
          annotatedNote: '',
        })),
        unsupportedDecisions: (parsed.unsupportedDecisions || []).map((u, i) => ({
          id: `unsup_${Date.now()}_${i}`,
          ...u,
          reviewed: false,
          annotatedNote: '',
        })),
        unmatchedInsights: (parsed.unmatchedInsights || []).map((m, i) => ({
          id: `unmatch_${Date.now()}_${i}`,
          ...m,
          annotatedNote: '',
        })),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Trace analysis failed.';
      res.status(500).json({ error: message });
    }
  });

  // Figma OAuth status & real endpoints
  app.get('/api/figma/status', (_req, res) => {
    const oauthConfigured = Boolean(
      process.env.FIGMA_CLIENT_ID && process.env.FIGMA_CLIENT_SECRET
    );
    res.json({
      oauthConfigured,
      setupMessage: oauthConfigured
        ? null
        : 'Figma OAuth is not configured on this server (FIGMA_CLIENT_ID and FIGMA_CLIENT_SECRET are not set). Use the Screenshots tab to upload PNG, JPG, or WEBP UI screens directly.',
    });
  });

  app.get('/api/figma/auth', (req, res) => {
    const clientId = process.env.FIGMA_CLIENT_ID;
    if (!clientId || !process.env.FIGMA_CLIENT_SECRET) {
      res.status(503).json({
        error:
          'Figma OAuth is not configured on this server. Set FIGMA_CLIENT_ID and FIGMA_CLIENT_SECRET in the environment.',
      });
      return;
    }
    const baseUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
    const redirectUri = `${baseUrl}/api/figma/callback`;
    const state = Math.random().toString(36).slice(2);
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: 'file_content:read',
      state,
      response_type: 'code',
    });
    res.redirect(`https://www.figma.com/oauth?${params.toString()}`);
  });

  app.get('/api/figma/callback', async (req, res) => {
    const code = String(req.query.code || '');
    const clientId = process.env.FIGMA_CLIENT_ID;
    const clientSecret = process.env.FIGMA_CLIENT_SECRET;
    if (!code || !clientId || !clientSecret) {
      res.status(400).send('Missing Figma authorization code or server credentials.');
      return;
    }
    try {
      const baseUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
      const redirectUri = `${baseUrl}/api/figma/callback`;
      const tokenRes = await fetch('https://api.figma.com/v1/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          code,
          grant_type: 'authorization_code',
        }),
      });
      const tokenData = (await tokenRes.json()) as {
        access_token?: string;
        user_id?: string;
        error?: string;
      };
      if (!tokenRes.ok || !tokenData.access_token) {
        res.status(400).send(`Figma OAuth failed: ${tokenData.error || 'Unknown error'}`);
        return;
      }
      res.send(`<!doctype html><html><body><script>
        if (window.opener) {
          window.opener.postMessage({ type: 'FIGMA_OAUTH_TOKEN', accessToken: ${JSON.stringify(
            tokenData.access_token
          )} }, '*');
          window.close();
        }
      </script><p>Figma connected. You can close this window.</p></body></html>`);
    } catch {
      res.status(500).send('Failed to exchange Figma authorization code.');
    }
  });

  app.post('/api/figma/frames', async (req, res) => {
    try {
      const authHeader = req.headers.authorization || '';
      const token = authHeader.replace(/^Bearer\s+/i, '').trim();
      const { fileUrl } = req.body as { fileUrl: string };

      if (!token) {
        res.status(401).json({
          error: 'Figma authentication token is missing. Authorize Figma first.',
        });
        return;
      }

      const fileKey = parseFigmaFileKey(fileUrl || '');
      if (!fileKey) {
        res.status(400).json({
          error: 'Please enter a valid Figma design URL (e.g. https://www.figma.com/design/...).',
        });
        return;
      }

      const fileResp = await fetch(`https://api.figma.com/v1/files/${fileKey}?depth=2`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!fileResp.ok) {
        const errBody = await fileResp.text();
        res.status(fileResp.status).json({
          error: `Figma API error (${fileResp.status}): ${errBody}`,
        });
        return;
      }

      const fileJson = (await fileResp.json()) as {
        name?: string;
        document?: {
          children?: Array<{
            name: string;
            children?: Array<{ id: string; name: string; type: string }>;
          }>;
        };
      };

      const frames: Array<{ id: string; name: string }> = [];
      for (const page of fileJson.document?.children || []) {
        for (const node of page.children || []) {
          if (node.type === 'FRAME' || node.type === 'COMPONENT' || node.type === 'SECTION') {
            frames.push({ id: node.id, name: `${node.name}` });
          }
          if (frames.length >= 12) break;
        }
        if (frames.length >= 12) break;
      }

      if (frames.length === 0) {
        res.json({ fileName: fileJson.name || 'Figma File', screens: [] });
        return;
      }

      const idsParam = frames.map((f) => f.id).join(',');
      const imgResp = await fetch(
        `https://api.figma.com/v1/images/${fileKey}?ids=${encodeURIComponent(idsParam)}&format=png&scale=1`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const imgJson = (await imgResp.json()) as { images?: Record<string, string> };

      const screens: Array<{
        id: string;
        name: string;
        mimeType: string;
        dataBase64: string;
        sourceType: 'figma';
      }> = [];

      for (const frame of frames) {
        const imageUrl = imgJson.images?.[frame.id];
        if (!imageUrl) continue;
        const binResp = await fetch(imageUrl);
        if (!binResp.ok) continue;
        const arrBuf = await binResp.arrayBuffer();
        screens.push({
          id: `figma_${frame.id.replace(/[^a-zA-Z0-9]/g, '_')}`,
          name: frame.name,
          mimeType: 'image/png',
          dataBase64: Buffer.from(arrBuf).toString('base64'),
          sourceType: 'figma',
        });
      }

      res.json({ fileName: fileJson.name || 'Figma File', screens });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load Figma frames.';
      res.status(500).json({ error: message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`TRACE server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start TRACE server:', err);
  process.exit(1);
});
