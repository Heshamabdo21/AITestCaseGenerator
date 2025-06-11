# Test Suite Management Feature

## Overview
Enhanced test case management with intelligent test suite organization in Azure DevOps.

## Features Added

### 1. Test Suite Organization Strategies
- **Group by User Story**: Creates separate test suites for each user story
- **Group by Test Type**: Organizes by test case types (Functional, Security, Performance)
- **Single Suite**: Places all test cases in the root suite

### 2. Configuration Options
- Toggle automatic test suite creation on/off
- Select organization strategy
- Maintains existing test plan functionality

### 3. Smart Suite Management
- Automatically finds existing suites before creating new ones
- Creates hierarchical organization under root suite
- Falls back gracefully if suite creation fails

## How It Works

1. **Configuration**: Users can enable/disable test suite creation and choose organization strategy
2. **Suite Detection**: System checks for existing suites with matching names
3. **Dynamic Creation**: Creates new suites only when needed
4. **Test Case Assignment**: Assigns test cases to appropriate suites based on strategy

## Example Usage

### User Story Strategy
```
Test Plan: Sprint 30
├── Root Suite
    ├── User Story: Login Enhancement (ID: 12345)
    │   ├── Test Case: Valid Login
    │   └── Test Case: Invalid Password
    └── User Story: Dashboard Update (ID: 12346)
        ├── Test Case: Dashboard Load
        └── Test Case: Widget Display
```

### Test Type Strategy
```
Test Plan: Sprint 30
├── Root Suite
    ├── Functional Tests
    │   ├── Login Test Cases
    │   └── Navigation Test Cases
    ├── Security Tests
    │   └── Authentication Test Cases
    └── Performance Tests
        └── Load Test Cases
```

This enhancement provides better organization and traceability for test management in Azure DevOps.