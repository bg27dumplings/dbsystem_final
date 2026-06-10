"use client";

import { useState } from "react";
import Image from "next/image";
import { X } from "lucide-react";

export function ItemGallery({ images, title }: { images: string[]; title: string }) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  return (
    <>
      <section aria-label="物品照片" className="grid gap-3 sm:grid-cols-2">
        {images.length > 0 ? (
          images.map((src, index) => (
            <div
              key={src}
              className="relative aspect-[4/3] cursor-pointer overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-campus-ink/10"
              onClick={() => setSelectedImage(src)}
            >
              <img src={src} alt={`${title} 照片 ${index + 1}`} className="h-full w-full object-cover" />
            </div>
          ))
        ) : (
          <div className="flex aspect-[4/3] items-center justify-center rounded-lg bg-white px-6 text-center text-sm font-bold text-campus-ink/70 shadow-sm ring-1 ring-campus-ink/10 sm:col-span-2">
            目前沒有上傳任何圖片。
          </div>
        )}
      </section>

      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedImage(null);
            }}
            aria-label="關閉圖片"
          >
            <X size={24} />
          </button>
          <div
            className="relative max-h-full w-full max-w-5xl"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selectedImage}
              alt="放大圖片"
              className="h-auto max-h-[90vh] w-full object-contain"
            />
          </div>
        </div>
      )}
    </>
  );
}
