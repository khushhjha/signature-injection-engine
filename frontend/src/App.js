import React, { useState, useRef, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import './App.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

const FIELD_TYPES = {
  TEXT: 'text',
  SIGNATURE: 'signature', 
  IMAGE: 'image',
  DATE: 'date',
  RADIO: 'radio'
};

const App = () => {
  const [pdfFile] = useState('/sample.pdf');
  const [numPages, setNumPages] = useState(null);
  const [pageNumber] = useState(1);
  const [fields, setFields] = useState([]);
  const [draggedField, setDraggedField] = useState(null);
  const [selectedField, setSelectedField] = useState(null);
  const [pdfDimensions, setPdfDimensions] = useState({ width: 0, height: 0 });
  const containerRef = useRef(null);

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  const onPageLoadSuccess = (page) => {
    const viewport = page.getViewport({ scale: 1 });
    setPdfDimensions({ width: viewport.width, height: viewport.height });
  };

  const handleDragStart = (fieldType) => {
    setDraggedField(fieldType);
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    if (!draggedField || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Convert screen coordinates to PDF coordinates (relative to PDF dimensions)
    const pdfX = (x / rect.width) * pdfDimensions.width;
    const pdfY = (y / rect.height) * pdfDimensions.height;

    const newField = {
      id: Date.now(),
      type: draggedField,
      x: pdfX,
      y: pdfY,
      width: 100,
      height: 30,
      value: ''
    };

    setFields(prev => [...prev, newField]);
    setDraggedField(null);
  }, [draggedField, pdfDimensions]);

  const handleFieldResize = (fieldId, newWidth, newHeight) => {
    setFields(prev => prev.map(field => 
      field.id === fieldId ? { ...field, width: newWidth, height: newHeight } : field
    ));
  };

  const handleFieldMove = (fieldId, newX, newY) => {
    setFields(prev => prev.map(field => 
      field.id === fieldId ? { ...field, x: newX, y: newY } : field
    ));
  };

  const signDocument = async () => {
    if (!fields.length) return;

    const signatureField = fields.find(f => f.type === FIELD_TYPES.SIGNATURE && f.value);
    if (!signatureField) {
      alert('Please add a signature');
      return;
    }

    const payload = {
      pdfId: 'sample',
      signatureImage: signatureField.value,
      coordinates: {
        x: signatureField.x,
        y: pdfDimensions.height - signatureField.y - signatureField.height, // Convert to PDF bottom-left origin
        width: signatureField.width,
        height: signatureField.height
      }
    };

    try {
      const response = await fetch('http://localhost:3002/sign-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const result = await response.json();
      if (result.signedPdfUrl) {
        window.open(result.signedPdfUrl, '_blank');
      }
    } catch (error) {
      console.error('Signing failed:', error);
    }
  };

  return (
    <div className="app">
      <div className="toolbar">
        <h2>Signature Injection Engine</h2>
        <div className="field-palette">
          {Object.values(FIELD_TYPES).map(type => (
            <div
              key={type}
              className="field-item"
              draggable
              onDragStart={() => handleDragStart(type)}
            >
              {type.toUpperCase()}
            </div>
          ))}
        </div>
        <button onClick={signDocument} className="sign-btn">Sign Document</button>
      </div>

      <div className="pdf-container">
        <div 
          ref={containerRef}
          className="pdf-viewer"
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
        >
          <Document file={pdfFile} onLoadSuccess={onDocumentLoadSuccess}>
            <Page 
              pageNumber={pageNumber} 
              onLoadSuccess={onPageLoadSuccess}
              renderTextLayer={false}
              renderAnnotationLayer={false}
            />
          </Document>

          {fields.map(field => (
            <FieldOverlay
              key={field.id}
              field={field}
              pdfDimensions={pdfDimensions}
              containerRef={containerRef}
              onResize={handleFieldResize}
              onMove={handleFieldMove}
              onSelect={setSelectedField}
              isSelected={selectedField === field.id}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

const FieldOverlay = ({ field, pdfDimensions, containerRef, onResize, onMove, onSelect, isSelected }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  const getScreenPosition = () => {
    if (!containerRef.current) return { left: 0, top: 0, width: 0, height: 0 };
    
    const rect = containerRef.current.getBoundingClientRect();
    return {
      left: (field.x / pdfDimensions.width) * rect.width,
      top: (field.y / pdfDimensions.height) * rect.height,
      width: (field.width / pdfDimensions.width) * rect.width,
      height: (field.height / pdfDimensions.height) * rect.height
    };
  };

  const position = getScreenPosition();

  const handleMouseDown = (e) => {
    e.preventDefault();
    onSelect(field.id);
    
    if (e.target.classList.contains('resize-handle')) {
      setIsResizing(true);
    } else {
      setIsDragging(true);
    }

    const startX = e.clientX;
    const startY = e.clientY;
    const startFieldX = field.x;
    const startFieldY = field.y;
    const startWidth = field.width;
    const startHeight = field.height;

    const handleMouseMove = (e) => {
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();

      if (isResizing) {
        const newWidth = Math.max(20, startWidth + (deltaX / rect.width) * pdfDimensions.width);
        const newHeight = Math.max(20, startHeight + (deltaY / rect.height) * pdfDimensions.height);
        onResize(field.id, newWidth, newHeight);
      } else if (isDragging) {
        const newX = startFieldX + (deltaX / rect.width) * pdfDimensions.width;
        const newY = startFieldY + (deltaY / rect.height) * pdfDimensions.height;
        onMove(field.id, newX, newY);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div
      className={`field-overlay ${field.type} ${isSelected ? 'selected' : ''}`}
      style={{
        position: 'absolute',
        left: position.left,
        top: position.top,
        width: position.width,
        height: position.height,
        border: '2px solid #007bff',
        backgroundColor: 'rgba(0, 123, 255, 0.1)',
        cursor: isDragging ? 'grabbing' : 'grab'
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="field-label">{field.type}</div>
      {field.type === 'signature' && (
        <SignatureInput field={field} />
      )}
      {isSelected && (
        <div 
          className="resize-handle"
          style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: 10,
            height: 10,
            backgroundColor: '#007bff',
            cursor: 'se-resize'
          }}
        />
      )}
    </div>
  );
};

const SignatureInput = ({ field }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const startDrawing = (e) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    field.value = canvas.toDataURL();
  };

  return (
    <canvas
      ref={canvasRef}
      width={200}
      height={60}
      style={{ width: '100%', height: '100%' }}
      onMouseDown={startDrawing}
      onMouseMove={draw}
      onMouseUp={stopDrawing}
      onMouseLeave={stopDrawing}
    />
  );
};

export default App;