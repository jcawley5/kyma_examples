//Event
app.mention - v1

//Service Bindings: prefix
slack: slack
redis: redis

//Env Variables

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

module.exports = { main: function (event, context) {
    const userId =  event.data.event.user;
    const text = event.data.event.text;
    const msg = text.replace(/<.*?>/, "").trim();
    const ordCode = msg.match(/[0-9]+/g)[0];
    const status = msg.replace(ordCode, "");
    
    console.log(`user: ${userId} posted the message: ${msg}`);
    console.log(`ordNum: ${ordCode} status: ${status}`);
    
    syncCache(ordCode, status)
}}


async function updateSlack(ordCode, ts, channel, status, ordValue){
    //checkered_flag
    console.log("posting to slack....");
    
    const msgText = `Order ${ordCode} with a value of ${ordValue} status has changed. \nSTATUS: ${status}  :checkered_flag:`;
    const msg = {
        "channel": channel,
        "ts": ts,
        "text": msgText,
    };
    console.log(msg);
    const response =  await axios.post(`${process.env["slack-GATEWAY_URL"]}/chat.update`, msg);
    console.log(response.data);
    return response.data;
}


function syncCache(ordCode, status){
    console.log("updating redis....");
    var LastUpdated = new Date();
    
    var redisClient = Redis.createClient({
        port:  process.env["redis-PORT"],
        host: process.env["redis-HOST"],
        password: process.env["redis-REDIS_PASSWORD"]
    });
            
    redisClient.on('connect', function() {
        redisClient.hmset(ordCode, "LastUpdated", LastUpdated, "Status", status, function(err, reply) {
            console.log(reply);
            redisClient.hgetall(ordCode, function(err, resp) { 
                console.log(resp);
                updateSlack(ordCode, resp.slack_ts, resp.slack_channel, resp.Status, resp.Value);
            });
            
        });
    });
    
   redisClient.on("error", function (err) {
        console.log("Redis createClient Error " + err);
    });
    
}