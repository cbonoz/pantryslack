'use strict';
const library = (function () {
    const pluralize = require('pluralize')
    const request = require('request');

    const stream = require('./stream');

    const BOT_NAME = "Pantry Bot";
    const SLACK_AUTH_TOKEN = process.env.SLACK_AUTH_TOKEN;
    // console.log('auth token: ' + SLACK_AUTH_TOKEN);

    function _createSnack(lowSupplyThreshold, unitWeight, snackOrderUrl) {
        return {
            lowSupplyThreshold: lowSupplyThreshold,
            unitWeight: unitWeight,
            snackOrderUrl: snackOrderUrl
        };
    }

    const SNACKS = {
        // "bagels": _createSnack(undefined, undefined, 'https://www.amazon.com/Natures-Bakery-Whole-Wheat-Blueberry/dp/B006BHRU9U/'),
        "bagels": _createSnack(undefined, undefined, 'https://order-bagels.newyorkerbagels.com/')
    };

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
        if (records.length == 0) {
            return "No information available";
        }

        var dataString = "";
        // {"units":"oz","amount":"-21.95","name":"fig_bars","time":1510252871000}
        var lastDate = null
        records.map((record) => {
            const currentDate = new Date(record['time'])
            if (lastDate === null || currentDate.getDay() !== lastDate.getDay()) {
                dataString += `\n*${formatDateMs(currentDate)}*`;
                lastDate = currentDate;
            }
            dataString += `\n${formatTimeMs(currentDate)}: ${record['amount']} ${pluralize(record['units'], record['amount'])}`;
            const snackEntry = SNACKS[record['name']];
            if (snackEntry !== undefined && snackEntry['unitWeight']) {
                const count = (record['amount'] / snackEntry['unitWeight']);
                dataString += ` (~${count} ${pluralize('piece', count)}`;
            }
        });
        return dataString;
    }

    const getSnackInformation = (snack) => {
        const recordMap = stream.recordProcessor.recordMap;;
        console.log("RECORDS:\n" % recordMap);
        var snackInformation;
        if (recordMap.hasOwnProperty(snack)) {
            const snackRecords = recordMap[snack];
            snackInformation = formatListOfSnackRecords(snackRecords);
        } else {
            snackInformation = `\nNo recent data for ${snack}`;
            // snackInformation = JSON.stringify(recordMap);
        }
        const snackMessage = `Recent supply for *${snack.toUpperCase()}*: ${snackInformation}`;
        // console.log("getSnackInformation: " + snackMessage)
        return snackMessage;
    };

    const getOrderUrl = (snack) => {
        if (SNACKS[snack] !== undefined) {
            return SNACKS[snack]['snackOrderUrl'];
        }
        return undefined;
    }

    function postOrderResponse(ev, snack) {
        const orderUrl = getOrderUrl(snack);
        var orderMessage;
        if (orderUrl !== undefined) {
            orderMessage = `Order more ${snack} here ${orderUrl}`
        } else {
            orderMessage = `I'm not sure where to order that from.`
        }
        postResponse(orderMessage, ev);
    }

    function postSnackResponse(ev, snack) {
        const snackMessage = getSnackInformation(snack);
        postResponse(snackMessage, ev);
    }

    function isSupplyMessage(text) {
        return text != null && (text.includes('snack') || text.includes('supply') || text.includes('amount') || text.includes('count'));
    }

    function isOrderMessage(text) {
        return text != null && (text.includes('order') || text.includes('amazon'));
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

    function postSnackError(baseMessage, ev) {
        const errorMessage = `${baseMessage}Ask me about the current supply or to order *${Object.keys(SNACKS).join(", ")}*. Ex: supply bagels?`;
        postResponse(errorMessage, ev);
    }

    return {
        getRandom: getRandom,
        postSnackResponse: postSnackResponse,
        postOrderResponse: postOrderResponse,
        isOrderMessage: isOrderMessage,
        isSupplyMessage: isSupplyMessage,
        extractSnackFromMessage: extractSnackFromMessage,
        postSnackError: postSnackError,
        formatDateTimeMs: formatDateTimeMs,
        BOT_NAME: BOT_NAME
    }

})();
module.exports = library;

