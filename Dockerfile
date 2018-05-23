FROM node:10.1.0
COPY . /app
WORKDIR /app
RUN yarn
CMD ["yarn","start"]
