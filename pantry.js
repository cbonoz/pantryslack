'use strict';
const library = (function () {
    const request = require('request');
    const stream = require('./stream');

    const SNACKS = {
        "fig bars": {
            unitWeight: undefined
        },
        "beef jerky": {
            unitWeight: undefined
        }
    };
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

    function formatDateTimeMs(date) {
        return `${date.toDateString()} ${date.toLocaleTimeString()}`;
    }

    function formatDateMs(date) {
        return `${date.toDateString()}`;
    }

    function formatTimeMs(date) {
        return `${date.toLocaleTimeString()}`;
    }

    function formatListOfSnackRecords(records) {
        var dataString = "";
        // {"units":"oz","amount":"-21.95","name":"fig_bars","time":1510252871000}
        var lastDate = null
        records.map((record) => {
            const currentDate = new Date(record['time'])
            if (lastDate === null || currentDate.getDay() !== lastDate.getDay()) {
                dataString += `\n*${formatDateMs(currentDate)}*`;
                lastDate = currentDate;
            }
            dataString += `\n${formatTimeMs(currentDate)}: ${record['amount']} ${record['units']}`;
            const snackEntry = SNACKS[record['name']];
            if (snackEntry !== undefined) {
                dataString += ` (~${record['amount'] / snackEntry['unitWeight']} pieces)`;
            }
        });
        return dataString;
    }

    const getSnackInformation = (snack) => {
        const recordMap = stream.recordProcessor.recordMap;;
        console.log("RECORDS:\n" % recordMap);
        var snackInformation;
        if (recordMap.hasOwnProperty(snack)) {
            snackInformation = formatListOfSnackRecords(recordMap[snack]);
        } else {
            // snackInformation = `No recent data for ${snack}`;
            snackInformation = JSON.stringify(recordMap);
        }
        const snackMessage = `Recent supply for *${snack.toUpperCase()}*: ${snackInformation}`;
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
        for (var snack in SNACKS) {
            if (SNACKS.hasOwnProperty(snack)) {
                if (text.includes(snack)) {
                    return snack;
                }
            }
        }
        return null;
    }

    function postSnackError(ev) {
        const errorMessage = `Correct format: "snack <SNACK>, where SNACK must be one of *${SNACKS.join(", ")}*`;
        postResponse(errorMessage, ev);
    }

    return {
        getRandom: getRandom,
        postSnackResponse: postSnackResponse,
        isSnackMessage: isSnackMessage,
        extractSnackFromMessage: extractSnackFromMessage,
        postSnackError: postSnackError,
        formatDateTimeMs: formatDateTimeMs,
        BOT_NAME: BOT_NAME
    }

})();
module.exports = library;

