# Use a node alpine image install packages and run the start script
# Runs as "node" user so any upload folders will need to be chown-ed
FROM node:14-alpine
EXPOSE 3000
ENV NODE_ENV production

RUN mkdir /app && chown -R node:node /app
COPY --chown=node ["package*.json", "/app/"]
USER node
WORKDIR /app

RUN npm ci
COPY --chown=node ["src", "/app/src"]
ENTRYPOINT ["node", "src/index.js"]
