const express = require('express');
const multer = require('multer');
const { PDFDocument } = require('pdf-lib');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 4001;

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit for PDFs
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF files are allowed.'));
    }
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'pdf-service', timestamp: new Date().toISOString() });
});

// Merge PDFs endpoint
app.post('/merge-pdf', upload.array('files', 20), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No PDF files provided' });
    }

    if (req.files.length < 2) {
      return res.status(400).json({ error: 'At least 2 PDF files are required for merging' });
    }

    console.log(`[PDF-SERVICE] Merging ${req.files.length} PDF files`);

    // Create a new PDF document
    const mergedPdf = await PDFDocument.create();

    // Process each uploaded PDF
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      console.log(`[PDF-SERVICE] Processing file ${i + 1}/${req.files.length}: ${file.originalname} (${(file.size / 1024).toFixed(2)} KB)`);

      try {
        // Load the PDF
        const pdfDoc = await PDFDocument.load(file.buffer);
        
        // Copy all pages from this PDF to the merged PDF
        const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
        
        copiedPages.forEach((page) => {
          mergedPdf.addPage(page);
        });

        console.log(`[PDF-SERVICE] Added ${copiedPages.length} pages from ${file.originalname}`);
      } catch (error) {
        console.error(`[PDF-SERVICE] Error processing ${file.originalname}:`, error.message);
        return res.status(400).json({ 
          error: `Failed to process ${file.originalname}`, 
          details: 'File may be corrupted or password-protected' 
        });
      }
    }

    // Save the merged PDF
    const mergedPdfBytes = await mergedPdf.save();
    const totalPages = mergedPdf.getPageCount();

    console.log(`[PDF-SERVICE] Merge complete. Total pages: ${totalPages}, Size: ${(mergedPdfBytes.length / 1024).toFixed(2)} KB`);

    // Set response headers
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="merged.pdf"',
      'Content-Length': mergedPdfBytes.length,
      'X-Total-Pages': totalPages,
      'X-Source-Files': req.files.length
    });

    res.send(Buffer.from(mergedPdfBytes));
  } catch (error) {
    console.error('[PDF-SERVICE] Error merging PDFs:', error);
    res.status(500).json({ 
      error: 'Failed to merge PDFs', 
      details: error.message 
    });
  }
});

// Split PDF endpoint
app.post('/split-pdf', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file provided' });
    }

    const pageRanges = req.body.pageRanges; // Format: "1-3,5,7-9"
    
    if (!pageRanges) {
      return res.status(400).json({ 
        error: 'Page ranges required. Format: "1-3,5,7-9"' 
      });
    }

    console.log(`[PDF-SERVICE] Splitting PDF: ${req.file.originalname}, Ranges: ${pageRanges}`);

    // Load the source PDF
    const sourcePdf = await PDFDocument.load(req.file.buffer);
    const totalPages = sourcePdf.getPageCount();

    console.log(`[PDF-SERVICE] Source PDF has ${totalPages} pages`);

    // Parse page ranges
    const pageNumbers = parsePageRanges(pageRanges, totalPages);
    
    if (pageNumbers.length === 0) {
      return res.status(400).json({ error: 'No valid pages specified' });
    }

    console.log(`[PDF-SERVICE] Extracting ${pageNumbers.length} pages: ${pageNumbers.join(', ')}`);

    // Create new PDF with selected pages
    const newPdf = await PDFDocument.create();
    
    for (const pageNum of pageNumbers) {
      const [copiedPage] = await newPdf.copyPages(sourcePdf, [pageNum - 1]); // pdf-lib uses 0-based index
      newPdf.addPage(copiedPage);
    }

    // Save the split PDF
    const splitPdfBytes = await newPdf.save();

    console.log(`[PDF-SERVICE] Split complete. Output pages: ${pageNumbers.length}, Size: ${(splitPdfBytes.length / 1024).toFixed(2)} KB`);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="split-pages-${pageRanges.replace(/,/g, '_')}.pdf"`,
      'Content-Length': splitPdfBytes.length,
      'X-Total-Pages': pageNumbers.length,
      'X-Source-Pages': totalPages
    });

    res.send(Buffer.from(splitPdfBytes));
  } catch (error) {
    console.error('[PDF-SERVICE] Error splitting PDF:', error);
    res.status(500).json({ 
      error: 'Failed to split PDF', 
      details: error.message 
    });
  }
});

// Get PDF info endpoint
app.post('/pdf-info', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file provided' });
    }

    console.log(`[PDF-SERVICE] Getting info for: ${req.file.originalname}`);

    const pdfDoc = await PDFDocument.load(req.file.buffer);
    const pageCount = pdfDoc.getPageCount();
    const title = pdfDoc.getTitle() || 'Untitled';
    const author = pdfDoc.getAuthor() || 'Unknown';
    const subject = pdfDoc.getSubject() || 'N/A';
    const creator = pdfDoc.getCreator() || 'Unknown';
    const producer = pdfDoc.getProducer() || 'Unknown';

    // Get page dimensions for first page
    const firstPage = pdfDoc.getPage(0);
    const { width, height } = firstPage.getSize();

    const info = {
      filename: req.file.originalname,
      fileSize: req.file.size,
      fileSizeKB: (req.file.size / 1024).toFixed(2),
      pageCount,
      title,
      author,
      subject,
      creator,
      producer,
      pageSize: {
        width: Math.round(width),
        height: Math.round(height),
        unit: 'points'
      }
    };

    console.log(`[PDF-SERVICE] PDF Info: ${pageCount} pages, ${(req.file.size / 1024).toFixed(2)} KB`);

    res.json(info);
  } catch (error) {
    console.error('[PDF-SERVICE] Error getting PDF info:', error);
    res.status(500).json({ 
      error: 'Failed to get PDF information', 
      details: error.message 
    });
  }
});

// Helper function to parse page ranges
function parsePageRanges(rangesStr, maxPages) {
  const pageNumbers = new Set();
  const ranges = rangesStr.split(',');

  for (const range of ranges) {
    const trimmed = range.trim();
    
    if (trimmed.includes('-')) {
      // Range like "1-5"
      const [start, end] = trimmed.split('-').map(n => parseInt(n.trim()));
      
      if (isNaN(start) || isNaN(end)) continue;
      if (start < 1 || end > maxPages) continue;
      if (start > end) continue;
      
      for (let i = start; i <= end; i++) {
        pageNumbers.add(i);
      }
    } else {
      // Single page like "3"
      const page = parseInt(trimmed);
      
      if (isNaN(page)) continue;
      if (page < 1 || page > maxPages) continue;
      
      pageNumbers.add(page);
    }
  }

  return Array.from(pageNumbers).sort((a, b) => a - b);
}

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File size exceeds 100MB limit' });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ error: 'Too many files. Maximum 20 files allowed.' });
    }
    return res.status(400).json({ error: error.message });
  }
  
  res.status(500).json({ error: error.message });
});

// Start server
app.listen(PORT, () => {
  console.log(`[PDF-SERVICE] Server running on port ${PORT}`);
  console.log(`[PDF-SERVICE] Health check: http://localhost:${PORT}/health`);
});
