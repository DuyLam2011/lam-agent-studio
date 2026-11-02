import React from 'react';
import { SkillStudioFormData } from '../../../../types/skill-studio';

interface SkillStudioFormFieldsProps {
  formData: SkillStudioFormData;
  onChange: (patch: Partial<SkillStudioFormData>) => void;
}

export const SkillStudioFormFields: React.FC<SkillStudioFormFieldsProps> = ({ formData, onChange }) => {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <div>
          <label className="text-[10px] font-semibold text-app-text uppercase tracking-wider block mb-1">Tên Hiển Thị (Title)</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder="e.g. Senior Code Review"
            className="w-full surface-input border border-subtle rounded-xl p-2 text-xs text-app-text outline-none focus:border-primary transition-colors"
          />
        </div>

        <div>
          <label className="text-[10px] font-semibold text-app-text uppercase tracking-wider block mb-1">Thư Mục (Folder snake_case)</label>
          <input
            type="text"
            value={formData.folderName}
            onChange={(e) => onChange({ folderName: e.target.value.toLowerCase().replace(/[^a-z0-9_\-]/g, '_') })}
            placeholder="e.g. code_review_guard"
            className="w-full surface-input border border-subtle rounded-xl p-2 text-xs text-app-text font-mono outline-none focus:border-primary transition-colors"
          />
        </div>

        <div>
          <label className="text-[10px] font-semibold text-app-text uppercase tracking-wider block mb-1">Danh Mục (Category)</label>
          <select
            value={formData.category}
            onChange={(e) => onChange({ category: e.target.value as any })}
            className="w-full surface-input border border-subtle rounded-xl p-2 text-xs text-app-text outline-none focus:border-primary transition-colors"
          >
            <option value="code-quality">Code Quality</option>
            <option value="testing">Testing & QA</option>
            <option value="security">Security Audit</option>
            <option value="architecture">Architecture</option>
            <option value="workflow">Workflow & Automation</option>
            <option value="devops">DevOps & Tooling</option>
            <option value="general">General Capability</option>
          </select>
        </div>
      </div>

      <div>
        <label className="text-[10px] font-semibold text-app-text uppercase tracking-wider block mb-1">Mô Tả & Từ Khóa Kích Hoạt (Router Trigger Description)</label>
        <input
          type="text"
          value={formData.description}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="Mô tả khi nào Agent nên kích hoạt skill này (ví dụ: Trigger on 'audit code' or '/review')..."
          className="w-full surface-input border border-subtle rounded-xl p-2 text-xs text-app-text outline-none focus:border-primary transition-colors"
        />
      </div>
    </div>
  );
};
