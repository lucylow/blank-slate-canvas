# Project Structure

This document describes the organized structure of the PitWall A.I. repository.

## Directory Overview

```
blank-slate-canvas/
├── src/                    # Frontend React/TypeScript application
├── server/                 # Node.js servers (demo, realtime, agent-api)
├── app/                    # Python FastAPI backend
├── agents/                 # Multi-agent system (consolidated from agents/ and ai_agents/)
├── tests/                  # All test files (unit, integration, e2e)
├── scripts/                # Utility scripts and tools
├── config/                 # Configuration files
├── data/                   # Data files and datasets
├── docs/                   # Documentation
│   ├── integration/        # Integration guides
│   ├── guides/             # Quick start and user guides
│   ├── reports/            # Analysis reports and summaries
│   ├── ai-agents/          # AI agent documentation
│   ├── anomaly-detection/  # Anomaly detection docs
│   └── backend-development/ # Backend development notes
├── public/                 # Static assets
│   └── assets/
│       └── track-maps/     # Track map PDFs and HTML reports
├── k8s/                    # Kubernetes deployment manifests
├── tools/                  # Development tools
├── supabase/               # Supabase configuration
└── artifacts/              # Build artifacts
```

## Key Directories

### Frontend (`src/`)
- React components, pages, hooks, and utilities
- TypeScript source code

### Backend (`app/`)
- FastAPI application
- Routes, services, models, pipelines
- Analytics and observability modules

### Agents (`agents/`)
- Multi-agent system implementation
- Orchestrator, preprocessor, predictor, EDA, simulator, explainer, delivery agents
- Agent configuration and utilities

### Tests (`tests/`)
- `unit/` - Unit tests
- `integration/` - Integration tests
- `e2e/` - End-to-end tests

### Documentation (`docs/`)
- Organized by category for easy navigation
- Integration guides, user guides, reports, and technical documentation

### Configuration (`config/`)
- Backend configuration files
- Deployment configurations

### Data (`data/`)
- Demo data, precomputed results
- Model files and data slices

### Scripts (`scripts/`)
- Utility scripts for data processing, report generation, training

### Public Assets (`public/assets/`)
- Track maps (PDFs)
- HTML reports
- Static assets for frontend

## File Organization Principles

1. **Documentation**: All markdown files organized in `docs/` by category
2. **Tests**: All test files consolidated in `tests/` with subdirectories
3. **Scripts**: Utility scripts in `scripts/`
4. **Config**: Configuration files in `config/`
5. **Assets**: Static files in `public/assets/`
6. **Data**: Data files in `data/`

## Migration Notes

- `agents/` and `ai_agents/` have been consolidated into a single `agents/` directory
- All documentation markdown files moved from root to `docs/` subdirectories
- PDF track maps moved to `public/assets/track-maps/`
- Test files consolidated into `tests/` directory structure
- Configuration files organized in `config/`

