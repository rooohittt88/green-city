import { useEffect, useRef, useState } from 'react';
import { loadGoogleMaps, SURAT_CENTER, CATEGORY_COLORS } from '../../services/maps';

export default function IssueMap({ issues, selectedIssue, onIssueClick }) {
  const mapDivRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef({}); // { [issueId]: marker }
  const [ready, setReady] = useState(false);

  // Load Google Maps once
  useEffect(() => {
    loadGoogleMaps().then(() => {
      if (!mapDivRef.current || mapRef.current) return;

      mapRef.current = new window.google.maps.Map(mapDivRef.current, {
        center: SURAT_CENTER,
        zoom: 13,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControlOptions: {
          position: window.google.maps.ControlPosition.RIGHT_BOTTOM,
        },
      });

      setReady(true);
    });
  }, []);

  // Sync markers whenever issues array changes
  useEffect(() => {
    if (!ready || !mapRef.current) return;

    const currentIds = new Set(issues.map((i) => i.id));

    // Remove markers for issues that no longer exist
    Object.keys(markersRef.current).forEach((id) => {
      if (!currentIds.has(id)) {
        markersRef.current[id].setMap(null);
        delete markersRef.current[id];
      }
    });

    // Add or update markers
    issues.forEach((issue) => {
      if (!issue.lat || !issue.lng) return;

      const position = { lat: issue.lat, lng: issue.lng };
      const color = CATEGORY_COLORS[issue.category] || '#888780';
      const isSelected = selectedIssue?.id === issue.id;

      const icon = {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: isSelected ? 14 : 10,
        fillColor: color,
        fillOpacity: 1,
        strokeColor: isSelected ? '#fff' : 'rgba(255,255,255,0.8)',
        strokeWeight: isSelected ? 3 : 2,
      };

      if (markersRef.current[issue.id]) {
        // Update existing marker
        markersRef.current[issue.id].setIcon(icon);
      } else {
        // Create new marker
        const marker = new window.google.maps.Marker({
          position,
          map: mapRef.current,
          title: issue.title,
          icon,
        });

        marker.addListener('click', () => onIssueClick(issue));
        markersRef.current[issue.id] = marker;
      }
    });
  }, [issues, selectedIssue, ready]);

  // Pan to selected issue
  useEffect(() => {
    if (!ready || !selectedIssue || !mapRef.current) return;
    if (selectedIssue.lat && selectedIssue.lng) {
      mapRef.current.panTo({ lat: selectedIssue.lat, lng: selectedIssue.lng });
    }
  }, [selectedIssue, ready]);

  return <div ref={mapDivRef} style={{ width: '100%', height: '100%' }} />;
}