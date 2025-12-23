# Authentication Proxy System

A comprehensive authentication proxy system for handling login flows, session management, and single sign-on (SSO) across embedded UIs in the Future App ecosystem.

## Features

- **JWT-based Authentication**: Secure token-based authentication with refresh tokens
- **Single Sign-On (SSO)**: Cross-app authentication with token sharing
- **Session Management**: Persistent session storage with Redis fallback
- **Embedded App Support**: Secure iframe communication and token forwarding
- **Credential Vault**: Encrypted storage and sharing of sensitive credentials
- **Security Policies**: Configurable authentication policies per app
- **Audit Logging**: Comprehensive logging of authentication events

## Architecture

### Core Components

1. **AuthenticationManager**: Handles user authentication, JWT validation, and session management
2. **AuthenticationProxy**: Manages iframe sessions and SSO token sharing
3. **RedisSessionStore**: Persistent session storage with automatic cleanup
4. **SSOIframeHandler**: Cross-origin communication between parent and embedded apps
5. **CredentialVault**: Encrypted credential storage and access control
6. **Token Forwarding Middleware**: Automatic token injection for embedded requests

### Authentication Flow

```
1. User visits embedded app
2. App requests authentication via iframe communication
3. AuthenticationProxy creates SSO context
4. User logs in once, gets tokens for all authorized apps
5. Tokens are shared securely across apps
6. Automatic token refresh and session management
```

## API Endpoints

### Authentication
- `POST /auth/login` - User login with credentials
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - User logout
- `GET /auth/me` - Get current user info

### SSO Management
- `POST /auth/sso/context` - Create SSO context for multiple apps
- `GET /auth/sso/status` - Get authentication status across apps
- `POST /auth/sso/token` - Request cross-app token sharing

### Iframe Communication
- `POST /auth/iframe/message` - Handle messages from embedded iframes

## Configuration

### Environment Variables
```bash
JWT_SECRET=your-jwt-secret-key
REDIS_URL=redis://localhost:6379
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:9992
```

### Embedded App Configuration
Each embedded app can be configured with:

```typescript
{
  id: 'vy-workflows',
  authenticationMode: 'sso',
  sso: {
    enabled: true,
    autoLogin: true,
    tokenSharing: true,
    sharedApps: ['bytebot', 'factif-ai']
  },
  authPolicy: {
    requireMfa: false,
    maxSessionDuration: 3600000,
    rateLimit: { requests: 1000, window: 60000 }
  },
  credentialSharing: {
    enabled: true,
    allowedTypes: ['api-key', 'oauth']
  }
}
```

## Usage

### For Embedded Applications

1. **Include the Auth Widget**:
```html
<iframe src="auth-widget.html" width="400" height="300"></iframe>
```

2. **Initialize Iframe Client**:
```javascript
const iframeClient = new IframeClient('http://localhost:3000');

// Request SSO login
await iframeClient.requestSSOLogin('my-app-id', sessionId);

// Request token sharing
await iframeClient.requestToken('my-app-id', sourceSessionId);
```

3. **Handle Authentication in Parent**:
```javascript
const ssoHandler = new SSOIframeHandler(authProxy);

// Send auth message to iframe
ssoHandler.sendAuthMessage(iframe, 'app-id', sessionId, origin);
```

### For Backend Integration

1. **Initialize Services**:
```typescript
const authManager = new AuthenticationManager();
const sessionStore = new RedisSessionStore({
  host: 'localhost',
  port: 6379,
  ttl: 86400
});
const authProxy = new AuthenticationProxy(authManager);
const credentialVault = new CredentialVault({
  encryptionKey: 'your-encryption-key'
});
```

2. **Use Middleware**:
```typescript
app.use('/api/apps', tokenForwardingMiddleware(authProxy));
app.use('/api/apps', embeddedAppValidationMiddleware(authProxy));
```

## Security Features

- **JWT Token Validation**: Secure token verification with expiration
- **Origin Validation**: CORS protection for embedded apps
- **Rate Limiting**: Configurable request limits per app
- **Audit Logging**: Comprehensive authentication event logging
- **Credential Encryption**: AES-256 encryption for stored credentials
- **CSRF Protection**: State-based protection for auth flows
- **Secure Headers**: Automatic security headers for embedded content

## Credential Vault

Store and share sensitive credentials securely:

```typescript
// Store a credential
await vault.storeCredential(
  userId,
  'GitHub API Key',
  'api-key',
  { token: 'ghp_...' },
  ['vy-workflows', 'bytebot']
);

// Retrieve for app
const credential = await vault.getCredential(
  credentialId,
  'vy-workflows',
  userId
);
```

## Session Management

Sessions are automatically managed with:

- **Redis Persistence**: Distributed session storage
- **Automatic Cleanup**: Expired session removal
- **Activity Tracking**: Session activity monitoring
- **SSO Context**: Cross-app session sharing

## Development

### Building
```bash
cd orchestrator
npm install
npm run build
npm start
```

### Testing
```bash
npm test
```

### Docker
```bash
docker build -t auth-proxy .
docker run -p 3000:3000 auth-proxy
```

## Examples

See `auth-widget.html` for a complete example of an embedded authentication widget that integrates with the proxy system.

## Security Considerations

- Always use HTTPS in production
- Rotate JWT secrets regularly
- Implement proper rate limiting
- Monitor authentication logs
- Use strong encryption keys
- Validate all input data
- Implement proper CORS policies

## Contributing

1. Follow TypeScript strict mode
2. Add comprehensive tests
3. Update documentation
4. Follow security best practices
5. Use meaningful commit messages

## License

ISC