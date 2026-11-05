import type { AgentRole, TriageLevel, TriageCategory, ModelTier, TriageResult, ModelTierAllocation } from '../types';

export type { TriageLevel, TriageCategory, ModelTier, TriageResult, ModelTierAllocation };

export class ModelRegistry {
  private fastModel: ModelTierAllocation;
  private reasoningModel: ModelTierAllocation;

  constructor(
    fastOverride?: Partial<ModelTierAllocation>,
    reasoningOverride?: Partial<ModelTierAllocation>
  ) {
    this.fastModel = {
      tier: 'Tier-Fast',
      modelId: 'antigravity-3.8-flash',
      provider: 'antigravity',
      ...fastOverride
    };
    this.reasoningModel = {
      tier: 'Tier-Reasoning',
      modelId: 'gemini-1.5-pro',
      provider: 'gemini',
      ...reasoningOverride
    };
  }

  public getModelForRole(role: AgentRole): ModelTierAllocation {
    if (role === 'scout') {
      return this.fastModel;
    }
    return this.reasoningModel;
  }
}

export class FatherAgent {
  private registry: ModelRegistry;

  constructor(registry?: ModelRegistry) {
    this.registry = registry || new ModelRegistry();
  }

  public getModelForRole(role: AgentRole): ModelTierAllocation {
    return this.registry.getModelForRole(role);
  }

  public triageTask(prompt: string): TriageResult {
    const text = (prompt || '').trim().toLowerCase();

    // Level 2 (Investigative): Search, explore, explain, trace without mutation
    const isInvestigative =
      /^(hãy\s+)?(tìm|tìm\s+kiếm|quét|cho\s+tôi\s+biết|ở\s+đâu|giải\s+thích|tại\s+sao|phân\s+tích\s+nguyên\s+nhân|how|why|where|explain|find|locate|search|what\s+is)/i.test(text) &&
      !/(sửa|viết|fix|patch|implement|tạo|refactor|cập\s+nhật|thay\s+đổi|thêm|build)/i.test(text);

    if (isInvestigative) {
      return {
        level: 2,
        category: 'investigative',
        pipeline: ['scout', 'father'],
        rationale: 'Yêu cầu trinh sát/tra cứu thông tin: Kích hoạt Scout thu thập Context Map trước khi Father phản hồi.'
      };
    }

    // Level 1 (Direct): Simple local fix, typo, single line or localized patch
    const isDirectSimpleFix =
      /(fix\s+typo|sửa\s+lỗi\s+chính\s+tả|đổi\s+tên|rename|sửa\s+dòng|chỉ\s+sửa|quick\s+fix|sửa\s+cục\s+bộ|sửa\s+1\s+chỗ)/i.test(text) ||
      (text.length < 60 && /(sửa|fix|thay\s+đổi)/i.test(text) && !/(toàn\s+bộ|hệ\s+thống|kiến\s+trúc|refactor|rewrite|module)/i.test(text));

    if (isDirectSimpleFix) {
      return {
        level: 1,
        category: 'direct',
        pipeline: ['engineer'],
        rationale: 'Yêu cầu đơn giản, cục bộ: Kích hoạt trực tiếp Engineer thi công và tự động kiểm tra typecheck.'
      };
    }

    // Level 3 (Complex Pipeline): Features, refactoring, multi-file architectural changes
    return {
      level: 3,
      category: 'complex_pipeline',
      pipeline: ['scout', 'architect', 'engineer', 'reviewer'],
      rationale: 'Tác vụ phức tạp/đa bước: Kích hoạt chuỗi khép kín Scout ➔ Architect ➔ Engineer ➔ Reviewer.'
    };
  }
}
