import React from 'react';
import { BookTemplate, ArrowRight, Tag, X } from 'lucide-react';
import { SKILL_TEMPLATES } from '../../../../services/skills/skillStudioTemplates';
import { SkillTemplate } from '../../../../types/skill-studio';

interface SkillTemplatesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: SkillTemplate) => void;
}

export const SkillTemplatesDrawer: React.FC<SkillTemplatesDrawerProps> = ({
  isOpen,
  onClose,
  onSelectTemplate
}) => {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-y-0 right-0 w-80 sm:w-96 surface-modal border-l border-subtle shadow-2xl flex flex-col z-20 animate-in slide-in-from-right duration-200">
      <div className="p-3.5 border-b border-subtle surface-header flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookTemplate size={15} className="text-primary" />
          <h4 className="text-xs font-semibold text-app-text">Kho Template Skill Chuẩn Hóa</h4>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-muted hover:text-app-text hover:bg-primary/10 transition-colors cursor-pointer"
        >
          <X size={15} />
        </button>
      </div>

      <div className="flex-1 p-3.5 overflow-y-auto custom-scrollbar space-y-3">
        <p className="text-[11px] text-muted">
          Chọn template xây dựng sẵn theo chuẩn Antigravity Progressive Disclosure để nạp cấu trúc và chỉ thị tối ưu ngay lập tức.
        </p>

        <div className="space-y-2.5">
          {SKILL_TEMPLATES.map((tpl: SkillTemplate) => (
            <div
              key={tpl.id}
              className="surface-card p-3 rounded-xl border border-subtle hover:border-primary/40 transition-all flex flex-col gap-2 group"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h5 className="text-xs font-semibold text-app-text group-hover:text-primary transition-colors">
                    {tpl.title}
                  </h5>
                  <span className="font-mono text-[9px] text-muted">
                    folder: {tpl.defaultFolderName}
                  </span>
                </div>
                <span className="px-1.5 py-0.5 rounded text-[9px] uppercase font-mono font-bold bg-primary/15 text-primary border border-primary/20 shrink-0">
                  {tpl.category}
                </span>
              </div>

              <p className="text-[11px] text-muted line-clamp-2 leading-relaxed">
                {tpl.description}
              </p>

              <div className="flex items-center justify-between pt-1 border-t border-subtle mt-0.5">
                <div className="flex items-center gap-1 flex-wrap">
                  {tpl.tags.map((t: string) => (
                    <span key={t} className="text-[9px] text-muted flex items-center gap-0.5 font-mono">
                      <Tag size={8} /> {t}
                    </span>
                  ))}
                </div>

                <button
                  onClick={() => {
                    onSelectTemplate(tpl);
                    onClose();
                  }}
                  className="px-2 py-1 rounded-lg bg-primary/20 hover:bg-primary text-primary hover:text-white text-[10px] font-semibold transition-all flex items-center gap-1 cursor-pointer"
                >
                  <span>Áp Dụng</span>
                  <ArrowRight size={10} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
