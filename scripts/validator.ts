import fs from "fs";
import path from "path";

export interface QuestionInput {
  question_id: string;
  path_id: string;
  milestone_id: string;
  concept: string;
  skill: "recognition" | "classification" | "application" | "transfer";
  difficulty: "explorer" | "detective" | "creator";
  question_type: string;
  theme?: string;
  prompt: string;
  image_url: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  explanation: string;
  tags?: string;
}

export interface ValidationReport {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  stats: {
    totalQuestions: number;
    byMilestone: Record<string, {
      total: number;
      skills: Record<string, number>;
      difficulties: Record<string, number>;
      optionDistribution: Record<string, number>;
    }>;
  };
}

export function validateQuestions(questions: any[]): ValidationReport {
  const report: ValidationReport = {
    isValid: true,
    errors: [],
    warnings: [],
    stats: {
      totalQuestions: questions.length,
      byMilestone: {},
    },
  };

  const idSet = new Set<string>();
  const promptSet = new Set<string>();

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const indexStr = `[Index ${i}]`;

    // 1. Required fields check
    const requiredFields: (keyof QuestionInput)[] = [
      "question_id",
      "path_id",
      "milestone_id",
      "concept",
      "skill",
      "difficulty",
      "question_type",
      "prompt",
      "image_url",
      "option_a",
      "option_b",
      "option_c",
      "option_d",
      "correct_answer",
      "explanation",
    ];

    for (const field of requiredFields) {
      if (q[field] === undefined || q[field] === null || q[field] === "") {
        report.errors.push(`${indexStr} Missing required field: "${field}"`);
        report.isValid = false;
      }
    }

    if (!q.question_id) continue;

    // 2. Duplicate ID check
    if (idSet.has(q.question_id)) {
      report.errors.push(`${indexStr} Duplicate question_id found: "${q.question_id}"`);
      report.isValid = false;
    } else {
      idSet.add(q.question_id);
    }

    // 3. Duplicate prompt check
    if (q.prompt) {
      if (promptSet.has(q.prompt)) {
        report.warnings.push(`${indexStr} Duplicate prompt found: "${q.prompt}"`);
      } else {
        promptSet.add(q.prompt);
      }
    }

    // 4. Correct answer matches one of the options
    const options = [q.option_a, q.option_b, q.option_c, q.option_d];
    if (q.correct_answer && !options.includes(q.correct_answer)) {
      report.errors.push(
        `${q.question_id}: Correct answer "${q.correct_answer}" does not match any of the option choices.`,
      );
      report.isValid = false;
    }

    // 5. Check explanation length (max 12 words)
    if (q.explanation) {
      const words = q.explanation.split(/\s+/).filter(Boolean);
      if (words.length > 12) {
        report.warnings.push(
          `${q.question_id}: Explanation is too long (${words.length} words). Child-friendly text should be max 12 words. Text: "${q.explanation}"`,
        );
      }
    }

    // Initialize stats per milestone
    const mId = q.milestone_id;
    if (mId) {
      if (!report.stats.byMilestone[mId]) {
        report.stats.byMilestone[mId] = {
          total: 0,
          skills: { recognition: 0, classification: 0, application: 0, transfer: 0 },
          difficulties: { explorer: 0, detective: 0, creator: 0 },
          optionDistribution: { option_a: 0, option_b: 0, option_c: 0, option_d: 0 },
        };
      }

      const mStats = report.stats.byMilestone[mId];
      mStats.total++;

      // Track Skill distribution
      if (["recognition", "classification", "application", "transfer"].includes(q.skill)) {
        mStats.skills[q.skill] = (mStats.skills[q.skill] || 0) + 1;
      } else if (q.skill) {
        report.errors.push(`${q.question_id}: Invalid skill value "${q.skill}"`);
        report.isValid = false;
      }

      // Track Difficulty distribution
      if (["explorer", "detective", "creator"].includes(q.difficulty)) {
        mStats.difficulties[q.difficulty] = (mStats.difficulties[q.difficulty] || 0) + 1;
      } else if (q.difficulty) {
        report.errors.push(`${q.question_id}: Invalid difficulty value "${q.difficulty}"`);
        report.isValid = false;
      }

      // Track Correct Option distribution
      if (q.correct_answer) {
        if (q.correct_answer === q.option_a) mStats.optionDistribution.option_a++;
        else if (q.correct_answer === q.option_b) mStats.optionDistribution.option_b++;
        else if (q.correct_answer === q.option_c) mStats.optionDistribution.option_c++;
        else if (q.correct_answer === q.option_d) mStats.optionDistribution.option_d++;
      }
    }
  }

  // 6. Validate milestone distributions
  for (const [mId, mStats] of Object.entries(report.stats.byMilestone)) {
    // Expected total: 40 questions per milestone
    if (mStats.total !== 40) {
      report.errors.push(`Milestone "${mId}" has ${mStats.total} questions (expected exactly 40).`);
      report.isValid = false;
    }

    // Expected skill distribution: 12 Rec, 10 Class, 10 App, 8 Trans
    const expectedSkills = { recognition: 12, classification: 10, application: 10, transfer: 8 };
    for (const [skill, expected] of Object.entries(expectedSkills)) {
      const actual = mStats.skills[skill] || 0;
      if (actual !== expected) {
        report.errors.push(
          `Milestone "${mId}" has invalid skill distribution for "${skill}": got ${actual}, expected ${expected}.`,
        );
        report.isValid = false;
      }
    }

    // Expected difficulty distribution: 16 Explorer, 16 Detective, 8 Creator
    const expectedDiffs = { explorer: 16, detective: 16, creator: 8 };
    for (const [diff, expected] of Object.entries(expectedDiffs)) {
      const actual = mStats.difficulties[diff] || 0;
      if (actual !== expected) {
        report.errors.push(
          `Milestone "${mId}" has invalid difficulty distribution for "${diff}": got ${actual}, expected ${expected}.`,
        );
        report.isValid = false;
      }
    }

    // Check correct answer randomization (approx 25% or ~10 questions per option)
    // Warning if any option has less than 6 or more than 14 correct answers.
    for (const [opt, count] of Object.entries(mStats.optionDistribution)) {
      if (count < 6 || count > 14) {
        report.warnings.push(
          `Milestone "${mId}" has slightly skewed correct answer option distribution for "${opt}": count is ${count} (expected ~10).`,
        );
      }
    }
  }

  return report;
}

// Allow direct execution
if (import.meta.url === `file://${path.resolve(process.argv[1]).replace(/\\/g, "/")}`) {
  const jsonPath = path.join(process.cwd(), "src/lib/data/questions.json");
  if (fs.existsSync(jsonPath)) {
    console.log(`Loading questions from ${jsonPath}...`);
    const data = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
    const report = validateQuestions(data);
    console.log("\n=== VALIDATION REPORT ===");
    console.log(`Is Valid: ${report.isValid}`);
    console.log(`Total Questions: ${report.stats.totalQuestions}`);
    console.log(`Errors: ${report.errors.length}`);
    console.log(`Warnings: ${report.warnings.length}`);
    
    if (report.errors.length > 0) {
      console.log("\n--- ERRORS ---");
      report.errors.slice(0, 20).forEach(e => console.error(`[ERROR] ${e}`));
      if (report.errors.length > 20) console.log(`... and ${report.errors.length - 20} more errors.`);
    }
    
    if (report.warnings.length > 0) {
      console.log("\n--- WARNINGS ---");
      report.warnings.slice(0, 10).forEach(w => console.warn(`[WARN] ${w}`));
      if (report.warnings.length > 10) console.log(`... and ${report.warnings.length - 10} more warnings.`);
    }
  } else {
    console.log(`No questions.json found at ${jsonPath}. Run seeding first.`);
  }
}
