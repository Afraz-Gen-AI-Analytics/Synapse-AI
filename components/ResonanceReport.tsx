import React from 'react';
import { ResonanceFeedback } from '../types';
import CheckCircleIcon from './icons/CheckCircleIcon';
import TargetIcon from './icons/TargetIcon';
import SparklesIcon from './icons/SparklesIcon';
import QuestionMarkCircleIcon from './icons/QuestionMarkCircleIcon';
import LightbulbIcon from './icons/LightbulbIcon';

const ScoreDial: React.FC<{ score: number; label: string; color: string }> = ({ score, label, color }) => {
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const [offset, setOffset] = React.useState(circumference);

    React.useEffect(() => {
        const progress = circumference - (score / 10) * circumference;
        setOffset(progress);
    }, [score, circumference]);

    return (
        <div className="flex flex-col items-center">
            <div className="relative w-28 h-28">
                <svg className="w-full h-full transform -rotate-90">
                    <circle className="text-slate-700" strokeWidth="8" stroke="currentColor" fill="transparent" r={radius} cx="56" cy="56" />
                    <circle
                        strokeWidth="8"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="transparent"
                        r={radius}
                        cx="56"
                        cy="56"
                        style={{ color, transition: 'stroke-dashoffset 1s ease-out' }}
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-3xl font-bold text-white">{score}</span>
                    <span className="text-sm text-slate-400">/10</span>
                </div>
            </div>
            <p className="font-semibold text-slate-300 mt-2">{label}</p>
        </div>
    );
};

const ResonanceReport: React.FC<{ feedback: ResonanceFeedback }> = ({ feedback }) => {
    return (
        <div className="w-full space-y-6 text-sm animate-fade-in-up">
            {/* Scores Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-6 bg-slate-800/50 rounded-lg">
                <ScoreDial score={feedback.clarityScore} label="Clarity Score" color="var(--gradient-start)" />
                <ScoreDial score={feedback.persuasionScore} label="Persuasion Score" color="var(--gradient-end)" />
            </div>

            {/* Feedback Details */}
            <div className="space-y-4">
                <div className="p-4 bg-slate-800/50 rounded-lg">
                    <h4 className="font-semibold text-slate-300 mb-2 flex items-center"><CheckCircleIcon className="w-5 h-5 mr-2 text-green-400" /> First Impression</h4>
                    <p className="text-slate-400 italic">"{feedback.firstImpression}"</p>
                </div>
                <div className="p-4 bg-slate-800/50 rounded-lg">
                    <h4 className="font-semibold text-slate-300 mb-2 flex items-center"><TargetIcon className="w-5 h-5 mr-2 text-sky-400" /> Goal Alignment</h4>
                    <p className="text-slate-400">{feedback.goalAlignment}</p>
                </div>
                <div className="p-4 bg-slate-800/50 rounded-lg">
                    <h4 className="font-semibold text-slate-300 mb-2 flex items-center"><SparklesIcon className="w-5 h-5 mr-2 text-fuchsia-400" /> Emotional Resonance</h4>
                    <p className="text-slate-400">{feedback.emotionAnalysis}</p>
                </div>
                <div className="p-4 bg-slate-800/50 rounded-lg">
                    <h4 className="font-semibold text-slate-300 mb-2 flex items-center"><QuestionMarkCircleIcon className="w-5 h-5 mr-2 text-yellow-400" /> Key Questions & Doubts</h4>
                    <ul className="list-disc list-inside text-slate-400 space-y-1">
                        {feedback.keyQuestions.map((q, i) => <li key={i}>{q}</li>)}
                    </ul>
                </div>
                <div className="p-4 bg-slate-800/50 rounded-lg">
                    <h4 className="font-semibold text-slate-300 mb-2 flex items-center"><LightbulbIcon className="w-5 h-5 mr-2 text-teal-400" /> Suggested Improvement</h4>
                    <p className="text-slate-400">{feedback.suggestedImprovement}</p>
                </div>
            </div>
        </div>
    );
};

export default ResonanceReport;