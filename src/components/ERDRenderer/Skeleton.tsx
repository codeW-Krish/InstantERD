export const ERDRenderSkeleton = () => (
  <div className="w-full h-[500px] bg-white/5 dark:bg-black/20 rounded-xl border border-white/10 p-8 flex flex-col items-center animate-pulse">
    <div className="w-40 h-12 bg-white/10 rounded mb-16 relative">
      <div className="absolute top-1/2 left-full w-24 h-0.5 bg-white/10" />
      <div className="absolute top-1/2 -left-24 w-24 h-0.5 bg-white/10" />
      <div className="absolute top-full left-1/2 w-0.5 h-16 bg-white/10" />
    </div>
    <div className="flex gap-32">
       <div className="w-32 h-32 rotate-45 bg-white/10" />
       <div className="w-32 h-32 rotate-45 bg-white/10" />
    </div>
    <div className="mt-16 w-32 h-10 rounded-full bg-white/10" />
  </div>
);
