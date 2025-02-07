import * as XLSX from 'xlsx';

export const exportStudentsToExcel = (students, userRole, fileName = 'student_interns.xlsx') => {
  // Check if user is admin
  if (userRole !== 'admin') {
    throw new Error('Export functionality is only available for admin users');
  }

  // Format the data for Excel export
  const formattedData = students.map(student => ({
    'Partner Host Training Establishments (HTEs)': student.partnerCompany,
    'Student Name': student.name,
    'Gender': student.gender,
    'Duration': `${new Date(student.startDate).toLocaleDateString()} - ${new Date(student.endDate).toLocaleDateString()}`
  }));

  // Create a new workbook
  const workbook = XLSX.utils.book_new();
  
  // Create a worksheet from the formatted data
  const worksheet = XLSX.utils.json_to_sheet(formattedData);

  // Set column widths
  worksheet['!cols'] = [
    { width: 40 }, // Partner Host Training Establishments (HTEs)
    { width: 25 }, // Student Name
    { width: 10 },  // Gender
    { width: 25 }   // Duration
  ];

  // Add the worksheet to the workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Student Interns');

  // Write the file and trigger download
  XLSX.writeFile(workbook, fileName);
}; 