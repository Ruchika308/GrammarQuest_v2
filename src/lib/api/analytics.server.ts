import { createServerFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";
import mongoose from "mongoose";
import { connectDB } from "../../server/db/index";

// Minimal analytics schema
const EventSchema = new mongoose.Schema({
  event_name: { type: String, required: true },
  user_id: { type: String },
  payload: { type: mongoose.Schema.Types.Mixed },
  timestamp: { type: Date, default: Date.now },
});

const AnalyticsEvent =
  mongoose.models.AnalyticsEvent || mongoose.model("AnalyticsEvent", EventSchema);

export const trackServerEvent = createServerFn({ method: "POST" })
  .validator((data: { eventName: string; payload?: any }) => data)
  .handler(async (ctx) => {
    try {
      await connectDB();
      const userId = getCookie("guest_user_id");

      await AnalyticsEvent.create({
        event_name: ctx.data.eventName,
        user_id: userId || "anonymous",
        payload: ctx.data.payload,
      });

      return { success: true };
    } catch (error) {
      console.error("Failed to track event:", error);
      return { success: false };
    }
  });
