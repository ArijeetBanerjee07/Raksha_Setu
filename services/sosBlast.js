import * as Location from 'expo-location';
import { Linking } from 'react-native';
import { auth, db } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';

export async function sosBlast(victimName) {
  let locationData = { lat: null, lng: null };
  let smsSent = false;
  let whatsappOpened = false;
  let contactsNotified = 0;
  let actualContacts = [];

  try {
    // -------------------------------------------------------------
    // Step 1: Get GPS Location
    // -------------------------------------------------------------
    let lat = 'LAT';
    let lng = 'LNG';

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const locationPromise = Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000));

        const loc = await Promise.race([locationPromise, timeoutPromise]).catch(async () => {
          return await Location.getLastKnownPositionAsync({});
        });

        if (loc?.coords) {
          lat = loc.coords.latitude;
          lng = loc.coords.longitude;
          locationData = { lat, lng };
        }
      }
    } catch (locError) {
      console.log('Location error (silent):', locError);
    }

    const mapLink = `https://maps.google.com/?q=${lat},${lng}`;

    // -------------------------------------------------------------
    // Step 2: Read Contacts from Firestore
    // -------------------------------------------------------------
    let phoneNumbers = [];
    let firstContact = null;

    try {
      const currentUser = auth.currentUser;
      if (currentUser?.uid) {
        const docRef = doc(db, 'users', currentUser.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();

          // Dynamically fetch username from Firebase to personalize the message
          if (data?.username) {
            victimName = victimName || data.username;
          }

          if (data?.contacts && Array.isArray(data.contacts)) {
            actualContacts = data.contacts;
            phoneNumbers = data.contacts.map(c => c.phone).filter(Boolean);
            contactsNotified = phoneNumbers.length;

            // Extract names too for personalising the message
            if (data.contacts.length > 0) {
              firstContact = data.contacts[0];
            }
          }
        }
      }
    } catch (fsError) {
      console.log('Firestore error (silent):', fsError);
    }

    // -------------------------------------------------------------
    // Step 3 & 4: Send SMS via Fast2SMS and WhatsApp deep link
    // -------------------------------------------------------------
    const taskPromises = [];

    // --- Task A: Fast2SMS Quick SMS to all contacts ---
    if (phoneNumbers.length > 0) {
      const numbersString = phoneNumbers.join(',');
      const smsMessage = `URGENT — ${victimName} needs help immediately. Last location: ${mapLink} — Please call her or dial 112. Sent by RakshaSetu.`;

      const smsPromise = fetch('https://www.fast2sms.com/dev/bulkV2', {
        method: 'POST',
        headers: {
          'authorization': process.env.EXPO_PUBLIC_FAST2SMS_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          route: "q",
          message: smsMessage,
          language: "english",
          flash: 0,
          numbers: numbersString
        })
      })
        .then(res => res.json())
        .then(data => {
          if (data.return) {
            smsSent = true;
          } else {
            console.log('Fast2SMS returned false:', data);
          }
        })
        .catch(err => {
          console.log('Fast2SMS Request failed (silent):', err);
        });

      taskPromises.push(smsPromise);
    }

    // --- Task B: WhatsApp Deep Link to the First Contact ---

    if (firstContact?.phone) {
      // Add '91' prefix to Indian numbers if the length is 10
      let waPhone = firstContact.phone;
      if (waPhone.length === 10) {
        waPhone = `91${waPhone}`;
      }

      // Personalising message with First Contact's Name, falling back if not present
      const contactName = firstContact.name ? `${firstContact.name}, ` : '';
      const waMessage = `URGENT — ${contactName}${victimName} needs help. Location: ${mapLink} — Please call immediately or dial 112`;
      const encodedWaMessage = encodeURIComponent(waMessage);
      const waUrl = `https://wa.me/${waPhone}?text=${encodedWaMessage}`;

      const waPromise = Linking.openURL(waUrl)
        .then(() => {
          whatsappOpened = true;
        })
        .catch(err => {
          console.log('WhatsApp is not installed or failed to open (silent)');
        });
      taskPromises.push(waPromise);
    }


    // -------------------------------------------------------------
    // Step 5: Wire everything together using Promise.allSettled()
    // -------------------------------------------------------------
    await Promise.allSettled(taskPromises);

  } catch (globalError) {
    console.log('SOS Blast global error (silent):', globalError);
  }

  return { smsSent, whatsappOpened, location: locationData, contactsNotified, contacts: actualContacts };
}
