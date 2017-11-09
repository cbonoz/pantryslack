'use strict';
const library = (function () {
    const request = require('request');
    const stream = require('./stream');

    const SNACKS = ["fig bar", "beef jerky"];
    const BOT_NAME = "Pantry Bot";
    const SLACK_AUTH_TOKEN = process.env.SLACK_AUTH_TOKEN;
    // console.log('auth token: ' + SLACK_AUTH_TOKEN);

    const getRandom = (items) => {
        return items[Math.floor(Math.random() * items.length)];
    };

    const postResponse = (message, ev) => {
        // console.log(`postResponse: ${message}, channel: ${ev.channel}`);
        const options = {
            method: 'POST',
            uri: 'https://slack.com/api/chat.postMessage',
            form: {
                token: SLACK_AUTH_TOKEN, // Your Slack OAuth token
                channel: ev.channel,
                text: message,
                as_user: false,
                username: BOT_NAME
            }
        };
        // Use Request module to POST
        request(options, (error, response, body) => {
            if (error) {
                console.log(error)
            }
        });
    };

    const getSnackInformation = (snack) => {
        // TODO: retrieve information from kinesis about latest snack supply.
        const records =stream.recordProcessor.recordData;
        var snackInformation;
        if (records.hasOwnProperty(snack)) {
            snackInformation = records[snack];
        } else {
            snackInformation = `No data for ${snack}`;
        }
        const snackMessage = `${snack}: ${snackInformation}`;
        // console.log("getSnackInformation: " + snackMessage)
        return snackMessage;
    };

    function postSnackResponse(ev, snack) {
        const snackMessage = getSnackInformation(snack);
        postResponse(snackMessage, ev);
    }

    function isSnackMessage(text) {
        return text != null && text.includes('snack');
    }

    function extractSnackFromMessage(text) {
        for (var i in SNACKS) {
            const snack = SNACKS[i];
            if (text.includes(snack)) {
                return snack;
            }
        }
        return null;
    }

    function postSnackError(ev) {
        const errorMessage = `Correct format: "snack <SNACK>, where SNACK must be one of ${SNACKS.join(", ")}`;
        postResponse(errorMessage, ev);
    }

    return {
        getRandom: getRandom,
        postSnackResponse: postSnackResponse,
        isSnackMessage: isSnackMessage,
        extractSnackFromMessage: extractSnackFromMessage,
        postSnackError: postSnackError,
        BOT_NAME: BOT_NAME
    }

})();
module.exports = library;

