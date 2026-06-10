"use client";

import { useState, useEffect } from "react";
import { X, ZoomIn } from "lucide-react";

export function ImageViewer({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  return (
    <>
      <button
        type="button"
        className={`group relative overflow-hidden block w-full h-full ${className || ""}`}
        onClick={() => setIsOpen(true)}
        aria-label={`放大檢視圖片: ${alt}`}
      >
        <img src={src} alt={alt} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
        <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/10 flex items-center justify-center">
          <ZoomIn className="text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100 drop-shadow-md" size={32} />
        </div>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <button
            type="button"
            className="absolute inset-0 w-full h-full cursor-zoom-out"
            onClick={() => setIsOpen(false)}
            aria-label="關閉預覽"
          />
          <button
            type="button"
            className="absolute top-4 right-4 z-10 rounded-full bg-black/50 p-2 text-white hover:bg-black/80 transition-colors focus:outline-none focus:ring-2 focus:ring-white"
            onClick={() => setIsOpen(false)}
            aria-label="關閉"
          >
            <X size={24} />
          </button>
          <div className="relative z-0 max-h-[90vh] max-w-[90vw] overflow-hidden rounded-md shadow-2xl animate-in zoom-in-95 duration-200">
            <img src={src} alt={alt} className="max-h-[90vh] max-w-[90vw] object-contain" />
          </div>
        </div>
      )}
    </>
  );
}
