// resourceManager.ts
// Organize and manage study materials by subject and category

export interface StudyMaterial {
  id: string;
  title: string;
  type: 'PDF' | 'Video' | 'Article' | 'Notes';
  size: string;
  category: string;
  subject: string;
  url?: string;
  description?: string;
  uploadedAt?: Date;
  viewCount?: number;
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
}

export interface ResourceCategory {
  category: string;
  subject: string;
  emoji: string;
  color: string;
  materials: StudyMaterial[];
}

// Predefined subject categories for UPSC/TNPSC
export const SUBJECT_CATEGORIES = {
  GENERALSTUDIES: {
    name: 'General Studies',
    emoji: '📚',
    color: 'from-blue-500 to-blue-600',
    subcategories: [
      { id: 'history', name: 'History & Culture', emoji: '🏛️' },
      { id: 'geography', name: 'Geography', emoji: '🗺️' },
      { id: 'polity', name: 'Polity & Governance', emoji: '⚖️' },
      { id: 'economy', name: 'Economy', emoji: '💰' },
      { id: 'scitech', name: 'Science & Tech', emoji: '🔬' },
      { id: 'currentaffairs', name: 'Current Affairs', emoji: '📰' }
    ]
  },
  OPTIONALSUBJECT: {
    name: 'Optional Subjects',
    emoji: '🎓',
    color: 'from-purple-500 to-purple-600',
    subcategories: [
      { id: 'publicadmin', name: 'Public Administration', emoji: '📋' },
      { id: 'sociology', name: 'Sociology', emoji: '👥' },
      { id: 'psychology', name: 'Psychology', emoji: '🧠' },
      { id: 'economics', name: 'Economics', emoji: '📊' },
      { id: 'history', name: 'History', emoji: '📖' },
      { id: 'geography', name: 'Geography', emoji: '🌏' }
    ]
  },
  ANSWERWRITING: {
    name: 'Answer Writing',
    emoji: '✍️',
    color: 'from-orange-500 to-orange-600',
    subcategories: [
      { id: 'techniques', name: 'Writing Techniques', emoji: '📝' },
      { id: 'examples', name: 'Answer Examples', emoji: '💡' },
      { id: 'feedback', name: 'Personalized Feedback', emoji: '💬' }
    ]
  }
};

// Organize materials by category and subject
export function organizeByCategory(materials: StudyMaterial[]): ResourceCategory[] {
  const organized: { [key: string]: ResourceCategory } = {};

  for (const material of materials) {
    const key = `${material.subject}-${material.category}`;

    if (!organized[key]) {
      const subjectInfo = SUBJECT_CATEGORIES[material.subject as keyof typeof SUBJECT_CATEGORIES];
      const categoryInfo = subjectInfo?.subcategories?.find(
        (sub) => sub.id === material.category
      );

      organized[key] = {
        category: material.category,
        subject: material.subject,
        emoji: categoryInfo?.emoji || '📄',
        color: subjectInfo?.color || 'from-gray-500 to-gray-600',
        materials: []
      };
    }

    organized[key].materials.push(material);
  }

  return Object.values(organized);
}

// Sample materials data for Dashboard (replace with Firestore data)
export const SAMPLE_MATERIALS: StudyMaterial[] = [
  // General Studies - History
  {
    id: '1',
    title: 'Ancient India: Vedic Period to Mauryan Empire',
    type: 'PDF',
    size: '2.3 MB',
    category: 'history',
    subject: 'GENERALSTUDIES',
    description: 'Comprehensive notes on ancient Indian history',
    difficulty: 'Intermediate',
    viewCount: 245
  },
  {
    id: '2',
    title: 'Medieval India: Delhi Sultanate and Mughal Era',
    type: 'PDF',
    size: '1.8 MB',
    category: 'history',
    subject: 'GENERALSTUDIES',
    description: 'Detailed coverage of medieval period',
    difficulty: 'Intermediate',
    viewCount: 189
  },
  // General Studies - Geography
  {
    id: '3',
    title: 'Physical Geography of India',
    type: 'PDF',
    size: '2.1 MB',
    category: 'geography',
    subject: 'GENERALSTUDIES',
    description: 'Mountains, rivers, climate, and natural resources',
    difficulty: 'Beginner',
    viewCount: 312
  },
  {
    id: '4',
    title: 'Regional Geography: North India',
    type: 'PDF',
    size: '1.5 MB',
    category: 'geography',
    subject: 'GENERALSTUDIES',
    description: 'Regional characteristics and demographics',
    difficulty: 'Intermediate',
    viewCount: 167
  },
  // General Studies - Polity
  {
    id: '5',
    title: 'Indian Constitution: Part I & II',
    type: 'PDF',
    size: '2.8 MB',
    category: 'polity',
    subject: 'GENERALSTUDIES',
    description: 'Preamble, Fundamental Rights, and Directive Principles',
    difficulty: 'Intermediate',
    viewCount: 456
  },
  {
    id: '6',
    title: 'Union and State Governments',
    type: 'PDF',
    size: '1.9 MB',
    category: 'polity',
    subject: 'GENERALSTUDIES',
    description: 'Executive, Legislature, and Judiciary in India',
    difficulty: 'Intermediate',
    viewCount: 278
  },
  // General Studies - Economy
  {
    id: '7',
    title: 'Macro Economics: GDP, Inflation & Budget',
    type: 'PDF',
    size: '3.1 MB',
    category: 'economy',
    subject: 'GENERALSTUDIES',
    description: 'Essential economic concepts and Indian economy overview',
    difficulty: 'Advanced',
    viewCount: 198
  },
  // General Studies - Current Affairs
  {
    id: '8',
    title: 'Current Affairs Monthly - March 2026',
    type: 'PDF',
    size: '1.2 MB',
    category: 'currentaffairs',
    subject: 'GENERALSTUDIES',
    description: 'Latest news and events affecting UPSC exam',
    difficulty: 'Beginner',
    viewCount: 823
  },
  // Answer Writing
  {
    id: '9',
    title: 'Mains Answer Writing: Technique & Structure',
    type: 'PDF',
    size: '1.6 MB',
    category: 'techniques',
    subject: 'ANSWERWRITING',
    description: 'How to structure answers for maximum marks',
    difficulty: 'Intermediate',
    viewCount: 534
  },
  {
    id: '10',
    title: '10 Model Answers on Indian History',
    type: 'PDF',
    size: '2.4 MB',
    category: 'examples',
    subject: 'ANSWERWRITING',
    description: 'Sample answers for history questions with marking scheme',
    difficulty: 'Intermediate',
    viewCount: 389
  }
];

// Filter materials by difficulty level
export function filterByDifficulty(
  materials: StudyMaterial[],
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
): StudyMaterial[] {
  return materials.filter((m) => m.difficulty === difficulty);
}

// Sort materials by view count
export function sortByPopularity(materials: StudyMaterial[]): StudyMaterial[] {
  return [...materials].sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
}

// Search materials
export function searchMaterials(
  materials: StudyMaterial[],
  query: string
): StudyMaterial[] {
  const lowerQuery = query.toLowerCase();
  return materials.filter(
    (m) =>
      m.title.toLowerCase().includes(lowerQuery) ||
      m.description?.toLowerCase().includes(lowerQuery) ||
      m.category.toLowerCase().includes(lowerQuery)
  );
}

// Get total materials count by category
export function getCategoryStats(materials: StudyMaterial[]): {
  [key: string]: number;
} {
  const stats: { [key: string]: number } = {};

  for (const material of materials) {
    const key = material.category;
    stats[key] = (stats[key] || 0) + 1;
  }

  return stats;
}
