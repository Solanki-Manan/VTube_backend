import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import uploadOnCloudinary  from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"
import mongoose from "mongoose";
import redis from "../utils/redis.js";
import bcrypt from "bcrypt";
import { sendEmail } from "../utils/sendEmail.js";
const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId)
        if (!user) {
            throw new ApiError(404, "User not found")
        }
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }
    }
    catch (error) {
        throw new ApiError(500, "Something went wrong while generating access and refresh tokens")
    }
}

const registerUser = asyncHandler(async (req, res) => {

    const { fullName, email, username, password } = req.body;

    const emailNormalized = email?.toLowerCase().trim();
    const usernameNormalized = username?.toLowerCase().trim();
    const fullNameTrimmed = fullName?.trim();

    if (
        [fullNameTrimmed, emailNormalized, usernameNormalized, password]
            .some((field) => !field)
    ) {
        throw new ApiError(400, "All fields are required");
    }

    const existedUser = await User.findOne({
        $or: [
            { username: usernameNormalized },
            { email: emailNormalized }
        ]
    });

    if (existedUser) {
        throw new ApiError(409, "User already exists");
    }

    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);

    if (!avatar) {
        throw new ApiError(400, "Error uploading avatar");
    }

    let coverImage;
    if (coverImageLocalPath) {
        coverImage = await uploadOnCloudinary(coverImageLocalPath);
    }

    // 🔐 Generate & hash OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOTP = await bcrypt.hash(otp, 10);

    const user = await User.create({
        fullName: fullNameTrimmed,
        email: emailNormalized,
        username: usernameNormalized,
        password,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        emailOTP: hashedOTP,
        emailOTPExpiry: Date.now() + 10 * 60 * 1000,
    });

    //  Send email safely
    try {
        await sendEmail(
            emailNormalized,
            "Verify your email",
            `Your OTP is ${otp}`
        );
    } catch (error) {
        console.log("Email failed:", error.message);
    }

    const createdUser = await User.findById(user._id)
        .select("-password -refreshToken");

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered. Please verify email.")
    );
});


const verifyEmail = asyncHandler(async (req, res) => {
    const { email, otp } = req.body;

    const emailNormalized = email?.toLowerCase().trim();

    const user = await User.findOne({ email: emailNormalized });

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    if (user.isVerified) {
        throw new ApiError(400, "Email already verified");
    }

    // 🔐 Check OTP expiry
    if (user.emailOTPExpiry < Date.now()) {
        throw new ApiError(400, "OTP expired");
    }

    // 🔐 Compare hashed OTP
    const isOTPValid = await bcrypt.compare(otp, user.emailOTP);

    if (!isOTPValid) {
        throw new ApiError(400, "Invalid OTP");
    }

    // Mark verified
    user.isVerified = true;
    user.emailOTP = undefined;
    user.emailOTPExpiry = undefined;

    await user.save();

    return res.status(200).json({
        success: true,
        message: "Email verified successfully"
    });
});

const loginUser = asyncHandler(async (req, res) => {
    //req body->data
    //username or email
    //find the user
    //password check
    //access & refresh token
    //send cookie
    const { email, username, password } = req.body

    if (!(username || email)) {
        throw new ApiError(400, "Username and email are required")
    }

    const user = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (!user) {
        throw new ApiError(404, "User not found")
    }


    const ispasswordvalid = await user.isPasswordCorrect(password)

    if (!ispasswordvalid) {
        throw new ApiError(401, "Invalid credentials")
    }

    if (!user.isVerified) {
        throw new ApiError(403, "Please verify your email first");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax"
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser,
                    accessToken,
                    refreshToken
                },
                "User logged in successfully"
            )
        )


})

const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;

    const emailNormalized = email?.toLowerCase().trim();

    const user = await User.findOne({ email: emailNormalized });

    if (!user) {
        throw new ApiError(404, "User not found");
    }
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOTP = await bcrypt.hash(otp, 10);
    user.resetpasswordOTP = hashedOTP;
    user.resetpasswordOTPExpiry = Date.now() + 10 * 60 * 1000;
    await user.save({ validateBeforeSave: false });
    await sendEmail(
        emailNormalized,
        "Reset your password",
        `Your OTP for password reset is ${otp}`
    );
    return res.status(200).json({
        success: true,
        message: "OTP sent to email for password reset"
    })
})

const resetPassword = asyncHandler(async (req, res) => {
    const { email, otp, newPassword } = req.body;

    const emailNormalized = email?.toLowerCase().trim();

    const user = await User.findOne({ email: emailNormalized });

    if (!user) {
        throw new ApiError(404, "User not found");
    }
    if (user.resetpasswordOTPExpiry < Date.now()) {
        throw new ApiError(400, "OTP expired");
    }
    const isOTPValid = await bcrypt.compare(otp, user.resetpasswordOTP);

    if (!isOTPValid) {
        throw new ApiError(400, "Invalid OTP");
    }
    user.password = newPassword;
    user.resetpasswordOTP = undefined;
    user.resetpasswordOTPExpiry = undefined;
    user.isVerified = true; // They proved they own the email by receiving the reset OTP!
    await user.save();
    return res.status(200).json({
        success: true,
        message: "Password reset successfully"
    })
})

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax"
    }

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged out successfully"))

})

const refreshAccessToken = asyncHandler(async (req, res) => {

    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized Request")
    }

    let decodedToken;

    try {
        decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        );
    } catch (error) {
        throw new ApiError(401, "Invalid or expired refresh token");
    }

    const user = await User.findById(decodedToken?._id)

    if (!user) {
        throw new ApiError(401, "Invalid Refresh Token")
    }
    //IMPORTANT CHECK (ANTI-REUSE)
    if (incomingRefreshToken !== user?.refreshToken) {
        throw new ApiError(401, "Refresh Token is expired or used")
    }
    
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id)

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax"
    };


    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(200, { accessToken, refreshToken }, "Access Token Refreshed Successfully"))

})

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body
    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(401, "Invalid Password")
    }

    user.password = newPassword
    await user.save({ validateBeforeSave: false })

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Password changed successfully"))

})

const getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(new ApiResponse(200, req.user, "User fetched successfully"))
})

const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullName, email } = req.body
    if (!fullName || !email) {
        throw new ApiError(400, "All fields are required")
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email: email
            }
        },
        { new: true }
    ).select("-password")
    await redis.del(`channel:${req.user.username.toLowerCase()}`);
    return res
        .status(200)
        .json(new ApiResponse(200, user, "User updated successfully"))
})

const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if (!avatar.url) {
        throw new ApiError(400, "Error while uploading avatar")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url
            },

        },
        { new: true }
    ).select("-password")
    await redis.del(`channel:${req.user.username.toLowerCase()}`);
    return res
        .status(200)
        .json(new ApiResponse(200, user, "Avatar updated successfully"))

})

const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path
    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover Image file is required")
    }
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!coverImage.url) {
        throw new ApiError(400, "Error while uploading cover image")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url
            },

        },
        { new: true }
    ).select("-password")

    await redis.del(`channel:${req.user.username.toLowerCase()}`);
        
    return res
        .status(200)
        .json(new ApiResponse(200, user, "Cover Image updated successfully"))

})

const getUserChannelProfile = asyncHandler(async (req, res) => {
    const { username } = req.params
    if (!username?.trim()) {
        throw new ApiError(400, "Username is missing")
    }


    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "Subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "SubscribedTo"
            }
        },
        {
            $addFields: {
                subscribersCount: { $size: "$Subscribers" },
                channelsSubscribedToCount: { $size: "$SubscribedTo" },
                isSubscribed: {
                    $cond: {
                        if: {
                            $in: [
                                req.user?._id,
                                { $ifNull: ["$Subscribers.subscriber", []] }
                            ]
                        },
                        then: true,
                        else: false
                    }
                }

            }
        },
        {
            $project: {
                fullName: 1,
                username: 1,
                avatar: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                coverImage: 1,
                email: 1,
            }
        }
    ])
    if (!channel?.length) {
        throw new ApiError(404, "Channel does not exists")
    }

    

    return res
        .status(200)
        .json(new ApiResponse(200, channel[0], "Channel fetched successfully"))

})

const getWatchHistory = asyncHandler(async (req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchhistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            owner: {
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    const originalOrder = user[0].watchhistory.map(id => id.toString());
    
    // Sort the populated videos to match the exact recent-first order of the original array
    const watchHistory = user[0].watchHistory.sort((a, b) => {
        return originalOrder.indexOf(a._id.toString()) - originalOrder.indexOf(b._id.toString());
    });

    return res
        .status(200)
        .json(new ApiResponse(200, watchHistory, "Watch history fetched successfully"))
})

const addVideoToHistory = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const user = await User.findById(req.user._id);
    
    // Remove if already exists so we can add it to the top/end (optional, but good for history)
    user.watchhistory = user.watchhistory.filter(id => id.toString() !== videoId);
    
    // Add to the beginning of the array so newest is first
    user.watchhistory.unshift(videoId);
    
    await user.save({ validateBeforeSave: false });

    // Clear the cache for watch history!
    await redis.del(`watchhistory:${req.user._id.toString()}`);

    return res.status(200).json(new ApiResponse(200, {}, "Video added to history"));
});

const resendVerificationOtp = asyncHandler(async (req, res) => {
    const { email } = req.body;

    const emailNormalized = email?.toLowerCase().trim();

    if (!emailNormalized) {
        throw new ApiError(400, "Email is required");
    }

    const user = await User.findOne({ email: emailNormalized });

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    if (user.isVerified) {
        throw new ApiError(400, "Email is already verified");
    }

    // Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOTP = await bcrypt.hash(otp, 10);

    user.emailOTP = hashedOTP;
    user.emailOTPExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save({ validateBeforeSave: false });

    await sendEmail(
        emailNormalized,
        "Verify your email - OTP Resent",
        `Your new OTP for email verification is: ${otp}. It expires in 10 minutes.`
    );

    return res.status(200).json(
        new ApiResponse(200, {}, "OTP resent successfully. Check your email or backend terminal.")
    );
});

export {
    registerUser,
    loginUser,
    logoutUser,
    verifyEmail,
    resendVerificationOtp,
    forgotPassword,
    resetPassword,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory,
    addVideoToHistory
};
