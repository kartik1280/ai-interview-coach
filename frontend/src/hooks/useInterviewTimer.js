import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Custom 5-Minute Strict Interview Countdown Timer Hook
 * @param {Function} onTimeUp - Callback function triggered when timer hits 00:00
 * @param {number} durationSeconds - Initial duration in seconds (default 300s / 5 mins)
 * @param {boolean} isActive - Whether the timer countdown is running
 */
export function useInterviewTimer(onTimeUp, durationSeconds = 300, isActive = false) {
  const [timeLeft, setTimeLeft] = useState(durationSeconds);
  const [isExpired, setIsExpired] = useState(false);
  const onTimeUpRef = useRef(onTimeUp);

  // Keep latest onTimeUp ref in sync
  useEffect(() => {
    onTimeUpRef.current = onTimeUp;
  }, [onTimeUp]);

  useEffect(() => {
    if (!isActive || isExpired) return;

    if (timeLeft <= 0) {
      setIsExpired(true);
      if (onTimeUpRef.current) {
        onTimeUpRef.current();
      }
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsExpired(true);
          if (onTimeUpRef.current) {
            onTimeUpRef.current();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive, isExpired, timeLeft]);

  const formatTime = useCallback(() => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, [timeLeft]);

  const resetTimer = useCallback((newDuration = durationSeconds) => {
    setTimeLeft(newDuration);
    setIsExpired(false);
  }, [durationSeconds]);

  return {
    timeLeft,
    formatTime,
    resetTimer,
    isExpired
  };
}
