# 1. مرحلة البناء (Build Stage)
FROM node:20-alpine AS builder
WORKDIR /app

# نسخ ملفات الحزم وتثبيتها
COPY package.json ./
RUN npm install

# نسخ باقي ملفات المشروع وتنفيذ أمر البناء
COPY . .
RUN npm run build

# 2. مرحلة النشر والتشغيل (Production Stage)
FROM nginx:alpine
WORKDIR /usr/share/nginx/html/

# مسح ملفات nginx الافتراضية
RUN rm -rf ./*

# نسخ نواتج بناء TanStack Start
COPY --from=builder /app/.output/public .

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]