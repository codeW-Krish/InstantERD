import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";
import { 
  Terminal, 
  Cpu, 
  Database, 
  Layout, 
  MessageSquare, 
  Code, 
  Layers, 
  Info, 
  ChevronRight, 
  Check, 
  Loader2,
  AlertCircle,
  Lock
} from "lucide-react";
import { 
  TextureCardStyled, 
  TextureCardHeader, 
  TextureCardContent, 
  TextureCardFooter, 
  TextureSeparator 
} from "./TextureCard";
import { Button } from "./Button";

type Mode = 'nl' | 'sql' | 'mix';
type SqlDialect = 'postgresql' | 'mysql' | 'sqlite' | 'mssql' | 'plain';
type CardinalityStyle = 'chen' | 'minmax' | 'both';

interface GeneratePayload {
  mode: Mode;
  naturalLanguage?: string;
  sqlSchema?: string;
  sqlDialect?: SqlDialect;
  additionalContext?: string;
  domain?: string;
  cardinalityStyle?: CardinalityStyle;
  options: {
    showCardinality: boolean;
    showParticipation: boolean;
    showKeyAttributes: boolean;
    includeDerivedAttributes: boolean;
    includeCompositeAttributes: boolean;
    inferWeakEntities: boolean;
    showDataTypes?: boolean;
    skipJunctionTables?: boolean;
  };
}

interface ERDInputPanelProps {
  onGenerate: (payload: GeneratePayload) => void;
  isLoading?: boolean;
  defaultMode?: Mode;
  className?: string;
  currentPlan?: 'free' | 'pro' | 'team';
  onUpgradeClick?: () => void;
}

const DOMAINS = [
  "Auto-detect", "E-commerce", "Healthcare", "Education", "Finance", 
  "SaaS / B2B", "Social / Media", "Logistics", "Government", "Other"
];

const CARDINALITY_STYLES = [
  { value: 'chen', label: 'Chen (1, N, M)' },
  { value: 'minmax', label: 'Min-Max notation' },
  { value: 'both', label: 'Both' }
];

const NL_EXAMPLES = [
  {
    name: "E-commerce",
    text: "E-commerce: customers place orders containing products. Products belong to categories. Orders have line items with quantity and price. Customers can have multiple shipping addresses. Each order must belong to exactly one customer."
  },
  {
    name: "Hospital",
    text: "Hospital: patients are admitted to wards and treated by doctors. Each doctor specializes in one department. Prescriptions are issued per visit with medication, dosage, and duration details."
  },
  {
    name: "Library",
    text: "Library: members borrow books with due dates. Books have one or more authors and belong to a genre. Librarians manage the catalog and process returns."
  },
  {
    name: "School",
    text: "School: students enroll in courses taught by teachers. Each course has assignments with deadlines. Students submit work and receive a grade per assignment."
  },
  {
    name: "Blog / CMS",
    text: "Blog: authors write posts with tags. Readers can comment on posts and like them. Authors belong to publications. Posts can be drafts or published."
  }
];

const SQL_EXAMPLE = `CREATE TABLE customers (
  id UUID PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20)
);

CREATE TABLE orders (
  id UUID PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  total NUMERIC(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE products (
  id UUID PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  category_id INT REFERENCES categories(id)
);

CREATE TABLE order_items (
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  quantity INT NOT NULL,
  unit_price NUMERIC(10,2),
  PRIMARY KEY (order_id, product_id)
);`;

export const ERDInputPanel = ({ 
  onGenerate, 
  isLoading = false, 
  defaultMode = 'nl',
  className,
  currentPlan = 'free',
  onUpgradeClick,
}: ERDInputPanelProps) => {
  const [activeTab, setActiveTab] = React.useState<Mode>(() => {
    const saved = localStorage.getItem('erd-input-mode');
    return (saved as Mode) || defaultMode;
  });

  const [nlInput, setNlInput] = React.useState("");
  const [sqlInput, setSqlInput] = React.useState("");
  const [sqlDialect, setSqlDialect] = React.useState<SqlDialect>('postgresql');
  const [domain, setDomain] = React.useState("Auto-detect");
  const [cardinalityStyle, setCardinalityStyle] = React.useState<CardinalityStyle>('chen');
  const [additionalContext, setAdditionalContext] = React.useState("");
  
  const [options, setOptions] = React.useState({
    showCardinality: true,
    showParticipation: true,
    showKeyAttributes: true,
    includeDerivedAttributes: false,
    includeCompositeAttributes: false,
    inferWeakEntities: true,
    showDataTypes: false,
    skipJunctionTables: false,
  });

  const [error, setError] = React.useState(false);
  const [featureLockMessage, setFeatureLockMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    localStorage.setItem('erd-input-mode', activeTab);
  }, [activeTab]);

  const toggleOption = (key: keyof typeof options) => {
    setOptions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleGenerate = () => {
    const isEmpty = activeTab === 'nl' ? !nlInput.trim() : 
                    activeTab === 'sql' ? !sqlInput.trim() : 
                    (!nlInput.trim() && !sqlInput.trim());
    
    if (isEmpty) {
      setError(true);
      setTimeout(() => setError(false), 500);
      return;
    }

    const payload: GeneratePayload = {
      mode: activeTab,
      naturalLanguage: (activeTab === 'nl' || activeTab === 'mix') ? nlInput : undefined,
      sqlSchema: (activeTab === 'sql' || activeTab === 'mix') ? sqlInput : undefined,
      sqlDialect: activeTab === 'sql' ? sqlDialect : undefined,
      additionalContext: activeTab === 'sql' ? additionalContext : undefined,
      domain: activeTab === 'nl' ? domain : undefined,
      cardinalityStyle: activeTab === 'nl' ? cardinalityStyle : undefined,
      options: {
        ...options,
        showDataTypes: activeTab === 'sql' ? options.showDataTypes : undefined,
        skipJunctionTables: activeTab === 'sql' ? options.skipJunctionTables : undefined,
      }
    };

    onGenerate(payload);
  };

  const isModeLocked = (tab: Mode): boolean => currentPlan === 'free' && (tab === 'sql' || tab === 'mix');

  const handleTabSwitch = (tab: Mode) => {
    if (isModeLocked(tab)) {
      setFeatureLockMessage('SQL + Mix input is available on Pro and Team plans.');
      onUpgradeClick?.();
      return;
    }
    setFeatureLockMessage(null);
    setActiveTab(tab);
  };

  const charCountNl = nlInput.length;
  const charCountSql = sqlInput.length;
  const MAX_CHARS = 8000;

  const renderCharCount = (count: number) => (
    <span className={cn(
      "font-mono text-[10px] uppercase tracking-widest transition-colors duration-300",
      count > MAX_CHARS ? "text-red-500" : "text-paper/40"
    )} aria-live="polite">
      {count.toLocaleString()} chars
    </span>
  );

  const ToggleChip = ({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) => (
    <button
      onClick={onClick}
      role="checkbox"
      aria-checked={active}
      className={cn(
        "px-3 py-1.5 border font-mono text-[10px] uppercase tracking-widest transition-all duration-300",
        active 
          ? "border-emerald-accent text-emerald-accent bg-emerald-accent/5" 
          : "border-paper/10 text-paper/40 hover:border-paper/30 hover:text-paper/60"
      )}
    >
      <div className="flex items-center gap-2">
        <div className={cn("w-1.5 h-1.5 rounded-full", active ? "bg-emerald-accent" : "bg-paper/10")} />
        {label}
      </div>
    </button>
  );

  return (
    <div className={cn("w-full space-y-8", className)}>
      {/* Tab Switcher */}
      <div className="flex justify-center lg:justify-start" role="tablist">
        <div className="inline-flex p-1 border border-paper/10 bg-blueprint/20 rounded-none">
          {(['nl', 'sql', 'mix'] as const).map((tab) => (
            (() => {
              const locked = isModeLocked(tab);
              return (
            <button
              key={tab}
              role="tab"
              aria-selected={activeTab === tab}
              onClick={() => handleTabSwitch(tab)}
              className={cn(
                "px-6 py-2 font-mono text-[10px] uppercase tracking-[0.2em] transition-all duration-300 inline-flex items-center gap-2",
                activeTab === tab 
                  ? "bg-emerald-accent text-blueprint font-bold" 
                  : "text-paper/40 hover:text-paper/80",
                locked ? "opacity-80" : ""
              )}
            >
              {locked && <Lock size={11} aria-hidden="true" />}
              {tab === 'nl' ? 'Natural Language' : tab === 'sql' ? 'SQL / DB Schema' : 'Mix Both'}
              {locked && <span className="text-[9px] tracking-normal">Pro</span>}
            </button>
              );
            })()
          ))}
        </div>
      </div>

      {featureLockMessage && (
        <div className="border border-emerald-accent/30 bg-emerald-accent/10 p-3">
          <p className="font-mono text-[10px] uppercase tracking-widest text-emerald-accent">{featureLockMessage}</p>
        </div>
      )}

      <TextureCardStyled className={cn(error && "animate-shake")}>
        <TextureCardContent className="p-8 space-y-8">
          {/* Natural Language Mode */}
          {activeTab === 'nl' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="space-y-4">
                <label className="font-mono text-[10px] uppercase tracking-[0.4em] text-emerald-accent block">Describe your domain</label>
                <div className="border border-paper/10 bg-blueprint/40 focus-within:border-emerald-accent/50 transition-colors group">
                  <textarea
                    value={nlInput}
                    onChange={(e) => setNlInput(e.target.value)}
                    placeholder={`e.g. A university system where students enroll in courses taught by professors.\nEach course belongs to a department. Students submit assignments and receive grades.\nEvery student must have at least one enrolled course.`}
                    className="w-full bg-transparent p-6 font-serif text-lg text-paper/90 placeholder:text-paper/20 focus:outline-none min-h-[200px] resize-y"
                    aria-label="Natural language description"
                  />
                  <div className="flex items-center justify-between px-6 py-3 border-t border-paper/5 bg-blueprint/20">
                    {renderCharCount(charCountNl)}
                    <span className="font-mono text-[10px] uppercase tracking-widest text-paper/20 italic">More detail = better diagram</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <span className="font-mono text-[10px] uppercase tracking-widest text-paper/40">Try an example</span>
                <div className="flex flex-wrap gap-2">
                  {NL_EXAMPLES.map((ex) => (
                    <button
                      key={ex.name}
                      onClick={() => setNlInput(ex.text)}
                      className="px-4 py-2 border border-paper/5 bg-paper/[0.02] hover:bg-paper/[0.05] hover:border-paper/20 transition-all duration-300 font-serif text-sm italic text-paper/60 hover:text-paper"
                    >
                      {ex.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="font-mono text-[10px] uppercase tracking-widest text-paper/40 block">Domain / Industry</label>
                  <select 
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    className="w-full bg-blueprint/40 border border-paper/10 p-3 font-mono text-[10px] uppercase tracking-widest text-paper focus:outline-none focus:border-emerald-accent/50 appearance-none cursor-pointer"
                  >
                    {DOMAINS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="space-y-3">
                  <label className="font-mono text-[10px] uppercase tracking-widest text-paper/40 block">Cardinality notation</label>
                  <select 
                    value={cardinalityStyle}
                    onChange={(e) => setCardinalityStyle(e.target.value as CardinalityStyle)}
                    className="w-full bg-blueprint/40 border border-paper/10 p-3 font-mono text-[10px] uppercase tracking-widest text-paper focus:outline-none focus:border-emerald-accent/50 appearance-none cursor-pointer"
                  >
                    {CARDINALITY_STYLES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <label className="font-mono text-[10px] uppercase tracking-widest text-paper/40 block">Output options</label>
                <div className="flex flex-wrap gap-3">
                  <ToggleChip label="Show cardinality" active={options.showCardinality} onClick={() => toggleOption('showCardinality')} />
                  <ToggleChip label="Show participation" active={options.showParticipation} onClick={() => toggleOption('showParticipation')} />
                  <ToggleChip label="Show key attributes" active={options.showKeyAttributes} onClick={() => toggleOption('showKeyAttributes')} />
                  <ToggleChip label="Include derived attributes" active={options.includeDerivedAttributes} onClick={() => toggleOption('includeDerivedAttributes')} />
                  <ToggleChip label="Include composite attributes" active={options.includeCompositeAttributes} onClick={() => toggleOption('includeCompositeAttributes')} />
                  <ToggleChip label="Infer weak entities" active={options.inferWeakEntities} onClick={() => toggleOption('inferWeakEntities')} />
                </div>
              </div>

              <div className="bg-emerald-accent/5 border border-emerald-accent/20 p-6 space-y-4">
                <div className="flex items-center gap-2 text-emerald-accent">
                  <Info size={14} />
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] font-bold">Tips for better diagrams</span>
                </div>
                <ul className="grid sm:grid-cols-2 gap-4">
                  {[
                    "Name relationships as verbs: \"students enroll in courses\"",
                    "Mention participation constraints: \"every order must have at least one item\"",
                    "Call out multi-valued fields: \"a customer can have multiple addresses\"",
                    "Mention computed fields: \"age is derived from date of birth\""
                  ].map((tip, i) => (
                    <li key={i} className="flex gap-3 items-start">
                      <div className="mt-1 w-1 h-1 bg-emerald-accent shrink-0" />
                      <span className="font-serif text-sm italic text-paper/60 leading-tight">{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* SQL Mode */}
          {activeTab === 'sql' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="space-y-4">
                <label className="font-mono text-[10px] uppercase tracking-[0.4em] text-emerald-accent block">SQL / Schema</label>
                <div className="border border-paper/10 bg-blueprint/60 focus-within:border-emerald-accent/50 transition-colors overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2 border-b border-paper/5 bg-blueprint/40">
                    <span className="font-mono text-[10px] text-paper/40 uppercase tracking-widest">schema.sql</span>
                    <div className="flex gap-2" role="radiogroup">
                      {(['postgresql', 'mysql', 'sqlite', 'mssql', 'plain'] as SqlDialect[]).map(d => (
                        <button
                          key={d}
                          role="radio"
                          aria-checked={sqlDialect === d}
                          onClick={() => setSqlDialect(d)}
                          className={cn(
                            "px-2 py-1 font-mono text-[8px] uppercase tracking-widest transition-all",
                            sqlDialect === d ? "bg-emerald-accent text-blueprint" : "text-paper/30 hover:text-paper/60"
                          )}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>
                  <textarea
                    value={sqlInput}
                    onChange={(e) => setSqlInput(e.target.value)}
                    placeholder={`-- Paste CREATE TABLE statements, or plain text like:\n-- users(id, name, email)\n-- orders(id, user_id, total, created_at)\n\nCREATE TABLE users (\n  id UUID PRIMARY KEY,\n  name VARCHAR(100) NOT NULL,\n  email VARCHAR(255) UNIQUE NOT NULL\n);`}
                    className="w-full bg-transparent p-6 font-mono text-[13px] leading-[1.7] text-emerald-accent/80 placeholder:text-paper/10 focus:outline-none min-h-[250px] resize-y"
                    aria-label="SQL schema input"
                  />
                  <div className="flex items-center justify-between px-6 py-3 border-t border-paper/5 bg-blueprint/20">
                    {renderCharCount(charCountSql)}
                    <button 
                      onClick={() => setSqlInput(SQL_EXAMPLE)}
                      className="font-mono text-[10px] uppercase tracking-widest text-emerald-accent hover:text-emerald-accent/80 transition-colors"
                    >
                      Load example
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { title: "CREATE TABLE", desc: "Full DDL with FK constraints → perfect" },
                  { title: "Plain text", desc: "users(id, name) / orders(id, user_id)" },
                  { title: "Mixed", desc: "SQL + notes about business rules" },
                  { title: "ORM models", desc: "Prisma schema or Django models" }
                ].map((hint, i) => (
                  <div key={i} className="p-4 border border-paper/5 bg-paper/[0.01] space-y-2">
                    <div className="font-mono text-[9px] uppercase tracking-widest text-paper/60">{hint.title}</div>
                    <div className="font-serif text-[11px] italic text-paper/30 leading-tight">{hint.desc}</div>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <label className="font-mono text-[10px] uppercase tracking-widest text-paper/40 block">Optional: business context to add</label>
                <input 
                  type="text"
                  value={additionalContext}
                  onChange={(e) => setAdditionalContext(e.target.value)}
                  placeholder="e.g. orders and users are the core — ignore the logs and audit tables"
                  className="w-full bg-blueprint/40 border border-paper/10 p-4 font-serif text-sm italic text-paper placeholder:text-paper/10 focus:outline-none focus:border-emerald-accent/50"
                />
              </div>

              <div className="space-y-4">
                <label className="font-mono text-[10px] uppercase tracking-widest text-paper/40 block">Output options</label>
                <div className="flex flex-wrap gap-3">
                  <ToggleChip label="Show all FK relationships" active={options.showCardinality} onClick={() => toggleOption('showCardinality')} />
                  <ToggleChip label="Show primary keys" active={options.showKeyAttributes} onClick={() => toggleOption('showKeyAttributes')} />
                  <ToggleChip label="Show data types" active={options.showDataTypes} onClick={() => toggleOption('showDataTypes')} />
                  <ToggleChip label="Infer weak entities" active={options.inferWeakEntities} onClick={() => toggleOption('inferWeakEntities')} />
                  <ToggleChip label="Skip junction tables" active={options.skipJunctionTables} onClick={() => toggleOption('skipJunctionTables')} />
                </div>
              </div>

              <div className="bg-blue-500/5 border border-blue-500/20 p-6 space-y-4">
                <div className="flex items-center gap-2 text-blue-400">
                  <Terminal size={14} />
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] font-bold">What Claude infers from SQL</span>
                </div>
                <ul className="grid sm:grid-cols-2 gap-x-8 gap-y-4">
                  {[
                    { label: "FOREIGN KEY", desc: "relationship lines with cardinality" },
                    { label: "ON DELETE CASCADE", desc: "total participation (double lines)" },
                    { label: "Junction tables", desc: "M:N relationship diamonds" },
                    { label: "NOT NULL FK", desc: "strong participation; nullable FK → partial" }
                  ].map((tip, i) => (
                    <li key={i} className="flex gap-3 items-start">
                      <div className="mt-1 w-1 h-1 bg-blue-400 shrink-0" />
                      <div className="space-y-1">
                        <span className="font-mono text-[9px] uppercase tracking-widest text-paper/60 block">{tip.label}</span>
                        <span className="font-serif text-[11px] italic text-paper/30 leading-tight">{tip.desc}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Mix Mode */}
          {activeTab === 'mix' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="grid lg:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <label className="font-mono text-[10px] uppercase tracking-[0.4em] text-emerald-accent block">Describe your domain</label>
                  <div className="border border-paper/10 bg-blueprint/40 focus-within:border-emerald-accent/50 transition-colors">
                    <textarea
                      value={nlInput}
                      onChange={(e) => setNlInput(e.target.value)}
                      placeholder="Describe business rules..."
                      className="w-full bg-transparent p-6 font-serif text-base text-paper/90 placeholder:text-paper/20 focus:outline-none min-h-[250px] resize-y"
                    />
                    <div className="px-6 py-3 border-t border-paper/5 bg-blueprint/20">
                      {renderCharCount(charCountNl)}
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <label className="font-mono text-[10px] uppercase tracking-[0.4em] text-blue-400 block">SQL / Schema</label>
                  <div className="border border-paper/10 bg-blueprint/60 focus-within:border-blue-500/50 transition-colors overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-2 border-b border-paper/5 bg-blueprint/40">
                      <span className="font-mono text-[10px] text-paper/40 uppercase tracking-widest">schema.sql</span>
                    </div>
                    <textarea
                      value={sqlInput}
                      onChange={(e) => setSqlInput(e.target.value)}
                      placeholder="Paste SQL schema..."
                      className="w-full bg-transparent p-6 font-mono text-[12px] leading-[1.6] text-emerald-accent/80 placeholder:text-paper/10 focus:outline-none min-h-[250px] resize-y"
                    />
                    <div className="px-6 py-3 border-t border-paper/5 bg-blueprint/20">
                      {renderCharCount(charCountSql)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <p className="font-serif text-sm italic text-paper/30 max-w-2xl mx-auto">
                  "The SQL gives Claude the structure. The text gives it the semantics. Best for legacy schemas with unclear naming or missing FK constraints."
                </p>
              </div>

              <div className="space-y-4">
                <label className="font-mono text-[10px] uppercase tracking-widest text-paper/40 block">Output options</label>
                <div className="flex flex-wrap gap-3">
                  <ToggleChip label="Show cardinality" active={options.showCardinality} onClick={() => toggleOption('showCardinality')} />
                  <ToggleChip label="Show participation" active={options.showParticipation} onClick={() => toggleOption('showParticipation')} />
                  <ToggleChip label="Show key attributes" active={options.showKeyAttributes} onClick={() => toggleOption('showKeyAttributes')} />
                  <ToggleChip label="Include derived attributes" active={options.includeDerivedAttributes} onClick={() => toggleOption('includeDerivedAttributes')} />
                  <ToggleChip label="Include composite attributes" active={options.includeCompositeAttributes} onClick={() => toggleOption('includeCompositeAttributes')} />
                  <ToggleChip label="Infer weak entities" active={options.inferWeakEntities} onClick={() => toggleOption('inferWeakEntities')} />
                  <ToggleChip label="Show data types" active={options.showDataTypes} onClick={() => toggleOption('showDataTypes')} />
                  <ToggleChip label="Skip junction tables" active={options.skipJunctionTables} onClick={() => toggleOption('skipJunctionTables')} />
                </div>
              </div>
            </div>
          )}
        </TextureCardContent>

        <TextureCardFooter className="p-8 pt-0">
          <Button
            onClick={handleGenerate}
            className={cn(
              "w-full h-16 text-lg",
              activeTab === 'sql' ? "bg-blue-500 text-blueprint hover:bg-blue-400" : 
              activeTab === 'mix' ? "bg-emerald-accent text-blueprint hover:opacity-90" : ""
            )}
            hoverText={isLoading ? "Architecting..." : activeTab === 'nl' ? "Generate ER Diagram →" : activeTab === 'sql' ? "Generate from Schema →" : "Generate from Both →"}
          >
            {isLoading ? (
              <div className="flex items-center gap-3">
                <Loader2 className="animate-spin" size={20} />
                <span>Generating...</span>
              </div>
            ) : (
              <span>
                {activeTab === 'nl' ? "Generate ER Diagram →" : 
                 activeTab === 'sql' ? "Generate from Schema →" : 
                 "Generate from Both →"}
              </span>
            )}
          </Button>
        </TextureCardFooter>
      </TextureCardStyled>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.2s ease-in-out 0s 2;
        }
      `}} />
    </div>
  );
};
