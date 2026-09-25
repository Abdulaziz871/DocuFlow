'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import { LayoutDashboard, FileStack, ListChecks, KeyRound, Users, LogOut, FileText, Settings } from 'lucide-react';
import { logout } from '@/lib/auth';
import type { UserRole } from '@/types';

const NAV = [
  { href: '/dashboard', label: 'نظرة عامة', icon: LayoutDashboard, roles: ['system_admin', 'operations_manager', 'developer'] },
  { href: '/dashboard/documents', label: 'المستندات', icon: FileStack, roles: ['system_admin', 'operations_manager', 'developer'] },
  { href: '/dashboard/rules', label: 'قواعد العمل', icon: ListChecks, roles: ['system_admin', 'operations_manager'] },
  { href: '/dashboard/api-keys', label: 'مفاتيح API', icon: KeyRound, roles: ['system_admin', 'operations_manager'] },
  { href: '/dashboard/users', label: 'المستخدمون', icon: Users, roles: ['system_admin'] },
  { href: '/dashboard/settings', label: 'الإعدادات', icon: Settings, roles: ['system_admin', 'operations_manager'] },
];

export default function Sidebar({ role }: { role: UserRole }) {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-64 flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-2.5 px-6 py-6">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-white">
          <FileText size={17} strokeWidth={2.25} />
        </span>
        <span className="text-[15px] font-bold tracking-tight text-white">DocuFlow AI</span>
      </div>

      <nav className="flex-1 space-y-0.5 px-3">
        {NAV.filter((item) => item.roles.includes(role)).map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                active ? 'bg-brand text-white shadow-sm' : 'text-white/60 hover:bg-white/[0.06] hover:text-white'
              )}
            >
              <item.icon size={18} strokeWidth={2} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mx-3 mb-4 mt-2 border-t border-white/10 pt-3">
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/60 transition-colors hover:bg-white/[0.06] hover:text-white"
        >
          <LogOut size={18} strokeWidth={2} />
          تسجيل الخروج
        </button>
      </div>
    </aside>
  );
}
