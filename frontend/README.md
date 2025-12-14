# Signature Injection Engine - Frontend

React-based PDF editor with drag & drop signature placement functionality.

## 🚀 Live Demo
**Frontend**: [https://signature-injection-frontend.vercel.app](https://signature-injection-frontend.vercel.app)

## Features
- PDF rendering with react-pdf
- Drag & drop field placement (text, signature, image, date, radio)
- Responsive coordinate conversion
- Canvas-based signature drawing
- Real-time field positioning

## Tech Stack
- React 18
- react-pdf (PDF.js)
- HTML5 Canvas
- CSS3

## Local Setup
```bash
npm install
npm start
```

## Coordinate Conversion Logic
```javascript
// Browser to PDF conversion
const pdfX = (screenX / containerWidth) * pdfWidth;
const pdfY = pdfHeight - (screenY / containerHeight) * pdfHeight;
```

## Backend API
**Backend**: [https://signature-injection-backend.onrender.com](https://signature-injection-backend.onrender.com)