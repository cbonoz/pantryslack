Pantry Slack Bot
---

Slack bot for retrieving real time snack supplies from your office kitchen using AWS data streams (Kinesis).

Bagels are the most frequently consumed product in our office. We set out to build a solution that would let you know how many bagels were in the office from your mobile or desktop in real time, from anywhere. 

No longer do our staff members live in wonder coming into the office over whether there will be bagels or not. Now they can slack a quick message to the office pantry bot and see if they need to make a pitstop at the local Starbucks on their morning commute.

### Technologies used.

Nodejs, Slack sdk, Aws-kcl (kinesis consumer), Mosquito (Raspberry pi MQTT broker)

We have the Raspberry Pi setup to sample from the tared (neutraled out with bin weight) stands as quickly as you can get data from the load cells. We take the average of these incoming measurements over 30 seconds and broker them to the AWS Kinesis backend.

On the slack side, we have a remote web server set up as a data consumer, which collects and stores the incoming measurements from the Kinesis stream. These measurements are then stored locally on the server and made available to end users in the office by communicating with the slack bot.


### Equipment

<ol>
    <li>5 kg load cells (compatible with Rpi)<li>
    <li>Screws, bearings, and plywood square cutouts for the stands</li>
    <li>Raspberry Pi Zero W (or equivalent)</li>
    <li>Plastic bins for each stand in the setup</li>
    <li>Wires and cabling</h4>
</ol>


### Images
<h4>Front of stand</h4>
<img src="./img/stand_front.jpg" style="margin: 0 auto; width: 300px; margin: 20px"/>
<h4>Right bin</h4>
<img src="./img/setup_right.jpg" style="margin: 0 auto; width: 300px; margin: 20px"/>
<h4>Dual measurement bin setup</h4>
<img src="./img/setup.jpg" style="margin: 0 auto; width: 300px; margin: 20px"/>
<h4>Slack bot conversation</h4>
<img src="./img/bagels.jpg" style="margin: 0 auto; width: 300px; margin: 20px"/>

### Dev Notes:
Running the slack server:
```
yarn
yarn start
```

Running the container from your local Dockerfile (using port 5000 as the default).
```
sudo docker build -t pantry-bot .
sudo docker run -p 5000:5000 pantry-bot
```

### Useful links:
* https://api.slack.com/tutorials/watson-sentiment
* https://github.com/evansolomon/nodejs-kinesis-client-library