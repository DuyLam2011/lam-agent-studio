const fs = require('fs/promises');
const path = require('path');

const checkIsIgnored = async (targetPath) => {
  if (targetPath.includes('node_modules') || targetPath.includes('.git')) return true;
  return false;
};

const searchRecursive = async (currentPath, query, results) => {
  try {
    if (await checkIsIgnored(currentPath)) return;
    
    const stat = await fs.stat(currentPath);
    if (stat.isDirectory()) {
      const files = await fs.readdir(currentPath);
      for (const f of files) {
        if (f.startsWith('.')) continue; // Skip hidden
        await searchRecursive(path.join(currentPath, f), query, results);
      }
    } else if (stat.isFile()) {
      const ext = path.extname(currentPath).toLowerCase();
      const skipExts = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp', '.pdf', '.zip', '.tar', '.gz', '.mp4', '.mp3', '.wav', '.exe', '.dll'];
      if (skipExts.includes(ext)) return;

      const content = await fs.readFile(currentPath, 'utf-8');
      const lines = content.split('\n');
      lines.forEach((line, index) => {
        if (line.toLowerCase().includes(query.toLowerCase())) {
          results.push({
            file: currentPath,
            line: index + 1,
            content: line.trim()
          });
        }
      });
    }
  } catch (e) {
    // skip
  }
};

(async () => {
  const query = 't';
  const dirPath = 'd:\\Documents\\github.com\\lam-agent-studio\\src';
  const results = [];
  try {
    await searchRecursive(dirPath, query, results);
    results.sort((a, b) => a.file.localeCompare(b.file));
    console.log("Success! Found:", results.length, "results");
  } catch (error) {
    console.error("Failed:", error.message);
  }
})();
