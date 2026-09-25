'use client';

import { useEffect, useState } from 'react';
import { FileStack, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import apiClient from '@/lib/apiClient';
import StatCard from '@/components/StatCard';
import DocumentsTable from '@/components/DocumentsTable';
import type { DashboardOverview } from '@/types';

export default function DashboardOverviewPage() {
  const [data, setData] = useState<DashboardOverview | null>(null);

  useEffect(() => {
    apiClient.get('/dashboard/overview').then((res) => setData(res.data.data));
  }, []);

  if (!data) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card h-[84px] animate-pulse bg-canvas" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="إجمالي المستندات" value={data.stats.total} icon={FileStack} tone="brand" />
        <StatCard label="مكتملة" value={data.stats.completed} icon={CheckCircle2} tone="emerald" />
        <StatCard label="بانتظار المراجعة" value={data.stats.needsReview} icon={AlertTriangle} tone="amber" />
        <StatCard label="فشلت" value={data.stats.failed} icon={XCircle} tone="rose" />
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-ink">أحدث المستندات</h2>
        <DocumentsTable documents={data.recentDocuments as any} />
      </div>
    </div>
  );
}
