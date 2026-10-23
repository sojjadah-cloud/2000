'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Maximize, Minimize, ZoomIn, ZoomOut, ExternalLink } from 'lucide-react';
import type { PDFDocumentProxy, RenderTask } from 'pdfjs-dist';

type Labels = {
  loading: string; error: string; open: string; zoomIn: string; zoomOut: string; fullscreen: string; exitFullscreen: string;
  next: string; prev: string; page: string; of: string; title: string;
};

/**
 * قارئ PDF بمكتبة pdf.js. يحافظ على ترتيب صفحات الملف الأصلي كما هو.
 * «التالي» يتبع اتجاه القراءة: سهم لليسار في العربية.
 */
export function PdfReader({ url, labels, dir }: { url: string; labels: Labels; dir: 'rtl' | 'ltr' }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const taskRef = useRef<RenderTask | null>(null);
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null);
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(1); // نسبة إلى «ملاءمة العرض»
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [full, setFull] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const pdfjs = await import('pdfjs-dist');
        pdfjs.GlobalWorkerOptions.workerSrc = '/vendor/pdf.worker.min.mjs';
        const loaded = await pdfjs.getDocument({ url }).promise;
        if (!cancelled) {
          setDoc(loaded);
          setState('ready');
        }
      } catch {
        if (!cancelled) setState('error');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [url]);

  const render = useCallback(async () => {
    if (!doc || !canvasRef.current || !stageRef.current) return;
    const p = await doc.getPage(page);
    const base = p.getViewport({ scale: 1 });
    const available = stageRef.current.clientWidth - 16;
    const fit = Math.min(available / base.width, (window.innerHeight * (full ? 0.86 : 0.78)) / base.height);
    const viewport = p.getViewport({ scale: Math.max(0.2, fit * zoom) });
    const ratio = window.devicePixelRatio || 1;
    const canvas = canvasRef.current;
    canvas.width = Math.floor(viewport.width * ratio);
    canvas.height = Math.floor(viewport.height * ratio);
    canvas.style.width = `${Math.floor(viewport.width)}px`;
    canvas.style.height = `${Math.floor(viewport.height)}px`;
    taskRef.current?.cancel();
    const task = p.render({ canvas, viewport, transform: ratio !== 1 ? [ratio, 0, 0, ratio, 0, 0] : undefined });
    taskRef.current = task;
    try {
      await task.promise;
    } catch {
      /* أُلغي العرض لصالح عرض أحدث */
    }
  }, [doc, page, zoom, full]);

  useEffect(() => {
    render();
    const onResize = () => render();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [render]);

  useEffect(() => {
    const onFs = () => setFull(document.fullscreenElement === wrapRef.current);
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  const total = doc?.numPages ?? 0;
  const go = useCallback((n: number) => setPage((p) => Math.min(Math.max(1, p + n), total || 1)), [total]);

  const onKey = (e: React.KeyboardEvent) => {
    const forward = dir === 'rtl' ? 'ArrowLeft' : 'ArrowRight';
    const back = dir === 'rtl' ? 'ArrowRight' : 'ArrowLeft';
    if (e.key === forward || e.key === 'PageDown') {
      e.preventDefault();
      go(1);
    } else if (e.key === back || e.key === 'PageUp') {
      e.preventDefault();
      go(-1);
    }
  };

  const toggleFull = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await wrapRef.current?.requestFullscreen();
    } catch {
      /* ملء الشاشة غير مدعوم (مثل بعض متصفحات iOS) */
    }
  };

  const NextIcon = dir === 'rtl' ? ChevronLeft : ChevronRight;
  const PrevIcon = dir === 'rtl' ? ChevronRight : ChevronLeft;
  const btn = 'inline-flex size-11 items-center justify-center rounded text-white hover:bg-white/10 disabled:opacity-40';

  return (
    <div ref={wrapRef} className="flex flex-col bg-navy text-white" role="region" aria-label={labels.title} tabIndex={0} onKeyDown={onKey}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-2 py-1.5 sm:px-4">
        <div className="flex items-center gap-1">
          <button type="button" className={btn} onClick={() => go(-1)} disabled={page <= 1 || state !== 'ready'} aria-label={labels.prev}>
            <PrevIcon aria-hidden size={22} />
          </button>
          <p className="min-w-[6.5rem] text-center text-sm" aria-live="polite">
            {labels.page} <span className="ltr-iso font-semibold">{page}</span> {labels.of} <span className="ltr-iso">{total || '–'}</span>
          </p>
          <button type="button" className={btn} onClick={() => go(1)} disabled={page >= total || state !== 'ready'} aria-label={labels.next}>
            <NextIcon aria-hidden size={22} />
          </button>
        </div>
        <div className="flex items-center gap-1">
          <button type="button" className={btn} onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.25).toFixed(2)))} aria-label={labels.zoomOut} disabled={state !== 'ready'}>
            <ZoomOut aria-hidden size={20} />
          </button>
          <span className="ltr-iso w-12 text-center text-sm">{Math.round(zoom * 100)}%</span>
          <button type="button" className={btn} onClick={() => setZoom((z) => Math.min(3, +(z + 0.25).toFixed(2)))} aria-label={labels.zoomIn} disabled={state !== 'ready'}>
            <ZoomIn aria-hidden size={20} />
          </button>
          <button type="button" className={btn} onClick={toggleFull} aria-label={full ? labels.exitFullscreen : labels.fullscreen}>
            {full ? <Minimize aria-hidden size={20} /> : <Maximize aria-hidden size={20} />}
          </button>
          <a href={url} target="_blank" rel="noopener noreferrer" className={btn} aria-label={labels.open}>
            <ExternalLink aria-hidden size={19} />
          </a>
        </div>
      </div>
      <div ref={stageRef} className={`flex justify-center overflow-auto bg-[#1c2340] p-2 sm:p-4 ${full ? 'h-full flex-1' : 'min-h-[60vh]'}`}>
        {state === 'loading' && <p className="self-center text-white/80">{labels.loading}</p>}
        {state === 'error' && (
          <div className="self-center text-center">
            <p>{labels.error}</p>
            <a href={url} target="_blank" rel="noopener noreferrer" className="btn btn-primary mt-4">
              {labels.open}
            </a>
          </div>
        )}
        <canvas ref={canvasRef} hidden={state !== 'ready'} className="block h-auto max-w-none shadow-2xl" />
      </div>
    </div>
  );
}
