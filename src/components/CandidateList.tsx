import React, { useState } from 'react';
import { Search, Filter, Trash2, FileText, UserPlus, Calendar, Mail } from 'lucide-react';
import { Candidate, CandidateStatus } from '../types';

interface CandidateListProps {
  candidates: Candidate[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  onOpenAddModal: () => void;
}

export default function CandidateList({
  candidates,
  selectedId,
  onSelect,
  onDelete,
  onOpenAddModal,
}: CandidateListProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [positionFilter, setPositionFilter] = useState<string>('all');

  // Compute unique positions dynamically
  const positions = ['all', ...Array.from(new Set(candidates.map((c) => c.position)))];

  // Filter candidates
  const filteredCandidates = candidates.filter((candidate) => {
    const matchesSearch =
      candidate.name.toLowerCase().includes(search.toLowerCase()) ||
      candidate.email.toLowerCase().includes(search.toLowerCase()) ||
      candidate.position.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'all' || candidate.status === statusFilter;
    const matchesPosition = positionFilter === 'all' || candidate.position === positionFilter;

    return matchesSearch && matchesStatus && matchesPosition;
  });

  // Get status badge classes
  const getStatusBadge = (status: CandidateStatus) => {
    switch (status) {
      case 'Applied':
        return 'bg-slate-100 border-slate-200 text-slate-700';
      case 'Screening':
        return 'bg-blue-50 border-blue-100 text-blue-700';
      case 'Interviewing':
        return 'bg-amber-100/70 border-amber-200 text-amber-700';
      case 'Offered':
        return 'bg-emerald-100/70 border-emerald-200 text-emerald-700';
      case 'Hired':
        return 'bg-emerald-500 border-emerald-600 text-white';
      case 'Rejected':
        return 'bg-rose-100 border-rose-200 text-rose-700';
    }
  };

  // Human-readable date
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div id="candidate-list-panel" className="bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col h-full min-h-[500px]">
      {/* Search & Action Bar */}
      <div className="p-4 border-b border-slate-200 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400">
            Applicants ({filteredCandidates.length})
          </h4>
          <button
            id="open-add-candidate-btn"
            onClick={onOpenAddModal}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Add Applicant
          </button>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4.5 h-4.5 text-slate-400" />
          <input
            id="search-candidates-input"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search candidates..."
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50 transition-all"
          />
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-2 gap-2">
          {/* Status Filter */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Filter className="w-2.5 h-2.5" /> Stage
            </span>
            <select
              id="filter-status-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Stages</option>
              <option value="Applied">Applied</option>
              <option value="Screening">Screening</option>
              <option value="Interviewing">Interviewing</option>
              <option value="Offered">Offered</option>
              <option value="Hired">Hired</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          {/* Position Filter */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Filter className="w-2.5 h-2.5" /> Role
            </span>
            <select
              id="filter-position-select"
              value={positionFilter}
              onChange={(e) => setPositionFilter(e.target.value)}
              className="px-2 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {positions.map((pos) => (
                <option key={pos} value={pos}>
                  {pos === 'all' ? 'All Roles' : pos}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Roster list */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 max-h-[550px]">
        {filteredCandidates.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center text-slate-400 h-64 gap-3">
            <Search className="w-10 h-10 text-slate-300 stroke-[1.5]" />
            <div>
              <p className="text-sm font-semibold">No candidates found</p>
              <p className="text-xs text-slate-400 mt-1">
                Try adjusting your search criteria or add a new candidate.
              </p>
            </div>
          </div>
        ) : (
          filteredCandidates.map((candidate) => (
            <div
              key={candidate.id}
              id={`candidate-card-${candidate.id}`}
              onClick={() => onSelect(candidate.id)}
              className={`p-4 flex items-start justify-between gap-3 cursor-pointer transition-all ${
                selectedId === candidate.id
                  ? 'bg-blue-50/50 border-l-4 border-blue-600'
                  : 'hover:bg-slate-50/70 border-l-4 border-transparent'
              }`}
            >
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <h5 className="text-sm font-semibold text-slate-900 truncate">
                    {candidate.name}
                  </h5>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getStatusBadge(
                      candidate.status
                    )}`}
                  >
                    {candidate.status}
                  </span>
                </div>

                <p className="text-xs text-slate-500 font-medium truncate">
                  {candidate.position}
                </p>

                <div className="flex items-center gap-3 text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    {formatDate(candidate.appliedDate)}
                  </span>
                  {candidate.resumeName && (
                    <span className="flex items-center gap-1 font-semibold text-blue-600">
                      <FileText className="w-3.5 h-3.5 shrink-0" />
                      Resume
                    </span>
                  )}
                </div>
              </div>

              {/* Delete candidate button */}
              <button
                id={`delete-candidate-btn-${candidate.id}`}
                onClick={(e) => onDelete(candidate.id, e)}
                className="p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all shrink-0 align-middle"
                title="Delete applicant record"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
