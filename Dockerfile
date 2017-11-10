FROM java:8
WORKDIR /pantry_bot
ADD . /pantry_bot

ENV AWS_ACCESS_KEY_ID AKIAINBP3H33VLG3NR3Q
ENV AWS_SECRET_ACCESS_KEY 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
ENV SLACK_AUTH_TOKEN xoxp-2568880035-150930617125-269036393216-f23af6360d86b32f50d7bce9f2b8c7bc
ENV BOT_SLACK_AUTH_TOKEN xoxb-269833408421-igNlUPGkM7DORZtBIzCZg8iJ
ENV SLACK_BOT_TOKEN xoxb-269833408421-igNlUPGkM7DORZtBIzCZg8iJ

RUN apt-get update 
# RUN apt-get apt-utils
# RUN apt-get -y install apt-transport-https curl
# RUN apt-get install ca-certificates
# RUN curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add -
# RUN echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list
RUN apt-get -y install nodejs
RUN apt-get -y install npm
RUN npm install -g yarn

RUN npm install n -g
RUN n stable
RUN ln -s /usr/bin/nodejs /usr/bin/node

RUN mkdir ~/.aws
RUN touch credentials
RUN echo "aws_access_key_id = AKIAINBP3H33VLG3NR3Q" >> credentials
RUN echo "aws_secret_access_key = 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" >> credentials
# RUN apt-get update && apt-get -y install yarn

CMD yarn start