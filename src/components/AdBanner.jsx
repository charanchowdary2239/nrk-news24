'use client';

export default function AdBanner({ slot = 'top_banner', label = 'Advertisement Space' }) {
  const slotConfigs = {
    top_banner: {
      classes: 'w-full max-w-[728px] h-[90px]',
      desc: '728 × 90 Leaderboard',
    },
    sidebar: {
      classes: 'w-full max-w-[300px] h-[250px]',
      desc: '300 × 250 Medium Rectangle',
    },
    in_article: {
      classes: 'w-full max-w-[650px] h-[100px]',
      desc: 'Responsive In-Content Banner',
    },
    footer: {
      classes: 'w-full max-w-[970px] h-[90px]',
      desc: '970 × 90 Large Leaderboard',
    },
  };

  const config = slotConfigs[slot] || slotConfigs.top_banner;

  return (
    <div className="my-6 flex flex-col items-center justify-center">
      <span className="text-[9px] font-semibold tracking-widest text-slate-400 uppercase mb-1">
        ADVERTISEMENT
      </span>
      <div
        className={`${config.classes} bg-slate-50 border border-dashed border-slate-300 rounded flex flex-col items-center justify-center p-3 text-center`}
      >
        <span className="text-xs font-medium text-slate-400">
          {label}
        </span>
        <span className="text-[10px] text-slate-300 font-mono mt-0.5">
          {config.desc}
        </span>
      </div>
    </div>
  );
}
