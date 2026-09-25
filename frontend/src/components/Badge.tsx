import { clsx } from 'clsx';
import type { DocumentStatus } from '@/types';

const STATUS_STYLES: Record<DocumentStatus, string> = {
  received: 'bg-slate-100 text-slate-600',
  ocr_processing: 'bg-brand-50 text-brand-700',
  ai_extracting: 'bg-brand-50 text-brand-700',
  rules_processing: 'bg-brand-50 text-brand-700',
  completed: 'bg-emerald-50 text-emerald-700',
  needs_review: 'bg-amber-50 text-amber-700',
  failed: 'bg-rose-50 text-rose-700',
};

const STATUS_LABELS: Record<DocumentStatus, string> = {
  received: 'مستلَم',
  ocr_processing: 'استخراج نص',
  ai_extracting: 'تحليل ذكاء اصطناعي',
  rules_processing: 'تطبيق القواعد',
  completed: 'مكتمل',
  needs_review: 'بانتظار المراجعة',
  failed: 'فشل',
};

export default function StatusBadge({ status }: { status: DocumentStatus }) {
  return (
    <span className={clsx('badge', STATUS_STYLES[status])}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {STATUS_LABELS[status]}
    </span>
  );
}
