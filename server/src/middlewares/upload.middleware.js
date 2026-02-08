import multer from "multer";
import path from "path";
import { createApiError } from "../utils/ApiError.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";

// ============================================================================
// MULTER CONFIGURATION
// ============================================================================

// File filter - accept only images
const imageFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(createApiError(
            HTTP_STATUS.BAD_REQUEST,
            "Only image files are allowed (jpeg, jpg, png, gif, webp)"
        ));
    }
};

// File filter - accept images and common document types
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|pdf|doc|docx|txt|zip|rar/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

    if (extname) {
        return cb(null, true);
    } else {
        cb(createApiError(
            HTTP_STATUS.BAD_REQUEST,
            "File type not allowed"
        ));
    }
};

// ============================================================================
// STORAGE OPTIONS
// ============================================================================

// Option 1: Memory Storage (for cloud uploads like S3, Cloudinary)
const memoryStorage = multer.memoryStorage();

// Option 2: Disk Storage (for local development)
const diskStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/"); // Make sure this directory exists
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
    },
});

// ============================================================================
// MULTER INSTANCES
// ============================================================================

// For avatar uploads (images only, max 5MB)
export const upload = multer({
    storage: memoryStorage, // Change to diskStorage for local development
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
    },
    fileFilter: imageFilter,
});

// For message attachments (multiple files, max 10MB each)
export const uploadAttachments = multer({
    storage: memoryStorage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB per file
        files: 10, // Max 10 files at once
    },
    fileFilter: fileFilter,
});

// ============================================================================
// ERROR HANDLING MIDDLEWARE
// ============================================================================

/**
 * Handle Multer errors
 */
export const handleMulterError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: "File too large. Maximum size is 5MB for avatars and 10MB for attachments.",
            });
        }
        if (err.code === "LIMIT_FILE_COUNT") {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: "Too many files. Maximum is 10 files per upload.",
            });
        }
        if (err.code === "LIMIT_UNEXPECTED_FILE") {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: "Unexpected field in upload.",
            });
        }
    }
    next(err);
};

// ============================================================================
// CLOUD UPLOAD HELPER (OPTIONAL - FOR AWS S3, CLOUDINARY, ETC.)
// ============================================================================

/**
 * Upload file to cloud storage (example for Cloudinary)
 * Uncomment and configure when ready to use cloud storage
 */
/*
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadToCloudinary = async (file, folder = "avatars") => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: folder,
                resource_type: "auto",
            },
            (error, result) => {
                if (error) reject(error);
                else resolve(result);
            }
        );

        uploadStream.end(file.buffer);
    });
};
*/

/**
 * Upload file to AWS S3 (example)
 * Uncomment and configure when ready to use S3
 */
/*
import AWS from "aws-sdk";

const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
});

export const uploadToS3 = async (file, folder = "avatars") => {
    const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: `${folder}/${Date.now()}-${file.originalname}`,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: "public-read",
    };

    const result = await s3.upload(params).promise();
    return result.Location; // Returns the URL
};
*/

export default {
    upload,
    uploadAttachments,
    handleMulterError,
};