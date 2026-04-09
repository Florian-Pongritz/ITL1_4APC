FROM node:22

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 8100

CMD ["sh", "-c", "npx sequelize-cli db:migrate && node index.js"]
