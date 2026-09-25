const { Resend } = require('resend');
const { resendApiKey, resendFromEmail } = require('../config/env');
const logger = require('../utils/logger');

const resend = resendApiKey ? new Resend(resendApiKey) : null;

function buildFailureEmail(document) {
  const subject = `DocuFlow AI — فشلت معالجة مستند: ${document.originalFileName}`;
  const html = `
    <div dir="rtl" style="font-family: Tahoma, Arial, sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color:#DC2626;">فشلت معالجة مستند</h2>
      <p><b>اسم الملف:</b> ${document.originalFileName}</p>
      <p><b>رسالة الخطأ:</b> ${document.errorMessage || 'غير معروف'}</p>
      <p><b>الوقت:</b> ${new Date().toLocaleString('ar-EG')}</p>
      <hr style="border:none;border-top:1px solid #E2E8F0;margin:16px 0;" />
      <p style="color:#64748B;font-size:13px;">راجع تفاصيل المستند من لوحة تحكم DocuFlow AI.</p>
    </div>
  `;
  return { subject, html };
}

// A few common extracted fields worth surfacing in the alert body, when present.
const HIGHLIGHT_FIELDS = ['vendorName', 'documentNumber', 'totalAmount', 'currency'];

function buildRuleMatchEmail(document, ruleNames) {
  const data = document.extractedData || {};
  const highlights = HIGHLIGHT_FIELDS.filter((f) => data[f] !== undefined && data[f] !== null)
    .map((f) => `<p><b>${f}:</b> ${data[f]}</p>`)
    .join('');

  const subject = `DocuFlow AI — تنبيه قاعدة عمل: ${document.originalFileName}`;
  const html = `
    <div dir="rtl" style="font-family: Tahoma, Arial, sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color:#4F46E5;">قاعدة عمل تطابقت مع مستند</h2>
      <p><b>اسم الملف:</b> ${document.originalFileName}</p>
      <p><b>القاعدة/القواعد المطابِقة:</b> ${ruleNames.join('، ')}</p>
      <p><b>الحالة الحالية:</b> ${document.status}</p>
      ${highlights}
      <p><b>الوقت:</b> ${new Date().toLocaleString('ar-EG')}</p>
      <hr style="border:none;border-top:1px solid #E2E8F0;margin:16px 0;" />
      <p style="color:#64748B;font-size:13px;">راجع المستند كاملًا من لوحة تحكم DocuFlow AI.</p>
    </div>
  `;
  return { subject, html };
}

async function deliver({ company, subject, html }) {
  if (!resend) return { skipped: true, reason: 'RESEND_API_KEY not configured' };
  if (!company.alertEmail) return { skipped: true, reason: 'no alertEmail set' };

  try {
    const result = await resend.emails.send({ from: resendFromEmail, to: company.alertEmail, subject, html });
    if (result.error) throw new Error(result.error.message);
    return { success: true, id: result.data?.id };
  } catch (err) {
    logger.warn(`Email alert failed for company ${company._id}: ${err.message}`);
    return { success: false, error: err.message };
  }
}

/**
 * Sends a "document failed" alert email via Resend. Silently no-ops (never throws) when
 * RESEND_API_KEY isn't configured or the company hasn't set an alertEmail — email alerts
 * are an optional layer on top of the webhook, not a required part of the pipeline.
 */
async function sendFailureAlert({ company, document }) {
  return deliver({ company, ...buildFailureEmail(document) });
}

// Fired when one or more active rules match a document with a `sendEmailAlert` action —
// e.g. "if totalAmount > 5000, email me". Sends one email per document summarizing every
// matched rule with that action, rather than one email per rule.
async function sendRuleMatchAlert({ company, document, ruleNames }) {
  return deliver({ company, ...buildRuleMatchEmail(document, ruleNames) });
}

module.exports = { sendFailureAlert, sendRuleMatchAlert, buildFailureEmail, buildRuleMatchEmail };
