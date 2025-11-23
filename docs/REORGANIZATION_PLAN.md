# GitHub Repository Reorganization Plan

## Current Issues

1. **Documentation scattered**: `.md` files in root, `docs/`, and `agents/` directories
2. **Backend duplication**: Both `app/` and `backend/` directories with similar content
3. **Config files scattered**: Config files in root, `config/`, and various subdirectories
4. **Build artifacts in repo**: `dist/` and `pitwall-dist/` should be gitignored
5. **Example files mixed**: Example JSON files mixed with source code in `agents/`
6. **Infrastructure files scattered**: Dockerfiles, K8s manifests, and deployment files at root

## Proposed Structure

```
blank-slate-canvas/
├── .github/                    # GitHub workflows, issue templates, PR templates
│   └── workflows/
├── docs/                       # ALL documentation
│   ├── guides/                # Development and user guides
│   ├── api/                   # API documentation
│   ├── architecture/          # Architecture and design docs
│   └── deployment/            # Deployment guides
├── src/                       # Frontend source (React/TypeScript)
│   ├── components/
│   ├── pages/
│   ├── hooks/
│   └── ...
├── backend/                   # Backend source (Python FastAPI)
│   ├── app/                   # Main application (consolidate from app/)
│   ├── models/                # ML models and ONNX files
│   └── services/
├── agents/                    # Multi-agent system
│   ├── orchestrator/
│   ├── predictor/
│   ├── preprocessor/
│   └── ...
├── server/                    # Node.js servers
│   ├── realtime/
│   ├── demo-server.js
│   └── ...
├── infrastructure/            # Infrastructure and deployment configs
│   ├── docker/                # Dockerfiles
│   ├── k8s/                   # Kubernetes manifests
│   ├── helm/                  # Helm charts (if any)
│   └── scripts/               # Deployment scripts
├── config/                    # Configuration files
│   ├── environments/          # Environment-specific configs
│   └── agents/                # Agent configurations
├── tests/                     # Test suites
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── examples/                  # Example files and sample data
│   ├── data/
│   ├── api-requests/
│   └── agent-tasks/
├── scripts/                   # Build and utility scripts
├── tools/                     # Development tools
├── data/                      # Data files (gitignored if large)
│   └── .gitkeep
├── artifacts/                 # Build artifacts (gitignored)
│   └── .gitkeep
├── node_modules/              # (gitignored)
├── dist/                      # Build output (gitignored)
├── pitwall-dist/              # Build output (gitignored)
├── package.json
├── requirements.txt
├── README.md
├── LICENSE
└── .gitignore

```

## Migration Steps

### Phase 1: Documentation Consolidation
- [x] Move all `.md` files from root to `docs/`
- [ ] Move agent documentation from `agents/` to `docs/agents/`
- [ ] Organize docs into logical subdirectories

### Phase 2: Backend Consolidation
- [ ] Review `backend/` vs `app/` structure
- [ ] Consolidate into single `backend/app/` structure
- [ ] Update import paths

### Phase 3: Infrastructure Organization
- [ ] Move Dockerfiles to `infrastructure/docker/`
- [ ] Move K8s manifests to `infrastructure/k8s/`
- [ ] Move deployment YAMLs to `infrastructure/`

### Phase 4: Config Organization
- [ ] Consolidate all config files into `config/`
- [ ] Organize by type and environment

### Phase 5: Examples and Test Data
- [ ] Move example JSON files to `examples/`
- [ ] Organize test data in `tests/fixtures/`

### Phase 6: Clean Up
- [ ] Update `.gitignore` for build artifacts
- [ ] Update all import paths and references
- [ ] Update documentation links

