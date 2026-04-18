import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

export async function createNewCase(userId, caseData) {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const userData = userSnap.data();
      const cases = userData.cases || [];
      cases.push(caseData);
      await updateDoc(userRef, { cases });
    }
  } catch (err) {
    console.error("Error creating new case", err);
  }
}

export async function updateCaseWithRecording(userId, caseId, recordingUrl) {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const userData = userSnap.data();
      const cases = userData.cases || [];
      const caseIndex = cases.findIndex(c => c.caseId === caseId);
      if (caseIndex !== -1) {
        if (!cases[caseIndex].recordings) {
          cases[caseIndex].recordings = [];
        }
        cases[caseIndex].recordings.push(recordingUrl);
        await updateDoc(userRef, { cases });
      }
    }
  } catch (err) {
    console.error("Error updating case with recording", err);
  }
}

export async function updateCaseDetails(userId, caseId, details) {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const userData = userSnap.data();
      const cases = userData.cases || [];
      const caseIndex = cases.findIndex(c => c.caseId === caseId);
      if (caseIndex !== -1) {
        cases[caseIndex] = { ...cases[caseIndex], ...details };
        await updateDoc(userRef, { cases });
      }
    }
  } catch (err) {
    console.error("Error updating case details", err);
  }
}
