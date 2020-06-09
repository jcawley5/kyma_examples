// DEPENDENCIES
// {
//   "name": "test2",
//   "version": "1.0.0",
//   "dependencies": {
//       "axios": "^0.18.0"
//   }
// }

//ENV VARS
//SITE: /electronics

const axios = require("axios");
const GATEWAY_URL = process.env["<GATEWAY_URL>"];

module.exports = {
  main: async function (event, context) {
    const { response, request } = event.extensions;
    const orderNum = request.query.orderNum;
    if (orderNum) {
      const orderResult = await getOrderDetails(orderNum);
      response.setHeader("Content-Type", "application/json");
      return orderResult;
    } else {
      return "no orderNum was received ....";
    }
  },
};
async function getOrderDetails(code) {
  const ordersUrl = GATEWAY_URL + process.env.SITE + "/orders/" + code;
  const response = await axios.get(ordersUrl);
  console.log(JSON.stringify(response.data, null, 2));
  return response.data;
}
