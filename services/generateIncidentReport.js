import { auth } from '../config/firebase';

export async function generateIncidentReport({ name, lat, lng, contacts, caseId }) {
  let address = `Location: ${lat}, ${lng}`;
  const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  
  // Step 1: Reverse geocode
  try {
    const geoResponse = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`, {
      headers: { 'User-Agent': 'RakshaSetu/1.0' }
    });
    if (geoResponse.ok) {
      const geoData = await geoResponse.json();
      if (geoData.display_name) {
        address = geoData.display_name.substring(0, 60);
      }
    }
  } catch (err) {
    console.log('Geocoding error (silent):', err);
  }

  const fallbackReport = `${name} needs immediate help. Emergency triggered at ${time} near ${address}. Contacts notified: ${contacts}. Audio recording is active. Please assist immediately. Case ID: ${caseId}`;

  // Step 2 & 3: Call Groq API with timeout
  try {
    const apiKey = process.env.EXPO_PUBLIC_GROQ_API_KEY;
    const groqPromise = fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama3-70b-8192',
        max_tokens: 300,
        messages: [{
          role: 'user',
          content: `Generate a police incident report. Victim: ${name}. Time: ${time}. Location: ${address}. Contacts notified: ${contacts}. Audio recording active. Write in clear English under 80 words. Short sentences. For a police officer reading with no context. End with: Case ID: ${caseId}`
        }]
      })
    }).then(res => {
      if (!res.ok) throw new Error('Groq API response not ok: ' + res.status);
      return res.json();
    });

    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 8000));

    const aiData = await Promise.race([groqPromise, timeoutPromise]);
    
    if (aiData?.choices?.[0]?.message?.content) {
      return { report: aiData.choices[0].message.content, address, usedFallback: false };
    } else {
      throw new Error('Invalid Groq API response format');
    }
  } catch (err) {
    console.log('Groq API error (silent):', err);
    return { report: fallbackReport, address, usedFallback: true };
  }
}
