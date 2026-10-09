"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { GeoSearchControl, OpenStreetMapProvider } from "leaflet-geosearch";
import "leaflet-geosearch/dist/geosearch.css";
import { Project, ConflictFinding } from "@/lib/types";

// Fix missing marker icons in leaflet with Next.js
const customIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// A green marker for selected projects or completed
const highlightIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Helper component to add search and recenter
function MapEffects({ center }: { center: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, 15, { duration: 1.5 });
    }
  }, [center, map]);

  useEffect(() => {
    const provider = new OpenStreetMapProvider();
    const searchControl = GeoSearchControl({
      provider: provider,
      style: 'bar',
      showMarker: false,
      retainZoomLevel: false,
      animateZoom: true,
      autoClose: true,
      searchLabel: 'Enter address or place',
      keepResult: true
    });
    map.addControl(searchControl as any);
    return () => {
      map.removeControl(searchControl as any);
    };
  }, [map]);
  return null;
}

type MapProps = {
  projects: Project[];
  conflicts: ConflictFinding[];
  selectedProjectId: string | null;
  onSelectProject: (id: string) => void;
};

export default function CivicMap({ projects, conflicts, selectedProjectId, onSelectProject }: MapProps) {
  // Default center if no projects
  let center: [number, number] = [40.7128, -74.0060];
  let zoom = 13;

  const selectedProj = projects.find(p => p.id === selectedProjectId);
  if (selectedProj && selectedProj.latitude && selectedProj.longitude) {
    center = [selectedProj.latitude, selectedProj.longitude];
    zoom = 15;
  } else if (projects.length > 0) {
    const validProjs = projects.filter(p => p.latitude && p.longitude);
    if (validProjs.length > 0) {
      center = [validProjs[0].latitude!, validProjs[0].longitude!];
    }
  }

  return (
    <div className="w-full h-full relative">
      <MapContainer center={center} zoom={zoom} scrollWheelZoom={true} className="w-full h-full z-0">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapEffects center={selectedProj && selectedProj.latitude && selectedProj.longitude ? [selectedProj.latitude, selectedProj.longitude] : null} />
        
        {projects.map(proj => {
          if (!proj.latitude || !proj.longitude) return null;
          
          const isSelected = proj.id === selectedProjectId;
          const icon = isSelected ? highlightIcon : customIcon;

          return (
            <Marker 
              key={proj.id} 
              position={[proj.latitude, proj.longitude]} 
              icon={icon}
              eventHandlers={{
                click: () => onSelectProject(proj.id)
              }}
            >
              <Popup>
                <div className="font-sans flex flex-col gap-1 p-1">
                  <h3 className="font-semibold text-base">{proj.title}</h3>
                  <p className="text-xs text-ink-2 capitalize">{proj.workType} · {proj.status}</p>
                  <p className="text-xs text-ink-2">{proj.department}</p>
                  <button 
                    onClick={() => onSelectProject(proj.id)}
                    className="mt-2 text-left text-accent underline text-xs cursor-pointer hover:text-accent-2"
                  >
                    View Details
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
