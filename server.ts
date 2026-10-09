import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { b2Service } from './src/server/b2Service.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);

  // Parse JSON payloads up to 25MB for image receipt uploads & full backups
  app.use(express.json({ limit: '25mb' }));

  // ==========================================
  // Backblaze B2 API Endpoints
  // ==========================================

  // Check Backblaze B2 Connection Status & Health
  app.get('/api/b2/status', async (_req, res) => {
    try {
      const status = await b2Service.verifyConnection();
      res.json({
        success: status.connected,
        ...status,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        connected: false,
        error: err?.message || 'Error verifying Backblaze B2 connection',
      });
    }
  });

  // Upload File (Receipts, Images, Documents) to Backblaze B2
  app.post('/api/b2/upload', async (req, res) => {
    try {
      const { data, fileName, contentType, folder = 'receipts' } = req.body;

      if (!data) {
        return res.status(400).json({ success: false, error: 'File data is required' });
      }

      // Handle Base64 Data URL or raw base64 string
      let buffer: Buffer;
      let detectedContentType = contentType || 'application/octet-stream';

      if (typeof data === 'string' && data.startsWith('data:')) {
        const matches = data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          detectedContentType = matches[1];
          buffer = Buffer.from(matches[2], 'base64');
        } else {
          buffer = Buffer.from(data, 'base64');
        }
      } else if (typeof data === 'string') {
        buffer = Buffer.from(data, 'base64');
      } else {
        buffer = Buffer.from(data);
      }

      const safeName = (fileName || `receipt_${Date.now()}.jpg`).replace(/[^a-zA-Z0-9._-]/g, '_');
      const uniqueFileName = `${folder}/${Date.now()}_${safeName}`;

      const uploadResult = await b2Service.uploadFile({
        fileName: uniqueFileName,
        buffer,
        contentType: detectedContentType,
      });

      res.json({
        success: true,
        fileId: uploadResult.fileId,
        fileName: uploadResult.fileName,
        url: uploadResult.downloadUrl,
        size: uploadResult.contentLength,
      });
    } catch (err: any) {
      console.error('Error in /api/b2/upload:', err);
      res.status(500).json({
        success: false,
        error: err?.message || 'Failed to upload file to Backblaze B2',
      });
    }
  });

  // View receipt file inline in browser
  app.get('/api/b2/view', async (req, res) => {
    try {
      const file = req.query.file as string;
      if (!file) {
        return res.status(400).send('File parameter is required');
      }

      const { buffer, contentType } = await b2Service.downloadFileBuffer(file);
      res.setHeader('Content-Type', contentType || 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.send(buffer);
    } catch (err: any) {
      console.error('Error viewing file:', err);
      res.status(404).send('File not found in Backblaze B2');
    }
  });

  // Download receipt file as clean attachment with specified filename
  app.get('/api/b2/download', async (req, res) => {
    try {
      const file = req.query.file as string;
      const downloadName = (req.query.name as string) || path.basename(file || 'receipt.png');
      const safeName = downloadName.endsWith('.png') ? downloadName : `${downloadName}.png`;

      if (!file) {
        return res.status(400).send('File parameter is required');
      }

      const { buffer, contentType } = await b2Service.downloadFileBuffer(file);
      res.setHeader('Content-Type', contentType || 'image/png');
      res.setHeader('Content-Disposition', `attachment; filename="${safeName}"`);
      res.send(buffer);
    } catch (err: any) {
      console.error('Error downloading file:', err);
      res.status(404).send('File not found in Backblaze B2');
    }
  });

  // Upload Full Data Backup to Backblaze B2
  app.post('/api/b2/backup', async (req, res) => {
    try {
      const { payload, userId = 'default_user' } = req.body;

      if (!payload) {
        return res.status(400).json({ success: false, error: 'Backup payload is required' });
      }

      const jsonStr = typeof payload === 'string' ? payload : JSON.stringify(payload, null, 2);
      const buffer = Buffer.from(jsonStr, 'utf-8');
      const nowStr = new Date().toISOString().replace(/[:.]/g, '-');

      // 1. Save timestamped archive
      const archivePath = `backups/${userId}/${nowStr}_backup.json`;
      await b2Service.uploadFile({
        fileName: archivePath,
        buffer,
        contentType: 'application/json',
      });

      // 2. Save latest pointer
      const latestPath = `backups/${userId}/latest.json`;
      const latestResult = await b2Service.uploadFile({
        fileName: latestPath,
        buffer,
        contentType: 'application/json',
      });

      res.json({
        success: true,
        message: 'Application data backed up successfully to Backblaze B2',
        fileName: archivePath,
        url: latestResult.downloadUrl,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      console.error('Error in /api/b2/backup:', err);
      res.status(500).json({
        success: false,
        error: err?.message || 'Failed to backup data to Backblaze B2',
      });
    }
  });

  // Fetch Latest Cloud Backup from Backblaze B2
  app.get('/api/b2/backup/latest', async (req, res) => {
    try {
      const userId = (req.query.userId as string) || 'default_user';
      const latestPath = `backups/${userId}/latest.json`;

      const content = await b2Service.downloadFileText(latestPath);
      res.json({
        success: true,
        data: JSON.parse(content),
      });
    } catch (err: any) {
      console.error('Error in /api/b2/backup/latest:', err);
      res.status(404).json({
        success: false,
        error: err?.message || 'No cloud backup found on Backblaze B2',
      });
    }
  });

  // List Files in Backblaze B2
  app.get('/api/b2/files', async (req, res) => {
    try {
      const prefix = (req.query.prefix as string) || '';
      const files = await b2Service.listFiles(prefix);
      res.json({
        success: true,
        files,
      });
    } catch (err: any) {
      console.error('Error in /api/b2/files:', err);
      res.status(500).json({
        success: false,
        error: err?.message || 'Failed to list files from Backblaze B2',
      });
    }
  });

  // ==========================================
  // Vite Frontend Middleware / Static Hosting
  // ==========================================
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, host: '0.0.0.0', port: PORT },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Smart Expense Tracker server running on http://0.0.0.0:${PORT} [Backblaze B2: Smartexpense]`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
