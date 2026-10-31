import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const deploymentVersion = process.env.VERCEL_DEPLOYMENT_ID || process.env.VERCEL_GIT_COMMIT_SHA
  || execFileSync('git', ['rev-parse', 'HEAD'], { cwd: projectRoot, encoding: 'utf8' }).trim();

const nextConfig = {
  env: {
    NEXT_PUBLIC_DEPLOYMENT_VERSION: deploymentVersion,
  },
  turbopack: {
    root: projectRoot,
  },
};
export default nextConfig;
