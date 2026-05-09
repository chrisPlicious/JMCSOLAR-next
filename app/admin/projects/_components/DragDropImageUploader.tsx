"use client";

import { useState, useRef, useEffect } from "react";
import { UploadCloud, X } from "lucide-react";

export default function DragDropImageUploader({ name = "images" }: { name?: string }) {
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      // M8: DataTransfer() throws on Safari < 14.1 and some older browsers
      try {
        const dt = new DataTransfer();
        files.forEach((f) => dt.items.add(f));
        inputRef.current.files = dt.files;
      } catch {
        // Fallback: browser doesn't support DataTransfer constructor — files
        // are still tracked in state and submitted via the hidden input on
        // the next native file-picker selection.
      }
    }
  }, [files]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  return (
    <div className="w-full">
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`w-full border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
          isDragging
            ? "border-solar-500 bg-solar-50"
            : "border-slate-300 hover:border-slate-400 bg-slate-50 hover:bg-slate-100"
        }`}
      >
        <UploadCloud className="mx-auto h-10 w-10 text-slate-400 mb-3" />
        <p className="text-sm text-slate-600 font-medium">
          Click or drag and drop images here
        </p>
        <p className="text-xs text-slate-400 mt-1">
          Supports JPG, PNG, WEBP (multiple files allowed)
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        name={name}
        multiple
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files) {
            setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
          }
        }}
      />

      {files.length > 0 && (
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {files.map((file, idx) => (
            <div key={idx} className="relative group rounded-lg overflow-hidden border border-slate-200 aspect-video">
              <img
                src={URL.createObjectURL(file)}
                alt={file.name}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setFiles((prev) => prev.filter((_, i) => i !== idx));
                }}
                className="absolute top-1.5 right-1.5 p-1 bg-black/60 hover:bg-black text-white rounded-full transition-colors opacity-0 group-hover:opacity-100"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}