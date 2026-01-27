# منيو سعود (Menu Saud)

موقع احترافي جاهز للنشر:
- ✅ منيو إلكتروني `/menu`
- ✅ صانع منيو + رابط مشاركة + QR `/builder`
- ✅ خدمات `/services`
- ✅ باقات `/packages`
- ✅ أعمال `/work`
- ✅ تواصل `/contact`
- ✅ تصميم أزرق/أبيض + أنميشن (Framer Motion) + أيقونات (Lucide)

## التشغيل محلياً
```bash
npm install
npm run dev
```
ثم افتح: http://localhost:3000

## تعديل المحتوى بسرعة
عدّل ملفات JSON داخل مجلد `data/`:
- `data/menu.json`
- `data/services.json`
- `data/packages.json`
- `data/work.json`
- `data/site.json`

## رفعه على GitHub
```bash
git init
git add .
git commit -m "Menu Saud initial"
git branch -M main
git remote add origin https://github.com/USERNAME/REPO.git
git push -u origin main
```

## النشر على Vercel
اربط الريبو في Vercel ثم Deploy.

> ملاحظة: صانع المنيو يولد رابط مشاركة عبر `base64` داخل الرابط. للمنيوهات الكبيرة جدًا قد يطول الرابط.
