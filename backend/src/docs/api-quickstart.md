# API Quickstart Guide

This guide provides a quick overview of how to use the API with cURL.

## Prerequisites

- Make sure the server is running (`npm run dev`).
- You have an API client like cURL or Postman.

## 1. Register a new user

```bash
curl -X POST http://localhost:4000/api/v1/auth/register \
-H "Content-Type: application/json" \
-d '{
  "name": "Test User",
  "email": "test@example.com",
  "password": "password123",
  "role": "dosen"
}'
```

## 2. Login

```bash
curl -X POST http://localhost:4000/api/v1/auth/login \
-H "Content-Type: application/json" \
-d '{
  "email": "test@example.com",
  "password": "password123"
}'
```

From the response, copy the `token` value.

## 3. Set authentication token

```bash
export TOKEN="your_jwt_token_here"
```

## 4. Upload a paper

Create a dummy file `paper.pdf` first.

```bash
curl -X POST http://localhost:4000/api/v1/papers \
-H "Authorization: Bearer $TOKEN" \
-F "file=@/path/to/your/paper.pdf" \
-F "title=My First Paper" \
-F "abstract=This is the abstract of my first paper." \
-F "authors[]=Author One" \
-F "authors[]=Author Two"
```

From the response, copy the `_id` of the created paper.

## 5. Search for papers

```bash
curl -X GET "http://localhost:4000/api/v1/search?q=first%20paper&scope=papers"
```

## 6. Create a reading list

```bash
curl -X POST http://localhost:4000/api/v1/reading-lists \
-H "Authorization: Bearer $TOKEN" \
-H "Content-Type: application/json" \
-d '{
  "name": "My Awesome Reading List",
  "description": "A collection of interesting papers."
}'
```

From the response, copy the `_id` of the created reading list.

## 7. Add a paper to a reading list

Replace `:listId` with your reading list ID and `:paperId` with your paper ID.

```bash
curl -X POST http://localhost:4000/api/v1/reading-lists/:listId/items \
-H "Authorization: Bearer $TOKEN" \
-H "Content-Type: application/json" \
-d '{
  "paperId": ":paperId"
}'
```

## 8. Download a paper

Replace `:id` with your paper ID.

```bash
curl -X GET http://localhost:4000/api/v1/papers/:id/download -o downloaded_paper.pdf
```

## Atlas Search Setup

To enable full-text search, you need to create search indexes in your MongoDB Atlas cluster.

1.  Go to your cluster in Atlas.
2.  Click on the "Search" tab.
3.  Click "Create Search Index".

### papers_default index

-   **Index Name**: `papers_default`
-   **Database and Collection**: Select your database and the `papers` collection.
-   **Configuration**: Use the JSON editor and paste the following configuration:

```json
{
  "mappings": {
    "dynamic": true
  }
}
```

### artifacts_default index

-   **Index Name**: `artifacts_default`
-   **Database and Collection**: Select your database and the `artifacts` collection.
-   **Configuration**: Use the JSON editor and paste the following configuration:

```json
{
  "mappings": {
    "dynamic": true
  }
}
```

Click "Create Index" and wait for the indexes to build.
