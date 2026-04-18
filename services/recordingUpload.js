import { doc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import * as FileSystem from 'expo-file-system/legacy';
import CryptoJS from 'crypto-js';

export async function uploadRecordingSegment({
  localUri,
  userId,
  caseId,
  segmentNumber,
  duration
}) {
  try {
    if (!localUri || !userId || !caseId) return { success: false };

    const timestamp = Date.now();
    const filename = `recording_${segmentNumber}_${timestamp}.m4a`;
    const path = `recordings/${userId}/${caseId}/${filename}`;

    const timestampStr = Math.round((new Date).getTime() / 1000).toString();
    const cloudName = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.EXPO_PUBLIC_CLOUDINARY_API_KEY;
    const apiSecret = process.env.EXPO_PUBLIC_CLOUDINARY_API_SECRET;

    // Cloudinary signature requires parameters to be sorted alphabetically
    const folderPath = `raksha_recordings/${userId}`;
    const signatureRaw = `folder=${folderPath}&timestamp=${timestampStr}${apiSecret}`;
    const signature = CryptoJS.SHA1(signatureRaw).toString();

    console.log(`[Upload] Starting Cloudinary upload for ${localUri}`);

    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`;
    
    // Use Expo's battle-tested multipart uploader specifically meant for files to third-party endpoints
    const uploadResult = await FileSystem.uploadAsync(
      uploadUrl,
      localUri,
      {
        httpMethod: 'POST',
        uploadType: FileSystem.FileSystemUploadType.MULTIPART,
        fieldName: 'file',
        parameters: {
          api_key: apiKey,
          timestamp: timestampStr,
          signature: signature,
          folder: folderPath
        }
      }
    );

    const responseData = JSON.parse(uploadResult.body);
    
    if (!responseData.secure_url) {
      throw new Error("Cloudinary upload failed: " + uploadResult.body);
    }

    const downloadURL = responseData.secure_url;
    console.log(`[Upload] Uploaded file successfully to Cloudinary: ${downloadURL}`);
    console.log(`[Upload] Got download URL: ${downloadURL}`);

    // Import case manager
    const { updateCaseWithRecording } = require('./caseManager');
    await updateCaseWithRecording(userId, caseId, downloadURL);
    
    // We can also keep the subcollection for backward compatibility if needed, but the prompt says 
    // "Store all data as a new object inside the cases array of the user". Let's stick to the prompt.
    // So no need to addDoc to recordingsColRef!
    
    console.log(`[Upload] Document updated in cases array!`);

    await FileSystem.deleteAsync(localUri, { idempotent: true });

    return { success: true, url: downloadURL };
  } catch (error) {
    console.error("[Upload] Critical Error in uploadRecordingSegment:", error);
    return { success: false };
  }
}
