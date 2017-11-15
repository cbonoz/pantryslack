Raspberry PI client code (with weight sensor connectivity logic):
---

### Dev Notes:
Command to connect raspberry PI to AWS IOT and Kinesis:<br/>
`python scale.py -t <topic to be published< -e <AWS IoT endpoint> -r <path/to/oroot CA file> -c <path/to/certificate> -k <path/to/private key>`