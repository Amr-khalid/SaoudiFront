'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { useApp } from '../context/AppContext';

export const View360Modal: React.FC = () => {
  const { is360Open, setIs360Open, selectedProduct, lang } = useApp();

  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isAutoSpin, setIsAutoSpin] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFrameIndex, setSelectedFrameIndex] = useState<number | null>(null);

  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const initialPanRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const initialRotationRef = useRef<number>(0);

  const allProductFrames = selectedProduct
    ? [selectedProduct.image, ...(selectedProduct.secondaryImages || [])]
    : [];

  // Reset state whenever 360 modal opens or selectedProduct changes
  useEffect(() => {
    if (is360Open) {
      setRotation(0);
      setZoom(1);
      setPan({ x: 0, y: 0 });
      setIsAutoSpin(false);
      setSelectedFrameIndex(null);
    }
  }, [is360Open, selectedProduct]);

  // Auto-Spin Effect
  useEffect(() => {
    if (!isAutoSpin || !is360Open || isDragging) return;
    const interval = setInterval(() => {
      setRotation((prev) => (prev + 1.5) % 360);
    }, 30);
    return () => clearInterval(interval);
  }, [isAutoSpin, is360Open, isDragging]);

  // Mouse Wheel Zooming
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const zoomDelta = e.deltaY < 0 ? 0.25 : -0.25;
    setZoom((prev) => Math.min(4.5, Math.max(1, prev + zoomDelta)));
  };

  // Mouse Dragging (Rotate when 1x zoom, Pan when >1.2x zoom)
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    initialRotationRef.current = rotation;
    initialPanRef.current = { ...pan };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - dragStartRef.current.x;
      const deltaY = moveEvent.clientY - dragStartRef.current.y;

      if (zoom > 1.2) {
        setPan({
          x: initialPanRef.current.x + deltaX,
          y: initialPanRef.current.y + deltaY,
        });
      } else {
        setRotation((initialRotationRef.current + deltaX * 0.6) % 360);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Touch Dragging for Mobile
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length !== 1) return;
    setIsDragging(true);
    const touch = e.touches[0];
    dragStartRef.current = { x: touch.clientX, y: touch.clientY };
    initialRotationRef.current = rotation;
    initialPanRef.current = { ...pan };
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging || e.touches.length !== 1) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - dragStartRef.current.x;
    const deltaY = touch.clientY - dragStartRef.current.y;

    if (zoom > 1.2) {
      setPan({
        x: initialPanRef.current.x + deltaX,
        y: initialPanRef.current.y + deltaY,
      });
    } else {
      setRotation((initialRotationRef.current + deltaX * 0.8) % 360);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  if (!is360Open || !selectedProduct) return null;

  const currentAngle = Math.round((rotation % 360 + 360) % 360);

  // Dynamic Image Frame Calculation based on rotation angle or selected frame
  const activeFrameIndex = selectedFrameIndex !== null
    ? selectedFrameIndex
    : Math.floor((currentAngle / 360) * allProductFrames.length) % allProductFrames.length;

  const currentDisplayImage = allProductFrames[activeFrameIndex] || selectedProduct.image;

  return (
    <div className="fixed inset-0 z-50 bg-[#0B0B0B]/90 backdrop-blur-xl flex items-center justify-center p-4">
      <div className="relative max-w-4xl w-full bg-[#121414] border border-[#D4AF37] rounded-xs overflow-hidden p-6 md:p-8 shadow-2xl flex flex-col items-center space-y-5 animate-fade-up">
        {/* Close Button */}
        <button
          onClick={() => setIs360Open(false)}
          className="absolute top-4 right-4 rtl:right-auto rtl:left-4 z-20 p-2.5 text-[#D4AF37] bg-[#141414]/90 rounded-full hover:bg-[#D4AF37] hover:text-[#0A0A0A] transition-colors cursor-pointer border border-[#D4AF37]/40 shadow-lg"
          title="Close 360 Viewer"
        >
          <span className="material-symbols-outlined text-2xl">close</span>
        </button>

        {/* Studio Header */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center space-x-2 rtl:space-x-reverse text-[#D4AF37] px-3 py-1 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-full mb-1">
            <span className="material-symbols-outlined text-base animate-spin-slow">360</span>
            <span className="font-label-caps text-[11px] uppercase tracking-widest font-bold">
              360° ATELIER STUDIO VIEWER
            </span>
          </div>
          <h3 className="font-headline-lg text-2xl md:text-3xl font-garamond text-[#E5E5E5]">
            {selectedProduct.name}
          </h3>
          <p className="font-body-md text-xs text-[#A3A3A3]">
            {lang === 'ar'
              ? 'تدوير 360 درجة ثلاثي الأبعاد للمنتج المختار. اسحب أفقياً أو استخدم التدوير التلقائي.'
              : 'Interactive 360° Studio view for selected product. Click & drag horizontally to inspect from all angles.'}
          </p>
        </div>

        {/* 360 Interactive Canvas Viewport */}
        <div
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onWheel={handleWheel}
          className="relative w-full h-[400px] md:h-[480px] bg-[#0A0A0A] border border-[#262626] rounded-xs overflow-hidden flex items-center justify-center cursor-grab active:cursor-grabbing select-none shadow-inner"
        >
          {/* Main Selected Product Image Container with CSS 3D Transformation & Zoom */}
          <div
            className="relative w-[85%] h-[85%] flex items-center justify-center transition-transform duration-75 ease-out"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom}) rotateY(${rotation}deg)`,
              transformStyle: 'preserve-3d',
            }}
          >
            <Image
              key={currentDisplayImage}
              src={currentDisplayImage}
              alt={selectedProduct.name}
              fill
              unoptimized
              className="object-contain filter drop-shadow-[0_25px_35px_rgba(212,175,55,0.18)]"
              priority
            />
          </div>

          {/* Angle Indicator Badge */}
          <div className="absolute top-4 left-4 rtl:left-auto rtl:right-4 px-3 py-1.5 bg-[#141414]/90 border border-[#D4AF37]/40 text-[#D4AF37] font-label-caps text-[11px] tracking-widest uppercase rounded-xs backdrop-blur-md flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse" />
            <span>ANGLE: {currentAngle}°</span>
            {zoom > 1 && <span className="text-[#A3A3A3] text-[10px]">({zoom.toFixed(1)}x ZOOM)</span>}
          </div>

          {/* Floating Control Toolbar */}
          <div className="absolute bottom-4 right-4 rtl:right-auto rtl:left-4 flex items-center space-x-2 rtl:space-x-reverse bg-[#141414]/90 backdrop-blur-md p-1.5 border border-[#D4AF37]/40 rounded-xs shadow-2xl z-10">
            {/* Auto-Spin Toggle */}
            <button
              onClick={() => {
                setSelectedFrameIndex(null);
                setIsAutoSpin(!isAutoSpin);
              }}
              className={`px-3 py-1.5 text-xs font-label-caps uppercase tracking-wider flex items-center gap-1.5 border transition-all cursor-pointer ${
                isAutoSpin
                  ? 'bg-[#D4AF37] text-[#0A0A0A] font-bold border-[#D4AF37]'
                  : 'bg-[#1D1D1D] text-[#D4AF37] border-[#262626] hover:border-[#D4AF37]'
              }`}
              title="Toggle Auto Spin"
            >
              <span className={`material-symbols-outlined text-sm ${isAutoSpin ? 'animate-spin' : ''}`}>autorenew</span>
              <span className="hidden sm:inline">{isAutoSpin ? 'Pause' : 'Auto Spin'}</span>
            </button>

            {/* Zoom In */}
            <button
              onClick={() => setZoom((z) => Math.min(4.5, z + 0.5))}
              className="p-1.5 bg-[#1D1D1D] border border-[#262626] text-[#D4AF37] hover:border-[#D4AF37] hover:bg-[#D4AF37] hover:text-[#0A0A0A] transition-colors cursor-pointer rounded-xs"
              title="Zoom In"
            >
              <span className="material-symbols-outlined text-lg">zoom_in</span>
            </button>

            {/* Zoom Out */}
            <button
              onClick={() => setZoom((z) => Math.max(1, z - 0.5))}
              className="p-1.5 bg-[#1D1D1D] border border-[#262626] text-[#D4AF37] hover:border-[#D4AF37] hover:bg-[#D4AF37] hover:text-[#0A0A0A] transition-colors cursor-pointer rounded-xs"
              title="Zoom Out"
            >
              <span className="material-symbols-outlined text-lg">zoom_out</span>
            </button>

            {/* Reset Controls */}
            <button
              onClick={() => {
                setRotation(0);
                setZoom(1);
                setPan({ x: 0, y: 0 });
                setIsAutoSpin(false);
                setSelectedFrameIndex(null);
              }}
              className="px-3 py-1.5 bg-[#1D1D1D] border border-[#262626] text-[#E5E5E5] hover:text-[#D4AF37] hover:border-[#D4AF37] font-label-caps text-[11px] uppercase tracking-wider transition-colors cursor-pointer rounded-xs"
              title="Reset View"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Selected Product Angles & Macro Thumbnails */}
        {allProductFrames.length > 1 && (
          <div className="flex items-center gap-3 overflow-x-auto max-w-full py-1">
            <span className="font-label-caps text-[10px] text-[#A3A3A3] uppercase tracking-wider whitespace-nowrap">
              Product Angles:
            </span>
            {allProductFrames.map((imgSrc, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setSelectedFrameIndex(idx);
                  setIsAutoSpin(false);
                }}
                className={`relative w-12 h-12 bg-[#141414] border rounded-xs overflow-hidden transition-all cursor-pointer ${
                  activeFrameIndex === idx ? 'border-[#D4AF37] ring-1 ring-[#D4AF37]' : 'border-[#262626] opacity-60 hover:opacity-100'
                }`}
              >
                <Image src={imgSrc} alt={`${selectedProduct.name} angle ${idx + 1}`} fill unoptimized className="object-cover" />
              </button>
            ))}
          </div>
        )}

        {/* Bottom Return Button */}
        <button
          onClick={() => setIs360Open(false)}
          className="px-10 py-3.5 bg-[#D4AF37] text-[#0A0A0A] hover:bg-[#E5C158] font-button text-xs tracking-widest uppercase font-bold transition-all shadow-lg cursor-pointer"
        >
          Return to Product
        </button>
      </div>
    </div>
  );
};
