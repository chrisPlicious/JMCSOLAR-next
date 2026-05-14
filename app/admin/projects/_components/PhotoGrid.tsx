'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { deleteImageAction, setCoverAction } from '../actions';

type ProjectImage = { id: string; storage_path: string; url: string | null };
type Props = {
  images: ProjectImage[];
  projectId: string;
  coverPath: string | null;
};

export default function PhotoGrid({ images, projectId, coverPath }: Props) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleDelete = (imageId: string, storagePath: string) => {
    if (!confirm('Delete this photo?')) return;
    startTransition(async () => {
      await deleteImageAction(imageId, storagePath, projectId);
      router.refresh();
    });
  };

  const handleSetCover = (storagePath: string) => {
    startTransition(async () => {
      await setCoverAction(projectId, storagePath);
      router.refresh();
    });
  };

  return (
    <div>
      <h2 className="font-display font-bold text-navy-950 text-lg mt-8 mb-4">Photos</h2>
      {!images.length ? (
        <p className="text-slate-400 text-sm">No photos yet. Upload one above.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {images.map((img) => {
            const url = img.url;
            const isCover = img.storage_path === coverPath;
            return (
              <div key={img.id} className="bg-white rounded-xl overflow-hidden border border-slate-200 shadow-sm group">
                <div className="relative aspect-video overflow-hidden">
                  {url && <img src={url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" decoding="async" />}
                  {isCover && (
                    <span className="absolute top-2 left-2 text-[10px] font-bold bg-solar-500 text-navy-950 px-2 py-0.5 rounded-full">Cover</span>
                  )}
                </div>
                <div className="flex items-center gap-2 p-2.5">
                  {!isCover && (
                    <button
                      onClick={() => handleSetCover(img.storage_path)}
                      disabled={isPending}
                      className="text-xs text-navy-700 hover:text-navy-900 font-medium transition-colors disabled:opacity-40"
                    >
                      Set cover
                    </button>
                  )}
                  <div className="flex-1" />
                  <button
                    onClick={() => handleDelete(img.id, img.storage_path)}
                    disabled={isPending}
                    className="text-xs text-red-400 hover:text-red-600 transition-colors disabled:opacity-40"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
