// {
//     "name": "app",
//     "version": "0.0.1",
//     "dependencies": {
//         "redis":  "2.8.0"
//      }
// }

const Redis = require("redis");

module.exports = {
  main: function(event, context) {
    console.log("hello from order created");
    console.log("Received data: ", event.data);

    var orderCode = event.data.orderCode;
    var orderDate = new Date().toISOString().split("T")[0] + "_orders";

    console.log("will send data: ", orderDate);
    console.log("will send data: ", orderCode);

    var redisClient = Redis.createClient({
      port: process.env.PORT,
      host: process.env.HOST,
      password: process.env.REDIS_PASSWORD
    });

    redisClient.on("connect", function() {
      redisClient.rpush([orderDate, orderCode], function(err, reply) {});
    });

    redisClient.on("error", function(err) {
      console.log("Redis createClient Error " + err);
    });
  }
};
