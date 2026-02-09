const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 4002;

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.'));
    }
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'image-service', timestamp: new Date().toISOString() });
});

// Compress image endpoint
app.post('/compress-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const quality = parseInt(req.body.quality) || 80;
    
    if (quality < 1 || quality > 100) {
      return res.status(400).json({ error: 'Quality must be between 1 and 100' });
    }

    console.log(`[IMAGE-SERVICE] Compressing image: ${req.file.originalname} (${(req.file.size / 1024).toFixed(2)} KB) to ${quality}% quality`);

    // Get original image metadata
    const metadata = await sharp(req.file.buffer).metadata();
    
    // Compress the image based on format
    let compressedBuffer;
    
    switch (metadata.format) {
      case 'jpeg':
      case 'jpg':
        compressedBuffer = await sharp(req.file.buffer)
          .jpeg({ quality })
          .toBuffer();
        break;
      case 'png':
        compressedBuffer = await sharp(req.file.buffer)
          .png({ quality, compressionLevel: 9 })
          .toBuffer();
        break;
      case 'webp':
        compressedBuffer = await sharp(req.file.buffer)
          .webp({ quality })
          .toBuffer();
        break;
      case 'gif':
        // Convert GIF to PNG for compression (Sharp doesn't compress GIF)
        compressedBuffer = await sharp(req.file.buffer)
          .png({ quality, compressionLevel: 9 })
          .toBuffer();
        break;
      default:
        compressedBuffer = await sharp(req.file.buffer)
          .jpeg({ quality })
          .toBuffer();
    }

    const compressionRatio = ((1 - compressedBuffer.length / req.file.size) * 100).toFixed(2);
    console.log(`[IMAGE-SERVICE] Compression complete. New size: ${(compressedBuffer.length / 1024).toFixed(2)} KB (${compressionRatio}% reduction)`);

    // Set appropriate headers
    res.set({
      'Content-Type': req.file.mimetype,
      'Content-Disposition': `attachment; filename="compressed-${req.file.originalname}"`,
      'Content-Length': compressedBuffer.length,
      'X-Original-Size': req.file.size,
      'X-Compressed-Size': compressedBuffer.length,
      'X-Compression-Ratio': compressionRatio
    });

    res.send(compressedBuffer);
  } catch (error) {
    console.error('[IMAGE-SERVICE] Error compressing image:', error);
    res.status(500).json({ 
      error: 'Failed to compress image', 
      details: error.message 
    });
  }
});

// Resize image endpoint
app.post('/resize-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const width = parseInt(req.body.width);
    const height = parseInt(req.body.height);
    const quality = parseInt(req.body.quality) || 90;

    if (!width && !height) {
      return res.status(400).json({ error: 'Either width or height must be specified' });
    }

    console.log(`[IMAGE-SERVICE] Resizing image: ${req.file.originalname} to ${width}x${height}`);

    const metadata = await sharp(req.file.buffer).metadata();

    // Resize the image
    const resizedBuffer = await sharp(req.file.buffer)
      .resize(width || null, height || null, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality })
      .toBuffer();

    console.log(`[IMAGE-SERVICE] Resize complete. Original: ${metadata.width}x${metadata.height}, New size: ${(resizedBuffer.length / 1024).toFixed(2)} KB`);

    res.set({
      'Content-Type': 'image/jpeg',
      'Content-Disposition': `attachment; filename="resized-${req.file.originalname}"`,
      'Content-Length': resizedBuffer.length
    });

    res.send(resizedBuffer);
  } catch (error) {
    console.error('[IMAGE-SERVICE] Error resizing image:', error);
    res.status(500).json({ 
      error: 'Failed to resize image', 
      details: error.message 
    });
  }
});

// Convert image format endpoint
app.post('/convert-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const format = req.body.format || 'jpeg';
    const quality = parseInt(req.body.quality) || 90;
    const allowedFormats = ['jpeg', 'png', 'webp', 'avif'];

    if (!allowedFormats.includes(format)) {
      return res.status(400).json({ 
        error: `Invalid format. Allowed formats: ${allowedFormats.join(', ')}` 
      });
    }

    console.log(`[IMAGE-SERVICE] Converting image: ${req.file.originalname} to ${format}`);

    let convertedBuffer;
    let mimeType;

    switch (format) {
      case 'jpeg':
        convertedBuffer = await sharp(req.file.buffer).jpeg({ quality }).toBuffer();
        mimeType = 'image/jpeg';
        break;
      case 'png':
        convertedBuffer = await sharp(req.file.buffer).png({ quality }).toBuffer();
        mimeType = 'image/png';
        break;
      case 'webp':
        convertedBuffer = await sharp(req.file.buffer).webp({ quality }).toBuffer();
        mimeType = 'image/webp';
        break;
      case 'avif':
        convertedBuffer = await sharp(req.file.buffer).avif({ quality }).toBuffer();
        mimeType = 'image/avif';
        break;
    }

    const filenameWithoutExt = req.file.originalname.split('.').slice(0, -1).join('.');
    const newFilename = `${filenameWithoutExt}.${format}`;

    console.log(`[IMAGE-SERVICE] Conversion complete. New size: ${(convertedBuffer.length / 1024).toFixed(2)} KB`);

    res.set({
      'Content-Type': mimeType,
      'Content-Disposition': `attachment; filename="${newFilename}"`,
      'Content-Length': convertedBuffer.length
    });

    res.send(convertedBuffer);
  } catch (error) {
    console.error('[IMAGE-SERVICE] Error converting image:', error);
    res.status(500).json({ 
      error: 'Failed to convert image', 
      details: error.message 
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File size exceeds 50MB limit' });
    }
    return res.status(400).json({ error: error.message });
  }
  
  res.status(500).json({ error: error.message });
});

// Start server
app.listen(PORT, () => {
  console.log(`[IMAGE-SERVICE] Server running on port ${PORT}`);
  console.log(`[IMAGE-SERVICE] Health check: http://localhost:${PORT}/health`);
});
