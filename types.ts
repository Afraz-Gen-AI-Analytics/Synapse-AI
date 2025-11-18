import type React from 'react';

export interface User {
  uid: string; // Changed from id: number to uid: string
  email: string;
  displayName: string;
  photoURL?: string | null;
  plan: 'freemium' | 'pro';
  credits: number;
  planCreditLimit: number;
  theme?: string; // e.g., 'Twilight', 'Sunrise'
  onboardingCompleted?: boolean;
  brandProfileBonusClaimed?: boolean;
}

export enum ContentType {
  SocialMediaPost,
  BlogIdea,
  EmailCopy,
  AIAdCreativeStudio, // Replaced AdCopy
  MarketSignalAnalyzer,
  Campaign,
  AIImage,
  AIImageEditor,
  AIVideoGenerator,
  VideoScriptHook,
  ResonanceEngine,
}

export interface Template {
  id: ContentType;
  name: string;
  description: string;
  icon: React.FC<{ className?: string }>;
  prompt?: (options: { topic: string; tone: string; fields: { [key: string]: string }; numOutputs?: number }) => string;
  placeholder?: string;
  fields?: {
    name: string;
    label: string;
    options?: string[];
    defaultValue?: string;
    placeholder?: string;
  }[];
  isPro?: boolean;
  supportsVariations?: boolean;
  creditCost?: number;
}

export interface HistoryItem {
  id: string; // Changed from number
  userId: string; // Changed from number
  templateName: string;
  content: string;
  timestamp: string;
  topic: string;
  fields?: { [key: string]: string };
  originalContent?: string; // For image editor history
}

// --- Structured Content Types for Agents ---
export type GeneratedContentType = 'social' | 'email' | 'ad' | 'blog' | 'unknown';

export interface SocialPostContent {
    type: 'social';
    platform: 'Twitter' | 'LinkedIn' | 'Facebook';
    copy: string;
    hashtags: string;
    imagePrompt: string;
}

export interface EmailContent {
    type: 'email';
    subject: string;
    body: string;
    cta: string;
}

export interface AdContent {
    type: 'ad';
    headline: string;
    body: string;
}

export interface BlogContent {
    type: 'blog';
    ideas: {
        title: string;
        description: string;
    }[];
}


// Add other content types as needed...
export type GeneratedContent = SocialPostContent | EmailContent | AdContent | BlogContent;

// --- Campaign Types ---

export interface CampaignAsset {
    id: string;
    contentType: 'Social Media Post' | 'Marketing Email' | 'Ad Copy' | 'Blog Post Ideas';
    description: string;
    status: 'pending' | 'generating' | 'generated' | 'error';
    content?: GeneratedContent;
    error?: string;
    creditCost: number;
}

export interface CampaignPhase {
    name: string;
    description: string;
    assets: CampaignAsset[];
}

export interface Strategy {
    campaignTitle: string;
    phases: CampaignPhase[];
}

export interface CampaignHistoryItem {
  id: string;
  userId: string;
  goal: string;
  campaignTitle: string;
  strategy: Strategy; // Using the exported Strategy type
  timestamp: string;
}


// --- Agent Feature Types ---

export enum AgentPersona {
    SocialMediaManager = "Social Media Manager",
    ContentStrategist = "Content Strategist",
    EmailMarketer = "Email Marketer",
    GrowthHacker = "Growth Hacker",
}

export interface Agent {
    id: string; // Changed from number
    userId: string; // Changed from number
    name: string;
    persona: AgentPersona;
    goal: string;
    status: 'planning' | 'active' | 'completed' | 'paused';
    createdAt: string;
    taskStats?: {
        completed: number;
        total: number;
        needsReview: number;
    };
}




export interface AgentTask {
    id: string; // Changed from number
    agentId: string; // Changed from number
    userId: string;
    description: string;
    status: 'pending' | 'executing' | 'needs_review' | 'completed' | 'scheduled';
    generatedContent?: string; // Can be simple markdown or stringified JSON of GeneratedContent
    contentType?: 'Social Media Post' | 'Marketing Email' | 'Ad Copy' | 'Blog Post Ideas' | 'Unknown';
    scheduledAt?: string;
    postedUrl?: string;
}

export interface AgentLog {
    id: string; // Changed from number
    agentId: string; // Changed from number
    userId:string;
    message: string;
    timestamp: string;
}

// --- Resonance Engine Types ---
export interface ResonanceFeedback {
    firstImpression: string;
    clarityScore: number;
    clarityReasoning: string;
    persuasionScore: number;
    persuasionReasoning: string;
    keyQuestions: string[];
    suggestedImprovement: string;
    goalAlignment: string;
    emotionAnalysis: string;
}

// --- Market Signal Analyzer Types ---
export interface TrendingTopic {
    topic: string;
    reason: string;
    buzzScore: number;
}

export interface CompetitorAngle {
    angle: string;
    isUntapped: boolean;
}

export interface ContentRecommendation {
    format: string;
    title: string;
}

export interface MarketSignalReport {
    trendingSubTopics: TrendingTopic[];
    audienceQuestions: string[];
    competitorAngles: CompetitorAngle[];
    contentRecommendations: ContentRecommendation[];
}

// --- SEO Content Strategist Types ---
export interface SeoContentBlueprint {
    titleSuggestions: {
        title: string;
        category: string;
    }[];
    targetKeywords: {
        primaryKeyword: string;
        secondaryKeywords: string[];
    };
    hook: string;
    fullArticleOutline: {
        heading: string;
        talkingPoints: string[];
    }[];
    callToAction: string;
}

// --- AI Ad Creative Studio Types ---
export interface AdCreativeBlueprint {
    copyVariations: {
        angle: string;
        headline: string;
        body: string;
    }[];
    imagePrompt: string;
    targetingSuggestions: string[];
    ctaSuggestions: string[];
}

// --- Viral Video Idea Generator Types ---
export interface ViralVideoBlueprint {
    hookText: string;
    scriptOutline: string[];
    visualConcept: string;
    pacingAndStyle: string;
    audioSuggestion: string;
    callToAction: string;
}


// --- Brand & Analytics ---

export interface BrandProfile {
    id: string; // Changed from number
    userId: string; // Changed from number
    brandName: string;
    targetAudience: string;
    messagingPillars: string;
    toneOfVoice: string;
    productDescription: string;
    keywords: string;
    socialMediaHandles: {
        twitter: string;
        linkedin: string;
        facebook: string;
    };
    socialConnections?: {
        twitter: boolean;
        linkedin: boolean;
        facebook: boolean;
        email: boolean;
    };
}

export interface Kpi {
    label: string;
    value: string;
    change: string;
    changeType: 'increase' | 'decrease';
}

export interface ChartData {
    labels: string[];
    values: number[];
}

export interface AgentStats {
    active: number;
    needsReview: number;

    completed: number;
    total: number;
}

export interface AnalyticsData {
    kpis: Kpi[];
    performanceByType: ChartData;
    engagementOverTime: ChartData;
    agentStats: AgentStats;
    mostUsedTools: ChartData;
}

// --- Command Bar Types ---
export interface ToolRoute {
    toolId: string;
    prefill: {
        topic: string;
        platform?: string;
    };
}

// --- Toast Types ---
export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
}