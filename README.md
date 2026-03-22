# mini1-raksha-trigger

A fake Daily Recipes practice app built with React Native and Expo Go, designed to test a hidden SOS / security trigger mechanic ("Raksha Mode").

## Setup Instructions
To create and run this project from scratch:

1. Open your terminal in the target directory
2. Run `npm install` inside the project to clear out missing modules OR initialize `npx create-expo-app mini1-raksha-trigger` (but since files are already provided, run `npm install`)
3. Install required packages:
   ```bash
   npm install expo-router expo-av react-native-safe-area-context react-native-screens
   ```
4. Start the Expo development server:
   ```bash
   npx expo start
   ```

## How to Test the Volume Hold Trigger
1. Launch the app using Expo Go on your mobile device.
2. The UI will look like a completely normal recipe application.
3. Observe that we configured `Audio.setAudioModeAsync` alongside an `AppState` listener to intercept background states matching hardware patterns. 

## Expo Go Fallback (3-tap / Header Hold)
Expo Go acts as a sandboxed environment where capturing hardware volume keypress events directly is heavily restricted without ejecting to a custom dev client. 

**If volume detection doesn't work out-of-the-box in Expo Go**, use the included fallback triggers:
1. **Fallback 1 (Hold):** Press and continuously hold the Orange Header ("What's cooking today? 🍳") for exactly 4 seconds. Notice the thin red loading bar filling the bottom of the screen.
2. **Fallback 2 (3-Tap):** Rapidly tap the Orange Header three times.

Both fallbacks correctly intercept the same `useVolumeHoldTrigger` pipeline.

## How `useVolumeHoldTrigger.js` Works (Line by Line)
- `const [isHolding, setIsHolding] = useState(false);`
  Creates a state that flags whether the user is currently holding the trigger (helps UI show the thin red bar).
- `const [isRakshaMode, setIsRakshaMode] = useState(false);`
  State indicating if the trigger successfully completed and the Red Raksha screen should be drawn.
- `const holdTimerRef = useRef(null);`
  Holds an ID reference for the timer, allowing it to be securely cleared without causing a re-render.
- `const startHold = () => { ... }`
  When invoked (by hardware or the header wrapper fallback), resets `isHolding` to true, and launches a 4-second `setTimeout`. If it reaches the end, it sets `isRakshaMode = true`.
- `const cancelHold = () => { ... }`
  Called if the user releases early. Uses `clearTimeout` to destroy the timer and reset the state.
- `Audio.setAudioModeAsync({ ... })`
  Registers our background audio footprint allowing potential side effects measuring standard volume changes for React Native.
- `AppState.addEventListener(...)`
  Tracks whether the app pauses into the background.
- `DeviceEventEmitter.addListener('HEADER_TAP', ...)`
  A backup hook capturing an emitted event from `index.jsx`, implementing the rapid 3-tap logic requested as a reliable Expo workaround. Stops timeout if tapped successfully.
- `DeviceEventEmitter.addListener('HEADER_HOLD_START', ...)`
  Binds the custom UI `onPressIn` mechanism to `startHold` directly mapping as a 1:1 test replacement for volume buttons down.
