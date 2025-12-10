#
# VARIABLES
#
ARG NODE_TAG=20.18.1-alpine3.20
ARG GDAL_TAG=alpine-small-3.10.1
ARG BUILD_DIR=/opt/ingrid/geo-api

#
# IMAGE: build server
#
FROM node:${NODE_TAG} AS server
LABEL stage=build

# install build dependencies
WORKDIR ${BUILD_DIR}/server
COPY ./server/package*.json ./
RUN npm ci

# copy src files, build (transpile) server
COPY ./server .
RUN npm run build


#
# IMAGE: final
#
FROM node:${NODE_TAG} AS final

ARG version
ARG commitId
ARG buildTimestamp
ENV BUILD_VERSION=$version
ENV BUILD_COMMIT_ID=$commitId
ENV BUILD_DATE=$buildTimestamp

# copy init
COPY --from=building5/dumb-init:1.2.1 /dumb-init /usr/local/bin/

# copy gdal
COPY --from=ghcr.io/osgeo/gdal:${GDAL_TAG} /usr/bin/ogr2ogr /usr/local/bin/
COPY --from=ghcr.io/osgeo/gdal:${GDAL_TAG} /usr/lib/ /usr/lib/

# install production dependencies
WORKDIR ${BUILD_DIR}/server
COPY --chmod=755 ./server/package*.json ./
RUN npm run install-production

# copy built files from server and client
WORKDIR ${BUILD_DIR}
COPY --chmod=755 --from=server ${BUILD_DIR}/server/dist ./server
COPY --chmod=755 config.json README.md ./

EXPOSE 3000

USER node

WORKDIR ${BUILD_DIR}/server
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]
