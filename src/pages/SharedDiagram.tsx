import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { databases } from '../lib/appwrite/client';
import { Query } from 'appwrite';
import { Loader2 } from 'lucide-react';
import { ERDRenderer, type ERDRendererHandle } from '../components/ERDRenderer';
import type { AppwriteDiagram, ERDSchema } from '../lib/types';
import { addWatermark } from '../lib/export';

const DB_ID = 'instanterd';
const DIAGRAMS_COLL = 'diagrams';

export default function SharedDiagram() {
  const { token } = useParams<{ token: string }>();
  const [diagram, setDiagram] = useState<AppwriteDiagram | null>(null);
  const [schema, setSchema] = useState<ERDSchema | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const rendererRef = useRef<ERDRendererHandle>(null);

  useEffect(() => {
    async function fetchSharedDiagram() {
      if (!token) return;
      try {
        const res = await databases.listDocuments(DB_ID, DIAGRAMS_COLL, [
          Query.equal('shareToken', token),
          Query.equal('isPublic', true),
          Query.limit(1)
        ]);
        if (res.documents.length === 0) {
          throw new Error("This diagram is not available");
        }
        const doc = res.documents[0] as unknown as AppwriteDiagram;
        setDiagram(doc);
        setSchema(JSON.parse(doc.schema));
      } catch (err: any) {
        setError(err.message || "Failed to load diagram.");
      } finally {
        setLoading(false);
      }
    }
    fetchSharedDiagram();
  }, [token]);

  useEffect(() => {
    // Add watermark after render
    if (!loading && schema && rendererRef.current) {
      setTimeout(() => {
        const svgEl = rendererRef.current?.getSVGElement();
        if (svgEl) {
          addWatermark(svgEl);
        }
      }, 500); // give it time to render
    }
  }, [loading, schema]);

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
        <p className="text-red-400 font-mono text-sm uppercase tracking-widest mb-4">{error}</p>
        <Link to="/" className="text-emerald-accent hover:underline font-mono text-xs uppercase">
          Create your own
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blueprint selection:bg-emerald-accent selection:text-blueprint flex flex-col">
      <header className="h-16 border-b border-paper/10 bg-blueprint/80 backdrop-blur-md flex items-center justify-between px-6 shrink-0 relative z-20">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2 group mr-4">
            <div className="w-6 h-6 border-2 border-emerald-accent flex items-center justify-center group-hover:bg-emerald-accent transition-colors duration-300">
              <span className="font-serif font-bold text-xs text-emerald-accent group-hover:text-blueprint transition-colors duration-300">I</span>
            </div>
          </Link>
          <div className="h-4 w-px bg-paper/10" />
          <h1 className="font-serif text-lg text-paper">{diagram.title}</h1>
          <span className="font-mono text-[10px] text-paper/40 ml-4 hidden md:inline">
            Shared on {new Date(diagram.$updatedAt).toLocaleDateString()}
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          <Link 
            to="/"
            className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-blueprint bg-emerald-accent hover:bg-emerald-accent/90 px-4 py-2 rounded transition-colors"
          >
            Create your own
          </Link>
        </div>
      </header>
      
      <main className="flex-1 relative overflow-hidden bg-blueprint/40 grid-bg noise-bg">
        <div className="absolute inset-0 p-8 cursor-move">
          <ERDRenderer ref={rendererRef} schema={schema} options={{ showCardinality: true, showParticipation: true }} />
        </div>
      </main>
    </div>
  );
}
