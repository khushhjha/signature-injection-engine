# Signature Injection Engine - Backend

Node.js API server for PDF signature injection with coordinate conversion and audit trail.

## 🔧 Live API
**Backend**: [https://signature-injection-backend.onrender.com](https://signature-injection-backend.onrender.com)

## Features
- PDF signature injection using pdf-lib
- Coordinate system conversion (CSS pixels → PDF points)
- Aspect ratio preservation for signatures
- SHA-256 hashing for audit trail
- MongoDB integration for document history

## Tech Stack
- Node.js + Express
- pdf-lib for PDF manipulation
- MongoDB for audit storage
- Crypto for SHA-256 hashing

## API Endpoints
- `POST /sign-pdf` - Sign PDF with signature
- `GET /audit/:pdfId` - Get document audit trail
- `GET /` - Health check

## Local Setup
```bash
npm install
npm start
```

## Coordinate Conversion
```javascript
// Convert browser coordinates to PDF space
const pdfY = pdfHeight - (screenY / containerHeight) * pdfHeight;
```

## Frontend App
**Frontend**: [https://signature-injection-frontend.vercel.app](https://signature-injection-frontend.vercel.app)