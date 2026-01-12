/**
 * Force Vite HMR Reload Script
 * 
 * This script can be used to force Vite to reload by touching a file.
 * Run with: node .cursor/rules/vite-hmr-reload/force-reload.js
 */

import { writeFileSync, readFileSync } from 'fs';
import { join } from 'path';

const viteConfigPath = join(process.cwd(), 'vite.config.js');

try {
  // Read the current vite.config.js
  const content = readFileSync(viteConfigPath, 'utf-8');
  
  // Add a comment with timestamp to trigger file watcher
  const timestamp = `// HMR trigger: ${new Date().toISOString()}\n`;
  
  // Only add if it's not already there (to avoid infinite comments)
  if (!content.includes('HMR trigger')) {
    const updatedContent = timestamp + content;
    writeFileSync(viteConfigPath, updatedContent, 'utf-8');
    console.log('✅ Vite config touched - HMR should reload');
  } else {
    // Update the existing timestamp
    const updatedContent = content.replace(
      /\/\/ HMR trigger: .+\n/,
      timestamp
    );
    writeFileSync(viteConfigPath, updatedContent, 'utf-8');
    console.log('✅ Vite config updated - HMR should reload');
  }
} catch (error) {
  console.error('❌ Error forcing reload:', error.message);
  process.exit(1);
}
