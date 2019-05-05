FROM alpine:3.9.3

RUN apk --no-cache add wget curl python3 python3-dev py3-setuptools coreutils netcat-openbsd bash \
    && apk --no-cache add py3-mysqlclient \
#    && apk --no-cache add build-dependencies build-base  \
    && mkdir -p /usr/etc/exabgp \
    && pip3 install ipaddr exabgp ipy requests
#    && apk del build-dependencies

ADD entrypoint.sh /
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
CMD ["exabgp"]
VOLUME ["/etc/exabgp"]
EXPOSE 179
