
import React, { useState, useEffect, useRef } from 'react';
import SynapseLogo from './icons/SynapseLogo';
import CheckIcon from './icons/CheckIcon';
import SocialIcon from './icons/SocialIcon';
import AgentIcon from './icons/AgentIcon';
import AnalyticsIcon from './icons/AnalyticsIcon';
import ChevronDownIcon from './icons/ChevronDownIcon';
import HistoryIcon from './icons/HistoryIcon';
import StarIcon from './icons/StarIcon';
import GoalIcon from './icons/GoalIcon';
import PlanIcon from './icons/PlanIcon';
import DeployIcon from './icons/DeployIcon';
import TwitterIcon from './icons/TwitterIcon';
import LinkedInIcon from './icons/LinkedInIcon';
import EmailIcon from './icons/EmailIcon';
import AdIcon from './icons/AdIcon';
import VideoIcon from './icons/VideoIcon';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';
import UserIcon from './icons/UserIcon';
import InfoIcon from './icons/InfoIcon';
import Tooltip from './Tooltip';
import SparklesIcon from './icons/SparklesIcon';
import TrendingUpIcon from './icons/TrendingUpIcon';
import ImageIcon from './icons/ImageIcon';
import GlobeIcon from './icons/GlobeIcon';


interface LandingPageProps {
  onNavigate: (view: 'login' | 'signup' | 'terms' | 'privacy') => void;
}

const companyLogos = [
  { name: 'NEXUS', Svg: () => <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /> },
  { name: 'Momentum', Svg: () => <><circle cx="12" cy="12" r="3" /><path d="M21.17 8a10 10 0 10-9.17 13.97" /></> },
  { name: 'AURORA', Svg: () => <path d="M3 12c3-4 9-4 12 0 3 4 9 4 12 0" /> },
  { name: 'Velocity', Svg: () => <path d="M4 12h18m-9-9l9 9-9 9" /> },
  { name: 'ECLIPSE', Svg: () => <><circle cx="8" cy="12" r="6" /><circle cx="16" cy="12" r="6" /></> },
  { name: 'ZENITH', Svg: () => <path d="M3 18l7-10 4 5 7-10" /> },
];

type DemoTab = 'productLaunch' | 'webinar' | 'sale';

const demoContent = {
  productLaunch: {
    title: "Campaign Plan: Momentum App Launch",
    assets: [
      { 
        icon: TwitterIcon, 
        iconClass: "text-sky-400", 
        title: "Twitter Announcement", 
        content: <p>Say goodbye to context switching. Our new app, Momentum, brings all your tasks, notes, and calendars into one beautifully focused view. Supercharge your productivity today. #Productivity #NewApp #Momentum</p> 
      },
      { 
        icon: LinkedInIcon, 
        iconClass: "text-sky-300", 
        title: "LinkedIn Post for Professionals", 
        content: <p>In today's fast-paced world, managing multiple tools can kill productivity. That's why we built Momentum, a revolutionary app designed to streamline your workflow and help you achieve deep focus. We're excited to announce our official launch! Discover how Momentum can transform the way you work. Read our launch article for more details. [Link to blog post] #FutureOfWork #ProductivityTools #Startup</p>
      },
      {
        icon: EmailIcon,
        iconClass: "text-fuchsia-400",
        title: "Launch Day Email",
        content: (
          <div className="space-y-2">
            <p><span className="font-semibold text-slate-300">Subject:</span> It's Here! Meet Momentum, Your New Productivity Hub</p>
            <p>Hi [Name],</p>
            <p>The wait is over! We are thrilled to introduce Momentum, the app that unifies your digital workspace. Sign up today and get 50% off your first year. It's time to reclaim your focus.</p>
          </div>
        )
      }
    ]
  },
  webinar: {
    title: "Campaign Plan: AI Marketing Webinar",
    assets: [
      {
        icon: LinkedInIcon,
        iconClass: "text-sky-300",
        title: "LinkedIn Event Promotion",
        content: <p>Ready to level up your marketing strategy? Join our free webinar on 'The Future of AI in Marketing' and learn from industry experts on how to leverage AI for unprecedented growth. Limited spots available. Register now! #AI #Marketing #Webinar #DigitalStrategy</p>
      },
      {
        icon: AdIcon,
        iconClass: "text-green-400",
        title: "Facebook Ad Copy",
        content: (
          <div className="space-y-2">
            <p><span className="font-semibold text-slate-300">Headline:</span> Free AI Marketing Webinar</p>
            <p><span className="font-semibold text-slate-300">Body:</span> Unlock the power of AI. Learn actionable strategies to boost your ROI in our live webinar. Perfect for marketers, founders, and agencies. Save your seat!</p>
          </div>
        )
      },
      {
        icon: EmailIcon,
        iconClass: "text-fuchsia-400",
        title: "Reminder Email",
        content: (
          <div className="space-y-2">
            <p><span className="font-semibold text-slate-300">Subject:</span> Reminder: Your Spot for the AI Webinar is Saved!</p>
            <p>Hi [Name],</p>
            <p>Just a friendly reminder that our webinar, 'The Future of AI in Marketing', starts tomorrow at 2 PM EST. Get ready to take notes! Here's the link to join: [Webinar Link]</p>
          </div>
        )
      }
    ]
  },
  sale: {
    title: "Campaign Plan: Q3 Summer Sale",
    assets: [
       {
        icon: SocialIcon,
        iconClass: "text-blue-400",
        title: "Facebook/Instagram Post",
        content: <p>☀️ Summer Sale Alert! ☀️ Get 40% OFF all our Pro plans for a limited time. Supercharge your workflow and finish the quarter strong. Don't miss out! Sale ends Friday. #SummerSale #Discount #SaaS #Productivity</p>
      },
       {
        icon: TwitterIcon,
        iconClass: "text-sky-400",
        title: "Twitter \"Last Chance\" Post",
        content: <p>Last chance to grab 40% off! Our biggest sale of the summer ends in 24 hours. Upgrade to Pro now and lock in your discount. #Sale #LastChance #Deal</p>
      },
      {
        icon: EmailIcon,
        iconClass: "text-fuchsia-400",
        title: "Sale Announcement Email",
        content: (
           <div className="space-y-2">
              <p><span className="font-semibold text-slate-300">Subject:</span> 🎉 40% OFF - Our Summer Sale is LIVE!</p>
              <p>Hi [Name],</p>
              <p>For the next 72 hours, enjoy a massive 40% discount on all our annual plans. It's the perfect time to upgrade and unlock powerful new features. Click here to claim your discount before it's gone!</p>
           </div>
        )
      }
    ]
  },
};

const AnimatedSection: React.FC<{ children: React.ReactNode; className?: string; delay?: number }> = ({ children, className, delay = 0 }) => {
    const ref = useRef<HTMLDivElement>(null);
    const isVisible = useIntersectionObserver(ref, { threshold: 0.1 });

    return (
        <div ref={ref} className={`${className} transition-opacity duration-1000 ${isVisible ? 'opacity-100' : 'opacity-0'} flex`}>
            <div 
                className={`transition-transform duration-1000 w-full ${isVisible ? 'translate-y-0' : 'translate-y-5'}`}
                style={{ transitionDelay: `${delay}ms` }}
            >
                {children}
            </div>
        </div>
    );
};

const Header: React.FC<LandingPageProps> = ({ onNavigate }) => {
  return (
  <header className="absolute top-0 left-0 right-0 z-20 py-6 px-4 sm:px-6 lg:px-8">
    <div className="container mx-auto flex justify-between items-center">
      <div className="flex items-center space-x-3 cursor-pointer group">
        <div className="p-2 bg-slate-800/50 rounded-xl group-hover:bg-slate-800 transition-colors border border-slate-700/50 backdrop-blur-sm">
            <SynapseLogo className="w-8 h-8" />
        </div>
        <span className="text-xl font-bold text-white tracking-tight">Synapse AI</span>
      </div>
      <nav className="hidden md:flex items-center space-x-8 bg-slate-900/50 backdrop-blur-md px-8 py-3 rounded-full border border-slate-800/50">
        <a href="#features" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Features</a>
        <a href="#how-it-works" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">How It Works</a>
        <a href="#pricing" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Pricing</a>
      </nav>
      <div className="flex items-center space-x-3">
        <button onClick={() => onNavigate('login')} className="text-slate-300 hover:text-white font-semibold text-sm py-2 px-4 rounded-lg transition-colors duration-300">
            Sign In
        </button>
        <button onClick={() => onNavigate('signup')} className="bg-white hover:bg-gray-100 text-slate-900 font-bold text-sm py-2.5 px-5 rounded-full transition-all duration-300 ease-in-out hover:scale-105 shadow-[0_0_20px_rgba(255,255,255,0.3)]">
            Get Started
        </button>
      </div>
    </div>
  </header>
  );
};


const DynamicHeadline: React.FC = () => {
    const [text, setText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [loopNum, setLoopNum] = useState(0);
    const typingSpeed = 120;
    const deletingSpeed = 60;
    const delay = 1500;
    const roles = ['Marketing', 'Content Creation', 'Growth Hacking', 'Social Media'];

    useEffect(() => {
        const handleTyping = () => {
            const i = loopNum % roles.length;
            const fullText = roles[i];

            setText(
                isDeleting
                    ? fullText.substring(0, text.length - 1)
                    : fullText.substring(0, text.length + 1)
            );

            if (!isDeleting && text === fullText) {
                setTimeout(() => setIsDeleting(true), delay);
            } else if (isDeleting && text === '') {
                setIsDeleting(false);
                setLoopNum(loopNum + 1);
            }
        };

        const timer = setTimeout(handleTyping, isDeleting ? deletingSpeed : typingSpeed);

        return () => clearTimeout(timer);
    }, [text, isDeleting, loopNum, roles]);

    return (
        <span className="gradient-text">
            {text}
            <span className="animate-caret-blink">|</span>
        </span>
    );
};


const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const [activeDemo, setActiveDemo] = useState<DemoTab>('productLaunch');
  const currentDemo = demoContent[activeDemo];
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annually'>('annually');
  
  const [isDemoVisible, setIsDemoVisible] = useState(false);
  const demoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
        ([entry]) => {
            if (entry.isIntersecting) {
                setIsDemoVisible(true);
                observer.unobserve(entry.target);
            }
        },
        { threshold: 0.5 }
    );

    const currentDemoRef = demoRef.current;
    if (currentDemoRef) {
        observer.observe(currentDemoRef);
    }
    return () => {
        if (currentDemoRef) observer.unobserve(currentDemoRef);
    };
  }, []);

  return (
    <div className="bg-[#0D1117] text-white overflow-x-hidden">
      <Header onNavigate={onNavigate} />
      
      <div className="min-h-screen flex flex-col">
        <main className="hero-background flex-grow flex flex-col items-center pt-40 pb-20">
          <div className="relative z-10 container mx-auto px-4 text-center max-w-5xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/50 border border-slate-700/50 mb-8 animate-fade-in-up">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <span className="text-xs font-medium text-slate-300">New: Autonomous Marketing Agents</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 opacity-0 animate-fade-in-up leading-tight" style={{textShadow: '0 2px 20px rgba(0,0,0,0.5)', animationDelay: '0.1s'}}>
             The AI Command Center for <br className="hidden md:block" /> Modern <DynamicHeadline />
            </h1>
             <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10 opacity-0 animate-fade-in-up leading-relaxed" style={{animationDelay: '0.2s'}}>
              Stop using scattered tools. Synapse unifies strategy, creation, and analytics into one powerful autonomous workflow.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
              <button onClick={() => onNavigate('signup')} className="bg-white text-slate-900 hover:bg-gray-100 font-bold py-4 px-10 rounded-full text-lg transition-all duration-300 ease-in-out hover:scale-105 shadow-[0_0_40px_rgba(255,255,255,0.2)] w-full sm:w-auto">
                Start for Free
              </button>
              <button onClick={() => alert('Playing demo!')} className="group bg-slate-800/50 border border-slate-700 hover:bg-slate-800 text-lg font-medium py-4 px-10 rounded-full transition-all duration-300 w-full sm:w-auto flex items-center justify-center">
                  <span className="mr-2 text-slate-200 group-hover:text-white transition-colors">View Demo</span>
                  <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                    <svg className="w-3 h-3 fill-white ml-0.5" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                  </div>
              </button>
            </div>

            {/* 3D Dashboard Mockup */}
            <div className="mt-20 opacity-0 animate-fade-in-up relative perspective-container" style={{ animationDelay: '0.5s' }}>
                {/* Glowing backdrop */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-br from-[var(--gradient-start)] via-purple-500/20 to-[var(--gradient-end)] opacity-20 blur-[100px] rounded-full pointer-events-none"></div>
                
                {/* The Dashboard "Window" */}
                <div className="relative bg-[#0f172a] rounded-xl border border-slate-700/50 shadow-2xl overflow-hidden transform-gpu rotate-x-12 mx-auto max-w-5xl group hover:scale-[1.01] transition-transform duration-700 ease-out" style={{ transform: 'perspective(1000px) rotateX(5deg)' }}>
                    {/* Browser Header */}
                    <div className="h-8 bg-[#1e293b] border-b border-slate-700 flex items-center px-4 gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                        <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                        <div className="mx-auto text-[10px] text-slate-500 font-medium bg-black/20 px-3 py-0.5 rounded-md">synapse.ai/dashboard</div>
                    </div>
                    {/* Mock Content - Simplified Dashboard View */}
                    <div className="grid grid-cols-12 h-[400px] md:h-[500px] bg-[#0D1117] p-4 gap-4 text-left">
                        {/* Sidebar Mock */}
                        <div className="hidden md:flex col-span-2 flex-col gap-4 border-r border-slate-800/50 pr-4">
                            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[var(--gradient-start)] to-[var(--gradient-end)]"></div>
                            <div className="space-y-3 mt-4">
                                <div className="h-2 w-16 bg-slate-800 rounded-full"></div>
                                <div className="h-2 w-20 bg-slate-800 rounded-full"></div>
                                <div className="h-2 w-14 bg-slate-800 rounded-full"></div>
                                <div className="h-2 w-18 bg-slate-800 rounded-full"></div>
                            </div>
                        </div>
                        {/* Main Mock */}
                        <div className="col-span-12 md:col-span-10 flex flex-col gap-4">
                            {/* Header Mock */}
                            <div className="flex justify-between items-center">
                                <div className="h-6 w-48 bg-slate-800 rounded-md"></div>
                                <div className="h-8 w-24 bg-[var(--gradient-end)] rounded-md opacity-80"></div>
                            </div>
                            {/* Cards Mock */}
                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4 h-32 flex flex-col justify-between">
                                    <div className="h-8 w-8 rounded bg-slate-800"></div>
                                    <div className="h-2 w-20 bg-slate-700 rounded-full"></div>
                                </div>
                                <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4 h-32 flex flex-col justify-between">
                                    <div className="h-8 w-8 rounded bg-slate-800"></div>
                                    <div className="h-2 w-20 bg-slate-700 rounded-full"></div>
                                </div>
                                <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4 h-32 flex flex-col justify-between">
                                    <div className="h-8 w-8 rounded bg-slate-800"></div>
                                    <div className="h-2 w-20 bg-slate-700 rounded-full"></div>
                                </div>
                            </div>
                            {/* Chart Mock */}
                            <div className="flex-1 bg-slate-900/50 border border-slate-800 rounded-lg p-4 relative overflow-hidden">
                                 <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[var(--gradient-start)] to-transparent opacity-20"></div>
                                 <div className="flex items-end justify-between h-full gap-2 px-4 pb-4">
                                     {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                                         <div key={i} className="w-full bg-slate-800 rounded-t-sm hover:bg-[var(--gradient-end)] transition-colors duration-500" style={{height: `${h}%`}}></div>
                                     ))}
                                 </div>
                            </div>
                        </div>
                    </div>
                     {/* Overlay Fade */}
                     <div className="absolute inset-0 bg-gradient-to-t from-[#0D1117] via-transparent to-transparent pointer-events-none h-32 bottom-0"></div>
                </div>
            </div>

             <div className="mt-20 flex justify-center items-center gap-4 text-slate-500 opacity-0 animate-fade-in-up text-sm" style={{ animationDelay: '0.8s' }}>
                <p>Trusted by forward-thinking teams at</p>
            </div>
          </div>
        </main>

        <section className="pb-16 bg-black/0 border-b border-slate-800/50">
          <div className="container mx-auto px-4">
            <div className="w-full inline-flex flex-nowrap overflow-hidden [mask-image:_linear-gradient(to_right,transparent_0,_black_128px,_black_calc(100%-128px),transparent_100%)]">
              <ul className="flex items-center justify-center md:justify-start animate-scroll">
                {[...companyLogos, ...companyLogos].map(({ name, Svg }, index) => (
                  <li key={index} className="mx-12 flex items-center space-x-3 text-slate-600 hover:text-slate-300 transition-colors duration-300 grayscale opacity-70 hover:opacity-100">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-6 h-6 flex-shrink-0"
                    >
                      <Svg />
                    </svg>
                    <span className="text-xl font-bold tracking-widest uppercase">{name}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </div>
      
      
      <section id="features" className="py-32 bg-[#0B0E14]">
        <div className="container mx-auto px-4 max-w-6xl">
          <AnimatedSection>
            <div className="text-center mb-20">
              <span className="text-[var(--gradient-start)] font-semibold tracking-wider uppercase text-xs">Features</span>
              <h2 className="text-3xl md:text-5xl font-bold mt-3 mb-6">Everything you need to scale.</h2>
              <p className="text-slate-400 text-lg max-w-2xl mx-auto">Go beyond simple text generation. Deploy comprehensive strategies, analyze market signals, and automate execution.</p>
            </div>
          </AnimatedSection>
          <div className="grid md:grid-cols-3 gap-8">
            <AnimatedSection delay={0}>
              <div className="bg-slate-900/40 p-8 rounded-2xl border border-slate-800 transition-all duration-300 hover:border-[var(--gradient-end)]/30 hover:-translate-y-2 group h-full backdrop-blur-sm">
                  <div className="w-14 h-14 rounded-xl bg-slate-800 flex items-center justify-center mb-6 group-hover:bg-[var(--gradient-end)] transition-colors duration-300">
                    <SparklesIcon className="w-7 h-7 text-[var(--gradient-end)] group-hover:text-white transition-colors"/>
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-white">Core Creation Suite</h3>
                  <p className="text-slate-400 leading-relaxed">Access professional-grade generators for social media, blogs, emails, and ad copy. Tuned for conversion and brand consistency.</p>
              </div>
            </AnimatedSection>
            <AnimatedSection delay={150}>
              <div className="bg-gradient-to-b from-slate-800/40 to-slate-900/40 p-8 rounded-2xl border border-[var(--gradient-start)]/40 transition-all duration-300 hover:-translate-y-2 shadow-xl shadow-purple-900/5 group h-full relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-[var(--gradient-start)] text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg">PRO</div>
                  <div className="w-14 h-14 rounded-xl bg-slate-800 flex items-center justify-center mb-6 group-hover:bg-[var(--gradient-start)] transition-colors duration-300">
                    <AgentIcon className="w-7 h-7 text-[var(--gradient-start)] group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-white">Autonomous Agents</h3>
                  <p className="text-slate-400 leading-relaxed">Deploy AI employees. From "Social Media Manager" to "Growth Hacker", they plan, execute, and iterate on campaigns autonomously.</p>
              </div>
            </AnimatedSection>
             <AnimatedSection delay={300}>
               <div className="bg-slate-900/40 p-8 rounded-2xl border border-slate-800 transition-all duration-300 hover:border-[var(--gradient-end)]/30 hover:-translate-y-2 group h-full backdrop-blur-sm">
                  <div className="w-14 h-14 rounded-xl bg-slate-800 flex items-center justify-center mb-6 group-hover:bg-[var(--gradient-end)] transition-colors duration-300">
                     <TrendingUpIcon className="w-7 h-7 text-[var(--gradient-end)] group-hover:text-white transition-colors"/>
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-white">Market Intelligence</h3>
                  <p className="text-slate-400 leading-relaxed">Don't guess. Our Market Signal Analyzer scans trends and competitor angles to tell you exactly what content to create next.</p>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>
      
      
      <AnimatedSection>
      <section id="how-it-works" className="py-24 bg-[#0D1117] relative overflow-hidden">
        {/* Background Decoration */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 -left-64 w-96 h-96 bg-[var(--gradient-start)] opacity-10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-1/4 -right-64 w-96 h-96 bg-[var(--gradient-end)] opacity-10 rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
           <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Witness Your Campaign Come to Life</h2>
            <p className="text-slate-400 text-lg max-w-3xl mx-auto">Select a marketing goal below. Our AI agents will instantly generate a complete, multi-channel campaign.</p>
          </div>
          
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-wrap justify-center gap-3 mb-10">
                <button onClick={() => setActiveDemo('productLaunch')} className={`px-6 py-3 text-sm font-semibold rounded-full transition-all duration-300 border ${activeDemo === 'productLaunch' ? 'bg-white text-slate-900 border-white' : 'bg-transparent text-slate-400 border-slate-700 hover:border-slate-500 hover:text-white'}`}>Launch Product</button>
                <button onClick={() => setActiveDemo('webinar')} className={`px-6 py-3 text-sm font-semibold rounded-full transition-all duration-300 border ${activeDemo === 'webinar' ? 'bg-white text-slate-900 border-white' : 'bg-transparent text-slate-400 border-slate-700 hover:border-slate-500 hover:text-white'}`}>Promote Webinar</button>
                <button onClick={() => setActiveDemo('sale')} className={`px-6 py-3 text-sm font-semibold rounded-full transition-all duration-300 border ${activeDemo === 'sale' ? 'bg-white text-slate-900 border-white' : 'bg-transparent text-slate-400 border-slate-700 hover:border-slate-500 hover:text-white'}`}>Announce Sale</button>
            </div>
            
            <div ref={demoRef} className="relative rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden">
                <div className="grid md:grid-cols-12 min-h-[450px]">
                    {/* Sidebar for demo */}
                    <div className="hidden md:block col-span-3 bg-slate-950 border-r border-slate-800 p-6">
                        <div className="space-y-6">
                             <div className="h-2 w-24 bg-slate-800 rounded-full mb-8"></div>
                             <div className="space-y-3">
                                <div className="flex items-center gap-3 text-white font-medium"><div className="w-2 h-2 rounded-full bg-[var(--gradient-start)]"></div> Strategy</div>
                                <div className="flex items-center gap-3 text-slate-500"><div className="w-2 h-2 rounded-full bg-slate-800"></div> Assets</div>
                                <div className="flex items-center gap-3 text-slate-500"><div className="w-2 h-2 rounded-full bg-slate-800"></div> Analytics</div>
                             </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="col-span-12 md:col-span-9 p-8 bg-slate-900">
                         <div className="flex items-center gap-2 mb-8">
                            <div className={`w-2 h-2 rounded-full bg-green-500 ${isDemoVisible ? 'animate-pulse' : ''}`}></div>
                            <span className="text-xs font-mono text-green-500 uppercase tracking-widest">Live Generation</span>
                        </div>
                        
                        <h4 className="font-bold text-2xl mb-6 text-white">{currentDemo.title}</h4>
                        
                        <div key={activeDemo} className="space-y-4">
                            {currentDemo.assets.map((asset, index) => (
                                <div key={`${activeDemo}-${index}`} className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50 opacity-0 animate-fade-in-up" style={{ animationDelay: `${index * 150}ms`}}>
                                    <div className="flex items-start gap-4">
                                        <div className={`p-2 rounded-lg bg-slate-800 shrink-0`}>
                                            <asset.icon className={`w-5 h-5 ${asset.iconClass}`} />
                                        </div>
                                        <div>
                                            <h5 className="font-semibold text-white text-sm mb-1">{asset.title}</h5>
                                            <div className="text-sm text-slate-400 leading-relaxed">{asset.content}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="text-center mt-16">
               <button onClick={() => onNavigate('signup')} className="bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-end)] hover:opacity-90 text-white font-bold py-4 px-8 rounded-full transition-transform duration-300 ease-in-out hover:scale-105 shadow-[0_0_30px_rgba(var(--gradient-start-rgb),0.4)]">
                Deploy Your Own Campaign
              </button>
            </div>
          </div>
        </div>
      </section>
      </AnimatedSection>

      <AnimatedSection>
      <section id="pricing" className="py-32 bg-[#0B0E14] border-t border-slate-800/50">
        <div className="container mx-auto px-4">
            <div className="text-center mb-16">
                <h2 className="text-3xl md:text-5xl font-bold mb-6">Flexible Plans for Every Ambition</h2>
                <p className="text-slate-400 text-lg">Start for free, then scale as you grow.</p>
            </div>
            
             <div className="flex justify-center items-center gap-4 mb-12">
                <span className={`text-sm font-medium transition-colors ${billingCycle === 'monthly' ? 'text-white' : 'text-slate-400'}`}>Monthly</span>
                <button
                    onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annually' : 'monthly')}
                    aria-label={`Switch to ${billingCycle === 'monthly' ? 'annual' : 'monthly'} billing`}
                    className={`w-14 h-8 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ${billingCycle === 'annually' ? 'bg-[var(--gradient-start)]' : 'bg-slate-800 border border-slate-700'}`}
                >
                    <div
                        className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform duration-300 ${billingCycle === 'annually' ? 'translate-x-6' : ''}`}
                    />
                </button>
                <span className={`text-sm font-medium flex items-center transition-colors ${billingCycle === 'annually' ? 'text-white' : 'text-slate-400'}`}>
                    Annually
                    <span className="ml-2 text-[10px] font-bold bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full border border-green-500/20">SAVE 20%</span>
                </span>
            </div>

            <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
                {/* Freemium */}
                <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 flex flex-col hover:border-slate-700 transition-colors">
                    <h3 className="text-xl font-bold mb-2 text-white">Freemium</h3>
                    <p className="text-slate-400 mb-6 text-sm">For individuals testing the waters.</p>
                    <p className="text-4xl font-bold mb-8 text-white">$0<span className="text-lg font-medium text-slate-500">/mo</span></p>
                    <button onClick={() => onNavigate('signup')} className="w-full py-3 rounded-xl border border-slate-700 text-white font-semibold hover:bg-slate-800 transition-colors mb-8">Get Started</button>
                    <ul className="space-y-4 flex-grow">
                        <li className="flex items-center text-slate-300 text-sm"><CheckIcon className="w-5 h-5 text-slate-500 mr-3" /> 50 Credits / month</li>
                        <li className="flex items-center text-slate-300 text-sm"><CheckIcon className="w-5 h-5 text-slate-500 mr-3" /> Basic Generators</li>
                        <li className="flex items-center text-slate-300 text-sm"><CheckIcon className="w-5 h-5 text-slate-500 mr-3" /> Limited History</li>
                    </ul>
                </div>

                {/* Pro */}
                <div className="bg-slate-900 p-8 rounded-3xl border-2 border-[var(--gradient-start)] flex flex-col relative shadow-2xl shadow-purple-900/20 scale-105 z-10">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[var(--gradient-start)] text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">Most Popular</div>
                    <h3 className="text-xl font-bold mb-2 text-white">Pro</h3>
                    <p className="text-slate-400 mb-6 text-sm">For creators and small teams.</p>
                    <p className="text-4xl font-bold mb-8 text-white">{billingCycle === 'annually' ? '$39' : '$49'}<span className="text-lg font-medium text-slate-500">/mo</span></p>
                    <button onClick={() => onNavigate('signup')} className="w-full py-3 rounded-xl bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-end)] text-white font-bold hover:opacity-90 transition-opacity mb-8 shadow-lg">Start Pro Trial</button>
                    <ul className="space-y-4 flex-grow">
                        <li className="flex items-center text-white text-sm"><CheckIcon className="w-5 h-5 text-green-400 mr-3" /> <strong>2,500 Credits</strong> / month</li>
                        <li className="flex items-center text-white text-sm"><CheckIcon className="w-5 h-5 text-green-400 mr-3" /> <strong>Autonomous Agents</strong></li>
                        <li className="flex items-center text-white text-sm"><CheckIcon className="w-5 h-5 text-green-400 mr-3" /> Campaign Builder</li>
                        <li className="flex items-center text-white text-sm"><CheckIcon className="w-5 h-5 text-green-400 mr-3" /> Advanced Analytics</li>
                        <li className="flex items-center text-white text-sm"><CheckIcon className="w-5 h-5 text-green-400 mr-3" /> Market Research Tools</li>
                    </ul>
                </div>

                {/* Enterprise */}
                <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 flex flex-col hover:border-slate-700 transition-colors">
                    <h3 className="text-xl font-bold mb-2 text-white">Agency</h3>
                    <p className="text-slate-400 mb-6 text-sm">For marketing agencies & large teams.</p>
                    <p className="text-4xl font-bold mb-8 text-white">$199<span className="text-lg font-medium text-slate-500">/mo</span></p>
                    <button className="w-full py-3 rounded-xl border border-slate-700 text-white font-semibold hover:bg-slate-800 transition-colors mb-8">Contact Sales</button>
                    <ul className="space-y-4 flex-grow">
                        <li className="flex items-center text-slate-300 text-sm"><CheckIcon className="w-5 h-5 text-slate-500 mr-3" /> Unlimited Credits</li>
                        <li className="flex items-center text-slate-300 text-sm"><CheckIcon className="w-5 h-5 text-slate-500 mr-3" /> Custom Brand Voices</li>
                        <li className="flex items-center text-slate-300 text-sm"><CheckIcon className="w-5 h-5 text-slate-500 mr-3" /> API Access</li>
                        <li className="flex items-center text-slate-300 text-sm"><CheckIcon className="w-5 h-5 text-slate-500 mr-3" /> Dedicated Support</li>
                    </ul>
                </div>
            </div>
        </div>
      </section>
      </AnimatedSection>

      <footer className="bg-[#0A0C12] border-t border-slate-800 py-12 text-sm">
          <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center">
              <div className="flex items-center gap-2 mb-4 md:mb-0">
                  <SynapseLogo className="w-6 h-6" />
                  <span className="text-slate-300 font-semibold">Synapse AI</span>
              </div>
              <div className="flex gap-8 text-slate-500">
                  <button onClick={() => onNavigate('terms')} className="hover:text-white transition-colors">Terms</button>
                  <button onClick={() => onNavigate('privacy')} className="hover:text-white transition-colors">Privacy</button>
                  <a href="#" className="hover:text-white transition-colors">Twitter</a>
                  <a href="#" className="hover:text-white transition-colors">LinkedIn</a>
              </div>
              <p className="text-slate-600 mt-4 md:mt-0">© 2024 Synapse AI Inc.</p>
          </div>
      </footer>
    </div>
  );
};

export default LandingPage;
