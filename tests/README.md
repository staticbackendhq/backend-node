# StaticBackend Node Client Test Suite

This test suite provides comprehensive coverage of the StaticBackend Node client library, mirroring the Go client tests.

## Prerequisites

1. **StaticBackend server must be running in development mode**
   - The tests assume the backend is available at `http://localhost:8099`
   - Default admin account: `admin@dev.com` / `devpw1234`
   - Public key: `dev_memory_pk`

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build the library**
   ```bash
   npm run build
   ```

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode
```bash
npm test:watch
```

### Run a specific test file
```bash
npm test -- account.test.ts
```

### Run with coverage
```bash
npm test -- --coverage
```

## Test Structure

The test suite is organized into the following files:

- **setup.ts** - Test configuration and utilities
- **account.test.ts** - User registration, login, and account management
- **db.test.ts** - Database CRUD operations, queries, bulk operations
- **cache.test.ts** - Real-time messaging (publish/subscribe)
- **storage.test.ts** - File upload, delete, and image resize
- **sudo.test.ts** - Admin/root level operations
- **extras.test.ts** - Email, SMS, URL conversion, and password management

## Test Coverage

The test suite covers all main Backend class methods:

### Authentication & Users
- `register()` - Register new user
- `login()` - User login
- `me()` - Get current user info
- `addUser()` - Add user to account
- `removeUser()` - Remove user from account
- `users()` - List account users
- `changePassword()` - Change user password
- `getPasswordResetCode()` - Get password reset code
- `resetPassword()` - Reset password with code
- `sudoGetToken()` - Get token for another account

### Database Operations
- `create()` - Create single document
- `createBulk()` - Create multiple documents
- `list()` - List documents with pagination
- `getById()` - Get document by ID
- `getByIds()` - Get multiple documents by IDs
- `query()` - Query documents with filters
- `update()` - Update single document
- `updateBulk()` - Update multiple documents
- `delete()` - Delete single document
- `deleteBulk()` - Delete multiple documents
- `count()` - Count documents
- `search()` - Full-text search
- `increase()` - Increment numeric field

### Sudo/Admin Operations
- `sudoList()` - List documents as admin
- `sudoGetById()` - Get document by ID as admin
- `sudoGetByIds()` - Get multiple documents as admin
- `sudoUpdate()` - Update document as admin
- `sudoQuery()` - Query documents as admin
- `sudoAddIndex()` - Add database index

### Cache Operations
- `cacheGet()` - Get cached value
- `cacheSet()` - Set cached value

### Storage Operations
- `storeFile()` - Upload file
- `deleteFile()` - Delete file
- `resizeImage()` - Resize image

### Real-time & Extras
- `publish()` - Publish real-time message
- `sendMail()` - Send email
- `sudoSendSMS()` - Send SMS
- `convertURLToX()` - Convert URL to PDF

## Notes

- All tests assume the backend is running locally in development mode
- Some tests (like SMS and email) may require additional service configuration
- Tests automatically clean up created documents before running
- Each test is independent and can run in isolation
