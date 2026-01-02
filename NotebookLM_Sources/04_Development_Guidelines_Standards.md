# Development Guidelines & Code Standards

## Overview

This document outlines the development practices, coding standards, and workflows for the future-app project.

---

## Project Structure

```
future-app/
├── frontend/              # Next.js application
│   ├── src/
│   │   ├── app/           # App router pages
│   │   ├── components/    # React components
│   │   ├── lib/           # Utilities
│   │   └── styles/        # CSS/Tailwind
│   ├── public/          # Static assets
│   └── package.json
│
├── backend/               # Node.js API
│   ├── src/
│   │   ├── routes/        # API routes
│   │   ├── controllers/   # Business logic
│   │   ├── models/        # Data models
│   │   ├── middleware/    # Express middleware
│   │   └── utils/         # Helper functions
│   └── package.json
│
├── python-services/       # FastAPI services
│   ├── app/
│   │   ├── api/           # API endpoints
│   │   ├── models/        # Pydantic models
│   │   ├── services/      # Business logic
│   │   └── utils/         # Utilities
│   └── requirements.txt
│
├── rust-services/         # Actix-web services
│   ├── src/
│   │   ├── handlers/      # Request handlers
│   │   ├── models/        # Data structures
│   │   └── utils/         # Helper functions
│   └── Cargo.toml
│
├── ai-coder-prompts/      # AI assistant prompts
│   ├── agents/
│   ├── backend/
│   ├── frontend/
│   ├── infrastructure/
│   └── testing/
│
├── docker/                # Docker configurations
│   ├── Dockerfile.frontend
│   ├── Dockerfile.backend
│   ├── Dockerfile.python
│   └── Dockerfile.rust
│
├── docs/                  # Documentation
│   ├── architecture/
│   ├── api/
│   └── guides/
│
└── docker-compose.yml     # Service orchestration
```

---

## Code Style Standards

### TypeScript/JavaScript (Frontend & Backend)

#### Naming Conventions
```typescript
// Files: kebab-case
user-profile.tsx
api-client.ts

// Components: PascalCase
const UserProfile = () => { ... }

// Functions: camelCase
function getUserData() { ... }

// Constants: UPPER_SNAKE_CASE
const API_BASE_URL = 'http://localhost:5000';

// Interfaces/Types: PascalCase with 'I' prefix for interfaces
interface IUser { ... }
type UserRole = 'admin' | 'user';
```

#### Code Organization
```typescript
// 1. Imports (grouped)
import React from 'react';              // External
import { Button } from '@/components';  // Internal
import { api } from '@/lib/api';        // Lib
import type { User } from '@/types';    // Types

// 2. Types/Interfaces
interface Props {
  user: User;
  onUpdate: (user: User) => void;
}

// 3. Component/Function
export function UserProfile({ user, onUpdate }: Props) {
  // 3a. Hooks
  const [loading, setLoading] = useState(false);
  
  // 3b. Functions
  const handleUpdate = async () => { ... };
  
  // 3c. Effects
  useEffect(() => { ... }, []);
  
  // 3d. Render
  return ( ... );
}
```

#### Best Practices
```typescript
// ✅ DO: Use async/await
async function fetchData() {
  try {
    const data = await api.get('/users');
    return data;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

// ❌ DON'T: Use .then() chains
function fetchData() {
  return api.get('/users')
    .then(data => data)
    .catch(error => console.error(error));
}

// ✅ DO: Use optional chaining
const userName = user?.profile?.name ?? 'Unknown';

// ❌ DON'T: Use nested conditionals
const userName = user && user.profile && user.profile.name 
  ? user.profile.name 
  : 'Unknown';

// ✅ DO: Use type guards
function isUser(obj: any): obj is User {
  return 'id' in obj && 'email' in obj;
}

// ✅ DO: Use const assertions
const ROLES = ['admin', 'user', 'guest'] as const;
type Role = typeof ROLES[number];
```

---

### Python (AI Services)

#### Naming Conventions
```python
# Files: snake_case
user_service.py
ai_processor.py

# Classes: PascalCase
class UserService:
    pass

# Functions: snake_case
def get_user_data():
    pass

# Constants: UPPER_SNAKE_CASE
API_BASE_URL = "http://localhost:5000"

# Private: _prefix
def _internal_helper():
    pass
```

#### Code Organization
```python
# 1. Imports (grouped)
import os                          # Standard library
import sys

from fastapi import FastAPI        # Third-party
from pydantic import BaseModel

from app.services import ai        # Local
from app.models import User

# 2. Constants
MAX_RETRIES = 3
TIMEOUT = 30

# 3. Type definitions
class UserRequest(BaseModel):
    email: str
    name: str

# 4. Functions/Classes
async def process_user(request: UserRequest) -> dict:
    """Process user request with AI.
    
    Args:
        request: User request data
        
    Returns:
        Processed result dictionary
        
    Raises:
        ValueError: If request is invalid
    """
    pass
```

#### Best Practices
```python
# ✅ DO: Use type hints
def calculate_score(value: float, weight: float = 1.0) -> float:
    return value * weight

# ✅ DO: Use context managers
with open('file.txt', 'r') as f:
    content = f.read()

# ✅ DO: Use list comprehensions
squares = [x**2 for x in range(10)]

# ❌ DON'T: Use loops for simple transformations
squares = []
for x in range(10):
    squares.append(x**2)

# ✅ DO: Use async/await for I/O
async def fetch_data():
    async with httpx.AsyncClient() as client:
        response = await client.get(url)
        return response.json()

# ✅ DO: Use dataclasses
from dataclasses import dataclass

@dataclass
class User:
    id: int
    email: str
    name: str
```

---

### Rust (Performance Services)

#### Naming Conventions
```rust
// Files: snake_case
user_service.rs
image_processor.rs

// Structs/Enums: PascalCase
struct UserData { ... }
enum Status { ... }

// Functions: snake_case
fn process_image() { ... }

// Constants: UPPER_SNAKE_CASE
const MAX_SIZE: usize = 1024;

// Lifetimes: 'lowercase
fn process<'a>(data: &'a str) { ... }
```

#### Code Organization
```rust
// 1. Imports
use actix_web::{web, App, HttpResponse};
use serde::{Deserialize, Serialize};

// 2. Type definitions
#[derive(Serialize, Deserialize)]
struct User {
    id: i32,
    email: String,
}

// 3. Functions
async fn get_user(id: web::Path<i32>) -> HttpResponse {
    // Implementation
}

// 4. Main/Tests
#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_user_creation() {
        // Test implementation
    }
}
```

#### Best Practices
```rust
// ✅ DO: Use Result for error handling
fn divide(a: f64, b: f64) -> Result<f64, String> {
    if b == 0.0 {
        Err("Division by zero".to_string())
    } else {
        Ok(a / b)
    }
}

// ✅ DO: Use Option for nullable values
fn find_user(id: i32) -> Option<User> {
    // Return Some(user) or None
}

// ✅ DO: Use pattern matching
match result {
    Ok(value) => println!("Success: {}", value),
    Err(e) => eprintln!("Error: {}", e),
}

// ✅ DO: Use borrowing when possible
fn process_data(data: &str) -> String {
    data.to_uppercase()
}
```

---

## Git Workflow

### Branch Strategy
```bash
main              # Production-ready code
  │
  ├─ develop     # Integration branch
  │    │
  │    ├─ feature/user-auth
  │    ├─ feature/ai-integration
  │    ├─ bugfix/login-error
  │    └─ hotfix/security-patch
```

### Commit Messages
```bash
# Format: <type>(<scope>): <subject>

# Types:
feat:     # New feature
fix:      # Bug fix
docs:     # Documentation
style:    # Formatting
refactor: # Code restructuring
test:     # Tests
chore:    # Maintenance

# Examples:
feat(auth): add JWT authentication
fix(api): resolve CORS issue
docs(readme): update setup instructions
refactor(backend): optimize database queries
test(frontend): add component tests
```

### Pull Request Process
```markdown
1. Create feature branch from develop
2. Make changes and commit
3. Push to remote
4. Create PR with description:
   - What changed
   - Why it changed
   - How to test
5. Request review
6. Address feedback
7. Merge after approval
```

---

## Testing Standards

### Test Coverage Requirements
- **Minimum**: 80% overall
- **Critical paths**: 95%+
- **New features**: 90%+

### Test Structure
```typescript
// Arrange-Act-Assert pattern
describe('UserService', () => {
  describe('createUser', () => {
    it('should create user with valid data', async () => {
      // Arrange
      const userData = { email: 'test@example.com', name: 'Test' };
      
      // Act
      const user = await userService.createUser(userData);
      
      // Assert
      expect(user).toBeDefined();
      expect(user.email).toBe(userData.email);
    });
    
    it('should throw error with invalid email', async () => {
      // Arrange
      const userData = { email: 'invalid', name: 'Test' };
      
      // Act & Assert
      await expect(userService.createUser(userData))
        .rejects.toThrow('Invalid email');
    });
  });
});
```

---

## Build & Development Commands

### Frontend (Next.js)
```bash
# Development
cd frontend
npm install
npm run dev          # Start dev server (port 3000)

# Build
npm run build        # Production build
npm run start        # Start production server

# Testing
npm run test         # Run tests
npm run test:watch   # Watch mode
npm run test:coverage # Coverage report

# Linting
npm run lint         # ESLint
npm run lint:fix     # Auto-fix
npm run type-check   # TypeScript check
```

### Backend (Node.js)
```bash
# Development
cd backend
npm install
npm run dev          # Start dev server (port 5000)

# Build
npm run build        # Compile TypeScript
npm run start        # Start production server

# Testing
npm run test         # Run tests
npm run test:e2e     # E2E tests

# Database
npm run migrate      # Run migrations
npm run seed         # Seed database
```

### Python Services
```bash
# Development
cd python-services
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Testing
pytest                    # Run tests
pytest --cov              # With coverage
pytest -v                 # Verbose

# Linting
black .                   # Format code
flake8                    # Lint
mypy .                    # Type check
```

### Rust Services
```bash
# Development
cd rust-services
cargo build              # Build
cargo run                # Run (port 8080)
cargo watch -x run       # Watch mode

# Testing
cargo test               # Run tests
cargo test -- --nocapture # Show output

# Linting
cargo clippy             # Lint
cargo fmt                # Format
```

### Docker
```bash
# Build all services
docker-compose build

# Start all services
docker-compose up

# Start specific service
docker-compose up frontend

# Stop all services
docker-compose down

# View logs
docker-compose logs -f

# Rebuild and restart
docker-compose up --build
```

---

## Code Review Checklist

### Functionality
- [ ] Code works as intended
- [ ] Edge cases handled
- [ ] Error handling implemented
- [ ] No console.log/print statements

### Code Quality
- [ ] Follows style guide
- [ ] No code duplication
- [ ] Functions are small and focused
- [ ] Clear variable names

### Testing
- [ ] Tests included
- [ ] Tests pass
- [ ] Coverage meets requirements
- [ ] Edge cases tested

### Security
- [ ] Input validation
- [ ] No hardcoded secrets
- [ ] SQL injection prevention
- [ ] XSS protection

### Performance
- [ ] No N+1 queries
- [ ] Efficient algorithms
- [ ] Proper caching
- [ ] No memory leaks

### Documentation
- [ ] Code comments where needed
- [ ] API docs updated
- [ ] README updated
- [ ] Changelog updated
