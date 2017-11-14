'use strict';
const library = (function () {
    const pluralize = require('pluralize')
    const request = require('request');

    const stream = require('./stream');

    const BOT_NAME = "Pantry Bot";
    const SLACK_AUTH_TOKEN = process.env.SLACK_AUTH_TOKEN;
    const recordMap = stream.recordProcessor.recordMap;

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

    const getSnackFromMessage = (text) => {
        for (var snack in SNACKS) {
            if (SNACKS.hasOwnProperty(snack)) {
                if (text.includes(snack)) {
                    return snack;
                }
            }
        }
        return null;
    }

    function formatDateTimeMs(date) {
        return `${date.toDateString()} ${date.toLocaleTimeString()}`;
    }

    function _formatDateMs(date) {
        return `${date.toDateString()}`;
    }

    function _formatTimeMs(date) {
        return `${date.toLocaleTimeString()}`;
    }

    function _formatDataMessage(records) {
        if (records.length == 0) {
            return "No information available";
        }

        var dataString = "";
        // {"units":"bagel","amount":"22","name":"bagels","time":1510252871000}
        var lastDate = null
        records.map((record) => {
            const currentDate = new Date(record['time'])
            if (lastDate === null || currentDate.getDay() !== lastDate.getDay()) {
                dataString += `\n*${_formatDateMs(currentDate)}*`;
                lastDate = currentDate;
            }
            dataString += `\n${_formatTimeMs(currentDate)}: ${record['amount']} ${pluralize(record['units'], record['amount'])}`;
            const snackEntry = SNACKS[record['name']];
            if (snackEntry !== undefined && snackEntry['unitWeight']) {
                const count = (record['amount'] / snackEntry['unitWeight']);
                dataString += ` (~${count} ${pluralize('piece', count)}`;
            }
        });
        return dataString;
    }

    function _formatSupplyMessage(records) {
        if (records.length == 0) {
            return "No information available";
        }

        const recentRecordLimit = Math.min(records.length, 5);

        var dataString = "";
        // {"units":"bagel","amount":"22","name":"bagels","time":1510252871000}
        var lastDate = null
        // reverse the records list.
        const reversed = records.slice(0).reverse();
        var windowAverage = 0;
        var i;

        // Calculate message for average measurement over the last recentRecordLimit measurements.
        const recentRecords = reversed.slice(0, recentRecordLimit);
        for (i = 0; i < recentRecords.length; i++) {
            const record = recentRecords[i];
            windowAverage += record['amount'];
        }
        
        windowAverage = Math.round(windowAverage / recentRecordLimit);
        const currentDate = new Date(records[0]['time'])
        const unitType = reversed[0]['units'];
        if (recentRecordLimit == 1) {
            dataString += `\nLast Reading ${_formatTimeMs(currentDate)}: ${windowAverage} ${pluralize(unitType, windowAverage)}`;
        } else {
            dataString += `\nAverage of last ${recentRecordLimit} readings ending ${_formatTimeMs(currentDate)}: ${windowAverage} ${pluralize(unitType, windowAverage)}`; //, ${recentRecords}`;
        }

        const snackEntry = SNACKS[records[0]['name']];
        if (snackEntry !== undefined && snackEntry['unitWeight']) {
            const count = Math.round(record['amount'] / snackEntry['unitWeight']);
            dataString += ` (~${count} ${pluralize('piece', count)}`;
        }

        // Check for most recent higher value.
        for (; i < reversed.length; i++) {
            const record = reversed[i];
            if (record['amount'] > windowAverage) {
                const lastHigherDate = new Date(record['time']);
                dataString += `\nThe last ${unitType} was taken around ${_formatTimeMs(lastHigherDate)}`;
            }
        }
        return dataString;
    }

    const _getSnackDataMessage = (snack) => {
        console.log("RECORDS:\n" % recordMap);
        var snackInformation;
        if (recordMap.hasOwnProperty(snack)) {
            // Most recent entries at end.
            const snackRecords = recordMap[snack];
            snackInformation = _formatDataMessage(snackRecords);
        } else {
            snackInformation = `\nNo recent data for ${snack}`;
            // snackInformation = JSON.stringify(recordMap);
        }
        const snackMessage = `Recent data for *${snack.toUpperCase()}*: ${snackInformation}`;
        // console.log("_getSnackDataMessage: " + snackMessage)
        return snackMessage;
    };

    const _getSnackSupplyMessage = (snack) => {
        console.log("RECORDS:\n" % recordMap);
        var snackInformation;
        if (recordMap.hasOwnProperty(snack)) {
            // Most recent entries at end.
            const snackRecords = recordMap[snack];
            snackInformation = _formatSupplyMessage(snackRecords);
        } else {
            snackInformation = `\nNo recent supply for ${snack}`;
            // snackInformation = JSON.stringify(recordMap);
        }
        const snackMessage = `Recent supply for *${snack.toUpperCase()}*: ${snackInformation}`;
        // console.log("_getSnackDataMessage: " + snackMessage)
        return snackMessage;
    }

    const _getOrderUrl = (snack) => {
        if (SNACKS[snack] !== undefined) {
            return SNACKS[snack]['snackOrderUrl'];
        }
        return undefined;
    }

    /* Data Routes for Slack query responses */

    function postOrderResponse(ev, snack) {
        const orderUrl = _getOrderUrl(snack);
        var snackMessage;
        if (orderUrl !== undefined) {
            snackMessage = `Order more ${snack} here ${orderUrl}`
        } else {
            snackMessage = `I'm not sure where to order that from.`
        }
        _postResponse(ev, snackMessage);
    }

    //
    function postSupplyResponse(ev, snack) {
        const snackMessage = _getSnackSupplyMessage(snack);
        _postResponse(ev, snackMessage);
    }

    // Return the recent measurements on bagels (unfiltered).
    function postDataResponse(ev, snack) {
        const snackMessage = _getSnackDataMessage(snack);
        _postResponse(ev, snackMessage);
    }

    /* Generic Message Error handler */
    function postSnackError(ev, baseMessage) {
        const errorMessage = `${baseMessage} - Ask me about the current supply, all data, or ordering information for *${Object.keys(SNACKS).join(", ")}*. Ex: supply bagels?`;
        _postResponse(ev, errorMessage);
    }

    function isSupplyMessage(text) {
        return text != null && (text.includes('snack') || text.includes('supply') || text.includes('amount') || text.includes('count'));
    }

    function isDataMessage(text) {
        return text != null && (text.includes('data') || text.includes('all') || text.includes('stream'));
    }

    function isOrderMessage(text) {
        return text != null && (text.includes('order') || text.includes('amazon'));
    }

    /* Universal Message Response handler (post message param back to slack channel). */

    const _postResponse = (ev, message) => {
        console.log(`_postResponse: ${message}, channel: ${ev.channel}`);
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

    return {
        getRandom: getRandom,
        postDataResponse: postDataResponse,
        postOrderResponse: postOrderResponse,
        postSupplyResponse: postSupplyResponse,
        isOrderMessage: isOrderMessage,
        isDataMessage: isDataMessage,
        isSupplyMessage: isSupplyMessage,
        getSnackFromMessage: getSnackFromMessage,
        postSnackError: postSnackError,
        formatDateTimeMs: formatDateTimeMs,
        BOT_NAME: BOT_NAME
    }

})();
module.exports = library;

