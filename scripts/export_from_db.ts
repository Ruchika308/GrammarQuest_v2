import { connectDB } from "../src/server/db/index";
import { LearningPath, Milestone, Question } from "../src/server/db/schemas";
import fs from "fs";
import path from "path";
import { validateQuestions } from "./validator";

async function run() {
  try {
    console.log("Connecting to MongoDB...");
    await connectDB();
    
    console.log("Fetching paths...");
    const paths = await LearningPath.find().lean();
    console.log(`Found ${paths.length} paths.`);

    console.log("Fetching milestones...");
    const milestones = await Milestone.find().lean();
    console.log(`Found ${milestones.length} milestones.`);

    console.log("Fetching questions...");
    const questionsRaw = await Question.find().lean();
    console.log(`Found ${questionsRaw.length} questions in DB.`);

    if (questionsRaw.length === 0) {
      console.log("No questions found in MongoDB. We will need to generate them.");
      process.exit(0);
    }

    // Map questions to match our schema
    const questions = questionsRaw.map((q: any) => {
      // Find options
      const optA = q.options?.[0] || q.option_a || "";
      const optB = q.options?.[1] || q.option_b || "";
      const optC = q.options?.[2] || q.option_c || "";
      const optD = q.options?.[3] || q.option_d || "";

      return {
        id: q.id || q.question_id,
        question_id: q.id || q.question_id,
        path_id: q.path_id || "noun_kingdom",
        milestone_id: q.milestone_id,
        concept: q.concept,
        skill: q.skill,
        difficulty: q.difficulty,
        question_type: q.question_type || "mcq",
        prompt: q.prompt,
        options: q.options || [optA, optB, optC, optD].filter(Boolean),
        answer: q.answer || q.correct_answer,
        image_url: q.image_url,
        option_a: optA,
        option_b: optB,
        option_c: optC,
        option_d: optD,
        correct_answer: q.answer || q.correct_answer,
        explanation: q.explanation || "Correct answer!",
      };
    });

    console.log("Running validator...");
    const report = validateQuestions(questions);
    console.log("\n=== VALIDATION REPORT ===");
    console.log(`Is Valid: ${report.isValid}`);
    console.log(`Errors: ${report.errors.length}`);
    console.log(`Warnings: ${report.warnings.length}`);

    // If valid or mostly valid, save to files
    const dataDir = path.join(process.cwd(), "src/lib/data");
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    fs.writeFileSync(path.join(dataDir, "paths.json"), JSON.stringify(paths, null, 2));
    fs.writeFileSync(path.join(dataDir, "milestones.json"), JSON.stringify(milestones, null, 2));
    fs.writeFileSync(path.join(dataDir, "questions.json"), JSON.stringify(questions, null, 2));
    console.log("Exported DB data to local JSON files successfully.");
    process.exit(0);

  } catch (err) {
    console.error("Error exporting from DB:", err);
    process.exit(1);
  }
}

run();
