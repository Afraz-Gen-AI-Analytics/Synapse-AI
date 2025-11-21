
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
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
  <header 
    className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${
      isScrolled 
        ? 'py-3 bg-[#0D1117]/80 backdrop-blur-xl border-slate-800/60 shadow-lg shadow-black/20' 
        : 'py-5 bg-transparent border-transparent'
    } px-4 sm:px-6 lg:px-8`}
  >
    <div className="container mx-auto flex justify-between items-center">
      <div className="flex items-center space-x-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
        <SynapseLogo className="w-8 h-8 sm:w-9 sm:h-9" />
        <span className="text-xl sm:text-2xl font-bold text-white">Synapse AI</span>
      </div>
      <nav className="hidden md:flex items-center space-x-8">
        <a href="#features" className="text-slate-300 hover:text-white transition-colors font-medium text-sm">Features</a>
        <a href="#how-it-works" className="text-slate-300 hover:text-white transition-colors font-medium text-sm">How It Works</a>
        <a href="#pricing" className="text-slate-300 hover:text-white transition-colors font-medium text-sm">Pricing</a>
        <a href="#faq" className="text-slate-300 hover:text-white transition-colors font-medium text-sm">FAQ</a>
      </nav>
      <div className="flex items-center space-x-3">
        <button onClick={() => onNavigate('login')} className="text-slate-300 hover:text-white font-semibold py-2 px-3 sm:px-4 text-sm sm:text-base rounded-lg transition-colors duration-300">
            Sign In
        </button>
        <button onClick={() => onNavigate('signup')} className="bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-end)] hover:opacity-90 text-white font-semibold py-2 px-4 sm:px-5 text-sm sm:text-base rounded-lg transition-all duration-300 ease-in-out hover:scale-105 shadow-lg shadow-[color:var(--gradient-start)]/20">
            Get Started
        </button>
      </div>
    </div>
  </header>
  );
};

const FaqItem: React.FC<{ question: string; children: React.ReactNode }> = ({ question, children }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="border-b border-slate-700/50 py-4">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center text-left">
                <h3 className="font-semibold text-base sm:text-lg pr-4">{question}</h3>
                <ChevronDownIcon className={`w-6 h-6 transition-transform text-slate-400 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-96 mt-2' : 'max-h-0'}`}>
                <div className="pt-2 text-slate-400 text-sm sm:text-base">{children}</div>
            </div>
        </div>
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
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-end)] brightness-125 pb-1">
            {text}
            <span className="animate-caret-blink text-transparent ml-1">|</span>
        </span>
    );
};


const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const [activeDemo, setActiveDemo] = useState<DemoTab>('productLaunch');
  const currentDemo = demoContent[activeDemo];
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annually'>('annually');
  const [brandInput, setBrandInput] = useState('');
  
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

  const handleQuickStart = (e: React.FormEvent) => {
      e.preventDefault();
      if (brandInput.trim()) {
          sessionStorage.setItem('synapse_onboarding_input', brandInput);
          onNavigate('signup');
      } else {
          onNavigate('signup');
      }
  };

  return (
    <div className="bg-[#0D1117] text-white overflow-x-hidden">
      <Header onNavigate={onNavigate} />
      
      <div className="min-h-screen flex flex-col">
        <main className="hero-background flex-grow flex items-center justify-center pt-32 pb-16 md:pt-40 md:pb-20">
          <div className="relative z-10 container mx-auto px-4 text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-4 opacity-0 animate-fade-in-up" style={{textShadow: '0 2px 10px rgba(0,0,0,0.5)', animationDelay: '0.2s'}}>
             The AI Command Center for Modern <br className="hidden md:block" /> <DynamicHeadline />
            </h1>
             <p className="text-base sm:text-lg md:text-xl text-slate-400 max-w-3xl mx-auto mb-8 opacity-0 animate-fade-in-up px-2" style={{textShadow: '0 2px 8px rgba(0,0,0,0.5)', animationDelay: '0.4s'}}>
              Automate your entire marketing workflow in minutes. From strategy to execution, let your AI co-pilot do the heavy lifting.
            </p>
            
            {/* New Reverse Onboarding Input */}
            <div className="max-w-2xl mx-auto opacity-0 animate-fade-in-up px-2" style={{ animationDelay: '0.6s' }}>
                <form onSubmit={handleQuickStart} className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-end)] rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-200"></div>
                    <div className="relative flex flex-col sm:flex-row items-stretch sm:items-center bg-slate-900 rounded-lg p-1.5 border border-slate-700 focus-within:border-[var(--gradient-start)] transition-colors shadow-2xl">
                        <input 
                            type="text" 
                            placeholder="Enter your website URL or what you sell..." 
                            className="w-full bg-transparent text-white placeholder-slate-400 px-4 py-3 outline-none text-base md:text-lg"
                            value={brandInput}
                            onChange={(e) => setBrandInput(e.target.value)}
                        />
                        <button 
                            type="submit"
                            className="mt-2 sm:mt-0 bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-end)] hover:opacity-90 text-white font-bold py-3 px-6 rounded-md text-sm md:text-base transition-transform duration-200 hover:scale-[1.02] shadow-lg whitespace-nowrap flex-shrink-0"
                        >
                            Generate Strategy
                        </button>
                    </div>
                </form>
                <p className="text-xs text-slate-500 mt-3">
                    Instant Analysis • No Credit Card Required • Free 50 Credits
                </p>
            </div>

             <div className="mt-12 flex justify-center items-center gap-4 text-slate-400 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.8s' }}>
                <div className="flex -space-x-2">
                    <img className="w-8 h-8 rounded-full border-2 border-slate-900 object-cover" src="https://randomuser.me/api/portraits/women/68.jpg" alt="User 1" />
                    <img className="w-8 h-8 rounded-full border-2 border-slate-900 object-cover" src="https://randomuser.me/api/portraits/men/75.jpg" alt="User 2" />
                    <img className="w-8 h-8 rounded-full border-2 border-slate-900 object-cover" src="https://randomuser.me/api/portraits/women/44.jpg" alt="User 3" />
                </div>
                <p className="text-sm">Join <span className="font-bold text-white">10,000+</span> happy marketers</p>
            </div>
          </div>
        </main>

        <section className="py-16 bg-black/10 border-y border-slate-800/30">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-xs sm:text-sm font-semibold tracking-widest text-slate-400 uppercase mb-8">TRUSTED BY MARKETERS AT</h2>
            <div className="w-full inline-flex flex-nowrap overflow-hidden [mask-image:_linear-gradient(to_right,transparent_0,_black_64px,_black_calc(100%-64px),transparent_100%)] md:[mask-image:_linear-gradient(to_right,transparent_0,_black_128px,_black_calc(100%-128px),transparent_100%)]">
              <ul className="flex items-center justify-center md:justify-start animate-scroll">
                {[...companyLogos, ...companyLogos].map(({ name, Svg }, index) => (
                  <li key={index} className="mx-6 md:mx-10 flex items-center space-x-2 md:space-x-4 text-slate-500 hover:text-slate-200 transition-colors duration-300">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-6 h-6 md:w-8 md:h-8 flex-shrink-0"
                    >
                      <Svg />
                    </svg>
                    <span className="text-lg md:text-2xl font-bold tracking-wider uppercase">{name}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </div>
      
      
      <section id="features" className="py-16 md:py-20 bg-black/20">
        <div className="container mx-auto px-4 max-w-6xl">
          <AnimatedSection>
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold">A Command Center for Your Growth Strategy</h2>
              <p className="text-slate-400 mt-2 max-w-2xl mx-auto">Go beyond generation. Deploy, analyze, and dominate with our suite of tools.</p>
            </div>
          </AnimatedSection>
          <div className="grid md:grid-cols-3 gap-8">
            <AnimatedSection delay={0}>
              <div className="bg-slate-900 p-6 md:p-8 rounded-xl border border-slate-800 transition-all duration-300 hover:border-[var(--gradient-end)]/50 hover:-translate-y-2 group hover:shadow-lg hover:shadow-[color:var(--gradient-end)]/20 h-full">
                  <SparklesIcon className="w-10 h-10 md:w-12 md:h-12 text-[var(--gradient-end)] mb-4 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6"/>
                  <h3 className="text-lg md:text-xl font-bold mb-2">Core Content Tools</h3>
                  <p className="text-slate-400 text-sm md:text-base">Access a rich suite of content generators for social media, blogs, emails, and ad copy to kickstart your creative workflow.</p>
              </div>
            </AnimatedSection>
            <AnimatedSection delay={150}>
              <div className="bg-slate-900 p-6 md:p-8 rounded-xl border-2 border-[var(--gradient-start)]/80 transition-all duration-300 hover:-translate-y-2 shadow-2xl shadow-fuchsia-900/20 group hover:shadow-lg hover:shadow-[color:var(--gradient-start)]/30 h-full">
                  <AgentIcon className="w-10 h-10 md:w-12 md:h-12 text-[var(--gradient-start)] mb-4 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6" />
                  <h3 className="text-lg md:text-xl font-bold mb-2">Autonomous Pro Suite</h3>
                  <p className="text-slate-400 text-sm md:text-base">Unlock our flagship Pro Suite to research, plan, and execute with our Resonance Engine, Market Signal Analyzer, Campaign Builder, Autonomous Agents, and more.</p>
              </div>
            </AnimatedSection>
             <AnimatedSection delay={300}>
               <div className="bg-slate-900 p-6 md:p-8 rounded-xl border border-slate-800 transition-all duration-300 hover:border-[var(--gradient-end)]/50 hover:-translate-y-2 group hover:shadow-lg hover:shadow-[color:var(--gradient-end)]/20 h-full">
                  <TrendingUpIcon className="w-10 h-10 md:w-12 md:h-12 text-[var(--gradient-end)] mb-4 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6"/>
                  <h3 className="text-lg md:text-xl font-bold mb-2">Analytics & Live Guidance</h3>
                  <p className="text-slate-400 text-sm md:text-base">Measure campaign performance with actionable analytics and get real-time strategic advice from your AI co-pilot via voice.</p>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>
      
      
      <AnimatedSection>
      <section id="how-it-works" className="py-16 md:py-20 bg-[#0D1117]">
        <div className="container mx-auto px-4">
           <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold">Witness Your Campaign Come to Life</h2>
            <p className="text-slate-400 mt-3 max-w-3xl mx-auto">Select a marketing goal below. Our AI agents will instantly generate a complete, multi-channel campaign, showcasing the strategic content you'll create in seconds.</p>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-nowrap justify-center gap-1 sm:gap-2 md:gap-4 mb-8 w-full px-2 sm:px-0">
                <button 
                    onClick={() => setActiveDemo('productLaunch')} 
                    className={`flex-1 md:flex-none px-2 py-2 md:px-4 text-[10px] sm:text-xs md:text-base font-semibold rounded-lg transition-all duration-300 whitespace-nowrap ${activeDemo === 'productLaunch' ? 'bg-white/10 text-white shadow-inner shadow-white/5' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}`}
                >
                    Launch New Product
                </button>
                <button 
                    onClick={() => setActiveDemo('webinar')} 
                    className={`flex-1 md:flex-none px-2 py-2 md:px-4 text-[10px] sm:text-xs md:text-base font-semibold rounded-lg transition-all duration-300 whitespace-nowrap ${activeDemo === 'webinar' ? 'bg-white/10 text-white shadow-inner shadow-white/5' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}`}
                >
                    Promote Webinar
                </button>
                <button 
                    onClick={() => setActiveDemo('sale')} 
                    className={`flex-1 md:flex-none px-2 py-2 md:px-4 text-[10px] sm:text-xs md:text-base font-semibold rounded-lg transition-all duration-300 whitespace-nowrap ${activeDemo === 'sale' ? 'bg-white/10 text-white shadow-inner shadow-white/5' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}`}
                >
                    Announce Sale
                </button>
            </div>
            
            <div ref={demoRef} className="p-px bg-gradient-to-br from-white/20 to-transparent rounded-xl shadow-2xl shadow-black/30">
                <div className="bg-slate-900 rounded-[11px] overflow-hidden">
                    <div className="p-3 bg-slate-800/50 border-b border-slate-700/50 flex items-center">
                        <div className="flex gap-2">
                            <div className={`w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-red-500 ${isDemoVisible ? 'animate-dot-pulse' : 'opacity-30'}`} style={{ animationDelay: '0s' }}></div>
                            <div className={`w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-yellow-500 ${isDemoVisible ? 'animate-dot-pulse' : 'opacity-30'}`} style={{ animationDelay: '0.2s' }}></div>
                            <div className={`w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-green-500 ${isDemoVisible ? 'animate-dot-pulse' : 'opacity-30'}`} style={{ animationDelay: '0.4s' }}></div>
                        </div>
                        <p className="text-xs md:text-sm text-slate-400 mx-auto font-mono">Generated_Campaign_Assets.md</p>
                    </div>
                    <div className="p-4 md:p-8 h-80 md:h-96 overflow-y-auto demo-scrollbar relative">
                      <h4 className="font-bold text-lg md:text-xl mb-6 text-white gradient-text">{currentDemo.title}</h4>
                      <div key={activeDemo} className="space-y-8">
                        {currentDemo.assets.map((asset, index) => (
                          <div key={`${activeDemo}-${index}`} className="border-b border-slate-800 pb-8 last:border-b-0 last:pb-0 opacity-0 animate-fade-in-up" style={{ animationDelay: `${index * 150}ms`}}>
                            <div className="flex items-center mb-3">
                              <asset.icon className={`w-5 h-5 mr-3 flex-shrink-0 ${asset.iconClass}`} />
                              <h5 className="font-semibold text-slate-200 text-sm md:text-base">{asset.title}</h5>
                            </div>
                            <div className="text-xs md:text-sm text-slate-400 pl-8">{asset.content}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                </div>
            </div>
            
            <div className="text-center mt-12">
               <button onClick={() => onNavigate('signup')} className="bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-end)] hover:opacity-90 text-white font-semibold py-3 px-6 rounded-lg transition-transform duration-300 ease-in-out hover:scale-105 shadow-lg shadow-[color:var(--gradient-start)]/30">
                Deploy Your Own Campaign
              </button>
            </div>
          </div>
        </div>
      </section>
      </AnimatedSection>

      <AnimatedSection>
      <section id="pricing" className="py-16 md:py-20 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[var(--gradient-start)]/5 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="container mx-auto px-4 relative z-10">
            <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold">Flexible Plans for Every Ambition</h2>
                <p className="text-slate-400 mt-2">Start for free, then scale as you grow. The more you create, the more value you get.</p>
            </div>
             <div className="flex justify-center items-center gap-4 mb-12">
                <span className={`font-medium transition-colors ${billingCycle === 'monthly' ? 'text-white' : 'text-slate-400'}`}>Monthly</span>
                <button
                    onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annually' : 'monthly')}
                    aria-label={`Switch to ${billingCycle === 'monthly' ? 'annual' : 'monthly'} billing`}
                    className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ${billingCycle === 'annually' ? 'bg-[var(--gradient-start)]' : 'bg-slate-700'}`}
                >
                    <div
                        className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${billingCycle === 'annually' ? 'translate-x-6' : ''}`}
                    />
                </button>
                <span className={`font-medium flex items-center transition-colors ${billingCycle === 'annually' ? 'text-white' : 'text-slate-400'}`}>
                    Annually
                    <span className="ml-2 text-xs font-bold bg-green-500/20 text-green-300 px-2 py-0.5 rounded-full">SAVE 20%</span>
                </span>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                {/* Freemium Card */}
                <div className="flex flex-col p-6 md:p-8 rounded-3xl bg-slate-900/40 border border-slate-800 backdrop-blur-sm transition-transform duration-300 hover:-translate-y-1 h-full">
                    <div className="mb-6">
                        <h3 className="text-lg font-medium text-slate-300 mb-2">Freemium</h3>
                        <div className="flex items-baseline gap-1 mb-4">
                            <span className="text-4xl font-bold text-white">$0</span>
                            <span className="text-slate-500">/mo</span>
                        </div>
                        <p className="text-sm text-slate-400 leading-relaxed">
                            For individuals and teams testing the waters of AI-powered creation.
                        </p>
                    </div>
                    <ul className="space-y-4 mb-8 flex-grow">
                        <li className="flex items-center text-sm text-slate-300"><CheckIcon className="w-5 h-5 text-slate-500 mr-3 flex-shrink-0" /> 50 Credits / month</li>
                        <li className="flex items-center text-sm text-slate-300"><CheckIcon className="w-5 h-5 text-slate-500 mr-3 flex-shrink-0" /> Basic Generators (Social, Email)</li>
                        <li className="flex items-center text-sm text-slate-300"><CheckIcon className="w-5 h-5 text-slate-500 mr-3 flex-shrink-0" /> Generation History</li>
                        <li className="flex items-center text-sm text-slate-600 line-through"><span className="w-5 h-5 mr-3 inline-block"></span> Autonomous Agents</li>
                        <li className="flex items-center text-sm text-slate-600 line-through"><span className="w-5 h-5 mr-3 inline-block"></span> Video & Analysis Tools</li>
                    </ul>
                    <button onClick={() => onNavigate('signup')} className="w-full py-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold transition-colors">Get Started</button>
                </div>

                {/* Pro Card */}
                <div className="flex flex-col p-6 md:p-8 rounded-3xl bg-slate-900/90 border-2 border-[var(--gradient-start)] shadow-2xl shadow-[var(--gradient-start)]/10 relative z-10 lg:-mt-4 lg:mb-4 transform lg:scale-105 transition-transform duration-300 hover:scale-[1.06] h-full">
                    <div className="absolute top-0 right-0 bg-gradient-to-bl from-[var(--gradient-end)] to-[var(--gradient-start)] text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl rounded-tr-2xl uppercase tracking-wide">
                        Most Popular
                    </div>
                    <div className="mb-6">
                        <h3 className="text-lg font-bold gradient-text mb-2">Pro</h3>
                        <div className="flex items-baseline gap-1 mb-1">
                            <span className="text-5xl font-bold text-white">
                                {billingCycle === 'monthly' ? '$49' : '$39'}
                            </span>
                            <span className="text-slate-400">/mo</span>
                        </div>
                        {billingCycle === 'annually' && <p className="text-xs text-slate-500 mb-3">Billed as $468 per year</p>}
                        <p className="text-sm text-slate-400 leading-relaxed">
                            For professionals and teams executing campaigns with autonomous agents and analytics.
                        </p>
                    </div>
                    <ul className="space-y-4 mb-8 flex-grow">
                        <li className="flex items-center text-sm text-white font-medium"><CheckIcon className="w-5 h-5 text-[var(--gradient-start)] mr-3 flex-shrink-0" /> 2,500 Credits / month</li>
                        <li className="flex items-center text-sm text-white font-medium"><CheckIcon className="w-5 h-5 text-[var(--gradient-start)] mr-3 flex-shrink-0" /> Autonomous AI Agents</li>
                        <li className="flex items-center text-sm text-white font-medium"><CheckIcon className="w-5 h-5 text-[var(--gradient-start)] mr-3 flex-shrink-0" /> Performance Analytics</li>
                         <li className="flex items-center text-sm text-white font-medium"><CheckIcon className="w-5 h-5 text-[var(--gradient-start)] mr-3 flex-shrink-0" /> Unlock Video Ads & Strategy Tools</li>
                    </ul>
                    <button onClick={() => onNavigate('signup')} className="w-full py-4 rounded-xl bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-end)] hover:opacity-90 text-white font-bold shadow-lg shadow-[var(--gradient-start)]/20 transition-all transform hover:scale-[1.02]">Go Pro</button>
                </div>

                {/* Enterprise Card */}
                <div className="flex flex-col p-6 md:p-8 rounded-3xl bg-slate-900/40 border border-slate-800 backdrop-blur-sm transition-transform duration-300 hover:-translate-y-1 h-full">
                    <div className="mb-6">
                        <h3 className="text-lg font-medium text-slate-300 mb-2">Enterprise</h3>
                        <div className="flex items-baseline gap-1 mb-4">
                            <span className="text-4xl font-bold text-white">Custom</span>
                        </div>
                        <p className="text-sm text-slate-400 leading-relaxed">
                            For organizations requiring bespoke solutions, integrations, and unparalleled support.
                        </p>
                    </div>
                    <ul className="space-y-4 mb-8 flex-grow">
                        <li className="flex items-center text-sm text-slate-300"><CheckIcon className="w-5 h-5 text-slate-500 mr-3 flex-shrink-0" /> Everything in Pro</li>
                        <li className="flex items-center text-sm text-slate-300"><CheckIcon className="w-5 h-5 text-slate-500 mr-3 flex-shrink-0" /> Custom integrations & SSO</li>
                        <li className="flex items-center text-sm text-slate-300"><CheckIcon className="w-5 h-5 text-slate-500 mr-3 flex-shrink-0" /> Dedicated account manager</li>
                        <li className="flex items-center text-sm text-slate-300"><CheckIcon className="w-5 h-5 text-slate-500 mr-3 flex-shrink-0" /> Team collaboration tools</li>
                    </ul>
                    <button onClick={() => alert('Contacting sales!')} className="w-full py-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold transition-colors">Contact Sales</button>
                </div>
            </div>
            <div className="text-center mt-8">
                <p className="text-sm text-slate-500 flex items-center justify-center gap-2">
                    <span className="bg-green-500/20 text-green-400 p-1 rounded-full"><CheckIcon className="w-3 h-3"/></span>
                    30-Day Money-Back Guarantee on all paid plans.
                </p>
            </div>

        </div>
      </section>
      </AnimatedSection>
      
      <section className="py-16 md:py-20 bg-black/10">
        <div className="container mx-auto px-4 max-w-6xl">
           <AnimatedSection>
             <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold">Don't Just Take Our Word For It</h2>
              <p className="text-slate-400 mt-2">See how Synapse is transforming marketing for teams like yours.</p>
            </div>
          </AnimatedSection>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatedSection delay={0}>
              <div className="bg-slate-900 p-6 md:p-8 rounded-xl border border-slate-800 flex flex-col h-full transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-black/30">
                  <div className="flex items-center mb-4">
                      <StarIcon className="w-6 h-6 text-yellow-400" /><StarIcon className="w-6 h-6 text-yellow-400" /><StarIcon className="w-6 h-6 text-yellow-400" /><StarIcon className="w-6 h-6 text-yellow-400" /><StarIcon className="w-6 h-6 text-yellow-400" />
                  </div>
                  <p className="text-slate-300 mb-6 flex-grow">"The autonomous agent feature is a game-changer. We deployed a campaign for a new product launch and it handled everything from social copy to email drafts. Our productivity has skyrocketed."</p>
                  <div className="flex items-center gap-3">
                    <img className="w-10 h-10 rounded-full border-2 border-slate-800 object-cover" src="https://randomuser.me/api/portraits/women/68.jpg" alt="Sarah L." />
                    <div>
                        <p className="font-bold text-white text-sm">Sarah L.</p>
                        <p className="text-xs text-slate-500">Head of Growth, TechFlow</p>
                    </div>
                  </div>
              </div>
            </AnimatedSection>
            <AnimatedSection delay={150}>
               <div className="bg-slate-900 p-6 md:p-8 rounded-xl border border-slate-800 flex flex-col h-full transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-black/30">
                  <div className="flex items-center mb-4">
                      <StarIcon className="w-6 h-6 text-yellow-400" /><StarIcon className="w-6 h-6 text-yellow-400" /><StarIcon className="w-6 h-6 text-yellow-400" /><StarIcon className="w-6 h-6 text-yellow-400" /><StarIcon className="w-6 h-6 text-yellow-400" />
                  </div>
                  <p className="text-slate-300 mb-6 flex-grow">"Synapse AI has become the brain of our content strategy. The quality of the generated content is consistently high and always on-brand, thanks to the Brand Voice feature."</p>
                  <div className="flex items-center gap-3">
                    <img className="w-10 h-10 rounded-full border-2 border-slate-800 object-cover" src="https://randomuser.me/api/portraits/men/32.jpg" alt="Mike R." />
                    <div>
                        <p className="font-bold text-white text-sm">Mike R.</p>
                        <p className="text-xs text-slate-500">Content Strategist, MediaCorp</p>
                    </div>
                  </div>
              </div>
            </AnimatedSection>
            <AnimatedSection delay={300}>
               <div className="bg-slate-900 p-6 md:p-8 rounded-xl border border-slate-800 flex flex-col h-full transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-black/30">
                  <div className="flex items-center mb-4">
                      <StarIcon className="w-6 h-6 text-yellow-400" /><StarIcon className="w-6 h-6 text-yellow-400" /><StarIcon className="w-6 h-6 text-yellow-400" /><StarIcon className="w-6 h-6 text-yellow-400" /><StarIcon className="w-6 h-6 text-yellow-400" />
                  </div>
                  <p className="text-slate-300 mb-6 flex-grow">"I was skeptical about AI writers, but Synapse is different. It's a strategic tool, not just a content spinner. The analytics dashboard helps us connect our content efforts directly to ROI."</p>
                  <div className="flex items-center gap-3">
                    <img className="w-10 h-10 rounded-full border-2 border-slate-800 object-cover" src="https://randomuser.me/api/portraits/women/92.jpg" alt="Chen W." />
                    <div>
                        <p className="font-bold text-white text-sm">Chen W.</p>
                        <p className="text-xs text-slate-500">Digital Marketer, StartupInc</p>
                    </div>
                  </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>
      
      <AnimatedSection>
      <section id="faq" className="py-16 md:py-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-2">
            <FaqItem question="What makes Synapse different from other AI writers?">
                <p>
                    While most AI writers focus only on generating text, Synapse AI is a complete marketing command center designed to deliver measurable results. We go beyond simple content creation by providing a suite of powerful strategic tools. 
                </p>
                 <p className="mt-4">
                    With our <strong className="font-semibold text-slate-200">Campaign Builder</strong>, you can plan an entire multi-channel strategy from a single goal. The <strong className="font-semibold text-slate-200">Resonance Engine</strong> predicts how your audience will react to copy *before* you publish it, and our <strong className="font-semibold text-slate-200">Market Signal Analyzer</strong> uncovers the trending topics your customers are actively searching for. This strategic foundation empowers our <strong className="font-semibold text-slate-200">Autonomous AI Agents</strong> to execute entire campaigns for you, turning your goals into reality. We're not just a tool; we're your strategic partner for growth.
                </p>
            </FaqItem>
            <FaqItem question="Is my data secure?">
                Absolutely. We prioritize user privacy and data security. All your generated content, brand profile, and account information are encrypted and securely stored. We never sell your data.
            </FaqItem>
            <FaqItem question="Can I cancel my subscription anytime?">
                Yes, you can cancel your Pro subscription at any time. You will retain access to Pro features until the end of your current billing period. No questions asked.
            </FaqItem>
          </div>
        </div>
      </section>
      </AnimatedSection>

      <footer className="border-t border-slate-800 pt-16 pb-8 bg-[#0A0C12]">
        <div className="container mx-auto px-4">
            <div className="grid grid-cols-3 md:grid-cols-4 gap-4 md:gap-8 mb-12">
                <div className="col-span-3 md:col-span-1 mb-8 md:mb-0">
                    <div className="flex items-center space-x-2 mb-4">
                        <SynapseLogo className="w-6 h-6" />
                        <span className="text-lg font-bold text-white">Synapse AI</span>
                    </div>
                    <p className="text-sm text-slate-400">Empowering the next generation of marketers with autonomous intelligence.</p>
                </div>
                <div>
                    <h4 className="text-white font-semibold mb-4">Product</h4>
                    <ul className="space-y-2 text-sm text-slate-400">
                        <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                        <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                        <li><button onClick={() => alert("Demo request sent!")} className="hover:text-white transition-colors text-left">Request Demo</button></li>
                    </ul>
                </div>
                <div>
                    <h4 className="text-white font-semibold mb-4">Resources</h4>
                    <ul className="space-y-2 text-sm text-slate-400">
                        <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                        <li><a href="#" className="hover:text-white transition-colors">Community</a></li>
                        <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                    </ul>
                </div>
                <div>
                    <h4 className="text-white font-semibold mb-4">Company</h4>
                    <ul className="space-y-2 text-sm text-slate-400">
                        <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                        <li><button onClick={() => onNavigate('terms')} className="hover:text-white transition-colors text-left">Terms</button></li>
                        <li><button onClick={() => onNavigate('privacy')} className="hover:text-white transition-colors text-left">Privacy</button></li>
                    </ul>
                </div>
            </div>
            <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-slate-500">
                <p>&copy; {new Date().getFullYear()} Synapse AI. All rights reserved.</p>
                <div className="flex items-center gap-4 mt-4 md:mt-0">
                    <GlobeIcon className="w-4 h-4" />
                    <span>English (US)</span>
                </div>
            </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
