import mongoose from "mongoose";

const Schema = mongoose.Schema;

// User Schema
const UserSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, index: true, sparse: true },
  google_sub: { type: String, index: true, sparse: true },
  picture: { type: String },
  avatar: { type: String, default: null },
  total_xp: { type: Number, default: 0 },
  completed_milestones: [{ type: String }],
  created_at: { type: Date, default: Date.now },
});

if (mongoose.models.User) {
  delete mongoose.models.User;
}
export const User = mongoose.model("User", UserSchema);

// Learning Path Schema
const LearningPathSchema = new Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  order: { type: Number, required: true },
});

export const LearningPath =
  mongoose.models.LearningPath || mongoose.model("LearningPath", LearningPathSchema);

// Milestone Schema
const MilestoneSchema = new Schema({
  id: { type: String, required: true, unique: true },
  learning_path_id: { type: String, required: true },
  title: { type: String, required: true },
  story_intro: { type: String, required: true },
  completion_message: { type: String, required: true },
  order: { type: Number, required: true },
  xp_reward: { type: Number, required: true },
  badge_name: { type: String },
  badge_icon: { type: String },
  concept: { type: String },
});

export const Milestone = mongoose.models.Milestone || mongoose.model("Milestone", MilestoneSchema);

// Question Schema
const QuestionSchema = new Schema({
  id: { type: String, required: true, unique: true },
  milestone_id: { type: String, required: true },
  concept: { type: String, required: true },
  skill: { type: String, required: true },
  difficulty: { type: String, required: true }, // easy, medium, hard
  question_type: { type: String, required: true }, // mcq, image-mcq, match-pair
  prompt: { type: String, required: true },
  options: { type: Schema.Types.Mixed, required: true }, // Can be array of strings or objects depending on type
  answer: { type: Schema.Types.Mixed, required: true },
  image_url: { type: String },
});

export const Question = mongoose.models.Question || mongoose.model("Question", QuestionSchema);

// Question Attempt Schema
const QuestionAttemptSchema = new Schema({
  user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
  question_id: { type: String, required: true },
  correct: { type: Boolean, required: true },
  timestamp: { type: Date, default: Date.now },
});

export const QuestionAttempt =
  mongoose.models.QuestionAttempt || mongoose.model("QuestionAttempt", QuestionAttemptSchema);

// User Reward Schema
const UserRewardSchema = new Schema({
  user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
  reward_type: { type: String, required: true }, // e.g. "badge"
  badge_id: { type: String, required: true },
  unlocked_at: { type: Date, default: Date.now },
});

export const UserReward =
  mongoose.models.UserReward || mongoose.model("UserReward", UserRewardSchema);

// Player Progress Schema
const PlayerProgressSchema = new Schema({
  user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
  milestone_id: { type: String, required: true },
  attempted: { type: Number, default: 0 },
  correct: { type: Number, default: 0 },
});
PlayerProgressSchema.index({ user_id: 1, milestone_id: 1 }, { unique: true });

export const PlayerProgress = mongoose.models.PlayerProgress || mongoose.model("PlayerProgress", PlayerProgressSchema);
