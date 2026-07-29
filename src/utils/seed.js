import { collection, addDoc, serverTimestamp, GeoPoint } from 'firebase/firestore';
import { db } from '../config/firebase';

// 12 realistic civic issues across major Indian cities
const SEED_ISSUES = [
  {
    title: 'Severe pothole near Connaught Place Outer Circle',
    description: 'Deep pothole approximately 50cm wide on main carriage way causing traffic congestion during peak hours.',
    category: 'pothole', severity: 5, status: 'verified',
    location: { lat: 28.6315, lng: 77.2167 },
    address: 'Connaught Place, New Delhi, Delhi 110001',
    wardName: 'New Delhi', votes: 14,
    voterIds: ['seed1', 'seed2', 'seed3', 'seed4'],
    photoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Pothole_on_road.jpg/640px-Pothole_on_road.jpg',
    aiAnalysis: { category: 'pothole', severity: 5, confidence: 0.96, description: 'Dangerous road crater in heavy traffic zone', tags: ['pothole', 'delhi', 'traffic hazard'] },
    priorityScore: 28,
  },
  {
    title: 'Water pipeline leak near Bandra Kurla Complex',
    description: 'Underground high-pressure pipe leaking near BKC entrance — thousands of liters of clean water wasted daily.',
    category: 'water_leak', severity: 5, status: 'reported',
    location: { lat: 19.0657, lng: 72.8686 },
    address: 'BKC Main Road, Bandra East, Mumbai, Maharashtra 400051',
    wardName: 'Bandra BKC', votes: 9,
    voterIds: ['seed5', 'seed6'],
    photoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Water_main_break.jpg/640px-Water_main_break.jpg',
    aiAnalysis: { category: 'water_leak', severity: 5, confidence: 0.92, description: 'Major municipal water line leak', tags: ['water leak', 'mumbai', 'bkc'] },
    priorityScore: 22,
  },
  {
    title: 'Non-functional streetlights on Outer Ring Road, Bellandur',
    description: 'A 500-meter stretch of streetlights remains unlit, creating hazardous conditions for tech park commuters at night.',
    category: 'streetlight', severity: 4, status: 'verified',
    location: { lat: 12.9279, lng: 77.6811 },
    address: 'Outer Ring Road, Bellandur, Bengaluru, Karnataka 560103',
    wardName: 'Bellandur', votes: 18,
    voterIds: ['seed7', 'seed8', 'seed9'],
    photoUrl: '',
    aiAnalysis: { category: 'streetlight', severity: 4, confidence: 0.89, description: 'Dark corridor on high-speed Ring Road', tags: ['bengaluru', 'street light', 'bellandur'] },
    priorityScore: 30,
  },
  {
    title: 'Overflowing garbage dump near Charminar heritage walkway',
    description: 'Commercial waste uncollected for 3 days. Strong odor disturbing tourists and local shop owners.',
    category: 'waste', severity: 4, status: 'reported',
    location: { lat: 17.3616, lng: 78.4747 },
    address: 'Charminar Road, Hyderabad, Telangana 500002',
    wardName: 'Charminar', votes: 7,
    voterIds: ['seed10'],
    photoUrl: '',
    aiAnalysis: { category: 'waste', severity: 4, confidence: 0.91, description: 'Unattended urban waste accumulation', tags: ['hyderabad', 'waste', 'sanitation'] },
    priorityScore: 15,
  },
  {
    title: 'Broken stormwater drain cover near T. Nagar Metro Station',
    description: 'Concrete slab broken leaving open 2-meter deep storm drain on busy pedestrian walkway.',
    category: 'pothole', severity: 5, status: 'in_progress',
    location: { lat: 13.0418, lng: 80.2341 },
    address: 'Usman Road, T. Nagar, Chennai, Tamil Nadu 600017',
    wardName: 'T. Nagar', votes: 21,
    voterIds: ['seed11', 'seed12'],
    photoUrl: '',
    aiAnalysis: { category: 'pothole', severity: 5, confidence: 0.94, description: 'Open drain hazard on pedestrian footway', tags: ['chennai', 'drain', 'pedestrian hazard'] },
    priorityScore: 35,
  },
  {
    title: 'Road surface cave-in near Park Street Crossing',
    description: 'Sub-surface soil erosion caused a 1-meter depression on tram track road junction.',
    category: 'pothole', severity: 4, status: 'verified',
    location: { lat: 22.5551, lng: 88.3517 },
    address: 'Park Street, Kolkata, West Bengal 700016',
    wardName: 'Park Street', votes: 11,
    voterIds: ['seed13'],
    photoUrl: '',
    aiAnalysis: { category: 'pothole', severity: 4, confidence: 0.88, description: 'Asphalt sinkage near tram tracks', tags: ['kolkata', 'road cave-in'] },
    priorityScore: 20,
  },
  {
    title: 'Water pipeline burst on Adajan Canal Road',
    description: 'Water spraying onto residential street since early morning.',
    category: 'water_leak', severity: 4, status: 'verified',
    location: { lat: 21.2093, lng: 72.7947 },
    address: 'Adajan Patiya, Adajan, Surat, Gujarat 395009',
    wardName: 'Adajan', votes: 8,
    voterIds: ['seed14'],
    photoUrl: '',
    aiAnalysis: { category: 'water_leak', severity: 4, confidence: 0.90, description: 'Sub-surface water pipe leak', tags: ['surat', 'water leak'] },
    priorityScore: 16,
  },
  {
    title: 'Broken streetlight junction at FC Road, Deccan Gymkhana',
    description: 'Short circuit causing frequent blackout on popular student high street.',
    category: 'streetlight', severity: 3, status: 'reported',
    location: { lat: 18.5186, lng: 73.8417 },
    address: 'Fergusson College Road, Pune, Maharashtra 411004',
    wardName: 'Deccan', votes: 6,
    voterIds: ['seed15'],
    photoUrl: '',
    aiAnalysis: { category: 'streetlight', severity: 3, confidence: 0.85, description: 'Street light electrical trip', tags: ['pune', 'street light'] },
    priorityScore: 10,
  },
  {
    title: 'Uncollected dry waste dump near Hawa Mahal entrance',
    description: 'Tourist zone garbage bin overflowing with plastic bottles.',
    category: 'waste', severity: 3, status: 'resolved',
    location: { lat: 26.9239, lng: 75.8267 },
    address: 'Hawa Mahal Road, Jaipur, Rajasthan 302002',
    wardName: 'Pink City', votes: 15,
    voterIds: ['seed16'],
    photoUrl: '',
    aiAnalysis: { category: 'waste', severity: 3, confidence: 0.93, description: 'Tourist area plastic waste accumulation', tags: ['jaipur', 'waste'] },
    priorityScore: 25,
  }
];

export async function seedDatabase() {
  try {
    const colRef = collection(db, 'issues');
    for (const issue of SEED_ISSUES) {
      await addDoc(colRef, {
        ...issue,
        createdAt: serverTimestamp(),
      });
    }
    alert('✅ Seeded Pan-India DB successfully with sample issues across Delhi, Mumbai, Bengaluru, Hyderabad, Chennai, Kolkata, Surat, Pune, and Jaipur!');
  } catch (err) {
    console.error('Seeding error:', err);
    alert(`Seeding failed: ${err.message}`);
  }
}