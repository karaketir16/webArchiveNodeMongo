FROM node:10.15-alpine

WORKDIR /code
COPY package-lock.json .

COPY package.json .

RUN apk --update --no-cache --virtual build-dependencies add \
    python \
    make \
    g++ \
    && npm install --only=production && npm cache clean --force \
    && apk del build-dependencies

COPY . .

EXPOSE 3000

CMD ["node", "test.js"]
