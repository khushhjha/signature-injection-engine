# Signature Injection Engine

A prototype system that bridges the gap between web browsers (CSS pixels, top-left origin) and PDF files (points, bottom-left origin) for precise signature placement.

## 🚀 Live Demo

**Frontend**: [https://signature-injection-frontend.vercel.app](https://signature-injection-frontend.vercel.app)

**Backend API**: [https://signature-injection-backend.onrender.com](https://signature-injection-backend.onrender.com)

**Database**: MongoDB Atlas

## Key Features

- **Responsive PDF Editor**: Drag & drop fields (text, signature, image, date, radio) onto PDF
- **Coordinate Conversion**: Automatic conversion between browser and PDF coordinate systems
- **Aspect Ratio Preservation**: Signatures are contained within boxes without distortion
- **Audit Trail**: SHA-256 hashing for document integrity tracking
- **Cross-Device Consistency**: Fields stay anchored to correct PDF locations across screen sizes

## Architecture

### Frontend (React + PDF.js)
- PDF rendering with react-pdf
- Drag & drop field placement
- Real-time coordinate conversion
- Responsive design for mobile/desktop

### Backend (Node.js + pdf-lib)
- PDF manipulation and signature injection
- Coordinate system conversion (CSS pixels → PDF points)
- MongoDB audit trail with document hashes
- Aspect ratio preservation algorithm

## Coordinate Conversion Logic

The core challenge is converting between coordinate systems:

```javascript
// Browser to PDF conversion
const pdfX = (screenX / containerWidth) * pdfWidth;
const pdfY = pdfHeight - (screenY / containerHeight) * pdfHeight; // Flip Y-axis

// PDF to Browser conversion  
const screenX = (pdfX / pdfWidth) * containerWidth;
const screenY = ((pdfHeight - pdfY) / pdfHeight) * containerHeight; // Flip Y-axis
```

## Setup

### Prerequisites
- Node.js 16+
- MongoDB (local or cloud)

### Installation

1. **Frontend Setup**:
```bash
cd frontend
npm install
npm start
```

2. **Backend Setup**:
```bash
cd backend
npm install
npm start
```

3. **MongoDB**: Ensure MongoDB is running on localhost:27017

## Usage

1. Open http://localhost:3000
2. Drag field types onto the PDF
3. Draw signature in the signature field
4. Click "Sign Document" to generate signed PDF
5. View audit trail at `/audit/{pdfId}`

## Technical Highlights

- **Responsive Anchoring**: Fields maintain position relative to PDF content across screen sizes
- **Aspect Ratio Math**: Images are scaled to fit within bounds while preserving proportions
- **Security**: SHA-256 hashing creates tamper-evident audit trail
- **Performance**: Minimal dependencies and efficient coordinate calculations

## Live Demo

🚀 **Frontend**: [https://signature-injection-frontend.vercel.app](https://signature-injection-frontend.vercel.app)

🔧 **Backend API**: [https://signature-injection-backend.onrender.com](https://signature-injection-backend.onrender.com)

📊 **Database**: MongoDB Atlas

## Deployment

- Frontend: Deploy to Vercel/Netlify from `/frontend` folder
- Backend: Deploy to Render/Railway from `/backend` folder
- Database: MongoDB Atlas for production