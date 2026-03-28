import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { createTweet, getUserTweets, updateTweet, deleteTweet } from "../controllers/tweet.controller.js";

import  cache  from "../middlewares/redis.middleware.js";
const router = Router();


router.route("/createtweet").post(verifyJWT,createTweet)
router.route("/getusertweets").get(verifyJWT,
    cache((req)=>`usertweets:${req.user._id}:${req.query.page || 1}:${req.query.limit || 10}`,300),
    getUserTweets)
router.route("/updatetweet/:tweetId").put(verifyJWT,updateTweet)
router.route("/deletetweet/:tweetId").delete(verifyJWT,deleteTweet)

export default router;