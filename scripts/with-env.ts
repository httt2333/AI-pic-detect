#!/usr/bin/env node
/**
 * Environment-aware script wrapper
 *
 * Determines the env file to use and executes a command with dotenv-cli
 *
 * Usage:
 *   tsx scripts/with-env.ts <command> [args...]
 *   tsx scripts/with-env.ts --env=.env.production <command> [args...]
 *   tsx scripts/with-env.ts --env .env.production <command> [args...]
 *
 * Environment variables:
 *   ENV_FILE - specify env file (e.g., .env.production)
 *   NODE_ENV - auto-select .env.{NODE_ENV}
 *
 * Priority: --env argument > ENV_FILE env var > .env.{NODE_ENV} > .env.development (default)
 */
import { execSync } from 'child_process';

// Parse command line arguments
const args = process.argv.slice(2);

// Check for --env argument (supports both --env file and --env=file formats)
let envFile: string;
const envIndex = args.findIndex((arg) => arg.startsWith('--env'));

if (envIndex !== -1) {
  const envArg = args[envIndex];
  if (envArg.includes('=')) {
    // --env=.env.production format
    envFile = envArg.split('=')[1];
    if (!envFile) {
      console.error(
        '❌ Error: --env= requires a value (e.g., --env=.env.production)'
      );
      process.exit(1);
    }
    // Remove --env=... from args
    args.splice(envIndex, 1);
  } else {
    // --env .env.production format
    envFile = args[envIndex + 1];
    if (!envFile) {
      console.error(
        '❌ Error: --env requires a value (e.g., --env .env.production)'
      );
      process.exit(1);
    }
    // Remove --env and the value from args
    args.splice(envIndex, 2);
  }
} else {
  // Determine env file with priority:
  // 1. ENV_FILE environment variable
  // 2. .env.{NODE_ENV} based on NODE_ENV
  // 3. .env.development (default)
  envFile =
    process.env.ENV_FILE ||
    (process.env.NODE_ENV
      ? `.env.${process.env.NODE_ENV}`
      : '.env.development');
}

// Get command and arguments (after removing --env)
if (args.length === 0) {
  console.error('❌ Error: No command provided');
  process.exit(1);
}

const command = args.join(' ');

console.log(`📄 Loading environment from: ${envFile}`);
console.log(`▶️  Executing: ${command}\n`);

try {
  execSync(`dotenv -e ${envFile} -- ${command}`, {
    stdio: 'inherit',
    cwd: process.cwd(),
  });
} catch (error) {
  process.exit(1);
}
