import xlsx from "xlsx";
import fs from "fs";
import path from "path";

const scratchDir =
  "C:\\Users\\Ruchitesh\\.gemini\\antigravity\\brain\\a4df519e-b8d5-436c-a785-e6ddee855e69\\scratch";

function parseExcel(filename) {
  const filePath = path.join(process.cwd(), filename);
  const workbook = xlsx.readFile(filePath);
  const result = {};
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    result[sheetName] = xlsx.utils.sheet_to_json(sheet);
  }
  return result;
}

try {
  const nounKingdom = parseExcel("GrammarQuest_NounKingdom_Foundation.xlsx");
  const missingNames = parseExcel("GrammarQuest_MissingNames_WithImageURL.xlsx");

  if (!fs.existsSync(scratchDir)) {
    fs.mkdirSync(scratchDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(scratchDir, "noun_kingdom.json"),
    JSON.stringify(nounKingdom, null, 2),
  );
  fs.writeFileSync(
    path.join(scratchDir, "missing_names.json"),
    JSON.stringify(missingNames, null, 2),
  );
  console.log("Successfully read and saved Excel contents to JSON!");
} catch (e) {
  console.error("Error reading excel files:", e);
}
