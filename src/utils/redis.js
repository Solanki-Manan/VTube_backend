import { createClient } from "redis";

const redis = createClient({
    url: process.env.REDIS_URI,
   
});

 await redis.connect();
redis.on("connect", () => {
    console.log("Redis connected for caching");
});

redis.on("error", (err) => {
    console.error("Redis error while caching:", err);
});


export default redis;