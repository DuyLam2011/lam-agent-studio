import React, { useState, useEffect } from 'react';
import { Search, ChevronRight, ChevronDown, Folder, FolderOpen, Box, CaseSensitive, WholeWord, Replace, FileType2, FileJson, FileCode2, FileCode, Image as ImageIcon, FileTerminal, FileText, X } from 'lucide-react';
import { useAgentStore } from '../store/useAgentStore';
import clsx from 'clsx';

interface SearchResult {
  file: string;
  line: number;
  content: string;
}

interface AugmentedSearchResult extends SearchResult {
  workspaceName: string;
  repoPath: string;
}

const getFileIcon = (fileName: string) => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'ts':
    case 'tsx':
      return <FileType2 size={14} className="text-blue-400 shrink-0" />;
    case 'js':
    case 'jsx':
      return <FileType2 size={14} className="text-yellow-400 shrink-0" />;
    case 'json':
      return <FileJson size={14} className="text-yellow-200 shrink-0" />;
    case 'css':
      return <FileCode2 size={14} className="text-blue-300 shrink-0" />;
    case 'html':
      return <FileCode size={14} className="text-orange-400 shrink-0" />;
    case 'md':
      return <FileText size={14} className="text-purple-400 shrink-0" />;
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'svg':
    case 'gif':
    case 'webp':
      return <ImageIcon size={14} className="text-green-400 shrink-0" />;
    case 'sh':
    case 'bat':
    case 'cmd':
      return <FileTerminal size={14} className="text-green-300 shrink-0" />;
    default:
      return <FileCode size={14} className="text-gray-400 shrink-0" />;
  }
};

export const SearchPanel: React.FC = () => {
  const { systemContext, setActiveFile, searchTarget, setSearchTarget, searchQuery, setSearchQuery, searchFileQuery, setSearchFileQuery } = useAgentStore();
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<Record<string, Record<string, Record<string, AugmentedSearchResult[]>>>>({});
  const [expandedFiles, setExpandedFiles] = useState<Record<string, boolean>>({});
  
  // Search Options
  const [matchCase, setMatchCase] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [isReplaceMode, setIsReplaceMode] = useState(false);
  const [replaceQuery, setReplaceQuery] = useState('');
  const [isReplacing, setIsReplacing] = useState(false);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim() && !searchFileQuery.trim()) {
      setResults({});
      setExpandedFiles({});
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    let allResults: AugmentedSearchResult[] = [];
    const queryToSearch = searchQuery;
    const searchOptions = { matchCase, wholeWord, filePattern: searchFileQuery };

    const targetWs = systemContext.workspaces.find(w => w.id === searchTarget);

    if (targetWs) {
      for (const folder of targetWs.folders) {
        // @ts-ignore
        const res = await window.lamApi?.fs?.search(queryToSearch, folder, searchOptions);
        if (res?.success) {
          const mapped = res.data.map((r: SearchResult) => ({ ...r, workspaceName: targetWs.name, repoPath: folder }));
          allResults = [...allResults, ...mapped];
        }
      }
    } else if (searchTarget) {
      const wsName = systemContext.workspaces.find(w => w.folders.includes(searchTarget))?.name || "Targeted Search";
      // @ts-ignore
      const res = await window.lamApi?.fs?.search(queryToSearch, searchTarget, searchOptions);
      if (res?.success) {
        allResults = res.data.map((r: SearchResult) => ({ ...r, workspaceName: wsName, repoPath: searchTarget }));
      }
    } else {
      for (const ws of systemContext.workspaces) {
        for (const folder of ws.folders) {
          // @ts-ignore
          const res = await window.lamApi?.fs?.search(queryToSearch, folder, searchOptions);
          if (res?.success) {
            const mapped = res.data.map((r: SearchResult) => ({ ...r, workspaceName: ws.name, repoPath: folder }));
            allResults = [...allResults, ...mapped];
          }
        }
      }
    }

    const grouped: Record<string, Record<string, Record<string, AugmentedSearchResult[]>>> = {};
    const expanded: Record<string, boolean> = {};

    allResults.forEach(r => {
      if (!grouped[r.workspaceName]) {
        grouped[r.workspaceName] = {};
        expanded[r.workspaceName] = true;
      }
      if (!grouped[r.workspaceName][r.repoPath]) {
        grouped[r.workspaceName][r.repoPath] = {};
        expanded[r.repoPath] = true;
      }
      if (!grouped[r.workspaceName][r.repoPath][r.file]) {
        grouped[r.workspaceName][r.repoPath][r.file] = [];
        expanded[r.file] = true;
      }
      grouped[r.workspaceName][r.repoPath][r.file].push(r);
    });

    setResults(grouped);
    setExpandedFiles(expanded);
    setIsSearching(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, searchFileQuery, searchTarget, matchCase, wholeWord, systemContext.activeWorkspaceId]);

  const toggleExpand = (key: string) => {
    setExpandedFiles(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const openFile = async (result: SearchResult) => {
    const fileName = result.file.split(/[/\\]/).pop() || result.file;
    
    try {
      // @ts-ignore
      const res = await window.lamApi?.fs?.readFile(result.file);
      if (res?.success) {
        setActiveFile({
          name: fileName,
          path: result.file,
          isDirectory: false,
          content: res.data,
          line: result.line,
          searchQuery: searchQuery
        });
      }
    } catch (e) {
      console.error("Failed to open file for search result", e);
    }
  };

  const handleReplaceAll = async () => {
    if (!searchQuery.trim() || isReplacing) return;
    
    // Get all unique file paths from current results
    const filesToReplace = new Set<string>();
    Object.values(results).forEach(repos => {
      Object.values(repos).forEach(files => {
        Object.keys(files).forEach(file => filesToReplace.add(file));
      });
    });

    if (filesToReplace.size === 0) return;

    setIsReplacing(true);
    let successCount = 0;

    for (const filePath of filesToReplace) {
      // @ts-ignore
      const res = await window.lamApi?.fs?.replace(filePath, searchQuery, replaceQuery, { matchCase, wholeWord });
      if (res?.success) successCount++;
    }

    setIsReplacing(false);
    
    // Trigger fresh search to clear replaced results
    executeSearch(searchQuery);
  };

  const escapeRegExp = (string: string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };

  const renderHighlighted = (text: string, highlight: string) => {
    if (!highlight.trim()) return <span>{text}</span>;

    try {
      const escaped = escapeRegExp(highlight);
      let flags = 'g';
      if (!matchCase) flags += 'i';
      
      const parts = text.split(new RegExp(`(${escaped})`, flags));
      return (
        <>
          {parts.map((part, i) => {
            const isMatch = matchCase ? part === highlight : part.toLowerCase() === highlight.toLowerCase();
            return isMatch ? 
              <span key={i} className="text-primary font-bold bg-primary/20 rounded-sm px-0.5">{part}</span> :
              <span key={i}>{part}</span>
          })}
        </>
      );
    } catch (e) {
      return <span>{text}</span>;
    }
  };

  // Calculate counts
  let fileCount = 0;
  let matchCount = 0;
  Object.values(results).forEach(repos => {
    Object.values(repos).forEach(files => {
      fileCount += Object.keys(files).length;
      matchCount += Object.values(files).flat().length;
    });
  });

  return (
    <div className="flex flex-col h-full overflow-hidden -mx-4 px-4">
      <form onSubmit={handleSearch} className="pb-3 shrink-0 border-b border-white/5 mb-2">
        <div className="mb-4 shrink-0">
          <div className="text-[10px] text-gray-500 font-bold uppercase mb-1 px-1">Target Scope</div>
          <div className="flex items-center gap-2">
            <select 
              value={searchTarget || ""}
              onChange={(e) => setSearchTarget(e.target.value === "" ? null : e.target.value)}
              className="bg-black/20 text-xs text-white px-2 py-1.5 rounded-lg border border-white/10 w-full outline-none focus:border-primary/50 transition-colors custom-scrollbar appearance-none"
              style={{ backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2214%22%20height%3D%2214%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%239ca3af%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center' }}
            >
              <option value="" className="bg-neutral-900 text-gray-300">-- All Workspaces --</option>
              {systemContext.workspaces.map(ws => (
                <optgroup key={ws.id} label={`Workspace: ${ws.name}`} className="bg-neutral-900">
                  <option value={ws.id} className="text-purple-400 font-bold">🎯 Entire Workspace: {ws.name}</option>
                  {ws.folders.map(f => (
                    <option key={f} value={f} className="text-gray-300">└─ {f.split(/[/\\]/).pop()}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-start gap-1">
          <button 
            type="button"
            onClick={() => setIsReplaceMode(!isReplaceMode)}
            className="mt-1 p-1 rounded hover:bg-white/10 text-gray-500 hover:text-white transition-colors"
          >
            <ChevronRight size={14} className={clsx("transition-transform duration-200", isReplaceMode && "rotate-90")} />
          </button>
          
          <div className="flex-1 space-y-1.5">
            <div className="relative flex items-center">
              <FileText size={14} className="absolute left-2 text-gray-500" />
              <input
                type="text"
                value={searchFileQuery}
                onChange={(e) => setSearchFileQuery(e.target.value)}
                placeholder="files to include (e.g. *.ts, src/)"
                className="w-full bg-black/40 border border-white/5 rounded text-xs text-white pl-7 pr-4 py-1.5 outline-none focus:border-primary/50 transition-colors"
              />
            </div>

            <div className="relative flex items-center">
              <Search size={14} className="absolute left-2 text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={searchTarget ? "Track down in target..." : "Track down in all workspaces..."}
                className="w-full bg-black/40 border border-white/5 rounded text-xs text-white pl-7 pr-16 py-1.5 outline-none focus:border-primary/50 transition-colors"
              />
              <div className="absolute right-1 flex items-center gap-0.5">
                <button 
                  type="button"
                  onClick={() => setMatchCase(!matchCase)}
                  className={clsx("p-1 rounded transition-colors text-[10px] font-bold", matchCase ? "bg-primary/20 text-primary border border-primary/30" : "hover:bg-white/10 text-gray-400 border border-transparent")}
                  title="Match Case"
                >
                  Aa
                </button>
                <button 
                  type="button"
                  onClick={() => setWholeWord(!wholeWord)}
                  className={clsx("p-1 rounded transition-colors text-[10px] font-bold", wholeWord ? "bg-primary/20 text-primary border border-primary/30" : "hover:bg-white/10 text-gray-400 border border-transparent")}
                  title="Match Whole Word"
                >
                  ab
                </button>
              </div>
            </div>

            {isReplaceMode && (
              <div className="relative flex items-center">
                <Replace size={14} className="absolute left-2 text-gray-500" />
                <input
                  type="text"
                  value={replaceQuery}
                  onChange={(e) => setReplaceQuery(e.target.value)}
                  placeholder="Replace with..."
                  className="w-full bg-black/40 border border-white/5 rounded text-xs text-white pl-7 pr-8 py-1.5 outline-none focus:border-primary/50 transition-colors"
                />
                <button 
                  type="button"
                  onClick={handleReplaceAll}
                  disabled={!searchQuery || isReplacing || matchCount === 0}
                  className="absolute right-1 p-1 rounded hover:bg-white/10 text-gray-400 disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
                  title="Replace All"
                >
                  <Replace size={12} />
                </button>
              </div>
            )}
          </div>
        </div>
      </form>

      <div className="flex-1 overflow-y-auto custom-scrollbar -mx-2 px-2">
        {isSearching && searchQuery && (
          <div className="text-xs text-gray-500 text-center py-4 animate-pulse">Searching code...</div>
        )}

        {!isSearching && matchCount > 0 && (
          <div className="text-[10px] uppercase text-gray-500 font-bold px-1 py-1 mb-2">
            {matchCount} results in {fileCount} files
          </div>
        )}

        {!isSearching && searchQuery && matchCount === 0 && (
          <div className="text-xs text-gray-500 text-center py-4">No results found.</div>
        )}

        {!isSearching && Object.entries(results).map(([wsName, repos]) => (
          <div key={wsName} className="mb-3">
            <div 
              onClick={() => toggleExpand(wsName)}
              className="flex items-center gap-1.5 text-xs text-white font-semibold hover:bg-white/10 px-1 py-1 rounded cursor-pointer group"
            >
              {expandedFiles[wsName] ? <ChevronDown size={14} className="shrink-0 text-gray-500 group-hover:text-white" /> : <ChevronRight size={14} className="shrink-0 text-gray-500 group-hover:text-white" />}
              <Box size={14} className="shrink-0 text-purple-400" />
              <span className="truncate">{wsName}</span>
            </div>

            {expandedFiles[wsName] && Object.entries(repos).map(([repoPath, files]) => (
              <div key={repoPath} className="ml-3 mt-1 border-l border-white/5 pl-2 mb-2">
                <div 
                  onClick={() => toggleExpand(repoPath)}
                  className="flex items-center gap-1.5 text-xs text-gray-300 hover:text-white hover:bg-white/10 px-1 py-1 rounded cursor-pointer group"
                >
                  {expandedFiles[repoPath] ? <ChevronDown size={14} className="shrink-0 text-gray-500 group-hover:text-white" /> : <ChevronRight size={14} className="shrink-0 text-gray-500 group-hover:text-white" />}
                  <FolderOpen size={14} className="shrink-0 text-yellow-500" />
                  <span className="truncate">{repoPath.split(/[/\\]/).pop()}</span>
                </div>

                {expandedFiles[repoPath] && Object.entries(files).map(([file, matches]) => {
                  const fileName = file.split(/[/\\]/).pop() || '';
                  const dirPath = file.substring(0, file.length - fileName.length - 1);
                  
                  return (
                    <div key={file} className="ml-4 mt-1">
                      <div 
                        onClick={() => toggleExpand(file)}
                        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white hover:bg-white/10 px-1 py-1 rounded cursor-pointer group"
                      >
                        {expandedFiles[file] ? <ChevronDown size={14} className="shrink-0 text-gray-600 group-hover:text-white" /> : <ChevronRight size={14} className="shrink-0 text-gray-600 group-hover:text-white" />}
                        {getFileIcon(fileName)}
                        <span className="truncate font-medium">{fileName}</span>
                      </div>
                      
                      {expandedFiles[file] && (
                        <div className="pl-6 mt-1 space-y-px">
                          {matches.map((match, idx) => (
                            <div 
                              key={idx}
                              onClick={() => openFile(match)}
                              className="group flex gap-2 text-[11px] text-gray-500 hover:text-white hover:bg-white/10 px-2 py-0.5 rounded cursor-pointer transition-colors"
                            >
                              <span className="text-gray-600 w-5 text-right shrink-0 select-none group-hover:text-primary/70">{match.line}</span>
                              <span className="truncate flex-1 font-mono group-hover:text-primary-100 whitespace-pre">
                                {renderHighlighted(match.content, searchQuery)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
