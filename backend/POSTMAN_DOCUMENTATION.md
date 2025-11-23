# Postman API Documentation

## 📥 How to Import

1. Open Postman application
2. Click **Import** button (top left)
3. Select **File** tab
4. Choose `Social_Backend_API.postman_collection.json`
5. Click **Import**

The collection will be imported with all endpoints organized in folders.

## 🔧 Setup

### Base URL Configuration

The collection uses a variable `{{baseUrl}}` which defaults to `http://localhost:5000`.

To change it:
1. Click on the collection name
2. Go to **Variables** tab
3. Update the `baseUrl` value
4. Click **Save**

### Authentication

This API uses **HTTP-only cookies** for authentication. After successful login or signup:
- The server automatically sets a `token` cookie
- Postman will automatically include this cookie in subsequent requests
- No manual header setup needed!

**Important:** Make sure cookies are enabled in Postman:
- Go to **Settings** → **General**
- Enable **Automatically follow redirects** (optional)
- Cookies are handled automatically by Postman

## 📋 API Endpoints

### 1. Authentication (`/api/auth`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/signup` | Create new user account | ❌ |
| POST | `/api/auth/login` | Login user | ❌ |
| GET | `/api/auth/check-auth` | Verify authentication | ✅ |
| GET | `/api/auth/profile` | Get current user profile | ✅ |
| PUT | `/api/auth/profile` | Update user profile (bio, profile picture) | ✅ |
| POST | `/api/auth/logout` | Logout user | ✅ |

**Login Rate Limit:** 3 attempts per minute

**Update Profile:**
- Use `form-data` with fields:
  - `bio`: Optional (string)
  - `profilePicture`: Optional (image file, max 5MB)
- If only updating bio, send JSON body with `{ "bio": "New bio text" }`

### 2. Users (`/api/users`)

| Method | Endpoint | Description | Auth Required | Role Required |
|--------|----------|-------------|---------------|--------------|
| GET | `/api/users/blocked` | Get list of blocked users | ✅ | - |
| GET | `/api/users/:id` | Get user by ID | ✅ | - |
| GET | `/api/users/:id/posts` | Get all posts by a specific user | ✅ | - |
| POST | `/api/users/:id/follow` | Follow a user | ✅ | - |
| DELETE | `/api/users/:id/unfollow` | Unfollow a user | ✅ | - |
| POST | `/api/users/:id/block` | Block a user | ✅ | - |
| DELETE | `/api/users/:id/unblock` | Unblock a user | ✅ | - |
| DELETE | `/api/users/:id` | Delete user | ✅ | Admin/Owner |

**Notes:**
- `GET /api/users/:id` - Admins/Owners can view blocked users for moderation
- `GET /api/users/:id/posts` - Returns posts filtered by blocking rules
- `GET /api/users/blocked` - Returns list of users you have blocked with their details

### 3. Posts (`/api/posts`)

| Method | Endpoint | Description | Auth Required | Role Required |
|--------|----------|-------------|---------------|--------------|
| GET | `/api/posts/getAll` | Get all posts | ✅ | - |
| POST | `/api/posts/upload` | Create new post | ✅ | - |
| GET | `/api/posts/like/:postId` | Like/unlike post | ✅ | - |
| DELETE | `/api/posts/:postId` | Delete post | ✅ | Author/Admin/Owner |
| DELETE | `/api/posts/:postId/like/:userId` | Remove like | ✅ | Admin/Owner |

**Post Upload:**
- Content: Required (1-5000 characters)
- Image: Optional (max 5MB, formats: jpeg/jpg/png/gif/webp)
- Use `form-data` with field name `content` and `image`

### 4. Activities (`/api/activities`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/activities/getAll` | Get activity wall | ✅ |

**Activity Messages Format:**
- "ABC made a post"
- "DEF followed ABC"
- "PQR liked ABC's post"
- "Post deleted by Admin"
- "User deleted by Owner"

### 5. Admin (`/api/admin`)

| Method | Endpoint | Description | Auth Required | Role Required |
|--------|----------|-------------|---------------|--------------|
| POST | `/api/admin/create` | Create admin | ✅ | Owner |
| GET | `/api/admin/getAll` | Get all admins | ✅ | Owner |
| GET | `/api/admin/users` | Get all users with post counts | ✅ | Admin/Owner |
| DELETE | `/api/admin/:adminId` | Delete admin | ✅ | Owner |

**Notes:**
- `GET /api/admin/users` - Returns all users with their post counts for admin panel
- Admin users can access `/api/admin/users` but cannot create/delete admins

## 🎭 User Roles

### User (Default)
- Create posts
- Like posts
- Follow/unfollow users
- Block/unblock users
- View activity wall
- Delete own posts

### Admin
- All User permissions
- Delete any user
- Delete any post
- Remove likes from posts

### Owner
- All Admin permissions
- Create admins
- Delete admins

## 📝 Example Request Bodies

### Sign Up
```json
{
    "emailId": "user@example.com",
    "username": "testuser",
    "password": "Test123!@#",
    "bio": "This is my bio",
    "role": "user"
}
```

### Login
```json
{
    "emailId": "user@example.com",
    "password": "Test123!@#"
}
```

### Create Admin (Owner Only)
```json
{
    "emailId": "admin@example.com",
    "username": "adminuser",
    "password": "Admin123!@#",
    "bio": "Admin bio"
}
```

### Upload Post (Form Data)
- `content`: "This is my post content"
- `image`: [Select file] (optional)

### Update Profile (Form Data)
- `bio`: "Updated bio text" (optional)
- `profilePicture`: [Select file] (optional, max 5MB)

**OR** (JSON body for bio only):
```json
{
    "bio": "Updated bio text"
}
```

## ✅ Testing Workflow

### Basic User Flow

1. **Sign Up** → Creates account and sets cookie
2. **Login** → Sets authentication cookie
3. **Get Profile** → Verify authentication works
4. **Update Profile** → Update bio or profile picture
5. **Upload Post** → Create a test post
6. **Get All Posts** → See your post in feed
7. **Like Post** → Like a post (use postId from previous response)
8. **Follow User** → Follow another user (use userId)
9. **Get User Posts** → Get all posts by a specific user (`GET /api/users/:id/posts`)
10. **Get All Activities** → See activity wall with formatted messages
11. **Block User** → Block a user
12. **Get Blocked Users** → View list of blocked users (`GET /api/users/blocked`)
13. **Get All Posts** → Verify blocked user's posts are hidden
14. **Unblock User** → Unblock a user

### Testing Admin/Owner Features

1. **Create Owner Account** (manually set role in database or signup with role: "owner")
2. **Login as Owner**
3. **Get All Users** → View all users with post counts (`GET /api/admin/users`)
4. **Create Admin** → Create an admin user
5. **Get All Admins** → List all admins
6. **Delete User** → Delete a user (requires admin/owner)
7. **Delete Post** → Delete any post (requires admin/owner or be author)
8. **Delete Like** → Remove a like from a post (requires admin/owner)
9. **Delete Admin** → Delete an admin (Owner only)

## 🔍 Response Format

All responses follow this format:

**Success:**
```json
{
    "success": true,
    "message": "Operation successful",
    "data": { ... }
}
```

**Error:**
```json
{
    "success": false,
    "message": "Error message"
}
```

## 📄 Example Responses

### Get Blocked Users (`GET /api/users/blocked`)
```json
{
    "success": true,
    "message": "Blocked users fetched successfully",
    "blockedUsers": [
        {
            "_id": "507f1f77bcf86cd799439011",
            "username": "blockeduser",
            "emailId": "blocked@example.com",
            "profilePicture": "https://cloudinary.com/image.jpg",
            "bio": "User bio"
        }
    ]
}
```

### Get User Posts (`GET /api/users/:id/posts`)
```json
{
    "success": true,
    "message": "User posts fetched successfully",
    "posts": [
        {
            "_id": "507f1f77bcf86cd799439012",
            "content": "Post content",
            "image": "https://cloudinary.com/image.jpg",
            "likes": ["507f1f77bcf86cd799439011"],
            "likesCount": 1,
            "author": {
                "_id": "507f1f77bcf86cd799439010",
                "username": "authoruser",
                "profilePicture": "https://cloudinary.com/image.jpg"
            },
            "createdAt": "2024-01-15T10:30:00.000Z"
        }
    ],
    "count": 1
}
```

### Get All Users for Admin (`GET /api/admin/users`)
```json
{
    "success": true,
    "message": "Users fetched successfully",
    "users": [
        {
            "_id": "507f1f77bcf86cd799439010",
            "username": "testuser",
            "emailId": "user@example.com",
            "role": "user",
            "postCount": 5,
            "createdAt": "2024-01-10T10:30:00.000Z"
        }
    ],
    "count": 1
}
```

### Update Profile (`PUT /api/auth/profile`)
```json
{
    "success": true,
    "message": "Profile updated successfully",
    "user": {
        "_id": "507f1f77bcf86cd799439010",
        "username": "testuser",
        "emailId": "user@example.com",
        "bio": "Updated bio",
        "profilePicture": "https://cloudinary.com/image.jpg",
        "role": "user"
    }
}
```

## 🐛 Common Issues

### 401 Unauthorized
- Make sure you've logged in first
- Check that cookies are enabled in Postman
- Verify the token cookie exists

### 403 Forbidden
- Check your user role (Admin/Owner required for some endpoints)
- Verify you're not trying to access blocked user's content

### 400 Bad Request
- Check request body format
- Verify required fields are provided
- Check file size limits (5MB for images)

### 404 Not Found
- Verify the endpoint URL is correct
- Check that IDs are valid MongoDB ObjectIds

## 📌 Notes

- All timestamps are in ISO 8601 format
- User IDs and Post IDs are MongoDB ObjectIds
- Posts from blocked users are automatically filtered
- **Hard delete is used** - When admins/owners delete users or admins, they are permanently removed from the database (not soft deleted)
- Posts from deleted users are also hard deleted
- Activity wall shows all activities in the network
- Rate limiting: 3 login attempts per minute
- Admins and Owners can bypass blocking restrictions when viewing user profiles for moderation purposes
- Blocking works both ways - if User A blocks User B, neither can see the other's posts

## 🔗 Environment Variables

If you want to use Postman Environments:

1. Create a new Environment
2. Add variable: `baseUrl` = `http://localhost:5000`
3. Select the environment in Postman
4. The collection will use the environment variable

---

**Happy Testing! 🚀**

