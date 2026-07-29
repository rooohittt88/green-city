import { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { INDIA_CENTER, CATEGORY_COLORS } from '../../services/maps';

// Helper component: pans the map when selected center/issue changes
function MapPanner({ selectedIssue, activeCity }) {
  const map = useMap();
  
  useEffect(() => {
    if (selectedIssue?.lat && selectedIssue?.lng) {
      map.flyTo([selectedIssue.lat, selectedIssue.lng], 14, { duration: 1.2 });
    }
  }, [selectedIssue, map]);

  useEffect(() => {
    if (activeCity) {
      map.flyTo([activeCity.lat, activeCity.lng], activeCity.zoom || 11, { duration: 1.5 });
    }
  }, [activeCity, map]);

  return null;
}

export default function IssueMap({ issues, selectedIssue, activeCity, onIssueClick }) {
  return (
    <MapContainer
      center={[INDIA_CENTER.lat, INDIA_CENTER.lng]}
      zoom={INDIA_CENTER.zoom}
      style={{ width: '100%', height: '100%' }}
      zoomControl={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <MapPanner selectedIssue={selectedIssue} activeCity={activeCity} />

      {issues.map((issue) => {
        if (!issue.lat || !issue.lng) return null;
        const color = CATEGORY_COLORS[issue.category] || '#888780';
        const isSelected = selectedIssue?.id === issue.id;

        return (
          <CircleMarker
            key={issue.id}
            center={[issue.lat, issue.lng]}
            radius={isSelected ? 14 : 9}
            pathOptions={{
              fillColor: color,
              fillOpacity: 0.9,
              color: isSelected ? '#ffffff' : 'rgba(255,255,255,0.8)',
              weight: isSelected ? 3 : 1.5,
            }}
            eventHandlers={{
              click: () => onIssueClick(issue),
            }}
          >
            <Popup>
              <div style={{ padding: '2px 0' }}>
                <strong style={{ fontSize: 13, color: '#111' }}>{issue.title}</strong>
                {issue.address && (
                  <div style={{ fontSize: 11, color: '#666', marginTop: 4 }}>
                    📍 {issue.address}
                  </div>
                )}
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}