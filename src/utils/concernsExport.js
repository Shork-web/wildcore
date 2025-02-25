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