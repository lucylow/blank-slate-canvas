#!/usr/bin/env node
/**
 * Lovable Secrets Validation Script
 * 
 * This script validates that all required Lovable secrets are properly configured
 * and accessible in the codebase. It checks:
 * 
 * Frontend Secrets:
 * - OpenAI: Required for AI analytics
 * - GEMINI: Optional for AI analytics (fallback)
 * - GOOGLE_MAPS_API_KEY: Optional for Google Maps integration
 * 
 * Backend Secrets:
 * - OpenWeatherMap_API_Key: Required for weather service
 * 
 * Edge Functions Secrets:
 * - LOVABLE_API_KEY: Required for AI gateway fallback
 * - SUPABASE_URL: Required for Supabase client
 * - SUPABASE_SERVICE_ROLE_KEY: Required for Supabase client
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const SECRETS = [
  // Frontend Secrets
  {
    name: 'OpenAI',
    required: true,
    description: 'OpenAI API key for AI analytics',
    location: 'src/api/aiAnalytics.ts',
    envVarName: 'import.meta.env.OPENAI',
    checkFunction: (content) => 
      content.includes('import.meta.env.OPENAI') && 
      content.includes('OpenAI API key not configured')
  },
  {
    name: 'GEMINI',
    required: false,
    description: 'Google Gemini API key for AI analytics (fallback)',
    location: 'src/api/aiAnalytics.ts',
    envVarName: 'import.meta.env.GEMINI',
    checkFunction: (content) => 
      content.includes('import.meta.env.GEMINI') && 
      (content.includes('GEMINI secret in Lovable') || content.includes('Gemini API key not configured'))
  },
  {
    name: 'GOOGLE_MAPS_API_KEY',
    required: false,
    description: 'Google Maps API key for maps integration',
    location: 'src/api/googleMaps.ts',
    envVarName: 'import.meta.env.GOOGLE_MAPS_API_KEY',
    checkFunction: (content) => 
      content.includes('import.meta.env.GOOGLE_MAPS_API_KEY')
  },
  // Backend Secrets
  {
    name: 'OpenWeatherMap_API_Key',
    required: true,
    description: 'OpenWeatherMap API key for weather service',
    location: 'app/services/openweathermap_service.py',
    envVarName: 'OpenWeatherMap_API_Key',
    checkFunction: (content) => 
      content.includes('OpenWeatherMap_API_Key') && 
      content.includes('secret in Lovable Cloud')
  },
  // Edge Functions Secrets
  {
    name: 'LOVABLE_API_KEY',
    required: true,
    description: 'Lovable API key for AI gateway fallback',
    location: 'supabase/functions',
    envVarName: 'LOVABLE_API_KEY',
    checkFunction: (content) => 
      content.includes('LOVABLE_API_KEY') && 
      content.includes('getEnvVar')
  },
  {
    name: 'SUPABASE_URL',
    required: true,
    description: 'Supabase project URL',
    location: 'supabase/functions',
    envVarName: 'SUPABASE_URL',
    checkFunction: (content) => 
      content.includes('SUPABASE_URL') && 
      content.includes('getEnvVar')
  },
  {
    name: 'SUPABASE_SERVICE_ROLE_KEY',
    required: true,
    description: 'Supabase service role key',
    location: 'supabase/functions',
    envVarName: 'SUPABASE_SERVICE_ROLE_KEY',
    checkFunction: (content) => 
      content.includes('SUPABASE_SERVICE_ROLE_KEY') && 
      content.includes('getEnvVar')
  },
];

function validateSecret(secret, projectRoot) {
  const filePath = join(projectRoot, secret.location);
  
  // For edge functions, check all function files
  if (secret.location.includes('supabase/functions')) {
    const functionFiles = [
      'supabase/functions/predict-tire-wear/index.ts',
      'supabase/functions/pit-window/index.ts',
      'supabase/functions/coaching/index.ts',
    ];
    
    let found = false;
    let error;
    
    for (const funcFile of functionFiles) {
      const fullPath = join(projectRoot, funcFile);
      if (existsSync(fullPath)) {
        try {
          const content = readFileSync(fullPath, 'utf-8');
          if (secret.checkFunction(content)) {
            found = true;
            break;
          }
        } catch (err) {
          error = `Error reading ${funcFile}: ${err.message}`;
        }
      }
    }
    
    return {
      secret,
      found,
      error: found ? undefined : error || `Secret usage not found in edge functions`,
    };
  }
  
  // For specific files
  if (!existsSync(filePath)) {
    return {
      secret,
      found: false,
      error: `File not found: ${filePath}`,
    };
  }
  
  try {
    const content = readFileSync(filePath, 'utf-8');
    const found = secret.checkFunction(content);
    
    return {
      secret,
      found,
      error: found ? undefined : `Secret usage pattern not found in ${secret.location}`,
    };
  } catch (err) {
    return {
      secret,
      found: false,
      error: `Error reading file: ${err.message}`,
    };
  }
}

function main() {
  const projectRoot = process.cwd();
  console.log('🔍 Validating Lovable Secrets Configuration...\n');
  console.log(`Project root: ${projectRoot}\n`);
  
  const results = [];
  let hasErrors = false;
  
  for (const secret of SECRETS) {
    const result = validateSecret(secret, projectRoot);
    results.push(result);
    
    const status = result.found ? '✅' : '❌';
    const required = secret.required ? '(REQUIRED)' : '(OPTIONAL)';
    
    console.log(`${status} ${secret.name} ${required}`);
    console.log(`   Description: ${secret.description}`);
    console.log(`   Location: ${secret.location}`);
    console.log(`   Env Var: ${secret.envVarName}`);
    
    if (!result.found) {
      hasErrors = true;
      console.log(`   ⚠️  ${result.error}`);
      
      if (secret.required) {
        console.log(`   🔴 This is a REQUIRED secret - please configure it in Lovable!`);
      }
    }
    console.log('');
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Summary');
  console.log('='.repeat(60));
  
  const requiredSecrets = SECRETS.filter(s => s.required);
  const optionalSecrets = SECRETS.filter(s => !s.required);
  
  const requiredFound = requiredSecrets.filter(s => 
    results.find(r => r.secret.name === s.name)?.found
  ).length;
  
  const optionalFound = optionalSecrets.filter(s => 
    results.find(r => r.secret.name === s.name)?.found
  ).length;
  
  console.log(`Required secrets: ${requiredFound}/${requiredSecrets.length} configured`);
  console.log(`Optional secrets: ${optionalFound}/${optionalSecrets.length} configured`);
  console.log('');
  
  if (hasErrors) {
    console.log('⚠️  Some secrets are not properly configured!');
    console.log('\nTo configure secrets in Lovable:');
    console.log('1. Go to your Lovable project settings');
    console.log('2. Navigate to Settings → Secrets');
    console.log('3. Add each required secret with the exact name shown above');
    console.log('4. Restart your deployment after adding secrets\n');
    process.exit(1);
  } else {
    console.log('✅ All required secrets are properly configured!\n');
    process.exit(0);
  }
}

main();

