'use client';

import { useEffect, useState } from 'react';
import { Users as UsersIcon } from 'lucide-react';
import apiClient from '@/lib/apiClient';
import type { User } from '@/types';

const ROLE_LABELS: Record<string, string> = {
  system_admin: 'مدير عام',
  operations_manager: 'مدير عمليات',
  developer: 'مطوّر / تكامل API',
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    apiClient.get('/users').then((res) => setUsers(res.data.data));
  }, []);

  if (!users.length) {
    return (
      <div className="table-shell flex flex-col items-center justify-center gap-2 py-14 text-center">
        <UsersIcon className="text-muted/50" size={28} />
        <p className="text-sm text-muted">لا يوجد مستخدمون بعد.</p>
      </div>
    );
  }

  return (
    <div className="table-shell overflow-x-auto">
      <table>
        <thead>
          <tr>
            <th>الاسم</th>
            <th>البريد الإلكتروني</th>
            <th>الدور</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u._id}>
              <td className="font-medium">{u.name}</td>
              <td className="text-muted">{u.email}</td>
              <td>
                <span className="badge bg-brand-50 text-brand-700">{ROLE_LABELS[u.role] || u.role}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
