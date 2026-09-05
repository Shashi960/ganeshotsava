// @ts-ignore
import PDFDocument, { registerStdFonts } from 'pdfkit';
// @ts-ignore
import Helvetica from 'pdfkit/standard-fonts/Helvetica';
// @ts-ignore
import HelveticaBold from 'pdfkit/standard-fonts/HelveticaBold';

try {
  if (typeof registerStdFonts === 'function') {
    registerStdFonts(Helvetica, HelveticaBold);
  }
} catch (e) {
  // Ignore if already registered
}

export interface ExportKathePdfOptions {
  filenamePrefix?: string;
  year?: string;
}

/**
 * Generates and downloads an A4 Landscape vector PDF of Kathe registered devotees.
 * 
 * Key Features:
 * - Native OpenType Kannada shaping using Nirmala UI font embedded in the PDF.
 * - Displays complex characters properly (e.g. ನಾಜಗಾರ, ಕಡೇ, ಕರ್ಕಿ, ಭಟ್, ರ್ಗ, ಷ್ಟ).
 * - Not an image: Searchable, selectable, and 100% vector Unicode text.
 * - Print-ready: A4 Landscape with table borders, zebra striping, repeated headers, and page numbers.
 */
export const exportKatheToPdf = async (
  participants: any[],
  language: string,
  options?: ExportKathePdfOptions
): Promise<void> => {
  // 1. Fetch the embedded Nirmala UI Unicode font
  const fontResponse = await fetch('/fonts/NirmalaUI.ttf');
  if (!fontResponse.ok) {
    throw new Error('Failed to load Kannada Unicode font for PDF generation.');
  }
  const fontBuffer = await fontResponse.arrayBuffer();

  return new Promise((resolve, reject) => {
    try {
      const doc = new (PDFDocument as any)({
        layout: 'landscape',
        size: 'A4',
        margin: 36,
        bufferPages: true,
        font: fontBuffer
      });

      const chunks: any[] = [];
      doc.on('data', (chunk: any) => chunks.push(chunk));
      doc.on('end', () => {
        try {
          const blob = new Blob(chunks, { type: 'application/pdf' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          const dateStr = new Date().toISOString().split('T')[0];
          link.setAttribute(
            'download',
            `${options?.filenamePrefix || 'satya_ganapati_vrata_devotees'}_${dateStr}.pdf`
          );
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          resolve();
        } catch (err) {
          reject(err);
        }
      });

      // Register the embedded Nirmala UI Unicode font
      doc.registerFont('Nirmala', fontBuffer);
      doc.font('Nirmala');

      const pageWidth = 841.89;
      const pageHeight = 595.28;
      const margin = 36;
      const contentWidth = pageWidth - margin * 2; // 769.89

      const cols = [
        { header: 'ಕ್ರಮ ಸಂಖ್ಯೆ\n(SL NO)', width: 55, align: 'center' as const },
        { header: 'ಭಕ್ತರ ಹೆಸರು\n(DEVOTEE NAME)', width: 230, align: 'left' as const },
        { header: 'ಸ್ಥಳ / ಪ್ರದೇಶ\n(PLACE / AREA)', width: 155, align: 'left' as const },
        { header: 'ಪುಸ್ತಕ ಸಂಖ್ಯೆ\n(BOOK NO)', width: 105, align: 'center' as const },
        { header: 'ವರ್ಷ\n(YEAR)', width: 65, align: 'center' as const },
        { header: 'ಸಂಕಲ್ಪ ಸ್ಥಿತಿ\n(STATUS)', width: 159.89, align: 'center' as const }
      ];

      let y = margin;
      const currentYear = options?.year || '2026';

      const drawHeader = (isFirstPage: boolean) => {
        if (isFirstPage) {
          // Document Header / Title
          doc.fillColor('#7A1C1C').fontSize(16).text(
            'ಶ್ರೀ ಸತ್ಯಗಣಪತಿ ವ್ರತ - ನೋಂದಾಯಿತ ಭಕ್ತರ ಪಟ್ಟಿ',
            margin,
            y,
            { align: 'center', width: contentWidth }
          );
          y += 22;

          doc.fillColor('#4B5563').fontSize(10).text(
            `Registered Devotees - Satya Ganapati Vrata ${currentYear} | ಶ್ರೀ ಗಣೇಶೋತ್ಸವ ಸೇವಾ ಸಮಿತಿ, ನಾಜಗಾರ`,
            margin,
            y,
            { align: 'center', width: contentWidth }
          );
          y += 18;

          const now = new Date();
          const dateStrFormatted = now.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          });
          const timeStr = now.toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit'
          });

          doc.fillColor('#6B7280').fontSize(8).text(
            `Generation Date: ${dateStrFormatted} ${timeStr}  |  Total Devotees: ${participants.length}`,
            margin,
            y,
            { align: 'right', width: contentWidth }
          );
          y += 14;
        }

        // Table Column Headers
        const headerHeight = 28;
        doc.rect(margin, y, contentWidth, headerHeight).fill('#7A1C1C');
        doc.fillColor('#FFFFFF').fontSize(8.5);

        let curX = margin;
        for (const col of cols) {
          doc.text(col.header, curX + 4, y + 4, {
            width: col.width - 8,
            align: col.align
          });
          curX += col.width;
        }
        y += headerHeight;
      };

      drawHeader(true);

      // Render Participant Rows
      participants.forEach((p, idx) => {
        const hasFamily = Boolean(p.homeName);
        const rowHeight = hasFamily ? 32 : 24;

        // Check if row exceeds printable height -> trigger automatic page break
        if (y + rowHeight > pageHeight - margin - 28) {
          doc.addPage();
          y = margin;
          drawHeader(false);
        }

        // Alternating row background (zebra striping)
        if (idx % 2 === 1) {
          doc.rect(margin, y, contentWidth, rowHeight).fill('#F9FAFB');
        }

        // Cell border outline
        doc.rect(margin, y, contentWidth, rowHeight).strokeColor('#E5E7EB').lineWidth(0.5).stroke();

        let curX = margin;

        // 1. SL NO
        doc.fillColor('#374151').fontSize(9).text(
          String(idx + 1),
          curX + 4,
          y + (rowHeight - 12) / 2,
          { width: cols[0].width - 8, align: cols[0].align }
        );
        curX += cols[0].width;

        // 2. DEVOTEE NAME + FAMILY
        const nameY = hasFamily ? y + 4 : y + (rowHeight - 12) / 2;
        doc.fillColor('#111827').fontSize(9).text(
          `${p.firstName || ''} ${p.lastName || ''}`.trim(),
          curX + 6,
          nameY,
          { width: cols[1].width - 12, align: cols[1].align }
        );
        if (hasFamily) {
          doc.fillColor('#6B7280').fontSize(8).text(
            `Family: ${p.homeName}`,
            curX + 6,
            y + 17,
            { width: cols[1].width - 12, align: cols[1].align }
          );
        }
        curX += cols[1].width;

        // 3. PLACE / AREA
        let placeText = '-';
        if (p.place && typeof p.place === 'object') {
          placeText = language === 'kn' ? (p.place.nameKannada || p.place.name) : (p.place.name || p.place.nameKannada);
        } else if (p.place) {
          placeText = String(p.place);
        }

        doc.fillColor('#374151').fontSize(9).text(
          placeText,
          curX + 6,
          y + (rowHeight - 12) / 2,
          { width: cols[2].width - 12, align: cols[2].align }
        );
        curX += cols[2].width;

        // 4. BOOK NUMBER
        doc.fillColor('#111827').fontSize(9).text(
          p.bookNo || p.notes || '-',
          curX + 4,
          y + (rowHeight - 12) / 2,
          { width: cols[3].width - 8, align: cols[3].align }
        );
        curX += cols[3].width;

        // 5. YEAR
        doc.fillColor('#374151').fontSize(9).text(
          p.year || currentYear,
          curX + 4,
          y + (rowHeight - 12) / 2,
          { width: cols[4].width - 8, align: cols[4].align }
        );
        curX += cols[4].width;

        // 6. SANKALPA STATUS
        const isConfirmed = p.confirmed || p.registrationStatus === 'CONFIRMED';
        const statusColor = isConfirmed ? '#065F46' : '#92400E';
        const statusBg = isConfirmed ? '#D1FAE5' : '#FEF3C7';
        const statusText = isConfirmed ? 'CONFIRMED (ದೃಢೀಕರಿಸಲಾಗಿದೆ)' : 'PENDING (ಬಾಕಿ ಇದೆ)';

        const badgeW = cols[5].width - 16;
        const badgeH = 16;
        const badgeX = curX + 8;
        const badgeY = y + (rowHeight - badgeH) / 2;

        doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 3).fill(statusBg);
        doc.fillColor(statusColor).fontSize(7.5).text(
          statusText,
          badgeX,
          badgeY + 4,
          { width: badgeW, align: 'center' }
        );

        y += rowHeight;
      });

      // Page Footers across all pages
      const range = doc.bufferedPageRange();
      for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);
        doc.fillColor('#9CA3AF').fontSize(8).text(
          `Page ${i + 1} of ${range.count}  |  Sri Satya Ganapati Vrata - Najagara Ganeshotsava`,
          margin,
          pageHeight - 24,
          { align: 'center', width: contentWidth }
        );
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};
