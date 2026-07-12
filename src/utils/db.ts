import { Candidate } from '../types';

const DB_NAME = 'ResumeRosterDB';
const DB_VERSION = 1;
const STORE_NAME = 'resumes';

// Initialize IndexedDB
function getDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

// Store a resume blob in IndexedDB
export async function saveResume(candidateId: string, file: File): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(file, candidateId);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Retrieve a resume blob from IndexedDB
export async function getResume(candidateId: string): Promise<File | null> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(candidateId);

    request.onsuccess = () => {
      resolve(request.result || null);
    };
    request.onerror = () => reject(request.error);
  });
}

// Delete a resume blob from IndexedDB
export async function deleteResume(candidateId: string): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(candidateId);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Metadata Storage Helpers using localStorage
const CANDIDATES_KEY = 'resume_roster_candidates';

export function getCandidates(): Candidate[] {
  const data = localStorage.getItem(CANDIDATES_KEY);
  if (!data) return getMockCandidates();
  try {
    return JSON.parse(data);
  } catch (e) {
    console.error('Error parsing candidates from localStorage', e);
    return getMockCandidates();
  }
}

export function saveCandidates(candidates: Candidate[]): void {
  localStorage.setItem(CANDIDATES_KEY, JSON.stringify(candidates));
}

// Provide some polished, realistic mock data for first-load delight
function getMockCandidates(): Candidate[] {
  return [
    {
      id: '1',
      name: 'Sarah Jenkins',
      email: 'sarah.j@example.com',
      phone: '+1 (555) 019-2834',
      position: 'Senior Frontend Engineer',
      status: 'Interviewing',
      appliedDate: '2026-07-01',
      resumeName: 'Sarah_Jenkins_CV.pdf',
      resumeType: 'application/pdf',
      resumeSize: 145000,
      notes: [
        {
          id: 'n1',
          content: 'Strong background in React 19, TypeScript, and modern styling solutions. Very clear communicator during the initial phone screen.',
          date: '2026-07-02 10:15 AM',
          author: 'HR Screen'
        },
        {
          id: 'n2',
          content: 'Technical round went excellent. Solved the system design scenario with deep performance optimization strategies.',
          date: '2026-07-08 03:30 PM',
          author: 'Tech Interviewer'
        }
      ]
    },
    {
      id: '2',
      name: 'Marcus Chen',
      email: 'm.chen@example.com',
      phone: '+1 (555) 014-9876',
      position: 'Lead UX Designer',
      status: 'Screening',
      appliedDate: '2026-07-05',
      resumeName: 'Marcus_Chen_Portfolio_CV.pdf',
      resumeType: 'application/pdf',
      resumeSize: 220000,
      notes: [
        {
          id: 'n3',
          content: 'Incredible portfolio of SaaS dashboards. Focused heavily on high-contrast accessibility and beautiful typographic layouts.',
          date: '2026-07-06 11:00 AM',
          author: 'Design Lead'
        }
      ]
    },
    {
      id: '3',
      name: 'Elena Rostova',
      email: 'elena.rostova@example.com',
      phone: '+1 (555) 012-4411',
      position: 'Senior Full Stack Developer',
      status: 'Offered',
      appliedDate: '2026-06-25',
      resumeName: 'Elena_Rostova_FullStack.pdf',
      resumeType: 'application/pdf',
      resumeSize: 182000,
      notes: [
        {
          id: 'n4',
          content: 'Stellar problem solver. Mastered the backend livecoding exercise effortlessly. Team player with great leadership qualities.',
          date: '2026-06-27 02:00 PM',
          author: 'Engineering Manager'
        },
        {
          id: 'n5',
          content: 'Offered $145k base salary with competitive equity. Awaiting sign-off.',
          date: '2026-07-01 09:00 AM',
          author: 'Talent Acquisition'
        }
      ]
    },
    {
      id: '4',
      name: 'David Vance',
      email: 'david.v@example.com',
      phone: '+1 (555) 018-7733',
      position: 'Junior Product Manager',
      status: 'Applied',
      appliedDate: '2026-07-10',
      notes: []
    }
  ];
}
