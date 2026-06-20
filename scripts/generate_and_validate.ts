import fs from "fs";
import path from "path";
import xlsx from "xlsx";
import { validateQuestions } from "./validator";

async function run() {
  console.log("Loading path and milestone details from Excel...");
  const foundationPath = path.join(process.cwd(), "GrammarQuest_NounKingdom_Foundation.xlsx");
  if (!fs.existsSync(foundationPath)) {
    console.error(`Excel foundation file not found at: ${foundationPath}`);
    process.exit(1);
  }

  const foundationWorkbook = xlsx.readFile(foundationPath);
  const lpSheet = foundationWorkbook.Sheets["Learning_Paths"];
  const msSheet = foundationWorkbook.Sheets["Milestones"];
  const storySheet = foundationWorkbook.Sheets["Story_Content"];
  const badgeSheet = foundationWorkbook.Sheets["Badge_Rewards"];

  const learningPathsRaw = xlsx.utils.sheet_to_json<any>(lpSheet);
  const milestonesRaw = xlsx.utils.sheet_to_json<any>(msSheet);
  const storyContentRaw = xlsx.utils.sheet_to_json<any>(storySheet);
  const badgeRewardsRaw = xlsx.utils.sheet_to_json<any>(badgeSheet);

  // 1. Process Learning Paths
  const learningPaths = learningPathsRaw.map((lp: any) => ({
    id: lp.path_id,
    title: lp.display_name,
    description: lp.description,
    order: lp.order,
  }));

  // 2. Process Milestones
  const milestones = milestonesRaw.map((ms: any) => {
    const story = storyContentRaw.find((s: any) => s.milestone_id === ms.milestone_id) || {};
    const badgeReward = badgeRewardsRaw.find((b: any) => b.milestone_id === ms.milestone_id) || {};

    return {
      id: ms.milestone_id,
      learning_path_id: ms.path_id,
      title: ms.display_name,
      story_intro: story.story_intro || "Start your quest to restore nouns!",
      completion_message: story.completion_message || "Congratulations on completing this quest!",
      order: ms.order,
      xp_reward: badgeReward.xp_reward || 50,
      badge_name: ms.badge_name,
      badge_icon: ms.badge_icon,
      concept: ms.hidden_concept,
    };
  });

  // 3. Generate questions
  console.log("Generating Noun Kingdom Question Bank...");
  const { generateAllQuestions } = await import("./generate_questions");
  const generatedQuestions = await generateAllQuestions();

  const questionsMapped = generatedQuestions.map((q: any) => {
    const options = [q.option_a, q.option_b, q.option_c, q.option_d].filter(
      (opt) => opt !== undefined && opt !== null && opt !== "",
    );

    return {
      id: q.question_id,
      question_id: q.question_id,
      path_id: q.path_id || "noun_kingdom",
      milestone_id: q.milestone_id,
      concept: q.concept,
      skill: q.skill,
      difficulty: q.difficulty,
      question_type: q.question_type || "mcq",
      prompt: q.prompt,
      options: options,
      answer: q.correct_answer,
      image_url: q.image_url,
      option_a: q.option_a,
      option_b: q.option_b,
      option_c: q.option_c,
      option_d: q.option_d,
      correct_answer: q.correct_answer,
      explanation: q.explanation,
    };
  });

  // Group by milestone, then select exactly the required counts for each skill
  const milestonesList = Array.from(new Set(questionsMapped.map(q => q.milestone_id)));
  const finalQuestionsList: any[] = [];

  for (const mId of milestonesList) {
    const mQuestions = questionsMapped.filter(q => q.milestone_id === mId);
    const recognition = mQuestions.filter(q => q.skill === "recognition");
    const classification = mQuestions.filter(q => q.skill === "classification");
    const application = mQuestions.filter(q => q.skill === "application");
    const transfer = mQuestions.filter(q => q.skill === "transfer");

    console.log(`Milestone ${mId} counts before trimming - Rec: ${recognition.length}, Class: ${classification.length}, App: ${application.length}, Trans: ${transfer.length}`);

    // Push exactly the required amount
    finalQuestionsList.push(...recognition.slice(0, 12));
    finalQuestionsList.push(...classification.slice(0, 10));
    finalQuestionsList.push(...application.slice(0, 10));
    finalQuestionsList.push(...transfer.slice(0, 8));
  }

  const questions = finalQuestionsList;


  // 4. Validate
  console.log("Running validator on generated questions...");
  const report = validateQuestions(questions);

  console.log("\n=== VALIDATION REPORT ===");
  console.log(`Is Valid: ${report.isValid}`);
  console.log(`Total Questions: ${report.stats.totalQuestions}`);
  console.log(`Errors: ${report.errors.length}`);
  console.log(`Warnings: ${report.warnings.length}`);

  if (report.errors.length > 0) {
    console.error("\n--- ERRORS ---");
    report.errors.forEach((e) => console.error(`[ERROR] ${e}`));
    console.error("\nValidation failed! Question bank export aborted.");
    process.exit(1);
  }

  if (report.warnings.length > 0) {
    console.warn("\n--- WARNINGS ---");
    report.warnings.forEach((w) => console.warn(`[WARN] ${w}`));
  }

  // 5. Save to local JSON files
  const dataDir = path.join(process.cwd(), "src/lib/data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  fs.writeFileSync(path.join(dataDir, "paths.json"), JSON.stringify(learningPaths, null, 2));
  fs.writeFileSync(path.join(dataDir, "milestones.json"), JSON.stringify(milestones, null, 2));
  fs.writeFileSync(path.join(dataDir, "questions.json"), JSON.stringify(questions, null, 2));

  console.log("\nSuccess! Exported local JSON data files:");
  console.log(`- ${path.join(dataDir, "paths.json")}`);
  console.log(`- ${path.join(dataDir, "milestones.json")}`);
  console.log(`- ${path.join(dataDir, "questions.json")}`);
  process.exit(0);
}

run().catch((err) => {
  console.error("Error during generation and validation:", err);
  process.exit(1);
});
