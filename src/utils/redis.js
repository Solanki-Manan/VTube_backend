import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URI, {
    tls: {} //  required for Upstash
});

redis.on("connect", () => {
    console.log("✅ Redis connected");
});

redis.on("error", (err) => {
    console.error("❌ Redis error:", err);
});

export default redis;