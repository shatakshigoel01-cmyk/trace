import JSZip from 'jszip';

export interface DocumentExtractionResult {
  supportedForAi: boolean;
  extractionMode: 'text' | 'multimodal' | 'unsupported';
  extractedText: string | null;
  reason?: string;
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

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export async function extractDocumentClientSide(
  name: string,
  mimeType: string,
  dataBase64: string
): Promise<DocumentExtractionResult> {
  const dotIdx = name.lastIndexOf('.');
  const ext = dotIdx >= 0 ? name.slice(dotIdx).toLowerCase() : '';
  const bytes = base64ToUint8Array(dataBase64);

  if (
    ext === '.txt' ||
    ext === '.csv' ||
    ext === '.md' ||
    ext === '.json' ||
    ext === '.tsv' ||
    mimeType.startsWith('text/')
  ) {
    const text = new TextDecoder('utf-8').decode(bytes).trim();
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
      const zip = await JSZip.loadAsync(bytes);
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
      const zip = await JSZip.loadAsync(bytes);
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
      const zip = await JSZip.loadAsync(bytes);
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
          const base = sheetFile.split('/').pop()?.replace('.xml', '') || 'sheet';
          sheetTexts.push(`[${base}]\n${rows.join('\n')}`);
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
    const isOle2 =
      bytes.length >= 4 &&
      bytes[0] === 0xd0 &&
      bytes[1] === 0xcf &&
      bytes[2] === 0x11 &&
      bytes[3] === 0xe0;
    if (!isOle2) {
      const raw = new TextDecoder('utf-8').decode(bytes);
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
