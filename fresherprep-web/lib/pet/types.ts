export interface LocalizedPetText { vi: string; en: string }
export interface PetLevelConfig {
  level: number;
  name: LocalizedPetText;
  description: LocalizedPetText;
  requiredEnergy: number;
  assetReference: string;
}
export interface PetDefinition {
  id: string;
  code: string;
  name: LocalizedPetText;
  description: LocalizedPetText;
  learningMeaning: LocalizedPetText;
  active: boolean;
  displayOrder: number;
  levels: PetLevelConfig[];
}
export interface PetState {
  progressionId: string;
  petId: string;
  petCode: string;
  totalLearningPoints: number;
  pointBalance: number;
  pointsPerFood: number;
  availableFood: number;
  energy: number;
  energyPerFood: number;
  currentLevel: number;
  maximumLevel: number;
  petName: LocalizedPetText;
  petDescription: LocalizedPetText;
  learningMeaning: LocalizedPetText;
  levelName: LocalizedPetText;
  levelDescription: LocalizedPetText;
  assetReference: string;
  requiredEnergy: number;
  canFeed: boolean;
  canUpgrade: boolean;
  completed: boolean;
}
export interface PetCollection {
  activePet: PetState | null;
  completedPets: PetState[];
  availablePets: PetDefinition[];
}
export interface PetConfiguration {
  lessonCompletionPoints: number;
  quizPassPoints: number;
  pointsPerFood: number;
  energyPerFood: number;
}
export interface AdminUserPet {
  petId: string;
  petDefinitionId: string;
  petCode: string;
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
  status: "ACTIVE" | "COMPLETED";
  updatedAt: string;
}
