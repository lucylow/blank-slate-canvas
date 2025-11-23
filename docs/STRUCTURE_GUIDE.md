# Repository Structure Guide

Quick reference guide to the organized repository structure.

## 📁 Directory Quick Reference

### Documentation (`docs/`)
All documentation lives here:
- **Development Guides** → `docs/guides/`
- **API Documentation** → `docs/api/`
- **Architecture Docs** → `docs/architecture/`
- **Deployment Guides** → `docs/deployment/`
- **Agent Documentation** → `docs/agents/`

### Infrastructure (`infrastructure/`)
All deployment and infrastructure files:
- **Dockerfiles** → `infrastructure/docker/`
- **Kubernetes Manifests** → `infrastructure/k8s/`
- **Deployment Scripts** → `infrastructure/scripts/`

### Examples (`examples/`)
Sample files and data:
- **Example Data** → `examples/data/`
- **API Request Examples** → `examples/api-requests/`
- **Agent Task Examples** → `examples/agent-tasks/`

### Tests (`tests/`)
Test suites and fixtures:
- **Unit Tests** → `tests/unit/`
- **Integration Tests** → `tests/integration/`
- **E2E Tests** → `tests/e2e/`
- **Test Fixtures** → `tests/fixtures/`

## 🔍 Common File Locations

| What you're looking for | Where to find it |
|------------------------|------------------|
| Documentation | `docs/` |
| Dockerfiles | `infrastructure/docker/` |
| K8s configs | `infrastructure/k8s/` |
| Example files | `examples/` |
| Test data | `tests/fixtures/` |
| Frontend code | `src/` |
| Backend code | `app/` or `backend/` |
| Agent code | `agents/` |
| Server code | `server/` |
| Scripts | `scripts/` |
| Config files | `config/` |

## 🚀 Quick Commands

### Building with new Dockerfile location
```bash
docker build -f infrastructure/docker/Dockerfile .
```

### Running K8s deployments
```bash
kubectl apply -f infrastructure/k8s/
```

### Finding documentation
```bash
# All docs
ls docs/

# Agent docs
ls docs/agents/

# Deployment guides
ls docs/deployment/
```

### Finding examples
```bash
# All examples
ls examples/

# Agent task examples
ls examples/agent-tasks/
```

## 📝 Where to Add New Files

- **New documentation** → `docs/` (choose appropriate subdirectory)
- **New Dockerfile** → `infrastructure/docker/`
- **New K8s manifest** → `infrastructure/k8s/`
- **New example file** → `examples/` (choose appropriate subdirectory)
- **New test** → `tests/` (choose appropriate subdirectory)
- **New script** → `scripts/`
- **New tool** → `tools/`

## 🔗 Migration from Old Structure

If you're updating code after reorganization:

1. **Documentation links**: Change `./AGENT_GUIDE.md` → `./docs/agents/AGENT_GUIDE.md`
2. **Dockerfile paths**: Change `Dockerfile` → `infrastructure/docker/Dockerfile`
3. **Example file paths**: Change `agents/example-*.json` → `examples/agent-tasks/example-*.json`
4. **K8s manifest paths**: Change `k8s/*.yaml` → `infrastructure/k8s/*.yaml`

## 📚 For More Details

See [REORGANIZATION_SUMMARY.md](./REORGANIZATION_SUMMARY.md) for complete details on the reorganization.

