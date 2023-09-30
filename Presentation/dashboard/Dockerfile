##### build env #####
FROM node:lts-alpine as builder

ENV NODE_ENV=production
ENV WDS_SOCKET_PORT=0

WORKDIR /app

COPY ["package.json", "package-lock.json*", "npm-shrinkwrap.json*", "./"]

RUN npm install --production --silent && mv node_modules ../

COPY . .

RUN npm run build

##### production env #####
FROM nginx:1.25.0-alpine as production

ENV NODE_ENV=production

# copy 'build' content from builder
COPY --from=builder /app/build /usr/share/nginx/html

# replace nginx.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
