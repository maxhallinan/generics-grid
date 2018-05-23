FROM node:10.1.0
COPY . /app
WORKDIR /app
RUN npm install
EXPOSE 80
CMD ["npm","start"]
