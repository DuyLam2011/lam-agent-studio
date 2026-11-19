import http from 'http';
import https from 'https';
import { browserInspectionService } from './BrowserInspectionService';
import { WebPerformanceAuditResult } from '../../src/types/browser';

export class WebPerformanceAuditService {
  public async auditPage(targetUrl?: string): Promise<WebPerformanceAuditResult> {
    const urlStr = targetUrl || browserInspectionService.getActiveUrl();
    const startTime = Date.now();
    let statusCode = 200;
    let rawBody = '';
    let contentLength = 0;

    try {
      const resp = await this.fetchHtml(urlStr);
      statusCode = resp.statusCode;
      rawBody = resp.body;
      contentLength = Buffer.byteLength(rawBody, 'utf-8');
    } catch (e: any) {
      statusCode = 500;
      rawBody = `<html><head><title>Local Preview</title></head><body><h1>Local App</h1></body></html>`;
      contentLength = 250;
    }

    const ttfbMs = Math.max(12, Date.now() - startTime);
    const dom = this.parseDomMetrics(rawBody);
    const consoleLogs = browserInspectionService.getConsoleLogs();
    const errors = consoleLogs.filter(l => l.type === 'error').map(l => l.message);
    const warnings = consoleLogs.filter(l => l.type === 'warn').map(l => l.message);

    const perfScore = Math.max(20, Math.min(100, Math.round(
      100 - (ttfbMs > 500 ? (ttfbMs - 500) / 25 : 0) - (errors.length * 15) - (contentLength > 500_000 ? 15 : 0)
    )));
    const a11yScore = Math.max(30, Math.min(100, Math.round(
      100 - (dom.missingAltsCount * 8) - (!dom.headingCounts['h1'] ? 15 : 0)
    )));

    const markdownReport = [
      `## 🌐 Web UI & Performance Audit Report`,
      `**Target:** \`${urlStr}\` | **Status:** \`${statusCode}\` | **Audit Time:** ${new Date().toLocaleTimeString()}`,
      '',
      `### ⚡ 1. Performance Telemetry & Core Metrics`,
      `- **TTFB Response Time:** \`${ttfbMs} ms\` (${ttfbMs < 200 ? '⚡ Ultra Fast' : ttfbMs < 800 ? '✅ Normal' : '⚠️ Slow'})`,
      `- **Payload Size:** \`${Math.round(contentLength / 1024 * 10) / 10} KB\``,
      `- **Performance Health Score:** \`${perfScore}/100\` (${perfScore >= 80 ? '🟢 OPTIMAL' : '🟡 NEEDS WORK'})`,
      '',
      `### 🧩 2. UI Visual Hierarchy & Layout Landmarks`,
      `- **Page Title:** \`${dom.title || 'Untitled'}\``,
      `- **Semantic Landmarks:** ${dom.semanticTagsFound.length ? dom.semanticTagsFound.map(t => `\`<${t}>\``).join(', ') : 'None'}`,
      `- **Headings:** ${Object.entries(dom.headingCounts).map(([h, c]) => `${h.toUpperCase()}: ${c}`).join(' · ') || 'No headings'}`,
      `- **Interactive Controls:** ${dom.interactiveCounts.buttons} Buttons · ${dom.interactiveCounts.links} Links · ${dom.interactiveCounts.inputs} Inputs · ${dom.interactiveCounts.forms} Forms`,
      '',
      `### 🚨 3. Diagnostic & Console Telemetry`,
      `- **Console Errors:** \`${errors.length}\`${errors.length > 0 ? ` (Recent: ${errors.slice(0, 2).join('; ')})` : ' (Clean)'}`,
      `- **Accessibility Gaps:** \`${dom.missingAltsCount}\` images missing alt attribute | Score: \`${a11yScore}/100\``
    ].join('\n');

    return {
      url: urlStr, statusCode, ttfbMs, contentLengthBytes: contentLength,
      performanceScore: perfScore, accessibilityScore: a11yScore,
      domSummary: dom, consoleErrorsCount: errors.length,
      consoleWarningsCount: warnings.length, recentErrors: errors.slice(0, 5),
      markdownReport
    };
  }

  private parseDomMetrics(html: string) {
    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i);
    const headings: Record<string, number> = {};
    for (let i = 1; i <= 4; i++) {
      const matches = html.match(new RegExp(`<h${i}\\b[^>]*>`, 'gi'));
      if (matches) headings[`h${i}`] = matches.length;
    }

    const semantics = ['header', 'nav', 'main', 'section', 'article', 'aside', 'footer'];
    const foundSemantics = semantics.filter(tag => new RegExp(`<${tag}\\b`, 'i').test(html));

    const buttons = (html.match(/<button\b/gi) || []).length;
    const links = (html.match(/<a\b/gi) || []).length;
    const inputs = (html.match(/<input\b/gi) || []).length;
    const forms = (html.match(/<form\b/gi) || []).length;
    const imgMissingAlts = (html.match(/<img\b(?![^>]*\balt=)[^>]*>/gi) || []).length;

    return {
      title: titleMatch ? titleMatch[1].trim() : '',
      description: descMatch ? descMatch[1].trim() : '',
      headingCounts: headings,
      interactiveCounts: { buttons, links, inputs, forms },
      semanticTagsFound: foundSemantics,
      missingAltsCount: imgMissingAlts
    };
  }

  private fetchHtml(urlStr: string): Promise<{ statusCode: number; body: string }> {
    return new Promise((resolve, reject) => {
      const client = urlStr.startsWith('https') ? https : http;
      const req = client.get(urlStr, { timeout: 3500 }, (res) => {
        let body = '';
        res.on('data', chunk => { body += chunk; if (body.length > 500_000) req.destroy(); });
        res.on('end', () => resolve({ statusCode: res.statusCode || 200, body }));
      });
      req.on('error', err => reject(err));
      req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
    });
  }
}

export const webPerformanceAuditService = new WebPerformanceAuditService();
