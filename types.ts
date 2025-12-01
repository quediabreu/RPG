export enum AttributeType {
  STR = 'Força',        // Físico
  INT = 'Inteligência', // Estudo/Trabalho
  DIS = 'Disciplina',   // Rotina/Tarefas
  CRE = 'Criatividade', // Arte/Ideias
  SOC = 'Social'        // Networking/Família
}

export interface Challenge {
  id: string;
  title: string;
  description?: string;
  attribute: AttributeType;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  completedToday: boolean;
  streak: number;
}

export interface UserStats {
  hp: number;
  maxHp: number;
  exp: number;
  maxExp: number;
  level: number;
  coins: number;
  attributes: Record<AttributeType, number>;
}

export interface User {
  id: string;
  name: string;
  email: string;
  stats: UserStats;
  challenges: Challenge[];
  lastLoginDate: string; // ISO Date string
  isOnboarded: boolean;
}

export const INITIAL_STATS: UserStats = {
  hp: 100,
  maxHp: 100,
  exp: 0,
  maxExp: 100,
  level: 1,
  coins: 0,
  attributes: {
    [AttributeType.STR]: 1,
    [AttributeType.INT]: 1,
    [AttributeType.DIS]: 1,
    [AttributeType.CRE]: 1,
    [AttributeType.SOC]: 1,
  }
};