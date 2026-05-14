const { expo: base } = require('./app.json');

module.exports = {
  ...base,
  owner: 'ricardomendes95',
  android: {
    ...base.android,
    config: {
      googleMaps: {
        apiKey: process.env.GOOGLE_MAPS_API_KEY ?? '',
      },
    },
  },
};
