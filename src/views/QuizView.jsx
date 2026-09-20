import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HelpCircle, 
  Award, 
  CheckCircle2, 
  XCircle, 
  ChevronRight, 
  RotateCcw, 
  ShieldCheck, 
  Sparkles, 
  AlertTriangle, 
  ArrowRight, 
  BookOpen, 
  BrainCircuit,
  Check,
  X,
  Target
} from 'lucide-react';
import { QUIZ_QUESTIONS } from '../data/quiz-questions';

export default function QuizView({ onNavigateToSection }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [answersLog, setAnswersLog] = useState([]);
  const [isCompleted, setIsCompleted] = useState(false);

  const totalQuestions = QUIZ_QUESTIONS.length;
  const currentQuestion = QUIZ_QUESTIONS[currentIndex];

  const handleSelectOption = (optionIndex) => {
    if (hasAnswered) return;

    setSelectedOption(optionIndex);
    setHasAnswered(true);

    const isCorrect = optionIndex === currentQuestion.correctIndex;
    if (isCorrect) {
      setScore((prev) => prev + 1);
    }

    setAnswersLog((prev) => [
      ...prev,
      {
        questionId: currentQuestion.id,
        question: currentQuestion.question,
        category: currentQuestion.category,
        userIndex: optionIndex,
        correctIndex: currentQuestion.correctIndex,
        isCorrect,
        explanation: currentQuestion.explanation,
        options: currentQuestion.options
      }
    ]);
  };

  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setHasAnswered(false);
    } else {
      setIsCompleted(true);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setHasAnswered(false);
    setScore(0);
    setAnswersLog([]);
    setIsCompleted(false);
  };

  const getTier = (finalScore, total) => {
    const pct = (finalScore / total) * 100;
    if (pct >= 90) {
      return {
        title: 'Cyber Shield Guardian',
        badge: 'bg-emerald-500/20 text-emerald-accent border-emerald-500/40',
        desc: 'Outstanding security awareness! You can spot phishing, deceptive URLs, and identity spoofing with expert precision.',
        icon: Award,
        color: 'text-emerald-accent'
      };
    }
    if (pct >= 70) {
      return {
        title: 'Security Defender',
        badge: 'bg-emerald-dim text-emerald-accent border-border-glow',
        desc: 'Great job! You have strong security hygiene and can identify the majority of social engineering traps.',
        icon: ShieldCheck,
        color: 'text-emerald-accent'
      };
    }
    if (pct >= 50) {
      return {
        title: 'Security Apprentice',
        badge: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
        desc: 'Good baseline awareness, but some sneaky deceptive tactics (like lookalike subdomains or fake invoices) caught you.',
        icon: AlertTriangle,
        color: 'text-amber-400'
      };
    }
    return {
      title: 'Cyber Novice',
      badge: 'bg-red-500/20 text-red-400 border-red-500/40',
      desc: 'High vulnerability to phishing and credential harvesting attacks. We recommend exploring the Security Learn tools.',
      icon: Target,
      color: 'text-red-400'
    };
  };

  const tier = getTier(score, totalQuestions);
  const progressPct = ((currentIndex + 1) / totalQuestions) * 100;

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
      {/* View Header */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-dim border border-border-glow text-xs text-emerald-accent font-medium">
            <BrainCircuit className="w-3.5 h-3.5" />
            <span>Interactive Cyber Defense Lab</span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-card border border-border-subtle text-xs text-subtext-muted">
            <HelpCircle className="w-3 h-3 text-emerald-accent" />
            <span>10 Security Awareness Challenges</span>
          </div>
        </div>
        <h1 className="text-3xl font-extrabold text-subtext-primary tracking-tight">CyberAware Quiz</h1>
        <p className="text-sm text-subtext-secondary">
          Test your instincts on phishing emails, deceptive URLs, passwords, and modern social engineering scams.
        </p>
      </div>

      {!isCompleted ? (
        /* Quiz Active Container */
        <div className="frosted-glass-card p-6 sm:p-8 rounded-3xl space-y-6 border border-border-subtle shadow-glass-smooth">
          {/* Progress Header */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="px-2.5 py-1 rounded-lg bg-surface-hover border border-border-subtle text-emerald-accent font-semibold font-mono">
                {currentQuestion.category}
              </span>
              <span className="text-subtext-muted font-mono font-medium">
                Question <span className="text-subtext-primary font-bold">{currentIndex + 1}</span> of {totalQuestions}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2 bg-obsidian-subtle rounded-full overflow-hidden p-0.5 border border-border-subtle">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className="h-full rounded-full bg-emerald-accent"
              />
            </div>
          </div>

          {/* Question Card */}
          <div className="space-y-6 pt-2">
            <h2 className="text-lg sm:text-xl font-bold text-subtext-primary leading-snug">
              {currentQuestion.question}
            </h2>

            {/* Options List */}
            <div className="space-y-3">
              {currentQuestion.options.map((option, idx) => {
                const isSelected = selectedOption === idx;
                const isCorrect = idx === currentQuestion.correctIndex;
                const optionLetter = String.fromCharCode(65 + idx);

                let optionStyle = 'bg-obsidian-subtle border-border-subtle text-subtext-primary hover:border-emerald-accent/40 hover:bg-surface-hover';
                let iconBadge = null;

                if (hasAnswered) {
                  if (isSelected) {
                    if (isCorrect) {
                      optionStyle = 'bg-emerald-500/15 border-emerald-500/60 text-emerald-accent shadow-emerald-soft';
                      iconBadge = <CheckCircle2 className="w-5 h-5 text-emerald-accent shrink-0" />;
                    } else {
                      optionStyle = 'bg-red-500/15 border-red-500/60 text-red-400';
                      iconBadge = <XCircle className="w-5 h-5 text-red-400 shrink-0" />;
                    }
                  } else if (isCorrect) {
                    optionStyle = 'bg-emerald-500/10 border-emerald-500/40 text-emerald-accent';
                    iconBadge = (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-[10px] font-bold text-emerald-accent font-mono">
                        Correct Answer
                      </span>
                    );
                  } else {
                    optionStyle = 'bg-obsidian-subtle/50 border-border-subtle/50 text-subtext-muted opacity-60';
                  }
                }

                return (
                  <motion.button
                    key={idx}
                    type="button"
                    disabled={hasAnswered}
                    onClick={() => handleSelectOption(idx)}
                    whileHover={!hasAnswered ? { y: -2 } : {}}
                    whileTap={!hasAnswered ? { scale: 0.99 } : {}}
                    className={`w-full p-4 rounded-2xl border flex items-center justify-between gap-3 text-left text-sm font-medium transition-all ${optionStyle} ${
                      !hasAnswered ? 'cursor-pointer' : 'cursor-default'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 font-mono ${
                        isSelected && isCorrect
                          ? 'bg-emerald-500 text-slate-950'
                          : isSelected && !isCorrect
                          ? 'bg-red-500 text-white'
                          : 'bg-surface-card border border-border-subtle text-subtext-secondary'
                      }`}>
                        {optionLetter}
                      </span>
                      <span className="leading-relaxed">{option}</span>
                    </div>

                    {iconBadge}
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Explanation Box when Answered */}
          <AnimatePresence>
            {hasAnswered && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                className={`p-4 rounded-2xl border space-y-1.5 text-xs ${
                  selectedOption === currentQuestion.correctIndex
                    ? 'bg-emerald-500/10 border-emerald-500/30'
                    : 'bg-amber-500/10 border-amber-500/30'
                }`}
              >
                <div className="flex items-center gap-2 font-bold">
                  {selectedOption === currentQuestion.correctIndex ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-accent" />
                      <span className="text-emerald-accent">Correct!</span>
                    </>
                  ) : (
                    <>
                      <X className="w-4 h-4 text-amber-400" />
                      <span className="text-amber-400">Incorrect</span>
                    </>
                  )}
                </div>
                <p className="text-subtext-secondary leading-relaxed pl-6">
                  {currentQuestion.explanation}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bottom Controls */}
          {hasAnswered && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-end pt-2 border-t border-border-subtle"
            >
              <button
                onClick={handleNext}
                className="px-6 py-3 rounded-2xl bg-emerald-accent text-slate-950 font-bold text-sm flex items-center gap-2 shadow-emerald-pill hover:bg-emerald-hover transition-all cursor-pointer"
              >
                <span>{currentIndex < totalQuestions - 1 ? 'Next Question' : 'View Final Score'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </div>
      ) : (
        /* Final Results Screen */
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="frosted-glass-card p-6 sm:p-10 rounded-3xl space-y-8 border border-border-subtle shadow-glass-smooth"
        >
          {/* Score Header */}
          <div className="text-center space-y-4">
            <div className="inline-flex p-4 rounded-3xl bg-surface-card border border-border-glow shadow-emerald-soft">
              <tier.icon className={`w-12 h-12 ${tier.color}`} />
            </div>

            <div className="space-y-1">
              <span className={`inline-block px-3.5 py-1 rounded-full text-xs font-bold border ${tier.badge}`}>
                {tier.title}
              </span>
              <h2 className="text-4xl sm:text-5xl font-extrabold text-subtext-primary tracking-tight font-mono">
                {score} <span className="text-xl font-sans text-subtext-muted font-normal">/ {totalQuestions} Correct</span>
              </h2>
              <p className="text-sm text-subtext-secondary max-w-md mx-auto leading-relaxed pt-1">
                {tier.desc}
              </p>
            </div>
          </div>

          {/* Question Review Grid */}
          <div className="space-y-3 pt-4 border-t border-border-subtle">
            <p className="text-xs font-semibold text-subtext-secondary uppercase tracking-wider">
              Question Summary Review ({score}/{totalQuestions} Passed)
            </p>

            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {answersLog.map((item, idx) => (
                <div
                  key={idx}
                  className={`p-3.5 rounded-2xl border text-xs flex items-start gap-3 ${
                    item.isCorrect
                      ? 'bg-emerald-500/10 border-emerald-500/30'
                      : 'bg-red-500/10 border-red-500/30'
                  }`}
                >
                  <div className="shrink-0 mt-0.5">
                    {item.isCorrect ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-accent" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-400" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="font-semibold text-subtext-primary">{item.question}</p>
                    <p className="text-subtext-muted leading-relaxed">
                      <span className="font-medium text-subtext-secondary">Answer: </span>
                      {item.options[item.correctIndex]}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-border-subtle">
            <button
              onClick={handleRestart}
              className="px-5 py-3 rounded-2xl bg-surface-card hover:bg-surface-hover border border-border-subtle text-subtext-primary text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 text-emerald-accent" />
              <span>Retake Quiz</span>
            </button>

            {onNavigateToSection && (
              <button
                onClick={() => onNavigateToSection('email')}
                className="px-6 py-3 rounded-2xl bg-emerald-accent text-slate-950 text-sm font-bold flex items-center gap-2 shadow-emerald-pill hover:bg-emerald-hover transition-all cursor-pointer"
              >
                <span>Explore Email Analyzer</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
