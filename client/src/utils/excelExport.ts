import * as XLSX from 'xlsx';

export interface ExportKatheOptions {
  headers?: string[];
  filenamePrefix?: string;
  sheetName?: string;
}

/**
 * Exports Kathe participant registrations as a Microsoft Excel (.xlsx) file.
 * 
 * Features:
 * - Proper UTF-8 OpenXML format: Natively displays Kannada (ನಾಜಗಾರ, ಕಡೇ, ಕರ್ಕಿ), Telugu, Hindi, English without mojibake.
 * - Phone numbers stored strictly as text cells (`t: 's'`, `z: '@'`): Prevents scientific notation (e.g. 8.05E+09) and preserves leading zeros.
 * - Auto-adjusted column widths for clear presentation.
 */
export const exportKatheToExcel = (
  participants: any[],
  language: string,
  options?: ExportKatheOptions
) => {
  const headers = options?.headers || [
    'First Name',
    'Last Name',
    'Home/Family Name',
    'Phone Number',
    'Place/Area',
    'Address',
    'Book Number',
    'Status',
    'Year'
  ];

  const rows = participants.map((p) => {
    let placeName = '';
    if (p.place && typeof p.place === 'object') {
      placeName = language === 'kn' ? (p.place.nameKannada || p.place.name) : (p.place.name || p.place.nameKannada);
    } else if (p.place) {
      placeName = String(p.place);
    }

    return [
      p.firstName || '',
      p.lastName || '',
      p.homeName || '',
      p.phone ? String(p.phone).trim() : '',
      placeName,
      p.address || '',
      p.bookNo || p.notes || '',
      p.registrationStatus || (p.confirmed ? 'CONFIRMED' : 'PENDING'),
      p.year || ''
    ];
  });

  const data = [headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(data);

  // Set column widths
  ws['!cols'] = [
    { wch: 18 }, // First Name
    { wch: 18 }, // Last Name
    { wch: 22 }, // Home/Family Name
    { wch: 18 }, // Phone Number
    { wch: 20 }, // Place/Area
    { wch: 30 }, // Address
    { wch: 16 }, // Book Number
    { wch: 15 }, // Status
    { wch: 10 }  // Year
  ];

  // Explicitly configure Phone Number (index 3 / col D) and Book Number (index 6 / col G)
  // as String cell type ('s') with Text formatting ('@')
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:I1');
  const phoneColIndex = 3;
  const bookNoColIndex = 6;

  for (let R = 1; R <= range.e.r; ++R) {
    const phoneAddr = XLSX.utils.encode_cell({ r: R, c: phoneColIndex });
    if (ws[phoneAddr]) {
      ws[phoneAddr].t = 's';
      ws[phoneAddr].z = '@';
    }
    const bookAddr = XLSX.utils.encode_cell({ r: R, c: bookNoColIndex });
    if (ws[bookAddr]) {
      ws[bookAddr].t = 's';
      ws[bookAddr].z = '@';
    }
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, options?.sheetName || 'Kathe Registrations');

  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `${options?.filenamePrefix || 'kathe_registrations'}_${dateStr}.xlsx`;

  // Generate binary XLSX buffer and trigger download in browser
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Alternative CSV exporter with UTF-8 BOM (\uFEFF) and text-safe phone numbers.
 */
export const exportKatheToCsvWithBom = (
  participants: any[],
  language: string,
  options?: ExportKatheOptions
) => {
  const headers = options?.headers || [
    'First Name',
    'Last Name',
    'Home/Family Name',
    'Phone Number',
    'Place/Area',
    'Address',
    'Book Number',
    'Status',
    'Year'
  ];

  const rows = participants.map((p) => {
    let placeName = '';
    if (p.place && typeof p.place === 'object') {
      placeName = language === 'kn' ? (p.place.nameKannada || p.place.name) : (p.place.name || p.place.nameKannada);
    } else if (p.place) {
      placeName = String(p.place);
    }

    return [
      p.firstName || '',
      p.lastName || '',
      p.homeName || '',
      p.phone ? `\t${String(p.phone).trim()}` : '', // Tab prefix prevents Excel scientific notation in CSV
      placeName,
      p.address || '',
      p.bookNo || p.notes || '',
      p.registrationStatus || (p.confirmed ? 'CONFIRMED' : 'PENDING'),
      p.year || ''
    ];
  });

  // UTF-8 BOM prefix \uFEFF signals UTF-8 to Microsoft Excel
  const bom = '\uFEFF';
  const csvContent = bom + [
    headers.join(','),
    ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
  ].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const dateStr = new Date().toISOString().split('T')[0];
  link.setAttribute('download', `${options?.filenamePrefix || 'kathe_registrations'}_${dateStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
