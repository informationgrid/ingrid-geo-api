#
# IMAGE: build server
#
FROM node:20.18.1-alpine3.20 AS server
LABEL stage=build

# install build dependencies
WORKDIR /opt/geo-conversion-api/server
COPY ./server/package*.json ./
RUN npm ci

# copy src files, build (transpile) server
COPY ./server .
RUN npm run build


#
# IMAGE: final
#
FROM node:20.18.1-alpine3.20 AS final

ARG version
ARG commitId
ARG buildTimestamp
ENV BUILD_VERSION=$version
ENV BUILD_COMMIT_ID=$commitId
ENV BUILD_DATE=$buildTimestamp

# copy init
COPY --from=building5/dumb-init:1.2.1 /dumb-init /usr/local/bin/

# install production dependencies
WORKDIR /opt/geo-conversion-api/server
COPY --chmod=755 ./server/package*.json ./
RUN npm run install-production

# copy built files from server and client
WORKDIR /opt/geo-conversion-api
COPY --chmod=755 --from=server /opt/geo-conversion-api/server/dist ./server
COPY --chmod=755 config.json README.md ./

EXPOSE 3000

USER node

WORKDIR /opt/geo-conversion-api/server
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]
