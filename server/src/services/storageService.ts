import fs from "fs";
import path from "path";

export interface IStorageProvider {
  /**
   * Saves a file to the configured storage engine.
   * @param localPath Temporary local path of the file
   * @param destinationDir Destination directory name (e.g., "certificates" or "offer-letters")
   * @param fileName Final name of the file
   * @returns Download URL or path to save in MongoDB
   */
  saveFile(localPath: string, destinationDir: string, fileName: string): Promise<string>;
}

class LocalStorageProvider implements IStorageProvider {
  async saveFile(localPath: string, destinationDir: string, fileName: string): Promise<string> {
    const uploadDir = path.join(__dirname, "../../../uploads", destinationDir);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    const finalPath = path.join(uploadDir, fileName);

    // If localPath is different, copy the file
    if (localPath !== finalPath) {
      fs.copyFileSync(localPath, finalPath);
      // Clean up temp file
      if (fs.existsSync(localPath) && localPath.includes("temp")) {
        try {
          fs.unlinkSync(localPath);
        } catch (e) {
          console.warn("[Storage] Failed to delete temp file:", localPath);
        }
      }
    }
    return `/api/${destinationDir === "certificates" ? "certificates" : "offer-letters"}/download/${fileName.split("-")[1]}`;
  }
}

class S3StorageProvider implements IStorageProvider {
  async saveFile(localPath: string, destinationDir: string, fileName: string): Promise<string> {
    console.log(`[Storage] Simulated AWS S3 Upload of ${fileName} to bucket folder ${destinationDir}`);
    
    // Save locally as a copy for verification, then return AWS S3 simulated URL
    const uploadDir = path.join(__dirname, "../../../uploads", destinationDir);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    fs.copyFileSync(localPath, path.join(uploadDir, fileName));

    const bucketName = process.env.S3_BUCKET_NAME || "klassygo-hrm-bucket";
    return `https://${bucketName}.s3.amazonaws.com/${destinationDir}/${fileName}`;
  }
}

class GCSStorageProvider implements IStorageProvider {
  async saveFile(localPath: string, destinationDir: string, fileName: string): Promise<string> {
    console.log(`[Storage] Simulated Google Cloud Storage Upload of ${fileName} to bucket folder ${destinationDir}`);
    
    // Save locally as a copy for verification, then return GCS simulated URL
    const uploadDir = path.join(__dirname, "../../../uploads", destinationDir);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    fs.copyFileSync(localPath, path.join(uploadDir, fileName));

    const bucketName = process.env.GCS_BUCKET_NAME || "klassygo-hrm-bucket";
    return `https://storage.googleapis.com/${bucketName}/${destinationDir}/${fileName}`;
  }
}

export const getStorageProvider = (): IStorageProvider => {
  const provider = (process.env.STORAGE_PROVIDER || "local").toLowerCase();
  if (provider === "s3") {
    return new S3StorageProvider();
  }
  if (provider === "gcs") {
    return new GCSStorageProvider();
  }
  return new LocalStorageProvider();
};
