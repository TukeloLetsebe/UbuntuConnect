# Database Architecture

## Objective

Reverse engineer the database architecture from the existing implementation.

Do not assume anything.

The implementation is the source of truth.

## Inspect

- DbContext
- Entity Models
- Fluent API
- Migrations

## Document

For each Entity include:

- Purpose
- Properties
- Primary Key
- Foreign Keys
- Relationships
- Used By Controllers
- Used By DTOs

## Generate

- Entity Catalogue
- Relationship Diagram
- Data Dictionary
- Database Summary

## Rules

- Never invent entities.
- Never invent relationships.
- Only document what exists.
- If uncertain, ask before proceeding.