import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URI, {
    tls: {} //  required for Upstash
});

redis.on("connect", () => {
    console.log("Redis connected for caching");
});

redis.on("error", (err) => {
    console.error("Redis error while caching:", err);
});

export default redis;