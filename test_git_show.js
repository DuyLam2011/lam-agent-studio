const { simpleGit } = require('simple-git');
const path = require('path');

async function test() {
  const repoPath = 'd:\\Documents\\github.com\\FirewallRuleTool';
  const git = simpleGit(repoPath);
  
  const status = await git.status();
  console.log("Modified files:", status.modified);
  console.log("Not added files:", status.not_added);
  
  const filesToTest = [...status.modified, ...status.not_added];
  
  if (filesToTest.length > 0) {
    const filePath = filesToTest[0];
    console.log("Trying to get content for:", filePath);
    
    try {
      const content = await git.show([`HEAD:${filePath}`]);
      console.log(`Content length for ${filePath}:`, content.length);
      console.log("First 100 chars:", content.substring(0, 100));
    } catch (e) {
      console.error("Error getting content:", e.message);
    }
  } else {
    console.log("No modified files to test.");
  }
}

test();
