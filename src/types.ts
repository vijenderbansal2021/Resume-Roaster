export type CandidateStatus =
  | 'Applied'
  | 'Screening'
  | 'Interviewing'
  | 'Offered'
  | 'Hired'
  | 'Rejected';

export interface Note {
  id: string;
  content: string;
  date: string;
  author: string;
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  position: string;
  status: CandidateStatus;
  appliedDate: string;
  notes: Note[];
  resumeName?: string;
  resumeType?: string;
  resumeSize?: number;
}
