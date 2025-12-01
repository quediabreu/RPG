import React, { useState, useEffect } from 'react';
import { User, Challenge, INITIAL_STATS, AttributeType, UserStats } from './types';
import StatsRadar from './components/StatsRadar';
import ChallengeList from './components/ChallengeList';
import { generateQuestIdeas, getAiCoaching } from './services/geminiService';
import { Sparkles, Plus, Skull, LogOut, Loader2, Bot } from 'lucide-react';

const STORAGE_KEY = 'life-rpg-user';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  
  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [newChallenge, setNewChallenge] = useState<Partial<Challenge>>({
    title: '', attribute: AttributeType.DIS, difficulty: 'Easy'
  });
  
  // AI States
  const [aiLoading, setAiLoading] = useState(false);
  const [aiQuests, setAiQuests] = useState<Array<{title: string, description: string, difficulty: string}>>([]);
  const [aiAdvice, setAiAdvice] = useState<string>('');

  // -------------------------------------------------------------------------
  // Initialization & Game Loop
  // -------------------------------------------------------------------------
  useEffect(() => {
    const storedUser = localStorage.getItem(STORAGE_KEY);
    if (storedUser) {
      const parsedUser: User = JSON.parse(storedUser);
      checkPenalties(parsedUser);
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveUser = (u: User) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    setUser(u);
  };

  const checkPenalties = (u: User) => {
    const today = new Date().toISOString().split('T')[0];
    const lastLogin = u.lastLoginDate.split('T')[0];

    if (lastLogin !== today) {
      // It's a new day! 
      // 1. Reset completion status
      const resetChallenges = u.challenges.map(c => {
        return { ...c, completedToday: false };
      });
      
      // 2. Check for penalties (Simple version: flat damage for missed day if HP > 0)
      let newHp = u.stats.hp;
      if (lastLogin < today && u.challenges.length > 0) {
          // Minimal penalty for login logic simulation
         // newHp = Math.max(0, newHp - 5);
      }

      const updatedUser = {
        ...u,
        stats: { ...u.stats, hp: newHp },
        challenges: resetChallenges,
        lastLoginDate: new Date().toISOString()
      };
      
      saveUser(updatedUser);
    } else {
      setUser(u);
    }
    setLoading(false);
  };

  // -------------------------------------------------------------------------
  // Auth Logic
  // -------------------------------------------------------------------------
  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (isRegistering) {
      // Create new user
      const newUser: User = {
        id: crypto.randomUUID(),
        name: email.split('@')[0],
        email,
        stats: { ...INITIAL_STATS },
        challenges: [],
        lastLoginDate: new Date().toISOString(),
        isOnboarded: false
      };
      saveUser(newUser);
    } else {
      // Mock Login (Matches storage or creates default for demo if empty)
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        checkPenalties(JSON.parse(stored));
      } else {
        alert("Usuário não encontrado. Por favor, cadastre-se.");
      }
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  // -------------------------------------------------------------------------
  // Gameplay Logic
  // -------------------------------------------------------------------------
  const calculateRewards = (difficulty: string) => {
    switch (difficulty) {
      case 'Hard': return { exp: 30, coin: 15, attr: 3 };
      case 'Medium': return { exp: 20, coin: 10, attr: 2 };
      default: return { exp: 10, coin: 5, attr: 1 };
    }
  };

  const handleLevelUp = (currentStats: UserStats): UserStats => {
    let { exp, maxExp, level, hp, maxHp } = currentStats;
    if (exp >= maxExp) {
      level += 1;
      exp -= maxExp;
      maxExp = Math.floor(maxExp * 1.2);
      maxHp += 10;
      hp = maxHp; // Full heal on level up
      // Trigger simple animation logic here (toast/alert for now)
      alert("🎉 LEVEL UP! Você alcançou o Nível " + level);
    }
    return { ...currentStats, exp, maxExp, level, hp, maxHp };
  };

  const completeChallenge = (id: string) => {
    if (!user) return;

    const challenge = user.challenges.find(c => c.id === id);
    if (!challenge || challenge.completedToday) return;

    const rewards = calculateRewards(challenge.difficulty);
    
    // Update Stats
    let newStats = { ...user.stats };
    newStats.exp += rewards.exp;
    newStats.coins += rewards.coin;
    newStats.attributes[challenge.attribute] += rewards.attr;
    newStats = handleLevelUp(newStats);

    // Update Challenge
    const updatedChallenges = user.challenges.map(c => 
      c.id === id ? { ...c, completedToday: true, streak: c.streak + 1 } : c
    );

    saveUser({ ...user, stats: newStats, challenges: updatedChallenges });
  };

  const addChallenge = () => {
    if (!user || !newChallenge.title) return;
    const challenge: Challenge = {
      id: crypto.randomUUID(),
      title: newChallenge.title,
      difficulty: newChallenge.difficulty as 'Easy' | 'Medium' | 'Hard',
      attribute: newChallenge.attribute as AttributeType,
      completedToday: false,
      streak: 0
    };
    saveUser({ ...user, challenges: [...user.challenges, challenge], isOnboarded: true });
    setShowAddModal(false);
    setNewChallenge({ title: '', attribute: AttributeType.DIS, difficulty: 'Easy' });
  };

  const deleteChallenge = (id: string) => {
    if (!user) return;
    saveUser({ ...user, challenges: user.challenges.filter(c => c.id !== id) });
  };

  // -------------------------------------------------------------------------
  // AI Features
  // -------------------------------------------------------------------------
  const handleGenerateQuests = async () => {
    if (!user) return;
    setAiLoading(true);
    // Find lowest attribute to focus on
    const entries = Object.entries(user.stats.attributes);
    const lowest = entries.sort((a, b) => a[1] - b[1])[0][0] as AttributeType;
    
    const quests = await generateQuestIdeas(user.stats.level, lowest);
    setAiQuests(quests);
    setAiLoading(false);
  };

  const handleGetCoaching = async () => {
    if (!user) return;
    setAiLoading(true);
    const advice = await getAiCoaching(user.stats.attributes);
    setAiAdvice(advice);
    setAiLoading(false);
  };

  const acceptAiQuest = (q: any) => {
    if (!user) return;
    const challenge: Challenge = {
      id: crypto.randomUUID(),
      title: q.title,
      description: q.description,
      difficulty: q.difficulty,
      attribute: AttributeType.INT, // AI usually gives generic self-improvement, defaulting to INT or could map manually
      completedToday: false,
      streak: 0
    };
    saveUser({ ...user, challenges: [...user.challenges, challenge] });
    setAiQuests(prev => prev.filter(i => i.title !== q.title));
  };


  // -------------------------------------------------------------------------
  // Renders
  // -------------------------------------------------------------------------

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-900 text-white">Carregando Reino...</div>;

  // LOGIN SCREEN
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-800 rounded-2xl shadow-2xl p-8 border border-slate-700">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">LifeRPG</h1>
            <p className="text-slate-400 mt-2">Gamifique sua existência.</p>
          </div>
          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
              <input 
                type="email" 
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-purple-500 outline-none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Senha</label>
              <input 
                type="password" 
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-purple-500 outline-none"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-lg transition-all">
              {isRegistering ? 'Iniciar Aventura' : 'Continuar Jornada'}
            </button>
          </form>
          <div className="mt-6 text-center">
            <button 
              onClick={() => setIsRegistering(!isRegistering)}
              className="text-slate-400 hover:text-white text-sm"
            >
              {isRegistering ? 'Já é um herói? Entrar' : 'Novo herói? Criar Conta'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // DASHBOARD
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 p-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center font-bold text-lg">
              {user.stats.level}
            </div>
            <div>
              <h2 className="font-bold leading-tight">{user.name}</h2>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>💰 {user.stats.coins} Ouro</span>
                <span>• {user.stats.hp} HP</span>
              </div>
            </div>
          </div>
          <button onClick={logout} className="p-2 bg-slate-800 rounded-lg hover:bg-red-900/50 text-slate-400 hover:text-red-400 transition-colors">
            <LogOut size={20} />
          </button>
        </div>
        
        {/* Progress Bars */}
        <div className="max-w-5xl mx-auto mt-4 space-y-1">
          <div className="relative h-2 bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="absolute top-0 left-0 h-full bg-red-500 transition-all duration-500" 
              style={{ width: `${(user.stats.hp / user.stats.maxHp) * 100}%` }}
            />
          </div>
          <div className="relative h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="absolute top-0 left-0 h-full bg-yellow-400 transition-all duration-500" 
              style={{ width: `${(user.stats.exp / user.stats.maxExp) * 100}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-500 px-1">
            <span>HP {user.stats.hp}/{user.stats.maxHp}</span>
            <span>EXP {user.stats.exp}/{user.stats.maxExp}</span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Col: Stats */}
        <div className="md:col-span-1 space-y-6">
          <StatsRadar attributes={user.stats.attributes} />
          
          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold flex items-center gap-2">
                <Bot size={18} className="text-purple-400" /> Mestre da Guilda (IA)
              </h3>
            </div>
            {aiAdvice ? (
              <p className="text-sm text-slate-300 italic">"{aiAdvice}"</p>
            ) : (
              <button 
                onClick={handleGetCoaching} 
                disabled={aiLoading}
                className="w-full py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs font-semibold"
              >
                {aiLoading ? 'Consultando...' : 'Pedir Conselho'}
              </button>
            )}
          </div>
        </div>

        {/* Right Col: Challenges */}
        <div className="md:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg">Registro de Missões</h3>
            <div className="flex gap-2">
               <button 
                onClick={() => { setShowAiModal(true); handleGenerateQuests(); }}
                className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
              >
                <Sparkles size={16} /> IA Missões
              </button>
              <button 
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
              >
                <Plus size={16} /> Nova
              </button>
            </div>
          </div>

          <ChallengeList 
            challenges={user.challenges} 
            onComplete={completeChallenge}
            onDelete={deleteChallenge}
          />
        </div>
      </main>

      {/* Add Challenge Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-2xl w-full max-w-md p-6 border border-slate-700">
            <h3 className="text-xl font-bold mb-4">Nova Missão</h3>
            <div className="space-y-4">
              <input 
                placeholder="Título da Missão (ex: Ler 10 páginas)" 
                className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 outline-none focus:border-purple-500"
                value={newChallenge.title}
                onChange={e => setNewChallenge({...newChallenge, title: e.target.value})}
              />
              <div className="grid grid-cols-2 gap-4">
                <select 
                  className="bg-slate-900 border border-slate-600 rounded-lg p-3 outline-none"
                  value={newChallenge.attribute}
                  onChange={e => setNewChallenge({...newChallenge, attribute: e.target.value as AttributeType})}
                >
                  {Object.values(AttributeType).map(attr => (
                    <option key={attr} value={attr}>{attr}</option>
                  ))}
                </select>
                <select 
                  className="bg-slate-900 border border-slate-600 rounded-lg p-3 outline-none"
                  value={newChallenge.difficulty}
                  onChange={e => setNewChallenge({...newChallenge, difficulty: e.target.value as any})}
                >
                  <option value="Easy">Fácil</option>
                  <option value="Medium">Médio</option>
                  <option value="Hard">Difícil</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button onClick={() => setShowAddModal(false)} className="flex-1 py-3 text-slate-400 hover:bg-slate-700 rounded-lg">Cancelar</button>
                <button onClick={addChallenge} className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold">Criar Missão</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Modal */}
      {showAiModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-2xl w-full max-w-lg p-6 border border-slate-700">
            <div className="flex justify-between items-center mb-4">
               <h3 className="text-xl font-bold flex items-center gap-2"><Sparkles className="text-yellow-400" /> Quadro de Missões</h3>
               <button onClick={() => setShowAiModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            
            {aiLoading ? (
               <div className="py-12 flex flex-col items-center text-slate-400">
                 <Loader2 className="animate-spin mb-2" size={32} />
                 <p>Consultando o Oráculo...</p>
               </div>
            ) : (
              <div className="space-y-3">
                {aiQuests.length > 0 ? (
                  aiQuests.map((q, idx) => (
                    <div key={idx} className="bg-slate-700 p-4 rounded-lg flex justify-between items-center group">
                      <div>
                        <h4 className="font-bold text-white group-hover:text-purple-300 transition-colors">{q.title}</h4>
                        <p className="text-xs text-slate-300">{q.description}</p>
                        <span className="text-[10px] uppercase bg-slate-900 px-2 py-0.5 rounded text-slate-400 mt-2 inline-block">
                          {q.difficulty === 'Easy' ? 'Fácil' : q.difficulty === 'Medium' ? 'Médio' : 'Difícil'}
                        </span>
                      </div>
                      <button 
                        onClick={() => acceptAiQuest(q)}
                        className="bg-purple-600 hover:bg-purple-500 text-white p-2 rounded-lg ml-3"
                      >
                        <Plus size={20} />
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-slate-500 py-4">Nenhuma missão encontrada. Tente criar uma manualmente.</p>
                )}
              </div>
            )}
            <div className="mt-4 pt-4 border-t border-slate-700 text-center">
               <button onClick={handleGenerateQuests} className="text-sm text-purple-400 hover:text-purple-300 underline">
                 Gerar Novas Missões
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}