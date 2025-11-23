# Lovable Secrets Configuration Guide

This document describes all the secrets that need to be configured in Lovable Cloud for the PitWall application to function properly.

## Quick Validation

Run the validation script to check if all secrets are properly configured:

```bash
npm run validate-secrets
```

## Required Secrets

### 1. OpenAI (Frontend)
- **Name**: `OpenAI`
- **Description**: OpenAI API key for AI-powered analytics
- **Location**: Frontend (`src/api/aiAnalytics.ts`)
- **Environment Variable**: `import.meta.env.OPENAI`
- **Usage**: Primary AI model for race data analytics, insights, and predictions
- **How to Get**: 
  1. Go to https://platform.openai.com/api-keys
  2. Create a new API key
  3. Copy the key
- **Configuration in Lovable**:
  1. Go to Settings → Secrets
  2. Add secret named exactly: `OpenAI`
  3. Paste your API key as the value
  4. Save and restart deployment

### 2. OpenWeatherMap_API_Key (Backend)
- **Name**: `OpenWeatherMap_API_Key`
- **Description**: OpenWeatherMap API key for weather service
- **Location**: Backend (`app/services/openweathermap_service.py`)
- **Environment Variable**: `OpenWeatherMap_API_Key`
- **Usage**: Real-time weather data for track locations
- **How to Get**:
  1. Go to https://openweathermap.org/api
  2. Sign up for a free account
  3. Get your API key from the dashboard
- **Configuration in Lovable**:
  1. Go to Settings → Secrets
  2. Add secret named exactly: `OpenWeatherMap_API_Key`
  3. Paste your API key as the value
  4. Save and restart deployment

### 3. LOVABLE_API_KEY (Edge Functions)
- **Name**: `LOVABLE_API_KEY`
- **Description**: Lovable API key for AI gateway fallback in edge functions
- **Location**: Supabase Edge Functions (`supabase/functions/*`)
- **Environment Variable**: `LOVABLE_API_KEY`
- **Usage**: Fallback AI gateway for tire wear prediction, pit window optimization, and coaching
- **How to Get**: 
  - This is typically provided by Lovable Cloud automatically
  - If not available, check with Lovable support
- **Configuration in Lovable**:
  1. Go to Settings → Secrets
  2. Add secret named exactly: `LOVABLE_API_KEY`
  3. Paste your Lovable API key as the value
  4. Save and restart deployment

### 4. SUPABASE_URL (Edge Functions)
- **Name**: `SUPABASE_URL`
- **Description**: Supabase project URL
- **Location**: Supabase Edge Functions (`supabase/functions/*`)
- **Environment Variable**: `SUPABASE_URL`
- **Usage**: Required for Supabase client initialization in edge functions
- **How to Get**:
  1. Go to your Supabase project dashboard
  2. Navigate to Settings → API
  3. Copy the Project URL
- **Configuration in Lovable**:
  1. Go to Settings → Secrets
  2. Add secret named exactly: `SUPABASE_URL`
  3. Paste your Supabase project URL as the value
  4. Save and restart deployment

### 5. SUPABASE_SERVICE_ROLE_KEY (Edge Functions)
- **Name**: `SUPABASE_SERVICE_ROLE_KEY`
- **Description**: Supabase service role key (has admin privileges)
- **Location**: Supabase Edge Functions (`supabase/functions/*`)
- **Environment Variable**: `SUPABASE_SERVICE_ROLE_KEY`
- **Usage**: Required for Supabase client initialization in edge functions
- **How to Get**:
  1. Go to your Supabase project dashboard
  2. Navigate to Settings → API
  3. Copy the `service_role` key (⚠️ Keep this secret!)
- **Configuration in Lovable**:
  1. Go to Settings → Secrets
  2. Add secret named exactly: `SUPABASE_SERVICE_ROLE_KEY`
  3. Paste your service role key as the value
  4. Save and restart deployment

## Optional Secrets

### 6. GEMINI (Frontend)
- **Name**: `GEMINI`
- **Description**: Google Gemini API key for AI analytics (fallback)
- **Location**: Frontend (`src/api/aiAnalytics.ts`)
- **Environment Variable**: `import.meta.env.GEMINI`
- **Usage**: Fallback AI model when OpenAI is unavailable or fails
- **How to Get**:
  1. Go to https://makersuite.google.com/app/apikey
  2. Create a new API key
  3. Copy the key
- **Configuration in Lovable**:
  1. Go to Settings → Secrets
  2. Add secret named exactly: `GEMINI`
  3. Paste your API key as the value
  4. Save and restart deployment
- **Note**: This is optional. If not provided, the app will only use OpenAI.

### 7. GOOGLE_MAPS_API_KEY (Frontend)
- **Name**: `GOOGLE_MAPS_API_KEY`
- **Description**: Google Maps API key for maps integration
- **Location**: Frontend (`src/api/googleMaps.ts`)
- **Environment Variable**: `import.meta.env.GOOGLE_MAPS_API_KEY`
- **Usage**: Google Maps Datasets API and Street View Publish API integration
- **How to Get**:
  1. Go to https://console.cloud.google.com/apis/credentials
  2. Create a new API key
  3. Enable required APIs (Maps JavaScript API, Geocoding API, etc.)
  4. Copy the key
- **Configuration in Lovable**:
  1. Go to Settings → Secrets
  2. Add secret named exactly: `GOOGLE_MAPS_API_KEY`
  3. Paste your API key as the value
  4. Save and restart deployment
- **Note**: This is optional. The app will work without it, but Google Maps features will be disabled.

### 8. MailGun_Base_URL (Backend)
- **Name**: `MailGun_Base_URL`
- **Description**: Mailgun API base URL
- **Location**: Backend (`app/services/mailgun_service.py`)
- **Environment Variable**: `MailGun_Base_URL`
- **Usage**: Base URL for Mailgun API requests
- **How to Get**:
  1. Go to https://app.mailgun.com/
  2. Sign up or log in to your account
  3. The base URL is typically: `https://api.mailgun.net/v3/`
- **Configuration in Lovable**:
  1. Go to Settings → Secrets
  2. Add secret named exactly: `MailGun_Base_URL`
  3. Paste the base URL (e.g., `https://api.mailgun.net/v3/`)
  4. Save and restart deployment
- **Note**: This is required for email functionality.

### 9. MailGun_Sandbox_domain (Backend)
- **Name**: `MailGun_Sandbox_domain`
- **Description**: Mailgun sandbox domain for sending emails
- **Location**: Backend (`app/services/mailgun_service.py`)
- **Environment Variable**: `MailGun_Sandbox_domain`
- **Usage**: Domain used for sending emails (sandbox or verified domain)
- **How to Get**:
  1. Go to https://app.mailgun.com/
  2. Navigate to Sending → Domains
  3. Copy your sandbox domain (e.g., `sandboxa59937f5894a46bc9faf90d0977ad812.mailgun.org`)
  4. Or use a verified domain if you have one
- **Configuration in Lovable**:
  1. Go to Settings → Secrets
  2. Add secret named exactly: `MailGun_Sandbox_domain`
  3. Paste your domain (e.g., `sandboxa59937f5894a46bc9faf90d0977ad812.mailgun.org`)
  4. Save and restart deployment
- **Note**: This is required for email functionality. Sandbox domains can only send to authorized recipients.

### 10. MailGun_API_Key (Backend)
- **Name**: `MailGun_API_Key`
- **Description**: Mailgun API key for authentication
- **Location**: Backend (`app/services/mailgun_service.py`)
- **Environment Variable**: `MailGun_API_Key`
- **Usage**: API key for authenticating Mailgun API requests
- **How to Get**:
  1. Go to https://app.mailgun.com/
  2. Navigate to Settings → API Keys
  3. Copy your Private API key (starts with `key-` or similar)
  4. Or use the default API key from your domain settings
- **Configuration in Lovable**:
  1. Go to Settings → Secrets
  2. Add secret named exactly: `MailGun_API_Key`
  3. Paste your API key as the value
  4. Save and restart deployment
- **Note**: This is required for email functionality. Keep this key secure.

## Secret Access Patterns

### Frontend Secrets (Vite)
Frontend secrets are accessed via `import.meta.env`:

```typescript
// OpenAI
const OPENAI_API_KEY = import.meta.env.OPENAI || import.meta.env.VITE_OPENAI_API_KEY;

// Gemini
const GEMINI_API_KEY = import.meta.env.GEMINI || import.meta.env.VITE_GEMINI_API_KEY;

// Google Maps
const GOOGLE_MAPS_API_KEY = import.meta.env.GOOGLE_MAPS_API_KEY || import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
```

**Important**: In Lovable Cloud, secrets are exposed as environment variables with the exact secret name. For example, a secret named `OpenAI` becomes `import.meta.env.OPENAI`.

### Backend Secrets (Python/FastAPI)
Backend secrets are accessed via `os.getenv()`:

```python
import os

# OpenWeatherMap
api_key = os.getenv("OpenWeatherMap_API_Key")
```

**Important**: The environment variable name matches the secret name exactly.

### Edge Functions Secrets (Deno)
Edge functions secrets are accessed via `Deno.env.get()`:

```typescript
// LOVABLE_API_KEY
const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

// Supabase
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
```

**Important**: Edge functions use a helper function `getEnvVar()` that validates the secret exists.

## Troubleshooting

### Secret Not Working

1. **Verify Secret Name**: Secret names are case-sensitive and must match exactly
   - ✅ `OpenAI` (correct)
   - ❌ `openai` (wrong)
   - ❌ `OPENAI_API_KEY` (wrong)

2. **Check Secret Value**: Make sure the secret value is correct and doesn't have extra spaces

3. **Restart Deployment**: After adding or updating secrets, restart your Lovable deployment

4. **Check Environment**: Secrets are only available in the deployed environment, not in local development (unless you set them locally)

5. **Run Validation Script**: Use `npm run validate-secrets` to check if secrets are properly configured in code

### Common Errors

#### "OpenAI API key not configured"
- **Cause**: `OpenAI` secret is missing or incorrectly named
- **Solution**: Add `OpenAI` secret in Lovable Settings → Secrets

#### "OpenWeatherMap API is not configured"
- **Cause**: `OpenWeatherMap_API_Key` secret is missing or incorrectly named
- **Solution**: Add `OpenWeatherMap_API_Key` secret in Lovable Settings → Secrets

#### "Missing required environment variable: LOVABLE_API_KEY"
- **Cause**: `LOVABLE_API_KEY` secret is missing in edge functions
- **Solution**: Add `LOVABLE_API_KEY` secret in Lovable Settings → Secrets

#### "Missing required environment variable: SUPABASE_URL"
- **Cause**: `SUPABASE_URL` secret is missing in edge functions
- **Solution**: Add `SUPABASE_URL` secret in Lovable Settings → Secrets

## Security Best Practices

1. **Never commit secrets to git**: Secrets should only be stored in Lovable Cloud
2. **Use different keys for dev/prod**: Consider using separate secrets for different environments
3. **Rotate keys regularly**: Update API keys periodically for security
4. **Limit API key permissions**: When possible, restrict API keys to only required permissions
5. **Monitor API usage**: Check API usage dashboards regularly to detect anomalies

## Validation

Run the validation script to ensure all secrets are properly configured:

```bash
npm run validate-secrets
```

This script checks:
- ✅ Secret usage patterns in code
- ✅ Required vs optional secrets
- ✅ Environment variable names
- ✅ File locations

## Summary

| Secret Name | Required | Location | Purpose |
|------------|----------|----------|---------|
| `OpenAI` | ✅ Yes | Frontend | AI analytics |
| `GEMINI` | ⚪ Optional | Frontend | AI analytics (fallback) |
| `GOOGLE_MAPS_API_KEY` | ⚪ Optional | Frontend | Maps integration |
| `OpenWeatherMap_API_Key` | ✅ Yes | Backend | Weather service |
| `MailGun_Base_URL` | ⚪ Optional | Backend | Email service (base URL) |
| `MailGun_Sandbox_domain` | ⚪ Optional | Backend | Email service (domain) |
| `MailGun_API_Key` | ⚪ Optional | Backend | Email service (API key) |
| `LOVABLE_API_KEY` | ✅ Yes | Edge Functions | AI gateway fallback |
| `SUPABASE_URL` | ✅ Yes | Edge Functions | Supabase client |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ Yes | Edge Functions | Supabase client |

## Additional Resources

- [Lovable Cloud Documentation](https://docs.lovable.app)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [OpenWeatherMap API Documentation](https://openweathermap.org/api)
- [Google Maps API Documentation](https://developers.google.com/maps/documentation)
- [Mailgun API Documentation](https://documentation.mailgun.com/)
- [Supabase Documentation](https://supabase.com/docs)

