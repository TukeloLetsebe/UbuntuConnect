# BACKEND_ARCHITECTURE.md

## Objective

Reverse engineer the backend architecture from the existing ASP.NET Core solution.

The implementation is the source of truth.

Do not make assumptions.

---

## Inspect

- Solution Structure
- Projects
- Folder Structure
- Controllers
- Services
- Repositories
- Models
- DTOs
- Middleware
- Dependency Injection
- Authentication
- Authorization
- Configuration
- Program.cs

---

## Analyse

Discover:

- Architectural Pattern
- Module Structure
- Layer Responsibilities
- Request Lifecycle
- Dependency Flow
- Authentication Flow
- Authorization Strategy
- Validation Strategy
- Exception Handling
- Configuration Strategy

---

## Generate

### 1. Backend Overview

Provide a high-level explanation of the backend architecture.

---

### 2. Solution Structure

Document every project and its responsibility.

---

### 3. Folder Structure

Explain the purpose of every major folder.

---

### 4. Architectural Pattern

Identify the architectural style being used.

Support the conclusion with evidence from the implementation.

---

### 5. Request Lifecycle

Explain how a request travels through the backend from HTTP request to HTTP response.

---

### 6. Module Breakdown

Document every discovered module and its responsibility.

---

### 7. Authentication & Authorization

Explain how authentication and authorization are implemented.

---

### 8. Dependency Injection

Document registered services and dependency flow.

---

### 9. Configuration

Document application configuration and environment settings.

---

### 10. Backend Summary

Summarize the architecture and how the major components work together.

---

## Architecture Assessment (Separate from Documentation)

After documenting the existing implementation, provide an assessment.

### Strengths

Identify architectural decisions that improve maintainability, scalability or readability.

### Weaknesses

Identify architectural issues without making changes.

### Technical Debt

Identify areas that may become difficult to maintain.

### Recommendations

Suggest improvements.

Do not modify or redesign the existing implementation.

Clearly distinguish recommendations from documented implementation.

---

## Rules

- The implementation is the source of truth.
- Do not invent architecture.
- Do not invent layers.
- Do not invent services.
- Do not invent repositories.
- Clearly separate documentation from recommendations.
- If implementation is unclear, ask for clarification instead of assuming.