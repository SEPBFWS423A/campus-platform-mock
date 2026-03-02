---
name: modern-web-development
description: Enforces universal coding standards and best practices for modern web development (TypeScript, React, Next.js, Node.js).
user-invocable: true
allowed-tools: [Read, Grep, Glob, Bash, Edit]
---

# Modern Web Development Skill

## Overview
This skill defines the architectural guidelines, coding standards, and workflows for modern web development projects. Claude must adhere to these rules when scaffolding, refactoring, or reviewing frontend and full-stack code.

## 1. Core Principles
* **Type Safety:** Always use strict TypeScript. Avoid `any`. Use interfaces and `Zod` for runtime validation of external data.
* **Component Architecture:** Write functional components (e.g., React). Use hooks appropriately. Keep components small, focused, and pure. 
* **Performance:** Memoize expensive calculations (`useMemo`, `useCallback`) only when necessary. Avoid unnecessary re-renders. Lazy-load non-critical components.
* **Styling:** Use utility-first styling (e.g., Tailwind CSS) or your project's defined design system. Ensure responsive, mobile-first design.
* **Accessibility (a11y):** Always include semantic HTML (`<nav>`, `<main>`, `<article>`), `aria-labels` where necessary, and ensure keyboard navigation support.

## 2. File & Directory Structure
* Organize by feature (Feature-Sliced Design) rather than purely by file type when the project scales.
* Example structure:
  * `src/features/[feature-name]/components/`
  * `src/features/[feature-name]/hooks/`
  * `src/features/[feature-name]/api/`
* Keep a strict separation of concerns between UI presentation and business logic.

## 3. Workflow & Execution Steps
When asked to build, modify, or review a feature, follow this exact sequence:
1. **Analyze:** Read existing relevant files (e.g., `package.json` for dependencies, shared UI components, global layout) before writing new code.
2. **Plan:** Draft a brief step-by-step approach. For complex tasks, write a `task_plan.md` and get user approval first.
3. **Implement:** Write the code strictly adhering to the Core Principles. Modularize the code.
4. **Test:** Add or update unit tests (e.g., Jest/Vitest) for new utility functions or complex component logic.
5. **Self-Review:** Run a mental review for edge cases, error handling, and performance bottlenecks. Suggest improvements if you spot technical debt.

## 4. Git & Commits
* Always write clear, conventional commit messages.
* Format: `<type>(<scope>): <subject>`
* Allowed types: `feat`, `fix`, `chore`, `refactor`, `docs`, `test`.
* Keep commits focused on a single logical change.

## 5. Common Pitfalls to Avoid
* Mutating state directly. Always use immutable updates (e.g., spread operators, or state setter functions).
* Deep prop drilling. Use Context APIs or state management (Zustand, Redux) if nesting exceeds 3 levels.
* Leaving `console.log` statements in production-ready code.
* Hardcoding sensitive data or environment variables.