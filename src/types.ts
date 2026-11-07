export interface StoryPage {
  pageNumber: number;
  text: string;
  illustrationPrompt: string;
  imageUrl?: string;
  audioUrl?: string;
  imageSize?: '1K' | '2K' | '4K';
}

export interface Story {
  id: string;
  title: string;
  titleVi?: string;
  author: string;
  category: 'fantasy' | 'animals' | 'bedtime' | 'adventure' | 'sci-fi' | 'classroom';
  coverImage: string;
  summary: string;
  summaryVi?: string;
  theme: string;
  language: 'en' | 'vi';
  pages: StoryPage[];
}

export type VoiceOption = {
  id: string;
  name: string;
  gender: string;
  tone: string;
  icon: string;
  description: string;
};

export type BuddyPersona = {
  id: 'story_owl' | 'dragon_pip' | 'fairy_luna' | 'detective_hound';
  name: string;
  title: string;
  avatar: string;
  badge: string;
  greeting: string;
  description: string;
};

export type GeminiModelChoice = 'gemini-3.8-flash' | 'gemini-3.1-flash-lite' | 'gemini-4-argon';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
  modelUsed?: string;
}

export interface Student {
  id: number;
  name: string;
  points: number;
  avatar: string;
  group: number;
  phone: string;
  called: boolean;
}

export interface ClassroomData {
  className: string;
  schoolName: string;
  teacherName: string;
  students: Student[];
  attendance: Record<number, { status: string; reason?: string }>;
  stories?: Story[];
  lastSynced?: string;
}
