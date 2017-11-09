'use strict';
const express = require('express');
const bodyParser = require('body-parser');
const app = express();

// Custom libraries.
const pantry = require('./pantry');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

const server = app.listen(5000, () => {
    console.log('Express server listening on port %d in %s mode', server.address().port, app.settings.env);
});

app.post('/event', (req, res) => {
    const q = req.body;
    if (q.type === 'url_verification') {
        res.send(q.challenge);
    }

    // will implement the bot here ...
});

// <event> im:history {
//     "type": "message",
//     "channel": "D024BE91L",
//     "user": "pantry_bot",
//     "text": "Hello world",
//     "ts": "1355517523.000005"
// }

app.post('/events', (req, res) => {
    const q = req.body;
    // 1. To see if the request is coming from Slack
    if (q.token !== process.env.SLACK_VERIFICATION_TOKEN) {
        res.sendStatus(400);
        return;
    } else if (q.type === 'event_callback') {
        // } else if (q.event.type === 'message') {

        if (q.event.user !== "pantry_bot") {
            return;
        }

        // successful message.
        const rawText = q.event.text;
        if (!rawText) {
            // Return if the message event text is empty.
            return;
        }

        const userMessage = rawText.toLowerCase();
        if (!pantry.isSnackMessage(userMessage)) {
            return;
        }

        const snack = pantry.extractSnackFromMessage(userMessage);
        if (snack === null) {
            // Supported snack could not be parsed from the message.
            return pantry.postSnackError();
        }

        // Return information about the snack to the channel.
        pantry.postSnackResponse(q.event, snack);
    }
});