
import { User, UserRole, Question, QuestionType, SkillCategory, DifficultyLevel, ClassSession, OnlineModule, StudentSessionReport, LevelHistory, StudentModuleProgress, Location, CoursePreset, Olympiad, OlympiadStatus, Transaction, PlacementQuestion, PlacementSubmission, CEFRLevel, News, StudentOfTheMonth, TeacherApplication, ApplicationStatus, OlympiadRegistration, TuitionInvoice } from './types';

// Dynamic Date Helpers
const NOW = new Date();

const getFutureDate = (daysToAdd: number, hoursToAdd: number = 0) => {
  const d = new Date(NOW);
  d.setDate(d.getDate() + daysToAdd);
  d.setHours(d.getHours() + hoursToAdd);
  return d.toISOString();
};

const getPastDate = (daysToSubtract: number) => {
  const d = new Date(NOW);
  d.setDate(d.getDate() - daysToSubtract);
  return d.toISOString();
};

export const MOCK_OLYMPIAD_REGISTRATIONS: OlympiadRegistration[] = [
  { id: 'reg1', olympiadId: 'ol1', name: 'Budi Santoso', email: 'budi@gmail.com', wa: '081234567890', school: 'SMA N 1 Jakarta', grade: 'SMA', status: 'SUCCESS', timestamp: getPastDate(1) },
  { id: 'reg2', olympiadId: 'ol1', name: 'Siska Putri', email: 'siska@yahoo.com', wa: '089876543210', school: 'SMP N 3 Bandung', grade: 'SMP', status: 'PENDING', timestamp: getPastDate(2) },
];

export const MOCK_TUITION_INVOICES: TuitionInvoice[] = [
  { id: 'inv1', studentId: 'u3', studentName: 'Sarah Connor', month: 'October 2024', amount: 750000, status: 'PAID', dueDate: getPastDate(5) },
  { id: 'inv2', studentId: 'u3', studentName: 'Sarah Connor', month: 'November 2024', amount: 750000, status: 'UNPAID', dueDate: getFutureDate(10) },
  { id: 'inv3', studentId: 'u5', studentName: 'John Wick', month: 'November 2024', amount: 900000, status: 'UNPAID', dueDate: getFutureDate(5) },
];

export const LEVEL_COLORS: Record<DifficultyLevel, string> = {
  [DifficultyLevel.ADVANCED]: 'bg-gray-100 text-gray-700 border-gray-200', 
  [DifficultyLevel.UPPER_INTERMEDIATE]: 'bg-gray-100 text-gray-700 border-gray-200',
  [DifficultyLevel.INTERMEDIATE]: 'bg-gray-100 text-gray-700 border-gray-200',
  [DifficultyLevel.ELEMENTARY]: 'bg-gray-100 text-gray-700 border-gray-200', 
  [DifficultyLevel.STARTER]: 'bg-gray-100 text-gray-700 border-gray-200', 
};

export const MOCK_TEACHER_APPLICATIONS: TeacherApplication[] = [
  {
    id: 'app1',
    name: 'David Miller',
    dob: '1990-05-15',
    experience: 8,
    hasDegree: true,
    country: 'United Kingdom',
    motivation: 'I have always been fascinated by Indonesian culture and want to help students achieve global success through English fluency.',
    salary: 2500,
    type: 'native',
    status: ApplicationStatus.PENDING,
    appliedDate: getPastDate(1),
    photoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=2070&auto=format&fit=crop'
  },
  {
    id: 'app2',
    name: 'Siti Aminah',
    dob: '1995-11-20',
    experience: 4,
    hasDegree: true,
    country: 'Indonesia',
    motivation: 'Saya ingin mengabdikan diri di ELC karena sistem adaptifnya sangat revolusioner bagi perkembangan pendidikan di Indonesia.',
    salary: 800,
    type: 'local',
    status: ApplicationStatus.REVIEWED,
    appliedDate: getPastDate(3),
    photoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=1976&auto=format&fit=crop'
  }
];

export const MOCK_NEWS: News[] = [
  {
    id: 'n1',
    title: 'ELC Students Win National English Debate Competition',
    summary: 'Our advanced debate team took first place at the 2024 National English Challenge in Jakarta.',
    content: '<p><b>Jakarta, 2024</b> - We are proud to announce that our students have excelled once again!</p><p>The debate team consisting of three intermediate students managed to defeat 20 other schools in the final round. Their mastery of the English language and quick thinking were the keys to victory.</p><p><i>"This system really helped us prepare,"</i> said one of the winners. Click <a href="https://google.com" target="_blank">here</a> to read more about their journey.</p>',
    featuredImage: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=2070&auto=format&fit=crop',
    displayMedia: 'image',
    publishedDate: getPastDate(2)
  },
  {
    id: 'n2',
    title: 'New Adaptive Learning Features Launched',
    summary: 'We have updated our core logic to provide even more personalized feedback for grammar and vocabulary modules.',
    content: '<h3>Next-Gen Learning</h3><p>Our engineering team has been working hard to bring you the best adaptive experience. The new system analyzes your mistakes more deeply and provides specific materials for improvement.</p>',
    featuredImage: 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?q=80&w=1974&auto=format&fit=crop',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    displayMedia: 'video',
    publishedDate: getPastDate(5)
  },
  {
    id: 'n3',
    title: 'Upcoming Center Opening in Surabaya',
    summary: 'Expand your horizons! ELC is coming to Surabaya this December with state-of-the-art facilities.',
    content: '<p>Great news for English learners in East Java! Our new branch will feature high-tech classrooms and an immersive English-only environment.</p>',
    featuredImage: 'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2069&auto=format&fit=crop',
    displayMedia: 'image',
    publishedDate: getPastDate(10)
  }
];

export const MOCK_STUDENTS_OF_THE_MONTH: StudentOfTheMonth[] = [
  {
    id: 'sm1',
    name: 'Alya Putri',
    monthYear: 'October 2024',
    achievement: 'Increased CEFR level from A2 to B2 in just 3 months using Adaptive Grammar modules.',
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=2070&auto=format&fit=crop'
  },
  {
    id: 'sm2',
    name: 'Rafi Ramadhan',
    monthYear: 'October 2024',
    achievement: 'Achieved the highest score in the Regional English Olympiad 2024 Junior category.',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=1974&auto=format&fit=crop'
  },
  {
    id: 'sm3',
    name: 'Bunga Citra',
    monthYear: 'September 2024',
    achievement: 'Outstanding participation in Business English seminars and consistent 95+ scores in essays.',
    image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=1976&auto=format&fit=crop'
  }
];

export const MOCK_LOCATIONS: Location[] = [
  { id: 'loc1', name: 'Jakarta Center - Room A', address: 'Main Campus, Floor 1', capacity: 20 },
  { id: 'loc2', name: 'Jakarta Center - Room B', address: 'Main Campus, Floor 1', capacity: 15 },
  { id: 'loc3', name: 'Online (Zoom)', address: 'Virtual', capacity: 100 },
  { id: 'loc4', name: 'Bandung Branch - Lab 1', address: 'Dago St, No 4', capacity: 25 },
];

export const MOCK_COURSES: CoursePreset[] = [
  { id: 'c1', title: 'Business English: Negotiation Tactics', skillCategory: SkillCategory.SPEAKING, defaultLevel: DifficultyLevel.UPPER_INTERMEDIATE },
  { id: 'c2', title: 'IELTS Prep: Advanced Listening', skillCategory: SkillCategory.LISTENING, defaultLevel: DifficultyLevel.ADVANCED },
  { id: 'c3', title: 'Past Tense Mastery', skillCategory: SkillCategory.GRAMMAR, defaultLevel: DifficultyLevel.INTERMEDIATE },
  { id: 'c4', title: 'Academic Writing 101', skillCategory: SkillCategory.WRITING, defaultLevel: DifficultyLevel.INTERMEDIATE },
  { id: 'c5', title: 'Pronunciation Basics', skillCategory: SkillCategory.SPEAKING, defaultLevel: DifficultyLevel.ELEMENTARY },
];

export const MOCK_PLACEMENT_QUESTIONS: PlacementQuestion[] = [
  {
    id: 'pq1',
    text: "She ___ to the gym every morning before work.",
    options: ["go", "goes", "going", "gone"],
    correctAnswerIndex: 1,
    weight: 10
  },
  {
    id: 'pq2',
    text: "I haven't seen him ___ last summer.",
    options: ["for", "since", "during", "while"],
    correctAnswerIndex: 1,
    weight: 15
  }
];

export const MOCK_PLACEMENT_RESULTS: PlacementSubmission[] = [
  {
    id: 'ps1',
    name: 'Budi Santoso',
    email: 'budi@gmail.com',
    grade: 'SMA Kelas 11',
    wa: '081234567890',
    score: 85,
    cefrResult: CEFRLevel.B2,
    timestamp: getPastDate(1),
    dob: '2007-05-15',
    parentWa: '081122334455',
    address: 'Jl. Melati No. 5, Jakarta Selatan',
    schoolOrigin: 'SMA Negeri 1 Jakarta'
  }
];

export const MOCK_OLYMPIADS: Olympiad[] = [
  {
    id: 'ol1',
    title: 'National English Olympiad 2024',
    description: 'Ajang bergengsi tingkat nasional untuk menguji kemampuan bahasa Inggris Anda melalui serangkaian tes adaptif.',
    status: OlympiadStatus.OPEN,
    startDate: getPastDate(1),
    endDate: getFutureDate(14),
    participantCount: 450,
    reward: 'Gold Trophy + $500 Scholarship',
    price: 150000,
    terms: '1. Peserta harus merupakan siswa aktif tingkat SD/SMP/SMA.\n2. Menggunakan perangkat dengan koneksi internet stabil.\n3. Keputusan dewan juri bersifat mutlak dan tidak dapat diganggu gugat.',
    benefits: [
      { title: "Sertifikat Nasional", description: "E-Certificate berlisensi." },
      { title: "Analisis Skor Detail", description: "Laporan performa CEFR." },
      { title: "Beasiswa Belajar", description: "Potongan harga khusus di ELC." }
    ],
    questions: [
      {
        id: 'q1',
        text: 'What is the most appropriate idiom for "being very happy"?',
        options: ['Over the moon', 'Under the weather'],
        correctAnswerIndex: 0
      }
    ]
  }
];

export const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx1',
    studentId: 'u3',
    studentName: 'Sarah Connor',
    olympiadId: 'ol1',
    olympiadTitle: 'National English Olympiad 2024',
    amount: 150000,
    status: 'SUCCESS',
    timestamp: getPastDate(2)
  }
];

export const MOCK_USERS: User[] = [
  { id: 'u1', name: 'Super Admin', email: 'admin@elc.com', password: 'password123', role: UserRole.ADMIN, status: 'ACTIVE' },
  { id: 'u2', name: 'Mr. John Keating', email: 'john@elc.com', password: 'password123', role: UserRole.TEACHER, status: 'ACTIVE' },
  { id: 'u3', name: 'Sarah Connor', email: 'sarah@student.com', password: 'password123', phone: '0812-9988-7766', role: UserRole.STUDENT, branch: 'Jakarta Center', status: 'ACTIVE' },
  { id: 'u4', name: 'Kyle Reese', email: 'kyle@parent.com', password: 'password123', phone: '0811-2233-4455', address: 'Jl. Palmerah No. 12, Jakarta Barat', role: UserRole.PARENT, linkedStudentId: 'u3', status: 'ACTIVE' },
  { id: 'u5', name: 'John Wick', email: 'wick@student.com', password: 'password123', phone: '0813-1122-3344', role: UserRole.STUDENT, branch: 'Jakarta Center', status: 'INACTIVE' }
];

export const MOCK_SESSIONS: ClassSession[] = [
  {
    id: 's_today_1',
    teacherId: 'u2',
    topic: 'Business English: Negotiation Tactics',
    skillCategory: SkillCategory.SPEAKING,
    difficultyLevel: DifficultyLevel.UPPER_INTERMEDIATE,
    dateTime: getFutureDate(0, 3), 
    location: 'Jakarta Center - Room A',
    description: 'Roleplay scenarios for negotiating salary.',
    materials: ['negotiation_vocab.pdf'],
    hasExam: false,
    examMaterials: []
  }
];

export const MOCK_ONLINE_MODULES: OnlineModule[] = [
  {
    id: 'om1',
    title: 'Professional Email Etiquette',
    description: 'Learn how to write effective business emails.',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    materials: ['email_templates.pdf'],
    postedDate: getPastDate(5),
    status: 'PUBLISHED',
    skillCategory: SkillCategory.WRITING,
    difficultyLevel: DifficultyLevel.INTERMEDIATE,
    exams: [{ difficulty: DifficultyLevel.INTERMEDIATE, fileName: 'email_exam.pdf' }]
  }
];

export const MOCK_MODULE_PROGRESS: StudentModuleProgress[] = [
  {
    studentId: 'u3',
    moduleId: 'om1',
    status: 'COMPLETED',
    completedDate: getPastDate(2),
    quizScore: 90,
    placementResult: DifficultyLevel.INTERMEDIATE
  }
];

export const MOCK_SESSION_REPORTS: Record<string, StudentSessionReport[]> = {
  's_past_1': [
    { studentId: 'u3', studentName: 'Sarah Connor', attendanceStatus: 'PRESENT', examScore: 85, placementResult: DifficultyLevel.ELEMENTARY }
  ]
};

export const MOCK_LEVEL_HISTORY: LevelHistory[] = [];
export const MOCK_QUESTIONS: Record<string, any> = {};
