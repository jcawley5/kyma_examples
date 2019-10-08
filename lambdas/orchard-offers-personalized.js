// {
//     "name": "orchard-offers-personalized",
//     "version": "1.0.0",
//     "description": "Get personalized offers based on Leonardo ML Collaborative Filtering",
//     "main": "orchard-offers-personalized.js",
//     "keywords": [
//       "kyma"
//     ],
//     "dependencies": {
//       "axios": "^0.19.0",
//       "sap-leonardo":"^0.6.0"
//     }
//   }

const axios = require("axios");
const leonardo = require("sap-leonardo");

const {
  API_KEY,
  ACCESS_TOKEN,
  CONTENT_BASE_URL,
  COLLECTION,
  ENVIRONMENT,
  LEONARDO_BASE_URL,
  LEONARDO_MODEL,
  LEONARDO_API_KEY
} = process.env;

const CONTENT_URL = `${CONTENT_BASE_URL}/content_types/${COLLECTION}/entries/?environment=${ENVIRONMENT}&asc=order`;

SetupModel(leonardo, LEONARDO_BASE_URL, LEONARDO_API_KEY, LEONARDO_MODEL, null);

module.exports = {
  main: function(event, context) {
    return axios
      .get(CONTENT_URL, {
        headers: { api_key: API_KEY, access_token: ACCESS_TOKEN }
      })
      .then(response => {
        if (response.data && response.data.entries) {
          return leonardo.predictive.filter(response.data.entries);
        } else {
          // no results
          return [];
        }
      })
      .then(offers => {
        return { offers: offers.slice(0, 3) };
      })
      .catch(error => {
        console.log("AXIOSERROR", error);
        return { error: error.message || error };
      });
  }
};

function SetupModel(service, baseUrl, apiKey, model, authUser) {
  service.predictive = {
    model,
    options: { service, baseUrl, apiKey, authUser },
    filter: offers =>
      new Promise(resolve =>
        resolve(offers.filter(offer => offer.tags.indexOf("vegetarian") !== -1))
      )
  };
}
