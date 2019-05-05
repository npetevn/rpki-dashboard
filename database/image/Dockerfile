FROM postgres:9.6

RUN apt-get update && \
    apt-get install -y wget ruby ruby-dev postgresql-server-dev-9.6 make gcc git automake && \
    apt-get install -y libbz2-1.0 libbz2-dev libz-dev zlib1g-dev && \
    ln -s /usr/bin/aclocal-1.15 /usr/bin/aclocal-1.14 && \
    ln -s /usr/bin/automake-1.15 /usr/bin/automake-1.14 && \
    rm -rf /var/lib/apt/lists/*

RUN gem install pg

RUN mkdir -p /collector/scripts && mkdir -p /collector/data

RUN git clone https://github.com/yasuhiro-ohara-ntt/bgpdump2.git && \
    cd bgpdump2 && \
    ./configure && \
    make && \
    make install

COPY init-user-db.sh /docker-entrypoint-initdb.d/
RUN chmod a+x /docker-entrypoint-initdb.d/init-user-db.sh
