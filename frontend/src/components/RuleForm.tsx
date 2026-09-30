'use client';

import { useState } from 'react';
import { Plus, X, Loader2 } from 'lucide-react';
import apiClient from '@/lib/apiClient';

const OPERATORS = [
  { value: 'equals', label: 'يساوي (equals)' },
  { value: 'notEquals', label: 'لا يساوي (notEquals)' },
  { value: 'greaterThan', label: 'أكبر من (greaterThan)' },
  { value: 'lessThan', label: 'أصغر من (lessThan)' },
  { value: 'contains', label: 'يحتوي (contains)' },
  { value: 'exists', label: 'موجود (exists)' },
];

const ACTIONS = [
  { value: 'requireApproval', label: 'يتطلب موافقة يدوية' },
  { value: 'sendEmailAlert', label: 'إرسال إيميل' },
  { value: 'sendWebhookAlert', label: 'إرسال تنبيه Webhook' },
  { value: 'flag', label: 'وضع علامة (flag)' },
  { value: 'setStatus', label: 'تغيير الحالة' },
];

const NUMERIC_OPERATORS = ['greaterThan', 'lessThan'];

type Condition = { field: string; operator: string; value: string };

// Coerce a typed string into number/boolean where it clearly looks like one,
// so comparisons like greaterThan work against numeric extracted fields.
function coerceValue(raw: string): unknown {
  if (raw.trim() === '') return raw;
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  const num = Number(raw);
  return Number.isNaN(num) ? raw : num;
}

export default function RuleForm({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [documentType, setDocumentType] = useState('any');
  const [conditions, setConditions] = useState<Condition[]>([{ field: 'totalAmount', operator: 'greaterThan', value: '' }]);
  const [actions, setActions] = useState<string[]>(['requireApproval']);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateCondition(i: number, patch: Partial<Condition>) {
    setConditions((prev) => prev.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await apiClient.post('/rules', {
        name,
        description,
        documentType: documentType.trim() || 'any',
        conditions: conditions
          .filter((c) => c.field.trim() !== '')
          .map((c) => ({ field: c.field, operator: c.operator, value: c.operator === 'exists' ? true : coerceValue(c.value) })),
        actions: actions.map((type) => ({ type })),
      });
      setName('');
      setDescription('');
      setDocumentType('any');
      setConditions([{ field: 'totalAmount', operator: 'greaterThan', value: '' }]);
      setActions(['requireApproval']);
      onCreated();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'تعذّر إنشاء القاعدة');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-5">
      <h3 className="text-sm font-semibold text-ink">قاعدة عمل جديدة</h3>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="field-label">اسم القاعدة</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required className="input-field" placeholder="فاتورة كبيرة تتطلب موافقة" />
        </div>
        <div>
          <label className="field-label">نوع المستند</label>
          <input value={documentType} onChange={(e) => setDocumentType(e.target.value)} className="input-field" placeholder="invoice أو any" />
        </div>
      </div>

      <div>
        <label className="field-label">الوصف (اختياري)</label>
        <input value={description} onChange={(e) => setDescription(e.target.value)} className="input-field" placeholder="وصف مختصر لغرض القاعدة" />
      </div>

      <div>
        <div className="flex items-center justify-between">
          <label className="field-label !mb-0">الشروط (كل الشروط يجب أن تتحقق معًا)</label>
          <button
            type="button"
            onClick={() => setConditions((prev) => [...prev, { field: '', operator: 'equals', value: '' }])}
            className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:text-brand-700"
          >
            <Plus size={14} /> إضافة شرط
          </button>
        </div>
        <div className="mt-2.5 space-y-2">
          {conditions.map((c, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                value={c.field}
                onChange={(e) => updateCondition(i, { field: e.target.value })}
                placeholder="اسم الحقل — totalAmount"
                className="input-field flex-1 font-mono text-xs"
              />
              <select value={c.operator} onChange={(e) => updateCondition(i, { operator: e.target.value })} className="input-field w-40 text-xs">
                {OPERATORS.map((op) => (
                  <option key={op.value} value={op.value}>
                    {op.label}
                  </option>
                ))}
              </select>
              {c.operator !== 'exists' && (
                <input
                  type={NUMERIC_OPERATORS.includes(c.operator) ? 'number' : 'text'}
                  required={NUMERIC_OPERATORS.includes(c.operator)}
                  step="any"
                  value={c.value}
                  onChange={(e) => updateCondition(i, { value: e.target.value })}
                  placeholder="القيمة"
                  className="input-field w-32 text-xs"
                />
              )}
              {conditions.length > 1 && (
                <button
                  type="button"
                  onClick={() => setConditions((prev) => prev.filter((_, idx) => idx !== i))}
                  className="rounded-lg p-2 text-muted hover:bg-canvas hover:text-rose-600"
                >
                  <X size={15} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="field-label">الإجراءات عند التطابق</label>
        <div className="flex flex-wrap gap-2">
          {ACTIONS.map((a) => {
            const active = actions.includes(a.value);
            return (
              <button
                type="button"
                key={a.value}
                onClick={() => setActions((prev) => (active ? prev.filter((x) => x !== a.value) : [...prev, a.value]))}
                className={`badge border transition-colors ${
                  active ? 'border-brand bg-brand-50 text-brand-700' : 'border-border bg-white text-muted hover:bg-canvas'
                }`}
              >
                {a.label}
              </button>
            );
          })}
        </div>
        {actions.includes('sendEmailAlert') && (
          <p className="mt-2 text-xs text-muted">
            يُرسَل إلى بريد التنبيهات المحفوظ في <a href="/dashboard/settings" className="text-brand hover:underline">الإعدادات</a>.
          </p>
        )}
      </div>

      {error && <p className="text-sm font-medium text-rose-600">{error}</p>}

      <button type="submit" disabled={submitting} className="btn-primary">
        {submitting && <Loader2 className="animate-spin" size={16} />}
        إنشاء القاعدة
      </button>
    </form>
  );
}
