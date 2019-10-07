// {
//     "dependencies": {
//         "request": "^2.85.0",
//         "axios": "^0.18.0",
//         "json-pretty-html": "1.1.6"
//       }
// }

const axios = require("axios");
const prettyHtml = require("json-pretty-html").default;

module.exports = {
  main: async function(event, context) {
    console.log("order-details");

    var request = event.extensions.request;
    var orderNum = request.query.orderNum;

    console.log(orderNum);

    if (orderNum) {
      var orderResult = await getOrderDetails(orderNum);
      return prettyHtml(orderResult);
    } else {
      return "no orderNum was received ....";
    }
  }
};

async function getOrderDetails(code) {
  const ordersUrl = process.env.GATEWAY_URL + "/electronics/orders/" + code;
  console.log("orderUrl: %s", ordersUrl);
  const response = await axios.get(ordersUrl);
  console.log(JSON.stringify(response.data, null, 2));
  return response.data;
}
