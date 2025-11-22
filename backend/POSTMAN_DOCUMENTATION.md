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
| POST | `/api/auth/logout` | Logout user | ✅ |

**Login Rate Limit:** 3 attempts per minute

### 2. Users (`/api/users`)

| Method | Endpoint | Description | Auth Required | Role Required |
|--------|----------|-------------|---------------|--------------|
| GET | `/api/users/:id` | Get user by ID | ✅ | - |
| POST | `/api/users/:id/follow` | Follow a user | ✅ | - |
| DELETE | `/api/users/:id/unfollow` | Unfollow a user | ✅ | - |
| POST | `/api/users/:id/block` | Block a user | ✅ | - |
| DELETE | `/api/users/:id/unblock` | Unblock a user | ✅ | - |
| DELETE | `/api/users/:id` | Delete user | ✅ | Admin/Owner |

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
| DELETE | `/api/admin/:adminId` | Delete admin | ✅ | Owner |

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

## ✅ Testing Workflow

1. **Sign Up** → Creates account and sets cookie
2. **Login** → Sets authentication cookie
3. **Get Profile** → Verify authentication works
4. **Upload Post** → Create a test post
5. **Get All Posts** → See your post in feed
6. **Like Post** → Like a post (use postId from previous response)
7. **Follow User** → Follow another user (use userId)
8. **Get All Activities** → See activity wall with formatted messages
9. **Block User** → Block a user
10. **Get All Posts** → Verify blocked user's posts are hidden

### Testing Admin/Owner Features

1. **Create Owner Account** (manually set role in database or signup with role: "owner")
2. **Login as Owner**
3. **Create Admin** → Create an admin user
4. **Get All Admins** → List all admins
5. **Delete User** → Delete a user (requires admin/owner)
6. **Delete Post** → Delete any post (requires admin/owner or be author)
7. **Delete Like** → Remove a like from a post (requires admin/owner)

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
- Soft delete is used (deleted items are marked, not removed)
- Activity wall shows all activities in the network
- Rate limiting: 3 login attempts per minute

## 🔗 Environment Variables

If you want to use Postman Environments:

1. Create a new Environment
2. Add variable: `baseUrl` = `http://localhost:5000`
3. Select the environment in Postman
4. The collection will use the environment variable

---

**Happy Testing! 🚀**

