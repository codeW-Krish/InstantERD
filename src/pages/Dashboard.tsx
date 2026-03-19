import * as React from "react";
import { ERDInputPanel } from "../components/ERDInputPanel";
import { EditProfile, ProfileData } from "../components/EditProfile";
import { motion } from "motion/react";
import { Database, User, History, Plus, LogOut } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { ERDRenderer, type ERDRendererHandle } from "../components/ERDRenderer";
import { ERDRenderSkeleton } from "../components/ERDRenderer/Skeleton";
import type { ERDSchema, AppwriteDiagram } from "../lib/types";
import { useUser } from "../hooks/useUser";
import { databases, account } from "../lib/appwrite/client";
import { Query, ID } from "appwrite";

const DB_ID = "instanterd";
const DIAGRAMS_COLL = "diagrams";

const DashboardNav = ({ onProfileClick, userName, onLogout }: { onProfileClick: () => void; userName?: string; onLogout: () => void }) => (
  <nav className="fixed top-0 left-0 w-full z-50 border-b border-paper/5 bg-blueprint/80 backdrop-blur-md">
    <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
      <Link to="/" className="flex items-center gap-2 group">
        <div className="w-6 h-6 border-2 border-emerald-accent flex items-center justify-center group-hover:bg-emerald-accent transition-colors duration-300">
          <span className="font-serif font-bold text-xs text-emerald-accent group-hover:text-blueprint transition-colors duration-300">I</span>
        </div>
        <span className="font-serif text-lg tracking-tight font-medium">InstantERD</span>
      </Link>
      
      <div className="flex items-center gap-6">
        <div className="hidden md:flex items-center gap-4 border-r border-paper/10 pr-6 mr-2">
          <button className="font-mono text-[10px] uppercase tracking-widest text-emerald-accent flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Plus size={12} />
            New Diagram
          </button>
          <button className="font-mono text-[10px] uppercase tracking-widest text-paper/40 hover:text-paper/80 transition-colors flex items-center gap-2">
            <History size={12} />
            History
          </button>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={onProfileClick}
            className="flex items-center gap-3 group px-2 py-1 rounded-lg hover:bg-paper/5 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-emerald-accent/10 border border-emerald-accent/20 flex items-center justify-center group-hover:border-emerald-accent transition-colors">
              <User size={14} className="text-emerald-accent" />
            </div>
            <span className="hidden sm:block font-mono text-[10px] uppercase tracking-widest text-paper/60 group-hover:text-paper transition-colors">
              {userName || 'Architect'}
            </span>
          </button>
          <button onClick={onLogout} className="ml-2 p-2 text-paper/20 hover:text-emerald-accent transition-colors">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  </nav>
);

export default function Dashboard() {
  const { user, logout } = useUser();
  const navigate = useNavigate();
  const [status, setStatus] = React.useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [schema, setSchema] = React.useState<ERDSchema | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [lastOptions, setLastOptions] = React.useState<any>(null);
  const [recentDiagrams, setRecentDiagrams] = React.useState<AppwriteDiagram[]>([]);
  const [entitlements, setEntitlements] = React.useState<{
    plan: 'free' | 'pro' | 'team';
    usage: { generationCountThisMonth: number; generationRemainingThisMonth: number; resetAt: string };
  } | null>(null);
  const rendererRef = React.useRef<ERDRendererHandle>(null);

  const [isProfileOpen, setIsProfileOpen] = React.useState(false);
  const [profileData, setProfileData] = React.useState<ProfileData>({
    fullName: user?.name || "Krish Architect",
    email: user?.email || "",
    timezone: "GMT+5",
    workingHours: "9:00 AM - 6:00 PM",
    title: "Senior Database Architect",
    avatarUrl: "https://picsum.photos/seed/architect/200/200",
    lastUpdated: new Date().toLocaleDateString()
  });

  React.useEffect(() => {
    // Fetch recent diagrams from Appwrite securely
    async function fetchDiagrams() {
      try {
        const response = await databases.listDocuments(DB_ID, DIAGRAMS_COLL, [
          Query.orderDesc('$createdAt'),
          Query.limit(5)
        ]);
        setRecentDiagrams(response.documents as unknown as AppwriteDiagram[]);
      } catch (err) {
        console.error("Failed to fetch recent diagrams:", err);
      }
    }
    
    if (user) {
      fetchDiagrams();
    }
  }, [user]);

  React.useEffect(() => {
    async function fetchEntitlements() {
      if (!user) {
        setEntitlements(null);
        return;
      }
      try {
        const jwt = await account.createJWT();
        const response = await fetch('http://localhost:3001/api/entitlements', {
          headers: {
            Authorization: `Bearer ${jwt.jwt}`,
          },
        });
        if (!response.ok) return;
        const data = await response.json();
        setEntitlements({
          plan: data.plan,
          usage: data.usage,
        });
      } catch (err) {
        console.error('Failed to fetch entitlements:', err);
      }
    }
    fetchEntitlements();
  }, [user]);

  const handleGenerate = async (payload: any) => {
    console.log("Generating with payload:", payload);
    setStatus('loading');
    setErrorMessage(null);
    setLastOptions(payload.options);
    
    try {
      let jwtToken = '';
      if (user) {
        const jwtResponse = await account.createJWT();
        jwtToken = jwtResponse.jwt;
      }

      const response = await fetch('http://localhost:3001/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(jwtToken ? { 'Authorization': `Bearer ${jwtToken}` } : {})
        },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.details || data.message || data.error || 'Failed to generate diagram');
      }
      
      setSchema(data.schema);
      setStatus('success');

      try {
        const jwt = await account.createJWT();
        const entRes = await fetch('http://localhost:3001/api/entitlements', {
          headers: { Authorization: `Bearer ${jwt.jwt}` },
        });
        if (entRes.ok) {
          const ent = await entRes.json();
          setEntitlements({ plan: ent.plan, usage: ent.usage });
        }
      } catch (refreshErr) {
        console.error('Failed to refresh entitlements:', refreshErr);
      }

      // Save diagram document to Appwrite
      if (user) {
        try {
          const newDoc = await databases.createDocument(DB_ID, DIAGRAMS_COLL, ID.unique(), {
            workspaceId: data.workspaceId,
            teamId: data.teamId,
            createdByUserId: user.$id,
            title: payload.naturalLanguage?.slice(0, 50) || "Untitled ERD Diagram",
            schema: JSON.stringify(data.schema),
            rawInput: JSON.stringify(payload),
            inputMode: payload.mode || 'nl',
            version: 1,
            isPublic: false
          });
          
          setRecentDiagrams(prev => [newDoc as unknown as AppwriteDiagram, ...prev].slice(0, 5));
        } catch (saveErr) {
          console.error("Failed to save diagram to Appwrite:", saveErr);
        }
      }

    } catch (err: any) {
      console.error('Generation Error:', err);
      setErrorMessage(err.message);
      setStatus('error');
    }
  };

  const handleSaveProfile = (newData: ProfileData) => {
    setProfileData({
      ...newData,
      lastUpdated: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    });
    setIsProfileOpen(false);
  };

  return (
    <div className="min-h-screen bg-blueprint selection:bg-emerald-accent selection:text-blueprint pt-32 pb-20 relative overflow-hidden">
      <DashboardNav onProfileClick={() => setIsProfileOpen(true)} userName={user?.name} onLogout={logout} />
      
      <div className="max-w-5xl mx-auto px-6 space-y-12 relative z-10">
        <header className="space-y-4">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 text-emerald-accent"
          >
            <Database size={20} />
            <span className="font-mono text-xs uppercase tracking-[0.4em]">Architect Mode</span>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-serif leading-tight"
          >
            Design your <br />
            <span className="italic text-emerald-accent">Data Architecture.</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-paper/40 font-mono text-xs uppercase tracking-widest max-w-xl"
          >
            Input your requirements below. Our AI engine will transform your logic into a pixel-perfect Chen notation diagram.
          </motion.p>
        </header>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-8"
        >
          {status === 'error' && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg">
              <p className="font-mono text-xs font-bold uppercase mb-1">Error Generating Diagram</p>
              <p className="text-sm">{errorMessage}</p>
            </div>
          )}

          {entitlements && (
            <div className="bg-paper/5 border border-paper/10 rounded-lg px-4 py-3 flex flex-wrap items-center justify-between gap-3">
              <p className="font-mono text-[10px] uppercase tracking-widest text-paper/50">
                Plan: <span className="text-emerald-accent">{entitlements.plan}</span>
              </p>
              <p className="font-mono text-[10px] uppercase tracking-widest text-paper/50">
                Generations Left: <span className="text-emerald-accent">{entitlements.usage.generationRemainingThisMonth}</span>
              </p>
              {entitlements.plan === 'free' && (
                <button
                  onClick={() => navigate('/pricing')}
                  className="font-mono text-[10px] uppercase tracking-widest text-blueprint bg-emerald-accent px-3 py-2 rounded hover:bg-emerald-accent/90 transition-colors"
                >
                  Unlock SQL + Mix
                </button>
              )}
            </div>
          )}

          <ERDInputPanel 
            onGenerate={handleGenerate} 
            isLoading={status === 'loading'}
            currentPlan={entitlements?.plan || 'free'}
            onUpgradeClick={() => navigate('/pricing')}
          />

          {status === 'loading' && <ERDRenderSkeleton />}
          
          {status === 'success' && schema && (
            <div className="relative">
              <div className="absolute top-4 right-4 z-10 flex gap-2">
                <button
                  onClick={() => rendererRef.current?.downloadSVG()}
                  className="px-4 py-2 bg-emerald-accent text-blueprint font-mono text-xs uppercase tracking-widest hover:bg-emerald-accent/80 transition-colors"
                >
                  Download SVG
                </button>
              </div>
              <ERDRenderer 
                ref={rendererRef} 
                schema={schema} 
                options={lastOptions || { showCardinality: true, showParticipation: true }} 
              />
            </div>
          )}

          {status === 'idle' && recentDiagrams.length > 0 && (
            <div className="mt-16 pt-8 border-t border-paper/5">
              <h3 className="font-mono text-xs uppercase tracking-widest text-paper/40 mb-6 flex items-center gap-2">
                <History size={14} /> Recent Diagrams
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recentDiagrams.map(diagram => (
                  <Link to={`/diagram/${diagram.$id}`} key={diagram.$id} className="block p-4 bg-blueprint/60 border border-paper/10 rounded-xl hover:border-emerald-accent/30 transition-colors group">
                    <h4 className="font-serif text-lg text-paper group-hover:text-emerald-accent transition-colors">{diagram.title}</h4>
                    <div className="flex justify-between items-center mt-4">
                      <span className="font-mono text-[10px] text-paper/40 uppercase bg-paper/5 px-2 py-1 rounded">
                        {diagram.inputMode} Mode
                      </span>
                      <span className="font-mono text-[10px] text-paper/40">
                        {new Date(diagram.$updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </motion.div>
        
        <footer className="pt-20 border-t border-paper/5 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-8 font-mono text-[10px] uppercase tracking-widest text-paper/20">
            <a href="#" className="hover:text-paper/40 transition-colors">Documentation</a>
            <a href="#" className="hover:text-paper/40 transition-colors">API Reference</a>
            <a href="#" className="hover:text-paper/40 transition-colors">Support</a>
          </div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-paper/10">
            &copy; 2026 InstantERD Engine v4.2.0
          </div>
        </footer>
      </div>

      <EditProfile 
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        initialData={profileData}
        onSave={handleSaveProfile}
      />

      {/* Background elements */}
      <div className="fixed inset-0 grid-bg opacity-[0.03] pointer-events-none" />
      <div className="fixed top-0 right-0 w-[800px] h-[800px] bg-emerald-accent/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2 pointer-events-none" />
    </div>
  );
}
