'use strict';
const express = require('express');
const bodyParser = require('body-parser');
const kcl = require('aws-kcl');

const app = express();

// Custom libraries.
const pantry = require('./pantry');
const stream = require('./stream');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

let newlineBuffer = new Buffer('\n')
const MAX_CACHE_SIZE = 50000000;
const PANTRY_USER = "U4ETCJ53P";
const processing = true;
const PORT = 5000;

const receivedTimestamps = new Set();

/* Start the Slack Server */

const server = app.listen(PORT, () => {
    console.log('\nNODE: Express server listening on port %d in %s mode', server.address().port, app.settings.env);
    if (processing) {
        // Start the record processor.
        const recordProcessor = stream.recordProcessor;
        kcl(recordProcessor).run();
    }
});

// <event> im:history {
//     "type": "message",
//     "channel": "D024BE91L",
//     "user": "pantry_bot",
//     "text": "Hello world",
//     "ts": "1355517523.000005"
// }

// userPantry: U4ETCJ53P

app.post('/events', (req, res) => {
    const q = req.body;
    // 1. To see if the request is coming from Slack
    // console.log('new event received: ' + JSON.stringify(q));
    const eventType = q['event']['type'];
    if (q.type === 'url_verification') {
        res.send(q.challenge);
        return;
    } else if (q.type === 'event_callback') {
        // console.log('user, pantry: ', q.event.user, PANTRY_USER)
        if (q.event.user !== PANTRY_USER || q.event.username === pantry.BOT_NAME) {
            return;
        }

        const eventTime = parseFloat(q.event.ts);
        const timeAgo = Date.now() / 1000 - eventTime;
        console.log(eventTime, timeAgo)

        if (receivedTimestamps.has(eventTime) || timeAgo > 5) {
            console.log(`filtered duplicate message (timeAgo: ${timeAgo} : ${JSON.stringify(q.event)}`);
            return;
        }

        receivedTimestamps.add(eventTime);
        // successful message.
        const rawText = q.event.text;
        // console.log("Pantrybot received message!: " + rawText);
        // console.log(JSON.stringify(q))

        if (!rawText) {
            // Return if the message event text is empty.
            return;
        }

        const userMessage = rawText.toLowerCase();
        if (pantry.isSupplyMessage(userMessage)) {

            const snack = pantry.extractSnackFromMessage(userMessage);
            if (snack === null) {
                // Supported snack could not be parsed from the message.
                return pantry.postSnackError("", q.event);
            }

            // Return information about the snack to the channel.
            // console.log(`Posting snack response to ${q.authed_users} for ${snack}`);
            pantry.postSnackResponse(q.event, snack);
        } else if (pantry.isOrderMessage(userMessage)) {
            const snack = pantry.extractSnackFromMessage(userMessage);
            if (snack === null) {
                // Supported snack could not be parsed from the message.
                return pantry.postSnackError("", q.event);
            }

            pantry.postOrderResponse(q.event, snack);
        } else {
            // else do nothing
        }
    }
});