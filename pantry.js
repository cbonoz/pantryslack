'use strict';
const library = (function () {
    const request = require('request');

    const SNACKS = ["figbar", "beef jerky"];
    const BOT_NAME = "Pantry Bot";

    const getRandom = (items) => {
        return items[Math.floor(Math.random() * items.length)];
    }

    const postResponse = (ev, message) => {
        const options = {
            method: 'POST',
            uri: 'https://slack.com/api/chat.postMessage',
            form: {
                token: 'xoxb-.....', // Your Slack OAuth token
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
        // TODO: retrieve information from kenesis about latest snack supply.
        const snackMessage = `${snack.toUpperCase()}: Need to link kinesis`;
    };

    function postSnackResponse(ev, snack) {
        const snackMessage = getSnackInformation(snack);
        postResponse(ev, snackMessage);
    }

    function isSnackMessage(text) {
        return !text && text.includes('snack');
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
        const errorMessage = `Correct format: "snack <SNACK>, where SNACK must be one of ${SNACKS}`;
        postMessage(errorMessage, ev);
    }

    return {
        getRandom: getRandom,
        postSnackResponse: postSnackResponse,
        isSnackMessage: isSnackMessage,
        extractSnackFromMessage: extractSnackFromMessage,
        postSnackError: postSnackError
    }

})();
module.exports = library;

