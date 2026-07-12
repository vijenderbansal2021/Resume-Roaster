import React, { useState, useEffect, useRef } from 'react';
import {
  Mail,
  Phone,
  Calendar,
  FileText,
  Download,
  Plus,
  Trash2,
  CheckCircle,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  Upload,
} from 'lucide-react';
import { Candidate, CandidateStatus, Note } from '../types';
import { getResume, saveResume } from '../utils/db';

interface CandidateDetailProps {
  candidate: Candidate | null;
  onUpdateStatus: (id: string, status: CandidateStatus) => void;
  onAddNote: (id: string, noteContent: string) => void;
  onDeleteNote: (id: string, noteId: string) => void;
  onUploadResume: (id: string, file: File) => void;
}

export default function CandidateDetail({
  candidate,
  onUpdateStatus,
  onAddNote,
  onDeleteNote,
  onUploadResume,
}: CandidateDetailProps) {
  const [newNote, setNewNote] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load the resume file from IndexedDB when candidate changes
  useEffect(() => {
    // Reset file states
    setResumeFile(null);
    setIsPreviewOpen(false);
    setTextContent(null);
    
    // Cleanup prior Object URL to prevent memory leaks
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }

    if (!candidate || !candidate.resumeName) return;

    const loadResume = async () => {
      try {
        const file = await getResume(candidate.id);
        if (file) {
          setResumeFile(file);
        }
      } catch (err) {
        console.error('Error loading resume from IndexedDB:', err);
      }
    };

    loadResume();

    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [candidate?.id]);

  // Handle PDF Preview toggle
  const handleTogglePreview = async () => {
    if (isPreviewOpen) {
      setIsPreviewOpen(false);
      return;
    }

    if (!resumeFile) return;

    if (resumeFile.type === 'application/pdf') {
      const url = URL.createObjectURL(resumeFile);
      setPreviewUrl(url);
      setIsPreviewOpen(true);
    } else if (resumeFile.type === 'text/plain') {
      try {
        const text = await resumeFile.text();
        setTextContent(text);
        setIsPreviewOpen(true);
      } catch (err) {
        console.error('Failed to read text file:', err);
      }
    } else {
      // For other files, trigger download instead or show warning
      alert(`Previews are not supported for "${resumeFile.name}". Click the download icon to save and view the file.`);
    }
  };

  // Trigger download of the resume
  const handleDownload = () => {
    if (!resumeFile) return;
    const url = URL.createObjectURL(resumeFile);
    const link = document.createElement('a');
    link.href = url;
    link.download = resumeFile.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Handle quick resume upload in details
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && candidate) {
      setIsUploading(true);
      const file = e.target.files[0];
      try {
        await saveResume(candidate.id, file);
        onUploadResume(candidate.id, file);
        setResumeFile(file);
      } catch (err) {
        console.error('Error uploading resume:', err);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleAddNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || !candidate) return;
    onAddNote(candidate.id, newNote.trim());
    setNewNote('');
  };

  if (!candidate) {
    return (
      <div id="empty-detail-state" className="bg-white border border-slate-200 rounded-xl shadow-sm p-12 text-center text-slate-400 flex flex-col items-center justify-center h-full min-h-[500px]">
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl shadow-sm text-slate-400 mb-4 animate-bounce">
          <FileText className="w-12 h-12 stroke-[1.5] text-slate-400" />
        </div>
        <h4 className="text-lg font-display font-bold text-slate-700">
          No Applicant Selected
        </h4>
        <p className="text-xs text-slate-400 mt-2 max-w-sm">
          Select an applicant from the roster to view their contact information, track journey status, preview attached resumes, or write session evaluation notes.
        </p>
      </div>
    );
  }

  const stages: CandidateStatus[] = [
    'Applied',
    'Screening',
    'Interviewing',
    'Offered',
    'Hired',
  ];

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  return (
    <div id="candidate-detail-panel" className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-6 h-full flex flex-col justify-between">
      {/* Upper Content Scrollable */}
      <div className="space-y-6 flex-1">
        {/* Contact Header Block */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-200 pb-5">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-1 rounded-md border border-slate-200">
              {candidate.position}
            </span>
            <h3 className="text-2xl font-display font-bold text-slate-900">
              {candidate.name}
            </h3>
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-500 pt-1">
              <span className="flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-slate-400" />
                <a href={`mailto:${candidate.email}`} className="hover:text-blue-600 transition-colors">
                  {candidate.email}
                </a>
              </span>
              {candidate.phone && (
                <span className="flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <a href={`tel:${candidate.phone}`} className="hover:text-blue-600 transition-colors">
                    {candidate.phone}
                  </a>
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-400" />
                Applied {new Date(candidate.appliedDate).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Quick Action - Reject / Re-open */}
          <div className="shrink-0 flex items-center gap-2">
            {candidate.status === 'Rejected' ? (
              <button
                id="btn-reopen-candidate"
                onClick={() => onUpdateStatus(candidate.id, 'Applied')}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-all border border-slate-200 cursor-pointer"
              >
                Re-open Application
              </button>
            ) : (
              <button
                id="btn-reject-candidate"
                onClick={() => onUpdateStatus(candidate.id, 'Rejected')}
                className="px-3.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 font-semibold text-xs rounded-lg transition-all border border-red-200 cursor-pointer"
              >
                Reject Candidate
              </button>
            )}
          </div>
        </div>

        {/* Journey Step Tracker */}
        <div className="space-y-3">
          <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Recruitment Journey
          </h5>
          
          {candidate.status === 'Rejected' ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <div>
                <p className="text-xs font-bold">Application Status: Rejected</p>
                <p className="text-[11px] text-red-600 mt-0.5">
                  This candidate has been moved to the Rejected stage. You can restore their application to standard pipelines by clicking "Re-open" above.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-1 w-full flex-wrap sm:flex-nowrap bg-slate-50 p-2 rounded-xl border border-slate-200">
              {stages.map((stage, idx) => {
                const isCompleted = stages.indexOf(candidate.status) >= idx;
                const isActive = candidate.status === stage;
                
                return (
                  <React.Fragment key={stage}>
                    <button
                      id={`btn-journey-step-${stage.toLowerCase()}`}
                      onClick={() => onUpdateStatus(candidate.id, stage)}
                      className={`flex-1 py-2 px-1 text-center rounded-lg transition-all text-xs font-medium cursor-pointer ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-sm font-semibold'
                          : isCompleted
                          ? 'bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-100/50'
                          : 'bg-white text-slate-500 border border-slate-200/50 hover:bg-slate-100/50'
                      }`}
                    >
                      {stage}
                    </button>
                    {idx < stages.length - 1 && (
                      <ArrowRight className="w-3.5 h-3.5 text-slate-300 hidden sm:block shrink-0" />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          )}
        </div>

        {/* Attachments / CV block */}
        <div className="space-y-3">
          <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Candidate Resume
          </h5>

          {resumeFile ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-4 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg shrink-0 border border-blue-100">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-800 truncate">
                      {resumeFile.name}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {formatSize(resumeFile.size)} • {resumeFile.type || 'Document'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Preview Button */}
                  {(resumeFile.type === 'application/pdf' || resumeFile.type === 'text/plain') && (
                    <button
                      id="btn-preview-resume"
                      onClick={handleTogglePreview}
                      className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg border border-slate-200 transition-all cursor-pointer"
                      title={isPreviewOpen ? 'Hide Preview' : 'Show Live Preview'}
                    >
                      {isPreviewOpen ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  )}

                  {/* Download Button */}
                  <button
                    id="btn-download-resume"
                    onClick={handleDownload}
                    className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg border border-slate-200 transition-all cursor-pointer"
                    title="Download resume file"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Dynamic Preview panel */}
              {isPreviewOpen && (
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-slate-50">
                  <div className="bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-600 border-b border-slate-200 flex items-center justify-between">
                    <span>Document View: {resumeFile.name}</span>
                    <button
                      id="close-preview-btn"
                      onClick={() => setIsPreviewOpen(false)}
                      className="text-slate-400 hover:text-slate-600 text-xs font-semibold cursor-pointer"
                    >
                      Close Preview
                    </button>
                  </div>
                  {resumeFile.type === 'application/pdf' && previewUrl ? (
                    <iframe
                      src={previewUrl}
                      title="Resume Preview"
                      className="w-full h-96 border-none"
                    />
                  ) : textContent ? (
                    <pre className="p-4 font-mono text-[11px] text-slate-700 bg-white overflow-auto max-h-96 whitespace-pre-wrap leading-relaxed">
                      {textContent}
                    </pre>
                  ) : null}
                </div>
              )}
            </div>
          ) : (
            <div
              id="upload-resume-panel"
              onClick={() => fileInputRef.current?.click()}
              className="border border-dashed border-slate-200 hover:border-blue-400 bg-slate-50/50 hover:bg-blue-50/30 p-4 rounded-xl text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1.5"
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.docx,.doc,.txt"
                onChange={handleFileChange}
                disabled={isUploading}
              />
              <Upload className={`w-5 h-5 text-slate-400 ${isUploading ? 'animate-pulse text-blue-500' : ''}`} />
              <p className="text-xs font-semibold text-slate-600">
                {isUploading ? 'Saving document...' : 'No resume attached'}
              </p>
              <p className="text-[10px] text-slate-400">
                {isUploading ? 'Please wait' : 'Click to upload curriculum vitae'}
              </p>
            </div>
          )}
        </div>

        {/* Evaluation notes */}
        <div className="space-y-3">
          <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Timeline & Evaluation Logs
          </h5>

          {/* Notes display */}
          <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
            {candidate.notes.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4 text-center bg-slate-50/30 rounded-xl border border-dashed border-slate-200">
                No notes or logs have been added for this applicant yet.
              </p>
            ) : (
              candidate.notes.map((note) => (
                <div
                  key={note.id}
                  id={`note-log-${note.id}`}
                  className="p-3 bg-slate-50/60 border border-slate-200/80 rounded-xl space-y-1.5 relative group"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-slate-700">
                      {note.author}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {note.date}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed break-words whitespace-pre-wrap">
                    {note.content}
                  </p>

                  <button
                    id={`delete-note-btn-${note.id}`}
                    onClick={() => onDeleteNote(candidate.id, note.id)}
                    className="absolute right-2 top-2 p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-md transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                    title="Delete evaluation note"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Note Creator Form - Sticky to Bottom */}
      <form onSubmit={handleAddNoteSubmit} className="pt-4 border-t border-slate-200 mt-4">
        <div className="flex items-center gap-2 bg-slate-50 rounded-xl p-1 border border-slate-200">
          <input
            id="input-new-note"
            type="text"
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Type a new evaluation note..."
            className="flex-1 bg-transparent px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
          />
          <button
            type="submit"
            id="add-note-submit-btn"
            disabled={!newNote.trim()}
            className={`p-1.5 rounded-lg transition-all flex items-center justify-center shrink-0 cursor-pointer ${
              newNote.trim()
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                : 'bg-slate-100 text-slate-300 cursor-not-allowed'
            }`}
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
