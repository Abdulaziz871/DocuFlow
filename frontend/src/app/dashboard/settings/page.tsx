'use client';

import { useEffect, useState } from 'react';
import { Loader2, CheckCircle2, XCircle, Send, Mail } from 'lucide-react';
import apiClient from '@/lib/apiClient';
import type { Company, WebhookLogEntry } from '@/types';

type TestResult = { delivered?: boolean; statusCode?: number | null; error?: string } | null;

export default function SettingsPage() {
  const [company, setCompany] = useState<Company | null>(null);

  const [webhookUrl, setWebhookUrl] = useState('');
  const [savingWebhook, setSavingWebhook] = useState(false);
  const [savedWebhook, setSavedWebhook] = useState(false);
  const [webhookError, setWebhookError] = useState<string | null>(null);
  const [testingWebhook, setTestingWebhook] = useState(false);
  const [webhookTest, setWebhookTest] = useState<TestResult>(null);

  const [alertEmail, setAlertEmail] = useState('');
  const [savingEmail, setSavingEmail] = useState(false);
  const [savedEmail, setSavedEmail] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [testingEmail, setTestingEmail] = useState(false);
  const [emailTest, setEmailTest] = useState<{ ok: boolean; message: string } | null>(null);

  const [logs, setLogs] = useState<WebhookLogEntry[]>([]);

  function loadLogs() {
    apiClient.get('/company/webhook-logs').then((res) => setLogs(res.data.data));
  }

  useEffect(() => {
    apiClient.get('/company').then((res) => {
      const c: Company = res.data.data;
      setCompany(c);
      setWebhookUrl(c.webhookUrl || '');
      setAlertEmail(c.alertEmail || '');
    });
    loadLogs();
  }, []);

  async function handleSaveWebhook(e: React.FormEvent) {
    e.preventDefault();
    setSavingWebhook(true);
    setWebhookError(null);
    setSavedWebhook(false);
    try {
      const res = await apiClient.patch('/company', { webhookUrl: webhookUrl.trim() || null });
      setCompany(res.data.data);
      setSavedWebhook(true);
      setTimeout(() => setSavedWebhook(false), 2000);
    } catch (err: any) {
      setWebhookError(err?.response?.data?.message || 'تعذّر حفظ رابط الـ Webhook');
    } finally {
      setSavingWebhook(false);
    }
  }

  async function handleTestWebhook() {
    setTestingWebhook(true);
    setWebhookTest(null);
    try {
      const res = await apiClient.post('/company/webhook-test');
      setWebhookTest(res.data.data);
    } catch (err: any) {
      setWebhookTest({ delivered: false, statusCode: null, error: err?.response?.data?.message || 'فشل الإرسال' });
    } finally {
      setTestingWebhook(false);
    }
  }

  async function handleSaveEmail(e: React.FormEvent) {
    e.preventDefault();
    setSavingEmail(true);
    setEmailError(null);
    setSavedEmail(false);
    try {
      const res = await apiClient.patch('/company', { alertEmail: alertEmail.trim() || null });
      setCompany(res.data.data);
      setSavedEmail(true);
      setTimeout(() => setSavedEmail(false), 2000);
    } catch (err: any) {
      setEmailError(err?.response?.data?.message || 'تعذّر حفظ البريد الإلكتروني');
    } finally {
      setSavingEmail(false);
    }
  }

  async function handleTestEmail() {
    setTestingEmail(true);
    setEmailTest(null);
    try {
      await apiClient.post('/company/email-test');
      setEmailTest({ ok: true, message: `تم إرسال إيميل تجريبي إلى ${alertEmail}` });
    } catch (err: any) {
      setEmailTest({ ok: false, message: err?.response?.data?.message || 'فشل الإرسال' });
    } finally {
      setTestingEmail(false);
    }
  }

  if (!company) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted">
        <Loader2 className="animate-spin" size={16} /> جارٍ التحميل...
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-sm font-semibold text-ink">إعدادات الشركة</h2>
        <p className="mt-1 text-sm text-muted">{company.name}</p>
      </div>

      {/* Webhook */}
      <form onSubmit={handleSaveWebhook} className="card space-y-4">
        <div>
          <label className="field-label">رابط الـ Webhook</label>
          <input
            dir="ltr"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            placeholder="https://your-system.com/webhooks/docuflow"
            className="input-field text-left"
          />
          <p className="mt-1.5 text-xs text-muted">
            يُرسَل POST بحمولة JSON إلى هذا الرابط تلقائيًا عند اكتمال أو فشل معالجة أي مستند. اتركه فارغًا لتعطيله.
          </p>
        </div>

        {webhookError && <p className="text-sm font-medium text-rose-600">{webhookError}</p>}

        <div className="flex items-center gap-3">
          <button type="submit" disabled={savingWebhook} className="btn-primary">
            {savingWebhook && <Loader2 className="animate-spin" size={16} />}
            حفظ
          </button>
          {savedWebhook && (
            <span className="inline-flex items-center gap-1 text-sm text-emerald-600">
              <CheckCircle2 size={15} /> تم الحفظ
            </span>
          )}
          {company.webhookUrl && (
            <button type="button" onClick={handleTestWebhook} disabled={testingWebhook} className="btn-outline">
              {testingWebhook ? <Loader2 className="animate-spin" size={15} /> : <Send size={15} />}
              إرسال حدث تجريبي
            </button>
          )}
        </div>

        {webhookTest && (
          <div
            className={`flex items-start gap-2.5 rounded-lg border px-3.5 py-2.5 text-sm ${
              webhookTest.delivered ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-rose-200 bg-rose-50 text-rose-800'
            }`}
          >
            {webhookTest.delivered ? <CheckCircle2 size={16} className="mt-0.5 shrink-0" /> : <XCircle size={16} className="mt-0.5 shrink-0" />}
            <div>
              <p className="font-medium">{webhookTest.delivered ? 'تم التسليم بنجاح' : 'فشل التسليم'}</p>
              <p className="mt-0.5 text-xs opacity-80">
                {webhookTest.statusCode ? `رمز الحالة: ${webhookTest.statusCode}` : webhookTest.error || 'تعذّر الوصول للرابط'}
              </p>
            </div>
          </div>
        )}
      </form>

      {/* Email alerts */}
      <form onSubmit={handleSaveEmail} className="card space-y-4">
        <div>
          <label className="field-label">بريد التنبيهات عند فشل مستند</label>
          <input
            dir="ltr"
            type="email"
            value={alertEmail}
            onChange={(e) => setAlertEmail(e.target.value)}
            placeholder="you@company.com"
            className="input-field text-left"
          />
          <p className="mt-1.5 text-xs text-muted">
            يصلك إيميل مباشر لهذا العنوان فورًا عند فشل معالجة أي مستند (خطأ OCR أو ذكاء اصطناعي). اتركه فارغًا لتعطيله.
          </p>
        </div>

        {emailError && <p className="text-sm font-medium text-rose-600">{emailError}</p>}

        <div className="flex items-center gap-3">
          <button type="submit" disabled={savingEmail} className="btn-primary">
            {savingEmail && <Loader2 className="animate-spin" size={16} />}
            حفظ
          </button>
          {savedEmail && (
            <span className="inline-flex items-center gap-1 text-sm text-emerald-600">
              <CheckCircle2 size={15} /> تم الحفظ
            </span>
          )}
          {company.alertEmail && (
            <button type="button" onClick={handleTestEmail} disabled={testingEmail} className="btn-outline">
              {testingEmail ? <Loader2 className="animate-spin" size={15} /> : <Mail size={15} />}
              إرسال إيميل تجريبي
            </button>
          )}
        </div>

        {emailTest && (
          <div
            className={`flex items-start gap-2.5 rounded-lg border px-3.5 py-2.5 text-sm ${
              emailTest.ok ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-rose-200 bg-rose-50 text-rose-800'
            }`}
          >
            {emailTest.ok ? <CheckCircle2 size={16} className="mt-0.5 shrink-0" /> : <XCircle size={16} className="mt-0.5 shrink-0" />}
            <p>{emailTest.message}</p>
          </div>
        )}
      </form>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-ink">سجل تسليمات الـ Webhook الفعلية (آخر 20)</h3>
        {logs.length === 0 ? (
          <div className="table-shell flex items-center justify-center py-10 text-sm text-muted">
            لا يوجد سجل بعد — سيُملأ تلقائيًا عند اكتمال أو فشل معالجة مستندات حقيقية.
          </div>
        ) : (
          <div className="table-shell overflow-x-auto">
            <table>
              <thead>
                <tr>
                  <th>الحالة</th>
                  <th>رمز الحالة</th>
                  <th>الوقت</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log._id}>
                    <td>
                      <span className={`badge ${log.success ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                        {log.success ? 'نجح' : 'فشل'}
                      </span>
                    </td>
                    <td className="text-muted">{log.statusCode ?? '—'}</td>
                    <td className="text-muted">{new Date(log.createdAt).toLocaleString('ar-EG')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
