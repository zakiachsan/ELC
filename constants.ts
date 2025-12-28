
import { User, UserRole, Question, QuestionType, SkillCategory, DifficultyLevel, ClassSession, OnlineModule, StudentSessionReport, LevelHistory, StudentModuleProgress, Location, CoursePreset, Olympiad, OlympiadStatus, Transaction, PlacementQuestion, PlacementSubmission, CEFRLevel, News, StudentOfTheMonth, TeacherApplication, ApplicationStatus, OlympiadRegistration, TuitionInvoice, Homework, FeaturedTeacher } from './types';

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
    photoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=2070&auto=format&fit=crop',
    daysPerWeek: 5,
    hoursPerWeek: 25
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
    photoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=1976&auto=format&fit=crop',
    daysPerWeek: 6,
    hoursPerWeek: 20
  }
];

export const MOCK_FEATURED_TEACHERS: FeaturedTeacher[] = [
  {
    id: 'ft1',
    name: 'James Wilson',
    country: 'United States',
    countryFlag: '🇺🇸',
    type: 'native',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1974&auto=format&fit=crop',
    certifications: ['TESOL', 'CELTA', 'MA Education'],
    experience: 12,
    specialty: 'Business English & IELTS',
    quote: 'Every student has the potential to become fluent. My job is to unlock that potential.'
  },
  {
    id: 'ft2',
    name: 'Emma Thompson',
    country: 'United Kingdom',
    countryFlag: '🇬🇧',
    type: 'native',
    photoUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=1961&auto=format&fit=crop',
    certifications: ['TEFL', 'Cambridge Delta', 'BA Linguistics'],
    experience: 8,
    specialty: 'Academic Writing & Speaking',
    quote: 'Learning English should be fun and engaging. I make sure every class is an adventure.'
  },
  {
    id: 'ft3',
    name: 'Michael Chen',
    country: 'Australia',
    countryFlag: '🇦🇺',
    type: 'native',
    photoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=2070&auto=format&fit=crop',
    certifications: ['TESOL', 'CELTA', 'PhD Applied Linguistics'],
    experience: 15,
    specialty: 'Grammar & Pronunciation',
    quote: 'The key to perfect pronunciation is consistent practice with expert guidance.'
  },
  {
    id: 'ft4',
    name: 'Dewi Kusuma',
    country: 'Indonesia',
    countryFlag: '🇮🇩',
    type: 'local',
    photoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=1976&auto=format&fit=crop',
    certifications: ['TESOL', 'MA TEFL', 'Cambridge TKT'],
    experience: 10,
    specialty: 'Kids English & Conversation',
    quote: 'Mengajar anak-anak berbahasa Inggris adalah passion saya. Setiap anak punya cara belajar unik.'
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
  { id: 'loc1', name: 'SMA Negeri 1 Jakarta', address: 'Jl. Budi Utomo No. 7, Jakarta Pusat', capacity: 35 },
  { id: 'loc2', name: 'SMA Negeri 3 Bandung', address: 'Jl. Belitung No. 8, Bandung', capacity: 30 },
  { id: 'loc3', name: 'SMP Al-Azhar Jakarta', address: 'Jl. Sisingamangaraja, Jakarta Selatan', capacity: 28 },
  { id: 'loc4', name: 'SMP Negeri 1 Surabaya', address: 'Jl. Pacar No. 4, Surabaya', capacity: 32 },
  { id: 'loc5', name: 'SD Kristen Petra Surabaya', address: 'Jl. Kalianyar No. 37, Surabaya', capacity: 25 },
  { id: 'loc6', name: 'SMA Labschool Jakarta', address: 'Kompleks UNJ Rawamangun, Jakarta', capacity: 30 },
  { id: 'loc7', name: 'SMP Negeri 3 Bandung', address: 'Jl. Belitung No. 10, Bandung', capacity: 28 },
  { id: 'loc8', name: 'SD Islam Al-Falah', address: 'Jl. Margonda Raya, Depok', capacity: 24 },
];

// Schools where teachers are assigned
export const MOCK_SCHOOLS = [
  { id: 'sch1', name: 'SMA Negeri 1 Jakarta', address: 'Jl. Budi Utomo No. 7, Jakarta Pusat', level: 'SMA' },
  { id: 'sch2', name: 'SMA Negeri 3 Bandung', address: 'Jl. Belitung No. 8, Bandung', level: 'SMA' },
  { id: 'sch3', name: 'SMP Al-Azhar Jakarta', address: 'Jl. Sisingamangaraja, Jakarta Selatan', level: 'SMP' },
  { id: 'sch4', name: 'SMP Negeri 1 Surabaya', address: 'Jl. Pacar No. 4, Surabaya', level: 'SMP' },
  { id: 'sch5', name: 'SD Kristen Petra Surabaya', address: 'Jl. Kalianyar No. 37, Surabaya', level: 'SD' },
  { id: 'sch6', name: 'SMA Labschool Jakarta', address: 'Kompleks UNJ Rawamangun, Jakarta', level: 'SMA' },
  { id: 'sch7', name: 'SMP Negeri 3 Bandung', address: 'Jl. Belitung No. 10, Bandung', level: 'SMP' },
  { id: 'sch8', name: 'SD Islam Al-Falah', address: 'Jl. Margonda Raya, Depok', level: 'SD' },
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
    personalWa: '081234567890',
    score: 85,
    cefrResult: CEFRLevel.B2,
    timestamp: getPastDate(1),
    dob: '2007-05-15',
    parentName: 'Hendra Santoso',
    parentWa: '081122334455',
    address: 'Jl. Melati No. 5, Jakarta Selatan',
    schoolOrigin: 'SMA Negeri 1 Jakarta',
    oralTestStatus: 'completed',
    oralTestDate: '2025-01-06',
    oralTestTime: '14:00',
    oralTestScore: CEFRLevel.B2
  },
  {
    id: 'ps2',
    name: 'Anita Wijaya',
    email: 'anita.wijaya@gmail.com',
    grade: 'SMP Kelas 9',
    wa: '082345678901',
    personalWa: '082345678901',
    score: 72,
    cefrResult: CEFRLevel.B1,
    timestamp: getPastDate(3),
    dob: '2009-08-22',
    parentName: 'Dewi Wijaya',
    parentWa: '082233445566',
    address: 'Jl. Mawar No. 10, Bandung',
    schoolOrigin: 'SMP Negeri 3 Bandung',
    oralTestStatus: 'booked',
    oralTestDate: '2025-01-07',
    oralTestTime: '10:00'
  },
  {
    id: 'ps3',
    name: 'Reza Pratama',
    email: 'reza.p@gmail.com',
    grade: 'SD Kelas 6',
    wa: '083456789012',
    personalWa: '083456789012',
    score: 65,
    cefrResult: CEFRLevel.A2,
    timestamp: getPastDate(5),
    dob: '2012-03-10',
    parentName: 'Ahmad Pratama',
    parentWa: '083344556677',
    address: 'Jl. Kenanga No. 15, Surabaya',
    schoolOrigin: 'SD Kristen Petra Surabaya',
    oralTestStatus: 'none'
  },
  {
    id: 'ps4',
    name: 'Ahmad Fauzi',
    email: 'ahmad.f@gmail.com',
    grade: 'SMA Kelas 10',
    wa: '081234567890',
    personalWa: '081234567890',
    score: 78,
    cefrResult: CEFRLevel.B1,
    timestamp: getPastDate(2),
    dob: '2008-03-20',
    parentName: 'Fauzi Rahman',
    parentWa: '081555666777',
    address: 'Jl. Sudirman No. 100, Jakarta',
    schoolOrigin: 'SMA Labschool Jakarta',
    oralTestStatus: 'completed',
    oralTestDate: '2025-01-06',
    oralTestTime: '09:00',
    oralTestScore: CEFRLevel.B1
  },
  {
    id: 'ps5',
    name: 'Siti Nurhaliza',
    email: 'siti.nur@gmail.com',
    grade: 'SMP Kelas 8',
    wa: '081234567891',
    personalWa: '081234567891',
    score: 60,
    cefrResult: CEFRLevel.A2,
    timestamp: getPastDate(4),
    dob: '2010-07-15',
    parentName: 'Nurhaliza',
    parentWa: '081888999000',
    address: 'Jl. Gatot Subroto No. 50, Jakarta',
    schoolOrigin: 'SMP Al Azhar Jakarta',
    oralTestStatus: 'booked',
    oralTestDate: '2025-01-07',
    oralTestTime: '10:00'
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
  // Olympiad transactions
  {
    id: 'tx1',
    studentId: 'u3',
    studentName: 'Sarah Connor',
    type: 'OLYMPIAD',
    itemId: 'ol1',
    itemName: 'National English Olympiad 2024',
    amount: 150000,
    status: 'SUCCESS',
    timestamp: getPastDate(2),
    paymentMethod: 'Bank Transfer'
  },
  {
    id: 'tx2',
    studentId: 'u5',
    studentName: 'John Wick',
    type: 'OLYMPIAD',
    itemId: 'ol1',
    itemName: 'National English Olympiad 2024',
    amount: 150000,
    status: 'SUCCESS',
    timestamp: getPastDate(5),
    paymentMethod: 'QRIS'
  },
  // Learning Hub subscription transactions
  {
    id: 'tx3',
    studentId: 'u3',
    studentName: 'Sarah Connor',
    type: 'LEARNING_HUB',
    itemId: 'sub_dec_2024',
    itemName: 'Learning Hub - Desember 2024',
    amount: 99000,
    status: 'SUCCESS',
    timestamp: getPastDate(30),
    paymentMethod: 'GoPay'
  },
  {
    id: 'tx4',
    studentId: 'u3',
    studentName: 'Sarah Connor',
    type: 'LEARNING_HUB',
    itemId: 'sub_jan_2025',
    itemName: 'Learning Hub - Januari 2025',
    amount: 99000,
    status: 'SUCCESS',
    timestamp: getPastDate(1),
    paymentMethod: 'OVO'
  },
  {
    id: 'tx5',
    studentId: 'u5',
    studentName: 'John Wick',
    type: 'LEARNING_HUB',
    itemId: 'sub_nov_2024',
    itemName: 'Learning Hub - November 2024',
    amount: 99000,
    status: 'SUCCESS',
    timestamp: getPastDate(60),
    paymentMethod: 'Bank Transfer'
  }
];

export const MOCK_USERS: User[] = [
  { id: 'u1', name: 'Super Admin', email: 'admin@elc.com', password: 'password123', role: UserRole.ADMIN, status: 'ACTIVE' },
  { id: 'u2', name: 'Mr. John Keating', email: 'john@elc.com', password: 'password123', role: UserRole.TEACHER, status: 'ACTIVE' },
  { id: 'u3', name: 'Sarah Connor', email: 'sarah@student.com', password: 'password123', phone: '0812-9988-7766', role: UserRole.STUDENT, branch: 'Jakarta Center', status: 'ACTIVE', learningHubSubscription: { isActive: false } },
  { id: 'u4', name: 'Kyle Reese', email: 'kyle@parent.com', password: 'password123', phone: '0811-2233-4455', address: 'Jl. Palmerah No. 12, Jakarta Barat', role: UserRole.PARENT, linkedStudentId: 'u3', status: 'ACTIVE' },
  { id: 'u5', name: 'John Wick', email: 'wick@student.com', password: 'password123', phone: '0813-1122-3344', role: UserRole.STUDENT, branch: 'Jakarta Center', status: 'INACTIVE', learningHubSubscription: { isActive: false, expiresAt: getPastDate(30) } }
];

export const MOCK_SESSIONS: ClassSession[] = [
  // SMA Negeri 1 Jakarta - Sessions
  {
    id: 's_sman1_today',
    teacherId: 'u2',
    topic: 'Business English: Negotiation Tactics',
    skillCategory: SkillCategory.SPEAKING,
    difficultyLevel: DifficultyLevel.UPPER_INTERMEDIATE,
    dateTime: getFutureDate(0, 3),
    location: 'SMA Negeri 1 Jakarta',
    description: 'Roleplay scenarios for negotiating salary and business deals.',
    materials: ['negotiation_vocab.pdf', 'roleplay_scripts.pdf'],
    hasExam: false,
    examMaterials: []
  },
  {
    id: 's_sman1_past1',
    teacherId: 'u2',
    topic: 'Grammar Essentials: Tenses Review',
    skillCategory: SkillCategory.GRAMMAR,
    difficultyLevel: DifficultyLevel.INTERMEDIATE,
    dateTime: getPastDate(3),
    location: 'SMA Negeri 1 Jakarta',
    description: 'Comprehensive review of present, past, and future tenses.',
    materials: ['tenses_worksheet.pdf'],
    hasExam: true,
    examMaterials: ['grammar_quiz.pdf']
  },
  {
    id: 's_sman1_past2',
    teacherId: 'u2',
    topic: 'IELTS Writing Task 2',
    skillCategory: SkillCategory.WRITING,
    difficultyLevel: DifficultyLevel.ADVANCED,
    dateTime: getPastDate(7),
    location: 'SMA Negeri 1 Jakarta',
    description: 'Essay writing techniques for IELTS exam preparation.',
    materials: ['ielts_writing_guide.pdf'],
    hasExam: true,
    examMaterials: ['essay_practice.pdf']
  },
  {
    id: 's_sman1_upcoming1',
    teacherId: 'u2',
    topic: 'Public Speaking: Presentation Skills',
    skillCategory: SkillCategory.SPEAKING,
    difficultyLevel: DifficultyLevel.UPPER_INTERMEDIATE,
    dateTime: getFutureDate(2),
    location: 'SMA Negeri 1 Jakarta',
    description: 'Learn to deliver effective presentations in English.',
    materials: [],
    hasExam: false,
    examMaterials: []
  },
  {
    id: 's_sman1_upcoming2',
    teacherId: 'u2',
    topic: 'Academic Vocabulary Building',
    skillCategory: SkillCategory.READING,
    difficultyLevel: DifficultyLevel.INTERMEDIATE,
    dateTime: getFutureDate(5),
    location: 'SMA Negeri 1 Jakarta',
    description: 'Expand vocabulary for academic reading and writing.',
    materials: [],
    hasExam: false,
    examMaterials: []
  },
  // SMP Al-Azhar Jakarta - Sessions
  {
    id: 's_alazhar_today',
    teacherId: 'u2',
    topic: 'Conversational English: Daily Routines',
    skillCategory: SkillCategory.SPEAKING,
    difficultyLevel: DifficultyLevel.ELEMENTARY,
    dateTime: getFutureDate(0, 5),
    location: 'SMP Al-Azhar Jakarta',
    description: 'Practice talking about daily activities and routines.',
    materials: ['daily_routines.pdf'],
    hasExam: false,
    examMaterials: []
  },
  {
    id: 's_alazhar_past1',
    teacherId: 'u2',
    topic: 'Listening Practice: Short Dialogues',
    skillCategory: SkillCategory.LISTENING,
    difficultyLevel: DifficultyLevel.ELEMENTARY,
    dateTime: getPastDate(2),
    location: 'SMP Al-Azhar Jakarta',
    description: 'Practice listening comprehension with short conversations.',
    materials: ['listening_dialogues.pdf'],
    hasExam: true,
    examMaterials: ['listening_test.pdf']
  },
  {
    id: 's_alazhar_past2',
    teacherId: 'u2',
    topic: 'Basic Grammar: Present Tense',
    skillCategory: SkillCategory.GRAMMAR,
    difficultyLevel: DifficultyLevel.STARTER,
    dateTime: getPastDate(5),
    location: 'SMP Al-Azhar Jakarta',
    description: 'Introduction to simple present tense and its usage.',
    materials: ['present_tense_intro.pdf'],
    hasExam: true,
    examMaterials: ['grammar_basics.pdf']
  },
  {
    id: 's_alazhar_upcoming1',
    teacherId: 'u2',
    topic: 'Reading Comprehension: Short Stories',
    skillCategory: SkillCategory.READING,
    difficultyLevel: DifficultyLevel.ELEMENTARY,
    dateTime: getFutureDate(3),
    location: 'SMP Al-Azhar Jakarta',
    description: 'Read and understand simple English short stories.',
    materials: [],
    hasExam: false,
    examMaterials: []
  },
  // SMA Labschool Jakarta - Sessions
  {
    id: 's_labschool_past1',
    teacherId: 'u2',
    topic: 'Debate Skills: Argumentation',
    skillCategory: SkillCategory.SPEAKING,
    difficultyLevel: DifficultyLevel.ADVANCED,
    dateTime: getPastDate(4),
    location: 'SMA Labschool Jakarta',
    description: 'Learn to construct and deliver persuasive arguments.',
    materials: ['debate_techniques.pdf', 'argument_structure.pdf'],
    hasExam: false,
    examMaterials: []
  },
  {
    id: 's_labschool_past2',
    teacherId: 'u2',
    topic: 'Academic Writing: Research Papers',
    skillCategory: SkillCategory.WRITING,
    difficultyLevel: DifficultyLevel.ADVANCED,
    dateTime: getPastDate(8),
    location: 'SMA Labschool Jakarta',
    description: 'Structure and format of academic research papers.',
    materials: ['research_paper_guide.pdf'],
    hasExam: true,
    examMaterials: ['writing_assessment.pdf']
  },
  {
    id: 's_labschool_upcoming1',
    teacherId: 'u2',
    topic: 'Critical Reading: News Analysis',
    skillCategory: SkillCategory.READING,
    difficultyLevel: DifficultyLevel.UPPER_INTERMEDIATE,
    dateTime: getFutureDate(1),
    location: 'SMA Labschool Jakarta',
    description: 'Analyze news articles for bias and perspective.',
    materials: [],
    hasExam: false,
    examMaterials: []
  },
  // SD Kristen Petra Surabaya - Sessions
  {
    id: 's_petra_past1',
    teacherId: 'u2',
    topic: 'Fun with Phonics',
    skillCategory: SkillCategory.SPEAKING,
    difficultyLevel: DifficultyLevel.STARTER,
    dateTime: getPastDate(1),
    location: 'SD Kristen Petra Surabaya',
    description: 'Learn English sounds through fun phonics activities.',
    materials: ['phonics_cards.pdf'],
    hasExam: false,
    examMaterials: []
  },
  {
    id: 's_petra_upcoming1',
    teacherId: 'u2',
    topic: 'Vocabulary Games: Animals',
    skillCategory: SkillCategory.READING,
    difficultyLevel: DifficultyLevel.STARTER,
    dateTime: getFutureDate(4),
    location: 'SD Kristen Petra Surabaya',
    description: 'Learn animal names through interactive games.',
    materials: [],
    hasExam: false,
    examMaterials: []
  },
  // SMP Negeri 1 Surabaya - Sessions
  {
    id: 's_smpn1sby_past1',
    teacherId: 'u2',
    topic: 'Listening: BBC Learning English',
    skillCategory: SkillCategory.LISTENING,
    difficultyLevel: DifficultyLevel.INTERMEDIATE,
    dateTime: getPastDate(6),
    location: 'SMP Negeri 1 Surabaya',
    description: 'Practice listening with BBC Learning English materials.',
    materials: ['bbc_listening.pdf'],
    hasExam: true,
    examMaterials: ['listening_quiz.pdf']
  },
  {
    id: 's_smpn1sby_upcoming1',
    teacherId: 'u2',
    topic: 'Grammar: Past Tense Stories',
    skillCategory: SkillCategory.GRAMMAR,
    difficultyLevel: DifficultyLevel.ELEMENTARY,
    dateTime: getFutureDate(6),
    location: 'SMP Negeri 1 Surabaya',
    description: 'Learn past tense through storytelling.',
    materials: [],
    hasExam: false,
    examMaterials: []
  }
];

export const MOCK_ONLINE_MODULES: OnlineModule[] = [
  {
    id: 'om1',
    title: 'Professional Email Etiquette',
    description: 'Learn how to write effective business emails with proper greetings, structure, and professional tone.',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    materials: ['email_templates.pdf'],
    postedDate: getPastDate(5),
    status: 'PUBLISHED',
    skillCategory: SkillCategory.WRITING,
    difficultyLevel: DifficultyLevel.INTERMEDIATE,
    exams: [{ difficulty: DifficultyLevel.INTERMEDIATE, fileName: 'email_exam.pdf' }]
  },
  {
    id: 'om2',
    title: 'Mastering English Tenses',
    description: 'Comprehensive guide to all 12 English tenses with practical exercises and real-world examples.',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    materials: ['tenses_cheatsheet.pdf', 'exercises.pdf'],
    postedDate: getPastDate(10),
    status: 'PUBLISHED',
    skillCategory: SkillCategory.GRAMMAR,
    difficultyLevel: DifficultyLevel.ELEMENTARY,
    exams: [{ difficulty: DifficultyLevel.ELEMENTARY, fileName: 'tenses_quiz.pdf' }]
  },
  {
    id: 'om3',
    title: 'Listening Comprehension: Daily Conversations',
    description: 'Improve your listening skills with everyday conversations, dialogues, and audio exercises.',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    materials: ['listening_transcript.pdf'],
    postedDate: getPastDate(15),
    status: 'PUBLISHED',
    skillCategory: SkillCategory.LISTENING,
    difficultyLevel: DifficultyLevel.STARTER,
    exams: [{ difficulty: DifficultyLevel.STARTER, fileName: 'listening_test.pdf' }]
  },
  {
    id: 'om4',
    title: 'Public Speaking & Presentation Skills',
    description: 'Build confidence in speaking English through structured presentation techniques and pronunciation practice.',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    materials: ['presentation_guide.pdf', 'speech_templates.pdf'],
    postedDate: getPastDate(20),
    status: 'PUBLISHED',
    skillCategory: SkillCategory.SPEAKING,
    difficultyLevel: DifficultyLevel.UPPER_INTERMEDIATE,
    exams: [{ difficulty: DifficultyLevel.UPPER_INTERMEDIATE, fileName: 'speaking_rubric.pdf' }]
  },
  {
    id: 'om5',
    title: 'Reading Academic Texts',
    description: 'Develop strategies for understanding complex academic articles, research papers, and scholarly texts.',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    materials: ['reading_strategies.pdf', 'sample_texts.pdf'],
    postedDate: getPastDate(25),
    status: 'PUBLISHED',
    skillCategory: SkillCategory.READING,
    difficultyLevel: DifficultyLevel.ADVANCED,
    exams: [{ difficulty: DifficultyLevel.ADVANCED, fileName: 'reading_comprehension.pdf' }]
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
  // SMA Negeri 1 Jakarta reports
  's_sman1_past1': [
    { studentId: 'u3', studentName: 'Sarah Connor', attendanceStatus: 'PRESENT', examScore: 85, writtenScore: 85, oralScore: 80, cefrLevel: CEFRLevel.B1, placementResult: DifficultyLevel.INTERMEDIATE, isVerified: true, teacherNotes: 'Good progress on tenses!' },
    { studentId: 'u5', studentName: 'John Wick', attendanceStatus: 'PRESENT', examScore: 92, writtenScore: 90, oralScore: 88, cefrLevel: CEFRLevel.B2, placementResult: DifficultyLevel.INTERMEDIATE, isVerified: true, teacherNotes: 'Excellent understanding of grammar concepts.' }
  ],
  's_sman1_past2': [
    { studentId: 'u3', studentName: 'Sarah Connor', attendanceStatus: 'PRESENT', examScore: 78, writtenScore: 82, oralScore: 75, cefrLevel: CEFRLevel.B1, placementResult: DifficultyLevel.ADVANCED, isVerified: true, teacherNotes: 'Good essay structure, needs improvement on vocabulary.' },
    { studentId: 'u5', studentName: 'John Wick', attendanceStatus: 'ABSENT', isVerified: false, teacherNotes: 'Absent - family emergency.' }
  ],
  // SMP Al-Azhar Jakarta reports
  's_alazhar_past1': [
    { studentId: 'u3', studentName: 'Sarah Connor', attendanceStatus: 'PRESENT', examScore: 88, writtenScore: 85, oralScore: 90, cefrLevel: CEFRLevel.B1, placementResult: DifficultyLevel.ELEMENTARY, isVerified: true, teacherNotes: 'Great listening comprehension!' }
  ],
  's_alazhar_past2': [
    { studentId: 'u3', studentName: 'Sarah Connor', attendanceStatus: 'PRESENT', examScore: 95, writtenScore: 92, cefrLevel: CEFRLevel.A2, placementResult: DifficultyLevel.STARTER, isVerified: true, teacherNotes: 'Excellent understanding of present tense.' }
  ],
  // SMA Labschool Jakarta reports
  's_labschool_past1': [
    { studentId: 'u5', studentName: 'John Wick', attendanceStatus: 'PRESENT', oralScore: 95, cefrLevel: CEFRLevel.C1, placementResult: DifficultyLevel.ADVANCED, isVerified: true, teacherNotes: 'Outstanding debate performance!' }
  ],
  's_labschool_past2': [
    { studentId: 'u5', studentName: 'John Wick', attendanceStatus: 'PRESENT', examScore: 88, writtenScore: 90, cefrLevel: CEFRLevel.B2, placementResult: DifficultyLevel.ADVANCED, isVerified: true, teacherNotes: 'Well-structured research paper.' }
  ],
  // SD Kristen Petra Surabaya reports
  's_petra_past1': [
    { studentId: 'u3', studentName: 'Sarah Connor', attendanceStatus: 'PRESENT', oralScore: 85, cefrLevel: CEFRLevel.A1, placementResult: DifficultyLevel.STARTER, isVerified: true, teacherNotes: 'Good pronunciation practice!' }
  ],
  // SMP Negeri 1 Surabaya reports
  's_smpn1sby_past1': [
    { studentId: 'u3', studentName: 'Sarah Connor', attendanceStatus: 'PRESENT', examScore: 80, writtenScore: 78, oralScore: 82, cefrLevel: CEFRLevel.B1, placementResult: DifficultyLevel.INTERMEDIATE, isVerified: true, teacherNotes: 'Good listening skills, keep practicing!' }
  ]
};

export const MOCK_HOMEWORKS: Homework[] = [
  {
    id: 'hw1',
    sessionId: 's_sman1_past1',
    studentId: 'u3',
    title: 'Tenses Exercise',
    description: 'Complete exercises 1-10 on page 45 of the grammar workbook.',
    dueDate: getPastDate(1),
    assignedDate: getPastDate(3),
    status: 'GRADED',
    score: 88,
    feedback: 'Great work! Minor errors on past perfect tense.'
  },
  {
    id: 'hw2',
    sessionId: 's_alazhar_past1',
    studentId: 'u3',
    title: 'Listening Journal',
    description: 'Write a summary of the short dialogue we listened to in class.',
    dueDate: getPastDate(1),
    assignedDate: getPastDate(2),
    status: 'GRADED',
    score: 85,
    feedback: 'Good summary, but try to include more details.'
  },
  {
    id: 'hw3',
    sessionId: 's_sman1_past2',
    studentId: 'u3',
    title: 'IELTS Essay Practice',
    description: 'Write a 250-word essay on the topic: "The advantages and disadvantages of online learning."',
    dueDate: getFutureDate(2),
    assignedDate: getPastDate(7),
    status: 'PENDING'
  },
  {
    id: 'hw4',
    sessionId: 's_sman1_past1',
    studentId: 'u5',
    title: 'Grammar Workbook Chapter 5',
    description: 'Complete all exercises in Chapter 5 about verb tenses.',
    dueDate: getPastDate(1),
    assignedDate: getPastDate(3),
    status: 'GRADED',
    score: 92,
    feedback: 'Excellent work! Perfect understanding of tenses.'
  },
  {
    id: 'hw5',
    sessionId: 's_labschool_past2',
    studentId: 'u5',
    title: 'Research Paper Draft',
    description: 'Submit the first draft of your research paper about climate change.',
    dueDate: getPastDate(5),
    assignedDate: getPastDate(8),
    status: 'GRADED',
    score: 88,
    feedback: 'Strong thesis, but needs more supporting evidence in section 3.'
  }
];

export const MOCK_LEVEL_HISTORY: LevelHistory[] = [];
export const MOCK_QUESTIONS: Record<string, any> = {};
