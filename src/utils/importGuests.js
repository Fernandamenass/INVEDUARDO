import * as XLSX from 'xlsx';
import { insertGuests } from '../services/supabaseClient.js';

/**
 * Generate a unique ID for a guest using crypto.randomUUID()
 * @returns {string} A unique UUID
 */
export function generateUniqueId() {
  return crypto.randomUUID();
}

/**
 * Validate that all unique IDs in the array are unique
 * @param {string[]} uniqueIds - Array of unique IDs to validate
 * @returns {boolean} True if all IDs are unique, false otherwise
 */
export function validateUniqueIds(uniqueIds) {
  const uniqueSet = new Set(uniqueIds);
  return uniqueSet.size === uniqueIds.length;
}

/**
 * Read Excel file and parse guest data
 * @param {File} file - Excel file to read
 * @returns {Promise<Array<{name: string, companion_limit: number}>>} Array of guest data
 */
export async function readExcelFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get the first sheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        resolve(jsonData);
      } catch (error) {
        reject(new Error(`Error reading Excel file: ${error.message}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Error reading file'));
    };
    
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Process guest data and add unique IDs
 * @param {Array<object>} rawData - Raw data from Excel
 * @returns {Array<{name: string, unique_id: string, companion_limit: number, confirmed: boolean}>}
 */
export function processGuestData(rawData) {
  const processedGuests = rawData.map(row => {
    // Support different column name variations
    const name = row.name || row.Name || row.nombre || row.Nombre || '';
    const companionLimit = row.companion_limit || row.companionLimit || 
                          row.companion_limit || row.limite_acompañantes || 
                          row.limite || 0;
    
    return {
      name: name.trim(),
      unique_id: generateUniqueId(),
      companion_limit: parseInt(companionLimit, 10) || 0,
      confirmed: false
    };
  });
  
  // Validate all unique IDs are unique
  const uniqueIds = processedGuests.map(g => g.unique_id);
  if (!validateUniqueIds(uniqueIds)) {
    throw new Error('Generated unique IDs are not unique. This should not happen.');
  }
  
  return processedGuests;
}

/**
 * Import guests from Excel file to Supabase
 * @param {File} file - Excel file containing guest data
 * @returns {Promise<{success: boolean, data: array|null, error: string|null, count: number}>}
 */
export async function importGuestsFromExcel(file) {
  try {
    // Validate file type
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ];
    
    if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls|csv)$/i)) {
      return {
        success: false,
        data: null,
        error: 'Invalid file type. Please upload an Excel file (.xlsx, .xls) or CSV file.',
        count: 0
      };
    }
    
    // Read Excel file
    const rawData = await readExcelFile(file);
    
    if (!rawData || rawData.length === 0) {
      return {
        success: false,
        data: null,
        error: 'No data found in the Excel file.',
        count: 0
      };
    }
    
    // Process guest data and add unique IDs
    const guestsData = processGuestData(rawData);
    
    // Validate guest data
    const invalidGuests = guestsData.filter(g => !g.name || g.name === '');
    if (invalidGuests.length > 0) {
      return {
        success: false,
        data: null,
        error: `Found ${invalidGuests.length} guest(s) without a name. All guests must have a name.`,
        count: 0
      };
    }
    
    // Insert guests into Supabase
    const { data, error } = await insertGuests(guestsData);
    
    if (error) {
      // Check for duplicate unique_id error
      if (error.code === '23505') {
        return {
          success: false,
          data: null,
          error: 'Duplicate unique_id detected. Some guests may already exist in the database.',
          count: 0
        };
      }
      
      return {
        success: false,
        data: null,
        error: `Database error: ${error.message}`,
        count: 0
      };
    }
    
    return {
      success: true,
      data: data,
      error: null,
      count: data ? data.length : 0
    };
    
  } catch (error) {
    return {
      success: false,
      data: null,
      error: error.message || 'An unexpected error occurred during import.',
      count: 0
    };
  }
}
