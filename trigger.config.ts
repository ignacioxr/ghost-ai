import { syncEnvVars } from "@trigger.dev/build/extensions/core";
import { defineConfig } from "@trigger.dev/sdk";

// Secrets the design agent and spec generator need inside the Trigger.dev worker.
const WORKER_ENV_VARS = ["GOOGLE_GENERATIVE_AI_API_KEY", "GEMINI_API_KEY", "LIVEBLOCKS_SECRET_KEY",
  "DATABASE_URL",
  "BLOB_READ_WRITE_TOKEN",
];

export default defineConfig({
  project: process.env.TRIGGER_PROJECT_REF!,
  runtime: "node",
  logLevel: "log",
  // The max compute seconds a task is allowed to run. If the task run exceeds this duration, it will be stopped.
  // You can override this on an individual task.
  // See https://trigger.dev/docs/runs/max-duration
  maxDuration: 3600,
  retries: {
    enabledInDev: true,
    default: {
      maxAttempts: 3,
      minTimeoutInMs: 1000,
      maxTimeoutInMs: 10000,
      factor: 2,
      randomize: true,
    },
  },
  dirs: ["./trigger"],
  build: {
    extensions: [
      // Pushes the keys above to the target Trigger.dev environment on deploy.
      syncEnvVars(async () =>
        WORKER_ENV_VARS.flatMap((name) => {
          const value = process.env[name];
          return value ? [{ name, value, isSecret: true }] : [];
        }),
      ),
    ],
  },
});
