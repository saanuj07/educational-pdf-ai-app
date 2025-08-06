const fs = require('fs');
const path = require('path');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '..', 'uploads');
const metadataFile = path.join(uploadsDir, 'metadata.json');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('📁 Created uploads directory:', uploadsDir);
}

// Load existing metadata
let fileMetadata = {};
if (fs.existsSync(metadataFile)) {
  try {
    fileMetadata = JSON.parse(fs.readFileSync(metadataFile, 'utf8'));
    console.log(`📄 Loaded ${Object.keys(fileMetadata).length} existing files from metadata`);
  } catch (error) {
    console.error('Error loading metadata:', error);
    fileMetadata = {};
  }
} else {
  console.log('📄 No existing metadata found, starting fresh');
}

// Save metadata to file
const saveMetadata = () => {
  try {
    fs.writeFileSync(metadataFile, JSON.stringify(fileMetadata, null, 2));
  } catch (error) {
    console.error('Error saving metadata:', error);
  }
};

// Store file data
const storeFile = (fileId, fileBuffer, metadata) => {
  try {
    // Save the file buffer to disk
    const filePath = path.join(uploadsDir, `${fileId}.pdf`);
    fs.writeFileSync(filePath, fileBuffer);
    
    // Save metadata
    fileMetadata[fileId] = {
      ...metadata,
      filePath,
      uploadDate: new Date().toISOString()
    };
    
    saveMetadata();
    
    console.log(`💾 Stored file ${fileId} locally:`, {
      filename: metadata.filename,
      size: fileBuffer.length,
      path: filePath
    });
    
    return true;
  } catch (error) {
    console.error('Error storing file:', error);
    return false;
  }
};

// Retrieve file metadata
const getFileMetadata = (fileId) => {
  return fileMetadata[fileId] || null;
};

// Get all files
const getAllFiles = () => {
  return fileMetadata;
};

// Delete file
const deleteFile = (fileId) => {
  try {
    const metadata = fileMetadata[fileId];
    if (metadata && metadata.filePath && fs.existsSync(metadata.filePath)) {
      fs.unlinkSync(metadata.filePath);
    }
    
    delete fileMetadata[fileId];
    saveMetadata();
    
    console.log(`🗑️ Deleted file ${fileId}`);
    return true;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
};

// Clean up old files (optional - for maintenance)
const cleanupOldFiles = (daysOld = 30) => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  
  let deletedCount = 0;
  for (const [fileId, metadata] of Object.entries(fileMetadata)) {
    const uploadDate = new Date(metadata.uploadDate);
    if (uploadDate < cutoffDate) {
      deleteFile(fileId);
      deletedCount++;
    }
  }
  
  if (deletedCount > 0) {
    console.log(`🧹 Cleaned up ${deletedCount} old files`);
  }
  
  return deletedCount;
};

module.exports = {
  storeFile,
  getFileMetadata,
  getAllFiles,
  deleteFile,
  cleanupOldFiles,
  uploadsDir
};
