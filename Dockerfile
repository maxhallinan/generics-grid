FROM node:10.1.0
COPY . /app
WORKDIR /app
RUN yarn
EXPOSE 80
CMD ["yarn","start"]
