FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
COPY services ./services
COPY packages ./packages
RUN npm install
EXPOSE 4002
CMD ["npm", "--workspace", "verifier-service", "run", "start"]
