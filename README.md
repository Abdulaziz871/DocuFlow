# DocuFlow AI — منصة الأتمتة الذكية للمستندات والعمليات

نظام Full-Stack لاستخراج البيانات من المستندات (PDF/صور) عبر الذكاء الاصطناعي (Google Gemini)،
تحويلها إلى JSON هيكلي، تطبيق قواعد بيزنس عليها، وتخزينها في MongoDB مع إشعار فوري عبر Webhook.

---

## 1. البنية العامة للمشروع (Project Structure)

```
DocuFlow/
├── backend/                     # Node.js + Express API
│   ├── src/
│   │   ├── config/              # env.js, db.js — إعداد البيئة والاتصال بقاعدة البيانات
│   │   ├── models/               # Mongoose schemas (User, Company, ApiKey, Document, Rule, WebhookLog)
│   │   ├── middleware/           # authJwt, authApiKey, roleCheck, upload, rateLimiter, errorHandler
│   │   ├── services/              # ocr.service, gemini.service, rulesEngine.service, webhook.service
│   │   ├── controllers/          # منطق كل مورد (auth, documents, rules, apiKeys, users, dashboard)
│   │   ├── routes/                # تعريف الـ Endpoints وربطها بالـ controllers
│   │   ├── utils/                 # ApiError, asyncHandler, logger, seedAdmin
│   │   ├── app.js                 # تركيب middleware + routes
│   │   └── server.js              # نقطة تشغيل السيرفر
│   ├── package.json
│   └── .env.example
│
└── frontend/                    # Next.js 14 (App Router) + TypeScript + Tailwind
    └── src/
        ├── app/
        │   ├── login/            # صفحة الدخول
        │   └── dashboard/        # نظرة عامة / المستندات / القواعد / مفاتيح API / المستخدمون
        ├── components/          # Sidebar, Topbar, StatCard, DocumentsTable, RuleCard, UploadDropzone
        ├── lib/                  # apiClient.ts (axios + JWT interceptor), auth.ts
        └── types/                # واجهات TypeScript المشتركة
```

**فلسفة التنظيم (Backend):** فصل صارم بين الطبقات — الـ **Routes** لا تحتوي منطقًا، الـ **Controllers**
تدير دورة الطلب/الاستجابة فقط، والـ **Services** تحمل منطق الأعمال القابل لإعادة الاستخدام (OCR، Gemini،
محرك القواعد، الـ Webhooks) بمعزل عن Express تمامًا — ما يسهّل اختبارها منفردة أو استبدالها لاحقًا.

---

## 2. تدفق العمل الكامل (Request → Response)

```
POST /api/v1/ingest  أو  /api/v1/documents/upload
        │
        ▼
1) authApiKey / authJwt  →  upload.js (multer: فحص النوع PDF/صورة + الحجم ≤ 10MB)  →  rateLimiter
        │
        ▼
2) ocr.service.js        →  استخراج النص الخام (pdf-parse للـ PDF، Tesseract.js للصور)
        │
        ▼
3) gemini.service.js     →  إرسال النص إلى Gemini (gemini-1.5-flash) مع Prompt صارم يفرض إخراج JSON فقط
        │
        ▼
4) rulesEngine.service.js →  تحميل قواعد الشركة النشطة وتقييم الشروط (equals/greaterThan/contains/...)
        │
        ▼
5) حفظ Document في MongoDB (status: completed | needs_review | failed)
        │
        ▼
6) webhook.service.js    →  POST إشعار فوري لعنوان Webhook الخاص بالشركة (مع تسجيل WebhookLog)
```

هذا التدفق بأكمله منظّم داخل دالة واحدة `processDocument()` في
`backend/src/controllers/documents.controller.js`، وتستخدمها كلٌّ من مسار الرفع اليدوي (JWT) ومسار
التكامل الخارجي (API Key) — بلا تكرار للكود.

---

## 3. الـ API Endpoints

| الطريقة | المسار | الحماية | الوصف |
|---|---|---|---|
| POST | `/api/v1/auth/register` | عام | تسجيل شركة جديدة + مستخدم Operations Manager |
| POST | `/api/v1/auth/login` | عام | تسجيل الدخول → JWT |
| GET  | `/api/v1/auth/me` | JWT | بيانات المستخدم الحالي |
| POST | `/api/v1/documents/upload` | JWT (Admin/Ops) | رفع مستند يدويًا من لوحة التحكم |
| GET  | `/api/v1/documents` | JWT | قائمة المستندات مع فلترة بالحالة |
| GET  | `/api/v1/documents/:id` | JWT | تفاصيل مستند |
| PATCH| `/api/v1/documents/:id/review` | JWT (Admin/Ops) | اعتماد/تعديل مستند بانتظار المراجعة |
| POST | `/api/v1/ingest` | **x-api-key** | نقطة الاستقبال الخارجية (الأنظمة/المطورون) |
| POST/GET/PUT/DELETE | `/api/v1/rules` | JWT (Admin/Ops) | إدارة قواعد العمل |
| POST/GET/DELETE | `/api/v1/api-keys` | JWT (Admin/Ops) | إصدار/سرد/إلغاء مفاتيح API |
| GET/PATCH | `/api/v1/users` | JWT (Admin فقط) | إدارة المستخدمين والأدوار |
| GET  | `/api/v1/dashboard/overview` | JWT | إحصائيات لوحة التحكم |
| GET  | `/health` | عام | فحص صحة الخدمة |

**تأمين مزدوج:** الواجهة (Dashboard) تستخدم **JWT** عبر `Authorization: Bearer <token>`، بينما الأنظمة
الخارجية/المطورون يستخدمون **API Key** عبر رأس `x-api-key` — كل مفتاح يُخزَّن كـ SHA-256 hash فقط
(القيمة الأصلية تظهر مرة واحدة عند الإنشاء).

---

## 4. الاتصال بـ MongoDB Atlas

الاتصال مركزي في `backend/src/config/db.js` باستخدام Mongoose:

```js
await mongoose.connect(process.env.MONGODB_URI);
```

خطوات الإعداد:
1. أنشئ Cluster مجاني على MongoDB Atlas.
2. أضِف مستخدم قاعدة بيانات (Database Access) وقيّد الوصول بالـ IP (Network Access) أو اسمح بكل عنوان `0.0.0.0/0` أثناء التطوير فقط.
3. انسخ رابط الاتصال والصقه في `backend/.env` ضمن `MONGODB_URI`.
4. شغّل `npm run seed:admin` لإنشاء أول شركة وحساب System Admin تلقائيًا.

جميع الـ Schemas (`models/*.js`) تستخدم `timestamps: true` وفهارس (`index`) على الحقول عالية الاستعلام
مثل `company` و `status` في `Document` لتحسين أداء لوحة التحكم مع نمو البيانات.

---

## 5. أدوار المستخدمين وربطها بالكود

| الدور (role في User) | الصلاحيات المطبّقة عبر `roleCheck.js` |
|---|---|
| `system_admin` | كل شيء + إدارة المستخدمين (`/users`) |
| `operations_manager` | رفع/مراجعة المستندات، إدارة القواعد، إصدار مفاتيح API |
| `developer` | استهلاك API فقط (عادة عبر `x-api-key` لا JWT) — قراءة حالة الطلبات |

مثال تطبيق الحماية في الراوت:
```js
router.use(protect, allowRoles('system_admin', 'operations_manager'));
```

---

## 6. الأمان (Security Middleware)

- **Helmet.js** — رؤوس HTTP آمنة افتراضيًا (`app.js`).
- **express-rate-limit** — 3 طبقات: عام (`apiLimiter`)، تسجيل الدخول (`authLimiter` أشد صرامة لمنع
  brute-force)، والاستقبال الخارجي (`ingestionLimiter` محسوب لكل API Key).
- **JWT** — صلاحية قابلة للتهيئة (`JWT_EXPIRES_IN`)، ويُرفض أي توكن لمستخدم `isActive: false`.
- **bcryptjs** — تجزئة كلمات المرور بـ 12 salt rounds قبل الحفظ (hook في `User.js`).
- **Multer fileFilter** — يرفض أي نوع ملف خارج PDF/PNG/JPG/WEBP، وحد أقصى 10MB.
- **API Key hashing** — لا يُخزَّن أي مفتاح API كنص صريح في القاعدة، فقط SHA-256 hash.

---

## 7. الهوية البصرية (تم تطبيقها حصريًا في `tailwind.config.ts`)

| اللون | الاستخدام |
|---|---|
| `#1B3C53` (primary) | الشريط الجانبي، البطاقات الرئيسية، عناوين قوية |
| `#234C6A` (secondary) | الأزرار، الحالات النشطة، الأيقونات |
| `#456882` (muted) | الحدود، النصوص الثانوية، الـ Badges |
| `#D2C1B6` (sand) | خلفية الصفحة، خلفيات الجداول وحقول الإدخال |

---

## 8. التشغيل محليًا

```bash
# 1) Backend
cd backend
cp .env.example .env      # ثم عبّئ MONGODB_URI و GEMINI_API_KEY و JWT_SECRET
npm install
npm run seed:admin        # ينشئ حساب System Admin أولي
npm run dev                # يعمل على http://localhost:5000

# 2) Frontend (في نافذة طرفية أخرى)
cd frontend
cp .env.local.example .env.local
npm install
npm run dev                # يعمل على http://localhost:3000
```

سجّل الدخول بالبيانات التي طبعها `seed:admin` (افتراضيًا `admin@docuflow.ai` / `ChangeMe123!` ما لم
تُغيّر `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`).

---

## 9. أفكار للتوسع القادم (خارج نطاق الـ MVP الحالي)

- معالجة غير متزامنة (Queue مثل BullMQ/Redis) للمستندات الكبيرة بدل الاستجابة المتزامنة الحالية.
- OCR للـ PDF الممسوح ضوئيًا (تحويل صفحات PDF إلى صور ثم Tesseract).
- صفحة Admin لسجلات النظام (System Logs) ومراقبة استهلاك الـ API لكل شركة.
- دعم OR groups في محرك القواعد (حاليًا AND فقط بين الشروط).
- اختبارات Jest/Supertest للـ Controllers والـ Services.
