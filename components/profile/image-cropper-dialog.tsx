"use client";

import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { X, Check } from "lucide-react";
import { getCroppedImg } from "@/lib/utils/cropImage";

type ImageCropperDialogProps = {
  imageUrl: string;
  onClose: () => void;
  onCropComplete: (croppedFile: File, croppedUrl: string) => void;
};

export function ImageCropperDialog({ imageUrl, onClose, onCropComplete }: ImageCropperDialogProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropCompleteHandler = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return;
    try {
      setIsProcessing(true);
      const croppedImageFile = await getCroppedImg(imageUrl, croppedAreaPixels);
      if (croppedImageFile) {
        const url = URL.createObjectURL(croppedImageFile);
        onCropComplete(croppedImageFile, url);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="relative w-full max-w-md overflow-hidden rounded-lg bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="text-lg font-black text-campus-ink">裁切頭像</h3>
          <button onClick={onClose} className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="relative h-[400px] w-full bg-slate-900">
          <Cropper
            image={imageUrl}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onCropComplete={onCropCompleteHandler}
            onZoomChange={setZoom}
          />
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="text-sm font-bold text-slate-700 block mb-2">縮放照片</label>
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              aria-labelledby="Zoom"
              onChange={(e) => {
                setZoom(Number(e.target.value));
              }}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-campus-moss"
            />
          </div>
          
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="rounded-md px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-50"
            >
              取消
            </button>
            <button
              onClick={handleConfirm}
              disabled={isProcessing}
              className="flex items-center gap-1 rounded-md bg-campus-moss px-4 py-2 font-black text-white hover:bg-campus-ink disabled:opacity-50"
            >
              {isProcessing ? "處理中..." : (
                <>
                  <Check size={16} /> 確定裁切
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
