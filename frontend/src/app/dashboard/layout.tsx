'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import { fetchCurrentUser } from '@/lib/auth';
import type { User } from '@/types';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCurrentUser().then((u) => {
      if (!u) {
        router.replace('/login');
        return;
      }
      setUser(u);
      setLoading(false);
    });
  }, [router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center gap-2 bg-canvas text-sm text-muted">
        <Loader2 className="animate-spin" size={16} />
        جارٍ التحميل...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-canvas">
      <Sidebar role={user.role} />
      <div className="flex-1">
        <Topbar user={user} />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
