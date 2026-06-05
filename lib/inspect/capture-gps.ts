import type { GpsCoordinatesInput } from "@/lib/inspect/visit-proof";

export type GpsCaptureResult =
  | { ok: true; coordinates: GpsCoordinatesInput }
  | { ok: false; error: string };

export async function captureDeviceGps(timeoutMs = 15_000): Promise<GpsCaptureResult> {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return { ok: false, error: "Location is not available on this device." };
  }

  return new Promise((resolve) => {
    const timeoutId = window.setTimeout(() => {
      resolve({ ok: false, error: "Location timed out. Try again near a window or outdoors." });
    }, timeoutMs);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        window.clearTimeout(timeoutId);
        resolve({
          ok: true,
          coordinates: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracyMeters: position.coords.accuracy,
            capturedAt: new Date(position.timestamp).toISOString(),
          },
        });
      },
      (error) => {
        window.clearTimeout(timeoutId);
        const message =
          error.code === error.PERMISSION_DENIED
            ? "Allow location access to check in on site."
            : error.code === error.POSITION_UNAVAILABLE
              ? "Could not determine your location."
              : "Location request timed out.";
        resolve({ ok: false, error: message });
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: timeoutMs },
    );
  });
}
