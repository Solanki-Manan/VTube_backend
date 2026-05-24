import {Router} from 'express';
import {
  registerUser,
  loginUser,
  logoutUser,
  verifyEmail,
  resendVerificationOtp,
  forgotPassword,
  resetPassword,
  refreshAccessToken,
  updateAccountDetails,
  changeCurrentPassword,
  getCurrentUser,
  getUserChannelProfile,
  getWatchHistory,
  updateUserAvatar,
  updateUserCoverImage,
  addVideoToHistory
} from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authLimiter,apiLimiter } from "../middlewares/ratelimiter.middleware.js";

import {upload} from "../middlewares/multer.middleware.js"
import  cache  from '../middlewares/redis.middleware.js';

import { 
    registerValidator, 
    loginValidator, 
    resetPasswordValidator, 
    changePasswordValidator 
} from "../validators/user.validator.js";
import { validateimage,validatecoverimage } from '../middlewares/filevalidator.js';
import { validateRequest } from '../middlewares/validate.js';

/**
 * @swagger
 * /api/v1/users/register:
 *   post:
 *     summary: Register user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *               email:
 *                 type: string
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *               avatar:
 *                 type: string
 *                 format: binary
 *               coverImage:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: User registered
 */


/**
 * @swagger
 * /api/v1/users/login:
 *   post:
 *     summary: Login user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: manan@gmail.com
 *               password:
 *                 type: string
 *                 example: Manan123
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */

/**
 * @swagger
 * /api/v1/users/verify-email:
 *   post:
 *     summary: Verify email using OTP
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               otp:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Email verified successfully
 */


/**
 * @swagger
 * /api/v1/users/forgot-password:
 *   post:
 *     summary: Send OTP for password reset
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP sent to email
 */


/**
 * @swagger
 * /api/v1/users/reset-password:
 *   post:
 *     summary: Reset password using OTP
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               otp:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset successful
 */

const router = Router();

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    validateimage,
    validatecoverimage,
    registerValidator,
    validateRequest,
    authLimiter,
    registerUser
)


router.route("/login").post(loginValidator, validateRequest, authLimiter, loginUser)

router.route("/verify-email").post(apiLimiter, verifyEmail)
router.route("/resend-verification-otp").post(apiLimiter, resendVerificationOtp)
router.route("/forgot-password").post(apiLimiter, forgotPassword)

router.route("/reset-password").post(apiLimiter, resetPasswordValidator, validateRequest, resetPassword)

//secure routes
router.route("/logout").post(verifyJWT,logoutUser)

router.route("/refresh-token").post(refreshAccessToken)

router.route("/change-password").post(verifyJWT, changePasswordValidator, validateRequest, changeCurrentPassword)

router.route("/current-user").get(verifyJWT,getCurrentUser)

router.route("/update-account").patch(verifyJWT,updateAccountDetails)

router.route("/update-avatar").patch(verifyJWT,upload.single("avatar"),updateUserAvatar)

router.route("/update-cover-image").patch(verifyJWT,upload.single("coverImage"),updateUserCoverImage)

router.route("/getchannelprofile/:username").get(
    verifyJWT,
    getUserChannelProfile
)

router.route("/getwatchhistory").get(
    verifyJWT,
    cache((req)=>`watchhistory:${req.user._id.toString()}`,300),
    getWatchHistory
)

router.route("/add-history/:videoId").patch(
    verifyJWT,
    addVideoToHistory
)


export default router;