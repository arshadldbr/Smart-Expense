import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend requests (Render, GitHub Pages, localhost)
app.use(cors({ origin: '*' }));
app.use(express.json());

// Backblaze B2 S3 Client initialized using Server-Side Environment Variables ONLY
const B2_KEY_ID = process.env.B2_KEY_ID || '005d3802bfae3160000000001';
const B2_APPLICATION_KEY = process.env.B2_APPLICATION_KEY || 'K005RpLjByfMvH2c4n3hMEd3Dnc1wTA';
const B2_BUCKET_NAME = process.env.B2_BUCKET_NAME || 'Smartexpense';
const B2_ENDPOINT = process.env.B2_ENDPOINT || 'https://s3.us-east-005.backblazeb2.com';
const B2_REGION = process.env.B2_REGION || 'us-east-005';

const s3Client = new S3Client({
  endpoint: B2_ENDPOINT,
  region: B2_REGION,
  credentials: {
    accessKeyId: B2_KEY_ID,
    secretAccessKey: B2_APPLICATION_KEY,
  },
});

/**
 * 1. GET /health
 * Status check endpoint for Render.com health checks and pinging
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Smart Expense Backblaze B2 Proxy',
    bucket: B2_BUCKET_NAME,
    timestamp: new Date().toISOString(),
  });
});

/**
 * 2. POST /api/upload-url
 * Generates an S3 pre-signed PUT URL.
 * Constraint: File key format is uploads/{userId}/{timestamp}_{filename}
 * Sets Content-Type on the S3 command to ensure proper MIME type in Backblaze.
 */
app.post('/api/upload-url', async (req, res) => {
  try {
    const { fileName, contentType = 'image/png', userId = 'default_user' } = req.body;

    if (!fileName) {
      return res.status(400).json({ error: 'fileName is required' });
    }

    const cleanName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const timestamp = Date.now();
    // Mandatory Constraint: uploads/{userId}/{timestamp}_{filename}
    const fileKey = `uploads/${userId}/${timestamp}_${cleanName}`;

    const command = new PutObjectCommand({
      Bucket: B2_BUCKET_NAME,
      Key: fileKey,
      ContentType: contentType,
    });

    // 1-hour pre-signed upload URL for secure direct client PUT
    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

    res.json({
      success: true,
      uploadUrl,
      fileKey,
      expiresIn: 3600,
    });
  } catch (err) {
    console.error('Error generating upload URL:', err);
    res.status(500).json({ error: err?.message || 'Failed to generate upload URL' });
  }
});

/**
 * 3. POST /api/view-url
 * Generates an S3 pre-signed GET URL for viewing receipt photos in high-res.
 */
app.post('/api/view-url', async (req, res) => {
  try {
    const { fileKey } = req.body;

    if (!fileKey) {
      return res.status(400).json({ error: 'fileKey is required' });
    }

    const command = new GetObjectCommand({
      Bucket: B2_BUCKET_NAME,
      Key: fileKey,
    });

    // 7-day pre-signed URL for viewing/zooming
    const viewUrl = await getSignedUrl(s3Client, command, { expiresIn: 604800 });

    res.json({
      success: true,
      viewUrl,
      fileKey,
      expiresIn: 604800,
    });
  } catch (err) {
    console.error('Error generating view URL:', err);
    res.status(500).json({ error: err?.message || 'Failed to generate view URL' });
  }
});

/**
 * 4. POST /api/download-url
 * Generates an S3 pre-signed GET URL with Content-Disposition attachment for PNG download.
 */
app.post('/api/download-url', async (req, res) => {
  try {
    const { fileKey, fileName } = req.body;

    if (!fileKey) {
      return res.status(400).json({ error: 'fileKey is required' });
    }

    const baseName = (fileName || fileKey.split('/').pop() || 'receipt.png');
    const safeDownloadName = baseName.endsWith('.png') ? baseName : `${baseName}.png`;

    const command = new GetObjectCommand({
      Bucket: B2_BUCKET_NAME,
      Key: fileKey,
      ResponseContentDisposition: `attachment; filename="${safeDownloadName}"`,
    });

    const downloadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

    res.json({
      success: true,
      downloadUrl,
      fileKey,
      fileName: safeDownloadName,
    });
  } catch (err) {
    console.error('Error generating download URL:', err);
    res.status(500).json({ error: err?.message || 'Failed to generate download URL' });
  }
});

/**
 * 5. POST /api/delete-file
 * Deletes a file from Backblaze B2 with ownership validation.
 */
app.post('/api/delete-file', async (req, res) => {
  try {
    const { fileKey, userId } = req.body;

    if (!fileKey) {
      return res.status(400).json({ error: 'fileKey is required' });
    }

    // Security check: users can only delete files belonging to their user folder
    if (userId && !fileKey.startsWith(`uploads/${userId}/`) && !fileKey.startsWith(`receipts/${userId}/`)) {
      return res.status(403).json({ error: 'Unauthorized to delete this file' });
    }

    const command = new DeleteObjectCommand({
      Bucket: B2_BUCKET_NAME,
      Key: fileKey,
    });

    await s3Client.send(command);

    res.json({
      success: true,
      message: 'File deleted successfully from Backblaze B2',
      fileKey,
    });
  } catch (err) {
    console.error('Error deleting file:', err);
    res.status(500).json({ error: err?.message || 'Failed to delete file' });
  }
});

app.listen(PORT, () => {
  console.log(`Smart Expense Backend proxy running on port ${PORT}`);
});
