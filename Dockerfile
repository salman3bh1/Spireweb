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

# نسخ نواتج بناء TanStack Start
COPY --from=builder /app/.output/public .

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]