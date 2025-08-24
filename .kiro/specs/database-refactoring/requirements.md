# Requirements Document

## Introduction

The current database schema contains unused tables, views, and inconsistent column references that need to be cleaned up. The goal is to consolidate all database definitions into a single, clean SQL script that only includes the tables and structures actually being used by the application, while fixing inconsistencies between the schema and TypeScript types.

## Requirements

### Requirement 1

**User Story:** As a developer, I want a single, clean database schema file, so that I can easily understand and maintain the database structure.

#### Acceptance Criteria

1. WHEN deploying the database THEN there SHALL be only one SQL script that contains all necessary tables
2. WHEN reviewing the database schema THEN it SHALL only contain tables that are actively used by the application
3. WHEN examining the schema THEN it SHALL be free of unused views, functions, and indexes

### Requirement 2

**User Story:** As a developer, I want consistent column definitions between the database schema and TypeScript types, so that there are no runtime errors due to missing columns.

#### Acceptance Criteria

1. WHEN the TypeScript types reference a column THEN that column SHALL exist in the database schema
2. WHEN the database schema defines a column THEN it SHALL be properly reflected in the TypeScript types
3. WHEN creating indexes THEN they SHALL only reference columns that actually exist in the tables

### Requirement 3

**User Story:** As a developer, I want to remove unused database objects, so that the database is optimized and maintainable.

#### Acceptance Criteria

1. WHEN analyzing the codebase THEN unused views SHALL be identified and removed
2. WHEN examining database functions THEN only functions that are actually called SHALL be retained
3. WHEN reviewing indexes THEN only indexes on existing columns SHALL be kept

### Requirement 4

**User Story:** As a developer, I want to maintain all existing functionality, so that the application continues to work after the database refactoring.

#### Acceptance Criteria

1. WHEN the refactored schema is deployed THEN all existing API endpoints SHALL continue to function
2. WHEN the application runs THEN all current features SHALL work without modification
3. WHEN data operations are performed THEN they SHALL execute successfully with the new schema
