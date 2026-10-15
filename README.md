# Nakha Restaurant — V6

نسخة معاد بناؤها بصريًا على أساس شاشات التصميم الأصلية المرفقة بالمشروع.

## التشغيل

```bash
npm install
npm run dev:full
```

ثم افتح:

`http://localhost:5173`

## الصور

ضع صورك داخل:

`src/assets/`

**لا تغيّر أسماء الملفات.** النظام يبحث عن الصور تلقائيًا بالـaliases.

## الخط

الموقع يستخدم Cairo بوزن 400–900 عبر Google Fonts. إذا كان لديك ملف الخط الأصلي من Figma، يمكن استبداله محليًا بدون تغيير هيكل الصفحات.

## قاعدة البيانات

تم استبدال تخزين الحسابات التجريبي بقاعدة **SQLite** محلية.

عند تشغيل الـbackend لأول مرة يتم إنشاء:

`server/nakha.db`

وتوجد جداول:

- `users` للحسابات
- `orders` للطلبات
- `messages` لرسائل التواصل

كلمات المرور لا تُحفظ كنص صريح؛ يتم تخزين hash باستخدام `scrypt` من Node.js.

## الـAPI

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/users`
- `GET /api/orders`
- `POST /api/orders`
- `POST /api/contact`
- `GET /api/messages`
- `GET /api/health`

## ملاحظات المطابقة

تمت إعادة بناء الـUI/UX للصفحات الرئيسية التالية بدل الاعتماد على الـlayout القديم:

- الرئيسية: الـfeatures أصبحت داخل صورة الـHero نفسها مثل التصميم الأصلي.
- من نحن: Hero + قصة + لماذا نكهة + الإحصائيات + قيمنا + الشيف + شريط الصور.
- مشترياتي: Hero بخلفية وصور + tabs + بطاقات الطلبات + شريط الخدمات.
- تواصل معنا: Hero بخلفية المطعم + صورة الطعام + معلومات الاتصال + الفروع + نموذج الرسالة + الشبكات الاجتماعية.
- إنشاء الحساب: شاشة مقسومة بخلفية مطعم ونموذج مطابق لفكرة التصميم الأصلي.
- المنيو: sidebar + banner + tabs + شبكة المنتجات.
- العروض: banner + tabs + شبكة 3 أعمدة + promo.
- المطاعم: شبكة مطاعم + لوحة تفاصيل جانبية.

## Owner/Admin account

The owner signs in from the **same customer login page** (`/account`). There is no separate admin button. The server stores the account role as `admin` and protects `/api/admin/*` on the backend.

Default local owner account on a fresh database:
- Email: `admin@nakha.local`
- Password: `NakhaAdmin@2026`

Change these for any real deployment using `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `ADMIN_NAME` in `.env` before the first server run.

## النشر

هذا الإصدار يعمل محليًا بقاعدة SQLite داخل `server/nakha.db`. لا تستخدم SQLite المحلية كقاعدة إنتاج على Vercel؛ نظام الملفات في وظائف Vercel مؤقت وقد تفقد الحسابات والطلبات بعد إعادة التشغيل.

للنشر الإنتاجي استخدم قاعدة PostgreSQL مستضافة مثل Neon عبر تكامل Vercel، ثم انقل طبقة التخزين في `server/index.js` إلى PostgreSQL قبل ربط الدومين. يمكن نشر الواجهة على Vercel، بينما يحتاج الـAPI الحالي إلى استضافة Node دائمة مثل Render أو Railway إذا بقي على SQLite.

قبل رفع المشروع إلى GitHub تأكد أن `.env` و`server/nakha.db` غير متتبعين. لا تضع كلمة مرور الأدمن أو مفاتيح OAuth داخل المستودع.

### What the owner can do
- See recent orders and customers.
- Change an order from `جديد` → `قيد التحضير` → `جاهز` → `جاري التوصيل` → `تم التسليم` or `تم الإلغاء`.
- Customer order status refreshes automatically every 5 seconds on the Purchases page.
- Add, edit, hide/show, and delete menu items.
- Change prices without changing source code.
- Set old prices and offer badges.
- Changes are stored in SQLite and the customer menu reads the active catalog from `/api/products`.
