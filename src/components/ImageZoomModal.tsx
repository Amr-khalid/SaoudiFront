'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Product } from '../types';
import { TranslationDictionary } from '../translations';

interface ImageZoomModalProps {
  product: Product | null;
  onClose: () => void;
  t: TranslationDictionary;
}

export const ImageZoomModal: React.FC<ImageZoomModalProps> = ({ product, onClose }) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1.25); // 1.25x (125%) default zoom
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (product) {
      setSelectedImage(product.image);
      setZoomLevel(1.25);
      setPosition({ x: 0, y: 0 });
    }
  }, [product]);

  // Keyboard shortcut handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!product) return;
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === '+' || e.key === '=') {
        handleZoomIn();
      } else if (e.key === '-') {
        handleZoomOut();
      } else if (e.key === '0') {
        handleReset();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [product, zoomLevel]);

  if (!product) return null;

  const allImages = [product.image, ...(product.secondaryImages || [])];

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.5, 5));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.5, 1));
  };

  const handleReset = () => {
    setZoomLevel(1);
    setPosition({ x: 0, y: 0 });
  };

  // Mouse pan handling
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col justify-between overflow-hidden select-none animate-fade-in">
      {/* Top Controls Bar */}
      <div className="p-4 md:px-8 bg-gradient-to-b from-black/90 to-transparent flex justify-between items-center z-20">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-[#D4AF37] text-2xl">zoom_in</span>
          <div>
            <h3 className="font-garamond text-lg md:text-xl text-[#E5E5E5] font-semibold leading-tight">
              {product.name}
            </h3>
            <p className="font-label-caps text-[11px] text-[#A3A3A3] tracking-widest uppercase">
              {product.category} • ${product.price.toLocaleString()} USD
            </p>
          </div>
        </div>

        {/* Toolbar Action Buttons */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Zoom Out */}
          <button
            onClick={handleZoomOut}
            disabled={zoomLevel <= 1}
            className="p-2.5 bg-[#141414] border border-[#333] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-[#0A0A0A] disabled:opacity-30 disabled:hover:bg-[#141414] disabled:hover:text-[#D4AF37] rounded-xs transition-all cursor-pointer"
            title="Zoom Out (-)"
          >
            <span className="material-symbols-outlined text-lg">zoom_out</span>
          </button>

          {/* Zoom Level Indicator */}
          <span className="px-3 py-1.5 bg-[#141414] border border-[#262626] font-mono text-xs text-[#D4AF37] font-bold rounded-xs">
            {Math.round(zoomLevel * 100)}%
          </span>

          {/* Zoom In */}
          <button
            onClick={handleZoomIn}
            disabled={zoomLevel >= 5}
            className="p-2.5 bg-[#141414] border border-[#333] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-[#0A0A0A] disabled:opacity-30 disabled:hover:bg-[#141414] disabled:hover:text-[#D4AF37] rounded-xs transition-all cursor-pointer"
            title="Zoom In (+)"
          >
            <span className="material-symbols-outlined text-lg">zoom_in</span>
          </button>

          {/* Reset */}
          <button
            onClick={handleReset}
            className="hidden sm:flex p-2.5 bg-[#141414] border border-[#333] text-[#A3A3A3] hover:text-[#D4AF37] hover:border-[#D4AF37]/50 rounded-xs text-xs font-label-caps uppercase tracking-wider items-center gap-1 cursor-pointer"
            title="Reset Zoom (0)"
          >
            <span className="material-symbols-outlined text-sm">restart_alt</span>
            <span>Reset</span>
          </button>

          <div className="w-[1px] h-6 bg-[#333] mx-1" />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="p-2.5 bg-[#D4AF37] text-[#0A0A0A] hover:bg-[#E5C158] rounded-xs font-bold transition-transform hover:scale-105 cursor-pointer flex items-center justify-center"
            title="Close (Esc)"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>
      </div>

      {/* Main Interactive Zoom Canvas */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className={`relative flex-1 w-full h-full flex items-center justify-center overflow-hidden p-4 ${
          zoomLevel > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'
        }`}
      >
        <div
          className="transition-transform duration-150 ease-out flex items-center justify-center w-[80vw] h-[70vh] relative"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${zoomLevel})`,
          }}
        >
          <Image
            src={selectedImage}
            alt={product.name}
            fill
            unoptimized
            className="object-contain drop-shadow-2xl rounded-xs pointer-events-none"
          />
        </div>

        {/* Pan Hint Overlay */}
        {zoomLevel > 1 && (
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-black/80 border border-[#D4AF37]/40 rounded-full text-xs text-[#D4AF37] font-label-caps uppercase tracking-widest backdrop-blur-md pointer-events-none flex items-center gap-2 animate-pulse">
            <span className="material-symbols-outlined text-sm">pan_tool</span>
            <span>Drag image to inspect details</span>
          </div>
        )}
      </div>

      {/* Bottom Thumbnails Carousel (if multiple images) */}
      <div className="p-4 bg-gradient-to-t from-black/90 to-transparent flex flex-col items-center gap-2 z-20">
        {allImages.length > 1 && (
          <div className="flex items-center gap-3 overflow-x-auto p-1 max-w-full">
            {allImages.map((img, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setSelectedImage(img);
                  setZoomLevel(2);
                  setPosition({ x: 0, y: 0 });
                }}
                className={`relative w-14 h-14 rounded-xs border overflow-hidden transition-all duration-300 cursor-pointer ${
                  selectedImage === img
                    ? 'border-[#D4AF37] ring-2 ring-[#D4AF37]/40 scale-105'
                    : 'border-[#333] opacity-60 hover:opacity-100 hover:border-[#D4AF37]/50'
                }`}
              >
                <Image src={img} alt={`View ${idx + 1}`} fill unoptimized className="object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
