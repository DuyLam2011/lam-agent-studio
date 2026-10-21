export interface OllamaModelInfo {
  id: string;
  name: string;
  tag: string;
  category: 'coding' | 'reasoning' | 'lightweight' | 'flagship';
  parameterSize: string;
  downloadSize: string;
  ramRequirement: string;
  description: string;
  recommendedFor: string;
  isTopPick?: boolean;
}

export const RECOMMENDED_OLLAMA_MODELS: OllamaModelInfo[] = [
  {
    id: 'qwen2.5-coder:7b',
    name: 'Qwen 2.5 Coder 7B',
    tag: 'qwen2.5-coder:7b',
    category: 'coding',
    parameterSize: '7B Parameters',
    downloadSize: '4.7 GB',
    ramRequirement: '8 GB - 16 GB RAM',
    description: 'Premier code-focused model. Exceptional understanding of Git diffs, bug repairs, and JSON tool calls.',
    recommendedFor: 'Recommended for daily coding tasks and agentic workflows in Agent Studio.',
    isTopPick: true
  },
  {
    id: 'deepseek-r1:8b',
    name: 'DeepSeek-R1 8B',
    tag: 'deepseek-r1:8b',
    category: 'reasoning',
    parameterSize: '8B Parameters',
    downloadSize: '4.9 GB',
    ramRequirement: '8 GB - 16 GB RAM',
    description: 'Deep reasoning model with step-by-step thinking and self-correction before outputting solutions.',
    recommendedFor: 'Ideal for Software Architect, Code Reviewer, and complex algorithm analysis.',
    isTopPick: true
  },
  {
    id: 'qwen2.5-coder:1.5b',
    name: 'Qwen 2.5 Coder 1.5B',
    tag: 'qwen2.5-coder:1.5b',
    category: 'lightweight',
    parameterSize: '1.5B Parameters',
    downloadSize: '986 MB',
    ramRequirement: '4 GB - 8 GB RAM',
    description: 'Ultra-lightweight, high-speed execution. Runs smoothly on standard laptops without dedicated GPUs.',
    recommendedFor: 'Entry-level machines, ultrabooks, and rapid local iteration.'
  },
  {
    id: 'llama3.2:3b',
    name: 'Llama 3.2 3B',
    tag: 'llama3.2:3b',
    category: 'lightweight',
    parameterSize: '3B Parameters',
    downloadSize: '2.0 GB',
    ramRequirement: '6 GB - 8 GB RAM',
    description: 'Compact general-purpose model by Meta with balanced comprehension and low memory footprint.',
    recommendedFor: 'General usage, automated summaries, and low-resource environments.'
  },
  {
    id: 'llama3.3:70b',
    name: 'Llama 3.3 70B',
    tag: 'llama3.3:70b',
    category: 'flagship',
    parameterSize: '70B Parameters',
    downloadSize: '43 GB',
    ramRequirement: '32 GB - 64 GB RAM / VRAM',
    description: 'Flagship open-weights model rivaling frontier cloud models, running 100% private and offline.',
    recommendedFor: 'High-end workstations, multi-GPU servers (RTX 3090/4090/A6000).'
  }
];
