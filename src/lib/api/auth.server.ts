import { createServerFn } from "@tanstack/react-start";
import { getCookie, setCookie } from "@tanstack/react-start/server";
import { connectDB } from "../../server/db/index";
import { User } from "../../server/db/schemas";

export const getGuestUser = createServerFn({ method: "GET" }).handler(async () => {
  await connectDB();
  let userId = getCookie("guest_user_id");

  if (!userId) {
    // Create new guest user
    const newUser = await User.create({
      name: "Guest Explorer",
      avatar: "mia", // Default avatar
      total_xp: 0,
      completed_milestones: [],
    });
    userId = newUser._id.toString();
    setCookie("guest_user_id", userId!, { maxAge: 60 * 60 * 24 * 365, path: "/" });
  }

  const user = await User.findById(userId).lean();
  if (!user) {
    // Cookie is invalid or user was deleted
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
