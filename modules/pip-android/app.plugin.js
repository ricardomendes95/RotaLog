const { withAndroidManifest } = require('@expo/config-plugins');

module.exports = function withPipAndroid(config) {
  return withAndroidManifest(config, (config) => {
    const activities = config.modResults.manifest.application[0].activity ?? [];
    const main = activities.find((a) => a.$['android:name'] === '.MainActivity');
    if (main) {
      main.$['android:supportsPictureInPicture'] = 'true';
      const existing = main.$['android:configChanges'] ?? '';
      const extras = ['screenSize', 'smallestScreenSize', 'screenLayout']
        .filter((s) => !existing.includes(s));
      if (extras.length) {
        main.$['android:configChanges'] = [existing, ...extras]
          .filter(Boolean)
          .join('|');
      }
    }
    return config;
  });
};
