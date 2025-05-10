# Client & Project API Documentation

## Authentication
All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## Client Registration
Register a new client account.

**Endpoint:** `POST /api/clients/register`

**Request Body:**
```json
{
  "name": "string",     // Required
  "email": "string",    // Required, must be unique
  "phone": "string",    // Optional
  "password": "string"  // Required, min 6 characters
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Registration successful."
}
```

**Error Responses:**
- 400 Bad Request
  ```json
  {
    "success": false,
    "message": "Name, email, and password are required."
  }
  ```
- 400 Bad Request (Email exists)
  ```json
  {
    "success": false,
    "message": "Email already registered."
  }
  ```

## Client Login
Authenticate a client and receive a JWT token.

**Endpoint:** `POST /api/clients/login`

**Request Body:**
```json
{
  "email": "string",    // Required
  "password": "string"  // Required
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "token": "jwt_token_string"
}
```

**Error Responses:**
- 400 Bad Request
  ```json
  {
    "success": false,
    "message": "Email and password are required."
  }
  ```
- 400 Bad Request (Invalid credentials)
  ```json
  {
    "success": false,
    "message": "Invalid credentials."
  }
  ```

## Get Client Profile
Get the authenticated client's profile information.

**Endpoint:** `GET /api/clients/profile`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "_id": "string",
    "name": "string",
    "email": "string",
    "phone": "string",
    "status": "active" | "inactive",
    "createdAt": "date",
    "updatedAt": "date"
  }
}
```

**Error Responses:**
- 404 Not Found
  ```json
  {
    "success": false,
    "message": "Client not found."
  }
  ```

# Project Creation Endpoints

## 1. Client: Submit Project
Submit a new project as the authenticated client. **The `client_id` is taken from the JWT token and should NOT be included in the request body.**

**Endpoint:**  `POST /api/clients/projects`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "projectTitle": "E-commerce Website",
  "projectDescription": "Build a full-featured e-commerce platform with payment integration.",
  "projectCategory": "Web Development",
  "projectDeadline": "2024-07-31T00:00:00.000Z",
  "skills": ["React", "Node.js", "MongoDB"],
  "complexity": "High",
  "additionalReq": "Mobile responsive, SEO optimized",
  "paymentMethod": "Milestone",
  "paymentAmount": 5000
}
```
> **Note:** Do NOT include `client_id` in the request body. It is set automatically from your authentication token.

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "_id": "string",
    "title": "string",
    "description": "string",
    "category": "string",
    "deadline": "date",
    "requiredSkills": ["string"],
    "complexity": "string",
    "additionalRequirements": "string",
    "paymentMethod": "string",
    "paymentAmount": "number",
    "status": "pending",
    "client_id": "string",      // Set by backend
    "createdAt": "date",
    "updatedAt": "date"
  }
}
```

## 2. Admin/General: Create Project
Create a new project as an admin or via the general project creation endpoint. **The admin must provide the `client_id` in the request body.**

**Endpoint:**  `POST /admin/api/projects`

**Request Body:**
```json
{
  "client_id": "string",            // Required, client MongoDB ObjectId
  "title": "string",                // Required
  "description": "string",          // Required
  "category": "string",             // Required
  "deadline": "date",               // Required
  "requiredSkills": ["string"],     // Required, array of skills
  "complexity": "string",           // Required
  "additionalRequirements": "string", // Optional
  "paymentMethod": "string",        // Required
  "paymentAmount": "number"         // Optional
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "_id": "string",
    "client_id": "string",
    "title": "string",
    "description": "string",
    "category": "string",
    "deadline": "date",
    "requiredSkills": ["string"],
    "complexity": "string",
    "additionalRequirements": "string",
    "paymentMethod": "string",
    "paymentAmount": "number",
    "status": "pending",
    "createdAt": "date",
    "updatedAt": "date"
  }
}
```

**Error Responses:**
- 404 Not Found (Client not found)
  ```json
  {
    "success": false,
    "message": "Client not found"
  }
  ```
- 500 Server Error
  ```json
  {
    "success": false,
    "message": "Error creating project"
  }
  ```

## Get My Projects
Get all projects for the authenticated client.

**Endpoint:** `GET /api/clients/projects`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `status` (optional): Filter by project status ("all", "pending", "in-progress", "completed")
- `search` (optional): Search in title and description

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "title": "string",
      "description": "string",
      "status": "string",
      "startDate": "date",
      "deadline": "date",
      "completedAt": "date",
      "assignedEngineers": "string",  // Comma-separated list of engineer names
      "progress": "number",           // 0-100
      "category": "string",
      "complexity": "string",
      "paymentMethod": "string",
      "paymentAmount": "number"
    }
  ]
}
```

## Data Models

### Client Model
```javascript
{
  name: String,          // Required
  email: String,         // Required, unique
  phone: String,         // Optional
  password: String,      // Required, min 6 chars
  status: String,        // Enum: ['active', 'inactive']
  createdAt: Date,       // Auto-generated
  updatedAt: Date        // Auto-generated
}
```

### Project Model
```javascript
{
  id: String,
  title: String,
  description: String,
  status: String,        // Enum: ['pending', 'in-progress', 'completed']
  startDate: Date,
  deadline: Date,
  completedAt: Date,
  assignedEngineers: String,  // Comma-separated list
  progress: Number,           // 0-100
  category: String,
  complexity: String,         // Enum: ['Low', 'Medium', 'High']
  paymentMethod: String,
  paymentAmount: Number
}
```

## Error Handling
All endpoints follow a consistent error response format:
```json
{
  "success": false,
  "message": "Error message description"
}
```

Common HTTP Status Codes:
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 404: Not Found
- 500: Server Error

## Security Notes
1. Passwords are hashed using bcrypt before storage
2. JWT tokens expire after 7 days
3. Password is never returned in responses
4. Email addresses are stored in lowercase
5. Phone numbers are validated for format 