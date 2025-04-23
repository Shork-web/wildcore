import * as XLSX from 'xlsx';

// Make sure XLSX is properly loaded
if (!XLSX || !XLSX.utils || !XLSX.writeFile) {
  console.error('XLSX library not properly loaded:', XLSX);
}

class ExportKeysManager {
  constructor() {
    this._headerStyle = {
      font: { 
        bold: true,
        color: { rgb: "FFFFFF" }
      },
      fill: { 
        fgColor: { rgb: "800000" } 
      },
      alignment: { 
        horizontal: 'center',
        vertical: 'center'
      }
    };
  }

  /**
   * Export student keys to Excel
   * @param {Array} students - Array of student objects with key data
   * @param {string} keyType - Type of keys to export: 'midterms' or 'finals'
   * @param {string} fileName - Name of the output file
   */
  exportKeysToExcel(students, keyType = 'midterms', fileName = 'student_keys.xlsx') {
    try {
      console.log('Starting keys export process with', students.length, 'students');
      
      // Create a new workbook
      const workbook = XLSX.utils.book_new();
      
      // Create header data
      const headerData = [
        ['Student Keys Report'],
        ['Wild R.O.U.T.E System'],
        [],
        ['This report contains sensitive access information. Handle with care.'],
        []
      ];

      // Create table headers based on keyType
      let tableHeaders;
      if (keyType === 'midterms') {
        tableHeaders = [
          ['Midterms Key', 'Name', 'Program', 'Gender', 'Email', 'Internship Email', 'Company', 'Contact Person', 'Location']
        ];
      } else { // 'finals'
        tableHeaders = [
          ['Finals Key', 'Name', 'Program', 'Gender', 'Email', 'Internship Email', 'Company', 'Contact Person', 'Location']
        ];
      }

      // Format the student data for Excel export based on keyType
      const studentRows = students.map(student => {
        if (keyType === 'midterms') {
          return [
            student.midtermsKey || 'Not set',
            student.name || 'N/A',
            student.program || 'N/A',
            student.gender || 'N/A',
            student.email || 'N/A',
            student.internshipEmail || 'N/A',
            student.partnerCompany || 'N/A',
            student.contactPerson || 'N/A',
            student.location || 'N/A'
          ];
        } else { // 'finals'
          return [
            student.finalsKey || 'Not set',
            student.name || 'N/A',
            student.program || 'N/A',
            student.gender || 'N/A',
            student.email || 'N/A',
            student.internshipEmail || 'N/A',
            student.partnerCompany || 'N/A',
            student.contactPerson || 'N/A',
            student.location || 'N/A'
          ];
        }
      });

      // Combine all data
      const allData = [...headerData, ...tableHeaders, ...studentRows];

      // Create a worksheet from the combined data
      const worksheet = XLSX.utils.aoa_to_sheet(allData);

      // Set column widths - always 9 columns now
      worksheet['!cols'] = [
        { width: 15 }, // Key (Midterms or Finals)
        { width: 30 }, // Name
        { width: 20 }, // Program
        { width: 10 }, // Gender
        { width: 30 }, // Email
        { width: 30 }, // Internship Email
        { width: 30 }, // Company
        { width: 25 }, // Contact Person
        { width: 25 }  // Location
      ];

      // Set row heights for header section
      worksheet['!rows'] = Array(allData.length).fill().map((_, i) => {
        // Make header rows slightly taller
        if (i < headerData.length) {
          return { hpt: 20 }; // Height in points
        }
        return { hpt: 18 }; // Default row height
      });

      // Apply styling to title rows
      const titleStyle = {
        font: { bold: true, sz: 14 },
        alignment: { horizontal: 'center' }
      };

      // Apply styling to table header row
      const tableHeaderStyle = {
        font: { bold: true, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '800000' } },
        alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
        border: {
          top: { style: 'thin' },
          bottom: { style: 'thin' },
          left: { style: 'thin' },
          right: { style: 'thin' }
        }
      };

      // Apply styling to data cells
      const dataCellStyle = {
        border: {
          top: { style: 'thin' },
          bottom: { style: 'thin' },
          left: { style: 'thin' },
          right: { style: 'thin' }
        },
        alignment: { 
          horizontal: 'center',
          vertical: 'center' 
        }
      };

      // Always 9 columns now
      const columnCount = 9;

      // Apply styles to cells
      for (let i = 0; i < allData.length; i++) {
        // Title styling
        if (i < headerData.length) {
          for (let j = 0; j < columnCount; j++) {
            const cellRef = XLSX.utils.encode_cell({ r: i, c: j });
            if (!worksheet[cellRef]) worksheet[cellRef] = {};
            worksheet[cellRef].s = titleStyle;
          }
        }
        
        // Table header styling
        if (i === headerData.length) {
          for (let j = 0; j < columnCount; j++) {
            const cellRef = XLSX.utils.encode_cell({ r: i, c: j });
            if (!worksheet[cellRef]) worksheet[cellRef] = {};
            worksheet[cellRef].s = tableHeaderStyle;
          }
        }
        
        // Data cells styling
        if (i > headerData.length) {
          for (let j = 0; j < columnCount; j++) {
            const cellRef = XLSX.utils.encode_cell({ r: i, c: j });
            if (!worksheet[cellRef]) worksheet[cellRef] = {};
            worksheet[cellRef].s = dataCellStyle;
          }
        }
      }

      // Merge cells for title headers
      worksheet['!merges'] = [
        // Student Keys Report
        { s: { r: 0, c: 0 }, e: { r: 0, c: columnCount - 1 } },
        // Wild R.O.U.T.E System
        { s: { r: 1, c: 0 }, e: { r: 1, c: columnCount - 1 } },
        // Handle with care message
        { s: { r: 3, c: 0 }, e: { r: 3, c: columnCount - 1 } },
      ];
      
      // Generate appropriate filename if not specified
      if (fileName === 'student_keys.xlsx') {
        fileName = keyType === 'midterms' ? 'midterms_keys.xlsx' : 'finals_keys.xlsx';
      }
      
      // Add the worksheet to the workbook
      const sheetName = keyType === 'midterms' ? 'Midterms Keys' : 'Finals Keys';
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      
      // Write the file and trigger download
      XLSX.writeFile(workbook, fileName);
      
      console.log('Keys export completed successfully');
    } catch (error) {
      console.error('Error in exportKeysToExcel:', error);
      throw error;
    }
  }
}

// Create and export a singleton instance
const exportKeysManager = new ExportKeysManager();
export default exportKeysManager;

// For backward compatibility
export const exportKeysToExcel = (students, fileName) => {
  return exportKeysManager.exportKeysToExcel(students, 'midterms', fileName);
}; 