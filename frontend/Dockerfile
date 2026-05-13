FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3001
ENV PORT=3001 NODE_ENV=development
CMD ["npm", "run", "dev"]
