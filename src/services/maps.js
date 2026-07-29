// Pan-India Map Center & City Presets
export const INDIA_CENTER = { lat: 20.5937, lng: 78.9629, zoom: 5 };

export const CITY_PRESETS = [
  { name: 'All India', lat: 20.5937, lng: 78.9629, zoom: 5 },
  { name: 'New Delhi', lat: 28.6139, lng: 77.2090, zoom: 11 },
  { name: 'Mumbai', lat: 19.0760, lng: 72.8777, zoom: 11 },
  { name: 'Bengaluru', lat: 12.9716, lng: 77.5946, zoom: 11 },
  { name: 'Surat', lat: 21.1702, lng: 72.8311, zoom: 12 },
  { name: 'Hyderabad', lat: 17.3850, lng: 78.4867, zoom: 11 },
  { name: 'Chennai', lat: 13.0827, lng: 80.2707, zoom: 11 },
  { name: 'Kolkata', lat: 22.5726, lng: 88.3639, zoom: 11 },
  { name: 'Pune', lat: 18.5204, lng: 73.8567, zoom: 11 },
  { name: 'Jaipur', lat: 26.9124, lng: 75.7873, zoom: 11 },
];

// Deprecated fallback alias for backward compatibility
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

// Calls OpenStreetMap Nominatim API — free, no API key required
export async function reverseGeocode(lat, lng) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`;

  try {
    const res = await fetch(url, {
      headers: {
        'Accept-Language': 'en',
        'User-Agent': 'CommunityHero-India/1.0',
      },
    });
    const data = await res.json();

    if (data && data.display_name) {
      return data.display_name;
    }

    return null;
  } catch (e) {
    console.error('Reverse geocoding fetch error:', e);
    return null;
  }
}

// Extracts a ward/city/neighbourhood name from a full formatted address across India
export function extractWard(address) {
  if (!address) return 'India';
  // If it looks like raw coordinates, return default
  if (/^-?\d+\.\d+,\s*-?\d+\.\d+$/.test(address.trim())) return 'India';
  
  const parts = address.split(',').map((p) => p.trim());
  if (parts.length >= 3) {
    // Usually parts[0] or parts[1] is locality/city in Indian addresses
    return parts[1] || parts[0];
  }
  return parts[0] || 'India';
}