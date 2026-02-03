import * as XLSX from 'xlsx';
import { ClanGroup, SheetData, MemberWeight, ParseResult } from '../types';

export const parseExcelFile = async (file: File): Promise<ParseResult> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        
        const resultSheets: SheetData[] = [];
        const importedWeights: MemberWeight = {};

        workbook.SheetNames.forEach(sheetName => {
            const sheet = workbook.Sheets[sheetName];
            // Convert to array of arrays
            const json = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as string[][];

            // Special handling for "匹配值" sheet
            if (sheetName === '匹配值') {
                if (json && json.length > 0) {
                    json.forEach(row => {
                        // Column 0 is Name, Column 1 is Value
                        const name = String(row[0] || '').trim();
                        const rawValue = row[1];
                        
                        // Parse value if name exists
                        if (name && rawValue !== undefined && rawValue !== '') {
                            const value = parseFloat(String(rawValue));
                            if (!isNaN(value)) {
                                importedWeights[name] = value;
                            }
                        }
                    });
                }
                // Do not add this sheet to the visual lists (resultSheets)
                return;
            }

            // Normal Sheet Processing
            if (!json || json.length < 5) {
                resultSheets.push({ name: sheetName, groups: [] });
                return;
            }

            const groups: ClanGroup[] = [];
            const numColumns = json[0]?.length || 0;

            // Iterate columns, STARTING FROM 1 to ignore the first column
            for (let col = 1; col < numColumns; col++) {
                const name = json[0][col];
                // Check if name exists
                if (name) {
                    const members: string[] = [];
                    // Members are from row 6 (index 5) to row 20 (index 19) => 15 members
                    for (let r = 5; r <= 19; r++) {
                        if (json[r] && json[r][col]) {
                            members.push(String(json[r][col]).trim());
                        } else {
                            members.push(""); // Placeholder for empty slots
                        }
                    }

                    groups.push({
                        id: `${sheetName.replace(/\s+/g, '-')}-group-${col}`,
                        name: String(name).trim(),
                        tag: String(json[1][col] || '').trim(),
                        status: String(json[2][col] || '').trim(),
                        note: String(json[3][col] || '').trim(),
                        members: members
                    });
                }
            }
            resultSheets.push({ name: sheetName, groups });
        });

        if (resultSheets.length === 0 && Object.keys(importedWeights).length === 0) {
            reject(new Error("No valid data found in the Excel file."));
            return;
        }

        resolve({ sheets: resultSheets, importedWeights });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsBinaryString(file);
  });
};