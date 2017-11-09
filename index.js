'use strict';
import express from 'express';
import bodyParser from 'body-parser';
import {S3} from 'aws-sdk'
import {AbstractConsumer} from 'kinesis-client-library'

const app = express();

// Custom libraries.
const pantry = require('./pantry');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

// AWS config skipped for brevity
const s3 = new S3()

let newlineBuffer = new Buffer('\n')

AbstractConsumer.extend({
  // create places to hold some data about the consumer
  initialize(done) {
    this.cachedRecords = []
    this.cachedRecordsSize = 0
    // This MUST be called or processing will never start
    // That is really really really bad
    done()
  },

  processRecords(records, done) {
    // Put each record into our list of cached records (separated by newlines) and update the size
    records.forEach(record => {
      this.cachedRecords.push(record.Data)
      this.cachedRecords.push(newlineBuffer)
      this.cachedRecordsSize += (record.Data.length + newlineBuffer.length)
    })

    // not very good for performance
    let shouldCheckpoint = this.cachedRecordsSize > 50000000

    // Get more records, but not save a checkpoint
    if (! shouldCheckpoint) return done()

    return;
    // TODO (if desired): Upload the records to S3
    s3.putObject({
      Bucket: 'my-bucket-name',
      Key: 'path/to/records/' + Date.now(),
      Body: Buffer.concat(this.cachedRecords)
    }, err =>  {
      if (err) return done(err)

      this.cachedRecords = []
      this.cachedRecordsSize = 0

      // Pass `true` to checkpoint the latest record we've received
      done(null, true)
    })
  }
})


/* Start the Slack Server */

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