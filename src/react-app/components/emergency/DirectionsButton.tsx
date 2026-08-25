import { MapPin, Navigation } from "lucide-react";
import { getDirectionsUrl, getMapViewUrl } from "@/shared/services/mapDirections";

interface DirectionsButtonProps {
  latitude: number;
  longitude: number;
  compact?: boolean;
}

export default function DirectionsButton({ latitude, longitude, compact }: DirectionsButtonProps) {
  const directionsUrl = getDirectionsUrl(latitude, longitude);
  const mapUrl = getMapViewUrl(latitude, longitude);

  if (compact) {
    return (
      <div className="flex flex-wrap gap-2">
        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border-2 border-tg-green/30 text-tg-green font-bold text-xs uppercase"
        >
          <Navigation size={14} /> Directions
        </a>
        <a
          href={mapUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border-2 border-slate-200 text-slate-700 font-bold text-xs uppercase"
        >
          <MapPin size={14} /> Map
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <a
        href={directionsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-tg-green/10 border-2 border-tg-green/30 text-tg-green font-black text-xs uppercase min-h-[48px]"
      >
        <Navigation size={18} /> Get Directions
      </a>
      <a
        href={mapUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white border-2 border-slate-200 text-slate-700 font-black text-xs uppercase min-h-[48px]"
      >
        <MapPin size={18} /> View on Map
      </a>
    </div>
  );
}
