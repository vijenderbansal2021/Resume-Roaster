import React, { useState, useEffect } from 'react';
import { Users, Briefcase, Award, CheckCircle2, UserCheck, Trash2 } from 'lucide-react';
import { Candidate, CandidateStatus, Note } from './types';
import {
  getCandidates,
  saveCandidates,
  saveResume,
  deleteResume,
} from './utils/db';
import MetricCard from './components/MetricCard';
import CandidateList from './components/CandidateList';
import CandidateDetail from './components/CandidateDetail';
import AddCandidateModal from './components/AddCandidateModal';

export default function App() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Load candidates on mount
  useEffect(() => {
    const loaded = getCandidates();
    setCandidates(loaded);
    if (loaded.length > 0) {
      setSelectedId(loaded[0].id);
    }
  }, []);

  // Sync to local storage when state changes
  const updateCandidatesState = (newCandidates: Candidate[]) => {
    setCandidates(newCandidates);
    saveCandidates(newCandidates);
  };

  // Helper to get selected candidate
  const selectedCandidate =
    candidates.find((c) => c.id === selectedId) || null;

  // Add Candidate handler
  const handleAddCandidate = async (data: {
    name: string;
    email: string;
    phone: string;
    position: string;
    status: CandidateStatus;
    resumeFile?: File;
    initialNotes?: string;
  }) => {
    const newId = Date.now().toString();
    const currentDate = new Date().toISOString().split('T')[0];

    // Build notes array
    const notes: Note[] = [];
    
    // Add automatic system registration log
    notes.push({
      id: `sys-${Date.now()}`,
      content: `Registered candidate into application pool. Status set to: ${data.status}.`,
      date: new Date().toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }),
      author: 'System Audit Log',
    });

    if (data.initialNotes?.trim()) {
      notes.push({
        id: `note-${Date.now() + 1}`,
        content: data.initialNotes.trim(),
        date: new Date().toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        }),
        author: 'HR Evaluator',
      });
    }

    // Prepare candidate metadata
    const newCandidate: Candidate = {
      id: newId,
      name: data.name,
      email: data.email,
      phone: data.phone,
      position: data.position,
      status: data.status,
      appliedDate: currentDate,
      notes,
    };

    if (data.resumeFile) {
      newCandidate.resumeName = data.resumeFile.name;
      newCandidate.resumeType = data.resumeFile.type;
      newCandidate.resumeSize = data.resumeFile.size;

      try {
        await saveResume(newId, data.resumeFile);
      } catch (err) {
        console.error('Failed to store resume in IndexedDB', err);
      }
    }

    const updated = [newCandidate, ...candidates];
    updateCandidatesState(updated);
    setSelectedId(newId);
  };

  // Update applicant recruitment stage
  const handleUpdateStatus = (candidateId: string, status: CandidateStatus) => {
    const updated = candidates.map((candidate) => {
      if (candidate.id === candidateId) {
        const transitionNote: Note = {
          id: `sys-trans-${Date.now()}`,
          content: `Recruitment stage updated to: ${status}.`,
          date: new Date().toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          }),
          author: 'System Audit Log',
        };

        return {
          ...candidate,
          status,
          notes: [transitionNote, ...candidate.notes],
        };
      }
      return candidate;
    });

    updateCandidatesState(updated);
  };

  // Add manually written timeline note
  const handleAddNote = (candidateId: string, noteContent: string) => {
    const updated = candidates.map((candidate) => {
      if (candidate.id === candidateId) {
        const newNoteItem: Note = {
          id: `note-${Date.now()}`,
          content: noteContent,
          date: new Date().toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          }),
          author: 'Hiring Team Note',
        };

        return {
          ...candidate,
          notes: [newNoteItem, ...candidate.notes],
        };
      }
      return candidate;
    });

    updateCandidatesState(updated);
  };

  // Delete timeline note
  const handleDeleteNote = (candidateId: string, noteId: string) => {
    const updated = candidates.map((candidate) => {
      if (candidate.id === candidateId) {
        return {
          ...candidate,
          notes: candidate.notes.filter((note) => note.id !== noteId),
        };
      }
      return candidate;
    });

    updateCandidatesState(updated);
  };

  // Hook up resume uploading in detail panel
  const handleUploadResumeMeta = (candidateId: string, file: File) => {
    const updated = candidates.map((candidate) => {
      if (candidate.id === candidateId) {
        const uploadLog: Note = {
          id: `sys-upload-${Date.now()}`,
          content: `Uploaded curriculum vitae: "${file.name}" (${(file.size / 1024).toFixed(1)} KB).`,
          date: new Date().toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          }),
          author: 'System Audit Log',
        };

        return {
          ...candidate,
          resumeName: file.name,
          resumeType: file.type,
          resumeSize: file.size,
          notes: [uploadLog, ...candidate.notes],
        };
      }
      return candidate;
    });

    updateCandidatesState(updated);
  };

  // Delete candidate and clear IndexedDB attachment
  const handleDeleteCandidate = async (candidateId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid selecting candidate while deleting

    if (!confirm('Are you sure you want to permanently delete this applicant and their attached resume?')) {
      return;
    }

    try {
      await deleteResume(candidateId);
    } catch (err) {
      console.error('Failed to delete resume from IndexedDB', err);
    }

    const updated = candidates.filter((c) => c.id !== candidateId);
    updateCandidatesState(updated);

    if (selectedId === candidateId) {
      setSelectedId(updated.length > 0 ? updated[0].id : null);
    }
  };

  // Stats Calculations
  const stats = {
    total: candidates.length,
    active: candidates.filter((c) => c.status === 'Interviewing' || c.status === 'Screening').length,
    offers: candidates.filter((c) => c.status === 'Offered' || c.status === 'Hired').length,
    rejected: candidates.filter((c) => c.status === 'Rejected').length,
  };

  return (
    <div id="app-workspace" className="h-screen bg-slate-50 font-sans text-slate-900 antialiased flex overflow-hidden">
      {/* Left Sidebar */}
      <aside className="w-64 bg-slate-900 h-full flex flex-col shrink-0 text-slate-300 border-r border-slate-800">
        {/* Brand Header */}
        <div className="h-20 px-6 flex items-center gap-3 border-b border-slate-800">
          <div className="p-2 bg-blue-600 rounded-lg text-white shadow-md shadow-blue-600/10 flex items-center justify-center">
            <UserCheck className="w-5 h-5 stroke-[2]" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-wider uppercase">
              RosterPro
            </h1>
            <p className="text-[10px] text-slate-400 font-medium">
              Applicant Tracking
            </p>
          </div>
        </div>

        {/* Sidebar Navigation & Info */}
        <div className="flex-1 py-6 px-4 space-y-6 overflow-y-auto">
          <div className="space-y-2">
            <span className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Active Workspace
            </span>
            <div className="px-3 py-2 bg-slate-800/60 rounded-lg text-xs font-semibold text-white border border-slate-700/30 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Main Applicant Pool
            </div>
          </div>

          <div className="space-y-2">
            <span className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Quick Guide
            </span>
            <div className="p-3 bg-slate-800/30 rounded-lg text-[11px] leading-relaxed text-slate-400 space-y-2">
              <p>
                Manage resumes securely inside your browser sandbox.
              </p>
              <p>
                Click on any candidate card to open their contact profile, download files, or add logs.
              </p>
            </div>
          </div>
        </div>

        {/* Recruiter Profile Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-sm">
            JV
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-bold text-white truncate">Jordan Vance</h4>
            <p className="text-[10px] text-slate-500 truncate">Senior Recruiter</p>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-grow flex flex-col overflow-hidden h-full">
        {/* Top Header */}
        <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Resume Pipeline
            </h2>
            <p className="text-xs text-slate-500">
              Track applicant qualifications, logs and attach CV files.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              id="header-add-candidate-btn"
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all flex items-center gap-2 cursor-pointer"
            >
              <Users className="w-4 h-4" />
              Add Applicant
            </button>
          </div>
        </header>

        {/* Scrollable Container for Stats & Workspace */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          {/* Metric Bento Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              title="Total Applicants"
              value={stats.total}
              subtext="Candidates registered in pool"
              colorClass="bg-slate-50 text-slate-600 border border-slate-200"
              icon={<Users className="w-5 h-5 text-slate-500" />}
            />
            <MetricCard
              title="In Evaluation"
              value={stats.active}
              subtext="Screening & Interview rounds"
              colorClass="bg-blue-50 text-blue-600 border border-blue-100"
              icon={<Briefcase className="w-5 h-5 text-blue-600" />}
            />
            <MetricCard
              title="Offers Extended"
              value={stats.offers}
              subtext="Offered and hired stages"
              colorClass="bg-emerald-50 text-emerald-600 border border-emerald-100"
              icon={<Award className="w-5 h-5 text-emerald-600" />}
            />
            <MetricCard
              title="Archived Pool"
              value={stats.rejected}
              subtext="Rejected candidates"
              colorClass="bg-rose-50 text-rose-600 border border-rose-100"
              icon={<Trash2 className="w-5 h-5 text-rose-600" />}
            />
          </div>

          {/* Roster Split Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left: Applicant Roster */}
            <div className="lg:col-span-5 h-full">
              <CandidateList
                candidates={candidates}
                selectedId={selectedId}
                onSelect={setSelectedId}
                onDelete={handleDeleteCandidate}
                onOpenAddModal={() => setIsAddModalOpen(true)}
              />
            </div>

            {/* Right: Applicant details & notes */}
            <div className="lg:col-span-7 h-full">
              <CandidateDetail
                candidate={selectedCandidate}
                onUpdateStatus={handleUpdateStatus}
                onAddNote={handleAddNote}
                onDeleteNote={handleDeleteNote}
                onUploadResume={handleUploadResumeMeta}
              />
            </div>
          </div>
        </div>

        {/* Simple Footer */}
        <footer className="h-12 border-t border-slate-200 bg-white px-8 flex items-center justify-between text-[11px] text-slate-400 shrink-0">
          <span>RosterPro Applicant Tracking</span>
          <span>Secure sandbox database with IndexedDB & localStorage</span>
        </footer>
      </main>

      {/* Add candidate modal */}
      <AddCandidateModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddCandidate}
      />
    </div>
  );
}
