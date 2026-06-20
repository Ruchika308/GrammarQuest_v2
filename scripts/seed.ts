import { connectDB } from "../src/server/db/index.js";
import { LearningPath, Milestone, Question } from "../src/server/db/schemas.js";
import xlsx from "xlsx";
import path from "path";

async function seed() {
  await connectDB();
  console.log("Connected to MongoDB");

  // Load Foundation Excel file
  const foundationPath = path.join(process.cwd(), "GrammarQuest_NounKingdom_Foundation.xlsx");
  const foundationWorkbook = xlsx.readFile(foundationPath);

  // Read sheets
  const lpSheet = foundationWorkbook.Sheets["Learning_Paths"];
  const msSheet = foundationWorkbook.Sheets["Milestones"];
  const storySheet = foundationWorkbook.Sheets["Story_Content"];
  const badgeSheet = foundationWorkbook.Sheets["Badge_Rewards"];

  const learningPathsRaw = xlsx.utils.sheet_to_json<any>(lpSheet);
  const milestonesRaw = xlsx.utils.sheet_to_json<any>(msSheet);
  const storyContentRaw = xlsx.utils.sheet_to_json<any>(storySheet);
  const badgeRewardsRaw = xlsx.utils.sheet_to_json<any>(badgeSheet);

  console.log(
    `Read ${learningPathsRaw.length} learning paths, ${milestonesRaw.length} milestones, ${storyContentRaw.length} stories, ${badgeRewardsRaw.length} badges.`,
  );

  // 1. Process Learning Paths
  const learningPaths = learningPathsRaw.map((lp: any) => ({
    id: lp.path_id,
    title: lp.display_name,
    description: lp.description,
    order: lp.order,
  }));

  // 2. Process Milestones (merge story and badge details)
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

  // 3. Generate Question Bank from Gemini API
  const { generateAllQuestions } = await import("./generate_questions.js");
  const generatedQuestions = await generateAllQuestions();

  const questions = generatedQuestions.map((q: any) => {
    const options = [q.option_a, q.option_b, q.option_c, q.option_d].filter(
      (opt) => opt !== undefined && opt !== null && opt !== "",
    );

    return {
      id: q.question_id,
      milestone_id: q.milestone_id,
      concept: q.concept,
      skill: q.skill,
      difficulty: q.difficulty,
      question_type: q.question_type || "mcq",
      prompt: q.prompt,
      options: options,
      answer: q.correct_answer,
      image_url: q.image_url,
    };
  });

  // Seed DB
  console.log("Seeding Learning Path...");
  await LearningPath.deleteMany({});
  await LearningPath.insertMany(learningPaths);

  console.log("Seeding Milestones...");
  await Milestone.deleteMany({});
  await Milestone.insertMany(milestones);

  console.log("Seeding Questions...");
  await Question.deleteMany({});
  await Question.insertMany(questions);

  console.log("Database seeded successfully!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Error seeding database:", err);
  process.exit(1);
});
