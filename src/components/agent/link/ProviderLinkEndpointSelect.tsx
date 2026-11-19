import React from 'react';

export interface ProviderEndpointOption {
  id: string;
  name: string;
  defaultModel: string;
}

interface ProviderLinkEndpointSelectProps {
  label: string;
  provider: string;
  model: string;
  options: ProviderEndpointOption[];
  onSelectProvider: (providerId: string, defaultModel: string) => void;
  onChangeModel: (model: string) => void;
}

export const ProviderLinkEndpointSelect: React.FC<ProviderLinkEndpointSelectProps> = ({
  label,
  provider,
  model,
  options,
  onSelectProvider,
  onChangeModel
}) => {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</label>
      <select
        value={provider}
        onChange={(e) => {
          const opt = options.find((x) => x.id === e.target.value);
          onSelectProvider(e.target.value, opt?.defaultModel || '');
        }}
        className="text-xs bg-black/60 border border-white/10 rounded-lg p-2 text-white focus:outline-none"
      >
        {options.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
      <input
        type="text"
        value={model}
        onChange={(e) => onChangeModel(e.target.value)}
        placeholder="Model ID"
        className="text-[11px] font-mono bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-gray-300 focus:outline-none"
      />
    </div>
  );
};
