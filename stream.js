'use strict';
const library = (function () {
    const request = require('request');
    const util = require('util');

    const MAX_RECORDS = 25;

    // Allow persistent local json storage on server for later access.
    const low = require('lowdb')
    const FileSync = require('lowdb/adapters/FileSync')
    const adapter = new FileSync('db.json')
    const db = low(adapter)

    // Initialize empty records list in local db.
    db.defaults({ records: [], }).write()

    /**
     * The record processor must provide three functions:
     * * `initialize` - called once
     * * `processRecords` - called zero or more times
     * * `shutdown` - called if this KCL instance loses the lease to this shard
     */
    const recordProcessor = {

        /* Cache for stored snack room data. */
        recordMap: {},

        // Custom record processing logic.
        _addRecord: function(record) {
            console.log("addRecord: " + JSON.stringify(record));
            record['name'] = record['name'].toLowerCase();
            if (!this.recordMap.hasOwnProperty(record["name"])) {
                this.recordMap[record["name"]] = []
            }

            this.recordMap[record["name"]].push(record);
            if (this.recordMap[record["name"]].length > MAX_RECORDS) {
                this.recordMap[record["name"]] = this.recordMap[record["name"]].slice(1);
            }
            // Add a measurement record to the local db.
            db.get('records').push(record).write()
        },

        initialize: function (initializeInput, completeCallback) {
            // Initialization logic ...
            completeCallback();
        },

        processRecords: function (processRecordsInput, completeCallback) {
            if (!processRecordsInput || !processRecordsInput.records) {
                // Must call completeCallback to proceed further.
                completeCallback();
                return;
            }

            var records = processRecordsInput.records;
            var record, sequenceNumber, partitionKey, data;
            for (var i = 0; i < records.length; ++i) {
                record = records[i];
                sequenceNumber = record.sequenceNumber;
                partitionKey = record.partitionKey;
                // Note that "data" is a base64-encoded string. Buffer can be used to
                // decode the data into a string.
                const rawData = new Buffer(record.data, 'base64').toString();

                // Parse the raw record data from the stream.
                const data = JSON.parse(rawData);
                this._addRecord(data);
            }
            if (!sequenceNumber) {
                // Must call completeCallback to proceed further.
                completeCallback();
                return;
            }
            // If checkpointing, only call completeCallback once checkpoint operation
            // is complete.
            processRecordsInput.checkpointer.checkpoint(sequenceNumber,
                function (err, checkpointedSequenceNumber) {
                    // In this example, regardless of error, we mark processRecords
                    // complete to proceed further with more records.
                    completeCallback();
                }
            );
        },
        shutdown: function (shutdownInput, completeCallback) {
            // Shutdown logic ...
            if (shutdownInput.reason !== 'TERMINATE') {
                completeCallback();
                return;
            }
            // Since you are checkpointing, only call completeCallback once the checkpoint
            // operation is complete.
            shutdownInput.checkpointer.checkpoint(function (err) {
                // In this example, regardless of error, we mark the shutdown operation complete.
                completeCallback();
            });
        }
    };

    return {
        recordProcessor: recordProcessor
    }

})();
module.exports = library;

