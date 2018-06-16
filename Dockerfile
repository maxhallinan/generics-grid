FROM node:10.1.0
COPY . /app
WORKDIR /app
RUN npm install
CMD ["npm","start"]
