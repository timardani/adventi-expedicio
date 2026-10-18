# Adventi expedíció – statikus demó (1. fázis). Coolify: Build Pack = Dockerfile, Base Directory = /web, port 80.
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
# a linkelőnézet képének teljes címe, pl. https://adventi-demo.lupix.hu/ (Coolify: Build Variable)
ARG PUBLIC_URL=""
ENV PUBLIC_URL=$PUBLIC_URL
RUN npm test && npm run build

FROM nginx:1.29-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
