
export enum UserRole {
  ADMIN = 'ADMIN',
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT',
  PARENT = 'PARENT',
  SCHOOL = 'SCHOOL'
}

export enum ClassType {
  BILINGUAL = 'BILINGUAL',
  REGULAR = 'REGULAR'
}

export enum ApplicationStatus {
  PENDING = 'PENDING',
  REVIEWED = 'REVIEWED',
  INTERVIEWING = 'INTERVIEWING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED'
}

export interface TeacherApplication {
  id: string;
  name: string;
  dob: string;
  experience: number;
  hasDegree: boolean;
  country: string;
  motivation: string;
  salary: number;
  type: 'local' | 'native';
  status: ApplicationStatus;
  photoUrl?: string;
  policeCheckUrl?: string;
  appliedDate: string;
  isConverted?: boolean;
  // Teaching availability
  daysPerWeek?: 5 | 6;
  hoursPerWeek?: 15 | 20 | 25;
}

export enum QuestionType {
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  ESSAY = 'ESSAY'
}

export enum QuizVariant {
  A = 'A',
  B = 'B',
  C = 'C'
}

export enum SkillCategory {
  LISTENING = 'Listening',
  READING = 'Reading',
  WRITING = 'Writing',
  SPEAKING = 'Speaking',
  GRAMMAR = 'Grammar',
  VOCABULARY = 'Vocabulary',
  MATH = 'Math',
  SCIENCE = 'Science'
}

export enum DifficultyLevel {
  STARTER = 'Starter',
  ELEMENTARY = 'Elementary',
  INTERMEDIATE = 'Intermediate',
  UPPER_INTERMEDIATE = 'Upper-Intermediate',
  ADVANCED = 'Advanced'
}

export enum CEFRLevel {
  PRE_A1 = 'Pre-A1 - Starter',
  A1 = 'A1 - Beginner',
  A2 = 'A2 - Elementary',
  B1 = 'B1 - Intermediate',
  B2 = 'B2 - Upper Intermediate',
  C1 = 'C1 - Advanced',
  C2 = 'C2 - Proficient'
}

export enum OlympiadStatus {
  UPCOMING = 'UPCOMING',
  OPEN = 'OPEN',
  CLOSED = 'CLOSED'
}

export enum CompetitionType {
  OLYMPIAD = 'OLYMPIAD',
  SPELLING_BEE = 'SPELLING_BEE',
  SPEED_COMPETITION = 'SPEED_COMPETITION',
  STORY_TELLING = 'STORY_TELLING'
}

export const COMPETITION_TYPE_LABELS: Record<CompetitionType, string> = {
  [CompetitionType.OLYMPIAD]: 'Olympiad',
  [CompetitionType.SPELLING_BEE]: 'Spelling Bee',
  [CompetitionType.SPEED_COMPETITION]: 'Speed Competition',
  [CompetitionType.STORY_TELLING]: 'Story Telling'
};

export const COMPETITION_TYPE_COLORS: Record<CompetitionType, { bg: string; text: string; border: string }> = {
  [CompetitionType.OLYMPIAD]: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200' },
  [CompetitionType.SPELLING_BEE]: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
  [CompetitionType.SPEED_COMPETITION]: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' },
  [CompetitionType.STORY_TELLING]: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' }
};

export interface OlympiadRegistration {
  id: string;
  olympiadId: string;
  name: string;
  email: string;
  wa: string;
  personalWa?: string;
  school: string;
  grade: string;
  schoolOrigin?: string;
  dob?: string;
  address?: string;
  parentName?: string;
  parentWa?: string;
  status: 'PENDING' | 'SUCCESS';
  timestamp: string;
}

export interface TuitionInvoice {
  id: string;
  studentId: string;
  studentName: string;
  month: string;
  amount: number;
  status: 'PAID' | 'UNPAID';
  dueDate: string;
  remindedAt?: string;
}

export interface News {
  id: string;
  title: string;
  slug?: string;
  featuredImage: string;
  videoUrl?: string;
  displayMedia: 'image' | 'video';
  content: string;
  publishedDate: string;
  summary: string;
}

export interface StudentOfTheMonth {
  id: string;
  name: string;
  school: string;
  className: string;
  achievement: string;
  monthYear: string; 
}

export interface OlympiadQuestion {
  id: string;
  text: string;
  image?: string;
  options: string[];
  correctAnswerIndex: number;
}

export interface OlympiadBenefit {
  title: string;
  description: string;
}

export interface Olympiad {
  id: string;
  title: string;
  description: string;
  status: OlympiadStatus;
  competitionType: CompetitionType;
  startDate: string;
  endDate: string;
  eventDate?: string;
  eventTime?: string;
  eventLocation?: string;
  questions: OlympiadQuestion[];
  reward?: string;
  participantCount: number;
  price: number;
  terms: string;
  benefits: OlympiadBenefit[];
  isActive?: boolean;
}

export interface PlacementQuestion {
  id: string;
  text: string;
  options: string[];
  correctAnswerIndex: number;
  weight: number; 
}

export interface PlacementSubmission {
  id: string;
  name: string;
  email: string;
  grade: string;
  wa: string;
  personalWa?: string;
  score: number;
  cefrResult: CEFRLevel;
  timestamp: string;
  // Full form data
  dob?: string;
  parentName?: string;
  parentWa?: string;
  address?: string;
  schoolOrigin?: string;
  // Oral Test Data
  oralTestStatus?: 'none' | 'booked' | 'completed';
  oralTestDate?: string;
  oralTestTime?: string;
  oralTestScore?: CEFRLevel;
}

export interface OlympiadAttempt {
  id: string;
  olympiadId: string;
  studentId: string;
  answers: Record<string, number>;
  score: number;
  completedAt: string;
}

export interface Transaction {
  id: string;
  studentId: string;
  studentName: string;
  type: 'LEARNING_HUB' | 'OLYMPIAD';
  itemId: string; // olympiadId or subscription period
  itemName: string; // olympiadTitle or "Learning Hub - Month/Year"
  amount: number;
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
  timestamp: string;
  paymentMethod?: string;
}

export interface User {
  id: string;
  name: string;
  email?: string;
  password?: string;
  phone?: string;
  address?: string;
  role: UserRole;
  linkedStudentId?: string;
  skillLevels?: Partial<Record<SkillCategory, DifficultyLevel>>;
  branch?: string;
  teacherNotes?: string;
  needsAttention?: boolean;
  assignedSubjects?: string[];
  assignedLocationId?: string;
  assignedLocationIds?: string[]; // Multiple school IDs for teachers
  assignedClasses?: string[]; // e.g. ["10.1", "10.2", "11.1"]
  schoolOrigin?: string;
  status?: 'ACTIVE' | 'INACTIVE';
  // Class type fields
  classTypes?: ClassType[]; // For teachers: types of classes they can teach (BILINGUAL, REGULAR, or both)
  classType?: ClassType; // For students: the class type they belong to (BILINGUAL or REGULAR)
  // Learning Hub subscription
  learningHubSubscription?: {
    isActive: boolean;
    expiresAt?: string; // ISO date string
  };
}

export interface Location {
  id: string;
  name: string;
  address: string;
  capacity: number;
  level?: 'KINDERGARTEN' | 'PRIMARY' | 'JUNIOR' | 'SENIOR' | 'GENERAL'; // School level type
}


export interface SchoolTeacherReview {
  id: string;
  teacher_id: string;
  school_id: string;
  reviewer_id: string;
  review_month: string;
  academic_expertise_rating: number;
  communication_rating: number;
  empathy_rating: number;
  collaboration_rating: number;
  dedication_rating: number;
  flexibility_rating: number;
  classroom_management_rating: number;
  creativity_rating: number;
  integrity_rating: number;
  inclusive_education_rating: number;
  comments: string | null;
  created_at: string;
  updated_at?: string;
  teacher?: User;
  school?: Location;
  reviewer?: User;
}

export const SCHOOL_REVIEW_CRITERIA = {
  academic_expertise_rating: 'Keahlian akademis yang unggul',
  communication_rating: 'Komunikasi yang efektif',
  empathy_rating: 'Empati',
  collaboration_rating: 'Kolaborasi',
  dedication_rating: 'Semangat dan dedikasi',
  flexibility_rating: 'Fleksibilitas',
  classroom_management_rating: 'Manajemen kelas yang baik',
  creativity_rating: 'Kreativitas dan inovasi',
  integrity_rating: 'Integritas dan etika profesional',
  inclusive_education_rating: 'Pemahaman terhadap prinsip pendidikan inklusif',
} as const;

export interface CoursePreset {
  id: string;
  title: string;
  skillCategory: SkillCategory;
  defaultLevel: DifficultyLevel;
}

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  options?: string[];
  correctAnswer?: string;
}

export interface QuizAttempt {
  id: string;
  studentId: string;
  skillCategory: SkillCategory;
  attemptedDifficulty: DifficultyLevel;
  finalPlacement: DifficultyLevel;
  score: number;
  passed: boolean;
  timestamp: Date;
  feedback?: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  timestamp: Date;
  location: { lat: number; lng: number };
  status: 'PRESENT' | 'ABSENT' | 'LATE';
  isVerified?: boolean;
}

export interface EssayGradeResult {
  score: number;
  feedback: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  targetAudience: 'all' | 'teachers' | 'students' | 'parents';
  isActive: boolean;
  startsAt: string | null;
  expiresAt: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ClassSession {
  id: string;
  teacherId: string;
  topic: string;
  dateTime: string;
  location: string;
  videoUrl?: string;
  description?: string;
  materials?: string[];
  skillCategories: SkillCategory[]; // Changed to array for multiple categories
  difficultyLevel: DifficultyLevel;
  hasExam?: boolean;
  examMaterials?: string[];
  classType?: ClassType; // BILINGUAL or REGULAR
  // Lesson plan fields
  cefrLevel?: string;
  materialsNeeded?: string;
  learningObjectives?: string;
  vocabularyVerb?: string;
  vocabularyNoun?: string;
  vocabularyAdjective?: string;
  endTime?: string; // End time of the session
}

export interface ModuleExam {
  difficulty: DifficultyLevel;
  fileName: string;
}

export interface OnlineModule {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  materials: string[];
  postedDate: string;
  status: 'DRAFT' | 'PUBLISHED';
  skillCategory: SkillCategory;
  difficultyLevel: DifficultyLevel;
  exams: ModuleExam[];
}

export interface StudentSessionReport {
  studentName: string;
  studentId: string;
  attendanceStatus: 'PRESENT' | 'ABSENT' | 'LATE';
  examScore?: number;
  placementResult?: DifficultyLevel;
  isVerified?: boolean;
  // Enhanced fields for teacher input
  writtenScore?: number;
  oralScore?: number;
  cefrLevel?: CEFRLevel;
  teacherNotes?: string;
}

export interface Homework {
  id: string;
  sessionId: string;
  studentId: string;
  title: string;
  description: string;
  dueDate: string;
  assignedDate: string;
  status: 'PENDING' | 'SUBMITTED' | 'GRADED';
  submissionUrl?: string;
  score?: number;
  feedback?: string;
}

export interface ClassReport {
  id: string;
  sessionId: string;
  teacherId: string;
  date: string;
  topicsCovered: string;
  materialsUsed: string[];
  studentReports: StudentSessionReport[];
  homeworks: Homework[];
}

export interface LevelHistory {
  id: string;
  studentId: string;
  date: string;
  skillCategory: SkillCategory;
  fromLevel: DifficultyLevel | null;
  toLevel: DifficultyLevel;
  reason: string;
}

export interface StudentModuleProgress {
  studentId: string;
  moduleId: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'NOT_STARTED';
  completedDate?: string;
  quizScore?: number;
  placementResult?: DifficultyLevel;
}

export interface FeaturedTeacher {
  id: string;
  name: string;
  country: string;
  countryFlag: string;
  type: 'native' | 'local';
  photoUrl: string;
  certifications: string[];
  experience: number;
  specialty: string;
  quote: string;
}
