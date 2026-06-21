import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";

// This function runs strictly on the server and is stripped from the client bundle.
const testConnection = createServerFn({ method: "GET" }).handler(async () => {
  console.log("[DB TEST] Connecting to DB...");
  try {
    const { connectDB } = await import("../server/db/index");
    const { Question } = await import("../server/db/schemas");

    await connectDB();
    console.log("[DB TEST] Mongoose connection succeeded.");
    const count = await Question.countDocuments();
    console.log(`[DB TEST] Total questions count: ${count}`);
    return {
      success: true,
      message: "Successfully connected to MongoDB!",
      count,
    };
  } catch (error: any) {
    console.error("[DB TEST] Connection failed:", error);
    return {
      success: false,
      message: "Failed to connect to MongoDB",
      error: error.message || String(error),
      stack: error.stack,
    };
  }
});

export const Route = createFileRoute("/db-test")({
  loader: async () => {
    return await testConnection();
  },
  component: DbTestComponent,
});

function DbTestComponent() {
  const data = Route.useLoaderData();
  return (
    <div className="p-8 max-w-xl mx-auto my-12 bg-white rounded-3xl shadow-xl border border-slate-100 font-sans">
      <h1 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-2">
        🔌 Database Connection Test
      </h1>
      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-150">
        <pre className="text-sm font-mono text-slate-700 whitespace-pre-wrap break-all">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
      <div className="mt-6 text-center">
        {data.success ? (
          <span className="inline-flex items-center px-4 py-2 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            ✅ MongoDB Connection is Active
          </span>
        ) : (
          <span className="inline-flex items-center px-4 py-2 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            ❌ MongoDB Connection Failed
          </span>
        )}
      </div>
    </div>
  );
}
