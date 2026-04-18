import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';

export async function startRecording() {
  try {
    const perm = await Audio.getPermissionsAsync();
    if (perm.status !== 'granted') return null;

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });

    const { recording } = await Audio.Recording.createAsync(
      Audio.RecordingOptionsPresets.HIGH_QUALITY
    );
    return recording;
  } catch (error) {
    return null;
  }
}

export async function stopAndGetUri(recording) {
  if (!recording) return null;
  try {
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    return uri;
  } catch (error) {
    return null;
  }
}

export async function discardRecording(recording) {
  try {
    if (recording) {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      if (uri) {
        await FileSystem.deleteAsync(uri, { idempotent: true });
      }
    }
  } catch (error) {
    // catch all errors silently
  }
}
