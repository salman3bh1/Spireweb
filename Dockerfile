# 1. مرحلة البناء باستخدام Bun
FROM oven/bun:1 AS builder
WORKDIR /app

# نسخ ملفات الحزم وتثبيتها
COPY package.json bun.lock* ./
RUN bun install

# نسخ باقي الملفات وبناء المشروع
COPY . .
RUN bun run build

# 2. مرحلة التشغيل باستخدام Node.js
FROM node:20-alpine
WORKDIR /app

# نسخ نواتج بناء الخادم من مرحلة البناء
COPY --from=builder /app/.output ./.output

# تحديد المنفذ (Port) وغالباً يكون 3000 أو حسب إعدادات خادم Nitro
EXPOSE 3000
ENV PORT=3000
ENV HOST=0.0.0.0

# تشغيل خادم Node.js مباشرة
CMD ["node", ".output/server/index.mjs"]