const express = require('express');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 4000;

// Service URLs (Docker network names used in production)
const PDF_SERVICE_URL = process.env.PDF_SERVICE_URL || 'http://pdf-service:4001';
const IMAGE_SERVICE_URL = process.env.IMAGE_SERVICE_URL || 'http://image-service:4002';

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  }
});

// Middleware
app.use(cors({
  origin: '*', // In production, configure specific origins
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'api-gateway', 
    timestamp: new Date().toISOString(),
    upstreamServices: {
      pdfService: PDF_SERVICE_URL,
      imageService: IMAGE_SERVICE_URL
    }
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'PDF/Image Processing API Gateway',
    version: '1.0.0',
    endpoints: {
      pdf: {
        merge: 'POST /api/process/merge-pdf',
        split: 'POST /api/process/split-pdf',
        info: 'POST /api/process/pdf-info',
        imagesToPdf: 'POST /api/process/images-to-pdf',
        compress: 'POST /api/process/compress-pdf'
      },
      image: {
        compress: 'POST /api/process/compress-image',
        resize: 'POST /api/process/resize-image',
        convert: 'POST /api/process/convert-image'
      }
    }
  });
});

// ============================================
// PDF ENDPOINTS
// ============================================

// Merge PDFs
app.post('/api/process/merge-pdf', upload.array('files', 20), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files provided' });
    }

    console.log(`[GATEWAY] Forwarding merge request for ${req.files.length} files to PDF service`);

    // Create FormData to forward to PDF service
    const formData = new FormData();
    
    req.files.forEach((file) => {
      formData.append('files', file.buffer, {
        filename: file.originalname,
        contentType: file.mimetype
      });
    });

    // Forward request to PDF service
    const response = await axios.post(`${PDF_SERVICE_URL}/merge-pdf`, formData, {
      headers: formData.getHeaders(),
      responseType: 'arraybuffer',
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });

    // Forward response headers
    res.set({
      'Content-Type': response.headers['content-type'],
      'Content-Disposition': response.headers['content-disposition'],
      'X-Total-Pages': response.headers['x-total-pages'],
      'X-Source-Files': response.headers['x-source-files']
    });

    console.log(`[GATEWAY] Merge successful, returning ${response.data.length} bytes`);
    res.send(response.data);
  } catch (error) {
    handleServiceError(error, 'PDF merge', res);
  }
});

// Split PDF
app.post('/api/process/split-pdf', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const pageRanges = req.body.pageRanges;
    
    if (!pageRanges) {
      return res.status(400).json({ error: 'Page ranges required' });
    }

    console.log(`[GATEWAY] Forwarding split request to PDF service (ranges: ${pageRanges})`);

    const formData = new FormData();
    formData.append('file', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype
    });
    formData.append('pageRanges', pageRanges);

    const response = await axios.post(`${PDF_SERVICE_URL}/split-pdf`, formData, {
      headers: formData.getHeaders(),
      responseType: 'arraybuffer',
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });

    res.set({
      'Content-Type': response.headers['content-type'],
      'Content-Disposition': response.headers['content-disposition'],
      'X-Total-Pages': response.headers['x-total-pages'],
      'X-Source-Pages': response.headers['x-source-pages']
    });

    console.log(`[GATEWAY] Split successful, returning ${response.data.length} bytes`);
    res.send(response.data);
  } catch (error) {
    handleServiceError(error, 'PDF split', res);
  }
});

// PDF Info
app.post('/api/process/pdf-info', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    console.log(`[GATEWAY] Forwarding PDF info request to PDF service`);

    const formData = new FormData();
    formData.append('file', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype
    });

    const response = await axios.post(`${PDF_SERVICE_URL}/pdf-info`, formData, {
      headers: formData.getHeaders()
    });

    console.log(`[GATEWAY] PDF info retrieved successfully`);
    res.json(response.data);
  } catch (error) {
    handleServiceError(error, 'PDF info', res);
  }
});

// Images to PDF
app.post('/api/process/images-to-pdf', upload.array('images', 50), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No image files provided' });
    }

    console.log(`[GATEWAY] Forwarding images-to-pdf request for ${req.files.length} images to PDF service`);

    const formData = new FormData();
    
    req.files.forEach((file) => {
      formData.append('images', file.buffer, {
        filename: file.originalname,
        contentType: file.mimetype
      });
    });

    const response = await axios.post(`${PDF_SERVICE_URL}/images-to-pdf`, formData, {
      headers: formData.getHeaders(),
      responseType: 'arraybuffer',
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });

    res.set({
      'Content-Type': response.headers['content-type'],
      'Content-Disposition': response.headers['content-disposition'],
      'X-Total-Pages': response.headers['x-total-pages'],
      'X-Source-Images': response.headers['x-source-images']
    });

    console.log(`[GATEWAY] Images to PDF successful, returning ${response.data.length} bytes`);
    res.send(response.data);
  } catch (error) {
    handleServiceError(error, 'Images to PDF', res);
  }
});

// Compress PDF
app.post('/api/process/compress-pdf', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file provided' });
    }

    console.log(`[GATEWAY] Forwarding compress-pdf request to PDF service`);

    const formData = new FormData();
    formData.append('file', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype
    });

    const response = await axios.post(`${PDF_SERVICE_URL}/compress-pdf`, formData, {
      headers: formData.getHeaders(),
      responseType: 'arraybuffer',
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });

    res.set({
      'Content-Type': response.headers['content-type'],
      'Content-Disposition': response.headers['content-disposition'],
      'X-Original-Size': response.headers['x-original-size'],
      'X-Compressed-Size': response.headers['x-compressed-size'],
      'X-Compression-Ratio': response.headers['x-compression-ratio'],
      'X-Total-Pages': response.headers['x-total-pages']
    });

    console.log(`[GATEWAY] PDF compression successful, ${response.headers['x-compression-ratio']}% reduction`);
    res.send(response.data);
  } catch (error) {
    handleServiceError(error, 'PDF compression', res);
  }
});

// ============================================
// IMAGE ENDPOINTS
// ============================================

// Compress Image
app.post('/api/process/compress-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const quality = req.body.quality || 80;

    console.log(`[GATEWAY] Forwarding image compression request to Image service (quality: ${quality}%)`);

    const formData = new FormData();
    formData.append('image', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype
    });
    formData.append('quality', quality);

    const response = await axios.post(`${IMAGE_SERVICE_URL}/compress-image`, formData, {
      headers: formData.getHeaders(),
      responseType: 'arraybuffer',
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });

    res.set({
      'Content-Type': response.headers['content-type'],
      'Content-Disposition': response.headers['content-disposition'],
      'X-Original-Size': response.headers['x-original-size'],
      'X-Compressed-Size': response.headers['x-compressed-size'],
      'X-Compression-Ratio': response.headers['x-compression-ratio']
    });

    console.log(`[GATEWAY] Compression successful, ${response.headers['x-compression-ratio']}% reduction`);
    res.send(response.data);
  } catch (error) {
    handleServiceError(error, 'Image compression', res);
  }
});

// Resize Image
app.post('/api/process/resize-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const { width, height, quality = 90 } = req.body;

    console.log(`[GATEWAY] Forwarding image resize request to Image service (${width}x${height})`);

    const formData = new FormData();
    formData.append('image', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype
    });
    if (width) formData.append('width', width);
    if (height) formData.append('height', height);
    formData.append('quality', quality);

    const response = await axios.post(`${IMAGE_SERVICE_URL}/resize-image`, formData, {
      headers: formData.getHeaders(),
      responseType: 'arraybuffer',
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });

    res.set({
      'Content-Type': response.headers['content-type'],
      'Content-Disposition': response.headers['content-disposition']
    });

    console.log(`[GATEWAY] Resize successful`);
    res.send(response.data);
  } catch (error) {
    handleServiceError(error, 'Image resize', res);
  }
});

// Convert Image Format
app.post('/api/process/convert-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const { format = 'jpeg', quality = 90 } = req.body;

    console.log(`[GATEWAY] Forwarding image conversion request to Image service (format: ${format})`);

    const formData = new FormData();
    formData.append('image', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype
    });
    formData.append('format', format);
    formData.append('quality', quality);

    const response = await axios.post(`${IMAGE_SERVICE_URL}/convert-image`, formData, {
      headers: formData.getHeaders(),
      responseType: 'arraybuffer',
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });

    res.set({
      'Content-Type': response.headers['content-type'],
      'Content-Disposition': response.headers['content-disposition']
    });

    console.log(`[GATEWAY] Conversion successful`);
    res.send(response.data);
  } catch (error) {
    handleServiceError(error, 'Image conversion', res);
  }
});

// ============================================
// ERROR HANDLING
// ============================================

function handleServiceError(error, operation, res) {
  console.error(`[GATEWAY] ${operation} error:`, error.message);
  
  if (error.response) {
    // The service responded with an error
    const status = error.response.status;
    const data = error.response.data;
    
    let errorMessage = `${operation} failed`;
    
    // Try to parse error message from service
    if (data) {
      try {
        const errorObj = JSON.parse(data.toString());
        errorMessage = errorObj.error || errorObj.message || errorMessage;
      } catch (e) {
        // Data is not JSON, use as-is
        errorMessage = data.toString() || errorMessage;
      }
    }
    
    return res.status(status).json({ 
      error: errorMessage,
      operation 
    });
  } else if (error.request) {
    // The request was made but no response was received
    return res.status(503).json({ 
      error: 'Service unavailable',
      operation,
      details: 'Unable to reach the processing service'
    });
  } else {
    // Something happened in setting up the request
    return res.status(500).json({ 
      error: 'Internal server error',
      operation,
      details: error.message
    });
  }
}

// Global error handler
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File size exceeds 100MB limit' });
    }
    return res.status(400).json({ error: error.message });
  }
  
  console.error('[GATEWAY] Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`[GATEWAY] API Gateway running on port ${PORT}`);
  console.log(`[GATEWAY] PDF Service: ${PDF_SERVICE_URL}`);
  console.log(`[GATEWAY] Image Service: ${IMAGE_SERVICE_URL}`);
  console.log(`[GATEWAY] Health check: http://localhost:${PORT}/health`);
});
