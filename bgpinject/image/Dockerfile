FROM mikenowak/exabgp

ADD entrypoint.sh /
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
CMD ["exabgp"]
VOLUME ["/etc/exabgp"]
EXPOSE 179

