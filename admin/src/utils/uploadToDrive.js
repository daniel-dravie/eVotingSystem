// uploadToDrive.js
const fs = require("fs");
const path = require("path");
const { google } = require("googleapis");
const { oauth2Client } = require("./driveAuth");

const uploadFile = async (filePath, fileName, mimeType, tokens) => {
  try {
    // Validate parameters
    if (!filePath || !fileName || !mimeType || !tokens) {
      throw new Error("Missing required parameters: filePath, fileName, mimeType, or tokens");
    }

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    // Check file size (limit to 10MB)
    const stats = fs.statSync(filePath);
    const fileSizeInMB = stats.size / (1024 * 1024);
    if (fileSizeInMB > 10) {
      throw new Error(`File size (${fileSizeInMB.toFixed(2)}MB) exceeds 10MB limit`);
    }

    // Validate tokens
    if (!tokens.access_token) {
      throw new Error("Invalid tokens: access_token is required");
    }

    oauth2Client.setCredentials(tokens);

    const drive = google.drive({ version: "v3", auth: oauth2Client });

    // Create file metadata
    const fileMetadata = {
      name: fileName,
      mimeType: mimeType,
    };

    // Create media object
    const media = {
      mimeType: mimeType,
      body: fs.createReadStream(filePath),
    };

    // Upload file
    const res = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: "id, name, mimeType, size",
    });

    if (!res.data.id) {
      throw new Error("Failed to upload file: No file ID returned");
    }

    // Make file public (with error handling)
    try {
      await drive.permissions.create({
        fileId: res.data.id,
        requestBody: {
          role: "reader",
          type: "anyone",
        },
      });
    } catch (permissionError) {
      console.warn("Warning: Could not make file public:", permissionError.message);
    }

    // Construct file URL
    const fileUrl = `https://drive.google.com/uc?id=${res.data.id}`;

    return {
      success: true,
      id: res.data.id,
      url: fileUrl,
      name: res.data.name,
      mimeType: res.data.mimeType,
      size: res.data.size,
    };

  } catch (error) {
    console.error("Error uploading file to Google Drive:", error);
    
    // Provide more specific error messages
    let errorMessage = "Failed to upload file";
    
    if (error.code === "ENOENT") {
      errorMessage = "File not found";
    } else if (error.code === 401) {
      errorMessage = "Authentication failed - invalid or expired tokens";
    } else if (error.code === 403) {
      errorMessage = "Permission denied - insufficient Google Drive permissions";
    } else if (error.message.includes("exceeds")) {
      errorMessage = error.message;
    } else {
      errorMessage = error.message || "Unknown error occurred during upload";
    }

    return {
      success: false,
      error: errorMessage,
      code: error.code,
    };
  }
};

// Utility function to validate MIME type
const validateMimeType = (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.pdf': 'application/pdf',
    '.txt': 'text/plain',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  };
  return mimeTypes[ext] || 'application/octet-stream';
};

// Utility function to sanitize file name
const sanitizeFileName = (fileName) => {
  return fileName.replace(/[^a-zA-Z0-9.-]/g, '_').substring(0, 255);
};

module.exports = {
  uploadFile,
  validateMimeType,
  sanitizeFileName,
};
