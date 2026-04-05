import { createClient } from "redis";

const redis = createClient({
    url: process.env.REDIS_URI,
   
});

redis.on("error", (err) => {
  console.log("Redis Error:", err);
});

export const connectRedis = async () => {
  await redis.connect();
  console.log("Redis connected ✅");
};

export default redis;