import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import Redis from "ioredis";


const redisclient = new Redis(process.env.REDIS_URI, {
  tls: {}   
});



//for normal apis
export const apiLimiter=rateLimit({
    store:new RedisStore({
        sendCommand: (...args) => redisclient.call(...args)
    }),
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 1500, // Max 1500 requests per 15 minutes for general APIs
    message: "Too many requests from this IP, please try again after 15 minutes"
})  


//for auth related apis (login, register, verify-email etc.)
export const authLimiter = rateLimit({
    store: new RedisStore({
        sendCommand: (...args) => redisclient.call(...args)
    }),
    windowMs: 15 * 60 * 1000, // 15 minutes window
    max: 10000, // Increased to 10000 for easier testing
    message: "Too many login/registration attempts from this IP, please try again after 15 minutes",
    standardHeaders: true,
    legacyHeaders: false,
});
