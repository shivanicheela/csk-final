// liveSessionManager.ts
// Manage live sessions, scheduling, and real-time interactions

export interface LiveSession {
  id: string;
  title: string;
  topic: string;
  instructor: string;
  instructorEmail?: string;
  description?: string;
  scheduledAt: Date;
  duration: number; // in minutes
  zoomLink?: string;
  youtubeLink?: string;
  status: 'upcoming' | 'live' | 'completed';
  maxParticipants?: number;
  enrolledCount?: number;
  recordingUrl?: string;
  notes?: string;
  category?: 'UPSC' | 'TNPSC';
  subject?: string;
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
}

export interface SessionRegistration {
  id?: string;
  userId: string;
  sessionId: string;
  registeredAt: Date;
  attendanceStatus?: 'registered' | 'attended' | 'missed';
  feedbackRating?: number;
  feedbackText?: string;
}

// Live sessions database mock
export let LIVE_SESSIONS: LiveSession[] = [];

// Initialize sample sessions
export function initializeSessions() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  LIVE_SESSIONS = [
    {
      id: 'session-001',
      title: 'UPSC Mains Strategy & Time Management',
      topic: 'Exam Strategy',
      instructor: 'Priya Sharma',
      instructorEmail: 'priya@csk.com',
      description: 'Learn proven strategies to crack UPSC Mains within the time limit',
      scheduledAt: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000 + 14 * 60 * 60 * 1000), // Tomorrow at 2 PM
      duration: 60,
      zoomLink: 'https://zoom.us/j/sample-meeting-id',
      youtubeLink: 'https://youtube.com/csk-live-1',
      status: 'upcoming',
      maxParticipants: 500,
      enrolledCount: 234,
      category: 'UPSC',
      subject: 'General Studies',
      difficulty: 'Intermediate'
    },
    {
      id: 'session-002',
      title: 'Current Affairs Discussion: Building & Urban Issues',
      topic: 'Current Affairs',
      instructor: 'Rajesh Kumar',
      instructorEmail: 'rajesh@csk.com',
      description: 'Real-time discussion on latest news and their impact on UPSC exam',
      scheduledAt: new Date(today.getTime() + 1 * 24 * 60 * 60 * 1000 + 18 * 60 * 60 * 1000), // Tomorrow at 6 PM
      duration: 90,
      zoomLink: 'https://zoom.us/j/sample-meeting-id-2',
      youtubeLink: 'https://youtube.com/csk-live-2',
      status: 'upcoming',
      maxParticipants: 300,
      enrolledCount: 156,
      category: 'UPSC',
      subject: 'Current Affairs',
      difficulty: 'Intermediate'
    },
    {
      id: 'session-003',
      title: 'TNPSC Group 1: Polity Revision Session',
      topic: 'Indian Polity',
      instructor: 'Kavya Menon',
      instructorEmail: 'kavya@csk.com',
      description: 'Complete revision of Indian Constitution and Governance',
      scheduledAt: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000), // 5 days at 10 AM
      duration: 120,
      zoomLink: 'https://zoom.us/j/sample-meeting-id-3',
      status: 'upcoming',
      maxParticipants: 400,
      enrolledCount: 312,
      category: 'TNPSC',
      subject: 'Polity',
      difficulty: 'Intermediate'
    },
    {
      id: 'session-004',
      title: 'Answer Writing Workshop: Section C & D',
      topic: 'Answer Writing',
      instructor: 'Dr. Vijay Singh',
      instructorEmail: 'vijay@csk.com',
      description: 'Live feedback on answer writing with interactive Q&A',
      scheduledAt: new Date(now.getTime() - 30 * 60 * 1000), // 30 mins ago - LIVE NOW
      duration: 75,
      zoomLink: 'https://zoom.us/j/sample-live-now',
      youtubeLink: 'https://youtube.com/watch?v=dQw4w9WgXcQ', // Valid YouTube link
      status: 'live',
      maxParticipants: 200,
      enrolledCount: 145,
      category: 'UPSC',
      subject: 'Answer Writing',
      difficulty: 'Advanced'
    },
    {
      id: 'session-005',
      title: 'History Optional: Ancient Indian Art & Architecture',
      topic: 'Optional Subject',
      instructor: 'Prof. Arjun Desai',
      instructorEmail: 'arjun@csk.com',
      description: 'Deep dive into ancient Indian art, architecture, and culture',
      scheduledAt: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000), // 3 days ago - COMPLETED
      duration: 105,
      status: 'completed',
      recordingUrl: 'https://youtube.com/watch?v=jNQXAC9IVRw', // Valid YouTube link
      maxParticipants: 350,
      enrolledCount: 287,
      category: 'UPSC',
      subject: 'History Optional',
      difficulty: 'Advanced'
    },
    {
      id: 'session-006',
      title: 'General Science: NEET-based GS Questions',
      topic: 'General Studies - Science',
      instructor: 'Dr. Neha Patel',
      instructorEmail: 'neha@csk.com',
      description: 'Science questions that appear in UPSC from NEET perspective',
      scheduledAt: new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000 + 11 * 60 * 60 * 1000), // 10 days at 11 AM
      duration: 60,
      zoomLink: 'https://zoom.us/j/sample-meeting-id-4',
      status: 'upcoming',
      maxParticipants: 450,
      enrolledCount: 189,
      category: 'UPSC',
      subject: 'Science',
      difficulty: 'Intermediate'
    }
  ];
}

// Get upcoming sessions
export function getUpcomingSessions(limit?: number): LiveSession[] {
  const upcoming = LIVE_SESSIONS.filter((s) => s.status === 'upcoming').sort(
    (a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime()
  );
  return limit ? upcoming.slice(0, limit) : upcoming;
}

// Get live now sessions
export function getLiveSessions(): LiveSession[] {
  return LIVE_SESSIONS.filter((s) => s.status === 'live');
}

// Get completed sessions (recordings)
export function getCompletedSessions(limit?: number): LiveSession[] {
  const completed = LIVE_SESSIONS.filter((s) => s.status === 'completed').sort(
    (a, b) => b.scheduledAt.getTime() - a.scheduledAt.getTime()
  );
  return limit ? completed.slice(0, limit) : completed;
}

// Get sessions by category
export function getSessionsByCategory(category: 'UPSC' | 'TNPSC'): LiveSession[] {
  return LIVE_SESSIONS.filter((s) => s.category === category);
}

// Get sessions by subject
export function getSessionsBySubject(subject: string): LiveSession[] {
  return LIVE_SESSIONS.filter((s) => s.subject === subject);
}

// Register for a session
export function registerForSession(
  userId: string,
  sessionId: string
): SessionRegistration | null {
  const session = LIVE_SESSIONS.find((s) => s.id === sessionId);
  if (!session) return null;

  if ((session.enrolledCount || 0) >= (session.maxParticipants || 500)) {
    console.warn('Session is full');
    return null;
  }

  session.enrolledCount = (session.enrolledCount || 0) + 1;

  return {
    id: `reg-${Date.now()}`,
    userId,
    sessionId,
    registeredAt: new Date(),
    attendanceStatus: 'registered'
  };
}

// Unregister from session
export function unregisterFromSession(
  userId: string,
  sessionId: string
): boolean {
  const session = LIVE_SESSIONS.find((s) => s.id === sessionId);
  if (!session || (session.enrolledCount || 0) === 0) return false;

  session.enrolledCount = (session.enrolledCount || 0) - 1;
  return true;
}

// Format date for display
export function formatSessionDate(date: Date): string {
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

// Format time for display
export function formatSessionTime(date: Date): string {
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

// Get time until session starts
export function getTimeUntilSession(sessionDate: Date): string {
  const now = new Date();
  const diff = sessionDate.getTime() - now.getTime();

  if (diff < 0) {
    return 'Session Started';
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) {
    return `${days}d ${hours}h`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

// Get status badge color
export function getStatusBadgeColor(
  status: 'upcoming' | 'live' | 'completed'
): string {
  switch (status) {
    case 'upcoming':
      return 'bg-blue-100 text-blue-700';
    case 'live':
      return 'bg-red-100 text-red-700 animate-pulse';
    case 'completed':
      return 'bg-green-100 text-green-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}

// Get status emoji
export function getStatusEmoji(status: 'upcoming' | 'live' | 'completed'): string {
  switch (status) {
    case 'upcoming':
      return '⏰';
    case 'live':
      return '🔴';
    case 'completed':
      return '✅';
    default:
      return '❓';
  }
}
