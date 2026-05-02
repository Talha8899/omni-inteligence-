import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  Brain, 
  ChevronRight, 
  RefreshCcw, 
  CheckCircle2, 
  XCircle, 
  X,
  Sparkles,
  Info,
  Clock,
  ArrowRight,
  User,
  Send,
  Zap,
  Heart,
  HeartOff
} from 'lucide-react';
import { INITIAL_QUESTIONS, Question } from './data/questions';
import { generateQuestionBatch } from './services/geminiService';

const COLORS = {
  bg: '#050505',
  accent: '#7C3AED', // Violet
  correct: '#10B981', // Emerald
  incorrect: '#EF4444', // Rose
  glass: 'rgba(255, 255, 255, 0.03)',
  glassBorder: 'rgba(255, 255, 255, 0.1)',
};

const RANKS = [
  { name: 'Novice', min: 0, color: 'text-white/40' },
  { name: 'Apprentice', min: 20, color: 'text-blue-400' },
  { name: 'Scholar', min: 40, color: 'text-purple-400' },
  { name: 'Savant', min: 60, color: 'text-orange-400' },
  { name: 'Legend', min: 80, color: 'text-yellow-400' }
];

const TOPICS = [
  'All', 'General Knowledge', 'Science & Tech', 'Pakistan Special', 'Brain Teasers & Logic', 'Current Affairs', 'Technology', 'Islamic History', 'History', 'Philosophy', 'Art & Culture', 'Nature & Space', 'Medicine', 'Literature', 'Economy'
];

const isRateLimit = (err: any) => {
  const msg = typeof err === 'string' ? err : (err?.message || err?.error?.message || JSON.stringify(err) || '');
  const status = err?.status || err?.error?.status || '';
  const code = err?.code || err?.error?.code;
  return msg.includes('429') || msg.includes('quota') || msg.includes('Quota') || status === 429 || status === 'RESOURCE_EXHAUSTED' || code === 429;
};

export default function App() {
  const [questions, setQuestions] = useState<Question[]>(INITIAL_QUESTIONS);
  const [difficultyFilter, setDifficultyFilter] = useState<'All' | 'Easy' | 'Medium' | 'Hard'>('All');
  const [topicFilter, setTopicFilter] = useState<string>('All');
  const [isTopicMenuOpen, setIsTopicMenuOpen] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [gameState, setGameState] = useState<'start' | 'playing' | 'feedback' | 'finished'>('start');
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [lives, setLives] = useState(5);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isPrefetching, setIsPrefetching] = useState(false);
  const [apiExhausted, setApiExhausted] = useState(false);
  const [lastApiErrorTime, setLastApiErrorTime] = useState<number>(0);
  const [streak, setStreak] = useState(0);
  const [showRankUp, setShowRankUp] = useState(false);
  const [highScore, setHighScore] = useState<number>(0);
  
  useEffect(() => {
    const savedHighScore = localStorage.getItem('omnia_high_score');
    if (savedHighScore) {
      setHighScore(parseInt(savedHighScore, 10));
    }
  }, []);

  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('omnia_high_score', score.toString());
    }
  }, [score, highScore]);


  const currentRank = [...RANKS].reverse().find(r => questionsAnswered >= r.min) || RANKS[0];

  const [isDailyQuest, setIsDailyQuest] = useState(false);
  const currentQuestion = questions[currentIdx];

  const getTimerDuration = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 30;
      case 'Medium': return 30;
      case 'Hard': return 30;
      default: return 30;
    }
  };

  const handleStart = (daily = false) => {
    setQuestionsAnswered(0);
    setIsDailyQuest(daily);
    setGameState('playing');
    setCurrentIdx(0);
    setScore(0);
    setStreak(0);
    setLives(5);
    setSelectedOption(null);
    setQuestions([]);
    setIsLoadingMore(true);

    // Check for API cooldown
    const now = Date.now();
    if (apiExhausted && now - lastApiErrorTime < 60000) {
      console.warn("API in cooldown, using fallback");
      let fallbackChoices = INITIAL_QUESTIONS.filter(q => 
        (difficultyFilter === 'All' || q.difficulty === difficultyFilter) &&
        (topicFilter === 'All' || q.category === topicFilter)
      );
      if (fallbackChoices.length === 0) fallbackChoices = INITIAL_QUESTIONS.filter(q => difficultyFilter === 'All' || q.difficulty === difficultyFilter);
      if (fallbackChoices.length === 0) fallbackChoices = INITIAL_QUESTIONS;
      
      const fallback = fallbackChoices.sort(() => Math.random() - 0.5).slice(0, 3);
      setQuestions(fallback);
      setTimeLeft(getTimerDuration(fallback[0].difficulty));
      setIsLoadingMore(false);
      return;
    }

    const targetTopic = daily ? 'Random Deep Wisdom' : topicFilter;
    const targetDifficulty = difficultyFilter === 'All' ? 'Medium' : difficultyFilter;
    
    // Fetch a batch of questions immediately.
    generateQuestionBatch([], targetTopic, targetDifficulty, 30)
      .then(initialQs => {
        if (initialQs && initialQs.length > 0) {
          setApiExhausted(false);
          const uniqueQs = initialQs.map((q, idx) => ({ ...q, id: `init-${Date.now()}-${idx}` }));
          setQuestions(uniqueQs);
          setTimeLeft(getTimerDuration(uniqueQs[0].difficulty));
          setIsLoadingMore(false);
        } else {
          // Fallback if empty response
          throw new Error("Empty response");
        }
      })
      .catch((err) => {
        console.error("AI First Question Generation failed", err);
        if (isRateLimit(err)) {
          setApiExhausted(true);
          setLastApiErrorTime(Date.now());
        }
        let fallbackChoices = INITIAL_QUESTIONS.filter(q => 
          (difficultyFilter === 'All' || q.difficulty === difficultyFilter) &&
          (topicFilter === 'All' || q.category === topicFilter)
        );
        if (fallbackChoices.length === 0) fallbackChoices = INITIAL_QUESTIONS.filter(q => difficultyFilter === 'All' || q.difficulty === difficultyFilter);
        if (fallbackChoices.length === 0) fallbackChoices = INITIAL_QUESTIONS;
        const finalFallback = fallbackChoices.sort(() => Math.random() - 0.5).slice(0, 30); // Use up to 30 fallback questions
        setQuestions(finalFallback);
        setTimeLeft(getTimerDuration(finalFallback[0].difficulty));
        setIsLoadingMore(false);
      });
  };

  const prefetchQuestion = useCallback(async (currentQuestions: Question[]) => {
    if (isPrefetching || apiExhausted) return;
    
    // Don't prefetch if we already have a healthy buffer
    if (currentQuestions.length - currentIdx > 15) return;

    setIsPrefetching(true);
    try {
      const nextQs = await generateQuestionBatch(
        currentQuestions.map(q => q.question), 
        isDailyQuest ? 'Deep Wisdom' : topicFilter,
        difficultyFilter === 'All' ? 'Medium' : difficultyFilter,
        5
      );
      setApiExhausted(false);
      const newQs = nextQs.map((q, idx) => ({ ...q, id: `prefetch-${Date.now()}-${idx}` }));
      setQuestions(prev => [...prev, ...newQs]);
    } catch (err: any) {
      console.error("Prefetch failed", err);
      if (isRateLimit(err)) {
        setApiExhausted(true);
        setLastApiErrorTime(Date.now());
      }
    } finally {
      setIsPrefetching(false);
    }
  }, [isPrefetching, isDailyQuest, topicFilter, difficultyFilter, apiExhausted, currentIdx]);

  const handleNext = useCallback(async () => {
    setQuestionsAnswered(prev => {
      const newVal = prev + 1;
      const nextRankThreshold = RANKS.find(r => r.min > prev)?.min;
      if (nextRankThreshold && newVal >= nextRankThreshold) {
        setShowRankUp(true);
        setTimeout(() => setShowRankUp(false), 3000);
      }
      return newVal;
    });

    if (currentIdx < questions.length - 1) {
      const nextQ = questions[currentIdx + 1];
      setCurrentIdx(i => i + 1);
      setSelectedOption(null);
      setTimeLeft(getTimerDuration(nextQ.difficulty));
      setGameState('playing');
      
      // If we are running low on buffer, fetch more
      if (questions.length - currentIdx < 10 && !apiExhausted) {
        prefetchQuestion([...questions]);
      }
    } else {
      // Buffer empty, must wait
      if (apiExhausted) {
        let fallbackChoices = INITIAL_QUESTIONS.filter(q => 
          (difficultyFilter === 'All' || q.difficulty === difficultyFilter) &&
          (topicFilter === 'All' || q.category === topicFilter)
        );
        if (fallbackChoices.length === 0) fallbackChoices = INITIAL_QUESTIONS.filter(q => difficultyFilter === 'All' || q.difficulty === difficultyFilter);
        if (fallbackChoices.length === 0) fallbackChoices = INITIAL_QUESTIONS;
        const fallback = fallbackChoices[Math.floor(Math.random() * fallbackChoices.length)];
        
        const newQ = { ...fallback, id: Date.now().toString() };
        setQuestions(prev => [...prev, newQ]);
        setCurrentIdx(i => i + 1);
        setSelectedOption(null);
        setTimeLeft(getTimerDuration(newQ.difficulty));
        setGameState('playing');
        return;
      }
      
      setIsLoadingMore(true);
      try {
        const nextQs = await generateQuestionBatch(
          questions.map(q => q.question), 
          isDailyQuest ? 'Deep Wisdom' : topicFilter,
          difficultyFilter === 'All' ? 'Medium' : difficultyFilter,
          5
        );
        const newQs = nextQs.map((q, idx) => ({ ...q, id: `next-${Date.now()}-${idx}` }));
        setQuestions(prev => [...prev, ...newQs]);
        setCurrentIdx(i => i + 1);
        setSelectedOption(null);
        setTimeLeft(getTimerDuration(newQs[0].difficulty));
        setGameState('playing');
      } catch (err: any) {
        if (isRateLimit(err)) {
          setApiExhausted(true);
          setLastApiErrorTime(Date.now());
          // Switch to fallback instead of finishing game
          let fallbackChoices = INITIAL_QUESTIONS.filter(q => 
            (difficultyFilter === 'All' || q.difficulty === difficultyFilter) &&
            (topicFilter === 'All' || q.category === topicFilter)
          );
          if (fallbackChoices.length === 0) fallbackChoices = INITIAL_QUESTIONS.filter(q => difficultyFilter === 'All' || q.difficulty === difficultyFilter);
          if (fallbackChoices.length === 0) fallbackChoices = INITIAL_QUESTIONS;
          const fallback = fallbackChoices[Math.floor(Math.random() * fallbackChoices.length)];
          const newQ = { ...fallback, id: Date.now().toString() };
          setQuestions(prev => [...prev, newQ]);
          setCurrentIdx(i => i + 1);
          setSelectedOption(null);
          setTimeLeft(getTimerDuration(newQ.difficulty));
          setGameState('playing');
        } else {
          setGameState('finished');
        }
      } finally {
        setIsLoadingMore(false);
      }
    }
  }, [currentIdx, questions, topicFilter, isDailyQuest, prefetchQuestion, difficultyFilter]);

  const handleOptionSelect = useCallback((idx: number) => {
    if (gameState !== 'playing' || !currentQuestion) return;
    setSelectedOption(idx);
    setGameState('feedback');

    // Start prefetching next question in background while user reads feedback or waits for auto-advance
    prefetchQuestion([...questions]);
    
    if (idx === currentQuestion.correctIndex) {
      setScore(s => s + 10);
      setStreak(st => st + 1);
      
      // Auto-advance if correct after a brief delay
      setTimeout(() => {
        handleNext();
      }, 1500);
    } else {
      setStreak(0);
      setLives(prev => {
        // If idx is -1, it marks a system timeout - immediate game over
        const nextVal = idx === -1 ? 0 : prev - 1;
        if (nextVal <= 0) {
          setTimeout(() => setGameState('finished'), 1500);
        }
        return nextVal;
      });
      // Don't auto-advance on wrong answer so they can read explanation
    }
  }, [gameState, currentQuestion, prefetchQuestion, questions, handleNext]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (gameState === 'playing' && timeLeft > 0 && currentQuestion) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && gameState === 'playing' && currentQuestion) {
      handleOptionSelect(-1); // -1 indicates a timeout
    }
    return () => clearInterval(timer);
  }, [gameState, timeLeft, currentQuestion, handleOptionSelect]);

  const resetGame = () => {
    setQuestions(INITIAL_QUESTIONS);
    setCurrentIdx(0);
    setScore(0);
    setLives(5);
    setStreak(0);
    setGameState('start');
    setSelectedOption(null);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-purple-500/30 overflow-x-hidden relative">
      <div className="mesh-bg" />
      
      {/* Decorative Gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] rounded-full opacity-30 blur-[120px]"
          style={{ background: `radial-gradient(circle, ${COLORS.accent} 0%, transparent 70%)` }}
        />
        <div 
          className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full opacity-20 blur-[100px]"
          style={{ background: 'radial-gradient(circle, #3B82F6 0%, transparent 70%)' }}
        />
      </div>

      {/* Rank Up Notification */}
      <AnimatePresence>
        {showRankUp && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: -50 }}
            className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none"
          >
            <div className="bg-purple-600/90 backdrop-blur-xl border border-purple-400 p-6 sm:p-12 rounded-[32px] sm:rounded-[40px] shadow-[0_0_100px_rgba(124,58,237,0.5)] flex flex-col items-center mx-4">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 0.5, repeat: Infinity }}
              >
                <Trophy className="w-12 h-12 sm:w-20 sm:h-20 text-yellow-400 mb-4" />
              </motion.div>
              <h2 className="text-2xl sm:text-4xl font-black uppercase tracking-tighter mb-2">Rank Up!</h2>
              <p className="text-sm sm:text-xl font-bold opacity-80 uppercase tracking-widest">{currentRank.name} Attained</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 pt-8 sm:pt-12 pb-16 sm:pb-24 min-h-screen flex flex-col items-center">
        {/* Header */}
        <header className="w-full flex flex-col sm:flex-row items-center justify-between gap-6 mb-10 sm:mb-20">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-white text-black flex items-center justify-center font-display text-xl sm:text-2xl font-black shadow-[0_0_30px_rgba(255,255,255,0.2)]">
              Ω
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-display font-bold tracking-tighter leading-none">Omnia</h1>
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold font-mono">The Universal Intelligence</p>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
            <div className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-full border border-white/10 bg-white/5 flex items-center gap-2">
              <div className="flex gap-0.5 sm:gap-1">
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={false}
                    animate={{ 
                      scale: i < lives ? 1 : 0.8,
                      opacity: i < lives ? 1 : 0.2
                    }}
                  >
                    {i < lives ? (
                      <Heart className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-rose-500 fill-rose-500" />
                    ) : (
                      <HeartOff className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white/20" />
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
            <div className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-full border border-white/10 bg-white/5 flex flex-col items-center justify-center min-w-[80px] sm:min-w-[100px]">
              <span className="text-[7px] sm:text-[8px] uppercase font-mono text-white/40 mb-0.5">High Score</span>
              <span className="text-[10px] sm:text-xs font-bold font-mono text-purple-400 tracking-widest">{highScore}</span>
            </div>
            <div className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-full border border-white/10 bg-white/5 flex items-center gap-2">
              <Trophy className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500" />
              <div className="flex flex-col">
                <span className="text-[7px] sm:text-[8px] uppercase font-mono text-white/40">Score</span>
                <span className="text-[10px] sm:text-sm font-mono font-medium leading-none">{score}</span>
              </div>
            </div>
            {streak > 1 && (
              <motion.div 
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-full border border-orange-500/30 bg-orange-500/10 flex items-center gap-1.5 sm:gap-2"
              >
                <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-orange-500" />
                <span className="text-[10px] sm:text-sm font-bold text-orange-400">{streak}x Streak</span>
              </motion.div>
            )}
          </div>
        </header>

        <AnimatePresence mode="wait">
          {gameState === 'start' && (
            <motion.section 
              key="start"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center text-center max-w-2xl mt-6 sm:mt-12 mb-10 sm:mb-20"
            >
              <h2 className="text-3xl sm:text-5xl md:text-6xl font-display font-black mb-6 sm:mb-8 tracking-tighter bg-gradient-to-br from-white via-white to-white/10 bg-clip-text text-transparent leading-[0.9] text-center uppercase">
                Omnia <br /> Intelligence.
              </h2>
              <p className="text-white/50 mb-10 sm:mb-16 text-[10px] sm:text-sm leading-relaxed font-mono uppercase tracking-[0.2em] sm:tracking-[0.3em] max-w-[500px]">
                The Synthetic Intellect for Pure Knowledge.
              </p>

              <div className="flex flex-col gap-8 sm:gap-10 w-full mb-10 sm:mb-12">
                <div className="flex flex-col items-center">
                  <span className="text-[9px] sm:text-[10px] uppercase font-mono tracking-[0.2em] sm:tracking-[0.3em] text-white/30 mb-4 sm:mb-6 font-bold">Domain Selector</span>
                  <div className="flex flex-wrap justify-center gap-2 sm:gap-3 relative">
                    {/* Featured Topics */}
                    {['All', 'General Knowledge', 'Science & Tech'].map((topic) => (
                      <motion.button
                        key={topic}
                        whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.08)' }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setTopicFilter(topic)}
                        className={`px-5 py-2 sm:px-7 sm:py-2.5 rounded-full border text-[10px] sm:text-xs font-bold transition-all uppercase tracking-widest relative ${
                          topicFilter === topic && !['Medicine', 'History', 'Philosophy', 'Nature', 'Space', 'Art', 'Islamic History', 'Pakistan Special', 'Brain Teasers & Logic', 'Current Affairs', 'Technology'].includes(topicFilter)
                            ? 'text-black border-white' 
                            : 'border-white/10 bg-white/5 text-white/60 hover:border-white/20'
                        }`}
                      >
                        <span className="relative z-10">{topic}</span>
                        {topicFilter === topic && !['Medicine', 'History', 'Philosophy', 'Nature', 'Space', 'Art', 'Islamic History', 'Pakistan Special', 'Brain Teasers & Logic', 'Current Affairs', 'Technology', 'National Knowledge'].includes(topicFilter) && (
                          <motion.div
                            layoutId="activeTopic"
                            className="absolute inset-0 bg-white rounded-full shadow-[0_0_30px_rgba(255,255,255,0.4)]"
                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                          />
                        )}
                      </motion.button>
                    ))}

                    {/* Dropdown for others */}
                    <div className="relative">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsTopicMenuOpen(!isTopicMenuOpen)}
                        className={`px-5 py-2 sm:px-7 sm:py-2.5 rounded-full border text-[10px] sm:text-xs font-bold transition-all uppercase tracking-widest flex items-center gap-2 ${
                          !['All', 'General Knowledge', 'Science & Tech'].includes(topicFilter)
                            ? 'bg-white text-black border-white'
                            : 'border-white/10 bg-white/5 text-white/60 hover:border-white/20'
                        }`}
                      >
                        {!['All', 'General Knowledge', 'Science & Tech'].includes(topicFilter) ? topicFilter : 'Explore More'}
                        <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isTopicMenuOpen ? 'rotate-90' : ''}`} />
                      </motion.button>

                      <AnimatePresence>
                        {isTopicMenuOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute left-1/2 -translate-x-1/2 top-full mt-3 w-48 bg-[#111] border border-white/10 rounded-2xl overflow-y-auto max-h-[300px] shadow-2xl z-50 p-1 custom-scrollbar"
                          >
                            {TOPICS.filter(t => !['All', 'General Knowledge', 'Science & Tech'].includes(t)).map((topic) => (
                              <motion.button
                                key={topic}
                                whileHover={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => {
                                  setTopicFilter(topic);
                                  setIsTopicMenuOpen(false);
                                }}
                                className={`w-full px-4 py-2.5 text-left text-[10px] uppercase font-bold tracking-widest transition-colors rounded-xl flex items-center justify-between group ${
                                  topicFilter === topic ? 'bg-white/10 text-white' : 'text-white/40 hover:bg-white/5 hover:text-white'
                                }`}
                              >
                                {topic}
                                {topicFilter === topic && <div className="w-1 h-1 rounded-full bg-purple-500" />}
                              </motion.button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-center">
                  <span className="text-[9px] sm:text-[10px] uppercase font-mono tracking-[0.2em] sm:tracking-[0.3em] text-white/30 mb-4 sm:mb-6 font-bold">Difficulty Vector</span>
                  <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
                    {['All', 'Easy', 'Medium', 'Hard'].map((d) => (
                      <motion.button
                        key={d}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setDifficultyFilter(d as any)}
                        className={`px-5 py-2 sm:px-7 sm:py-2.5 rounded-full border text-[10px] sm:text-xs font-bold transition-all uppercase tracking-widest relative ${
                          difficultyFilter === d 
                            ? 'text-white border-purple-400' 
                            : 'border-white/10 bg-white/5 text-white/60 hover:border-white/20'
                        }`}
                      >
                        <span className="relative z-10">{d}</span>
                        {difficultyFilter === d && (
                          <motion.div
                            layoutId="activeDiff"
                            className="absolute inset-0 bg-purple-500 rounded-full shadow-[0_0_20px_rgba(124,58,237,0.3)]"
                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                          />
                        )}
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 w-full pt-2">
                <motion.button 
                  id="start-btn"
                  whileHover={{ scale: 1.02, boxShadow: '0 20px 60px rgba(255,255,255,0.15)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleStart(false)}
                  className="flex-[2] group relative px-6 py-4 sm:px-10 sm:py-5 bg-white text-black font-display font-black uppercase text-xs sm:text-sm tracking-[0.15em] sm:tracking-widest rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(255,255,255,0.1)] transition-all flex items-center justify-center gap-3 hover:bg-white/90"
                >
                  <Zap className="w-5 h-5 fill-current" />
                  <span className="relative z-10">Initialize Quest</span>
                </motion.button>
                
                <motion.button 
                  whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.2)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleStart(true)}
                  className="flex-1 group relative px-6 py-4 sm:px-8 sm:py-5 bg-glass text-white font-display font-black uppercase text-xs sm:text-sm tracking-[0.15em] sm:tracking-widest rounded-2xl overflow-hidden border border-white/10 transition-all flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-5 h-5 text-purple-400" />
                  <span className="relative z-10">Daily</span>
                </motion.button>
              </div>

            </motion.section>
          )}

          {(gameState === 'playing' || gameState === 'feedback') && (
            <motion.div 
              key="active-game"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              className="w-full"
            >
              <div className="w-full max-w-2xl flex justify-between items-center mb-6 px-1 mx-auto">
                <div className="flex items-center gap-4 sm:gap-6">
                  <div className="flex flex-col">
                      <span className="text-[7px] sm:text-[10px] uppercase font-mono tracking-widest text-white/30">Quest Count</span>
                      <span className="text-xs sm:text-sm font-bold font-mono text-purple-400">{currentIdx + 1}</span>
                  </div>
                  <div className="flex flex-col">
                      <span className="text-[7px] sm:text-[10px] uppercase font-mono tracking-widest text-white/30">Current Score</span>
                      <span className="text-xs sm:text-sm font-bold font-mono text-emerald-400">{score}</span>
                  </div>
                </div>
                <motion.button 
                  whileHover={{ scale: 1.05, backgroundColor: 'rgba(239,68,68,0.1)' }}
                  whileTap={{ scale: 0.95 }}
                  onClick={resetGame}
                  className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-full border text-[7px] sm:text-[10px] uppercase font-mono font-bold tracking-widest transition-all ${
                    lives > 0 ? 'bg-white/5 border-white/10 text-white/40 hover:text-rose-400 hover:border-rose-400/50 hover:bg-rose-500/5' : 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                  }`}
                >
                  <X className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                  {lives > 0 ? 'Quit' : 'Failed'}
                </motion.button>
              </div>


              <div className="w-full max-w-2xl mx-auto">
                {!currentQuestion ? (
                  <div className="flex flex-col items-center justify-center p-20 bg-white/5 rounded-[40px] border border-white/10">
                      <RefreshCcw className="w-12 h-12 text-purple-400 animate-spin mb-6" />
                      <h3 className="text-xl font-bold mb-2">Generating First Quest...</h3>
                      <p className="text-white/40 text-sm">Our Knowledge Engine is architecting a unique challenge for you.</p>
                  </div>
                ) : (
                  <>
                    <div className="mb-6 flex justify-between items-end">
                      <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] uppercase font-mono tracking-widest text-purple-400 font-bold">{currentQuestion.category}</span>
                          <span className="w-1 h-1 rounded-full bg-white/20" />
                          <span className={`text-[10px] uppercase font-mono tracking-widest font-bold ${
                            currentQuestion.difficulty === 'Easy' ? 'text-emerald-400' :
                            currentQuestion.difficulty === 'Medium' ? 'text-orange-400' : 'text-rose-400'
                          }`}>
                            {currentQuestion.difficulty}
                          </span>
                          </div>
                          <h3 className="text-lg md:text-2xl font-display font-bold leading-tight tracking-tight">{currentQuestion.question}</h3>
                      </div>
                      
                      <div className="flex flex-col items-end gap-1">
                        <div className={`text-xl sm:text-2xl font-mono font-bold ${timeLeft <= 5 ? 'text-rose-500 animate-pulse' : 'text-white/40'}`}>
                          {timeLeft}s
                        </div>
                        <span className="text-[7px] sm:text-[8px] uppercase tracking-widest text-white/20 font-bold">Synchronicity</span>
                      </div>
                    </div>

                    {/* Timer Bar */}
                    <div className="w-full h-1 bg-white/5 rounded-full mb-6 sm:mb-10 overflow-hidden relative">
                      <motion.div 
                        key={currentIdx}
                        className="h-full bg-purple-500"
                        initial={{ width: '100%' }}
                        animate={{ 
                          width: `${(timeLeft / getTimerDuration(currentQuestion.difficulty)) * 100}%`,
                          backgroundColor: timeLeft <= 5 ? ['#7C3AED', '#EF4444', '#7C3AED'] : '#7C3AED'
                        }}
                        transition={{ 
                          width: { duration: 1, ease: 'linear' },
                          backgroundColor: timeLeft <= 5 ? { duration: 0.5, repeat: Infinity } : { duration: 0.2 }
                        }}
                      />
                      {timeLeft <= 5 && (
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: [0, 0.2, 0] }}
                          transition={{ duration: 0.5, repeat: Infinity }}
                          className="absolute inset-0 bg-rose-500 pointer-events-none"
                        />
                      )}
                    </div>

                    <div className="grid gap-3 mb-8">
                      {currentQuestion.options.map((option, i) => {
                        const isCorrect = i === currentQuestion.correctIndex;
                        const isSelected = i === selectedOption;
                        const showCorrect = gameState === 'feedback' && isCorrect;
                        const showWrong = gameState === 'feedback' && isSelected && !isCorrect;

                        return (
                        <motion.button
                            key={i}
                            whileHover={gameState === 'playing' ? { scale: 1.02, backgroundColor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.3)' } : {}}
                            whileTap={gameState === 'playing' ? { scale: 0.98 } : {}}
                            onClick={() => handleOptionSelect(i)}
                            disabled={gameState !== 'playing'}
                            className={`
                              w-full p-4 sm:p-6 rounded-3xl border text-left transition-all relative flex items-center justify-between group
                              ${gameState === 'playing' ? 'border-white/10 bg-white/5' : ''}
                              ${showCorrect ? 'border-emerald-500 bg-emerald-500/20' : ''}
                              ${showWrong ? 'border-rose-500 bg-rose-500/20' : ''}
                              ${!showCorrect && !showWrong && gameState === 'feedback' ? 'border-white/5 opacity-40 scale-98' : ''}
                            `}
                          >
                            <span className="text-base md:text-lg font-medium pr-10">{option}</span>
                            <div className="flex-shrink-0">
                              {showCorrect && <CheckCircle2 className="w-8 h-8 text-emerald-400" />}
                              {showWrong && <XCircle className="w-8 h-8 text-rose-400" />}
                              {gameState === 'playing' && (
                                <div className="w-8 h-8 rounded-2xl border border-white/20 group-hover:border-purple-500 group-hover:bg-purple-500 transition-all flex items-center justify-center text-xs font-mono font-bold text-white/40 group-hover:text-white">
                                  {String.fromCharCode(65 + i)}
                                </div>
                              )}
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>

                    {/* Feedback Overlay */}
                    <AnimatePresence>
                      {gameState === 'feedback' && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ type: 'spring', damping: 25, stiffness: 120 }}
                          className="p-5 sm:p-8 rounded-[32px] sm:rounded-[40px] bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl relative overflow-hidden"
                        >
                          <div className="absolute top-0 left-0 w-1 h-full bg-purple-500/50" />
                          <div className="flex items-start gap-3 sm:gap-4 mb-5 sm:mb-6">
                            <div className={`p-2 rounded-lg ${selectedOption === currentQuestion.correctIndex ? 'bg-emerald-500/20' : 'bg-white/10'}`}>
                              {selectedOption === currentQuestion.correctIndex ? (
                                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                              ) : (
                                <Info className="w-5 h-5 text-white/70" />
                              )}
                            </div>
                            <div className="flex flex-col gap-2">
                              <motion.h4 
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 }}
                                className="font-display font-bold uppercase tracking-tight text-lg md:text-xl"
                              >
                                {selectedOption === -1 ? 'Time Expired' : (selectedOption === currentQuestion.correctIndex ? 'Correct Signal' : 'Signal Divergence')}
                              </motion.h4>
                              <motion.p 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="text-white/50 text-sm md:text-base font-light leading-relaxed max-w-xl"
                              >
                                {selectedOption === -1 && <span className="text-rose-400 font-bold block mb-2 font-mono text-xs tracking-widest uppercase">System Timeout: AUTHORIZATION LAPSED</span>}
                                {currentQuestion.explanation}
                              </motion.p>
                            </div>
                          </div>
                          
                          <motion.button
                            id="next-btn"
                            whileHover={{ scale: 1.02, backgroundColor: 'rgba(124,58,237,1)' }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleNext}
                            disabled={isLoadingMore}
                            className="w-full py-4 bg-purple-600 rounded-2xl font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                          >
                            {isLoadingMore ? (
                              <>
                                <RefreshCcw className="w-5 h-5 animate-spin" />
                                <span>Architecting Next Level...</span>
                              </>
                            ) : (
                              <>
                                <span>Continue Journey</span>
                                <ArrowRight className="w-5 h-5" />
                              </>
                            )}
                          </motion.button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                )}
              </div>
            </motion.div>
          )}
          {gameState === 'finished' && (
            <motion.section 
              key="finished"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center text-center w-full max-w-4xl px-4 mt-12 pb-20"
            >
              <motion.div 
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', damping: 15, stiffness: 100 }}
                className="w-28 h-28 sm:w-32 sm:h-32 rounded-[40px] bg-white text-black flex items-center justify-center mb-8 relative shadow-[0_40px_100px_rgba(255,255,255,0.2)]"
              >
                 {lives > 0 ? <Trophy className="w-12 h-12" /> : <XCircle className="w-12 h-12 text-rose-500" />}
                 <div className="absolute inset-[-15px] border border-white/5 rounded-[50px] animate-[spin_20s_linear_infinite]" />
                 <div className="absolute inset-[-30px] border border-white/[0.03] rounded-[60px] animate-[spin_30s_linear_infinite_reverse]" />
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h2 className="text-4xl md:text-7xl font-display font-black mb-4 uppercase tracking-tighter leading-none italic">
                  {lives > 0 ? "Legend Attained" : "Signal Lost"}
                </h2>
                <p className="text-white/30 mb-12 text-[10px] md:text-xs uppercase tracking-[0.6em] font-mono font-bold">
                  {lives > 0 ? "Synchronicity Limit Reached" : "Neural Link Compromised"}
                </p>
              </motion.div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 w-full mb-12">
                {[
                  { label: 'Score', value: score, sub: 'Points', color: 'text-white', icon: Zap },
                  { label: 'Tier', value: currentRank.name, sub: 'Intellect', color: currentRank.color, icon: Trophy },
                  { label: 'Insight', value: questionsAnswered, sub: 'Quests', color: 'text-emerald-400', icon: Brain }
                ].map((stat, i) => (
                  <motion.div 
                    key={stat.label}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + (i * 0.1) }}
                    className="p-8 rounded-[40px] bg-white/5 border border-white/10 backdrop-blur-xl relative overflow-hidden group hover:border-white/20 transition-all"
                  >
                    <div className="absolute top-0 right-0 p-5 opacity-5 group-hover:opacity-10 transition-opacity">
                      <stat.icon className="w-16 h-16" />
                    </div>
                    <span className="text-white/20 text-[10px] uppercase tracking-[0.3em] font-black block mb-3">{stat.label}</span>
                    <span className={`text-4xl font-display font-black leading-none ${stat.color}`}>{stat.value}</span>
                    <span className="block mt-1 text-[8px] uppercase tracking-[0.2em] font-mono text-white/10">{stat.sub}</span>
                  </motion.div>
                ))}
              </div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="mb-12 bg-white/5 border border-white/10 rounded-[48px] p-10 w-full relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <p className="text-xl sm:text-2xl font-display font-medium text-white shadow-sm leading-tight italic tracking-tight">
                  "{score >= 80 ? "The architecture of your logic is impeccable. You possess a rare cognitive clarity." : 
                    score >= 40 ? "Your expansion is undeniable. Each successful sync solidifies your neural foundation." : 
                    "Every termination is a redirection. Wisdom is forged in the fires of iterative failure."}"
                </p>
              </motion.div>

              <div className="flex gap-4 w-full">
                <motion.button 
                  id="reset-btn"
                  whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.9)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={resetGame}
                  className="flex-1 flex items-center justify-center gap-3 px-8 py-5 bg-white text-black font-display font-black uppercase text-sm tracking-widest rounded-2xl shadow-[0_20px_50px_rgba(255,255,255,0.1)] transition-all"
                >
                  <RefreshCcw className="w-5 h-5" />
                  <span>Restart Sequence</span>
                </motion.button>
              </div>

            </motion.section>
          )}
        </AnimatePresence>
      </main>

      {/* Footer Meta */}
      <footer className="fixed bottom-0 left-0 w-full p-6 flex justify-between items-center pointer-events-none opacity-40">
        <div className="flex items-center gap-4 text-[10px] font-mono uppercase tracking-widest">
           <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Real-time Knowledge Engine active</span>
        </div>
        <div className="text-[10px] font-mono uppercase tracking-widest">
           v1.2.4 // AIS BUILD
        </div>
      </footer>
    </div>
  );
}
