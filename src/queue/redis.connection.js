import Redis from "ioredis";    

const redis = new Redis(process.env.REDIS_URI, {
    maxRetriesPerRequest: null,
});

redis.on("connect", () => {
    console.log("Redis connected for queue");
});

redis.on("error", (err) => {
    console.error("Redis error connect for queue", err);
});

export default redis;
