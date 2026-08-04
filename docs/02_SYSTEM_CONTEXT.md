# SYSTEM_CONTEXT.md

# UbuntuConnect System Context

Version: 1.0

---

# 1. Purpose

This document describes the UbuntuConnect ecosystem from a high-level perspective.

It defines:

- External actors
- Internal systems
- System boundaries
- Data flow
- Communication between components

This document provides architectural context before implementation begins.

---

# 2. System Overview

UbuntuConnect is a three-tier web application that enables collaboration between Individuals, Non-Profit Organisations (NPOs), Businesses, and Platform Administrators.

The system follows a client-server architecture.

Presentation Layer
↓

Business Layer
↓

Data Layer

---

# 3. High-Level Architecture

+-------------------------------------------------------------+
|                         UbuntuConnect                       |
+-------------------------------------------------------------+

Users
↓

React Frontend

↓

ASP.NET Core Web API

↓

Business Logic

↓

Entity Framework Core

↓

SQL Server Database

---

# 4. External Actors

## Individual User

Purpose

- Register
- Login
- Discover organisations
- Volunteer
- Donate
- Follow campaigns
- View posts

---

## NPO

Purpose

- Manage organisation
- Create campaigns
- Recruit volunteers
- Publish posts
- Track donations

---

## Business

Purpose

- Sponsor initiatives
- Partner with organisations
- Support campaigns
- Publish opportunities

---

## System Administrator

Purpose

- Monitor platform
- Manage users
- Moderate content
- Configure system

---

# 5. Internal Components

## Frontend

Technology

React

Responsibilities

Display user interface

Manage routing

Validate user input

Manage application state

Consume REST APIs

Store JWT securely

---

## Backend API

Technology

ASP.NET Core Web API

Responsibilities

Authentication

Authorization

Business Logic

Validation

REST Endpoints

DTO Mapping

Database communication

---

## Database

Technology

SQL Server

Responsibilities

Persistent storage

Relationship management

Constraints

Indexes

Transactions

---

# 6. Communication Flow

Browser

↓

React

↓

Axios

↓

REST API

↓

Controllers

↓

Services

↓

Repositories (if implemented)

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

# 7. Authentication Flow

User

↓

Login Form

↓

POST /api/auth/login

↓

Authentication Controller

↓

JWT Generated

↓

Frontend Stores Token

↓

Protected Routes Enabled

↓

Authenticated Requests

↓

Authorization Middleware

---

# 8. Data Flow

User Action

↓

React Component

↓

Validation

↓

Axios Request

↓

Controller

↓

Business Logic

↓

Database

↓

Response DTO

↓

React State Update

↓

UI Refresh

---

# 9. System Boundaries

Inside UbuntuConnect

Frontend

Backend

Database

Authentication

Business Logic

User Profiles

Campaigns

Posts

Notifications

---

Outside UbuntuConnect

Email Services (Future)

Payment Providers (Future)

Cloud Storage (Future)

Push Notifications (Future)

AI Services (Future)

Third-party APIs (Future)

---

# 10. Primary Business Modules

Authentication

User Management

Profile Management

Campaign Management

Posts

Volunteering

Donations

Notifications

Search

Administration

---

# 11. Security Boundary

Every request requiring protected resources must:

Authenticate

↓

Validate JWT

↓

Authorize User

↓

Execute Business Logic

↓

Return Response

Unauthorized users must never access protected resources.

---

# 12. Error Flow

Client Error

↓

Validation

↓

API

↓

HTTP Status Code

↓

Standard Error Response

↓

Frontend Notification

↓

User Correction

---

# 13. Future Integrations

The architecture should support:

Payment Gateway

Cloud Storage

Email Notifications

SMS Notifications

Push Notifications

AI Recommendation Engine

Analytics

Reporting

Without requiring architectural redesign.

---

# 14. Architectural Principles

UbuntuConnect follows:

Client-Server Architecture

RESTful APIs

Separation of Concerns

Layered Architecture

Dependency Injection

Stateless APIs

Component-Based Frontend

Centralized State Management

Reusable UI Components

---

# 15. AI Responsibilities

Before implementing any feature the AI must identify:

Which actors use the feature

Which frontend components are involved

Which API endpoints are required

Which DTOs are exchanged

Which database entities are affected

Which authentication rules apply

Which validations are required

Which business rules govern the feature

Implementation must only begin after this analysis is complete.