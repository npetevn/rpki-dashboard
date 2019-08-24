FROM nginx:stable

RUN apt-get update && apt-get install openssl curl tar rsync -y && rm -rf /var/lib/apt/lists/*

COPY proxy.conf /etc/nginx/conf.d
