import multer from "multer";
import path from "path";
import fs from "fs";

// Ensure temp directory exists
const tempDir = path.join(__dirname, "../../../uploads/temp");
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Set size limit to 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Allowed MIME types (JPEG, PNG, GIF, and PDF)
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/gif", "application/pdf"];

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  }
});

export const uploadValidator = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE
  },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only JPEG, PNG, GIF, and PDF files are allowed."));
    }
  }
});
