# Raksha Setu 🛡️ (Disguised as "Dish It Up")

**A production-grade, stealth safety application disguised as a recipe manager.** Safety isn't an afterthought, and your security shouldn't broadcast itself. Raksha provides a powerful panic and safety toolkit hidden underneath a fully-functional, beautiful recipe application.

## 📱 The Facade: Dish It Up
On the surface, "Dish It Up" is an aesthetic, fully working app where users can browse, save, and cook meals effortlessly. 
- Fully integrated with the Spoonacular API for live recipe fetching.
- Complete with "Today's Specials" and "Recommended for You".
- Zero suspicious UI elements to an untrained eye.

## 🕵️‍♂️ The Hidden Core: Raksha Setu
Underneath the facade lies an advanced distress and safety infrastructure. Activated via hardware triggers or discrete search codes, protecting you invisibly.

---

### 🔥 Key Features & Implementation

#### 1. Hardware SOS Trigger (Background Process)
- **How it works**: Hold the volume down button for 4 seconds from any screen (even when the phone is locked) to instigate a distress signal.
- **Tech**: Utilizes a specialized Android `BootReceiver` and Foreground Service (`RakshaService`) written in Kotlin to catch hardware interrupts natively, bypassing standard React Native background limits.

#### 2. Stealth Mode Invocation
- **How it works**: Type the exact keyword `"raksha"` into the innocent-looking recipe search bar. This instantly tears down the facade and drops you into the true Safety Dashboard.

#### 3. Live Tracking & Automated SMS Dispatch
- **How it works**: Broadcasts live GPS coordinates to your trusted emergency contacts instantly via SMS, stating your exact location (using reverse geocoding to provide literal street addresses).
- **Tech**: Integrated with Fast2SMS API for robust HTTP-based messaging to bypass strict OS-level SMS restrictions.

#### 4. Discrete Audio Capture
- **How it works**: The moment the SOS is triggered, the app begins recording audio in the background in invisible chunks.
- **Tech**: Uses `expo-av` combined with background execution to silently capture encounters. Audio is securely uploaded to Cloudinary, providing tamper-proof evidence.

#### 5. AI Legal & Safety Chatbot
- **How it works**: Instant access to a localized AI safety advisor capable of answering "What do I do if I am followed?" or providing immediate legal rights in stressful situations.
- **Tech**: Powered by the Groq API (Llama 3) for blazing-fast, strongly encrypted LLM responses.

#### 6. Fake Scheduled Calling
- **How it works**: Trigger a realistic, simulated incoming call directly from the dashboard to strategically excuse yourself from volatile situations safely. 

---

### 📸 Application Walkthrough

*(Note: See the repo's assets for the full resolution images)*

| The Facade (Home) | The Facade (Explore) |
|:---:|:---:|
| ![Dish It Up](docs/image-2.jpg) | ![Explore Recipes](docs/image-1.jpg) |
| The home screen operates perfectly as a harmless cooking utility. | Discover new recipes completely shielding the real purpose. |

| AI Safety Advisor | Emergency Active |
|:---:|:---:|
| ![AI Advisor](docs/image-3.jpg) | ![Active Emergency](docs/image-4.jpg) |
| Ask legal questions or advice on what to do when threatened. | SOS triggered: Live tracking, Background Recording, and Incident Report. |

---

### 🧠 Challenges Overcome
1. **Bypassing App Restrictions**: Pure React Native cannot listen to volume buttons while the screen is off. We implemented native Android Java/Kotlin bridges and foreground services to keep the SOS listener alive even when the app is swiped away.
2. **"Payment Required" APIs**: Built robust fallbacks when API quotas are hit so the recipe facade never breaks and blows its cover.
3. **Silencing Permissions**: To be truly stealthy, the app requests microphone and location permissions gracefully during onboarding by claiming it's "to customize recipes and enable voice search features". 

### 🚀 Future Aspects & Roadmap
- **iOS Implementation**: Porting the Kotlin background volume listener to Swift for iOS background execution.
- **Live Streaming**: Sending live discrete audio chunks directly to an emergency dispatch backend rather than waiting for chunk uploads.
- **Shake to Wake**: Fallback trigger if the volume button hardware fails under pressure.
- **Disguise Mutability**: Allowing users to dynamically change the "Facade" from a Recipe App to a Calculator or Notes app.

---
Built with Expo, React Native, Firebase Auth/Firestore, Native Android (Kotlin), Cloudinary, Fast2SMS, and Groq AI.
