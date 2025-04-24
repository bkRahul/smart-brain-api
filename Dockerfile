FROM node:lts-alpine

# Create app directory
WORKDIR /usr/src/smart-brain-api

# Install app dependencies
COPY ./ ./
RUN npm install

# # Bundle app source
# COPY . /usr/src/smart-brain-api

EXPOSE 3000
CMD ["/bin/sh"]
