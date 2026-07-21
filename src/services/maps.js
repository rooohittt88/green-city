// DELETE this line
import { Loader } from '@googlemaps/js-api-loader';

// Singleton promise — maps only loads once
let _mapsPromise = null;

export async function loadGoogleMaps() {
  if (window.google?.maps) return;
  
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=visualization`;
    script.async = true;
    script.defer = true;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

// Centre of Surat city
export const SURAT_CENTER = { lat: 21.1702, lng: 72.8311 };

// Marker fill colours by category
export const CATEGORY_COLORS = {
  pothole: '#E24B4A',
  water_leak: '#378ADD',
  streetlight: '#EF9F27',
  waste: '#1D9E75',
  other: '#888780',
};

// Human-readable labels
export const CATEGORY_LABELS = {
  pothole: 'Pothole',
  water_leak: 'Water Leak',
  streetlight: 'Street Light',
  waste: 'Waste / Garbage',
  other: 'Other',
};

export const STATUS_LABELS = {
  reported: 'Reported',
  verified: 'Community Verified',
  in_progress: 'In Progress',
  resolved: 'Resolved',
};

// Calls Google Geocoding REST API, returns human address string
export async function reverseGeocode(lat, lng) {
  const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${key}`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (data.status !== 'OK') {
      console.warn('Geocoding API returned status:', data.status, data.error_message || '');
      return null; // return null so caller knows it failed
    }

    if (data.results && data.results[0]) {
      return data.results[0].formatted_address;
    }

    return null;
  } catch (e) {
    console.error('Geocoding fetch error:', e);
    return null;
  }
}

// Extracts a ward/neighbourhood name from a full formatted address
// "Adajan Patiya, Adajan, Surat, Gujarat 395009, India" → "Adajan"
export function extractWard(address) {
  if (!address) return 'Surat';
  // If it looks like coordinates (contains a dot and comma with numbers), return default
  if (/^-?\d+\.\d+,\s*-?\d+\.\d+$/.test(address.trim())) return 'Surat';
  const parts = address.split(',');
  // Second part is usually the neighbourhood/ward in Indian addresses
  const ward = parts[1]?.trim() || parts[0]?.trim() || 'Surat';
  return ward;
}