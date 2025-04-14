import multer from "multer";
import { existsSync, mkdirSync } from "fs";
import { extname } from "path";

// Configure storage for uploaded files
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir =
      file.fieldname === "profileImage"
        ? "./uploads/profiles"
        : file.fieldname === "buyerReqImages"
        ? "./uploads/buyerReqImages"
        : "./uploads/documents";

    // Create directory if it doesn't exist
    if (!existsSync(uploadDir)) {
      mkdirSync(uploadDir, { recursive: true });
    }

    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const extension = extname(file.originalname) || ".jpg"; // Default to .jpg if extension is missing
    cb(null, file.fieldname + "-" + uniqueSuffix + extension);
  },
});

// Configure file filter
const fileFilter = (req, file, cb) => {
  // Accept images or handle React Native file objects
  if (
    file.mimetype.startsWith("image/") ||
    file.mimetype === "application/octet-stream"
  ) {
    cb(null, true);
  } else {
    cb(new Error("Not an image! Please upload only images."), false);
  }
};

// Initialize multer upload
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
  },
});

export default upload;
