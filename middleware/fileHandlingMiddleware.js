import fs from "fs";

/**
 * Middleware to handle React Native file uploads properly
 * This should be applied before the multer middleware
 */
function handleReactNativeUploads(req, res, next) {
  // Process only if it's a multipart request
  if (
    req.headers["content-type"] &&
    req.headers["content-type"].includes("multipart/form-data")
  ) {
    next();
    return;
  }

  next();
}

/**
 * Middleware to handle file processing after multer has saved the files
 * This corrects empty files that might be created due to format issues
 */
function processUploadedFiles(req, res, next) {
  // If no files uploaded, continue
  if (!req.files) {
    next();
    return;
  }

  const processFile = (file) => {
    try {
      // Check if file exists and has zero size
      const stats = fs.statSync(file.path);
      if (stats.size === 0) {
        console.warn(
          `File ${file.path} has zero size. Removing and flagging as missing.`
        );
        // Remove the empty file
        fs.unlinkSync(file.path);
        // Mark file as problematic
        file.error = "File upload failed - empty file received";
        return false;
      }
      return true;
    } catch (error) {
      console.error(`Error processing file ${file.path}:`, error);
      file.error = "File processing error";
      return false;
    }
  };

  // Process all uploaded files
  Object.keys(req.files).forEach((fieldName) => {
    req.files[fieldName].forEach((file) => {
      processFile(file);
    });
  });

  next();
}

export default handleReactNativeUploads;
