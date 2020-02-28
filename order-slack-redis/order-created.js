//Event
order.created - v1

//Service Bindings: prefix
slack: slack
redis: redis
commerce: occ

//Env Variables
SITE: electronics
CHANNEL: orders

///Dependencies

{
    "name": "app",
    "version": "0.0.1",
    "dependencies": {
        "axios": "^0.18.1",
        "redis":  "2.8.0"
     }
}

//// Code

const axios = require("axios");
const Redis = require("redis");

module.exports = { main: async function (event, context) {

    const ordCode = event.data.orderCode
    console.log("received order: ", ordCode);
    
    const ordersUrl = `${process.env["occ-GATEWAY_URL"]}/${process.env.SITE}/orders/${ordCode}`;
    console.log("sending get to ", ordersUrl);
    
    const response = await axios.get(ordersUrl);
    console.log(JSON.stringify(response.data, null, 2));
    
    const ordValue = response.data.totalPriceWithTax.value;
    const msgText = `Order ${ordCode} with a value of ${ordValue} has been placed. \nSTATUS: Pending :stopwatch:`;
    
    const slackResponse = await slackMessage(msgText);
    if(slackResponse.ok){
        syncCache(ordCode, ordValue, slackResponse.ts, slackResponse.channel);
    }else{
        console.log(slackResponse);
    }

} }

async function slackMessage(msgText) {
    
    const channel = process.env.CHANNEL;
    const msg = {
        "channel": channel,
        "text": msgText,
    };
    
    console.log("posting to slack....", msg);
    const response =  await axios.post(`${process.env["slack-GATEWAY_URL"]}/chat.postMessage`, msg);
    console.log(response.data);
    return response.data;
}

function syncCache(ordCode, ordValue, ts, channel){
    console.log("posting to redis....");
    var ordDate = new Date();
    
    var redisClient = Redis.createClient({
        port:  process.env["redis-PORT"],
        host: process.env["redis-HOST"],
        password: process.env["redis-REDIS_PASSWORD"]
    });
            
    redisClient.on('connect', function() {
        redisClient.hmset(ordCode, 
        "Date", ordDate, 
        "LastUpdated", ordDate, 
        "slack_ts", ts,
        "slack_channel", channel,
        "Value", ordValue, 
        "Status", "Pending", 
        function(err, reply) {});
    });
    
   redisClient.on("error", function (err) {
        console.log("Redis createClient Error " + err);
    });
    
}