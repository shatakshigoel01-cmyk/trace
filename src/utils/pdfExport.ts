import { jsPDF } from 'jspdf';
import { Project } from '../types/trace';

export function exportTracePdf(project: Project): void {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 44;
  const maxWidth = pageWidth - margin * 2;
  let y = 52;

  const ensureSpace = (needed: number) => {
    if (y + needed > pageHeight - 48) {
      doc.addPage();
      y = 48;
    }
  };

  const addWrappedText = (
    text: string,
    fontSize: number,
    color: [number, number, number],
    bold = false,
    gapAfter = 8
  ) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(fontSize);
    doc.setTextColor(color[0], color[1], color[2]);
    const lines = doc.splitTextToSize(text, maxWidth) as string[];
    const lineHeight = fontSize * 1.4;
    ensureSpace(lines.length * lineHeight + gapAfter);
    doc.text(lines, margin, y);
    y += lines.length * lineHeight + gapAfter;
  };

  // Header
  addWrappedText('TRACE — Decision Trace Report', 18, [108, 59, 245], true, 6);
  addWrappedText(project.name, 14, [17, 19, 28], true, 4);
  addWrappedText(
    `Generated: ${new Date().toLocaleDateString()} · Insights: ${project.insights.length} · Design Screens: ${project.designScreens.length}`,
    10,
    [100, 106, 122],
    false,
    18
  );

  doc.setDrawColor(230, 232, 238);
  doc.line(margin, y - 6, pageWidth - margin, y - 6);
  y += 10;

  const trace = project.traceResult;

  if (trace && trace.supportedTraces.length > 0) {
    addWrappedText(
      `Supported Design Decisions (${trace.supportedTraces.length})`,
      13,
      [17, 19, 28],
      true,
      10
    );

    trace.supportedTraces.forEach((item, index) => {
      ensureSpace(90);
      addWrappedText(
        `${index + 1}. ${item.relatedScreenName} — ${item.confidenceLabel}${item.confirmed ? ' [Confirmed]' : ''}`,
        11,
        [108, 59, 245],
        true,
        4
      );
      addWrappedText(`Research Evidence: ${item.evidence}`, 10, [55, 65, 81], false, 3);
      addWrappedText(`Key Insight: ${item.keyInsight}`, 10, [17, 19, 28], false, 3);
      addWrappedText(`Design Decision: ${item.designDecision}`, 10, [37, 99, 235], false, 3);
      if (item.annotatedNote) {
        addWrappedText(`Note: ${item.annotatedNote}`, 9.5, [100, 106, 122], false, 8);
      } else {
        y += 6;
      }
    });
  }

  if (trace && trace.unsupportedDecisions.length > 0) {
    y += 8;
    addWrappedText(
      `Unsupported Design Decisions (${trace.unsupportedDecisions.length})`,
      13,
      [185, 28, 28],
      true,
      10
    );

    trace.unsupportedDecisions.forEach((item, index) => {
      ensureSpace(70);
      addWrappedText(
        `${index + 1}. ${item.screenName}${item.reviewed ? ' [Reviewed]' : ''}`,
        11,
        [185, 28, 28],
        true,
        4
      );
      addWrappedText(`Design Decision: ${item.designDecision}`, 10, [17, 19, 28], false, 3);
      addWrappedText(`Gap Reason: ${item.reason}`, 10, [82, 88, 102], false, 3);
      if (item.annotatedNote) {
        addWrappedText(`Note: ${item.annotatedNote}`, 9.5, [100, 106, 122], false, 8);
      } else {
        y += 6;
      }
    });
  }

  if (trace && trace.unmatchedInsights.length > 0) {
    y += 8;
    addWrappedText(
      `Unmatched Research Insights (${trace.unmatchedInsights.length})`,
      13,
      [37, 99, 235],
      true,
      10
    );

    trace.unmatchedInsights.forEach((item, index) => {
      ensureSpace(70);
      addWrappedText(`${index + 1}. ${item.keyInsight}`, 11, [17, 19, 28], true, 4);
      addWrappedText(`Evidence (${item.sourceName}): ${item.evidence}`, 10, [82, 88, 102], false, 3);
      addWrappedText(`Status: ${item.reason}`, 10, [37, 99, 235], false, 3);
      if (item.annotatedNote) {
        addWrappedText(`Note: ${item.annotatedNote}`, 9.5, [100, 106, 122], false, 8);
      } else {
        y += 6;
      }
    });
  }

  if (!trace) {
    addWrappedText('Research Insights', 13, [17, 19, 28], true, 8);
    project.insights.forEach((ins, idx) => {
      addWrappedText(`${idx + 1}. [${ins.category}] ${ins.title}`, 10.5, [17, 19, 28], true, 2);
      addWrappedText(`Evidence (${ins.sourceName}): ${ins.evidence}`, 9.5, [82, 88, 102], false, 6);
    });
  }

  const safeFile = project.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  doc.save(`${safeFile || 'trace'}-report.pdf`);
}
