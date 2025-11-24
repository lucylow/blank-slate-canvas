# Contributing to PitWall A.I.

Thank you for your interest in contributing to PitWall A.I.! This document provides guidelines and instructions for contributing.

## 🤝 Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for all contributors.

## 🚀 Getting Started

1. **Fork the repository**
2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/blank-slate-canvas.git
   cd blank-slate-canvas
   ```
3. **Create a branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```
4. **Set up the development environment**
   ```bash
   # Install Node.js dependencies
   npm install
   
   # Install Python dependencies
   pip install -r requirements.txt
   
   # Start Redis (required for development)
   docker run -d -p 6379:6379 --name redis redis:7-alpine
   ```

## 📝 Development Workflow

### Making Changes

1. **Make your changes** in your feature branch
2. **Test your changes**
   ```bash
   # Frontend tests
   npm test
   
   # Backend tests
   pytest tests/
   
   # Linting
   npm run lint
   npm run type-check
   ```
3. **Commit your changes**
   ```bash
   git commit -m "feat: add your feature description"
   ```
   Follow [Conventional Commits](https://www.conventionalcommits.org/) format:
   - `feat:` for new features
   - `fix:` for bug fixes
   - `docs:` for documentation
   - `style:` for formatting
   - `refactor:` for code refactoring
   - `test:` for tests
   - `chore:` for maintenance

4. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

5. **Create a Pull Request**
   - Use the PR template
   - Link to related issues
   - Describe your changes clearly

## 🎨 Code Style

### TypeScript/React
- Use TypeScript for type safety
- Follow ESLint rules (run `npm run lint`)
- Use Prettier for formatting (run `npm run format`)
- Use functional components with hooks
- Follow React best practices

### Python
- Follow PEP 8 style guide
- Use type hints where possible
- Format with Black (optional but recommended)
- Document functions with docstrings

## 🧪 Testing

- Write tests for new features
- Ensure all existing tests pass
- Aim for good test coverage
- Test both success and error cases

## 📚 Documentation

- Update README.md if needed
- Add JSDoc/TSDoc comments for functions
- Add Python docstrings for classes and functions
- Update API documentation if endpoints change

## 🔍 Pull Request Process

1. **Ensure your PR:**
   - Follows the PR template
   - Has a clear description
   - Links to related issues
   - Includes tests (if applicable)
   - Passes all CI checks

2. **Review Process:**
   - At least one maintainer will review
   - Address feedback promptly
   - Keep discussions constructive

3. **After Approval:**
   - Maintainers will merge your PR
   - Your contribution will be credited

## 🐛 Reporting Bugs

Use the [Bug Report template](.github/ISSUE_TEMPLATE/bug_report.md) and include:
- Clear description of the bug
- Steps to reproduce
- Expected vs actual behavior
- Environment details
- Screenshots (if applicable)

## 💡 Suggesting Features

Use the [Feature Request template](.github/ISSUE_TEMPLATE/feature_request.md) and include:
- Clear description of the feature
- Motivation and use cases
- Proposed solution
- Alternatives considered

## ❓ Questions?

- Check the [README.md](../README.md)
- Open a [Question issue](.github/ISSUE_TEMPLATE/question.md)
- Start a [Discussion](https://github.com/lucylow/blank-slate-canvas/discussions)

## 🙏 Thank You!

Your contributions make this project better. Thank you for taking the time to contribute!

