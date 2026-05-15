const { expo: base } = require('./app.json');

module.exports = {
  ...base,
  owner: 'ricardomendes95',
  plugins: [
    ...(base.plugins ?? []),
    './modules/pip-android/app.plugin.js',
  ],
  android: {
    ...base.android,
    config: {
      googleMaps: {
        apiKey: process.env.GOOGLE_MAPS_API_KEY ?? '',
      },
    },
  },
};
