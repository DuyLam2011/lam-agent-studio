import { AgentCombo } from '../../types/agent-combo';
import { standardBuiltinAgentCombos } from '../../data/defaultAgentCombos';

export interface WorkspaceComboAuditResult {
  recommendedComboId: string;
  recommendedComboName: string;
  confidence: number;
  detectedSignals: string[];
  analysisSummary: string;
  allComboScores: Array<{ comboId: string; comboName: string; score: number; reasons: string[] }>;
}

interface PackageManifest {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  scripts?: Record<string, string>;
}

const safeParseJson = <T>(content: string): T | null => {
  try { return JSON.parse(content); } catch { return null; }
};

export const scoreWorkspaceForCombos = (
  manifestContent?: string | null,
  dirEntries: string[] = [],
  availableCombos: AgentCombo[] = standardBuiltinAgentCombos
): WorkspaceComboAuditResult => {
  const pkg = manifestContent ? safeParseJson<PackageManifest>(manifestContent) : null;
  const deps = { ...pkg?.dependencies, ...pkg?.devDependencies };
  const depNames = Object.keys(deps).map(d => d.toLowerCase());
  const scriptTexts = Object.values(pkg?.scripts || {}).join(' ').toLowerCase();
  const dirs = dirEntries.map(e => e.toLowerCase());

  const scores: Record<string, { score: number; reasons: string[] }> = {
    'combo-fullstack-web': { score: 10, reasons: [] },
    'combo-backend-api-security': { score: 10, reasons: [] },
    'combo-backend-cronjob-worker': { score: 5, reasons: [] },
    'combo-rapid-refactor-duo': { score: 5, reasons: [] },
  };

  // Fullstack Web Detection
  const hasFrontend = depNames.some(d => ['react', 'vue', 'svelte', 'solid-js', 'next', 'nuxt', 'vite', 'tailwindcss'].includes(d));
  const hasBackend = depNames.some(d => ['express', 'fastify', 'koa', 'nestjs', 'hapi', 'restify'].includes(d)) || dirs.some(d => ['api', 'routes', 'controllers', 'server'].includes(d));
  if (hasFrontend && hasBackend) {
    scores['combo-fullstack-web'].score += 75;
    scores['combo-fullstack-web'].reasons.push('Phát hiện đầy đủ cấu trúc Fullstack: Frontend UI Framework kết hợp Backend API');
  } else if (hasFrontend) {
    scores['combo-fullstack-web'].score += 45;
    scores['combo-fullstack-web'].reasons.push('Phát hiện Frontend framework & UI layer');
  }

  // High Security API Detection
  const hasAuth = depNames.some(d => ['jsonwebtoken', 'bcrypt', 'argon2', 'passport', 'auth0', 'helmet', 'cors', 'zod', 'joi'].includes(d));
  const hasDb = depNames.some(d => ['pg', 'mysql2', 'mongoose', 'prisma', 'typeorm', 'sqlite3', 'knex'].includes(d));
  if (hasAuth || hasDb) {
    const pts = (hasAuth ? 45 : 0) + (hasDb ? 35 : 0);
    scores['combo-backend-api-security'].score += pts;
    scores['combo-backend-api-security'].reasons.push(`Phát hiện cơ chế bảo mật xác thực (JWT/bcrypt/helmet: ${hasAuth}) và Database storage: ${hasDb}`);
  }

  // Cronjob & Async Worker Detection
  const hasCron = depNames.some(d => ['node-cron', 'cron', 'agenda', 'bull', 'bullmq', 'kue', 'bee-queue', 'amqplib'].includes(d)) ||
    dirs.some(d => ['cron', 'crons', 'workers', 'jobs', 'queues'].includes(d)) ||
    /worker|queue|cron|scheduler/i.test(scriptTexts);
  if (hasCron) {
    scores['combo-backend-cronjob-worker'].score += 80;
    scores['combo-backend-cronjob-worker'].reasons.push('Phát hiện module lập lịch Cronjobs và xử lý hàng đợi background workers');
  }

  // Refactor Duo Detection
  if (dirs.length > 15 || depNames.length > 30) {
    scores['combo-rapid-refactor-duo'].score += 55;
    scores['combo-rapid-refactor-duo'].reasons.push('Quy mô repository lớn, cần phối hợp refactor và rà soát QA chống regression');
  }

  const allComboScores = availableCombos.map(combo => {
    const s = scores[combo.id] || { score: 10, reasons: ['Combo tiêu chuẩn linh hoạt'] };
    return { comboId: combo.id, comboName: combo.name, score: s.score, reasons: s.reasons };
  }).sort((a, b) => b.score - a.score);

  const top = allComboScores[0];
  const detectedSignals = top.reasons.length > 0 ? top.reasons : ['Cấu trúc dự án tổng quát'];
  const confidence = Math.min(0.98, Math.max(0.65, top.score / 100));

  return {
    recommendedComboId: top.comboId,
    recommendedComboName: top.comboName,
    confidence,
    detectedSignals,
    analysisSummary: `Đã phân tích cấu trúc workspace. Đề xuất sử dụng [${top.comboName}] (độ tin cậy: ${(confidence * 100).toFixed(0)}%).`,
    allComboScores
  };
};

export const auditWorkspaceFolderForCombo = async (
  workspacePath: string,
  availableCombos: AgentCombo[] = standardBuiltinAgentCombos
): Promise<WorkspaceComboAuditResult> => {
  let pkgContent: string | null = null;
  let dirEntries: string[] = [];

  if (typeof window !== 'undefined') {
    try {
      const pkgRes = await (window as any).lamApi?.fs?.readFile?.(`${workspacePath}/package.json`);
      if (pkgRes?.success && pkgRes.data) pkgContent = pkgRes.data;
    } catch {}
    try {
      const listRes = await (window as any).lamApi?.fs?.listDir?.(workspacePath);
      if (listRes?.success && Array.isArray(listRes.data)) {
        dirEntries = listRes.data.map((d: any) => (typeof d === 'string' ? d : d.name));
      }
    } catch {}
  }

  return scoreWorkspaceForCombos(pkgContent, dirEntries, availableCombos);
};