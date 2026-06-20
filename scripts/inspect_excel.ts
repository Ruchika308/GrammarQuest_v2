import xlsx from "xlsx";
import path from "path";

try {
  const filePath = path.join(process.cwd(), "GrammarQuest_MissingNames_WithImageURL.xlsx");
  const workbook = xlsx.readFile(filePath);
  console.log("Sheet names:", workbook.SheetNames);
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json<any>(sheet);
    console.log(`Sheet "${sheetName}" has ${data.length} rows.`);
    if (data.length > 0) {
      console.log("Sample headers:", Object.keys(data[0]));
      const milestoneIds = Array.from(new Set(data.map((r: any) => r.milestone_id || r.milestone)));
      console.log("Milestones present:", milestoneIds);
    }
  }
} catch (e) {
  console.error("Error inspecting excel:", e);
}
