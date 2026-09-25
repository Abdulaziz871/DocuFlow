'use client';

import { useState } from 'react';
import { Trash2, Loader2 } from 'lucide-react';
import apiClient from '@/lib/apiClient';
import type { Rule } from '@/types';

export default function RuleCard({ rule, onChanged }: { rule: Rule; onChanged: () => void }) {
  const [busy, setBusy] = useState(false);

  async function toggleActive() {
    setBusy(true);
    try {
      await apiClient.put(`/rules/${rule._id}`, { isActive: !rule.isActive });
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    try {
      await apiClient.delete(`/rules/${rule._id}`);
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-ink">{rule.name}</h3>
          <p className="mt-0.5 text-sm text-muted">{rule.description || 'بدون وصف'}</p>
        </div>
        <button
          onClick={toggleActive}
          disabled={busy}
          className={`badge shrink-0 transition-colors ${
            rule.isActive ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
          }`}
        >
          {rule.isActive ? 'مفعّلة' : 'موقوفة'}
        </button>
      </div>

      {rule.conditions.length > 0 && (
        <div className="mt-4 space-y-1.5">
          {rule.conditions.map((c, i) => (
            <div key={i} className="rounded-lg border border-border bg-canvas px-3 py-1.5 text-xs text-ink">
              إذا كان <span className="font-mono font-medium">{c.field}</span> {c.operator}{' '}
              <span className="font-mono font-medium">{String(c.value)}</span>
            </div>
          ))}
        </div>
      )}

      <div className="mt-3 flex items-center justify-between gap-2">
        {rule.actions.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {rule.actions.map((a, i) => (
              <span key={i} className="badge bg-brand-50 text-brand-700">
                {a.type}
              </span>
            ))}
          </div>
        ) : (
          <span />
        )}
        <button onClick={remove} disabled={busy} className="btn-ghost-danger !px-2 !py-1.5 shrink-0">
          {busy ? <Loader2 className="animate-spin" size={14} /> : <Trash2 size={14} />}
          حذف
        </button>
      </div>
    </div>
  );
}
