export type MapProvider = "google" | "osm";

export interface MapDirectionsConfig {
  provider?: MapProvider;
}

/** Build directions URL without embedding API keys in frontend */
export function getDirectionsUrl(
  lat: number,
  lng: number,
  config?: MapDirectionsConfig
): string {
  const provider = config?.provider ?? "google";
  if (provider === "osm") {
    return `https://www.openstreetmap.org/directions?to=${lat},${lng}`;
  }
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

export function getMapViewUrl(lat: number, lng: number, config?: MapDirectionsConfig): string {
  const provider = config?.provider ?? "google";
  if (provider === "osm") {
    return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=15/${lat}/${lng}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}
