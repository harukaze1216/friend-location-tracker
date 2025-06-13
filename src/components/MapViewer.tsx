import React, { useState, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Location, MapPoint } from '../types';

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@4.8.69/build/pdf.worker.min.js`;

interface MapViewerProps {
  pdfFile: File | null;
  pdfUrl?: string;
  locations: Location[];
  onMapClick: (point: MapPoint) => void;
}

const MapViewer: React.FC<MapViewerProps> = ({ pdfFile, pdfUrl, locations, onMapClick }) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const containerRef = useRef<HTMLDivElement>(null);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = (event.clientX - rect.left) / scale;
    const y = (event.clientY - rect.top) / scale;
    
    onMapClick({ x, y });
  };

  const renderLocationMarkers = () => {
    return locations.map((location) => (
      <div
        key={location.id}
        className="absolute bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs cursor-pointer"
        style={{
          left: `${location.x * scale}px`,
          top: `${location.y * scale}px`,
          transform: 'translate(-50%, -50%)'
        }}
        title={`${location.friendName} - ${location.time}`}
      >
        {location.friendName.charAt(0)}
      </div>
    ));
  };

  return (
    <div className="w-full">
      <div className="mb-4 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setScale(s => Math.max(0.5, s - 0.1))}
            className="px-3 py-1 bg-blue-500 text-white rounded"
          >
            縮小
          </button>
          <span className="text-sm">{Math.round(scale * 100)}%</span>
          <button
            onClick={() => setScale(s => Math.min(2.0, s + 0.1))}
            className="px-3 py-1 bg-blue-500 text-white rounded"
          >
            拡大
          </button>
        </div>
        
        {numPages > 1 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPageNumber(p => Math.max(1, p - 1))}
              disabled={pageNumber <= 1}
              className="px-3 py-1 bg-gray-500 text-white rounded disabled:opacity-50"
            >
              前
            </button>
            <span className="text-sm">
              {pageNumber} / {numPages}
            </span>
            <button
              onClick={() => setPageNumber(p => Math.min(numPages, p + 1))}
              disabled={pageNumber >= numPages}
              className="px-3 py-1 bg-gray-500 text-white rounded disabled:opacity-50"
            >
              次
            </button>
          </div>
        )}
      </div>

      <div 
        ref={containerRef}
        className="relative border border-gray-300 overflow-auto max-h-96"
        onClick={handleCanvasClick}
        style={{ cursor: 'crosshair' }}
      >
        {(pdfFile || pdfUrl) && (
          <Document
            file={pdfFile || pdfUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={(error) => {
              console.error('PDF Load Error:', error);
              console.log('Trying to load:', pdfFile || pdfUrl);
            }}
            loading={<div className="p-4">PDF読み込み中...</div>}
            error={
              <div className="p-4 text-red-500">
                <p>PDFの読み込みに失敗しました</p>
                <p className="text-sm">URL: {pdfUrl}</p>
                <p className="text-sm">ブラウザのコンソールでエラー詳細を確認してください</p>
              </div>
            }
            options={{
              cMapUrl: 'https://unpkg.com/pdfjs-dist@4.8.69/cmaps/',
              cMapPacked: true,
              standardFontDataUrl: 'https://unpkg.com/pdfjs-dist@4.8.69/standard_fonts/',
            }}
          >
            <Page 
              pageNumber={pageNumber} 
              scale={scale}
              renderTextLayer={false}
              renderAnnotationLayer={false}
            />
          </Document>
        )}
        {renderLocationMarkers()}
      </div>
    </div>
  );
};

export default MapViewer;