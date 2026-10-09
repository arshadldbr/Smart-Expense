/**
 * Backblaze B2 Direct Cloud Storage Service
 * Uses Backblaze B2 S3-Compatible API with the provisioned Application Key.
 * Works seamlessly in both static hosting (GitHub Pages) and full-stack environments.
 */

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export interface B2Status {
  connected: boolean;
  bucketName: string;
  bucketId?: string;
  endpoint?: string;
  fileCount?: number;
  error?: string;
}

export interface B2UploadResult {
  success: boolean;
  fileId?: string;
  fileName: string;
  url: string;
  size?: number;
  error?: string;
}

export interface B2BackupResult {
  success: boolean;
  message?: string;
  fileName?: string;
  url?: string;
  timestamp?: string;
  error?: string;
}

export interface B2CloudFile {
  fileId: string;
  fileName: string;
  contentLength: number;
  uploadTimestamp: number;
  downloadUrl: string;
}

const B2_CREDENTIALS = {
  bucketName: 'Smartexpense',
  bucketId: '0dd37800427b1ffaae130116',
  endpoint: 'https://s3.us-east-005.backblazeb2.com',
  region: 'us-east-005',
  accessKeyId: '005d3802bfae3160000000001',
  secretAccessKey: 'K005RpLjByfMvH2c4n3hMEd3Dnc1wTA',
};

// Initialize S3 client for Backblaze B2 S3 API
const s3 = new S3Client({
  endpoint: B2_CREDENTIALS.endpoint,
  region: B2_CREDENTIALS.region,
  credentials: {
    accessKeyId: B2_CREDENTIALS.accessKeyId,
    secretAccessKey: B2_CREDENTIALS.secretAccessKey,
  },
});

class BackblazeService {
  public bucketName = B2_CREDENTIALS.bucketName;
  public bucketId = B2_CREDENTIALS.bucketId;
  public endpoint = 's3.us-east-005.backblazeb2.com';

  /**
   * Check connection status to Backblaze B2 bucket
   */
  async checkConnection(): Promise<B2Status> {
    try {
      const res = await s3.send(
        new ListObjectsV2Command({
          Bucket: this.bucketName,
          MaxKeys: 10,
        })
      );

      return {
        connected: true,
        bucketName: this.bucketName,
        bucketId: this.bucketId,
        endpoint: this.endpoint,
        fileCount: res.KeyCount ?? res.Contents?.length ?? 0,
      };
    } catch (err: any) {
      console.error('B2 connection error:', err);
      return {
        connected: false,
        bucketName: this.bucketName,
        endpoint: this.endpoint,
        error: err?.message || 'Failed to reach Backblaze B2 bucket',
      };
    }
  }

  /**
   * Direct Upload: uploads receipt image to Backblaze B2 Smartexpense bucket
   * This works in both GitHub Pages static environment and AI Studio!
   */
  async uploadReceipt(file: File, userId: string = 'default_user'): Promise<B2UploadResult> {
    try {
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const key = `receipts/${userId}/${Date.now()}_${cleanFileName}`;

      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      // Upload directly via S3 PutObject to Backblaze B2
      await s3.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: key,
          Body: uint8Array,
          ContentType: file.type || 'image/png',
        })
      );

      // Generate presigned download URL valid for 7 days (604800 seconds)
      const presignedUrl = await getSignedUrl(
        s3,
        new GetObjectCommand({
          Bucket: this.bucketName,
          Key: key,
        }),
        { expiresIn: 604800 }
      );

      return {
        success: true,
        fileName: key,
        url: presignedUrl,
        size: file.size,
      };
    } catch (err: any) {
      console.error('Direct Backblaze S3 upload failed:', err);
      return {
        success: false,
        fileName: file.name,
        url: '',
        error: err?.message || 'Failed to upload receipt to Backblaze B2',
      };
    }
  }

  /**
   * Backup all application records to Backblaze B2
   */
  async backupData(backupPayload: any, userId: string = 'default_user'): Promise<B2BackupResult> {
    try {
      const jsonStr = typeof backupPayload === 'string' ? backupPayload : JSON.stringify(backupPayload, null, 2);
      const encoder = new TextEncoder();
      const uint8Array = encoder.encode(jsonStr);

      const nowStr = new Date().toISOString().replace(/[:.]/g, '-');
      const archivePath = `backups/${userId}/${nowStr}_backup.json`;
      const latestPath = `backups/${userId}/latest.json`;

      // 1. Upload timestamped archive
      await s3.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: archivePath,
          Body: uint8Array,
          ContentType: 'application/json',
        })
      );

      // 2. Upload latest pointer
      await s3.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: latestPath,
          Body: uint8Array,
          ContentType: 'application/json',
        })
      );

      const latestUrl = await getSignedUrl(
        s3,
        new GetObjectCommand({
          Bucket: this.bucketName,
          Key: latestPath,
        }),
        { expiresIn: 604800 }
      );

      return {
        success: true,
        message: 'Backup successfully uploaded to Backblaze B2',
        fileName: archivePath,
        url: latestUrl,
        timestamp: new Date().toISOString(),
      };
    } catch (err: any) {
      console.error('Backblaze backup error:', err);
      return {
        success: false,
        error: err?.message || 'Failed to upload backup to Backblaze B2',
      };
    }
  }

  /**
   * Fetch latest cloud backup from Backblaze B2 for the given user
   */
  async fetchLatestBackup(userId: string = 'default_user'): Promise<any | null> {
    try {
      const latestPath = `backups/${userId}/latest.json`;
      const presignedUrl = await getSignedUrl(
        s3,
        new GetObjectCommand({
          Bucket: this.bucketName,
          Key: latestPath,
        }),
        { expiresIn: 3600 }
      );

      const res = await fetch(presignedUrl);
      if (!res.ok) return null;
      return await res.json();
    } catch (err) {
      console.error('Failed to fetch latest cloud backup from B2:', err);
      return null;
    }
  }

  /**
   * List files currently stored in Backblaze B2
   */
  async listFiles(prefix?: string): Promise<B2CloudFile[]> {
    try {
      const res = await s3.send(
        new ListObjectsV2Command({
          Bucket: this.bucketName,
          Prefix: prefix,
          MaxKeys: 50,
        })
      );

      const contents = res.Contents || [];
      const filesWithUrls = await Promise.all(
        contents.map(async (item) => {
          const key = item.Key || '';
          let downloadUrl = '';
          try {
            downloadUrl = await getSignedUrl(
              s3,
              new GetObjectCommand({
                Bucket: this.bucketName,
                Key: key,
              }),
              { expiresIn: 86400 }
            );
          } catch {
            downloadUrl = `${B2_CREDENTIALS.endpoint}/${this.bucketName}/${key}`;
          }

          return {
            fileId: item.ETag || key,
            fileName: key,
            contentLength: item.Size || 0,
            uploadTimestamp: item.LastModified ? item.LastModified.getTime() : Date.now(),
            downloadUrl,
          };
        })
      );

      return filesWithUrls;
    } catch (err) {
      console.error('Failed to list files from B2:', err);
      return [];
    }
  }
}

export const backblazeService = new BackblazeService();
