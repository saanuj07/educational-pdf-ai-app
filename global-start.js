#!/usr/bin/env node
const { spawn } = require('child_process');
const path = require('path');

const projectPath = "D:\\Summer Ceritficate\\my-educational-app";

console.log('Starting Educational PDF AI App...');
console.log(`Project location: ${projectPath}`);

process.chdir(projectPath);

const npm = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  shell: true,
  cwd: projectPath
});

npm.on('error', (error) => {
  console.error(`Error starting app: ${error.message}`);
});

npm.on('close', (code) => {
  console.log(`App process exited with code ${code}`);
});
