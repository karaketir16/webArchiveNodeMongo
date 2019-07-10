FROM node:10.15-alpine

WORKDIR /code

COPY . .

RUN npm install

EXPOSE 3000

CMD ["node", "test.js"]
