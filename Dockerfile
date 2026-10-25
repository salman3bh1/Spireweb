# مرحلة البناء باستخدام Bun
FROM oven/bun:1 AS builder
WORKDIR /app

# نسخ ملفات الحزم والاعتماديات أولاً
COPY package.json bun.lock* ./
RUN bun install

# نسخ باقي ملفات المشروع وتنفيذ أمر البناء
COPY . .
RUN bun run build

# مرحلة التشغيل باستخدام Nginx
FROM nginx:alpine
WORKDIR /usr/share/nginx/html/

# مسح ملفات nginx الافتراضية
RUN rm -rf ./*

# نسخ الملفات الناتجة (في حال كانت داخل .output/public أو .output)
# سنقوم بنسخ مجلد public أو الـ dist الناتج حسب مسار Nitro
COPY --from=builder /app/.output/public /usr/share/nginx/html/
# أو إذا كان الناتج في مجلد dist التقليدي (يمكنك تعديل السطر حسب الحاجة):
# COPY --from=builder /app/dist /usr/share/nginx/html/

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]