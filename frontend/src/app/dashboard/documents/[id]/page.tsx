'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Loader2, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import apiClient from '@/lib/apiClient';
import StatusBadge from '@/components/Badge';
import type { DFDocument } from '@/types';

const IN_PROGRESS_STATUSES = ['received', 'ocr_processing', 'ai_extracting', 'rules_processing'];

const FIELD_LABELS: Record<string, string> = {
  vendorName: 'المورّد',
  documentNumber: 'رقم المستند',
  issueDate: 'تاريخ الإصدار',
  dueDate: 'تاريخ الاستحقاق',
  currency: 'العملة',
  totalAmount: 'الإجمالي',
  taxAmount: 'الضريبة',
};

export default function DocumentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [doc, setDoc] = useState<DFDocument | null>(null);
  const [jsonDraft, setJsonDraft] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showRaw, setShowRaw] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    async function load() {
      const res = await apiClient.get(`/documents/${id}`);
      if (cancelled) return;
      const d: DFDocument = res.data.data;
      setDoc(d);
      setJsonDraft(JSON.stringify(d.extractedData ?? {}, null, 2));
      // Still mid-pipeline (OCR/AI/rules) — poll until it reaches a final state, so the
      // page updates on its own instead of showing a stale "empty" snapshot forever.
      if (IN_PROGRESS_STATUSES.includes(d.status)) {
        timer = setTimeout(load, 3000);
      }
    }
    load();

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [id]);

  async function handleApprove() {
    let parsed;
    try {
      parsed = JSON.parse(jsonDraft);
      setJsonError(null);
    } catch {
      setJsonError('صيغة JSON غير صحيحة — تحقق من الأقواس والفواصل.');
      return;
    }
    setSaving(true);
    try {
      const res = await apiClient.patch(`/documents/${id}/review`, { extractedData: parsed });
      setDoc(res.data.data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  if (!doc) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted">
        <Loader2 className="animate-spin" size={16} /> جارٍ التحميل...
      </div>
    );
  }

  const data = doc.extractedData || {};
  const lineItems: any[] = Array.isArray(data.lineItems) ? data.lineItems : [];
  const customFields = data.customFields && typeof data.customFields === 'object' ? data.customFields : null;
  const inProgress = IN_PROGRESS_STATUSES.includes(doc.status);
  const canReview = doc.status === 'completed' || doc.status === 'needs_review';

  return (
    <div className="space-y-6">
      <Link href="/dashboard/documents" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink">
        <ArrowRight size={16} /> رجوع إلى المستندات
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-ink">{doc.originalFileName}</h1>
          <div className="mt-2 flex items-center gap-2">
            <StatusBadge status={doc.status} />
            {doc.documentType && <span className="badge bg-slate-100 text-slate-600">{doc.documentType}</span>}
            <span className="text-xs text-muted">{new Date(doc.createdAt).toLocaleString('ar-EG')}</span>
          </div>
        </div>
      </div>

      {inProgress && (
        <div className="card flex items-center gap-3 border-brand-100 bg-brand-50">
          <RefreshCw className="animate-spin text-brand-600" size={18} />
          <div>
            <p className="text-sm font-medium text-brand-700">لا تزال المعالجة جارية...</p>
            <p className="mt-0.5 text-xs text-brand-700/80">
              المرحلة الحالية: <StatusBadge status={doc.status} /> — الصفحة تحدّث نفسها تلقائيًا كل بضع ثوانٍ، لا حاجة لعمل Refresh يدوي.
            </p>
          </div>
        </div>
      )}

      {doc.status === 'failed' && doc.errorMessage && (
        <div className="card flex items-start gap-3 border-rose-200 bg-rose-50">
          <AlertCircle className="mt-0.5 shrink-0 text-rose-600" size={18} />
          <div>
            <p className="text-sm font-medium text-rose-800">فشلت معالجة هذا المستند</p>
            <p className="mt-1 text-sm text-rose-700">{doc.errorMessage}</p>
          </div>
        </div>
      )}

      {doc.matchedRules && doc.matchedRules.length > 0 && (
        <div className="card">
          <h3 className="text-sm font-semibold text-ink">القواعد المطابَقة</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {doc.matchedRules.map((m, i) => (
              <span key={i} className="badge bg-brand-50 text-brand-700">
                {typeof m.rule === 'object' ? m.rule.name : m.rule} — {m.actionsTaken.join(', ')}
              </span>
            ))}
          </div>
        </div>
      )}

      {Object.keys(data).length > 0 && (
        <div className="card">
          <h3 className="text-sm font-semibold text-ink">البيانات المستخرجة</h3>
          <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
            {Object.entries(FIELD_LABELS).map(([key, label]) =>
              data[key] !== undefined && data[key] !== null ? (
                <div key={key}>
                  <p className="text-xs text-muted">{label}</p>
                  <p className="mt-0.5 text-sm font-medium text-ink">{String(data[key])}</p>
                </div>
              ) : null
            )}
          </div>

          {lineItems.length > 0 && (
            <div className="mt-5">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">البنود</p>
              <div className="table-shell">
                <table>
                  <thead>
                    <tr>
                      <th>الوصف</th>
                      <th>الكمية</th>
                      <th>سعر الوحدة</th>
                      <th>الإجمالي</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lineItems.map((li, i) => (
                      <tr key={i}>
                        <td>{li.description ?? '—'}</td>
                        <td className="text-muted">{li.quantity ?? '—'}</td>
                        <td className="text-muted">{li.unitPrice ?? '—'}</td>
                        <td className="font-medium">{li.total ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {customFields && Object.keys(customFields).length > 0 && (
            <div className="mt-5">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">حقول إضافية</p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">
                {Object.entries(customFields).map(([k, v]) => (
                  <div key={k}>
                    <p className="text-xs text-muted">{k}</p>
                    <p className="mt-0.5 text-sm text-ink">{String(v)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {canReview && (
        <div className="card">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-ink">تعديل البيانات قبل الاعتماد</h3>
            <span className="text-xs text-muted">JSON قابل للتعديل</span>
          </div>
          <textarea
            dir="ltr"
            value={jsonDraft}
            onChange={(e) => setJsonDraft(e.target.value)}
            rows={12}
            className="input-field mt-3 font-mono text-xs leading-relaxed"
            spellCheck={false}
          />
          {jsonError && <p className="mt-2 text-xs font-medium text-rose-600">{jsonError}</p>}

          <div className="mt-4 flex items-center gap-3">
            <button onClick={handleApprove} disabled={saving} className="btn-primary">
              {saving && <Loader2 className="animate-spin" size={16} />}
              {saved && <CheckCircle2 size={16} />}
              {doc.status === 'needs_review' ? 'اعتماد وتحديث البيانات' : 'حفظ التعديلات'}
            </button>
            {saved && <span className="text-sm text-emerald-600">تم الحفظ بنجاح</span>}
          </div>
        </div>
      )}

      {doc.rawText && (
        <div className="card">
          <button onClick={() => setShowRaw((s) => !s)} className="text-sm font-semibold text-ink">
            {showRaw ? 'إخفاء' : 'عرض'} النص الخام المستخرَج (OCR)
          </button>
          {showRaw && (
            <pre className="mt-3 max-h-64 overflow-auto rounded-lg border border-border bg-canvas p-3 text-xs leading-relaxed text-muted" dir="auto">
              {doc.rawText}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
