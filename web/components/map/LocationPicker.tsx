import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import { Crosshair } from "lucide-react";

const TELANGANA_CENTER: [number, number] = [17.385, 78.4867]; // Hyderabad

export const pinIcon = (color: string) =>
  L.divIcon({
    className: "",
    html: `<span style="display:block;width:18px;height:18px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 1px 4px rgba(0,0,0,.4)"></span>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });

interface LocationPickerProps {
  latitude: number | null;
  longitude: number | null;
  onChange: (lat: number, lng: number) => void;
}

function ClickCapture({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

/**
 * Interactive pin-drop picker for the report form: tap the map or use GPS.
 */
export default function LocationPicker({ latitude, longitude, onChange }: LocationPickerProps) {
  const hasPin = latitude != null && longitude != null;

  const captureGps = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) =>
      onChange(pos.coords.latitude, pos.coords.longitude)
    );
  };

  return (
    <div className="relative">
      <MapContainer
        center={hasPin ? [latitude!, longitude!] : TELANGANA_CENTER}
        zoom={hasPin ? 16 : 9}
        scrollWheelZoom
        className="h-56 w-full rounded-xl border border-slate-200 z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickCapture onPick={onChange} />
        {hasPin && <Marker position={[latitude!, longitude!]} icon={pinIcon("#67001A")} />}
        <Recenter lat={latitude} lng={longitude} />
      </MapContainer>
      <button
        type="button"
        onClick={captureGps}
        className="absolute bottom-3 right-3 z-[500] flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-md hover:bg-slate-50"
      >
        <Crosshair size={14} />
        Use my location
      </button>
    </div>
  );
}

function Recenter({ lat, lng }: { lat: number | null; lng: number | null }) {
  const map = useMap();
  useEffect(() => {
    if (lat != null && lng != null) {
      map.setView([lat, lng], Math.max(map.getZoom(), 16));
    }
  }, [lat, lng, map]);
  return null;
}
