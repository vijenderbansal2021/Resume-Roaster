import React, { useState, useRef, DragEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Upload, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { CandidateStatus } from '../types';

interface AddCandidateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: {
    name: string;
    email: string;
    phone: string;
    position: string;
    status: CandidateStatus;
    resumeFile?: File;
    initialNotes?: string;
  }) => void;
}

export default function AddCandidateModal({
  isOpen,
  onClose,
  onAdd,
}: AddCandidateModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [position, setPosition] = useState('');
  const [status, setStatus] = useState<CandidateStatus>('Applied');
  const [initialNotes, setInitialNotes] = useState('');
  
  // File upload state
  const [file, setFile] = useState<File | undefined>(undefined);
  const [isDragActive, setIsDragActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form Reset
  const resetForm = () => {
    setName('');
    setEmail('');
    setPhone('');
    setPosition('');
    setStatus('Applied');
    setInitialNotes('');
    setFile(undefined);
    setErrorMsg('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Drag and Drop Handlers
  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      validateAndSetFile(droppedFile);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (uploadedFile: File) => {
    // Basic format filter
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ];
    
    if (!allowedTypes.includes(uploadedFile.type) && !uploadedFile.name.endsWith('.pdf') && !uploadedFile.name.endsWith('.docx') && !uploadedFile.name.endsWith('.doc')) {
      setErrorMsg('Please upload a valid document format (PDF, DOCX, DOC, or TXT).');
      return;
    }

    if (uploadedFile.size > 10 * 1024 * 1024) { // 10MB Limit
      setErrorMsg('File is too large. Max size is 10MB.');
      return;
    }

    setFile(uploadedFile);
    setErrorMsg('');
  };

  const handleRemoveFile = () => {
    setFile(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setErrorMsg('Please enter candidate name.');
      return;
    }
    if (!email.trim()) {
      setErrorMsg('Please enter email address.');
      return;
    }
    if (!position.trim()) {
      setErrorMsg('Please enter position/role.');
      return;
    }

    onAdd({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      position: position.trim(),
      status,
      resumeFile: file,
      initialNotes: initialNotes.trim(),
    });

    handleClose();
  };

  // Quick helper to format file size
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            id="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
          />

          {/* Modal Container */}
          <motion.div
            id="add-candidate-modal-container"
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden mx-4 flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-xl font-display font-bold text-slate-800">
                  Add New Applicant
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Register a candidate and attach their curriculum vitae.
                </p>
              </div>
              <button
                id="close-modal-btn"
                onClick={handleClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Error Message */}
              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-start gap-2 animate-shake">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Form Fields Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Name */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-600">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="input-candidate-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Sarah Connor"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>

                {/* Email */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-600">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="input-candidate-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. sarah.c@example.com"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>

                {/* Phone */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-600">
                    Phone Number
                  </label>
                  <input
                    id="input-candidate-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +1 (555) 019-2834"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>

                {/* Position */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-600">
                    Target Position <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="input-candidate-position"
                    type="text"
                    required
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    placeholder="e.g. Frontend Engineer"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>

                {/* Stage Status */}
                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label className="text-xs font-semibold text-slate-600">
                    Initial Recruitment Stage
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {(['Applied', 'Screening', 'Interviewing', 'Offered', 'Hired', 'Rejected'] as CandidateStatus[]).map((stage) => (
                      <button
                        key={stage}
                        id={`btn-stage-select-${stage.toLowerCase()}`}
                        type="button"
                        onClick={() => setStatus(stage)}
                        className={`py-2 px-1 text-xs font-medium rounded-lg text-center border transition-all ${
                          status === stage
                            ? 'bg-blue-50 border-blue-300 text-blue-700 shadow-xs'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {stage}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Custom Uploader Dropzone */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600">
                  Attach Resume Document
                </label>
                <div
                  id="resume-dropzone"
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center ${
                    isDragActive
                      ? 'border-blue-500 bg-blue-50/50 scale-[0.99]'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100/50 hover:border-slate-300'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept=".pdf,.docx,.doc,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                    onChange={handleFileInput}
                  />

                  {!file ? (
                    <>
                      <div className="p-3 bg-white border border-slate-100 rounded-xl shadow-xs text-slate-500 mb-2">
                        <Upload className="w-6 h-6 text-blue-500" />
                      </div>
                      <p className="text-sm font-semibold text-slate-700">
                        Drag & Drop or click to browse
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Supports PDF, DOCX, DOC, or TXT (Max 10MB)
                      </p>
                    </>
                  ) : (
                    <div className="flex items-center gap-3 w-full max-w-md bg-white p-3 border border-slate-100 rounded-xl shadow-xs text-left">
                      <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">
                          {file.name}
                        </p>
                        <p className="text-xs text-slate-400">
                          {formatSize(file.size)} • Attached successfully
                        </p>
                      </div>
                      <button
                        type="button"
                        id="remove-file-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveFile();
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Initial notes */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600">
                  Initial Evaluation / Notes
                </label>
                <textarea
                  id="textarea-initial-notes"
                  value={initialNotes}
                  onChange={(e) => setInitialNotes(e.target.value)}
                  placeholder="e.g. Impressive project list, referred by Sarah. Strong communication."
                  rows={3}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                />
              </div>

              {/* Form Footer Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50 -mx-6 -mb-6 p-6">
                <button
                  type="button"
                  id="cancel-add-btn"
                  onClick={handleClose}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-xl text-sm font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="submit-candidate-btn"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-xs flex items-center gap-2 transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Add Candidate
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
