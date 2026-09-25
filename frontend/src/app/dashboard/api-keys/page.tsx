'use client';

import { useEffect, useState } from 'react';
import { Copy, Trash2, KeyRound, Check } from 'lucide-react';
import apiClient from '@/lib/apiClient';
import type { ApiKeyRecord } from '@/types';

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKeyRecord[]>([]);
  const [label, setLabel] = useState('');
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function load() {
    apiClient.get('/api-keys').then((res) => setKeys(res.data.data));
  }

  useEffect(load, []);

  async function createKey(e: React.FormEvent) {
    e.preventDefault();
    const { data } = await apiClient.post('/api-keys', { label });
    setNewKey(data.data.apiKey);
    setCopied(false);
    setLabel('');
    load();
  }

  async function revoke(id: string) {
    await apiClient.delete(`/api-keys/${id}`);
    load();
  }

  function copy() {
    if (!newKey) return;
    navigator.clipboard.writeText(newKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="space-y-6">
      <form onSubmit={createKey} className="card flex items-end gap-3">
        <div className="flex-1">
          <label className="field-label">اسم المفتاح</label>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            required
            className="input-field"
            placeholder="مثال: تكامل نظام المحاسبة"
          />
        </div>
        <button className="btn-primary">إنشاء مفتاح</button>
      </form>

      {newKey && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-medium text-amber-800">
            انسخ المفتاح الآن — لن يظهر مرة أخرى بعد إغلاق هذه الرسالة.
          </p>
          <div className="mt-2.5 flex items-center justify-between gap-3 rounded-lg border border-amber-200/70 bg-white px-3.5 py-2.5">
            <code className="truncate text-sm text-ink">{newKey}</code>
            <button onClick={copy} className="btn-outline shrink-0 !px-3 !py-1.5">
              {copied ? <Check size={15} /> : <Copy size={15} />}
              {copied ? 'تم النسخ' : 'نسخ'}
            </button>
          </div>
        </div>
      )}

      {keys.length === 0 ? (
        <div className="table-shell flex flex-col items-center justify-center gap-2 py-14 text-center">
          <KeyRound className="text-muted/50" size={28} />
          <p className="text-sm text-muted">لا توجد مفاتيح API بعد.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {keys.map((k) => (
            <div key={k._id} className="card flex items-center justify-between py-4">
              <div>
                <p className="text-sm font-medium text-ink">{k.label}</p>
                <p className="mt-0.5 font-mono text-xs text-muted">{k.keyPrefix}••••••••••••</p>
              </div>
              <button onClick={() => revoke(k._id)} className="btn-ghost-danger">
                <Trash2 size={15} /> إلغاء
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
