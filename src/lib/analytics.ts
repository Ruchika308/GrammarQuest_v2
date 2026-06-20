// SSR check helper
const isBrowser = typeof window !== "undefined";

export interface AnalyticsEvent {
  event_name: string;
  payload?: any;
  timestamp: string;
}

export const trackEvent = (eventName: string, payload?: any) => {
  if (!isBrowser) return;

  try {
    const rawEvents = localStorage.getItem("gq_analytics_events");
    const events: AnalyticsEvent[] = rawEvents ? JSON.parse(rawEvents) : [];
    
    events.push({
      event_name: eventName,
      payload,
      timestamp: new Date().toISOString(),
    });

    localStorage.setItem("gq_analytics_events", JSON.stringify(events));
  } catch (error) {
    console.error("Local analytics tracking failed:", error);
  }
};
