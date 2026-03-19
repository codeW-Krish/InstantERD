import React, { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { databases, storage } from "../lib/appwrite/client";
import { useUser } from "../hooks/useUser";
import { motion } from "motion/react";
import { ArrowLeft, Share2, Download, Image as ImageIcon, FileText, Lock, Loader2, Check, X, History } from "lucide-react";
import { ERDRenderer, type ERDRendererHandle } from "../components/ERDRenderer";
import type { AppwriteDiagram, ERDSchema } from "../lib/types";
import { ERDRenderSkeleton } from "../components/ERDRenderer/Skeleton";
import { exportSVG, exportPNG, exportPDF } from "../lib/export";
import { ID, Permission, Role, Query } from "appwrite";
import { account } from "../lib/appwrite/client";

const DB_ID = "instanterd";
const DIAGRAMS_COLL = "diagrams";
const VERSIONS_COLL = "diagram_versions";
const BUCKET_ID = "diagram-exports";

export default function DiagramDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useUser();
  const [diagram, setDiagram] = useState<AppwriteDiagram | null>(null);
  const [schema, setSchema] = useState<ERDSchema | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [title, setTitle] = useState("Untitled ERD Diagram");
  
  // History Drawer State
  const [showHistory, setShowHistory] = useState(false);
  const [versions, setVersions] = useState<any[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [previewVersion, setPreviewVersion] = useState<any | null>(null);
  const [currentPlan, setCurrentPlan] = useState<'free' | 'pro' | 'team'>('free');

  const rendererRef = useRef<ERDRendererHandle>(null);

  useEffect(() => {
    async function fetchDiagram() {
      if (!id) return;
      try {
        const doc = await databases.getDocument(DB_ID, DIAGRAMS_COLL, id);
        setDiagram(doc as unknown as AppwriteDiagram);
        setSchema(JSON.parse(doc.schema));
        setTitle(doc.title);
      } catch (err: any) {
        setError(err.message || "Failed to load diagram.");
      } finally {
        setLoading(false);
      }
    }
    fetchDiagram();
  }, [id]);

  useEffect(() => {
    async function fetchEntitlements() {
      if (!user) return;
      try {
        const jwt = await account.createJWT();
        const response = await fetch('http://localhost:3001/api/entitlements', {
          headers: {
            Authorization: `Bearer ${jwt.jwt}`,
          },
        });
        if (!response.ok) return;
        const data = await response.json();
        if (data.plan === 'free' || data.plan === 'pro' || data.plan === 'team') {
          setCurrentPlan(data.plan);
        }
      } catch (err) {
        console.error('Failed to fetch plan entitlements:', err);
      }
    }
    fetchEntitlements();
  }, [user]);

  const handleSaveTitle = async () => {
    if (!id || !diagram || title === diagram.title) return;
    setIsSaving(true);
    try {
      await databases.updateDocument(DB_ID, DIAGRAMS_COLL, id, {
        title: title
      });
      setDiagram({ ...diagram, title });
    } catch (err) {
      console.error("Failed to update title:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = async (format: 'svg' | 'png' | 'pdf') => {
    if (!rendererRef.current || !diagram || !user) return;
    const svgEl = rendererRef.current.getSVGElement();
    if (!svgEl) return;

    const isPaid = currentPlan === 'pro' || currentPlan === 'team';
    if ((format === 'svg' || format === 'pdf') && !isPaid) {
      alert(`${format.toUpperCase()} export is available on Pro and Team plans.`);
      return;
    }

    // Find the wrapper element to render PDF/PNG. SVGElements directly passed to html-to-image sometimes lose styling.
    const containerEl = svgEl.parentElement as HTMLElement;
    
    let blob: Blob | null = null;
    if (format === 'svg') {
      blob = exportSVG(svgEl, diagram.title);
    } else if (format === 'png') {
      blob = await exportPNG(containerEl, diagram.title, isPaid);
    } else if (format === 'pdf') {
      blob = await exportPDF(containerEl, diagram.title, isPaid);
    }

    if (blob) {
      // Quietly upload to Appwrite Storage and attach to Document
      try {
        const file = new File([blob], `${diagram.$id}_${format}.${format}`, { type: blob.type });
        const uploadedFile = await storage.createFile(
          BUCKET_ID,
          ID.unique(),
          file,
          [Permission.read(Role.any())] // Public read since it's an export
        );
        
        let updateData: any = {};
        if (format === 'svg') updateData.exportSvgPath = uploadedFile.$id;
        if (format === 'png') updateData.exportPngPath = uploadedFile.$id;
        if (format === 'pdf') updateData.exportPdfPath = uploadedFile.$id;
        
        await databases.updateDocument(DB_ID, DIAGRAMS_COLL, id as string, updateData);
      } catch (err) {
        console.error("Failed to upload export back to storage:", err);
      }
    }
  };

  const handleShare = async () => {
    if (!id || !diagram || !user) return;
    setIsSharing(true);
    try {
      if (!diagram.shareToken) {
        // Generate Token
        const shareToken = crypto.randomUUID().replace(/-/g, '').slice(0, 24);
        
        // Update document with generic Role.any() read permissions
        const updated = await databases.updateDocument(DB_ID, DIAGRAMS_COLL, id, {
          shareToken: shareToken,
          isPublic: true
        }, [
          Permission.read(Role.any()),
          Permission.update(Role.users()), // Keep users editable
          Permission.delete(Role.users())
        ]);
        
        setDiagram({ ...diagram, shareToken: updated.shareToken, isPublic: true });
      }

      // Copy to clipboard
      const url = `${window.location.origin}/share/${diagram.shareToken || ''}`;
      if (diagram.shareToken) {
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      console.error("Failed to share:", err);
    } finally {
      setIsSharing(false);
    }
  };

  const handleRevokeShare = async () => {
    if (!id || !diagram || !user) return;
    setIsSharing(true);
    try {
      const updated = await databases.updateDocument(DB_ID, DIAGRAMS_COLL, id, {
        shareToken: null,
        isPublic: false
      }, [
        Permission.read(Role.users()), // Restore strictly private access
        Permission.update(Role.users()),
        Permission.delete(Role.users())
      ]);
      setDiagram({ ...diagram, shareToken: undefined, isPublic: false });
    } catch (err) {
      console.error("Failed to revoke share:", err);
    } finally {
      setIsSharing(false);
    }
  };

  const loadHistory = async () => {
    if (!id) return;
    setShowHistory(true);
    setLoadingVersions(true);
    try {
      const resp = await databases.listDocuments(DB_ID, VERSIONS_COLL, [
        Query.equal('diagramId', id),
        Query.orderDesc('versionNumber')
      ]);
      setVersions(resp.documents);
    } catch (err) {
      console.error("Failed to load versions:", err);
    } finally {
      setLoadingVersions(false);
    }
  };

  const restoreVersion = async (version: any) => {
    // In Pro this is normally allowed. Since we mock "assuming Free tier for watermark", 
    // we should ideally show an upgrade prompt. For demo, we alert.
    alert("Pro Feature: Restoring previous versions requires a Pro subscription.");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-blueprint pt-32 p-6 flex items-center justify-center">
        <Loader2 className="animate-spin text-emerald-accent w-8 h-8" />
      </div>
    );
  }

  if (error || !diagram || !schema) {
    return (
      <div className="min-h-screen bg-blueprint pt-32 p-6 flex flex-col items-center justify-center text-center">
        <p className="text-red-400 font-mono text-sm uppercase tracking-widest mb-4">{error || "Diagram not found"}</p>
        <Link to="/dashboard" className="text-emerald-accent hover:underline font-mono text-xs uppercase">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blueprint selection:bg-emerald-accent selection:text-blueprint flex flex-col">
      {/* Header */}
      <header className="h-16 border-b border-paper/10 bg-blueprint/80 backdrop-blur-md flex items-center justify-between px-6 shrink-0 relative z-20">
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="p-2 -ml-2 text-paper/40 hover:text-emerald-accent transition-colors">
            <ArrowLeft size={16} />
          </Link>
          <div className="h-4 w-px bg-paper/10" />
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleSaveTitle}
            className="bg-transparent font-serif text-lg text-paper focus:outline-none focus:text-emerald-accent transition-colors w-64 md:w-96"
          />
          {isSaving && <Loader2 size={12} className="animate-spin text-paper/40" />}
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => handleExport('svg')}
            className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-paper/60 hover:text-paper hover:bg-paper/5 px-3 py-2 rounded transition-colors"
          >
            <Download size={14} /> SVG
          </button>
          <button 
            onClick={() => handleExport('png')}
            className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-paper/60 hover:text-paper hover:bg-paper/5 px-3 py-2 rounded transition-colors relative group"
          >
            <ImageIcon size={14} /> PNG
            {currentPlan === 'free' && <Lock size={10} className="absolute top-1 right-1 text-emerald-accent/50" />}
          </button>
          <button 
            onClick={() => handleExport('pdf')}
            className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-paper/60 hover:text-paper hover:bg-paper/5 px-3 py-2 rounded transition-colors relative group"
          >
            <FileText size={14} /> PDF
            {currentPlan === 'free' && <Lock size={10} className="absolute top-1 right-1 text-emerald-accent/50" />}
          </button>
          <div className="w-px h-4 bg-paper/10 mx-2" />
          
          {diagram.shareToken ? (
            <div className="flex items-center gap-2">
              <button 
                onClick={handleShare}
                className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-blueprint bg-emerald-accent hover:bg-emerald-accent/90 px-4 py-2 rounded transition-colors"
              >
                {copied ? <Check size={14} /> : <Share2 size={14} />} {copied ? "Copied Link" : "Share Link"}
              </button>
              <button 
                onClick={handleRevokeShare}
                title="Revoke Public URL"
                className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-red-500 hover:bg-red-500/10 px-2 py-2 rounded transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <button 
              onClick={handleShare}
              disabled={isSharing}
              className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-blueprint bg-emerald-accent hover:bg-emerald-accent/90 px-4 py-2 rounded transition-colors disabled:opacity-50"
            >
              {isSharing ? <Loader2 size={14} className="animate-spin" /> : <Share2 size={14} />} Share
            </button>
          )}

          <div className="w-px h-4 bg-paper/10 mx-2" />
          <button 
            onClick={() => showHistory ? setShowHistory(false) : loadHistory()}
            className={`flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest px-4 py-2 rounded transition-colors ${showHistory ? 'bg-paper/10 text-paper' : 'text-paper/60 hover:text-paper hover:bg-paper/5'}`}
          >
            <History size={14} /> History
          </button>
        </div>
      </header>
      
      {/* Canvas Area */}
      <main className="flex-1 relative overflow-hidden flex">
        <div className="flex-1 relative bg-blueprint/40 grid-bg noise-bg">
          <div className="absolute inset-0 p-8 cursor-move">
            <ERDRenderer ref={rendererRef} schema={schema} options={{ showCardinality: true, showParticipation: true }} />
          </div>
        </div>

        {/* History Slide-In Drawer */}
        {showHistory && (
          <motion.aside 
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            className="w-[400px] border-l border-paper/10 bg-blueprint/95 backdrop-blur-xl flex flex-col z-30"
          >
            <div className="p-4 border-b border-paper/10 flex items-center justify-between">
              <h3 className="font-mono text-sm uppercase tracking-widest text-paper/60">Version History</h3>
              <button onClick={() => setShowHistory(false)} className="p-2 hover:bg-paper/10 rounded">
                <X size={16} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {loadingVersions ? (
                <div className="text-center p-8">
                  <Loader2 className="animate-spin text-emerald-accent w-6 h-6 mx-auto" />
                </div>
              ) : versions.length === 0 ? (
                <div className="text-center p-8 text-paper/40 font-serif italic text-sm">
                  No previous versions found.
                </div>
              ) : (
                versions.map((v: any) => (
                  <div key={v.$id} className="border border-paper/10 bg-paper/[0.02] p-4 rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold">v{v.versionNumber}</span>
                      <span className="font-mono text-[10px] text-paper/40">{new Date(v.$createdAt).toLocaleString()}</span>
                    </div>
                    {v.changeSummary && <p className="font-serif text-sm italic text-paper/60">{v.changeSummary}</p>}
                    <div className="flex gap-2 pt-2">
                      <button 
                        onClick={() => setPreviewVersion(v)}
                        className="flex-1 text-center font-mono text-[10px] uppercase tracking-widest bg-paper/5 hover:bg-paper/10 py-1.5 rounded transition-colors"
                      >
                        Preview
                      </button>
                      <button 
                        onClick={() => restoreVersion(v)}
                        className="flex-1 text-center font-mono text-[10px] uppercase tracking-widest bg-emerald-accent/10 text-emerald-accent hover:bg-emerald-accent/20 py-1.5 rounded transition-colors"
                      >
                        Restore
                      </button>
                    </div>
                  </div>
                ))
              )}

              {/* Preview Box */}
              {previewVersion && (
                <div className="mt-8 border-t border-paper/10 pt-4">
                  <h4 className="font-mono text-[10px] uppercase tracking-widest text-emerald-accent mb-4">Previewing v{previewVersion.versionNumber}</h4>
                  <div className="h-[300px] relative border border-paper/10 bg-blueprint/50 rounded-lg overflow-hidden shrink-0">
                    <div className="absolute inset-0 pointer-events-none scale-50 origin-top-left w-[200%] h-[200%]">
                      <ERDRenderer schema={JSON.parse(previewVersion.schema)} options={{ showCardinality: true, showParticipation: true }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.aside>
        )}
      </main>
    </div>
  );
}
