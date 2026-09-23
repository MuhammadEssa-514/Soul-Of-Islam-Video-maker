import React, { useState, useRef } from 'react';
import {
  Upload,
  X,
  Image as ImageIcon,
  Plus,
  ArrowLeft,
  ArrowRight,
  Maximize2,
  Minimize2,
  Layers,
} from 'lucide-react';

interface Props {
  images: string[];
  onImagesChange: (images: string[]) => void;
  fitMode?: 'fit' | 'fill';
  onFitModeChange?: (mode: 'fit' | 'fill') => void;
}

const MAX_SIZE = 15 * 1024 * 1024;
const TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export default function ImageUploader({
  images,
  onImagesChange,
  fitMode = 'fit',
  onFitModeChange,
}: Props) {
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addMoreRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);

    const validFiles: File[] = [];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      if (!TYPES.includes(f.type)) {
        setError('Only JPG, PNG, and WEBP images are supported.');
        return;
      }
      if (f.size > MAX_SIZE) {
        setError('Each image must be under 15 MB.');
        return;
      }
      validFiles.push(f);
    }

    const readers = validFiles.map((file) => {
      return new Promise<string>((resolve) => {
        const r = new FileReader();
        r.onload = (e) => resolve(e.target?.result as string);
        r.readAsDataURL(file);
      });
    });

    Promise.all(readers).then((newUrls) => {
      const updated = [...images, ...newUrls];
      onImagesChange(updated);
      setSelectedIndex(updated.length - 1);
    });
  };

  const removeImage = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = images.filter((_, i) => i !== index);
    onImagesChange(updated);
    if (selectedIndex >= updated.length) {
      setSelectedIndex(Math.max(0, updated.length - 1));
    }
  };

  const moveImage = (index: number, direction: 'left' | 'right', e: React.MouseEvent) => {
    e.stopPropagation();
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= images.length) return;
    const updated = [...images];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    onImagesChange(updated);
    setSelectedIndex(targetIndex);
  };

  return (
    <div className="w-full space-y-4">
      {/* Upload Dropzone (When no images yet) */}
      {images.length === 0 ? (
        <div
          className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
            dragging
              ? 'border-[#059669] bg-[#059669]/10 scale-[0.99]'
              : 'border-white/15 hover:border-[#059669] bg-white/[0.01] hover:bg-white/[0.03]'
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            handleFiles(e.dataTransfer.files);
          }}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => handleFiles(e.target.files)}
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
          />
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-3 text-emerald-400">
            <Upload className="w-6 h-6" />
          </div>
          <p className="text-white text-sm font-bold">Tap or drag images here</p>
          <p className="text-xs text-gray-400 mt-1">
            Upload 1 or multiple quote/verse images · Full height & width preserved
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Main Selected Image Preview */}
          <div className="relative rounded-2xl overflow-hidden border border-white/15 bg-black/50 flex flex-col items-center justify-center p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={images[selectedIndex] || images[0]}
              alt={`Slide ${selectedIndex + 1}`}
              className="max-h-[280px] w-auto object-contain rounded-xl shadow-2xl"
            />

            {/* Badge Indicator */}
            <div className="absolute top-4 left-4 bg-black/75 backdrop-blur-md px-3 py-1 rounded-full border border-white/15 text-xs text-white flex items-center gap-1.5 font-semibold">
              <Layers className="w-3.5 h-3.5 text-[#10b981]" />
              <span>
                Image {selectedIndex + 1} of {images.length}
              </span>
            </div>

            {/* Top Right Controls */}
            <div className="absolute top-4 right-4 flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => addMoreRef.current?.click()}
                title="Add more images"
                className="bg-emerald-600 hover:bg-emerald-500 text-white p-2 rounded-xl text-xs font-bold flex items-center gap-1 shadow-lg transition-colors"
              >
                <Plus className="w-4 h-4" /> Add Image
              </button>
              <button
                type="button"
                onClick={(e) => removeImage(selectedIndex, e)}
                title="Remove this image"
                className="bg-black/75 hover:bg-red-500/80 p-2 rounded-xl border border-white/15 text-gray-300 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Multiple Images Carousel / Reorder Thumbnails */}
          {images.length > 1 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-gray-400 px-1">
                <span>Multi-Image Sequence (Smooth Slideshow Transitions):</span>
                <span>Click thumbnail to view</span>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2 pt-1 scrollbar-thin">
                {images.map((img, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedIndex(idx)}
                    className={`relative rounded-xl overflow-hidden cursor-pointer border-2 transition-all flex-shrink-0 group ${
                      selectedIndex === idx
                        ? 'border-[#059669] ring-2 ring-[#059669]/40 scale-105'
                        : 'border-white/15 opacity-70 hover:opacity-100'
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img}
                      alt={`Thumb ${idx + 1}`}
                      className="w-16 h-16 object-cover bg-black"
                    />
                    <span className="absolute bottom-1 left-1 bg-black/80 text-[10px] text-white px-1.5 rounded font-bold">
                      #{idx + 1}
                    </span>

                    {/* Reorder and Delete controls on thumbnail hover */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1 transition-opacity">
                      {idx > 0 && (
                        <button
                          type="button"
                          onClick={(e) => moveImage(idx, 'left', e)}
                          className="p-1 rounded bg-white/20 text-white hover:bg-white/40"
                          title="Move earlier"
                        >
                          <ArrowLeft className="w-3 h-3" />
                        </button>
                      )}
                      {idx < images.length - 1 && (
                        <button
                          type="button"
                          onClick={(e) => moveImage(idx, 'right', e)}
                          className="p-1 rounded bg-white/20 text-white hover:bg-white/40"
                          title="Move later"
                        >
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={(e) => removeImage(idx, e)}
                        className="p-1 rounded bg-red-500/60 text-white hover:bg-red-500"
                        title="Delete"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Quick Add More Box */}
                <button
                  type="button"
                  onClick={() => addMoreRef.current?.click()}
                  className="w-16 h-16 rounded-xl border-2 border-dashed border-white/20 hover:border-[#059669] flex flex-col items-center justify-center text-gray-400 hover:text-white transition-colors flex-shrink-0"
                >
                  <Plus className="w-5 h-5 mb-0.5" />
                  <span className="text-[9px] font-bold">Add</span>
                </button>
              </div>
            </div>
          )}

          {/* Hidden input for adding more */}
          <input
            type="file"
            ref={addMoreRef}
            onChange={(e) => handleFiles(e.target.files)}
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
          />

          {/* Full Height/Width Fit Selector */}
          {onFitModeChange && (
            <div className="bg-white/[0.03] border border-white/10 p-3 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white block">Image Display Mode</span>
                <span className="text-[11px] text-gray-400">
                  {fitMode === 'fit'
                    ? '100% full height & width visible (No text cut off)'
                    : 'Images scale to fill 9:16 screen'}
                </span>
              </div>
              <div className="flex gap-1.5 bg-black/40 p-1 rounded-lg border border-white/10">
                <button
                  type="button"
                  onClick={() => onFitModeChange('fit')}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition-all ${
                    fitMode === 'fit'
                      ? 'bg-[#059669] text-white shadow-sm'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Minimize2 className="w-3.5 h-3.5" /> Full Image (Fit)
                </button>
                <button
                  type="button"
                  onClick={() => onFitModeChange('fill')}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition-all ${
                    fitMode === 'fill'
                      ? 'bg-[#059669] text-white shadow-sm'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Maximize2 className="w-3.5 h-3.5" /> Fill Screen
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
    </div>
  );
}
