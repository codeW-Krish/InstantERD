import { motion, useScroll, useTransform } from "motion/react";
import { Database, ArrowRight, Code, Layout, Zap, Layers, Cpu, Globe, Terminal, User, FileText, MessageSquare, ShoppingBag, Users, CreditCard, Box } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Button } from "../components/Button";
import { MinimalCarousel } from "../components/MinimalCarousel";
import { TextEffect } from "../components/core/text-effect";
import PricingSection, { Plan } from "../components/PricingSection";
import { Link } from "react-router-dom";
import { FeatureCarousel } from "../components/FeatureCarousel";

const TEMPLATE_CARDS = [
  {
    id: "1",
    title: "E-commerce",
    value: "Orders, Products, Users",
    color: "bg-emerald-500",
    icon: ShoppingBag,
  },
  {
    id: "2",
    title: "Social Media",
    value: "Posts, Comments, Likes",
    color: "bg-blue-500",
    icon: Users,
  },
  {
    id: "3",
    title: "SaaS Platform",
    value: "Plans, Subs, Invoices",
    color: "bg-indigo-500",
    icon: CreditCard,
  },
  {
    id: "4",
    title: "Inventory",
    value: "Stock, Warehouse, Items",
    color: "bg-orange-500",
    icon: Box,
  },
];

const PRICING_PLANS: Plan[] = [
  {
    id: "free",
    name: "Blueprint",
    description: "Perfect for students and solo architects.",
    priceMonthly: "$0",
    priceYearly: "$0",
    featuresLabel: "Included Features",
    features: [
      { text: "3 Active Projects" },
      { text: "PNG Export" },
      { text: "Standard Notation" },
      { text: "Community Support" },
    ],
  },
  {
    id: "pro",
    name: "Architect",
    description: "For professional developers and system designers.",
    priceMonthly: "$19",
    priceYearly: "$15",
    badge: "Most Popular",
    featuresLabel: "Pro Features",
    features: [
      { text: "Unlimited Projects" },
      { text: "SVG & PDF Export" },
      { text: "AI Logic Suggestions", hasInfo: true },
      { text: "Real-time Collaboration" },
    ],
  },
  {
    id: "enterprise",
    name: "Studio",
    description: "Scalable solutions for large engineering teams.",
    priceMonthly: "$49",
    priceYearly: "$39",
    featuresLabel: "Enterprise Features",
    features: [
      { text: "Team Workspaces" },
      { text: "SSO & SAML Security" },
      { text: "Priority Support" },
      { text: "Custom Notation Styles" },
    ],
  },
];

const Nav = () => (
  <nav className="fixed top-0 left-0 w-full z-50 border-b border-paper/5 bg-blueprint/80 backdrop-blur-md transition-colors duration-300">
    <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 border-2 border-emerald-accent flex items-center justify-center">
          <span className="font-serif font-bold text-emerald-accent">I</span>
        </div>
        <span className="font-serif text-xl tracking-tight font-medium">InstantERD</span>
      </div>
      <div className="hidden md:flex items-center gap-8 font-mono text-[10px] uppercase tracking-[0.2em] text-paper/50">
        <a href="#features" className="hover:text-emerald-accent transition-colors">Features</a>
        <a href="#how-it-works" className="hover:text-emerald-accent transition-colors">Process</a>
        <a href="#pricing" className="hover:text-emerald-accent transition-colors">Pricing</a>
        <Link to="/login">
          <Button variant="outline" className="py-2 px-4" hoverText="Sign In">Login</Button>
        </Link>
      </div>
    </div>
  </nav>
);

const Hero = () => {
  const [text, setText] = useState("");
  const fullText = "A user can place multiple orders. Each order contains products...";
  
  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setText(fullText.slice(0, i));
      i++;
      if (i > fullText.length) i = 0;
    }, 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative min-h-screen pt-32 pb-20 overflow-hidden grid-bg noise-bg">
      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: [0.19, 1, 0.22, 1] }}
        >
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8, ease: [0.19, 1, 0.22, 1] }}
            className="inline-flex items-center gap-2 px-3 py-1 border border-emerald-accent/30 bg-emerald-accent/5 rounded-full mb-8 relative overflow-hidden group"
          >
            <div className="w-2 h-2 rounded-full bg-emerald-accent animate-pulse relative z-10" />
            <span className="font-mono text-[10px] uppercase tracking-widest text-emerald-accent relative z-10">
              Architecting the Future
            </span>
          </motion.div>
          
          <div className="text-7xl md:text-8xl font-serif leading-[0.9] mb-8">
            <TextEffect
              per='char'
              delay={0.5}
              variants={{
                container: {
                  hidden: { opacity: 0 },
                  visible: {
                    opacity: 1,
                    transition: { staggerChildren: 0.05 },
                  },
                },
                item: {
                  hidden: { opacity: 0, rotateX: 90, y: 10 },
                  visible: {
                    opacity: 1,
                    rotateX: 0,
                    y: 0,
                    transition: { duration: 0.2 },
                  },
                },
              }}
              className="block"
            >
              Logic into
            </TextEffect>
            <TextEffect
              per='char'
              delay={1.5}
              variants={{
                container: {
                  hidden: { opacity: 0 },
                  visible: {
                    opacity: 1,
                    transition: { staggerChildren: 0.05 },
                  },
                },
                item: {
                  hidden: { opacity: 0, rotateX: 90, y: 10 },
                  visible: {
                    opacity: 1,
                    rotateX: 0,
                    y: 0,
                    transition: { duration: 0.2 },
                  },
                },
              }}
              className="block italic text-emerald-accent"
            >
              Visuals.
            </TextEffect>
            <TextEffect
              per='char'
              delay={2.5}
              preset='blur'
              className="block text-4xl md:text-5xl mt-4 opacity-80"
            >
              Instantly.
            </TextEffect>
          </div>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1 }}
            className="text-xl text-paper/60 max-w-lg mb-12 leading-relaxed"
          >
            InstantERD transforms natural language descriptions into professional Chen-notation ER diagrams. No more manual drawing, just pure logic.
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.2 }}
            className="flex flex-wrap gap-4"
          >
            <Link to="/signup">
              <Button hoverText="Create ERD Now">Start Designing — Free</Button>
            </Link>
            <Button variant="outline" hoverText="Explore Models">View Gallery</Button>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="relative group"
        >
          <div className="absolute -inset-4 bg-emerald-accent/5 blur-3xl rounded-full group-hover:bg-emerald-accent/10 transition-all duration-700" />
          <div className="relative border border-paper/10 bg-blueprint/50 backdrop-blur-xl p-8 rounded-2xl shadow-2xl">
            <div className="flex items-center justify-between mb-6 border-b border-paper/5 pb-4">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-paper/10" />
                <div className="w-3 h-3 rounded-full bg-paper/10" />
                <div className="w-3 h-3 rounded-full bg-paper/10" />
              </div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-paper/30">Natural Language Input</span>
            </div>
            <div className="font-mono text-sm min-h-[120px] text-emerald-accent/80 leading-relaxed">
              {text}
              <span className="inline-block w-2 h-4 bg-emerald-accent ml-1 animate-pulse" />
            </div>
            
            <div className="mt-8 pt-8 border-t border-paper/5">
              <div className="flex items-center justify-center gap-12 relative">
                <motion.div 
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="w-24 h-12 border border-emerald-accent flex items-center justify-center bg-emerald-accent/5"
                >
                  <span className="font-mono text-[10px]">USER</span>
                </motion.div>
                
                <div className="w-12 h-[1px] bg-paper/20 relative">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 border border-paper/20 rotate-45 bg-blueprint flex items-center justify-center">
                    <span className="font-mono text-[8px] -rotate-45">PLACES</span>
                  </div>
                </div>

                <motion.div 
                  animate={{ y: [0, 5, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                  className="w-24 h-12 border border-emerald-accent flex items-center justify-center bg-emerald-accent/5"
                >
                  <span className="font-mono text-[10px]">ORDER</span>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

const FeatureCard = ({ icon: Icon, title, desc, delay }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay }}
    className="p-8 border border-paper/5 bg-paper/[0.02] hover:bg-paper/[0.04] transition-all group"
  >
    <div className="w-12 h-12 border border-paper/10 flex items-center justify-center mb-6 group-hover:border-emerald-accent transition-colors">
      <Icon className="w-5 h-5 text-paper/40 group-hover:text-emerald-accent transition-colors" />
    </div>
    <h3 className="text-2xl font-serif mb-4">{title}</h3>
    <p className="text-paper/50 text-sm leading-relaxed">{desc}</p>
  </motion.div>
);

const Features = () => (
  <section id="features" className="py-32 border-y border-paper/5">
    <div className="max-w-7xl mx-auto px-6">
      <div className="mb-20">
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-emerald-accent mb-4 block">Capabilities</span>
        <h2 className="text-5xl font-serif">Engineered for Precision</h2>
      </div>
      <div className="grid md:grid-cols-3 gap-px bg-paper/5 border border-paper/5">
        <FeatureCard 
          icon={Zap}
          title="Instant Generation"
          desc="Describe your entities and relationships in plain English. Our engine maps them to Chen notation instantly."
          delay={0.1}
        />
        <FeatureCard 
          icon={Code}
          title="SQL Export"
          desc="Go from diagram to DDL in one click. Support for PostgreSQL, MySQL, and SQLite out of the box."
          delay={0.2}
        />
        <FeatureCard 
          icon={Layers}
          title="Chen Notation"
          desc="Strict adherence to Peter Chen's original notation. Rectangles, diamonds, and ovals—perfectly balanced."
          delay={0.3}
        />
      </div>
    </div>
  </section>
);

const Footer = () => (
  <footer className="relative py-20 border-t border-paper/5 overflow-hidden">
    <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8 relative z-10">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 border border-emerald-accent flex items-center justify-center">
          <span className="font-serif font-bold text-xs text-emerald-accent">I</span>
        </div>
        <span className="font-serif text-lg">InstantERD</span>
      </div>
      <div className="flex gap-12 font-mono text-[10px] uppercase tracking-widest text-paper/30">
        <a href="#" className="hover:text-paper transition-colors">Twitter</a>
        <a href="#" className="hover:text-paper transition-colors">GitHub</a>
        <a href="#" className="hover:text-paper transition-colors">Privacy</a>
      </div>
      <p className="font-mono text-[10px] text-paper/20">© 2026 INSTANTERD SYSTEMS INC.</p>
    </div>

    <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 w-full text-center select-none z-0">
      <motion.h1 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 0.15, y: 0 }}
        whileHover={{ 
          opacity: 1,
          backgroundPosition: ["200% center", "-200% center"],
          transition: {
            backgroundPosition: {
              duration: 2.5,
              ease: "linear",
              repeat: Infinity,
            },
            opacity: { duration: 0.3 }
          }
        }}
        transition={{ duration: 1.5 }}
        className="text-[22vw] font-serif font-bold leading-none tracking-tighter whitespace-nowrap text-paper/10 cursor-default pointer-events-auto transition-all duration-500"
        style={{ 
          WebkitTextStroke: "1px var(--paper)",
        }}
      >
        InstantERD
      </motion.h1>
    </div>
  </footer>
);

const InteractiveDemo = () => {
  const steps = [
    {
      id: 1,
      title: "Input Requirements",
      description: "Type your database requirements in plain English. Our AI understands complex relationships and constraints.",
      icon: MessageSquare,
      images: []
    },
    {
      id: 2,
      title: "Logic Analysis",
      description: "The system identifies entities, attributes, and cardinalities, resolving many-to-many relationships automatically.",
      icon: Cpu,
      images: []
    },
    {
      id: 3,
      title: "ERD Generation",
      description: "A pixel-perfect Chen notation diagram is rendered with mathematical precision for maximum readability.",
      icon: Layout,
      images: []
    },
    {
      id: 4,
      title: "Schema Export",
      description: "Export your architectural blueprint directly to SQL, Prisma, or Drizzle schema formats instantly.",
      icon: Database,
      images: []
    }
  ];

  return (
    <section id="how-it-works" className="py-48 relative overflow-hidden bg-blueprint/20">
      <div className="absolute inset-0 grid-bg opacity-10" />
      <FeatureCarousel 
        title="From Thought to Structure"
        description="Experience the automated engineering workflow that transforms abstract requirements into solid database architectures."
        steps={steps}
      />
    </section>
  );
};

const Pricing = () => (
  <section id="pricing" className="py-32 border-t border-paper/5">
    <div className="max-w-7xl mx-auto px-6">
      <div className="text-center mb-12">
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-emerald-accent mb-4 block">Investment</span>
        <h2 className="text-5xl font-serif">Simple, Transparent</h2>
      </div>
      
      <PricingSection 
        plans={PRICING_PLANS} 
        defaultPlanId="pro"
        onContinue={(planId, cycle) => console.log(`Selected ${planId} with ${cycle} billing`)}
      />
    </div>
  </section>
);

const Templates = () => (
  <section className="py-32 border-t border-paper/5 bg-blueprint/50 relative overflow-hidden">
    <div className="max-w-7xl mx-auto px-6 relative z-10">
      <div className="text-center mb-20">
        <h2 className="text-4xl md:text-6xl font-serif mb-6">Start with a template</h2>
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-emerald-accent">Accelerate your architecture</p>
      </div>
      
      <div className="max-w-md mx-auto">
        <MinimalCarousel 
          cards={TEMPLATE_CARDS} 
          onCopyClick={(card) => console.log(`Copied ${card.title} schema`)}
          onCustomizeClick={(card) => console.log(`Editing ${card.title} schema`)}
        />
      </div>
    </div>
  </section>
);

export default function Home() {
  return (
    <div className="selection:bg-emerald-accent selection:text-blueprint">
      <Nav />
      <Hero />
      <Features />
      <Templates />
      <InteractiveDemo />
      <Pricing />
      
      <section className="py-32 bg-emerald-accent text-blueprint relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 opacity-10 grid-bg" />
          
          {[
            { x: "10%", y: "20%", size: "400px", color: "bg-paper/10" },
            { x: "80%", y: "60%", size: "500px", color: "bg-blueprint/10" },
            { x: "40%", y: "80%", size: "450px", color: "bg-paper/5" }
          ].map((spot, i) => (
            <motion.div
              key={`mesh-spot-${i}`}
              animate={{ 
                x: ["-10%", "10%", "-10%"],
                y: ["-10%", "10%", "-10%"],
                scale: [1, 1.1, 1],
                opacity: [0.1, 0.3, 0.1]
              }}
              transition={{ 
                duration: 15 + i * 5, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
              style={{ 
                left: spot.x, 
                top: spot.y, 
                width: spot.size, 
                height: spot.size 
              }}
              className={`absolute rounded-full blur-[80px] will-change-transform ${spot.color}`}
            />
          ))}
        </div>

        <div className="max-w-7xl mx-auto px-6 text-center relative z-10">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-6xl md:text-8xl font-serif mb-12"
          >
            Ready to architect?
          </motion.h2>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="inline-block relative group"
          >
            <motion.div
              animate={{ 
                scale: [1, 1.05, 1],
                opacity: [0.3, 0.6, 0.3]
              }}
              transition={{ 
                duration: 3, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
              className="absolute -inset-4 bg-blueprint/5 rounded-full blur-xl group-hover:bg-blueprint/10 transition-colors"
            />
            
            <Link to="/signup">
              <Button variant="secondary" className="text-lg px-12 py-6 relative z-10" hoverText="Launch App">
                Get Started Now
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
