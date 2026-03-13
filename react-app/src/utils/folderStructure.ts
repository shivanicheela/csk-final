// Folder Structure for Study Materials, Recorded Lectures, and Mock Tests

export const FOLDER_STRUCTURE = {
  UPSC: {
    Prelims: [
      'Indian Polity',
      'History',
      'Indian Economy',
      'Geography',
      'Environment',
      'Science and Tech',
      'Current Affairs',
      'CSAT'
    ],
    Mains: [
      'GS 1',
      'GS 2',
      'GS 3',
      'GS 4'
    ]
  },
  TNPSC: {
    Prelims: [
      'Indian Polity',
      'History (Indian History + INM + TN History)',
      'Geography',
      'Indian Economy',
      'Unit 9',
      'Current Affairs',
      'Aptitude'
    ],
    Mains: [
      'GS 1',
      'GS 2',
      'GS 3'
    ]
  }
}

// Mock Test specific structure
export const MOCK_TEST_STRUCTURE = {
  UPSC: {
    'Full Length Mock Test': [
      'UPSC Prelims Full Test 1',
      'UPSC Prelims Full Test 2',
      'UPSC Prelims Full Test 3',
      'UPSC Mains Full Test 1',
      'UPSC Mains Full Test 2',
      'UPSC Integrated Test 1'
    ],
    'Subject Specific Mock Test': [
      'Indian Polity Test',
      'History Test',
      'Indian Economy Test',
      'Geography Test',
      'Environment Test',
      'Science and Tech Test',
      'Current Affairs Test',
      'CSAT Test',
      'GS Paper 1 Test',
      'GS Paper 2 Test',
      'GS Paper 3 Test',
      'GS Paper 4 Test'
    ]
  },
  TNPSC: {
    'Full Length Mock Test': [
      'TNPSC Prelims Full Test 1',
      'TNPSC Prelims Full Test 2',
      'TNPSC Prelims Full Test 3',
      'TNPSC Mains Full Test 1',
      'TNPSC Mains Full Test 2',
      'TNPSC Integrated Test 1'
    ],
    'Subject Specific Mock Test': [
      'Indian Polity Test',
      'History Test (Indian + INM + TN)',
      'Geography Test',
      'Indian Economy Test',
      'Unit 9 Test',
      'Current Affairs Test',
      'Aptitude Test',
      'GS Paper 1 Test',
      'GS Paper 2 Test',
      'GS Paper 3 Test'
    ]
  }
}

export const RESOURCE_CATEGORIES = [
  {
    id: 'study-material',
    name: 'Study Material',
    icon: '📚',
    description: 'PDFs, Notes, and Study Documents'
  },
  {
    id: 'recorded-lectures',
    name: 'Recorded Lectures',
    icon: '🎥',
    description: 'Video Lectures and Recordings'
  },
  {
    id: 'mock-tests',
    name: 'Mock Tests',
    icon: '✅',
    description: 'Practice Tests and Assessments'
  }
]

export type ExamType = 'UPSC' | 'TNPSC'
export type LevelType = 'Prelims' | 'Mains'
export type MockTestType = 'Full Length Mock Test' | 'Subject Specific Mock Test'

export const getSubjects = (exam: ExamType, level: LevelType): string[] => {
  return FOLDER_STRUCTURE[exam]?.[level] || []
}

export const getMockTestItems = (exam: ExamType, testType: MockTestType): string[] => {
  return MOCK_TEST_STRUCTURE[exam]?.[testType] || []
}

