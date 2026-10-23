'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Expand, X } from 'lucide-react';

type Img = { id: string; url: string; width: number | null; height: number | null; alt: string; caption?: string | null };

/**
 * معرض العمل: الصورة الأولى بحجم بارز دون قص (object-contain)، ومصغرات للبقية.
 * النقر يفتح نافذة حوار أصلية (dialog) تحصر التركيز وتُغلق بـ Esc.
 */
export function Gallery({ images, labels, dir }: { images: Img[]; labels: { enlarge: string; close: string; next: string; prev: string; imageOf: string }; dir: 'rtl' | 'ltr' }) {
  const [active, setActive] = useState(0);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const openerRef = useRef<HTMLButtonElement>(null);

  const go = useCallback((n: number) => setActive((i) => (i + n + images.length) % images.length), [images.length]);

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    const onClose = () => openerRef.current?.focus();
    d.addEventListener('close', onClose);
    return () => d.removeEventListener('close', onClose);
  }, []);

  if (!images.length) return null;
  const img = images[active];
  const Next = dir === 'rtl' ? ChevronLeft : ChevronRight;
  const Prev = dir === 'rtl' ? ChevronRight : ChevronLeft;

  return (
    <div>
      <figure>
        <button
          ref={openerRef}
          type="button"
          onClick={() => dialogRef.current?.showModal()}
          className="group relative block w-full cursor-zoom-in bg-[#f4f4f2]"
          aria-label={`${labels.enlarge}: ${img.alt}`}
        >
          <Image
            src={img.url}
            alt={img.alt}
            width={img.width ?? 1200}
            height={img.height ?? 900}
            sizes="(min-width: 1024px) 760px, 100vw"
            quality={90}
            priority
            className="mx-auto h-auto max-h-[78vh] w-auto max-w-full object-contain"
          />
          <span className="absolute end-3 bottom-3 inline-flex items-center gap-1.5 rounded-full bg-navy/80 px-3 py-1.5 text-xs font-semibold text-white opacity-90 group-hover:opacity-100">
            <Expand aria-hidden size={14} /> {labels.enlarge}
          </span>
        </button>
        {img.caption && <figcaption className="mt-2 text-sm text-ink-soft">{img.caption}</figcaption>}
      </figure>

      {images.length > 1 && (
        <ul className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {images.map((m, i) => (
            <li key={m.id} className="shrink-0">
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-label={`${labels.imageOf} ${i + 1}`}
                aria-current={i === active ? 'true' : undefined}
                className={`relative block size-20 overflow-hidden border-2 ${i === active ? 'border-orange' : 'border-transparent'}`}
              >
                <Image src={m.url} alt="" fill sizes="80px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <dialog
        ref={dialogRef}
        aria-label={img.alt}
        className="m-0 h-dvh max-h-none w-screen max-w-none bg-navy/95 p-0 text-white backdrop:bg-navy/80"
        onKeyDown={(e) => {
          if (images.length < 2) return;
          if (e.key === (dir === 'rtl' ? 'ArrowLeft' : 'ArrowRight')) go(1);
          if (e.key === (dir === 'rtl' ? 'ArrowRight' : 'ArrowLeft')) go(-1);
        }}
        onClick={(e) => {
          if (e.target === dialogRef.current) dialogRef.current?.close();
        }}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between px-3 py-2">
            <p className="text-sm text-white/80">
              <span className="ltr-iso">
                {active + 1} / {images.length}
              </span>
            </p>
            <button type="button" onClick={() => dialogRef.current?.close()} aria-label={labels.close} className="inline-flex size-11 items-center justify-center rounded hover:bg-white/10">
              <X aria-hidden size={24} />
            </button>
          </div>
          <div className="relative flex min-h-0 flex-1 items-center justify-center px-2 pb-4 sm:px-14">
            {/* الصورة الأصلية كاملة دون قص */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.url} alt={img.alt} className="max-h-full max-w-full object-contain" />
            {images.length > 1 && (
              <>
                <button type="button" onClick={() => go(-1)} aria-label={labels.prev} className="absolute start-1 inline-flex size-11 items-center justify-center rounded-full bg-white/10 hover:bg-white/20">
                  <Prev aria-hidden size={24} />
                </button>
                <button type="button" onClick={() => go(1)} aria-label={labels.next} className="absolute end-1 inline-flex size-11 items-center justify-center rounded-full bg-white/10 hover:bg-white/20">
                  <Next aria-hidden size={24} />
                </button>
              </>
            )}
          </div>
        </div>
      </dialog>
    </div>
  );
}

/** مشغل فيديو بلا تشغيل تلقائي: يدعم يوتيوب وفيميو أو ملف مباشر. */
export function VideoPlayer({ url, title, poster }: { url: string; title: string; poster?: string }) {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{6,})/);
  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  const embed = yt ? `https://www.youtube-nocookie.com/embed/${yt[1]}` : vimeo ? `https://player.vimeo.com/video/${vimeo[1]}` : null;
  if (embed) {
    return (
      <div className="relative aspect-video w-full bg-black">
        <iframe src={embed} title={title} className="absolute inset-0 size-full" allow="encrypted-media; picture-in-picture; fullscreen" loading="lazy" />
      </div>
    );
  }
  return <video src={url} controls preload="metadata" poster={poster} className="aspect-video w-full bg-black" aria-label={title} />;
}
