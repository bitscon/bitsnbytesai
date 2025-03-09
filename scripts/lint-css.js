
#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

// Define paths to lint
const SRC_PATH = path.join(__dirname, '..', 'src');

console.log('🔍 Linting CSS files...');

try {
  // Run Stylelint with auto-fix enabled
  execSync(`npx stylelint "${SRC_PATH}/**/*.css" --fix`, { stdio: 'inherit' });
  console.log('✅ CSS linting completed successfully!');
} catch (error) {
  console.error('❌ CSS linting failed with errors.');
  process.exit(1);
}
