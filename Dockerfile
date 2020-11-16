FROM node:latest

WORKDIR /app

COPY . .

RUN npm install --silent

RUN npm run build --silent

EXPOSE 5000

CMD [ "node", "dist" ]