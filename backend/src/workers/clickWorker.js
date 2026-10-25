import { redis } from "../config/redis.js";
import { supabase } from "../config/db.js";
const BATCH_SIZE = 100;
async function flush() {
  const events = [];
  for (let i = 0; i < BATCH_SIZE; i++) {
    const raw = await redis.lpop("click-events");
    if (!raw) break;
    try {
      events.push(JSON.parse(raw));
    } catch (e) {
      console.error("bad click event", e.message);
    }
  }
  if (!events.length) return;
  const { error } = await supabase.from("clicks").insert(events);
  if (error) {
    console.error("click batch insert failed; requeueing", error.message);
    const pipeline = redis.pipeline();
    for (const event of events)
      pipeline.rpush("click-events", JSON.stringify(event));
    await pipeline.exec();
  }
}
console.log("Click worker started");
while (true) {
  try {
    await flush();
    if ((await redis.llen("click-events")) === 0)
      await new Promise((r) => setTimeout(r, 500));
  } catch (err) {
    console.error(err.message);
    await new Promise((r) => setTimeout(r, 1500));
  }
}
