FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx prisma generate
EXPOSE 3002
ENV PORT=3002 NODE_ENV=development
CMD ["npm", "run", "dev"]
