# PROJECT_ARCHITECTURE.md

# UbuntuConnect Software Architecture Document

Version: 1.0

---

# 1. Purpose

This document defines the overall software architecture of UbuntuConnect.

It describes how the system is structured, how its major components interact, and the architectural principles that govern implementation.

This document serves as the technical blueprint for all future development.

---

# 2. Architectural Goals

UbuntuConnect has been designed with the following goals:

• Scalability

• Maintainability

• Security

• Reliability

• Extensibility

• Reusability

• Separation of Concerns

• Simplicity

The architecture should support future expansion without requiring major redesign.

---

# 3. Architectural Style

UbuntuConnect follows a layered architecture.

Presentation Layer

↓

Application Layer

↓

Business Layer

↓

Data Access Layer

↓

Database

Each layer has a clearly defined responsibility.

Layers communicate only with adjacent layers.

---

# 4. High-Level Architecture

                    User
                      │
             React Frontend (Vite)
                      │
                Axios HTTP Client
                      │
          ASP.NET Core Web API
                      │
              Controllers
                      │
                Business Logic
                      │
            Entity Framework Core
                      │
                SQL Server Database

---

# 5. Frontend Responsibilities

The frontend is responsible for:

• User Interface

• User Experience

• Routing

• Client-side validation

• Authentication state

• Consuming backend APIs

• Displaying server responses

The frontend must not contain business logic that belongs to the backend.

---

# 6. Backend Responsibilities

The backend is responsible for:

• Business Logic

• Authentication

• Authorization

• Validation

• Database access

• Data integrity

• REST APIs

• Security

The backend is the single source of truth.

---

# 7. Database Responsibilities

The database is responsible for:

• Persistent storage

• Relationships

• Constraints

• Transactions

• Referential integrity

Business rules should not rely solely on database constraints.

---

# 8. Communication Flow

User

↓

React Component

↓

Validation

↓

Axios

↓

REST API

↓

Controller

↓

Business Logic

↓

Entity Framework

↓

SQL Server

↓

Response

↓

React

↓

UI Update

---

# 9. Authentication Architecture

Authentication Flow

User

↓

Login Page

↓

Authentication API

↓

JWT Generated

↓

Frontend stores JWT

↓

Authenticated Requests

↓

Authorization Middleware

↓

Protected Resource

The backend remains responsible for authentication decisions.

---

# 10. Authorization

Authorization is role-based.

Supported roles include:

• Individual

• NPO

• Business

• Administrator

Authorization decisions shall always be enforced by the backend.

The frontend may hide UI elements for convenience, but backend authorization is mandatory.

---

# 11. API Architecture

Communication between frontend and backend follows REST principles.

Frontend

↓

Axios

↓

REST Endpoint

↓

DTO

↓

Business Logic

↓

Response DTO

↓

Frontend

The frontend shall never communicate directly with the database.

---

# 12. State Management

The frontend shall separate state into:

Global State

Authentication

Current User

Application Settings

Notifications

Local State

Forms

Dialogs

Tables

Filters

Component UI

Only shared state should be stored globally.

---

# 13. Error Handling

Errors shall be handled at multiple levels.

Client Validation

↓

API Validation

↓

Business Validation

↓

Database Validation

↓

Standard Error Response

↓

Frontend Feedback

Every failure should result in a meaningful response.

---

# 14. Security Architecture

Authentication uses JWT.

Passwords are never stored by the frontend.

Sensitive configuration is stored using environment variables.

HTTPS is required for production deployments.

Authorization decisions remain server-side.

---

# 15. Dependency Principles

Dependencies should flow inward.

Frontend depends on API.

API depends on Business Logic.

Business Logic depends on Data Access.

Data Access depends on Database.

The database must never depend on application logic.

---

# 16. Design Principles

The architecture follows:

SOLID

DRY

KISS

YAGNI

Single Responsibility Principle

Separation of Concerns

Composition over Inheritance

Convention over Configuration

---

# 17. Module Overview

Authentication Module

User Management Module

Profile Module

Campaign Module

Post Module

Volunteer Module

Donation Module

Notification Module

Search Module

Administration Module

Each module should remain loosely coupled and highly cohesive.

---

# 18. Future Expansion

The architecture should support future additions without major redesign.

Examples include:

Messaging

Real-time Notifications

Payment Gateway

Cloud Storage

AI Recommendations

Analytics

Mobile Applications

---

# 19. Architectural Constraints

The project shall:

✓ Never duplicate business logic.

✓ Never bypass backend validation.

✓ Never expose sensitive data.

✓ Never hardcode API URLs.

✓ Never tightly couple components.

✓ Prefer reusable abstractions.

✓ Follow the established folder structure.

---

# 20. AI Responsibilities

Before implementing any feature, the AI must:

1. Identify the architectural layer affected.

2. Verify the appropriate module.

3. Confirm existing implementation.

4. Reuse before creating.

5. Explain architectural impact.

6. Follow established project standards.

The architecture defined in this document takes precedence over implementation convenience.