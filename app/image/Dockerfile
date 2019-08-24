FROM node:10.15.3

RUN apt-get update && apt-get install -y gettext rsync curl git && rm -rf /var/lib/apt/lists/*

COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod a+x /docker-entrypoint.sh

WORKDIR /app
# See this thread https://unix.stackexchange.com/questions/158117/how-to-pass-environment-variables-to-a-non-interactive-shell-with-example
ENV BASH_ENV=/env-vars
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["bash", "-c", "node boot.js"]
