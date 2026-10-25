import app from "./app.js";
import { env } from "./config/env.js";
import { redis } from "./config/redis.js";
const server = app.listen(env.PORT, () =>
  console.log(`API listening on :${env.PORT}`),
);
async function shutdown() {
  server.close(async () => {
    await redis.quit();
    process.exit(0);
  });
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
