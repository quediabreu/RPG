import React from 'react';
import { Challenge, AttributeType } from '../types';
import { CheckCircle, Circle, Trash2, Zap } from 'lucide-react';

interface ChallengeListProps {
  challenges: Challenge[];
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
}

const ChallengeList: React.FC<ChallengeListProps> = ({ challenges, onComplete, onDelete }) => {
  
  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'Easy': return 'text-green-400';
      case 'Medium': return 'text-yellow-400';
      case 'Hard': return 'text-red-400';
      default: return 'text-slate-400';
    }
  };

  const getDifficultyLabel = (diff: string) => {
    switch (diff) {
      case 'Easy': return 'Fácil';
      case 'Medium': return 'Médio';
      case 'Hard': return 'Difícil';
      default: return diff;
    }
  };

  const getAttributeIcon = (attr: AttributeType) => {
    switch (attr) {
      case AttributeType.STR: return '⚔️';
      case AttributeType.INT: return '🔮';
      case AttributeType.DIS: return '🛡️';
      case AttributeType.CRE: return '🎨';
      case AttributeType.SOC: return '💬';
      default: return '❓';
    }
  };

  return (
    <div className="space-y-3">
      {challenges.length === 0 && (
        <div className="text-center p-8 bg-slate-800 rounded-lg border border-dashed border-slate-600">
          <p className="text-slate-400">Nenhuma missão ativa. Crie uma ou peça à IA!</p>
        </div>
      )}
      
      {challenges.map((challenge) => (
        <div 
          key={challenge.id} 
          className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
            challenge.completedToday 
              ? 'bg-slate-900 border-slate-800 opacity-60' 
              : 'bg-slate-800 border-slate-700 hover:border-purple-500 shadow-md'
          }`}
        >
          <div className="flex items-center gap-4">
            <button
              onClick={() => !challenge.completedToday && onComplete(challenge.id)}
              disabled={challenge.completedToday}
              className={`p-2 rounded-full transition-colors ${
                challenge.completedToday ? 'text-green-500' : 'text-slate-500 hover:text-green-400'
              }`}
            >
              {challenge.completedToday ? <CheckCircle size={24} /> : <Circle size={24} />}
            </button>
            
            <div>
              <h4 className={`font-semibold ${challenge.completedToday ? 'line-through text-slate-500' : 'text-white'}`}>
                {challenge.title}
              </h4>
              <div className="flex items-center gap-2 text-xs mt-1">
                <span className="bg-slate-700 px-2 py-0.5 rounded text-slate-300">
                  {getAttributeIcon(challenge.attribute)} {challenge.attribute}
                </span>
                <span className={`${getDifficultyColor(challenge.difficulty)} font-medium`}>
                  {getDifficultyLabel(challenge.difficulty)}
                </span>
                <span className="text-slate-500 flex items-center gap-1">
                  <Zap size={10} /> Seq: {challenge.streak}
                </span>
              </div>
            </div>
          </div>

          <button 
            onClick={() => onDelete(challenge.id)}
            className="text-slate-600 hover:text-red-400 p-2"
          >
            <Trash2 size={18} />
          </button>
        </div>
      ))}
    </div>
  );
};

export default ChallengeList;