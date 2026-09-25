'use client';

import { useRef, useState } from 'react';
import { UploadCloud, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import apiClient from '@/lib/apiClient';

export default function UploadDropzone({ onUploaded }: { onUploaded: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setBusy(true);
    setError(null);
    const form = new FormData();
    form.append('file', file);
    try {
      await apiClient.post('/documents/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      onUploaded();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'فشل رفع الملف');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      onClick={() => !busy && inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file) handleFile(file);
      }}
      className={clsx(
        'flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed py-12 text-center transition-colors',
        dragOver ? 'border-brand bg-brand-50/50' : 'border-border bg-white hover:border-brand/40 hover:bg-canvas'
      )}
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600">
        {busy ? <Loader2 className="animate-spin" size={22} /> : <UploadCloud size={22} strokeWidth={2} />}
      </span>
      <p className="text-sm font-medium text-ink">
        {busy ? 'جارٍ الرفع والمعالجة...' : 'اسحب ملف PDF أو صورة هنا، أو اضغط للاختيار'}
      </p>
      <p className="text-xs text-muted">الحد الأقصى 10 ميجابايت — PDF, PNG, JPG</p>
      {error && <p className="text-xs font-medium text-rose-600">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
    </div>
  );
}
