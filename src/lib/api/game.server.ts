import { createServerFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";
import { connectDB } from "../../server/db/index";
import {
  User,
  LearningPath,
  Milestone,
  Question,
  QuestionAttempt,
  UserReward,
} from "../../server/db/schemas";

export const getMapData = createServerFn({ method: "GET" }).handler(async () => {
  await connectDB();
  const paths = await LearningPath.find().sort({ order: 1 }).lean();
  const milestones = await Milestone.find().sort({ order: 1 }).lean();
  return {
    paths: JSON.parse(JSON.stringify(paths)),
    milestones: JSON.parse(JSON.stringify(milestones)),
  };
});

export const getMilestoneQuestions = createServerFn({ method: "GET" })
  .validator((milestoneId: string) => milestoneId)
  .handler(async (ctx) => {
    await connectDB();
    const questions = await Question.find({ milestone_id: ctx.data }).lean();
    return JSON.parse(JSON.stringify(questions));
  });

export const submitQuestionAttempt = createServerFn({ method: "POST" })
  .validator((data: { questionId: string; correct: boolean }) => data)
  .handler(async (ctx) => {
    await connectDB();
    const userId = getCookie("guest_user_id");
    if (!userId) throw new Error("Unauthorized");

    // Track attempt
    await QuestionAttempt.create({
      user_id: userId,
      question_id: ctx.data.questionId,
      correct: ctx.data.correct,
    });

    if (ctx.data.correct) {
      // Award 10 XP
      const user = await User.findByIdAndUpdate(
        userId,
        { $inc: { total_xp: 10 } },
        { new: true },
      ).lean();
      return { success: true, xpEarned: 10, totalXp: user!.total_xp };
    }
    return { success: true, xpEarned: 0 };
  });

export const completeMilestone = createServerFn({ method: "POST" })
  .validator((milestoneId: string) => milestoneId)
  .handler(async (ctx) => {
    await connectDB();
    const userId = getCookie("guest_user_id");
    if (!userId) throw new Error("Unauthorized");

    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");

    if (!user.completed_milestones.includes(ctx.data)) {
      user.completed_milestones.push(ctx.data);

      const milestone = await Milestone.findOne({ id: ctx.data });
      const xpReward = milestone ? milestone.xp_reward : 50;
      user.total_xp += xpReward;

      await user.save();

      // Map milestone ID to a beautiful emoji badge name
      const badgeEmojis: Record<string, string> = {
        MN: "🏷️ Name Finder",
        SN: "👑 Royal Messenger",
        OM: "🌉 Bridge Builder",
        SP: "🧙 Word Wizard",
        TT: "🤝 Team Keeper",
        MW: "🛠️ Master Builder",
        FT: "🌳 Family Guardian",
        IT: "💎 Treasure Finder",
        OI: "🏝️ Island Protector",
      };

      const earnedBadge =
        (milestone && badgeEmojis[milestone.id]) ||
        (milestone ? `${milestone.badge_icon || "🏆"} ${milestone.badge_name}` : "🏆 Champion");

      await UserReward.create({
        user_id: userId,
        reward_type: "badge",
        badge_id: earnedBadge,
      });

      return {
        success: true,
        xpEarned: xpReward,
        totalXp: user.total_xp,
        badgeEarned: earnedBadge,
      };
    }

    return { success: false, message: "Already completed" };
  });

export const getUserBadges = createServerFn({ method: "GET" }).handler(async () => {
  await connectDB();
  const userId = getCookie("guest_user_id");
  if (!userId) return [];
  const rewards = await UserReward.find({ user_id: userId, reward_type: "badge" }).lean();
  return JSON.parse(JSON.stringify(rewards.map((r) => r.badge_id)));
});
