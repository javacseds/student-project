FROM node:20-alpine

# Install runtimes for compiled runs (Java and Python)
RUN apk update && apk add --no-cache openjdk21 python3 build-base

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY tsconfig.json ./
COPY src/ ./src/
COPY ../shared/ ../shared/

RUN npm run build

EXPOSE 5000

ENV PORT=5000
ENV NODE_ENV=production

CMD ["npm", "start"]
