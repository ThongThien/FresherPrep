export interface LearningGameDeckSummary {
  id: string;
  name: string;
  technologyName: string;
}

export interface LearningGamesCatalog {
  decks: LearningGameDeckSummary[];
}

export interface LearningGameCard {
  id: string;
  term: string;
  definition: string;
}

export interface LearningGameDeck extends LearningGameDeckSummary {
  cards: LearningGameCard[];
}
