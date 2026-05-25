import multer from "multer";
import fs from "fs";
import { ApiError } from "../utils/ApiError.js";

// Ensure the temp directory exists
const tempDir = "./public/temp";
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, tempDir);
    },
    filename: function (req, file, cb) {
        const uniqueName = Date.now() + "-" + file.originalname;
        cb(null, uniqueName);
    }
});

const fileFilter = (req, file, cb) => {
    // Allowed file mimetypes
    const allowedMimeTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "video/mp4",
        "video/webm",
        "video/ogg"
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
        // Accept file
        cb(null, true);
    } else {
        // Reject file
        cb(new ApiError(400, `Unsupported file type: ${file.mimetype}. Only JPEG, PNG, WEBP, MP4, WEBM, and OGG are allowed.`), false);
    }
};

export const upload = multer({ 
    storage,
    fileFilter,
    limits: {
        fileSize: 100 * 1024 * 1024, // 100 MB max size
    }
});
