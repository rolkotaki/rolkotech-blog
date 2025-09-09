FROM node:22.16.0 as build

COPY . /app/
WORKDIR /app/frontend/

RUN npm install

ARG BACKEND_HOST
ARG API_VERSION_STR

RUN npm run build

FROM nginx:1

COPY --from=build /app/frontend/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY frontend/nginx-backend-not-found.conf /etc/nginx/extra-conf.d/backend-not-found.conf
