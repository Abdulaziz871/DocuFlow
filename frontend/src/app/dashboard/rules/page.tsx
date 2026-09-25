'use client';

import { useCallback, useEffect, useState } from 'react';
import apiClient from '@/lib/apiClient';
import RuleCard from '@/components/RuleCard';
import RuleForm from '@/components/RuleForm';
import type { Rule } from '@/types';

export default function RulesPage() {
  const [rules, setRules] = useState<Rule[]>([]);

  const load = useCallback(() => {
    apiClient.get('/rules').then((res) => setRules(res.data.data));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      <RuleForm onCreated={load} />

      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-ink">القواعد الحالية ({rules.length})</h2>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {rules.map((rule) => (
          <RuleCard key={rule._id} rule={rule} onChanged={load} />
        ))}
        {!rules.length && <p className="text-sm text-muted">لا توجد قواعد بعد — أنشئ أول قاعدة من النموذج أعلاه.</p>}
      </div>
    </div>
  );
}
