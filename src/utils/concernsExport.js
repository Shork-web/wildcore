import * as XLSX from 'xlsx';

export const exportConcernsToExcel = (students, fileName = 'concerns_solutions.xlsx') => {
  // Format the data for Excel export
  const formattedData = students.map(student => ({
    'Program': student.program,
    'Issues and Concerns Encountered': student.concerns || 'N/A',
    'Solutions': student.solutions || 'N/A',
    'Recommendations': student.recommendations || 'N/A'
  }));

  // Create a new workbook
  const workbook = XLSX.utils.book_new();
  
  // Create a worksheet from the formatted data
  const worksheet = XLSX.utils.json_to_sheet(formattedData);

  // Set column widths
  worksheet['!cols'] = [
    { width: 25 }, // Program
    { width: 40 }, // Issues and Concerns Encountered
    { width: 40 }, // Solutions
    { width: 40 }  // Recommendations
  ];

  // Apply center alignment to all cells
  const range = XLSX.utils.decode_range(worksheet['!ref']);
  for (let r = range.s.r; r <= range.e.r; ++r) {
    for (let c = range.s.c; c <= range.e.c; ++c) {
      const cellRef = XLSX.utils.encode_cell({ r, c });
      if (!worksheet[cellRef]) continue;
      if (!worksheet[cellRef].s) worksheet[cellRef].s = {};
      worksheet[cellRef].s.alignment = { horizontal: 'center', vertical: 'center' };
    }
  }

  // Apply header styling
  for (let c = range.s.c; c <= range.e.c; ++c) {
    const headerRef = XLSX.utils.encode_cell({ r: 0, c });
    if (!worksheet[headerRef]) continue;
    worksheet[headerRef].s = {
      font: { bold: true, color: { rgb: 'FFFFFF' } },
      fill: { fgColor: { rgb: '800000' } },
      alignment: { horizontal: 'center', vertical: 'center' }
    };
  }

  // Add the worksheet to the workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Concerns & Solutions');

  // Write the file and trigger download
  XLSX.writeFile(workbook, fileName);
};

export const exportConcerns = (data) => {
  // Add your export logic here
  // Example:
  const headers = [
    'Student Name',
    'Program',
    'Partner Company',
    'Concerns',
    'Solutions',
    'Recommendations'
  ];

  const rows = data.map(item => [
    item.name,
    item.program,
    item.partnerCompany,
    item.concerns,
    item.solutions,
    item.recommendations
  ]);

  return [headers, ...rows];
};