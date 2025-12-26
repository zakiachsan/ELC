
export enum UserRole {
  ADMIN = 'ADMIN',
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT',
  PARENT = 'PARENT'
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
  VOCABULARY = 'Vocabulary'
}

export enum DifficultyLevel {
  STARTER = 'Starter',
  ELEMENTARY = 'Elementary',
  INTERMEDIATE = 'Intermediate',
  UPPER_INTERMEDIATE = 'Upper-Intermediate',
  ADVANCED = 'Advanced'
}

export enum CEFRLevel {
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

export interface OlympiadRegistration {
  id: string;
  olympiadId: string;
  name: string;
  email: string;
  wa: string;
  school: string;
  grade: string;
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
  image: string;
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
  startDate: string;
  endDate: string;
  questions: OlympiadQuestion[];
  reward?: string;
  participantCount: number;
  price: number;
  terms: string;
  benefits: OlympiadBenefit[];
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
  score: number;
  cefrResult: CEFRLevel;
  timestamp: string;
  // Full form data
  dob?: string;
  parentWa?: string;
  address?: string;
  schoolOrigin?: string;
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
  olympiadId: string;
  olympiadTitle: string;
  amount: number;
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
  timestamp: string;
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
  schoolOrigin?: string;
  status?: 'ACTIVE' | 'INACTIVE';
}

export interface Location {
  id: string;
  name: string;
  address: string;
  capacity: number;
}

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

export interface ClassSession {
  id: string;
  teacherId: string;
  topic: string;
  dateTime: string;
  location: string;
  videoUrl?: string;
  description?: string;
  materials?: string[];
  skillCategory: SkillCategory; 
  difficultyLevel: DifficultyLevel; 
  hasExam?: boolean; 
  examMaterials?: string[]; 
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
