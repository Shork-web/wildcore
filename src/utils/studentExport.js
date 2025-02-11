import * as XLSX from 'xlsx';

export const exportStudentsToExcel = (students, userRole, fileName = 'student_interns.xlsx') => {
  // Check if user is admin
  if (userRole !== 'admin') {
    throw new Error('Export functionality is only available for admin users');
  }

  // Format the data for Excel export
  const formattedData = students.map(student => {
    // Format dates properly
    const startDate = student.startDate ? new Date(student.startDate).toLocaleDateString() : 'N/A';
    const endDate = student.endDate ? new Date(student.endDate).toLocaleDateString() : 'N/A';
    const duration = startDate !== 'N/A' || endDate !== 'N/A' ? `${startDate} - ${endDate}` : 'N/A';

    return {
      'Partner Host Training Establishments (HTEs)': student.partnerCompany || 'N/A',
      'Name of Student Interns': student.name || 'N/A',
      'Program': student.program || 'N/A',
      'Gender': student.gender || 'N/A',
      'Dates of Duration of the Internship': duration
    };
  });

  // Create a new workbook
  const workbook = XLSX.utils.book_new();
  
  // Create a worksheet from the formatted data
  const worksheet = XLSX.utils.json_to_sheet(formattedData);

  // Set column widths
  worksheet['!cols'] = [
    { width: 40 }, // Partner Host Training Establishments (HTEs)
    { width: 25 }, // Name of Student Interns
    { width: 35 }, // Program
    { width: 10 }, // Gender
    { width: 25 }  // Dates of Duration of the Internship
  ];

  // Add styling to header row
  const headerStyle = {
    font: { 
      bold: true,
      color: { rgb: "FFFFFF" }
    },
    fill: { 
      fgColor: { rgb: "800000" } 
    }
  };

  // Get the range of the data
  const range = XLSX.utils.decode_range(worksheet['!ref']);
  
  // Apply header style to first row
  for(let C = range.s.c; C <= range.e.c; ++C) {
    const address = XLSX.utils.encode_cell({ r: 0, c: C });
    if(!worksheet[address]) continue;
    worksheet[address].s = headerStyle;
  }

  // Add the worksheet to the workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Student Interns');

  // Write the file and trigger download
  XLSX.writeFile(workbook, fileName);
}; 