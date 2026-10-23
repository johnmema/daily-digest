import { execFileSync } from 'node:child_process'
// Compile the two dependency-free modules for Node's built-in test runner.
execFileSync('node_modules/.bin/tsc', ['lib/digest-auth.ts','lib/digest-payload.ts','--outDir','.test-build','--module','commonjs','--target','es2022','--skipLibCheck'], {stdio:'inherit'})
execFileSync(process.execPath, ['--test','tests/digest.test.mjs'], {stdio:'inherit'})
