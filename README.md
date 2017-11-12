Pantry Slack Bot
---

Slack bot for retrieving real time snack supplies from your office kitchen using AWS data streams (Kinesis)

### Dev Notes:
Running the slack server:
```
yarn
yarn start
```

Running the container from Dockerfile:
```
sudo docker build -t pantry-bot .
sudo docker run -p 5000:5000 pantry-bot
```

### Useful links:
* https://api.slack.com/tutorials/watson-sentiment
* https://github.com/evansolomon/nodejs-kinesis-client-library