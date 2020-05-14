FROM node:8.7.0

RUN apt-get update \
    && apt-get install -qq build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev

RUN mkdir -p /opt/node/js \
    && cd /opt/node \
    && npm i canvas

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

CMD [ "npm", "start" ]
