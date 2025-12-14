const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { PDFDocument, rgb } = require('pdf-lib');
const { MongoClient } = require('mongodb');

const app = express();
const PORT = 3002;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use('/signed', express.static(path.join(__dirname, 'signed')));

// Health check route
app.get('/', (req, res) => {
  res.json({ status: 'Signature Injection Engine Backend Running', port: PORT });
});

// MongoDB connection
const MONGO_URI = 'mongodb://localhost:27017';
const DB_NAME = 'signature_engine';
let db;

MongoClient.connect(MONGO_URI)
  .then(client => {
    console.log('Connected to MongoDB');
    db = client.db(DB_NAME);
  })
  .catch(error => console.error('MongoDB connection failed:', error));

// Ensure signed directory exists
const signedDir = path.join(__dirname, 'signed');
if (!fs.existsSync(signedDir)) {
  fs.mkdirSync(signedDir);
}

// Calculate SHA-256 hash
const calculateHash = (buffer) => {
  return crypto.createHash('sha256').update(buffer).digest('hex');
};

// Convert base64 image to buffer with aspect ratio preservation
const processSignatureImage = (base64Image, targetWidth, targetHeight) => {
  // Remove data URL prefix
  const base64Data = base64Image.replace(/^data:image\/[a-z]+;base64,/, '');
  return Buffer.from(base64Data, 'base64');
};

app.post('/sign-pdf', async (req, res) => {
  try {
    const { pdfId, signatureImage, coordinates } = req.body;

    if (!signatureImage || !coordinates) {
      return res.status(400).json({ error: 'Missing signature or coordinates' });
    }

    // Load original PDF
    const originalPdfPath = path.join(__dirname, '../frontend/public/sample.pdf');
    const originalPdfBytes = fs.readFileSync(originalPdfPath);
    
    // Calculate original PDF hash
    const originalHash = calculateHash(originalPdfBytes);

    // Load PDF document
    const pdfDoc = await PDFDocument.load(originalPdfBytes);
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];

    // Process signature image
    const signatureBuffer = processSignatureImage(signatureImage, coordinates.width, coordinates.height);
    
    // Embed signature image
    const signatureImg = await pdfDoc.embedPng(signatureBuffer);
    
    // Calculate dimensions to maintain aspect ratio
    const imgDims = signatureImg.scale(1);
    const aspectRatio = imgDims.width / imgDims.height;
    const targetAspectRatio = coordinates.width / coordinates.height;
    
    let finalWidth = coordinates.width;
    let finalHeight = coordinates.height;
    let offsetX = 0;
    let offsetY = 0;

    // Maintain aspect ratio - fit image within the box
    if (aspectRatio > targetAspectRatio) {
      // Image is wider - fit to width
      finalHeight = coordinates.width / aspectRatio;
      offsetY = (coordinates.height - finalHeight) / 2;
    } else {
      // Image is taller - fit to height  
      finalWidth = coordinates.height * aspectRatio;
      offsetX = (coordinates.width - finalWidth) / 2;
    }

    // Draw signature on PDF (coordinates are already converted to PDF space)
    firstPage.drawImage(signatureImg, {
      x: coordinates.x + offsetX,
      y: coordinates.y + offsetY,
      width: finalWidth,
      height: finalHeight,
    });

    // Save signed PDF
    const signedPdfBytes = await pdfDoc.save();
    const signedHash = calculateHash(Buffer.from(signedPdfBytes));
    
    // Generate unique filename
    const timestamp = Date.now();
    const signedFilename = `signed_${pdfId}_${timestamp}.pdf`;
    const signedPath = path.join(signedDir, signedFilename);
    
    fs.writeFileSync(signedPath, signedPdfBytes);

    // Store audit trail in MongoDB
    if (db) {
      await db.collection('audit_trail').insertOne({
        pdfId,
        originalHash,
        signedHash,
        signedAt: new Date(),
        coordinates,
        signedFilename
      });
    }

    res.json({
      success: true,
      signedPdfUrl: `http://localhost:${PORT}/signed/${signedFilename}`,
      originalHash,
      signedHash
    });

  } catch (error) {
    console.error('Signing error:', error);
    res.status(500).json({ error: 'Failed to sign PDF' });
  }
});

app.get('/audit/:pdfId', async (req, res) => {
  try {
    if (!db) {
      return res.status(500).json({ error: 'Database not connected' });
    }

    const auditRecords = await db.collection('audit_trail')
      .find({ pdfId: req.params.pdfId })
      .sort({ signedAt: -1 })
      .toArray();

    res.json(auditRecords);
  } catch (error) {
    console.error('Audit retrieval error:', error);
    res.status(500).json({ error: 'Failed to retrieve audit trail' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});