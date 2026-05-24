import { body } from "express-validator";

export const registerValidator = [
  body("fullName")
    .trim()
    .escape()
    .notEmpty().withMessage("Full name is required"),

  body("email")
    .trim()
    .normalizeEmail()
    .isEmail().withMessage("Valid email is required"),

  body("username")
    .trim()
    .escape()
    .isLength({ min: 3 }).withMessage("Username must be at least 3 characters"),

  body("password")
    .trim()
    .isStrongPassword({ minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 0 })
    .withMessage("Password must be at least 8 characters, with at least 1 uppercase letter, 1 lowercase letter, and 1 number"),
];

export const loginValidator = [
  body("email")
    .optional()
    .trim()
    .isEmail().withMessage("Invalid email"),

  body("username")
    .optional()
    .trim(),

  body("password")
    .trim()
    .notEmpty().withMessage("Password is required"),
];

export const resetPasswordValidator = [
  body("email")
    .trim()
    .normalizeEmail()
    .isEmail().withMessage("Valid email is required"),

  body("otp")
    .trim()
    .notEmpty().withMessage("OTP is required"),

  body("newPassword")
    .trim()
    .isStrongPassword({ minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 0 })
    .withMessage("Password must be at least 8 characters, with at least 1 uppercase letter, 1 lowercase letter, and 1 number"),
];

export const changePasswordValidator = [
  body("oldPassword")
    .trim()
    .notEmpty().withMessage("Current password is required"),

  body("newPassword")
    .trim()
    .isStrongPassword({ minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 0 })
    .withMessage("Password must be at least 8 characters, with at least 1 uppercase letter, 1 lowercase letter, and 1 number"),
];