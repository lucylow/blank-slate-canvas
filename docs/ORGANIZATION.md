# Repository Organization

## Directory Structure

This document describes the organization of the repository after reorganization.

### Top-Level Directories

#### `docs/`
All documentation files are located here:
- `guides/` - Development and user guides
- `api/` - API documentation
- `architecture/` - Architecture and design documentation
- `deployment/` - Deployment guides
- `agents/` - Agent system documentation

#### `src/`
Frontend React/TypeScript application source code.

#### `backend/`
Backend Python FastAPI application (note: `app/` directory may still exist during transition).

#### `agents/`
Multi-agent system source code with subdirectories for each agent type.

#### `server/`
Node.js servers including real-time server and demo server.

#### `infrastructure/`
Infrastructure and deployment configurations:
- `docker/` - Dockerfiles
- `k8s/` - Kubernetes manifests
- `scripts/` - Deployment scripts

#### `config/`
Configuration files organized by type and environment.

#### `tests/`
Test suites:
- `unit/` - Unit tests
- `integration/` - Integration tests
- `e2e/` - End-to-end tests
- `fixtures/` - Test data and fixtures

#### `examples/`
Example files and sample data:
- `data/` - Example data files
- `api-requests/` - Example API requests
- `agent-tasks/` - Example agent task configurations

#### `scripts/`
Build and utility scripts.

#### `tools/`
Development tools and scripts.

### Root-Level Files

Only essential files remain at the root:
- `README.md` - Main project readme
- `package.json` - Node.js dependencies
- `requirements.txt` - Python dependencies
- `tsconfig.json` - TypeScript configuration
- `tailwind.config.ts` - Tailwind CSS configuration
- `components.json` - Component library configuration
- `Makefile` - Build automation
- `.gitignore` - Git ignore rules

### Build Artifacts

The following directories are excluded from version control:
- `dist/` - Frontend build output
- `pitwall-dist/` - Production build artifacts
- `node_modules/` - Node.js dependencies
- `__pycache__/` - Python bytecode cache
- `*.pyc` - Python compiled files

## Migration Notes

If you're working with the repository after this reorganization:
1. Check import paths in your code - some may need updating
2. Documentation links may have changed
3. Build scripts may reference new paths
4. CI/CD pipelines may need path updates

## Contributing

When adding new files:
- Documentation → `docs/` (organize by type)
- Docker configs → `infrastructure/docker/`
- K8s manifests → `infrastructure/k8s/`
- Examples → `examples/`
- Tests → `tests/`
- Scripts → `scripts/`
