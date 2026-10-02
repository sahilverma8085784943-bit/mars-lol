import jsPDF from 'jspdf';
import { PRESENTATION_SLIDES, PresentationSlide } from '../data/presentationSlides';

/**
 * Generates a high-fidelity, landscape PDF presentation deck for the BioScan.AI project.
 * Uses the corporate high-tech color scheme (#0f2027, #203a43, #2c5364).
 */
export async function generatePresentationPdf(includeSpeakerNotes = true): Promise<void> {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'pt',
    format: 'a4', // 841.89 x 595.28 pt
  });

  const pageWidth = 841.89;
  const pageHeight = 595.28;

  for (let idx = 0; idx < PRESENTATION_SLIDES.length; idx++) {
    const slide = PRESENTATION_SLIDES[idx];
    if (idx > 0) {
      doc.addPage('a4', 'landscape');
    }

    renderSlidePage(doc, slide, idx + 1, PRESENTATION_SLIDES.length, pageWidth, pageHeight, includeSpeakerNotes);
  }

  // Save the generated document
  doc.save('BioScan_AI_Enterprise_Project_Presentation.pdf');
}

function renderSlidePage(
  doc: jsPDF,
  slide: PresentationSlide,
  slideNum: number,
  totalSlides: number,
  width: number,
  height: number,
  includeNotes: boolean
) {
  // 1. Slide Canvas Background: Deep Obsidian Petrol (#0f2027)
  doc.setFillColor(15, 32, 39);
  doc.rect(0, 0, width, height, 'F');

  // Subtle background glow blocks (#203a43 and #2c5364)
  doc.setFillColor(32, 58, 67);
  doc.rect(width - 320, 0, 320, 180, 'F');

  doc.setFillColor(25, 45, 54);
  doc.roundedRect(20, 20, width - 40, height - 40, 8, 8, 'S');
  doc.setDrawColor(44, 83, 100);
  doc.setLineWidth(1.2);
  doc.roundedRect(20, 20, width - 40, height - 40, 8, 8, 'D');

  // 2. Header Bar
  doc.setFillColor(20, 42, 52);
  doc.rect(20, 20, width - 40, 50, 'F');
  doc.setDrawColor(34, 211, 238);
  doc.setLineWidth(1.5);
  doc.line(20, 70, width - 20, 70);

  // Logo / Brand
  doc.setTextColor(34, 211, 238);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('BioScan.AI', 38, 50);

  doc.setTextColor(148, 163, 184);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('CORPORATE BIOMETRIC ATTENDANCE PLATFORM', 125, 50);

  // Category & Slide Number Badge (Right Header)
  doc.setFillColor(15, 32, 39);
  doc.roundedRect(width - 240, 32, 205, 26, 4, 4, 'F');
  doc.setDrawColor(44, 83, 100);
  doc.roundedRect(width - 240, 32, 205, 26, 4, 4, 'D');

  doc.setTextColor(34, 211, 238);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(`SLIDE ${String(slideNum).padStart(2, '0')} / ${String(totalSlides).padStart(2, '0')}`, width - 230, 48);

  doc.setTextColor(245, 158, 11);
  doc.setFontSize(8);
  doc.text('SECURE &bull; ZERO-TRUST', width - 145, 48);

  // 3. Category Pill
  doc.setFillColor(32, 58, 67);
  doc.roundedRect(38, 86, 170, 18, 9, 9, 'F');
  doc.setTextColor(165, 243, 252);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text(slide.category.toUpperCase(), 48, 98);

  // 4. Slide Title & Subtitle
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  
  // Wrap title if needed
  const titleLines = doc.splitTextToSize(slide.title, width - 120);
  doc.text(titleLines, 38, 124);

  const titleHeightOffset = (titleLines.length - 1) * 18;

  doc.setTextColor(148, 163, 184);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10.5);
  doc.text(slide.subtitle, 38, 144 + titleHeightOffset);

  // 5. Summary Callout Box
  const summaryBoxY = 158 + titleHeightOffset;
  doc.setFillColor(18, 38, 48);
  doc.roundedRect(38, summaryBoxY, width - 76, 32, 4, 4, 'F');
  doc.setDrawColor(44, 83, 100);
  doc.roundedRect(38, summaryBoxY, width - 76, 32, 4, 4, 'D');

  // Accent vertical pill
  doc.setFillColor(34, 211, 238);
  doc.rect(38, summaryBoxY, 4, 32, 'F');

  doc.setTextColor(226, 232, 240);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.text(slide.summary, 50, summaryBoxY + 19);

  // 6. Content Section: 4 Key Points in 2x2 Grid
  const gridStartY = summaryBoxY + 44;
  const colWidth = (width - 76 - 16) / 2; // ~374 pt
  const cardHeight = 74;

  slide.keyPoints.slice(0, 4).forEach((point, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const cardX = 38 + col * (colWidth + 16);
    const cardY = gridStartY + row * (cardHeight + 10);

    // Card background
    doc.setFillColor(16, 34, 43);
    doc.roundedRect(cardX, cardY, colWidth, cardHeight, 6, 6, 'F');
    doc.setDrawColor(44, 83, 100);
    doc.setLineWidth(0.8);
    doc.roundedRect(cardX, cardY, colWidth, cardHeight, 6, 6, 'D');

    // Bullet dot
    doc.setFillColor(34, 211, 238);
    doc.circle(cardX + 16, cardY + 18, 3, 'F');

    // Heading
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.text(point.heading, cardX + 28, cardY + 21);

    // Highlight badge
    if (point.highlight) {
      doc.setFillColor(32, 58, 67);
      const badgeWidth = doc.getTextWidth(point.highlight) + 12;
      doc.roundedRect(cardX + colWidth - badgeWidth - 12, cardY + 10, badgeWidth, 16, 3, 3, 'F');
      doc.setTextColor(34, 211, 238);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.text(point.highlight, cardX + colWidth - badgeWidth - 6, cardY + 21);
    }

    // Description text
    doc.setTextColor(148, 163, 184);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    const descLines = doc.splitTextToSize(point.description, colWidth - 36);
    doc.text(descLines, cardX + 28, cardY + 38);
  });

  // 7. Metrics / KPI Ribbon at bottom
  const metricsY = gridStartY + 2 * (cardHeight + 10) + 6;
  if (slide.metrics && slide.metrics.length > 0) {
    const metricCardWidth = (width - 76 - (slide.metrics.length - 1) * 10) / slide.metrics.length;
    
    slide.metrics.forEach((metric, mIdx) => {
      const mX = 38 + mIdx * (metricCardWidth + 10);

      doc.setFillColor(20, 42, 52);
      doc.roundedRect(mX, metricsY, metricCardWidth, 42, 4, 4, 'F');
      doc.setDrawColor(44, 83, 100);
      doc.roundedRect(mX, metricsY, metricCardWidth, 42, 4, 4, 'D');

      // Metric Value
      doc.setTextColor(34, 211, 238);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text(metric.value, mX + 12, metricsY + 18);

      // Metric Label
      doc.setTextColor(241, 245, 249);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text(metric.label, mX + 12, metricsY + 29);

      // Metric Sublabel
      doc.setTextColor(148, 163, 184);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.text(metric.sublabel, mX + 12, metricsY + 38);
    });
  }

  // 8. Footer Bar
  const footerY = height - 34;
  doc.setDrawColor(44, 83, 100);
  doc.setLineWidth(0.8);
  doc.line(38, footerY - 8, width - 38, footerY - 8);

  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('BioScan.AI &bull; ISO/IEC 27001 &amp; ISO 30107-3 Liveness Compliant &bull; Gradient Architecture (#0f2027 / #203a43 / #2c5364)', 38, footerY + 8);

  doc.setTextColor(148, 163, 184);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text(`CONFIDENTIAL PRESENTATION &bull; SLIDE ${slideNum} OF ${totalSlides}`, width - 230, footerY + 8);
}
