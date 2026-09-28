export interface PetState {
  totalLearningPoints: number;
  pointBalance: number;
  pointsPerFood: number;
  availableFood: number;
  energy: number;
  energyPerFood: number;
  currentLevel: number;
  maximumLevel: number;
  name: string;
  description: string;
  requiredEnergy: number;
  canFeed: boolean;
  canUpgrade: boolean;
}

export interface PetLevelConfig {
  level: number;
  name: string;
  description: string;
  requiredEnergy: number;
}

export interface PetConfiguration {
  lessonCompletionPoints: number;
  quizPassPoints: number;
  pointsPerFood: number;
  energyPerFood: number;
  maximumLevel: number;
  levels: PetLevelConfig[];
}

export interface AdminUserPet {
  petId: string;
  userId: string;
  email: string;
  displayName: string;
  role: "USER" | "CONTRIBUTOR" | "ADMIN";
  active: boolean;
  totalLearningPoints: number;
  pointBalance: number;
  availableFood: number;
  energy: number;
  currentLevel: number;
  updatedAt: string;
}
