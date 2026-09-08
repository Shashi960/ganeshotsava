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

export interface ExportTshirtPdfOptions {
  filenamePrefix?: string;
  year?: string;
  stats?: {
    total: number;
    breakdown: Record<string, number>;
  };
}

/**
 * Generates and downloads an A4 Landscape vector PDF of Member T-Shirt Distribution Roster
 */
export const exportTshirtToPdf = async (
  orders: any[],
  language: string,
  options?: ExportTshirtPdfOptions
): Promise<void> => {
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
        font: fontBuffer,
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
            `${options?.filenamePrefix || 'tshirt_distribution_list'}_${dateStr}.pdf`
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

      doc.registerFont('Nirmala', fontBuffer);
      doc.font('Nirmala');

      const pageWidth = 841.89;
      const pageHeight = 595.28;
      const margin = 36;
      const contentWidth = pageWidth - margin * 2; // 769.89

      const cols = [
        { header: 'ಕ್ರಮ ಸಂಖ್ಯೆ\n(SL NO)', width: 55, align: 'center' as const },
        { header: 'ಸದಸ್ಯರ / ಭಕ್ತರ ಹೆಸರು\n(MEMBER / DEVOTEE NAME)', width: 200, align: 'left' as const },
        { header: 'ವರ್ಗ\n(CATEGORY)', width: 120, align: 'center' as const },
        { header: 'ಮನೆತನ / ವಿವರ\n(HOME / FAMILY)', width: 155, align: 'left' as const },
        { header: 'ಟಿ-ಶರ್ಟ್ ಅಳತೆ\n(SIZE)', width: 85, align: 'center' as const },
        { header: 'ಸ್ವೀಕರಿಸಿದ ಸಹಿ\n(SIGNATURE / RECEIVED)', width: 154.89, align: 'center' as const },
      ];

      let y = margin;
      const currentYear = options?.year || '2026';
      const stats = options?.stats;

      const drawHeader = (isFirstPage: boolean) => {
        if (isFirstPage) {
          // Document Header / Title
          doc.fillColor('#7A1C1C').fontSize(16).text(
            'ಗಣೇಶೋತ್ಸವ ಸಮಿತಿ, ಕೆಳಗಿನೂರು, ನಾಜಗಾರ ಕ್ರಾಸ್',
            margin,
            y,
            { align: 'center', width: contentWidth }
          );
          y += 20;

          doc.fillColor('#1F2937').fontSize(12).text(
            `${currentYear} - ಸದಸ್ಯರ ಟಿ-ಶರ್ಟ್ ಅಳತೆ ಹಾಗೂ ವಿತರಣಾ ಪಟ್ಟಿ (T-Shirt Distribution Roster)`,
            margin,
            y,
            { align: 'center', width: contentWidth }
          );
          y += 18;

          // Stats / Summary Box if stats are provided
          if (stats) {
            const summaryH = 24;
            doc.roundedRect(margin, y, contentWidth, summaryH, 4).fillAndStroke('#FEF3C7', '#F59E0B');

            const b = stats.breakdown || {};
            const summaryText = `ಒಟ್ಟು ಟಿ-ಶರ್ಟ್ (TOTAL): ${stats.total || orders.length}   |   S: ${b['S'] || 0}   |   M: ${b['M'] || 0}   |   L: ${b['L'] || 0}   |   XL: ${b['XL'] || 0}   |   XXL: ${b['XXL'] || 0}   |   3XL: ${b['3XL'] || 0}`;

            doc.fillColor('#78350F').fontSize(9.5).text(
              summaryText,
              margin,
              y + 6,
              { align: 'center', width: contentWidth }
            );
            y += summaryH + 10;
          } else {
            y += 6;
          }
        } else {
          doc.fillColor('#7A1C1C').fontSize(10).text(
            `ಗಣೇಶೋತ್ಸವ ಸಮಿತಿ - ಸದಸ್ಯರ ಟಿ-ಶರ್ಟ್ ವಿತರಣಾ ಪಟ್ಟಿ (${currentYear})`,
            margin,
            y,
            { align: 'left', width: contentWidth }
          );
          y += 16;
        }

        // Table Header
        const headerHeight = 28;
        doc.rect(margin, y, contentWidth, headerHeight).fill('#7A1C1C');

        let curX = margin;
        cols.forEach((col) => {
          doc.fillColor('#FFFFFF').fontSize(8.5).text(
            col.header,
            curX,
            y + 4,
            { width: col.width, align: col.align }
          );
          curX += col.width;
        });

        y += headerHeight;
      };

      drawHeader(true);

      const rowHeight = 24;
      const bottomLimit = pageHeight - margin - 20;

      orders.forEach((o, index) => {
        if (y + rowHeight > bottomLimit) {
          doc.addPage();
          y = margin;
          drawHeader(false);
        }

        const isEven = index % 2 === 0;
        const rowBg = isEven ? '#FFFFFF' : '#F9FAFB';
        doc.rect(margin, y, contentWidth, rowHeight).fill(rowBg);

        // Bottom border
        doc.strokeColor('#E5E7EB').lineWidth(0.5)
          .moveTo(margin, y + rowHeight)
          .lineTo(margin + contentWidth, y + rowHeight)
          .stroke();

        let curX = margin;

        // 1. SL NO
        doc.fillColor('#4B5563').fontSize(9).text(
          String(index + 1),
          curX,
          y + 7,
          { width: cols[0].width, align: cols[0].align }
        );
        curX += cols[0].width;

        // 2. NAME
        const memberName = o.name || (o.member ? `${o.member.firstName || ''} ${o.member.lastName || ''}`.trim() : '-');
        doc.fillColor('#111827').fontSize(9.5).text(
          memberName,
          curX + 6,
          y + 6,
          { width: cols[1].width - 12, align: cols[1].align }
        );
        curX += cols[1].width;

        // 3. CATEGORY / MEMBER TYPE
        let catText = o.memberType || o.member?.memberType || 'Other';
        if (catText === 'Member') catText = 'ಸದಸ್ಯರು (Member)';
        else if (catText === 'Junior Member') catText = 'ಕಿರಿಯರು (Junior)';
        else if (catText === 'Senior Member') catText = 'ಹಿರಿಯರು (Senior)';
        else if (catText === 'Committee Member') catText = 'ಸಮಿತಿ (Committee)';
        else if (catText === 'Other') catText = 'ಇತರೆ (Other)';

        doc.fillColor('#374151').fontSize(8.5).text(
          catText,
          curX + 4,
          y + 7,
          { width: cols[2].width - 8, align: cols[2].align }
        );
        curX += cols[2].width;

        // 4. HOME / FAMILY
        const homeText = o.homeName || o.member?.homeName || '-';
        doc.fillColor('#4B5563').fontSize(9).text(
          homeText,
          curX + 6,
          y + 7,
          { width: cols[3].width - 12, align: cols[3].align }
        );
        curX += cols[3].width;

        // 5. SIZE (Prominent Badge)
        const sizeW = 44;
        const sizeH = 16;
        const sizeX = curX + (cols[4].width - sizeW) / 2;
        const sizeY = y + 4;

        doc.roundedRect(sizeX, sizeY, sizeW, sizeH, 3).fill('#DBEAFE');
        doc.fillColor('#1E40AF').fontSize(9).text(
          o.size || '-',
          sizeX,
          sizeY + 3,
          { width: sizeW, align: 'center' }
        );
        curX += cols[4].width;

        // 6. SIGNATURE / RECEIVED (Empty box with subtle dotted line)
        doc.strokeColor('#D1D5DB').lineWidth(0.5)
          .moveTo(curX + 15, y + rowHeight - 6)
          .lineTo(curX + cols[5].width - 15, y + rowHeight - 6)
          .stroke();

        y += rowHeight;
      });

      // Page Footers across all pages
      const range = doc.bufferedPageRange();
      for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);
        doc.fillColor('#9CA3AF').fontSize(8).text(
          `Page ${i + 1} of ${range.count}  |  Ganeshotsava Samiti Kelaginuru Najagara Cross  |  T-Shirt Distribution`,
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
