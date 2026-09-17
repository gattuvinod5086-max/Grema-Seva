/**
 * Central Map Tile Configuration.
 *
 * Uses OpenStreetMap France high-performance CDN tiles.
 * Unlike the standard openstreetmap.org volunteer servers which aggressively
 * block web clients with 403 ('App is not following the tile usage policy'),
 * OSM France provides unrestricted, CORS-enabled, highly cached tiles with
 * detailed regional cartography and village/mandal place names.
 */
export const MAP_CONFIG = {
  tileUrl: "https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png",
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors &middot; <a href="https://openstreetmap.fr" target="_blank" rel="noopener noreferrer">OSM France</a>',
  subdomains: ["a", "b", "c"],
  maxZoom: 20,
};
