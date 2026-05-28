const center = { lat: 34.1015, lon: -84.5194 };

const zipCentroids: Record<string, { lat: number; lon: number }> = {
  "30188": { lat: 34.1015, lon: -84.5194 },
  "30189": { lat: 34.128, lon: -84.574 },
  "30114": { lat: 34.238, lon: -84.49 },
  "30115": { lat: 34.186, lon: -84.438 },
  "30102": { lat: 34.089, lon: -84.633 },
  "30101": { lat: 34.075, lon: -84.647 },
  "30144": { lat: 34.039, lon: -84.604 },
  "30152": { lat: 33.995, lon: -84.664 },
  "30066": { lat: 34.033, lon: -84.503 },
  "30062": { lat: 34.0, lon: -84.463 },
  "30064": { lat: 33.938, lon: -84.605 },
  "30075": { lat: 34.04, lon: -84.385 },
  "30068": { lat: 33.967, lon: -84.438 },
  "30067": { lat: 33.93, lon: -84.465 }
};

export function extractZip(input: string) {
  return input.match(/\b\d{5}\b/)?.[0] || "";
}

export function validateServiceArea(zipCode: string) {
  const point = zipCentroids[zipCode];
  if (!point) {
    return {
      ok: false,
      distanceMiles: null,
      message: "ZIP code is outside the free validation list. Rosa can review it manually."
    };
  }

  const distanceMiles = distance(center, point);
  return {
    ok: distanceMiles <= 20,
    distanceMiles: Number(distanceMiles.toFixed(2)),
    message:
      distanceMiles <= 20
        ? "ZIP code is within the current service area."
        : "ZIP code appears to be outside the 20-mile service area."
  };
}

function distance(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const radius = 3958.8;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const value =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  return radius * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

function toRad(value: number) {
  return (value * Math.PI) / 180;
}
