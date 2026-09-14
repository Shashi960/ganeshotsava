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
 * Generates and downloads an A4 Vertical (Portrait) vector PDF of Kathe registered devotees.
 * 
 * Key Features:
 * - Native OpenType Kannada shaping using Nirmala UI font embedded in the PDF.
 * - Displays complex characters properly (e.g. ನಾಜಗಾರ, ಕಡೇ, ಕರ್ಕಿ, ಭಟ್, ರ್ಗ, ಷ್ಟ).
 * - Not an image: Searchable, selectable, and 100% vector Unicode text.
 * - Print-ready: A4 Portrait with table borders, zebra striping, repeated headers, and page numbers.
 */
export const naturalCompareBookNo = (a?: string, b?: string): number => {
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;
  const strA = String(a).trim();
  const strB = String(b).trim();
  return strA.localeCompare(strB, undefined, { numeric: true, sensitivity: 'base' });
};

/**
 * Extracts the display name of the Place / Area for a participant.
 * Handles populated Place object, customPlace string, or plain string ID.
 */
export const getParticipantPlaceName = (p: any, language: string = 'kn'): string => {
  if (p.customPlace && typeof p.customPlace === 'string' && p.customPlace.trim()) {
    return p.customPlace.trim();
  }
  if (p.place && typeof p.place === 'object') {
    const kn = p.place.nameKannada ? String(p.place.nameKannada).trim() : '';
    const en = p.place.name ? String(p.place.name).trim() : '';
    const chosen = language === 'kn' ? (kn || en) : (en || kn);
    if (chosen && chosen !== 'Other' && chosen !== 'ಇತರೆ') {
      return chosen;
    }
    if (p.customPlace && typeof p.customPlace === 'string' && p.customPlace.trim()) {
      return p.customPlace.trim();
    }
    return chosen || (language === 'kn' ? 'ಇತರೆ / ನಮೂದಿಸಿಲ್ಲ' : 'Unassigned / Other');
  }
  if (p.place && typeof p.place === 'string' && p.place.trim()) {
    return p.place.trim();
  }
  return language === 'kn' ? 'ಇತರೆ / ನಮೂದಿಸಿಲ್ಲ' : 'Unassigned / Other';
};

/**
 * Extracts addition/creation time for chronological sorting (first added is first)
 */
export const getParticipantCreationTime = (p: any): number => {
  if (p.createdAt) {
    const t = new Date(p.createdAt).getTime();
    if (!isNaN(t) && t > 0) return t;
  }
  if (p._id && typeof p._id === 'string' && p._id.length >= 8) {
    try {
      const t = parseInt(p._id.substring(0, 8), 16) * 1000;
      if (!isNaN(t) && t > 0) return t;
    } catch {
      // ignore
    }
  }
  return 0;
};

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
        layout: 'portrait',
        size: 'A4',
        margin: 28,
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
            `${options?.filenamePrefix || 'satya_ganapati_vrata_placewise'}_${dateStr}.pdf`
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

      const pageWidth = 595.28;
      const pageHeight = 841.89;
      const margin = 20;
      const contentWidth = pageWidth - margin * 2; // 555.28

      const cols = [
        { header: 'ಕ್ರ.ಸಂ\n(SL)', width: 32, align: 'center' as const },
        { header: 'ಭಕ್ತರ ಹೆಸರು\n(DEVOTEE NAME)', width: 155, align: 'left' as const },
        { header: 'ಇತರ ವಿವರ\n(OTHER DETAILS)', width: 110, align: 'left' as const },
        { header: 'ಸ್ಥಳ / ಪ್ರದೇಶ\n(PLACE / AREA)', width: 95, align: 'left' as const },
        { header: 'ಪುಸ್ತಕ\n(BOOK)', width: 45, align: 'center' as const },
        { header: 'ದೂರವಾಣಿ\n(PHONE)', width: 60, align: 'center' as const },
        { header: 'ಸ್ಥಿತಿ\n(STATUS)', width: 58.28, align: 'center' as const }
      ];

      // Group participants by Place / Area
      const placeGroups = new Map<string, any[]>();
      participants.forEach((p) => {
        const placeKey = getParticipantPlaceName(p, language);
        if (!placeGroups.has(placeKey)) {
          placeGroups.set(placeKey, []);
        }
        placeGroups.get(placeKey)!.push(p);
      });

      const isUnassignedPlace = (k: string) =>
        k.includes('ಇತರೆ') || k.includes('Unassigned') || k.includes('Other') || k.includes('ನಮೂದಿಸಿಲ್ಲ');

      // Sort places in Kannada alphabetical order, with unassigned/other at the end
      const sortedPlaceKeys = Array.from(placeGroups.keys()).sort((a, b) => {
        if (isUnassignedPlace(a) && isUnassignedPlace(b)) return 0;
        if (isUnassignedPlace(a)) return 1;
        if (isUnassignedPlace(b)) return -1;
        return a.localeCompare(b, 'kn', { sensitivity: 'base' });
      });

      // Sort participants inside each place group chronologically by addition time (first added = first)
      sortedPlaceKeys.forEach((key) => {
        const list = placeGroups.get(key)!;
        list.sort((a, b) => {
          const timeA = getParticipantCreationTime(a);
          const timeB = getParticipantCreationTime(b);
          if (timeA !== timeB) return timeA - timeB;

          // Secondary tie-breaker: natural book number, then name
          const bookA = (a.bookNo || a.notes || '').trim();
          const bookB = (b.bookNo || b.notes || '').trim();
          const bCmp = naturalCompareBookNo(bookA, bookB);
          if (bCmp !== 0) return bCmp;

          const nameA = `${a.firstName || ''} ${a.lastName || ''}`.trim();
          const nameB = `${b.firstName || ''} ${b.lastName || ''}`.trim();
          return nameA.localeCompare(nameB, 'kn', { sensitivity: 'base' });
        });
      });

      let y = margin;
      const currentYear = options?.year || '2026';

      const drawTableHeader = () => {
        const headerHeight = 16;
        doc.rect(margin, y, contentWidth, headerHeight).fill('#374151');
        doc.fillColor('#FFFFFF').fontSize(7);

        let curX = margin;
        for (const col of cols) {
          doc.text(col.header, curX + 2, y + 2.5, {
            width: col.width - 4,
            align: col.align
          });
          curX += col.width;
        }
        y += headerHeight;
      };

      const drawDocumentHeader = (isFirstPage: boolean) => {
        if (isFirstPage) {
          // Minimal Page 1 Header (clean & compact)
          doc.fillColor('#7A1C1C').fontSize(11).text(
            `ಶ್ರೀ ಸತ್ಯಗಣಪತಿ ವ್ರತ - ಸ್ಥಳವಾರು ನೋಂದಾಯಿತ ಭಕ್ತರ ಪಟ್ಟಿ (${currentYear})`,
            margin,
            y,
            { align: 'center', width: contentWidth }
          );
          y += 13;

          const now = new Date();
          const dateStrFormatted = now.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          });

          doc.fillColor('#4B5563').fontSize(7.5).text(
            `ದಿನಾಂಕ: ${dateStrFormatted}  |  ಒಟ್ಟು ಸ್ಥಳಗಳು: ${sortedPlaceKeys.length}  |  ಒಟ್ಟು ಭಕ್ತಾದಿಗಳು: ${participants.length}  |  ಶ್ರೀ ಗಣೇಶೋತ್ಸವ ಸೇವಾ ಸಮಿತಿ, ನಾಜಗಾರ`,
            margin,
            y,
            { align: 'center', width: contentWidth }
          );
          y += 11;
        } else {
          // Minimal Running Header on subsequent pages
          doc.fillColor('#6B7280').fontSize(7.5).text(
            `ಶ್ರೀ ಸತ್ಯಗಣಪತಿ ವ್ರತ ಭಕ್ತರ ಪಟ್ಟಿ (${currentYear}) - ಸ್ಥಳವಾರು ನೋಂದಣಿ`,
            margin,
            y,
            { align: 'left', width: contentWidth }
          );
          y += 10;
        }
      };

      drawDocumentHeader(true);
      drawTableHeader();

      // Continuous serial number across ALL places
      let globalSlNo = 1;

      // Render each Place Group
      sortedPlaceKeys.forEach((placeKey) => {
        const groupParticipants = placeGroups.get(placeKey) || [];
        if (groupParticipants.length === 0) return;

        // Check space for Place Divider + at least 1 row
        if (y + 14.5 + 16.5 > pageHeight - margin - 20) {
          doc.addPage();
          y = margin;
          drawDocumentHeader(false);
          drawTableHeader();
        }

        // Draw slim, minimal 1-line Place Divider Row
        doc.rect(margin, y, contentWidth, 14.5).fill('#F3F4F6');
        doc.rect(margin, y, contentWidth, 14.5).strokeColor('#D1D5DB').lineWidth(0.5).stroke();
        doc.fillColor('#7A1C1C').fontSize(8).text(
          `📍  ಸ್ಥಳ / ಪ್ರದೇಶ: ${placeKey}  (${groupParticipants.length} ಭಕ್ತಾದಿಗಳು)`,
          margin + 6,
          y + 3,
          { width: contentWidth - 12, align: 'left' }
        );
        y += 14.5;

        // Render rows for this place with continuous global serial number
        groupParticipants.forEach((p) => {
          const rowHeight = 16.5;

          // Check if row exceeds printable height -> trigger page break
          if (y + rowHeight > pageHeight - margin - 20) {
            doc.addPage();
            y = margin;
            drawDocumentHeader(false);
            drawTableHeader();
          }

          // Alternating zebra striping
          if (globalSlNo % 2 === 0) {
            doc.rect(margin, y, contentWidth, rowHeight).fill('#FAFAFA');
          }

          // Cell border outline
          doc.rect(margin, y, contentWidth, rowHeight).strokeColor('#E5E7EB').lineWidth(0.4).stroke();

          let curX = margin;

          // 1. SL NO (Continuous serial number across all places!)
          doc.fillColor('#374151').fontSize(7.5).text(
            String(globalSlNo),
            curX,
            y + 4,
            { width: cols[0].width, align: cols[0].align }
          );
          curX += cols[0].width;

          // 2. DEVOTEE NAME
          const devoteeName = `${p.firstName || ''} ${p.lastName || ''}`.trim() || p.homeName || '-';
          doc.fillColor('#111827').fontSize(7.5).text(
            devoteeName,
            curX + 3,
            y + 4,
            { width: cols[1].width - 6, align: cols[1].align, lineBreak: false, ellipsis: true }
          );
          curX += cols[1].width;

          // 3. OTHER DETAILS
          doc.fillColor('#4B5563').fontSize(7).text(
            p.homeName || '-',
            curX + 3,
            y + 4,
            { width: cols[2].width - 6, align: cols[2].align, lineBreak: false, ellipsis: true }
          );
          curX += cols[2].width;

          // 4. PLACE / AREA
          const placeText = getParticipantPlaceName(p, language);
          doc.fillColor('#374151').fontSize(7.5).text(
            placeText,
            curX + 3,
            y + 4,
            { width: cols[3].width - 6, align: cols[3].align, lineBreak: false, ellipsis: true }
          );
          curX += cols[3].width;

          // 5. BOOK NUMBER
          doc.fillColor('#111827').fontSize(7.5).text(
            p.bookNo || p.notes || '-',
            curX,
            y + 4,
            { width: cols[4].width, align: cols[4].align, lineBreak: false, ellipsis: true }
          );
          curX += cols[4].width;

          // 6. PHONE
          doc.fillColor('#374151').fontSize(7.5).text(
            p.phone ? String(p.phone).trim() : '-',
            curX,
            y + 4,
            { width: cols[5].width, align: cols[5].align, lineBreak: false, ellipsis: true }
          );
          curX += cols[5].width;

          // 7. SANKALPA STATUS
          const isConfirmed = p.confirmed || p.registrationStatus === 'CONFIRMED';
          const statusText = isConfirmed ? 'ದೃಢೀಕೃತ' : 'ಬಾಕಿ';
          const statusColor = isConfirmed ? '#065F46' : '#92400E';
          doc.fillColor(statusColor).fontSize(7).text(
            statusText,
            curX,
            y + 4,
            { width: cols[6].width, align: cols[6].align, lineBreak: false, ellipsis: true }
          );

          y += rowHeight;
          globalSlNo++;
        });
      });

      // Signature Block at the end of document
      if (y + 40 > pageHeight - margin - 20) {
        doc.addPage();
        y = margin + 15;
      } else {
        y += 10;
      }

      const sigWidth = contentWidth / 3;
      doc.fillColor('#4B5563').fontSize(7.5);
      doc.text('_____________________________', margin, y, { width: sigWidth, align: 'center' });
      doc.text('_____________________________', margin + sigWidth, y, { width: sigWidth, align: 'center' });
      doc.text('_____________________________', margin + sigWidth * 2, y, { width: sigWidth, align: 'center' });
      y += 11;

      doc.fillColor('#111827').fontSize(7.5);
      doc.text('ಸ್ಥಳ / ವಲಯ ಪರಿಶೀಲಕರು\n(Area Coordinator)', margin, y, { width: sigWidth, align: 'center' });
      doc.text('ಪ್ರಧಾನ ಕಾರ್ಯದರ್ಶಿ\n(General Secretary)', margin + sigWidth, y, { width: sigWidth, align: 'center' });
      doc.text('ಅಧ್ಯಕ್ಷರು\n(President)', margin + sigWidth * 2, y, { width: sigWidth, align: 'center' });

      // Page Footers across all pages
      const range = doc.bufferedPageRange();
      for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);
        doc.fillColor('#9CA3AF').fontSize(7).text(
          `Page ${i + 1} of ${range.count}  |  Sri Satya Ganapati Vrata - Place-wise Devotees List | Najagara Ganeshotsava`,
          margin,
          pageHeight - 15,
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
 * Helper to determine member category rank for T-shirt ordering:
 * 1: Senior Member (ಹಿರಿಯ ಸದಸ್ಯರು)
 * 2: Member / Committee Member (ಸದಸ್ಯರು / ಸಮಿತಿ ಸದಸ್ಯರು)
 * 3: Junior Member (ಕಿರಿಯ ಸದಸ್ಯರು)
 * 4: Other Member / Devotee (ಇತರೆ ಸದಸ್ಯರು / ಭಕ್ತಾದಿಗಳು)
 */
export function getMemberTierRank(type?: string): number {
  if (!type) return 4;
  const t = type.toLowerCase().trim();
  if (t.includes('senior') || t.includes('ಹಿರಿಯ')) return 1;
  if (t.includes('junior') || t.includes('ಕಿರಿಯ')) return 3;
  if (t.includes('committee') || t.includes('ಸಮಿತಿ')) return 2;
  if (t.includes('member') || t.includes('ಸದಸ್ಯ')) {
    if (t.includes('ಇತರೆ') || t.includes('other')) return 4;
    return 2;
  }
  return 4;
}

/**
 * Extracts devotee or member full name for sorting and display
 */
export function getOrderDevoteeName(order: any): string {
  if (order.name && typeof order.name === 'string' && order.name.trim()) {
    return order.name.trim();
  }
  if (order.member) {
    const fn = order.member.firstName || '';
    const ln = order.member.lastName || '';
    const full = `${fn} ${ln}`.trim();
    if (full) return full;
  }
  return '';
}

/**
 * Sorts T-shirt orders by:
 * 1. Tier Rank: Senior Member (1) -> Member (2) -> Junior Member (3) -> Other Member (4)
 * 2. Kannada Alphabetical Order (ಅ, ಆ, ಇ... ಕ, ಖ... ಸ, ಹ, ಳ)
 * 3. Home Name (tie-breaker)
 */
export function compareTshirtOrders(a: any, b: any): number {
  const rankA = getMemberTierRank(a.memberType || a.member?.memberType);
  const rankB = getMemberTierRank(b.memberType || b.member?.memberType);
  if (rankA !== rankB) {
    return rankA - rankB;
  }

  const nameA = getOrderDevoteeName(a);
  const nameB = getOrderDevoteeName(b);
  const cmp = nameA.localeCompare(nameB, 'kn', { sensitivity: 'base', numeric: true });
  if (cmp !== 0) return cmp;

  const homeA = a.homeName || a.member?.homeName || '';
  const homeB = b.homeName || b.member?.homeName || '';
  return homeA.localeCompare(homeB, 'kn', { sensitivity: 'base' });
}

/**
 * Generates and downloads an A4 Vertical vector PDF of Member T-Shirt Distribution Roster
 * Grouped into 4 tiers: Senior Member, Member, Junior Member, Other Member
 * Sorted in Kannada alphabetical order within each tier.
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
        layout: 'portrait',
        size: 'A4',
        margin: 28,
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

      const pageWidth = 595.28;
      const pageHeight = 841.89;
      const margin = 28;
      const contentWidth = pageWidth - margin * 2; // 539.28

      const cols = [
        { header: 'ಕ್ರ.ಸಂ\n(SL)', width: 32, align: 'center' as const },
        { header: 'ಸದಸ್ಯರ / ಭಕ್ತರ ಹೆಸರು\n(MEMBER / DEVOTEE NAME)', width: 160, align: 'left' as const },
        { header: 'ವರ್ಗ\n(CATEGORY)', width: 70, align: 'center' as const },
        { header: 'ಮನೆತನ / ವಿವರ\n(HOME / FAMILY)', width: 95, align: 'left' as const },
        { header: 'ಅಳತೆ\n(SIZE)', width: 44, align: 'center' as const },
        { header: 'ಸಂಖ್ಯೆ\n(QTY)', width: 40, align: 'center' as const },
        { header: 'ಸ್ವೀಕರಿಸಿದ ಸಹಿ\n(SIGNATURE / RECEIVED)', width: 98.28, align: 'center' as const },
      ];

      // Prepare Tier Groups
      const tierConfigs = [
        {
          rank: 1,
          titleKn: '⭐ ಹಿರಿಯ ಸದಸ್ಯರು',
          titleEn: 'SENIOR MEMBERS',
          bgFill: '#FEF3C7',
          textColor: '#78350F',
          borderColor: '#F59E0B',
        },
        {
          rank: 2,
          titleKn: '👥 ಸದಸ್ಯರು / ಸಮಿತಿ ಸದಸ್ಯರು',
          titleEn: 'MEMBERS & COMMITTEE',
          bgFill: '#EFF6FF',
          textColor: '#1E3A8A',
          borderColor: '#3B82F6',
        },
        {
          rank: 3,
          titleKn: '🌱 ಕಿರಿಯ ಸದಸ್ಯರು',
          titleEn: 'JUNIOR MEMBERS',
          bgFill: '#ECFDF5',
          textColor: '#065F46',
          borderColor: '#10B981',
        },
        {
          rank: 4,
          titleKn: '✨ ಇತರೆ ಸದಸ್ಯರು / ಭಕ್ತಾದಿಗಳು',
          titleEn: 'OTHER MEMBERS & DEVOTEES',
          bgFill: '#F5F3FF',
          textColor: '#5B21B6',
          borderColor: '#8B5CF6',
        },
      ];

      // Group orders and sort each group in Kannada alphabetical order
      const groups = tierConfigs
        .map((cfg) => {
          const items = orders.filter(
            (o) => getMemberTierRank(o.memberType || o.member?.memberType) === cfg.rank
          );
          items.sort((a, b) => {
            const nameA = getOrderDevoteeName(a);
            const nameB = getOrderDevoteeName(b);
            const cmp = nameA.localeCompare(nameB, 'kn', { sensitivity: 'base', numeric: true });
            if (cmp !== 0) return cmp;
            const homeA = a.homeName || a.member?.homeName || '';
            const homeB = b.homeName || b.member?.homeName || '';
            return homeA.localeCompare(homeB, 'kn', { sensitivity: 'base' });
          });
          return {
            ...cfg,
            items,
          };
        })
        .filter((g) => g.items.length > 0);

      // Compute summary stats
      const totalMembers = orders.length;
      let totalQty = 0;
      const sizeBreakdown: Record<string, number> = { S: 0, M: 0, L: 0, XL: 0, XXL: 0, '3XL': 0 };
      const tierCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };

      orders.forEach((o) => {
        const q = Math.max(1, Number(o.quantity) || 1);
        totalQty += q;
        const s = o.size as string;
        if (sizeBreakdown[s] !== undefined) {
          sizeBreakdown[s] = (sizeBreakdown[s] || 0) + q;
        }
        const r = getMemberTierRank(o.memberType || o.member?.memberType);
        if (tierCounts[r] !== undefined) {
          tierCounts[r] += 1;
        }
      });

      let y = margin;
      const currentYear = options?.year || '2026';

      const drawHeader = (isFirstPage: boolean) => {
        if (isFirstPage) {
          // Document Header / Title
          doc.fillColor('#7A1C1C').fontSize(14).text(
            'ಗಣೇಶೋತ್ಸವ ಸಮಿತಿ, ಕೆಳಗಿನೂರು, ನಾಜಗಾರ ಕ್ರಾಸ್',
            margin,
            y,
            { align: 'center', width: contentWidth }
          );
          y += 18;

          doc.fillColor('#1F2937').fontSize(11).text(
            `${currentYear} - ಸದಸ್ಯರ ಟಿ-ಶರ್ಟ್ ಅಳತೆ ಹಾಗೂ ವಿತರಣಾ ಪಟ್ಟಿ (T-Shirt Distribution Roster)`,
            margin,
            y,
            { align: 'center', width: contentWidth }
          );
          y += 16;

          // Stats / Summary Box
          const summaryH = 26;
          doc.roundedRect(margin, y, contentWidth, summaryH, 4).fillAndStroke('#FEF3C7', '#F59E0B');

          const line1 = `ಒಟ್ಟು ಸದಸ್ಯರು: ${totalMembers}   |   ಒಟ್ಟು ಟಿ-ಶರ್ಟ್‌ಗಳು: ${totalQty}   (ಹಿರಿಯ: ${tierCounts[1]}, ಸದಸ್ಯರು: ${tierCounts[2]}, ಕಿರಿಯ: ${tierCounts[3]}, ಇತರೆ: ${tierCounts[4]})`;
          const line2 = `ಅಳತೆ ವಿವರ (Sizes): S: ${sizeBreakdown['S'] || 0}   M: ${sizeBreakdown['M'] || 0}   L: ${sizeBreakdown['L'] || 0}   XL: ${sizeBreakdown['XL'] || 0}   XXL: ${sizeBreakdown['XXL'] || 0}   3XL: ${sizeBreakdown['3XL'] || 0}`;

          doc.fillColor('#78350F').fontSize(8.5).text(
            line1,
            margin,
            y + 4.5,
            { align: 'center', width: contentWidth }
          );
          doc.fillColor('#92400E').fontSize(8).text(
            line2,
            margin,
            y + 14.5,
            { align: 'center', width: contentWidth }
          );
          y += summaryH + 8;
        } else {
          doc.fillColor('#7A1C1C').fontSize(9.5).text(
            `ಗಣೇಶೋತ್ಸವ ಸಮಿತಿ - ಸದಸ್ಯರ ಟಿ-ಶರ್ಟ್ ವಿತರಣಾ ಪಟ್ಟಿ (${currentYear})`,
            margin,
            y,
            { align: 'left', width: contentWidth }
          );
          y += 14;
        }

        // Table Header
        const headerHeight = 26;
        doc.rect(margin, y, contentWidth, headerHeight).fill('#7A1C1C');

        let curX = margin;
        cols.forEach((col) => {
          doc.fillColor('#FFFFFF').fontSize(8).text(
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

      const bannerH = 19;
      const rowHeight = 22;
      const bottomLimit = pageHeight - margin - 22;
      let globalIndex = 0;

      groups.forEach((group) => {
        // Page break check before printing tier section ribbon
        if (y + bannerH + rowHeight > bottomLimit) {
          doc.addPage();
          y = margin;
          drawHeader(false);
        }

        // Render Tier Banner
        doc.rect(margin, y, contentWidth, bannerH).fillAndStroke(group.bgFill, group.borderColor);

        doc.fillColor(group.textColor).fontSize(9).text(
          `${group.titleKn} (${group.titleEn})`,
          margin + 8,
          y + 4.5,
          { width: contentWidth - 170, align: 'left' }
        );

        const groupQty = group.items.reduce(
          (sum: number, it: any) => sum + (Math.max(1, Number(it.quantity) || 1)),
          0
        );
        doc.fillColor(group.textColor).fontSize(8).text(
          `ಸದಸ್ಯರು: ${group.items.length}  |  ಟಿ-ಶರ್ಟ್: ${groupQty}`,
          margin + contentWidth - 160,
          y + 5,
          { width: 152, align: 'right' }
        );

        y += bannerH;

        // Render Tier Rows
        group.items.forEach((o: any, idx: number) => {
          if (y + rowHeight > bottomLimit) {
            doc.addPage();
            y = margin;
            drawHeader(false);
          }

          globalIndex++;
          const isEven = idx % 2 === 0;
          const rowBg = isEven ? '#FFFFFF' : '#F9FAFB';
          doc.rect(margin, y, contentWidth, rowHeight).fill(rowBg);

          // Row bottom separator line
          doc.strokeColor('#E5E7EB').lineWidth(0.5)
            .moveTo(margin, y + rowHeight)
            .lineTo(margin + contentWidth, y + rowHeight)
            .stroke();

          let curX = margin;

          // 1. SL NO
          doc.fillColor('#4B5563').fontSize(8.5).text(
            String(globalIndex),
            curX,
            y + 6,
            { width: cols[0].width, align: cols[0].align }
          );
          curX += cols[0].width;

          // 2. DEVOTEE / MEMBER NAME
          const memberName = getOrderDevoteeName(o) || '-';
          doc.fillColor('#111827').fontSize(9).text(
            memberName,
            curX + 4,
            y + 5.5,
            { width: cols[1].width - 8, align: cols[1].align, lineBreak: false, ellipsis: true }
          );
          curX += cols[1].width;

          // 3. CATEGORY BADGE
          let catText = o.memberType || o.member?.memberType || 'Other';
          if (catText.includes('Senior') || catText.includes('ಹಿರಿಯ')) catText = 'ಹಿರಿಯರು';
          else if (catText.includes('Junior') || catText.includes('ಕಿರಿಯ')) catText = 'ಕಿರಿಯರು';
          else if (catText === 'Committee Member' || catText.includes('ಸಮಿತಿ')) catText = 'ಸಮಿತಿ';
          else if (catText === 'Member' || catText.includes('ಸದಸ್ಯ')) catText = 'ಸದಸ್ಯರು';
          else catText = 'ಇತರೆ';

          doc.fillColor('#374151').fontSize(8).text(
            catText,
            curX + 2,
            y + 6,
            { width: cols[2].width - 4, align: cols[2].align }
          );
          curX += cols[2].width;

          // 4. HOME / FAMILY
          const homeText = o.homeName || o.member?.homeName || '-';
          doc.fillColor('#4B5563').fontSize(8.5).text(
            homeText,
            curX + 4,
            y + 6,
            { width: cols[3].width - 8, align: cols[3].align, lineBreak: false, ellipsis: true }
          );
          curX += cols[3].width;

          // 5. SIZE BADGE
          const sizeW = 28;
          const sizeH = 14;
          const sizeX = curX + (cols[4].width - sizeW) / 2;
          const sizeY = y + 4;

          doc.roundedRect(sizeX, sizeY, sizeW, sizeH, 3).fill('#DBEAFE');
          doc.fillColor('#1E40AF').fontSize(8.5).text(
            o.size || '-',
            sizeX,
            sizeY + 2.5,
            { width: sizeW, align: 'center' }
          );
          curX += cols[4].width;

          // 6. QUANTITY
          const qty = o.quantity || 1;
          doc.fillColor('#111827').fontSize(9).text(
            String(qty),
            curX,
            y + 6,
            { width: cols[5].width, align: cols[5].align }
          );
          curX += cols[5].width;

          // 7. SIGNATURE / RECEIVED (Subtle dotted line)
          doc.strokeColor('#D1D5DB').lineWidth(0.5)
            .moveTo(curX + 8, y + rowHeight - 6)
            .lineTo(curX + cols[6].width - 8, y + rowHeight - 6)
            .stroke();

          y += rowHeight;
        });

        y += 4; // Spacing after each tier section
      });

      // Committee verification signatures at end of document if space permits
      if (y + 45 <= bottomLimit) {
        y += 12;
        const sigColW = contentWidth / 3;
        doc.strokeColor('#9CA3AF').lineWidth(0.5);

        doc.moveTo(margin + 20, y + 16).lineTo(margin + sigColW - 20, y + 16).stroke();
        doc.fillColor('#6B7280').fontSize(7.5).text('ಅಧ್ಯಕ್ಷರು (President)', margin + 20, y + 19, { width: sigColW - 40, align: 'center' });

        doc.moveTo(margin + sigColW + 20, y + 16).lineTo(margin + sigColW * 2 - 20, y + 16).stroke();
        doc.fillColor('#6B7280').fontSize(7.5).text('ಕಾರ್ಯದರ್ಶಿ (Secretary)', margin + sigColW + 20, y + 19, { width: sigColW - 40, align: 'center' });

        doc.moveTo(margin + sigColW * 2 + 20, y + 16).lineTo(margin + contentWidth - 20, y + 16).stroke();
        doc.fillColor('#6B7280').fontSize(7.5).text('ಖಜಾಂಚಿ / ಸಂಯೋಜಕರು (Treasurer)', margin + sigColW * 2 + 20, y + 19, { width: sigColW - 40, align: 'center' });
      }

      // Page Footers across all pages
      const range = doc.bufferedPageRange();
      for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);
        doc.fillColor('#9CA3AF').fontSize(7.5).text(
          `Page ${i + 1} of ${range.count}  |  Ganeshotsava Samiti Kelaginuru Najagara Cross  |  T-Shirt Distribution`,
          margin,
          pageHeight - 20,
          { align: 'center', width: contentWidth }
        );
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

export interface ExportCustomEventPdfOptions {
  filenamePrefix?: string;
  stats?: {
    totalRegistrations: number;
    totalQuantity: number;
    categoryBreakdown: Record<string, number>;
  };
}

/**
 * Generates and downloads an A4 Vertical (Portrait) vector PDF for any Dynamic Custom Event registration list
 */
export const exportCustomEventToPdf = async (
  event: any,
  registrations: any[],
  language: string,
  options?: ExportCustomEventPdfOptions
): Promise<void> => {
  const fontResponse = await fetch('/fonts/NirmalaUI.ttf');
  if (!fontResponse.ok) {
    throw new Error('Failed to load Kannada Unicode font for PDF generation.');
  }
  const fontBuffer = await fontResponse.arrayBuffer();

  return new Promise((resolve, reject) => {
    try {
      const doc = new (PDFDocument as any)({
        layout: 'portrait',
        size: 'A4',
        margin: 28,
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
            `${options?.filenamePrefix || event.slug || 'event_registrations'}_${dateStr}.pdf`
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

      const pageWidth = 595.28;
      const pageHeight = 841.89;
      const margin = 28;
      const contentWidth = pageWidth - margin * 2; // 539.28

      const cols = [
        { header: 'ಕ್ರ.ಸಂ\n(SL)', width: 34, align: 'center' as const },
        { header: 'ಭಾಗವಹಿಸುವವರ ಹೆಸರು\n(PARTICIPANT NAME)', width: 170, align: 'left' as const },
        { header: 'ವರ್ಗ / ವಿವರ\n(CATEGORY / OPTION)', width: 110, align: 'left' as const },
        { header: 'ಮನೆತನ / ವಿಳಾಸ\n(HOME / ADDRESS)', width: 100, align: 'left' as const },
        { header: 'ಮೊಬೈಲ್ / ಸಂಖ್ಯೆ\n(PHONE / QTY)', width: 60, align: 'center' as const },
        { header: 'ಸಹಿ / ಷರಾ\n(SIGNATURE)', width: 65.28, align: 'center' as const },
      ];

      let y = margin;
      const currentYear = event.year || '2026';
      const stats = options?.stats;

      const drawHeader = (isFirstPage: boolean) => {
        if (isFirstPage) {
          doc.fillColor('#7A1C1C').fontSize(14).text(
            'ಗಣೇಶೋತ್ಸವ ಸಮಿತಿ, ಕೆಳಗಿನೂರು, ನಾಜಗಾರ ಕ್ರಾಸ್',
            margin,
            y,
            { align: 'center', width: contentWidth }
          );
          y += 18;

          const eventHeaderTitle = `${event.titleKannada || event.title} - ${currentYear}`;
          doc.fillColor('#1F2937').fontSize(11).text(
            `${eventHeaderTitle} - ನೋಂದಾಯಿತ ಪಟ್ಟಿ (Registration Roster)`,
            margin,
            y,
            { align: 'center', width: contentWidth }
          );
          y += 16;

          // Stats / Summary Box if stats are provided
          if (stats && Object.keys(stats.categoryBreakdown || {}).length > 0) {
            const summaryH = 22;
            doc.roundedRect(margin, y, contentWidth, summaryH, 4).fillAndStroke('#FEF3C7', '#F59E0B');

            const breakdownEntries = Object.entries(stats.categoryBreakdown)
              .map(([cat, count]) => `${cat}: ${count}`)
              .join('   |   ');

            const summaryText = `ಒಟ್ಟು (TOTAL): ${stats.totalRegistrations}    |    ${breakdownEntries}`;

            doc.fillColor('#78350F').fontSize(8).text(
              summaryText,
              margin,
              y + 6,
              { align: 'center', width: contentWidth }
            );
            y += summaryH + 8;
          } else {
            y += 4;
          }
        } else {
          doc.fillColor('#7A1C1C').fontSize(9.5).text(
            `${event.titleKannada || event.title} - ನೋಂದಾಯಿತ ಪಟ್ಟಿ (${currentYear})`,
            margin,
            y,
            { align: 'left', width: contentWidth }
          );
          y += 14;
        }

        // Table Header
        const headerHeight = 26;
        doc.rect(margin, y, contentWidth, headerHeight).fill('#7A1C1C');

        let curX = margin;
        cols.forEach((col) => {
          doc.fillColor('#FFFFFF').fontSize(8).text(
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

      const rowHeight = 22;
      const bottomLimit = pageHeight - margin - 20;

      registrations.forEach((r, index) => {
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
        doc.fillColor('#4B5563').fontSize(8.5).text(
          String(index + 1),
          curX,
          y + 6,
          { width: cols[0].width, align: cols[0].align }
        );
        curX += cols[0].width;

        // 2. PARTICIPANT NAME
        doc.fillColor('#111827').fontSize(9).text(
          r.name || '-',
          curX + 4,
          y + 5.5,
          { width: cols[1].width - 8, align: cols[1].align, lineBreak: false, ellipsis: true }
        );
        curX += cols[1].width;

        // 3. CATEGORY / OPTION
        doc.fillColor('#374151').fontSize(8.5).text(
          r.category || '-',
          curX + 4,
          y + 6,
          { width: cols[2].width - 8, align: cols[2].align, lineBreak: false, ellipsis: true }
        );
        curX += cols[2].width;

        // 4. HOME / ADDRESS
        doc.fillColor('#4B5563').fontSize(8.5).text(
          r.homeName || '-',
          curX + 4,
          y + 6,
          { width: cols[3].width - 8, align: cols[3].align, lineBreak: false, ellipsis: true }
        );
        curX += cols[3].width;

        // 5. PHONE / QTY
        const phoneOrQty = r.phone || (r.quantity && r.quantity > 1 ? `Qty: ${r.quantity}` : '1');
        doc.fillColor('#111827').fontSize(8.5).text(
          phoneOrQty,
          curX,
          y + 6,
          { width: cols[4].width, align: cols[4].align, lineBreak: false, ellipsis: true }
        );
        curX += cols[4].width;

        // 6. SIGNATURE / RECEIVED
        doc.strokeColor('#D1D5DB').lineWidth(0.5)
          .moveTo(curX + 6, y + rowHeight - 6)
          .lineTo(curX + cols[5].width - 6, y + rowHeight - 6)
          .stroke();

        y += rowHeight;
      });

      // Page Footers across all pages
      const range = doc.bufferedPageRange();
      for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);
        doc.fillColor('#9CA3AF').fontSize(7.5).text(
          `Page ${i + 1} of ${range.count}  |  Ganeshotsava Samiti Kelaginuru Najagara Cross  |  ${event.title}`,
          margin,
          pageHeight - 20,
          { align: 'center', width: contentWidth }
        );
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

