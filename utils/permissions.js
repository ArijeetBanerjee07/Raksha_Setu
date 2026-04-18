import { Alert } from 'react-native';
import * as Location from 'expo-location';
import { Audio } from 'expo-av';

export const requestSafetyPermissionsAsync = () => {
  return new Promise((resolve) => {
    Alert.alert(
      "Safety First",
      "It's your safety. Raksha needs Location and Microphone permissions to protect you during an emergency.",
      [
        {
          text: "Cancel",
          style: "cancel",
          onPress: () => resolve(false)
        },
        {
          text: "Allow",
          onPress: async () => {
            try {
              let { status: locStatus } = await Location.requestForegroundPermissionsAsync();
              if (locStatus !== 'granted') {
                return resolve(false);
              }

              let { status: micStatus } = await Audio.requestPermissionsAsync();
              if (micStatus !== 'granted') {
                return resolve(false);
              }

              resolve(true);
            } catch (err) {
              resolve(false);
            }
          }
        }
      ],
      { cancelable: false }
    );
  });
};
