import { useEffect, useRef } from "react";

/**
 * Memanggil callback secara berkala selama component mounted.
 * Tidak memanggil saat tab tidak aktif (hemat resource).
 * @param callback - fungsi yang dipanggil tiap interval
 * @param intervalMs - jeda antar panggilan (default 15 detik)
 * @param enabled - polling aktif atau tidak (default true)
 */
export function usePolling(
  callback: () => void,
  intervalMs = 15_000,
  enabled = true
) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) return;

    let timer: ReturnType<typeof setInterval> | null = null;

    function start() {
      if (timer) return;
      timer = setInterval(() => {
        savedCallback.current();
      }, intervalMs);
    }

    function stop() {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    }

    function handleVisibility() {
      if (document.hidden) {
        stop();
      } else {
        // refresh segera saat tab aktif kembali
        savedCallback.current();
        start();
      }
    }

    start();
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      stop();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [intervalMs, enabled]);
}
