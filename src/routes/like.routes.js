import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { togglevideolike } from "../controllers/like.controller.js";
import { togglecommentlike } from "../controllers/like.controller.js";
import { toggletweetlike } from "../controllers/like.controller.js";
import { totallikesofvideo } from "../controllers/like.controller.js";
import { totallikesofcomment } from "../controllers/like.controller.js";
import { totallikesoftweet } from "../controllers/like.controller.js";
import { getLikedVideos } from "../controllers/like.controller.js";
import cache from "../middlewares/redis.middleware.js";
const router = Router();


router.route("/togglevideolike/:videoid").post(verifyJWT,togglevideolike)

router.route("/totallikesofvideo/:videoid").get(totallikesofvideo)

router.route("/togglecommentlike/:commentid").post(verifyJWT,togglecommentlike)

router.route("/toggletweetlike/:tweetid").post(verifyJWT,toggletweetlike)

router.route("/totallikesofcomment/:commentid").get(
    cache((req)=>`totallikesofcomment:${req.params.commentid}`,300),
    totallikesofcomment)

router.route("/totallikesoftweet/:tweetid").get(
    cache((req)=>`totallikesoftweet:${req.params.tweetid}`,300),
    totallikesoftweet
)

router.route("/videos").get(verifyJWT, getLikedVideos)

export default router;