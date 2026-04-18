import { useState, useEffect, useRef } from 'react';
import { startRecording, stopAndGetUri, discardRecording } from '../services/audioRecorder';
import { uploadRecordingSegment } from '../services/recordingUpload';
import { auth } from '../config/firebase';

export function useAudioCapture({ caseId, isActive, intervalSeconds = 30 }) {
  const [segmentCount, setSegmentCount] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [currentSegmentSeconds, setCurrentSegmentSeconds] = useState(0);

  const recordingRef = useRef(null);
  const intervalRef = useRef(null);
  const timerRef = useRef(null);
  const segmentNumberRef = useRef(1);

  useEffect(() => {
    let active = true;

    const startNewSegment = async () => {
      try {
        const newRecording = await startRecording();
        if (newRecording && active) {
          recordingRef.current = newRecording;
          setIsRecording(true);
          setCurrentSegmentSeconds(0);
        }
      } catch (err) {}
    };

    const flushSegment = async () => {
      const currentRecording = recordingRef.current;
      recordingRef.current = null;
      if (!currentRecording) return;
      
      try {
        const uri = await stopAndGetUri(currentRecording);
        const duration = currentSegmentSeconds;
        const currentSegNum = segmentNumberRef.current;
        segmentNumberRef.current += 1;

        if (uri && active) {
          setIsUploading(true);
          const userId = auth?.currentUser?.uid;
          if (userId && caseId) {
            uploadRecordingSegment({
              localUri: uri,
              userId,
              caseId,
              segmentNumber: currentSegNum,
              duration
            }).then((res) => {
              if (active) {
                if (res.success) setSegmentCount(prev => prev + 1);
                setIsUploading(false);
              }
            });
          }
        }
      } catch (err) {
        if (active) setIsUploading(false);
      }
    };

    if (isActive && caseId) {
      segmentNumberRef.current = 1;
      setSegmentCount(0);
      setIsUploading(false);
      
      startNewSegment();

      intervalRef.current = setInterval(() => {
        if (active) {
          flushSegment();
          startNewSegment();
        }
      }, intervalSeconds * 1000);

      timerRef.current = setInterval(() => {
        if (active) {
          setCurrentSegmentSeconds(prev => prev + 1);
        }
      }, 1000);

    } else {
      if (recordingRef.current) {
        flushSegment(); // upload final piece
      }
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
      setIsRecording(false);
      setCurrentSegmentSeconds(0);
    }

    return () => {
      active = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
      
      if (recordingRef.current) {
        discardRecording(recordingRef.current);
        recordingRef.current = null;
      }
    };
  }, [isActive, caseId, intervalSeconds]);

  return { segmentCount, isRecording, isUploading, currentSegmentSeconds };
}
