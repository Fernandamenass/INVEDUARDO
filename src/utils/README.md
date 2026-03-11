# Guest Import Utility

## Overview

The `importGuests.js` utility provides functionality to import guest data from Excel files into the Supabase database.

## Usage

### Basic Import

```javascript
import { importGuestsFromExcel } from './utils/importGuests.js';

// In a file input handler
async function handleFileUpload(event) {
  const file = event.target.files[0];
  
  const result = await importGuestsFromExcel(file);
  
  if (result.success) {
    console.log(`Successfully imported ${result.count} guests`);
  } else {
    console.error(`Import failed: ${result.error}`);
  }
}
```

### Excel File Format

The Excel file should have the following columns:

| Column Name | Type | Required | Description |
|------------|------|----------|-------------|
| `name` or `nombre` | Text | Yes | Full name of the guest |
| `companion_limit` or `limite_acompañantes` | Number | No | Maximum number of companions (default: 0) |

**Example Excel file:**

| name | companion_limit |
|------|----------------|
| Juan Pérez | 2 |
| María García | 3 |
| Carlos López | 1 |

**Alternative Spanish format:**

| nombre | limite_acompañantes |
|--------|-------------------|
| Juan Pérez | 2 |
| María García | 3 |

### Supported File Types

- `.xlsx` (Excel 2007+)
- `.xls` (Excel 97-2003)
- `.csv` (Comma-separated values)

## Functions

### `importGuestsFromExcel(file)`

Main function to import guests from an Excel file.

**Parameters:**
- `file` (File): The Excel file to import

**Returns:**
```javascript
{
  success: boolean,    // Whether the import was successful
  data: array|null,    // Array of imported guest records
  error: string|null,  // Error message if failed
  count: number        // Number of guests imported
}
```

### `generateUniqueId()`

Generates a unique UUID for a guest using `crypto.randomUUID()`.

**Returns:** `string` - A unique UUID

### `validateUniqueIds(uniqueIds)`

Validates that all IDs in an array are unique.

**Parameters:**
- `uniqueIds` (string[]): Array of unique IDs to validate

**Returns:** `boolean` - True if all IDs are unique

### `processGuestData(rawData)`

Processes raw Excel data and adds unique IDs.

**Parameters:**
- `rawData` (object[]): Raw data from Excel

**Returns:** Array of processed guest objects

### `readExcelFile(file)`

Reads an Excel file and parses it to JSON.

**Parameters:**
- `file` (File): Excel file to read

**Returns:** `Promise<Array>` - Array of row objects

## Error Handling

The utility handles the following error cases:

1. **Invalid file type**: Returns error if file is not Excel or CSV
2. **Empty file**: Returns error if no data found
3. **Missing names**: Returns error if any guest has no name
4. **Duplicate unique_ids**: Returns error if database detects duplicates
5. **Database errors**: Returns error with database error message

## Features

- ✅ Generates unique UUID for each guest
- ✅ Validates all unique IDs are irrepetible
- ✅ Supports multiple column name formats (English/Spanish)
- ✅ Handles missing or invalid data gracefully
- ✅ Provides detailed error messages
- ✅ Batch inserts all guests in a single database operation

## Testing

Run tests with:

```bash
npm test -- importGuests.test.js
```

The test suite covers:
- UUID generation and uniqueness
- Unique ID validation
- Data processing with various column formats
- Error handling for invalid files
- Database error scenarios
