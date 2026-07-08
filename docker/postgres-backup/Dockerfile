FROM alpine:3.23

RUN apk add --no-cache \
      ca-certificates \
      postgresql16-client \
      rclone \
    && addgroup -S -g 65532 backup \
    && adduser -S -D -H -u 65532 -G backup backup

COPY backup.sh /usr/local/bin/postgres-r2-backup

RUN chmod 0755 /usr/local/bin/postgres-r2-backup

USER 65532:65532

ENV HOME=/tmp

ENTRYPOINT ["/usr/local/bin/postgres-r2-backup"]
