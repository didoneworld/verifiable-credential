FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
COPY services ./services
COPY packages ./packages
RUN npm install
EXPOSE 4001
CMD ["npm", "--workspace", "issuer-service", "run", "start"]
