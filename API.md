# API Documentation

This document provides comprehensive documentation for the Todo Backend API endpoints.

## Base URL
```
http://localhost:3000
```

### Swagger API
```
http://localhost:3000/api
```

## Authentication
All endpoints except authentication endpoints require Bearer token authentication.

### Headers
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

---

## Authentication API

### Register User

**Endpoint:** `POST /auth/register`

**Description:** Register a new user account

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "User Name"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "User Name",
    "avatarUrl": null
  },
  "accessToken": "jwt_token"
}
```


### Login User

**Endpoint:** `POST /auth/login`

**Description:** Authenticate user and get access token

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "User Name",
    "avatarUrl": null
  },
  "accessToken": "jwt_token"
}
```


## Tasks API

### Create Task

**Endpoint:** `POST /tasks`

**Description:** Create a new task

**Request Body:**
```json
{
  "title": "Task Title",
  "description": "Task description",
  "status": "todo",
  "priority": "medium",
  "dueDate": "2024-01-01T00:00:00.000Z",
  "estimatedHours": 5,
  "teamId": "team-uuid",
  "assignedToId": "user-uuid",
  "parentTaskId": "parent-task-uuid"
}
```

**Fields:**
- `title` (required): Task title
- `description` (optional): Task description
- `status` (optional): Task status - `todo`, `in_progress`, `done`, `archived` (default: `todo`)
- `priority` (optional): Priority level - `low`, `medium`, `high`, `urgent` (default: `medium`)
- `dueDate` (optional): Due date in ISO format
- `estimatedHours` (optional): Estimated hours to complete
- `teamId` (optional): Team UUID
- `assignedToId` (optional): Assignee user UUID
- `parentTaskId` (optional): Parent task UUID for subtasks

**Response:**
```json
{
  "id": "task-uuid",
  "title": "Task Title",
  "description": "Task description",
  "status": "todo",
  "priority": "medium",
  "dueDate": "2024-01-01T00:00:00.000Z",
  "estimatedHours": 5,
  "actualHours": null,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "completedAt": null,
  "createdBy": {
    "id": "user-uuid",
    "email": "user@example.com",
    "name": "User Name",
    "avatarUrl": null
  },
  "assignedTo": {
    "id": "user-uuid",
    "email": "assignee@example.com",
    "name": "Assignee Name",
    "avatarUrl": null
  },
  "team": {
    "id": "team-uuid",
    "name": "Team Name"
  },
  "parentTask": {
    "id": "parent-task-uuid",
    "title": "Parent Task Title"
  },
  "subtasks": [],
  "watchers": []
}
```


### Get All Tasks (Paginated)

**Endpoint:** `GET /tasks`

**Description:** Get paginated tasks accessible to the authenticated user

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Number of items per page (default: 10, min: 1, max: 100)

**Response:**
```json
{
  "data": [
    {
      "id": "task-uuid",
      "title": "Task Title",
      "status": "todo",
      "priority": "medium",
      "dueDate": "2024-01-01T00:00:00.000Z",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "createdBy": {
        "id": "user-uuid",
        "email": "user@example.com",
        "name": "User Name"
      },
      "assignedTo": {
        "id": "user-uuid",
        "email": "assignee@example.com",
        "name": "Assignee Name"
      }
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3,
    "hasNext": true,
    "hasPrev": false
  }
}
```

**Note:** Returns tasks where the user is:
- The creator
- The assignee
- A watcher



### Get Task by ID

**Endpoint:** `GET /tasks/:id`

**Description:** Get a specific task by ID

**Path Parameters:**
- `id` (required): Task UUID

**Response:**
```json
{
  "id": "task-uuid",
  "title": "Task Title",
  "description": "Task description",
  "status": "todo",
  "priority": "medium",
  "dueDate": "2024-01-01T00:00:00.000Z",
  "estimatedHours": 5,
  "actualHours": null,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "completedAt": null,
  "createdBy": {
    "id": "user-uuid",
    "email": "user@example.com",
    "name": "User Name",
    "avatarUrl": null
  },
  "assignedTo": {
    "id": "user-uuid",
    "email": "assignee@example.com",
    "name": "Assignee Name",
    "avatarUrl": null
  },
  "team": {
    "id": "team-uuid",
    "name": "Team Name"
  },
  "parentTask": {
    "id": "parent-task-uuid",
    "title": "Parent Task Title"
  },
  "subtasks": [
    {
      "id": "subtask-uuid",
      "title": "Subtask Title",
      "status": "todo",
      "priority": "medium"
    }
  ],
  "watchers": [
    {
      "id": "user-uuid",
      "email": "watcher@example.com",
      "name": "Watcher Name"
    }
  ]
}
```



### Update Task

**Endpoint:** `PATCH /tasks/:id`

**Description:** Update a specific task

**Path Parameters:**
- `id` (required): Task UUID

**Request Body:**
```json
{
  "title": "Updated Title",
  "status": "in_progress",
  "priority": "high",
  "dueDate": "2024-01-15T00:00:00.000Z",
  "estimatedHours": 8,
  "assignedToId": "new-assignee-uuid"
}
```

**Note:** All fields are optional. Only provided fields will be updated.

**Response:**
```json
{
  "id": "task-uuid",
  "title": "Updated Title",
  "status": "in_progress",
  "priority": "high",
  "dueDate": "2024-01-15T00:00:00.000Z",
  "estimatedHours": 8,
  "updatedAt": "2024-01-02T00:00:00.000Z"
}
```


---

### Delete Task

**Endpoint:** `DELETE /tasks/:id`

**Description:** Delete a specific task

**Path Parameters:**
- `id` (required): Task UUID

**Response:**
```
No content
```


### Assign Task to User

**Endpoint:** `POST /tasks/:id/assign/:userId`

**Description:** Assign a task to a specific user

**Path Parameters:**
- `id` (required): Task UUID
- `userId` (required): User UUID to assign to

**Response:**
```json
{
  "id": "task-uuid",
  "title": "Task Title",
  "assignedTo": {
    "id": "user-uuid",
    "email": "assignee@example.com",
    "name": "Assignee Name"
  }
}
```

---

### Watch Task

**Endpoint:** `POST /tasks/:id/watch`

**Description:** Start watching a task for updates

**Path Parameters:**
- `id` (required): Task UUID

**Response:**
```json
{
  "id": "task-uuid",
  "title": "Task Title",
  "watchers": [
    {
      "id": "user-uuid",
      "email": "user@example.com",
      "name": "User Name"
    }
  ]
}
```


---

### Unwatch Task

**Endpoint:** `DELETE /tasks/:id/watch`

**Description:** Stop watching a task

**Path Parameters:**
- `id` (required): Task UUID

**Response:**
```json
{
  "id": "task-uuid",
  "title": "Task Title",
  "watchers": []
}
```

---

## Error Responses

### Standard Error Format
```json
{
  "statusCode": 400,
  "message": "Error description",
  "error": "Bad Request"
}
```

### Common Error Codes
```
  1001: 'Jwt must be provided',
  1002: 'User already exists',
  1003: 'User not found',
  1004: 'Invalid password',
```
---

## Data Types

### Task Status
- `todo`: Task is pending
- `in_progress`: Task is being worked on
- `done`: Task is completed
- `archived`: Task is archived

### Priority Levels
- `low`: Low priority
- `medium`: Medium priority (default)
- `high`: High priority
- `urgent`: Urgent priority

---
