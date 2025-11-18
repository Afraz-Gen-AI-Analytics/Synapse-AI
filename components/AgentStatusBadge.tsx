import React from 'react';

const statusConfig = {
    planning: {
        text: 'Planning',
        bg: 'bg-blue-500/10',
        textAndIcon: 'text-blue-400',
    },
    active: {
        text: 'Active',
        bg: 'bg-green-500/10',
        textAndIcon: 'text-green-400',
    },
    executing: {
        text: 'Executing',
        bg: 'bg-teal-500/10',
        textAndIcon: 'text-teal-400',
    },
    paused: {
        text: 'Paused',
        bg: 'bg-orange-500/10',
        textAndIcon: 'text-orange-400',
    },
    needs_review: {
        text: 'Needs Review',
        bg: 'bg-yellow-500/10',
        textAndIcon: 'text-yellow-400',
    },
    completed: {
        text: 'Completed',
        bg: 'bg-fuchsia-500/10',
        textAndIcon: 'text-fuchsia-400',
    }
}

interface AgentStatusBadgeProps {
    status: 'planning' | 'active' | 'completed' | 'needs_review' | 'executing' | 'paused';
}

const AgentStatusBadge: React.FC<AgentStatusBadgeProps> = ({ status }) => {
    const config = statusConfig[status] || statusConfig.active;
    const isProcessing = status === 'planning' || status === 'active' || status === 'executing';
    
    return (
        <div className={`flex items-center text-xs capitalize px-2.5 py-1 rounded-full font-semibold whitespace-nowrap ${config.bg} ${config.textAndIcon}`}>
            {isProcessing && <span className="relative flex h-2 w-2 mr-1.5"><span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${config.bg} opacity-75`}></span><span className={`relative inline-flex rounded-full h-2 w-2 ${config.textAndIcon.replace('text-', 'bg-')}`}></span></span>}
            <span>{config.text}</span>
        </div>
    );
};

export default AgentStatusBadge;