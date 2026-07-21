import { useState, useEffect } from 'react';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  arrayUnion,
  increment,
  GeoPoint,
} from 'firebase/firestore';
import { db } from '../config/firebase';

// Real-time listener for all issues, ordered by newest first
export function useIssues() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const q = query(collection(db, 'issues'), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((docSnap) => {
          const d = docSnap.data();
          return {
            id: docSnap.id,
            ...d,
            // Flatten GeoPoint so components can use issue.lat and issue.lng directly
            lat: d.location?.latitude ?? null,
            lng: d.location?.longitude ?? null,
            // Convert Firestore Timestamps to JS Date for easy display
            createdAtDate: d.createdAt?.toDate() ?? null,
          };
        });
        setIssues(data);
        setLoading(false);
      },
      (err) => {
        console.error('Firestore snapshot error:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return unsubscribe; // cleanup on unmount
  }, []);

  return { issues, loading, error };
}

// Creates a new issue document in Firestore
// Returns the new document ID
export async function createIssue({
  title,
  description,
  category,
  severity,
  location,      // { lat, lng }
  address,
  wardName,
  photoUrl,
  aiAnalysis,
  userId,
}) {
  const priorityScore = severity * 1; // simple initial score; Priority Agent will update this later

  const data = {
    title,
    description,
    category,
    severity,
    status: 'reported',
    location: new GeoPoint(location.lat, location.lng),
    address,
    wardName: wardName || 'Surat',
    photoUrl,
    aiAnalysis,
    reportedBy: userId,
    votes: 0,
    voterIds: [],
    priorityScore,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, 'issues'), data);
  return docRef.id;
}

// Adds one upvote from userId to an issue
// Auto-changes status to 'verified' at 3 votes (Verification Agent logic)
export async function upvoteIssue(issueId, userId, currentVotes, currentVoterIds) {
  if ((currentVoterIds || []).includes(userId)) {
    throw new Error('You have already upvoted this issue');
  }

  const newVotes = (currentVotes || 0) + 1;
  const newStatus = newVotes >= 3 ? 'verified' : 'reported';

  await updateDoc(doc(db, 'issues', issueId), {
    votes: increment(1),
    voterIds: arrayUnion(userId),
    status: newStatus,
    updatedAt: serverTimestamp(),
  });
}

// Updates the status of an issue (for admin use and future expansion)
export async function updateIssueStatus(issueId, status) {
  await updateDoc(doc(db, 'issues', issueId), {
    status,
    updatedAt: serverTimestamp(),
  });
}