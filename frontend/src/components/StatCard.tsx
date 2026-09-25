import type { LucideIcon } from 'lucide-react';
import { clsx } from 'clsx';

export default function StatCard({
  label,
  value,
  icon: Icon,
  tone = 'brand',
}: {
  label: string;
  value: number | string;
  icon: LucideIcon;
  tone?: 'brand' | 'emerald' | 'amber' | 'rose';
}) {
  const TONES: Record<string, string> = {
    brand: 'bg-brand-50 text-brand-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    rose: 'bg-rose-50 text-rose-600',
  };

  return (
    <div className="card flex items-center justify-between">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
        <p className="mt-1.5 text-2xl font-bold tracking-tight text-ink">{value}</p>
      </div>
      <div className={clsx('flex h-11 w-11 items-center justify-center rounded-lg', TONES[tone])}>
        <Icon size={20} strokeWidth={2.25} />
      </div>
    </div>
  );
}
