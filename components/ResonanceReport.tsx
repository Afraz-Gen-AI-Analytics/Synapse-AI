import React from 'react';
import { ResonanceFeedback } from '../types';
import CheckCircleIcon from './icons/CheckCircleIcon';
import TargetIcon from './icons/TargetIcon';
import SparklesIcon from './icons/SparklesIcon';
import QuestionMarkCircleIcon from './icons/QuestionMarkCircleIcon';
import LightbulbIcon from './icons/LightbulbIcon';
import { useToast } from '../contexts/ToastContext';
import CopyIcon from './icons/CopyIcon';

const ScoreGauge: React.FC<{ score: number; label: string; color: string; delay: number }> = ({ score, label, color, delay }) => {
    const radius = 50; // Radius from center to midline of stroke
    const strokeWidth = 10;
    const circumference = 2 * Math.PI * radius;
    const [offset, setOffset] = React.useState(circumference);

    React.useEffect(() => {
        // Trigger the animation after a short delay to ensure it's visible
        const timer = setTimeout(() => {
            const progress = circumference - (score / 10) * circumference;
            setOffset(progress);
        }, 100);
        return () => clearTimeout(timer);
    }, [score, circumference]);

    return (
        <div 
            className="flex-1 bg-slate-900/50 p-6 rounded-2xl border border-slate-800 flex flex-col items-center justify-center animate-fade-in-up" 
            style={{ animationDelay: `${delay}ms` }}
        >
            <div className="relative w-28 h-28"> {/* Reduced from w-36 h-36 */}
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120"> {/* Added viewBox */}
                    <circle className="text-slate-700/50" strokeWidth={strokeWidth} stroke="currentColor" fill="transparent" r={radius} cx="60" cy="60" />
                    <circle
                        strokeWidth={strokeWidth}
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="transparent"
                        r={radius}
                        cx="60"
                        cy="60"
                        style={{ color, transition: 'stroke-dashoffset 1.5s cubic-bezier(0.25, 1, 0.5, 1)' }}
                    />
                </svg>
                <div 
                    className="absolute inset-0 flex items-center justify-center transition-opacity duration-1000"
                    style={{ opacity: 1, transitionDelay: '500ms' }}
                >
                    <div className="flex items-baseline"> {/* Centering fix */}
                        <span className="text-3xl font-bold text-white">{score}</span> {/* Reduced size */}
                        <span className="text-base text-slate-400">/10</span> {/* Removed mt-1 */}
                    </div>
                </div>
            </div>
            <p className="font-semibold text-slate-200 mt-4 text-lg">{label}</p>
        </div>
    );
};

const ReportCard: React.FC<{ title: string; icon: React.FC<{ className?: string }>; iconColor?: string; children: React.ReactNode; delay: number }> = ({ title, icon: Icon, iconColor, children, delay }) => (
    <div 
        className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 w-full animate-fade-in-up" 
        style={{ animationDelay: `${delay}ms` }}
    >
        <div className="flex items-center gap-3 mb-4">
            <div className="flex-shrink-0 bg-slate-800 p-2 rounded-lg">
                <Icon className={`w-5 h-5 ${iconColor || 'text-white'}`} />
            </div>
            <h3 className="text-lg font-bold text-white">{title}</h3>
        </div>
        <div className="text-slate-300 space-y-2 prose prose-invert prose-sm max-w-none">
            {children}
        </div>
    </div>
);


const ResonanceReport: React.FC<{ feedback: ResonanceFeedback }> = ({ feedback }) => {
    return (
        <div className="w-full space-y-6 animate-fade-in-up">
            {/* Scores Section */}
            <div className="flex flex-col md:flex-row gap-6 mt-6">
                <ScoreGauge score={feedback.clarityScore} label="Clarity Score" color="var(--gradient-start)" delay={100} />
                <ScoreGauge score={feedback.persuasionScore} label="Persuasion Score" color="var(--gradient-end)" delay={200} />
            </div>
            
            {/* Feedback Details in a Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ReportCard title="First Impression" icon={CheckCircleIcon} iconColor="text-green-400" delay={300}>
                    <p className="italic">"{feedback.firstImpression}"</p>
                    <p className="text-sm text-slate-400 pt-2 border-t border-slate-700/50 mt-3">
                        <strong>Reasoning:</strong> {feedback.clarityReasoning}
                    </p>
                </ReportCard>
                
                <ReportCard title="Goal Alignment" icon={TargetIcon} iconColor="text-sky-400" delay={400}>
                    <p>{feedback.goalAlignment}</p>
                     <p className="text-sm text-slate-400 pt-2 border-t border-slate-700/50 mt-3">
                        <strong>Reasoning:</strong> {feedback.persuasionReasoning}
                    </p>
                </ReportCard>
            </div>
            
             <div className="grid grid-cols-1 gap-6">
                <ReportCard title="Emotional Resonance" icon={SparklesIcon} iconColor="text-[var(--gradient-start)]" delay={500}>
                    <p>{feedback.emotionAnalysis}</p>
                </ReportCard>

                <ReportCard title="Key Questions & Doubts" icon={QuestionMarkCircleIcon} iconColor="text-yellow-400" delay={600}>
                    <ul className="list-none space-y-3">
                        {feedback.keyQuestions.map((q, i) => (
                            <li key={i} className="flex items-start p-3 bg-slate-800/60 rounded-md">
                               <div className="flex-shrink-0 w-6 h-6 rounded-full bg-yellow-500/10 text-yellow-400 flex items-center justify-center font-bold text-xs mr-3">?</div>
                               <span>{q}</span>
                            </li>
                        ))}
                    </ul>
                </ReportCard>

                <div 
                    className="relative p-6 rounded-2xl border-2 border-[var(--gradient-start)]/80 bg-gradient-to-br from-[color:var(--gradient-start)]/10 to-transparent animate-fade-in-up" 
                    style={{ animationDelay: `700ms` }}
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div className="flex-shrink-0 bg-slate-800 p-2 rounded-lg">
                            <LightbulbIcon className="w-5 h-5 text-[var(--gradient-start)]" />
                        </div>
                        <h3 className="text-lg font-bold gradient-text">Actionable Suggestion</h3>
                    </div>
                    <p className="text-slate-200 text-base font-medium">{feedback.suggestedImprovement}</p>
                </div>
            </div>
        </div>
    );
};

export default ResonanceReport;
