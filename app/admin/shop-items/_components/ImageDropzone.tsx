'use client';

import { useRef, useState, type DragEvent } from 'react';
import { UploadCloud, X } from 'lucide-react';

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

export default function ImageDropzone({
  name = 'image',
  required = false,
  currentImageUrl = null,
}: {
  name?: string;
  required?: boolean;
  currentImageUrl?: string | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(currentImageUrl);
  const [fileName, setFileName] = useState<string | null>(null);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function applyFile(file: File | null) {
    if (!file) return;
    if (!ACCEPTED.includes(file.type)) {
      setError('Use a JPEG, PNG, WebP, or AVIF image.');
      return;
    }
    setError(null);

    // Mirror the dropped/selected file into the real <input> so the form submits it.
    const dt = new DataTransfer();
    dt.items.add(file);
    if (inputRef.current) inputRef.current.files = dt.files;

    if (objectUrl) URL.revokeObjectURL(objectUrl);
    const url = URL.createObjectURL(file);
    setObjectUrl(url);
    setPreview(url);
    setFileName(file.name);
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    applyFile(e.dataTransfer.files?.[0] ?? null);
  }

  function clearSelection() {
    if (inputRef.current) inputRef.current.value = '';
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    setObjectUrl(null);
    setFileName(null);
    setPreview(currentImageUrl);
    setError(null);
  }

  const showRemove = Boolean(fileName);

  return (
    <div>
      {/* Real file input — visually hidden but still in the form. */}
      <input
        ref={inputRef}
        type="file"
        name={name}
        accept="image/*"
        required={required && !currentImageUrl}
        onChange={(e) => applyFile(e.target.files?.[0] ?? null)}
        className="sr-only"
        // Move native validation focus to the dropzone instead of the hidden input.
        onInvalid={(e) => {
          e.preventDefault();
          setError('An item image is required.');
        }}
      />

      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-10 text-center cursor-pointer transition-colors ${
          dragging
            ? 'border-solar-500 bg-solar-500/5'
            : error
              ? 'border-red-300 bg-red-50/40'
              : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
        }`}
      >
        {preview ? (
          <>
            <img
              src={preview}
              alt="Selected preview"
              className="w-28 h-28 object-contain rounded-xl border border-slate-200 bg-white p-2"
            />
            <p className="text-xs text-slate-500">
              {fileName ? (
                <>
                  Selected <span className="font-semibold text-navy-900">{fileName}</span>
                </>
              ) : (
                'Current image — drop or click to replace'
              )}
            </p>
          </>
        ) : (
          <>
            <span className="w-12 h-12 rounded-xl bg-solar-500/10 flex items-center justify-center">
              <UploadCloud size={22} className="text-solar-600" />
            </span>
            <div>
              <p className="text-sm font-semibold text-navy-900">
                Drag &amp; drop an image, or{' '}
                <span className="text-solar-600">browse</span>
              </p>
              <p className="text-xs text-slate-400 mt-1">JPEG, PNG, WebP, or AVIF · up to 10&nbsp;MB</p>
            </div>
          </>
        )}

        {showRemove && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              clearSelection();
            }}
            className="absolute top-3 right-3 w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 flex items-center justify-center transition-colors"
            aria-label="Remove selected image"
          >
            <X size={15} />
          </button>
        )}
      </div>

      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
    </div>
  );
}
