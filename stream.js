'use strict';
const library = (function () {
    const request = require('request');
    const kcl = require('aws-kcl');
    const util = require('util');

    /**
     * The record processor must provide three functions:
     *
     * * `initialize` - called once
     * * `processRecords` - called zero or more times
     * * `shutdown` - called if this KCL instance loses the lease to this shard
     *
     * Notes:
     * * All of the above functions take additional callback arguments. When one is
     * done initializing, processing records, or shutting down, callback must be
     * called (i.e., `completeCallback()`) in order to let the KCL know that the
     * associated operation is complete. Without the invocation of the callback
     * function, the KCL will not proceed further.
     * * The application will terminate if any error is thrown from any of the
     * record processor functions. Hence, if you would like to continue processing
     * on exception scenarios, exceptions should be handled appropriately in
     * record processor functions and should not be passed to the KCL library. The
     * callback must also be invoked in this case to let the KCL know that it can
     * proceed further.
     */
    const recordProcessor = {

        /* Cache for stored snack room data. */
        recordData: {},

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

                // Custom record processing logic below.

                const data = JSON.parse(rawData);
                console.log("DATA: " + JSON.stringify(data));
                data['name'] = data['name'].toLowerCase();
                if (this.recordData.hasOwnProperty(data["name"])) {
                    this.recordData[data["name"]].push(data);
                } else {
                    this.recordData[data["name"]] = [data];
                }

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
                // In this example, regardless of error, we mark the shutdown operation
                // complete.
                completeCallback();
            });
        }
    };

    return {
        recordProcessor: recordProcessor
    }

})();
module.exports = library;

