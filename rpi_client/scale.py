'''
/*
 * Copyright 2010-2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License").
 * You may not use this file except in compliance with the License.
 * A copy of the License is located at
 *
 *  http://aws.amazon.com/apache2.0     
 *
 * or in the "license" file accompanying this file. This file is distributed
 * on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 * express or implied. See the License for the specific language governing
 * permissions and limitations under the License.
 *
 *
 * Lines 90 and above added by Jason Raffile (jraffile@gmail.com)
 * on 11/18/1 */
 '''

import RPi.GPIO as GPIO
import time
import os
import sys
from hx711 import HX711
import AWSIoTPythonSDK
sys.path.insert(0, os.path.dirname(AWSIoTPythonSDK.__file__))
from AWSIoTPythonSDK.MQTTLib import AWSIoTMQTTClient
import logging
import argparse
import json
from datetime import datetime, date

# Read in command-line parameters
parser = argparse.ArgumentParser()
parser.add_argument("-e", "--endpoint", action="store", required=True, dest="host", help="Your AWS IoT custom endpoint")
parser.add_argument("-r", "--rootCA", action="store", required=True, dest="rootCAPath", help="Root CA file path")
parser.add_argument("-c", "--cert", action="store", dest="certificatePath", help="Certificate file path")
parser.add_argument("-k", "--key", action="store", dest="privateKeyPath", help="Private key file path")
parser.add_argument("-w", "--websocket", action="store_true", dest="useWebsocket", default=False,
                    help="Use MQTT over WebSocket")
parser.add_argument("-id", "--clientId", action="store", dest="clientId", default="basicPubSub",
                    help="Targeted client id")
parser.add_argument("-t", "--topic", action="store", dest="topic", default="sdk/test/Python", help="Targeted topic")

args = parser.parse_args()
host = args.host
rootCAPath = args.rootCAPath
certificatePath = args.certificatePath
privateKeyPath = args.privateKeyPath
useWebsocket = args.useWebsocket
clientId = args.clientId
topic = args.topic

if args.useWebsocket and args.certificatePath and args.privateKeyPath:
    parser.error("X.509 cert authentication and WebSocket are mutual exclusive. Please pick one.")
    exit(2)

if not args.useWebsocket and (not args.certificatePath or not args.privateKeyPath):
    parser.error("Missing credentials for authentication.")
    exit(2)

# Configure logging
logger = logging.getLogger("AWSIoTPythonSDK.core")
logger.setLevel(logging.INFO)
streamHandler = logging.StreamHandler()
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
streamHandler.setFormatter(formatter)
logger.addHandler(streamHandler)

# Init AWSIoTMQTTClient
myAWSIoTMQTTClient = None

myAWSIoTMQTTClient = AWSIoTMQTTClient(clientId)
myAWSIoTMQTTClient.configureEndpoint(host, 8883)
myAWSIoTMQTTClient.configureCredentials(rootCAPath, privateKeyPath, certificatePath)

# AWSIoTMQTTClient connection configuration
myAWSIoTMQTTClient.configureAutoReconnectBackoffTime(1, 32, 20)
myAWSIoTMQTTClient.configureOfflinePublishQueueing(-1)  # Infinite offline Publish queueing
myAWSIoTMQTTClient.configureDrainingFrequency(2)  # Draining: 2 Hz
myAWSIoTMQTTClient.configureConnectDisconnectTimeout(10)  # 10 sec
myAWSIoTMQTTClient.configureMQTTOperationTimeout(10)  # 10 sec

# Connect and subscribe to AWS IoT
myAWSIoTMQTTClient.connect()

data = []

hx1 = HX711(3, 4)
hx1.set_reading_format("LSB", "MSB")
hx1.set_reference_unit(-36205) #scale 1
hx1.reset()
hx1.set_offset(8388607) #scale 1 offset

def cleanAndExit():
    print "Cleaning..."
    GPIO.cleanup()
    if myAWSIoTMQTTClient is not None:
        myAWSIoTMQTTClient.disconnect()
    print "Bye!"
    sys.exit()

def assembleMessage(name, amount, units):
    now = time.mktime(datetime.now().timetuple()) * 1000
    return json.dumps({'name' : name, 'amount' : amount, 'units' : units, 'time' : now})

def verifyData(scale):
    avg = 0
    val = int(round(scale.get_weight(5)))
    while val < 0:
        val = int(round(scale.get_weight(5)))
    #print "Value is " + str(val)
    #print "Data is " + str(data)
    if len(data) is not 0:
        avg = int(sum(data) / len(data))
    else:
        avg = val
    #print "Average is " + str(avg)
    within_limit = ((avg -1) <= val <= (avg +1))
    #print "Average within_limit?" + str(within_limit)
    data.append(val)
    if len(data) > 10:
        data.pop(0)
    if not within_limit:
        val = verifyData(scale)
    return val 

while True:
    try:
        val = verifyData(hx1)
        if val is not None:
            msg = assembleMessage('bagels', val, 'bagel')
            print "Sending {} to topic {}".format(msg, topic)
            myAWSIoTMQTTClient.publish(topic, msg, 1)
        else:
            print "Not sending null value"
#   Uncomment for debug
#	val = hx1.get_weight(5)
#	msg = assembleMessage('bagels', val, 'bagel')
#        print "Sending {} to topic {}".format(msg, topic)
        hx1.reset() 
        time.sleep(30)
    except (KeyboardInterrupt, SystemExit):
        cleanAndExit()
