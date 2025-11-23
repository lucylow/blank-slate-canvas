# AI Data Analytics Setup Guide

This application uses **OpenAI GPT-4** and **Google Gemini** for advanced data analytics on race telemetry and performance data.

## Configuration

### Lovable Secrets Setup

1. **OpenAI API Key**:
   - In Lovable, go to Settings → Secrets
   - Add a secret named **"OpenAI"** with your OpenAI API key
   - The secret will be automatically exposed as an environment variable

2. **Gemini API Key** (Optional):
   - Add a secret named **"GEMINI"** with your Google Gemini API key
   - If not provided, only OpenAI will be used
   - OpenAI will be tried first, then Gemini as a fallback

### Environment Variables

The application will automatically detect API keys from:
- `VITE_OPENAI_API_KEY` (preferred)
- `OPENAI_API_KEY`
- `OPENAI` (Lovable secret name)
- `VITE_GEMINI_API_KEY` (preferred)
- `GEMINI_API_KEY`
- `GEMINI` (Lovable secret name)

## Features

### AI-Powered Analytics

The AI Data Analytics component provides:

1. **Comprehensive Analysis**: Full race data analysis with insights, recommendations, and predictions
2. **Tire Analysis**: Specialized tire wear forecasting and degradation patterns
3. **Performance Analysis**: Driver performance metrics and optimization recommendations
4. **Strategy Analysis**: Pit stop timing, race strategy, and competitor analysis
5. **Predictive Analytics**: Lap time predictions, pit window forecasts, and performance trends

### Analysis Types

- **Comprehensive**: Full analysis of all race data
- **Tire**: Focused tire wear and degradation analysis
- **Performance**: Driver and vehicle performance metrics
- **Strategy**: Race strategy and pit stop recommendations
- **Predictive**: Future performance and trend predictions

### AI Models

- **OpenAI GPT-4**: Primary model for analytics (tried first, recommended)
- **Gemini Pro**: Fallback model when OpenAI is unavailable or fails
- **Both**: Combines insights from both models for enhanced accuracy

## Usage

### In Components

```tsx
import { AIDataAnalytics } from '@/components/AIDataAnalytics';

<AIDataAnalytics
  track="road_america"
  race={1}
  vehicle={7}
  lap={12}
  autoRefresh={true}
/>
```

### Using Hooks

```tsx
import { useAIAnalytics, useRealTimeAIAnalytics } from '@/hooks/useAIAnalytics';

// Real-time analytics
const { data, isLoading } = useRealTimeAIAnalytics('road_america', 1, 7, 12);

// Manual analysis
const { analyzeAsync, isLoading } = useAIAnalytics();
await analyzeAsync({
  data: raceData,
  analysisType: 'comprehensive',
  model: 'openai',
});
```

## API Usage

The service makes direct API calls to:
- OpenAI: `https://api.openai.com/v1/chat/completions`
- Gemini: `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent`

**Note**: API keys are used client-side. For production, consider proxying through your backend for security.

## Analytics Output

Each analysis returns:

- **Insights**: 5-7 actionable insights from the data
- **Recommendations**: 3-5 strategic recommendations
- **Predictions**: Tire wear, lap times, pit windows, performance trends
- **Patterns**: Identified patterns, anomalies, and trends
- **Summary**: Executive summary of the analysis
- **Confidence**: Confidence score (0-100) for the analysis

## Troubleshooting

### "OpenAI API key not configured" Error

1. Verify the secret is named exactly **"OpenAI"** in Lovable
2. Check that the secret value is your valid OpenAI API key
3. Restart the development server after adding secrets

### CORS Errors

If you encounter CORS errors when calling APIs directly:
- Consider proxying API calls through your backend
- Or use a backend endpoint that handles the AI API calls

### Rate Limiting

OpenAI and Gemini APIs have rate limits. The application includes:
- Automatic retry logic
- Request caching (1 minute for analytics)
- Error handling and user feedback

## Best Practices

1. **OpenAI is tried first**: The system automatically tries OpenAI first, then falls back to Gemini if OpenAI is unavailable or fails
2. **Cache results**: Analytics are cached for 1 minute to reduce API calls
3. **Batch requests**: Use "both" model option sparingly to avoid high API usage
4. **Monitor usage**: Track your API usage in OpenAI and Gemini dashboards
5. **Secret names**: Use exactly "OpenAI" and "GEMINI" (all caps) as secret names in Lovable

## Cost Considerations

- OpenAI GPT-4: ~$0.01-0.03 per analysis (depending on data size)
- Gemini Pro: Free tier available, then pay-per-use
- Consider caching results to minimize API calls

