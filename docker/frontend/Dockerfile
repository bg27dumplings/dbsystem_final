FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

EXPOSE 3000

CMD ["sh", "-lc", "npm install && npm run dev -- --hostname 0.0.0.0"]
