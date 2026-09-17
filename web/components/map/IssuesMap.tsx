import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import type { Issue } from "@shared/types";
import { MAP_CONFIG } from "@web/constants/map";

const STATUS_COLORS: Record<string, string> = {
  Submitted: "#64748b",
  Acknowledged: "#f59e0b",
  "In Progress": "#3b82f6",
  Resolved: "#10b981",
  Closed: "#059669",
  Reopened: "#ef4444",
};

/**
 * Officials' overview map: one coloured pin per located issue, colour =
 * status. Shows only issues the API already scoped to the caller.
 */
export default function IssuesMap({ issues }: { issues: Issue[] }) {
  const located = issues.filter((i) => i.latitude != null && i.longitude != null);

  if (located.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
        No geolocated reports yet. Reports captured with GPS will appear here.
      </div>
    );
  }

  const center: [number, number] = [
    located.reduce((s, i) => s + i.latitude!, 0) / located.length,
    located.reduce((s, i) => s + i.longitude!, 0) / located.length,
  ];

  return (
    <MapContainer
      center={center}
      zoom={12}
      scrollWheelZoom
      className="h-80 w-full rounded-xl border border-slate-200 z-0"
    >
      <TileLayer
        attribution={MAP_CONFIG.attribution}
        url={MAP_CONFIG.tileUrl}
        subdomains={MAP_CONFIG.subdomains}
        maxZoom={MAP_CONFIG.maxZoom}
      />
      {located.map((issue) => (
        <Marker
          key={issue.id}
          position={[issue.latitude!, issue.longitude!]}
          icon={L.divIcon({
            className: "",
            html: `<span style="display:block;width:18px;height:18px;border-radius:50%;background:${
              STATUS_COLORS[issue.status] ?? "#64748b"
            };border:3px solid white;box-shadow:0 1px 4px rgba(0,0,0,.4)"></span>`,
            iconSize: [18, 18],
            iconAnchor: [9, 9],
          })}
        >
          <Popup>
            <strong>{issue.code}</strong> · {issue.category}
            <br />
            {issue.status}
            <br />
            {issue.village ?? ""}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
