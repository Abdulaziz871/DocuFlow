import type { User } from '@/types';

const ROLE_LABELS: Record<string, string> = {
  system_admin: 'مدير عام',
  operations_manager: 'مدير عمليات',
  developer: 'مطوّر / تكامل API',
};

export default function Topbar({ user }: { user: User }) {
  const initials = user.name.trim().slice(0, 1);

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-white px-6">
      <div>
        <h1 className="text-[15px] font-semibold text-ink">مرحباً، {user.name}</h1>
        <span className="badge mt-0.5 bg-brand-50 text-brand-700">{ROLE_LABELS[user.role]}</span>
      </div>
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-sm font-semibold text-white">
        {initials}
      </div>
    </header>
  );
}
