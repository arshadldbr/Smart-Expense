/**
 * Backblaze B2 Cloud Storage Service
 * Handles receipt image uploads, automated cloud backups, and data restoration.
 * Integrates via Express server proxy (/api/b2/*) with direct client fallback for static hosting.
 */

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

class BackblazeService {
  public bucketName = 'Smartexpense';
  public bucketId = '0dd37800427b1ffaae130116';
  public endpoint = 's3.us-east-005.backblazeb2.com';

  /**
   * Helper to convert File or Blob to Base64 string
   */
  private fileToBase64(file: File | Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  }

  /**
   * Check connection status to Backblaze B2 bucket
   */
  async checkConnection(): Promise<B2Status> {
    try {
      const res = await fetch('/api/b2/status');
      if (res.ok) {
        const data = await res.json();
        return {
          connected: Boolean(data.connected ?? data.success),
          bucketName: data.bucketName || this.bucketName,
          bucketId: data.bucketId || this.bucketId,
          endpoint: data.endpoint || this.endpoint,
          fileCount: data.fileCount,
        };
      }
      return {
        connected: false,
        bucketName: this.bucketName,
        error: `Server responded with status ${res.status}`,
      };
    } catch (err: any) {
      return {
        connected: false,
        bucketName: this.bucketName,
        error: err?.message || 'Failed to reach cloud storage service',
      };
    }
  }

  /**
   * Upload receipt image to Backblaze B2 Smartexpense bucket
   */
  async uploadReceipt(file: File, userId: string = 'default_user'): Promise<B2UploadResult> {
    try {
      const base64Data = await this.fileToBase64(file);

      const response = await fetch('/api/b2/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: base64Data,
          fileName: file.name,
          contentType: file.type || 'image/jpeg',
          folder: `receipts/${userId}`,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed (${response.status}): ${errorText}`);
      }

      const result = await response.json();
      return {
        success: true,
        fileId: result.fileId,
        fileName: result.fileName,
        url: result.url,
        size: result.size || file.size,
      };
    } catch (err: any) {
      console.error('Backblaze receipt upload error:', err);
      return {
        success: false,
        fileName: file.name,
        url: '',
        error: err?.message || 'Failed to upload receipt to Backblaze B2',
      };
    }
  }

  /**
   * Backup all application financial records to Backblaze B2
   */
  async backupData(backupPayload: any, userId: string = 'default_user'): Promise<B2BackupResult> {
    try {
      const response = await fetch('/api/b2/backup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payload: backupPayload,
          userId,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Backup failed (${response.status}): ${errText}`);
      }

      const result = await response.json();
      return {
        success: true,
        message: result.message || 'Backup successfully saved to Backblaze B2',
        fileName: result.fileName,
        url: result.url,
        timestamp: result.timestamp || new Date().toISOString(),
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
      const res = await fetch(`/api/b2/backup/latest?userId=${encodeURIComponent(userId)}`);
      if (!res.ok) {
        return null;
      }
      const json = await res.json();
      return json.data || null;
    } catch (err) {
      console.error('Failed to fetch latest cloud backup:', err);
      return null;
    }
  }

  /**
   * List files currently stored in Backblaze B2
   */
  async listFiles(prefix?: string): Promise<B2CloudFile[]> {
    try {
      const query = prefix ? `?prefix=${encodeURIComponent(prefix)}` : '';
      const res = await fetch(`/api/b2/files${query}`);
      if (!res.ok) {
        return [];
      }
      const data = await res.json();
      return data.files || [];
    } catch (err) {
      console.error('Failed to list files:', err);
      return [];
    }
  }
}

export const backblazeService = new BackblazeService();
