import React from 'react';
import { Download, ShieldCheck, Zap, HardDrive, HelpCircle } from 'lucide-react';

export const OllamaGuideTab: React.FC = () => {
  const handleOpenDownload = (url: string) => {
    // @ts-ignore
    window.lamApi?.app?.openExternal?.(url) || window.open(url, '_blank');
  };

  const steps = [
    {
      num: '1',
      title: 'Download & Install Ollama',
      desc: 'Download the official installer for Windows or macOS. Install like standard software (Next -> Finish).',
      action: () => handleOpenDownload('https://ollama.com/download'),
      actionLabel: 'Download Ollama (.exe / .dmg)'
    },
    {
      num: '2',
      title: 'Start Ollama Daemon',
      desc: 'Once installed, the Ollama camel icon appears in your system tray. Ollama runs silently in the background on port 11434.',
      action: null,
      actionLabel: null
    },
    {
      num: '3',
      title: 'Pull Models in Studio',
      desc: 'Switch to the "Model Library" tab, click "Run in Terminal" or "Download In-App". The Studio automatically pulls and links the model!',
      action: null,
      actionLabel: null
    }
  ];

  return (
    <div className="space-y-4 text-xs text-gray-300">
      {/* 3 Step Guide */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {steps.map((s) => (
          <div key={s.num} className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2 flex flex-col justify-between">
            <div className="space-y-1.5">
              <span className="w-6 h-6 rounded-lg bg-primary/20 text-primary font-bold text-xs flex items-center justify-center">
                {s.num}
              </span>
              <h5 className="font-bold text-white text-xs">{s.title}</h5>
              <p className="text-[11px] text-gray-400 leading-relaxed">{s.desc}</p>
            </div>
            {s.action && (
              <button
                onClick={s.action}
                className="mt-2 flex items-center justify-center gap-1.5 w-full py-1.5 px-3 rounded-xl bg-primary hover:bg-primary/90 text-white font-medium text-xs transition-colors"
              >
                <Download size={13} /> {s.actionLabel}
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Benefits for Non-Technical Users */}
      <div className="p-3.5 rounded-2xl bg-emerald-950/20 border border-emerald-500/20 space-y-2">
        <h5 className="font-bold text-emerald-300 flex items-center gap-1.5 text-xs">
          <ShieldCheck size={14} /> Key Advantages of Local AI (Ollama)
        </h5>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px]">
          <div className="flex items-start gap-2">
            <Zap size={14} className="text-amber-400 shrink-0 mt-0.5" />
            <span><strong>100% Free:</strong> No recurring monthly subscriptions or API token charges.</span>
          </div>
          <div className="flex items-start gap-2">
            <ShieldCheck size={14} className="text-cyan-400 shrink-0 mt-0.5" />
            <span><strong>Strict Privacy:</strong> Your source code and IP never leave your local machine.</span>
          </div>
          <div className="flex items-start gap-2">
            <HardDrive size={14} className="text-purple-400 shrink-0 mt-0.5" />
            <span><strong>Offline Capable:</strong> Build and iterate anywhere without an Internet connection.</span>
          </div>
        </div>
      </div>

      {/* FAQ for Beginners */}
      <div className="space-y-2">
        <h5 className="font-bold text-white uppercase text-[11px] tracking-wider flex items-center gap-1.5">
          <HelpCircle size={13} className="text-primary" /> Frequently Asked Questions
        </h5>
        <div className="space-y-1.5 text-[11px] text-gray-400">
          <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
            <span className="font-semibold text-gray-200 block mb-0.5">Can I run local models without a dedicated GPU?</span>
            <span>Yes! Ollama automatically falls back to CPU & System RAM. For best performance on CPU, choose lightweight models like <strong>Qwen 2.5 Coder 1.5B</strong> or <strong>Llama 3.2 3B</strong>.</span>
          </div>
          <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
            <span className="font-semibold text-gray-200 block mb-0.5">How do I switch or download additional models?</span>
            <span>Go to the "Model Library" tab and click "Download In-App" or "Run in Terminal". Ollama caches models locally and allows instant switching anytime.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
