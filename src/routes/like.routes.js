import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { togglelike } from "../controllers/like.controller.js";
import { togglecommentlike } from "../controllers/like.controller.js";
import { toggletweetlike } from "../controllers/like.controller.js";
import { totallikesofvideo } from "../controllers/like.controller.js";
import { totallikesofcomment } from "../controllers/like.controller.js";
import { totallikesoftweet } from "../controllers/like.controller.js";

const router = Router();


router.route("/togglevideolike/:videoid").post(verifyJWT,togglelike)

router.route("/totallikesofvideo/:videoid").get(totallikesofvideo)

router.route("/togglecommentlike/:commentid").post(verifyJWT,togglecommentlike)

router.route("/toggletweetlike/:tweetid").post(verifyJWT,toggletweetlike)

router.route("/totallikesofcomment/:commentid").get(totallikesofcomment)

router.route("/totallikesoftweet/:tweetid").get(totallikesoftweet)

export default router;