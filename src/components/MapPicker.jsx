"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default Leaflet icon missing in Next.js
import L from "leaflet";
const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// Component to dynamically change map view when location updates
function ChangeView({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center && center.lat !== 0 && center.lng !== 0) {
      map.flyTo([center.lat, center.lng], map.getZoom() < 13 ? 15 : map.getZoom());
    }
  }, [center, map]);
  return null;
}

export default function MapPicker({ latitude, longitude, setCoordinates, searchAddress }) {
  const [center, setCenter] = useState({ lat: -2.5489, lng: 118.0149 }); // Default Center: Indonesia
  const markerRef = useRef(null);

  // Initialize marker from props
  const position = useMemo(() => {
    if (latitude && longitude) return { lat: parseFloat(latitude), lng: parseFloat(longitude) };
    return null;
  }, [latitude, longitude]);

  useEffect(() => {
    // If we have an external search address, try to geocode it and center map
    if (searchAddress) {
      const timeout = setTimeout(() => {
        fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchAddress)}&limit=1`, {
          headers: { "Accept-Language": "id" }
        })
          .then(res => res.json())
          .then(data => {
            if (data && data.length > 0) {
              const newLat = parseFloat(data[0].lat);
              const newLng = parseFloat(data[0].lon);
              setCenter({ lat: newLat, lng: newLng });
              setCoordinates(newLat.toString(), newLng.toString());
            }
          })
          .catch(err => console.error("Geocoding failed", err));
      }, 1000); // Debounce
      return () => clearTimeout(timeout);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchAddress]);

  useEffect(() => {
    if (position) {
      setTimeout(() => {
        setCenter(position);
      }, 0);
    }
  }, [position]);

  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          const newPos = marker.getLatLng();
          setCoordinates(newPos.lat.toFixed(6), newPos.lng.toFixed(6));
        }
      },
    }),
    [setCoordinates]
  );

  return (
    <div className="h-[400px] w-full border-2 border-black rounded-xl overflow-hidden relative z-0">
      <MapContainer center={center} zoom={13} scrollWheelZoom={true} className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ChangeView center={center} />
        {position && (
          <Marker 
            draggable={true} 
            eventHandlers={eventHandlers} 
            position={position} 
            ref={markerRef} 
            icon={icon} 
          />
        )}
      </MapContainer>
      <div className="absolute top-2 right-2 z-[400] pointer-events-none">
        <span className="bg-[#c1ff00] text-black font-bold px-2 py-1 border-2 border-black rounded-lg text-xs shadow-brutal-sm">
          DRAG PIN TO ADJUST
        </span>
      </div>
    </div>
  );
}

