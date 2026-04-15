# Gender Classification API

An Express.js API that predicts gender from a first name and can create, fetch, filter, and delete stored profile records in MongoDB. The service consumes `Genderize`, `Agify`, and `Nationalize`, and is configured for both local development and Vercel deployment.

## Features

- Predict gender from a first name with confidence metadata
- Build a profile with gender, age, age group, and most likely country
- Persist profiles in MongoDB
- Fetch a single profile by Mongo document ID
- Filter saved profiles by `gender`, `country_id`, and `age_group`
- Delete saved profiles
- CORS enabled for browser clients
- Ready for Vercel deployment

## Tech Stack

- Node.js
- Express
- MongoDB with Mongoose
- dotenv
- Vercel

## Project Structure

```text
.
|-- README.md
|-- vercel.json
`-- server
    |-- models
    |   `-- dataModel.js
    |-- package-lock.json
    |-- package.json
    `-- server.js
```

## Local Setup

1. Install dependencies in `server/`.

```bash
cd server
npm install
```

2. Create `server/.env`.

```env
MONGODB_URI=your_mongodb_connection_string
ENVIRONMENT=development
PORT=3000
```

3. Start the server.

```bash
npm start
```

The current `start` script runs `nodemon server.js`.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URI` | Yes | MongoDB connection string used on startup and during requests |
| `ENVIRONMENT` | Yes | Use `development` locally and `production` on Vercel |
| `PORT` | Local only | Port for local server startup, defaults to `3000` |

## Base URL

- Local: `http://localhost:3000`
- Vercel: `https://your-project.vercel.app`

## API Endpoints

### `GET /`

Health-style root response.

#### Response

```json
{
  "message": "Hello from the server!"
}
```

### `GET /api/classify`

Predicts gender for a supplied first name using `Genderize`.

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | string | Yes | First name to classify |

#### Example Request

```text
GET /api/classify?name=john
```

#### Success Response

```json
{
  "status": "success",
  "data": {
    "name": "john",
    "gender": "male",
    "probability": 0.99,
    "sample_Size": 12345,
    "is_confident": true,
    "processed_at": "2026-04-15T10:00:00.000Z"
  }
}
```

#### Error Responses

```json
{
  "status": "error",
  "message": "Missing or empty name parameter"
}
```

```json
{
  "status": "error",
  "message": "Name is not a string"
}
```

```json
{
  "status": "error",
  "message": "No apiData or prediction available for the provided name"
}
```

### `POST /api/profiles`

Creates and stores a generated profile. This endpoint reads `name` from the JSON request body.

#### Request Body

```json
{
  "name": "john"
}
```

#### Success Response

```json
{
  "status": "success",
  "data": {
    "id": "01963f4e-7c41-7ec6-9e44-75a7b7782e1c",
    "name": "john",
    "gender": "male",
    "gender_probability": 0.99,
    "sample_size": 12345,
    "age": 34,
    "age_group": "adult",
    "country_id": "US",
    "country_probability": 0.12,
    "created_at": "2026-04-15T10:00:00.000Z"
  }
}
```

#### Existing Profile Response

```json
{
  "status": "success",
  "message": "Profile already exists",
  "data": {
    "id": "01963f4e-7c41-7ec6-9e44-75a7b7782e1c",
    "name": "john",
    "gender": "male",
    "gender_probability": 0.99,
    "sample_size": 12345,
    "age": 34,
    "age_group": "adult",
    "country_id": "US",
    "country_probability": 0.12,
    "created_at": "2026-04-15T10:00:00.000Z"
  }
}
```

#### Error Responses

```json
{
  "status": "error",
  "message": "Missing or empty name"
}
```

```json
{
  "status": "error",
  "message": "Invalid type"
}
```

```json
{
  "status": "error",
  "message": "Genderize returned an invalid response"
}
```

### `GET /api/profiles`

Returns saved profiles. Supports optional filtering.

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `gender` | string | No | Case-insensitive gender filter |
| `country_id` | string | No | Case-insensitive country code filter |
| `age_group` | string | No | Case-insensitive age group filter |

#### Example Requests

```text
GET /api/profiles
GET /api/profiles?gender=female
GET /api/profiles?country_id=NG&age_group=adult
```

#### Success Response

```json
{
  "status": "success",
  "count": 2,
  "data": [
    {
      "id": "01963f4e-7c41-7ec6-9e44-75a7b7782e1c",
      "name": "john",
      "gender": "male",
      "age": 34,
      "age_group": "adult",
      "country_id": "US"
    }
  ]
}
```

### `GET /api/profiles/:id`

Fetches a single saved profile by MongoDB document ID.

#### Example Request

```text
GET /api/profiles/67fd47ab10ef65a68d9cc001
```

#### Success Response

```json
{
  "status": "success",
  "data": {
    "id": "01963f4e-7c41-7ec6-9e44-75a7b7782e1c",
    "name": "john",
    "gender": "male",
    "gender_probability": 0.99,
    "sample_size": 12345,
    "age": 34,
    "age_group": "adult",
    "country_id": "US",
    "country_probability": 0.12,
    "created_at": "2026-04-15T10:00:00.000Z"
  }
}
```

#### Error Response

```json
{
  "status": "error",
  "message": "Profile not found"
}
```

### `DELETE /api/profiles/:id`

Deletes a saved profile by MongoDB document ID.

#### Example Request

```text
DELETE /api/profiles/67fd47ab10ef65a68d9cc001
```

#### Success Response

Returns `204 No Content`.

#### Error Response

```json
{
  "status": "error",
  "message": "Profile not found"
}
```

## cURL Examples

```bash
curl "http://localhost:3000/api/classify?name=alex"
```

```bash
curl -X POST "http://localhost:3000/api/profiles" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"alex\"}"
```

```bash
curl "http://localhost:3000/api/profiles?country_id=NG&age_group=adult"
```

## Vercel Deployment Notes

This repo uses [vercel.json](/c:/Users/HomePC/Desktop/Projects/HNG14/genderAPI-stage0/vercel.json) to route all requests to `server/server.js`.

Set these environment variables in Vercel project settings:

```env
MONGODB_URI=your_mongodb_connection_string
ENVIRONMENT=production
```

Notes:

- `PORT` is usually not needed on Vercel.
- `ENVIRONMENT=production` prevents `app.listen(...)` from running in the serverless environment.
- Add or update variables, then redeploy so the deployment picks them up.

## Troubleshooting

| Issue | What to check |
|-------|---------------|
| `500` locally or on Vercel | Confirm `MONGODB_URI` is set correctly |
| `502` from profile creation | One of the upstream APIs returned invalid data |
| `404` on profile fetch/delete | Check that the supplied `:id` is a valid existing MongoDB document ID |
| Profile creation fails | Make sure `POST /api/profiles` sends JSON with a `name` field |
| Works locally but not on Vercel | Confirm Vercel environment variables are set and the project was redeployed |

## Author

Created by Tamarauemomoemi Egbebo. GitHub: `@Proppeller`
