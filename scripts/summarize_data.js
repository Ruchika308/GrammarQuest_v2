import fs from "fs";
import path from "path";

const scratchDir =
  "C:\\Users\\Ruchitesh\\.gemini\\antigravity\\brain\\a4df519e-b8d5-436c-a785-e6ddee855e69\\scratch";

try {
  const nounKingdom = JSON.parse(
    fs.readFileSync(path.join(scratchDir, "noun_kingdom.json"), "utf-8"),
  );
  const missingNames = JSON.parse(
    fs.readFileSync(path.join(scratchDir, "missing_names.json"), "utf-8"),
  );

  console.log("--- Noun Kingdom Foundation ---");
  console.log("Learning Paths:", nounKingdom.Learning_Paths.length);
  console.log("Milestones count:", nounKingdom.Milestones.length);
  nounKingdom.Milestones.forEach((m) => {
    console.log(
      `- Milestone: ${m.milestone_id} (${m.display_name}) - Concept: ${m.hidden_concept}`,
    );
  });

  console.log("\n--- Missing Names Questions ---");
  const qBank = missingNames.Question_Bank;
  console.log("Total Questions:", qBank.length);

  const milestoneCounts = {};
  const concepts = {};
  const difficulties = {};
  const imageCounts = { yes: 0, no: 0 };

  qBank.forEach((q) => {
    milestoneCounts[q.milestone_id] = (milestoneCounts[q.milestone_id] || 0) + 1;
    concepts[q.concept] = (concepts[q.concept] || 0) + 1;
    difficulties[q.difficulty] = (difficulties[q.difficulty] || 0) + 1;
    if (q.image_url) {
      imageCounts.yes++;
    } else {
      imageCounts.no++;
    }
  });

  console.log("Questions per Milestone ID:", milestoneCounts);
  console.log("Questions per Concept:", concepts);
  console.log("Questions per Difficulty:", difficulties);
  console.log("Questions with images:", imageCounts);

  // Print first question structure
  console.log("\nSample Question Structure:", JSON.stringify(qBank[0], null, 2));
} catch (e) {
  console.error(e);
}
