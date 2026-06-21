import { createServerFn } from "@tanstack/react-start";
import { getCookie, setCookie } from "@tanstack/react-start/server";
import { connectDB } from "../../server/db/index";
import {
  User,
  LearningPath,
  Milestone,
  Question,
  QuestionAttempt,
  UserReward,
  PlayerProgress,
} from "../../server/db/schemas";
import type { GoogleUser } from "../google-auth";

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

export const getGuestUser = createServerFn({ method: "GET" }).handler(async () => {
  await connectDB();
  let userId = getCookie("guest_user_id");

  if (!userId) {
    const newUser = await User.create({
      name: "Guest Explorer",
      avatar: "mia",
      total_xp: 0,
      completed_milestones: [],
    });
    userId = newUser._id.toString();
    setCookie("guest_user_id", userId!, { maxAge: 60 * 60 * 24 * 365, path: "/" });
  }

  const user = await User.findById(userId).lean();
  if (!user) {
    const newUser = await User.create({
      name: "Guest Explorer",
      avatar: "mia",
      total_xp: 0,
      completed_milestones: [],
    });
    userId = newUser._id.toString();
    setCookie("guest_user_id", userId!, { maxAge: 60 * 60 * 24 * 365, path: "/" });
    return JSON.parse(JSON.stringify(newUser));
  }

  return JSON.parse(JSON.stringify(user));
});

export const updateAvatar = createServerFn({ method: "POST" })
  .validator((avatarId: string) => avatarId)
  .handler(async (ctx) => {
    await connectDB();
    const userId = getCookie("guest_user_id");
    if (!userId) throw new Error("Unauthorized");

    const updated = await User.findByIdAndUpdate(
      userId,
      { avatar: ctx.data },
      { new: true },
    ).lean();
    return JSON.parse(JSON.stringify(updated));
  });

export const upsertGoogleUser = createServerFn({ method: "POST" })
  .validator((user: GoogleUser) => user)
  .handler(async (ctx) => {
    await connectDB();
    const googleUser = ctx.data;
    const currentUserId = getCookie("guest_user_id");
    const currentUser = currentUserId ? await User.findById(currentUserId).lean() : null;
    const googleAccount = await User.findOne({ google_sub: googleUser.sub }).lean();

    let updated: { _id: { toString(): string } } | null = null;

    if (googleAccount) {
      if (currentUser && currentUser._id.toString() !== googleAccount._id.toString()) {
        const sourceId = currentUser._id.toString();
        const targetId = googleAccount._id.toString();

        await Promise.all([
          QuestionAttempt.updateMany({ user_id: sourceId }, { $set: { user_id: targetId } }),
          PlayerProgress.updateMany({ user_id: sourceId }, { $set: { user_id: targetId } }),
          UserReward.updateMany(
            { user_id: sourceId, reward_type: "badge" },
            { $set: { user_id: targetId } },
          ),
        ]);
      }

      const mergedCompleted = Array.from(
        new Set([
          ...(googleAccount.completed_milestones ?? []),
          ...(currentUser?.completed_milestones ?? []),
        ]),
      );

      const mergedTotalXp = Math.max(googleAccount.total_xp ?? 0, currentUser?.total_xp ?? 0);

      const mergedAvatar = googleAccount.avatar ?? currentUser?.avatar ?? null;

      updated = await User.findByIdAndUpdate(
        googleAccount._id,
        {
          $set: {
            name: googleUser.name,
            email: googleUser.email,
            google_sub: googleUser.sub,
            picture: googleUser.picture,
            avatar: mergedAvatar,
            total_xp: mergedTotalXp,
            completed_milestones: mergedCompleted,
          },
        },
        { new: true },
      ).lean();
    } else if (currentUser && !currentUser.google_sub) {
      updated = await User.findByIdAndUpdate(
        currentUser._id,
        {
          $set: {
            name: googleUser.name,
            email: googleUser.email,
            google_sub: googleUser.sub,
            picture: googleUser.picture,
          },
        },
        { new: true },
      ).lean();
    } else {
      updated = await User.create({
        name: googleUser.name,
        email: googleUser.email,
        google_sub: googleUser.sub,
        picture: googleUser.picture,
        avatar: null,
        total_xp: 0,
        completed_milestones: [],
      });
    }

    const userId = updated?._id?.toString();
    if (userId) {
      setCookie("guest_user_id", userId, { maxAge: 60 * 60 * 24 * 365, path: "/" });
    }

    return JSON.parse(JSON.stringify(updated));
  });

export const getPlayerState = createServerFn({ method: "GET" }).handler(async () => {
  await connectDB();
  const userId = getCookie("guest_user_id");
  if (!userId) {
    return { profile: null, completed: [], badges: [], progress: {} };
  }

  const [user, rewards, progressRows] = await Promise.all([
    User.findById(userId).lean(),
    UserReward.find({ user_id: userId, reward_type: "badge" }).lean(),
    PlayerProgress.find({ user_id: userId }).lean(),
  ]);

  if (!user) {
    return { profile: null, completed: [], badges: [], progress: {} };
  }

  const badges = rewards.map((reward) => reward.badge_id);
  const progress = Object.fromEntries(
    progressRows.map((row) => {
      const mastery = row.attempted > 0 ? Math.round((row.correct / row.attempted) * 100) : 0;
      return [
        row.milestone_id,
        {
          milestone_id: row.milestone_id,
          attempted: row.attempted,
          correct: row.correct,
          mastery,
          completed: mastery >= 80 && row.attempted >= 5,
        },
      ];
    }),
  );

  return {
    profile: {
      name: user.name,
      avatar: user.avatar ?? null,
      total_xp: user.total_xp ?? 0,
      badges,
    },
    completed: user.completed_milestones ?? [],
    badges,
    progress: JSON.parse(JSON.stringify(progress)),
  };
});

export const submitQuestionAttempt = createServerFn({ method: "POST" })
  .validator((data: { milestoneId: string; questionId: string; correct: boolean }) => data)
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

    const progress = await PlayerProgress.findOneAndUpdate(
      { user_id: userId, milestone_id: ctx.data.milestoneId },
      {
        $inc: {
          attempted: 1,
          correct: ctx.data.correct ? 1 : 0,
        },
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      },
    ).lean();

    const mastery =
      progress!.attempted > 0 ? Math.round((progress!.correct / progress!.attempted) * 100) : 0;
    const progressSummary = {
      milestone_id: ctx.data.milestoneId,
      attempted: progress!.attempted,
      correct: progress!.correct,
      mastery,
      completed: mastery >= 80 && progress!.attempted >= 5,
    };

    if (ctx.data.correct) {
      // Award 10 XP
      const user = await User.findByIdAndUpdate(
        userId,
        { $inc: { total_xp: 10 } },
        { new: true },
      ).lean();
      return { success: true, xpEarned: 10, totalXp: user!.total_xp, progress: progressSummary };
    }
    return { success: true, xpEarned: 0, progress: progressSummary };
  });

export const completeMilestone = createServerFn({ method: "POST" })
  .validator((data: { milestoneId: string; bonusXp?: number }) => data)
  .handler(async (ctx) => {
    await connectDB();
    const userId = getCookie("guest_user_id");
    if (!userId) throw new Error("Unauthorized");

    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");

    if (!user.completed_milestones.includes(ctx.data.milestoneId)) {
      user.completed_milestones.push(ctx.data.milestoneId);

      const milestone = await Milestone.findOne({ id: ctx.data.milestoneId });
      const xpReward = milestone ? milestone.xp_reward : 50;
      const totalReward = xpReward + (ctx.data.bonusXp ?? 0);
      user.total_xp += totalReward;

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
        xpEarned: totalReward,
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
