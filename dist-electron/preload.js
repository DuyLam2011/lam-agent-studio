"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("lamApi", {
  fs: {
    readDirectory: (dirPath) => electron.ipcRenderer.invoke("fs:readDirectory", dirPath),
    readFile: (filePath) => electron.ipcRenderer.invoke("fs:readFile", filePath),
    saveFile: (filePath, content) => electron.ipcRenderer.invoke("fs:saveFile", filePath, content),
    createFile: (dirPath, name) => electron.ipcRenderer.invoke("fs:createFile", dirPath, name),
    createFolder: (dirPath, name) => electron.ipcRenderer.invoke("fs:createFolder", dirPath, name),
    delete: (targetPath) => electron.ipcRenderer.invoke("fs:delete", targetPath),
    search: (query, dirPath, options) => electron.ipcRenderer.invoke("fs:search", query, dirPath, options),
    replace: (filePath, query, replacement, options) => electron.ipcRenderer.invoke("fs:replace", filePath, query, replacement, options)
  },
  minimizeWindow: () => electron.ipcRenderer.send("window-minimize"),
  maximizeWindow: () => electron.ipcRenderer.send("window-maximize"),
  closeWindow: () => electron.ipcRenderer.send("window-close"),
  settingsAPI: {
    loadSettings: () => electron.ipcRenderer.invoke("settings:load"),
    saveSettings: (data) => electron.ipcRenderer.invoke("settings:save", data)
  },
  workspaceAPI: {
    openDirectory: () => electron.ipcRenderer.invoke("dialog:openDirectory"),
    pickDirectory: () => electron.ipcRenderer.invoke("dialog:pickDirectory")
  },
  git: {
    status: (repoPath) => electron.ipcRenderer.invoke("git:status", repoPath),
    diff: (repoPath, filePath) => electron.ipcRenderer.invoke("git:diff", repoPath, filePath),
    add: (repoPath, filePath) => electron.ipcRenderer.invoke("git:add", repoPath, filePath),
    unstage: (repoPath, filePath) => electron.ipcRenderer.invoke("git:unstage", repoPath, filePath),
    commit: (repoPath, message, options) => electron.ipcRenderer.invoke("git:commit", repoPath, message, options),
    discard: (repoPath, filePath) => electron.ipcRenderer.invoke("git:discard", repoPath, filePath),
    getFileContent: (repoPath, filePath) => electron.ipcRenderer.invoke("git:getFileContent", repoPath, filePath),
    push: (repoPath) => electron.ipcRenderer.invoke("git:push", repoPath),
    pull: (repoPath, branchName) => electron.ipcRenderer.invoke("git:pull", repoPath, branchName),
    fetch: (repoPath) => electron.ipcRenderer.invoke("git:fetch", repoPath),
    branch: (repoPath) => electron.ipcRenderer.invoke("git:branch", repoPath),
    checkout: (repoPath, branchName) => electron.ipcRenderer.invoke("git:checkout", repoPath, branchName),
    clone: (url, localPath) => electron.ipcRenderer.invoke("git:clone", url, localPath)
  },
  github: {
    login: () => electron.ipcRenderer.invoke("github:login")
  },
  onWebSocketStatus: (callback) => {
    electron.ipcRenderer.on("ws-status", (_event, status) => callback(status));
  }
});
