const fs = require('fs');
const path = require('path');
const { withDangerousMod } = require('@expo/config-plugins');
const { mergeContents } = require('@expo/config-plugins/build/utils/generateCode');

// react-native-firebase's Swift Package Manager integration (the RN 0.75+
// default) only ships an arm64 simulator slice and its automatic "link
// Firebase into the app target" step doesn't reliably run under EAS Build,
// producing "Undefined symbols ... _OBJC_CLASS_$_FIRApp" at link time.
// Opting back into the traditional CocoaPods resolution for Firebare avoids
// the whole class of SPM/arch issues (see node_modules/@react-native-firebase/app/README.md).
module.exports = function withDisableFirebaseSPM(config) {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');
      const contents = fs.readFileSync(podfilePath, 'utf-8');
      const result = mergeContents({
        tag: 'disable-firebase-spm',
        src: contents,
        newSrc: '$RNFirebaseDisableSPM = true',
        anchor: /^require /,
        offset: 0,
        comment: '#',
      });
      fs.writeFileSync(podfilePath, result.contents);
      return config;
    },
  ]);
};
