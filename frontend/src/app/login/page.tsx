'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Loader2 } from 'lucide-react';
import { login } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'فشل تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-ink text-white shadow-card">
            <FileText size={20} strokeWidth={2.25} />
          </span>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-ink">DocuFlow AI</h1>
            <p className="mt-0.5 text-sm text-muted">منصة الأتمتة الذكية للمستندات والعمليات</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="card">
          <div className="space-y-4">
            <div>
              <label className="field-label">البريد الإلكتروني</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="you@company.com"
                autoFocus
              />
            </div>
            <div>
              <label className="field-label">كلمة المرور</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="••••••••"
              />
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-lg border border-rose-100 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary mt-6 w-full">
            {loading && <Loader2 className="animate-spin" size={16} />}
            {loading ? 'جارٍ الدخول...' : 'دخول'}
          </button>
        </form>
      </div>
    </main>
  );
}
