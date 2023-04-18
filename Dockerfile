FROM node
RUN npm install -g npm@9.5.0
RUN yarn add react-modal
RUN yarn add react-scripts
COPY ./socket-server /scrumpoker
WORKDIR /scrumpoker
RUN mkdir /scrumpoker/cache
RUN export npm_config_cache=/scrumpoker/cache
RUN chmod -R 777 scrumpoker
RUN npm start