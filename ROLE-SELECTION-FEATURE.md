# Role Selection Feature

## Overview
Implemented a role selection feature that allows users with multiple roles (e.g., admin + lecturer) to choose which dashboard they want to access when logging in.

## What Changed

### Backend Changes

#### 1. Auth Controller (`server/src/controllers/authController.js`)
- **Modified `googleVerify`**: Now checks if a user has multiple roles
  - If multiple roles exist, returns `requiresRoleSelection: true` with available roles
  - Stores pending authentication data in session
  - If single role, proceeds with normal login
  
- **New `selectRole` endpoint**: Handles role selection after authentication
  - Validates the pending authentication
  - Creates session with selected role
  - Returns user profile

#### 2. Auth Service (`server/src/services/authService.js`)
- **Updated `findUserByEmail`**: Now finds all users with the same email (for multi-role support)
- **New `findAllUsersByEmail`**: Returns all user accounts for a given email
- **New `findUserByEmailAndRole`**: Finds specific user by email and role combination

#### 3. Auth Routes (`server/src/routes/authRoutes.js`)
- Added new route: `POST /auth/select-role`

### Frontend Changes

#### 1. Auth API (`client/src/api/authApi.ts`)
- **New interfaces**:
  - `AvailableRole`: Represents a role option
  - `RoleSelectionResponse`: Response when multiple roles are available
  - `AuthResponse`: Union type for auth responses
  
- **Updated `verifyGoogleToken`**: Returns `AuthResponse` (User or RoleSelectionResponse)
- **New `selectRole`**: Calls the backend to select a role

#### 2. Auth Context (`client/src/contexts/AuthContext.tsx`)
- **New state**: `roleSelectionData` - stores available roles when selection is needed
- **Updated `loginWithGIS`**: Handles both direct login and role selection flow
- **New `selectRole`**: Sends role selection to backend and updates user
- **New `clearRoleSelection`**: Clears role selection data (for cancel)

#### 3. Login Page (`client/src/pages/LoginPage.tsx`)
- **New `RoleSelectionModal` component**: Beautiful modal that displays available roles
  - Shows role icons and descriptions
  - Allows user to select their desired role
  - Has cancel option to go back
  
- **Updated login flow**: Shows role selection modal when multiple roles are available
- **New `handleRoleSelection`**: Handles role selection with error handling

## User Experience

### For Users with Single Role
- Login works exactly as before
- User is logged in directly to their dashboard

### For Users with Multiple Roles (e.g., Admin + Lecturer)
1. User clicks "Sign in with Google"
2. Google authentication completes
3. **NEW**: Role selection modal appears with options:
   - 👨‍💼 **Admin** - Manage system settings and users
   - 👨‍🏫 **Lecturer** - View and manage TA applications
4. User selects their desired role
5. User is redirected to the appropriate dashboard

### Visual Design
The role selection modal includes:
- Clear heading: "Select Your Role"
- Helpful description
- Large, clickable role cards with:
  - Emoji icons for visual recognition
  - Role name in bold
  - Brief description of what that role can do
- Hover effects for better UX
- Cancel button to go back

## How It Works

### Authentication Flow

```
┌─────────────────┐
│  User logs in   │
│  with Google    │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────┐
│ Backend checks email        │
│ - Find all user accounts    │
└────────┬────────────────────┘
         │
         ├─── Single role ────────────────┐
         │                                │
         │                                ▼
         │                      ┌──────────────────┐
         │                      │ Create session   │
         │                      │ Return user data │
         │                      └──────────────────┘
         │
         └─── Multiple roles ──────────┐
                                       │
                                       ▼
                          ┌─────────────────────────┐
                          │ Return available roles  │
                          │ Store pending auth      │
                          └───────────┬─────────────┘
                                      │
                                      ▼
                          ┌─────────────────────────┐
                          │ Show role selection     │
                          │ modal to user           │
                          └───────────┬─────────────┘
                                      │
                                      ▼
                          ┌─────────────────────────┐
                          │ User selects role       │
                          └───────────┬─────────────┘
                                      │
                                      ▼
                          ┌─────────────────────────┐
                          │ Backend validates       │
                          │ Creates session         │
                          │ Returns user data       │
                          └─────────────────────────┘
```

## Security Features

1. **Session-based validation**: Pending authentication data is stored in session
2. **Email verification**: Backend verifies the user's email matches the pending authentication
3. **Role verification**: Backend confirms the selected role belongs to the authenticated email
4. **Timeout protection**: If user refreshes during role selection, they need to login again
5. **Audit logging**: All role selections are logged as security events

## Testing

### Test Case 1: Admin with Lecturer Role
1. Create an admin user
2. Create a lecturer user with the same email
3. Login with that email
4. ✅ Role selection modal should appear with both options
5. Select "Admin"
6. ✅ Should be redirected to admin dashboard

### Test Case 2: Regular User
1. Login with a regular user (only one role)
2. ✅ Should login directly without role selection
3. ✅ Should be redirected to appropriate dashboard

### Test Case 3: Cancel Role Selection
1. Login with multi-role account
2. Role selection modal appears
3. Click "Cancel"
4. ✅ Modal should close
5. ✅ User can login again

## Configuration

No configuration needed! The feature automatically detects when a user has multiple roles and shows the selection dialog.

## Notes

- Only admin + lecturer combination is allowed (as per previous email uniqueness changes)
- Role selection persists for the entire session
- Logging out clears the session and user can select a different role on next login
- The feature is backward compatible - users with single role won't see any changes

