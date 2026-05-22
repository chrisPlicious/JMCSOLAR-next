'use client';

import { useState, useRef, useEffect } from 'react';
import { UploadCloud, X } from 'lucide-react';

interface Props {
  name: string;
  currentUrl?: string | null;
}

export default function SingleImageUploader({ name, currentUrl }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!file) {
      setPreview(currentUrl ?? null);
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) setPreview(e.target.result as string);
    };
    reader.readAsDataURL(file);
  }, [file, currentUrl]);

  return (
    <div className="w-full">
      {preview ? (
        <div className="relative rounded-xl overflow-hidden border border-slate-200 aspect-[3/4]">
          <img src={preview} alt="" className="w-full h-full object-cover" />
          {file ? (
            <button
              type="button"
              onClick={() => {
                setFile(null);
                if (inputRef.current) inputRef.current.value = '';
              }}
              className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black text-white rounded-full transition-colors"
            >
              <X size={12} />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity text-white text-sm font-semibold gap-2"
            >
              <UploadCloud size={16} />
              Replace
            </button>
          )}
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            const dropped = e.dataTransfer.files[0];
            if (dropped?.type.startsWith('image/')) {
              setFile(dropped);
              const dt = new DataTransfer();
              dt.items.add(dropped);
              if (inputRef.current) inputRef.current.files = dt.files;
            }
          }}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors aspect-[3/4] flex flex-col items-center justify-center ${
            isDragging
              ? 'border-solar-500 bg-solar-50'
              : 'border-slate-300 hover:border-slate-400 bg-slate-50 hover:bg-slate-100'
          }`}
        >
          <UploadCloud className="h-9 w-9 text-slate-400 mb-3" />
          <p className="text-sm text-slate-600 font-medium">Click or drag to upload</p>
          <p className="text-xs text-slate-400 mt-1">JPG, PNG, WEBP</p>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        name={name}
        accept="image/*"
        className="hidden"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
      />
    </div>
  );
}
