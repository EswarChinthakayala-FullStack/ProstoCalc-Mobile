import {
  CheckCircle2,
  FileText,
  ClipboardList,
  PlayCircle,
  Activity,
  Clock,
  Star
} from 'lucide-react'

export const TIMELINE_STAGES = [
  { id: 'CONSULTATION_APPROVED', label: 'Consultation Approved', icon: CheckCircle2, desc: 'Initial request validated and confirmed.' },
  { id: 'DIAGNOSIS_COMPLETED', label: 'Diagnosis Completed', icon: FileText, desc: 'Clinical assessment finalized.' },
  { id: 'TREATMENT_PLANNED', label: 'Treatment Planned', icon: ClipboardList, desc: 'Procedures mapped and approved.' },
  { id: 'TREATMENT_STARTED', label: 'Treatment Started', icon: PlayCircle, desc: 'First clinical session initiated.' },
  { id: 'IN_PROGRESS', label: 'In Progress', icon: Activity, desc: 'Active procedure execution.' },
  { id: 'FOLLOW_UP', label: 'Follow Up', icon: Clock, desc: 'Post-op observation period.' },
  { id: 'COMPLETED', label: 'Completed', icon: Star, desc: 'Case successfully closed.' },
]
