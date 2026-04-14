# Gender Classification API

An Express.js API that predicts gender from a first name and can also create a stored profile with gender, age, and country data. The project is set up for local development with `dotenv` and deployment on Vercel.

## Features

- `GET /api/classify` returns gender prediction data for a name
- `POST /api/profiles` fetches gender, age, and country data, then saves a profile to MongoDB
- CORS enabled for browser access
- Uses `Genderize.io`, `Agify.io`, and `Nationalize.io`
- Ready for Vercel deployment

## Stack

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
    |-- package.json
    `-- server.js
```

## Local Setup

1. Install dependencies inside the `server` folder:

```bash
cd server
npm install
```

2. Create a local `.env` file in `server/`:

```env
MONGODB_URI=your_mongodb_connection_string
ENVIRONMENT=development
PORT=3000
```

3. Start the API:

```bash
npm start
```

4. Test locally:

```text
GET http://localhost:3000/api/classify?name=john
POST http://localhost:3000/api/profiles?name=john
```

## API Endpoints

### `GET /api/classify`

Predicts gender for a given first name.

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | string | Yes | First name to classify |

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
    "processed_at": "2026-04-14T12:00:00.000Z"
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

Creates and stores a profile in MongoDB using the provided `name`.

Important: this endpoint currently reads `name` from the query string, not from a JSON request body.

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | string | Yes | First name used to generate a profile |

#### Example Request

```text
POST /api/profiles?name=john
```

#### Success Response

```json
{
  "status": "success",
  "data": {
    "_id": "generated-uuid",
    "name": "john",
    "gender": "male",
    "gender_probability": 0.99,
    "sample_size": 12345,
    "age": 34,
    "age_group": "adult",
    "country_id": "US",
    "country_probability": 0.12,
    "createdAt": "2026-04-14T12:00:00.000Z",
    "updatedAt": "2026-04-14T12:00:00.000Z",
    "__v": 0
  }
}
```

#### Existing Profile Response

```json
{
  "status": "success",
  "message": "Profile already exists",
  "data": {
    "_id": "generated-uuid",
    "name": "john"
  }
}
```

#### Possible Error Responses

```json
{
  "status": "error",
  "message": "No gender prediction available for the provided name"
}
```

```json
{
  "status": "error",
  "message": "No age prediction available for the provided name"
}
```

```json
{
  "status": "error",
  "message": "No country data available for the provided name"
}
```

## Environment Variables

### Local development

Create `server/.env` and keep it out of git. This repo already ignores `.env` files.

```env
MONGODB_URI=your_mongodb_connection_string
ENVIRONMENT=development
PORT=3000
```

### Vercel deployment

You do not upload the `.env` file itself to Vercel. Instead, add the same key/value pairs as Vercel project environment variables.

If you already deployed, do this:

1. Open your project on Vercel.
2. Go to `Settings`.
3. Open `Environment Variables`.
4. Add the variables your app needs:

```env
MONGODB_URI=your_mongodb_connection_string
ENVIRONMENT=production
```

5. Save the variables.
6. Redeploy the project so the existing deployment picks up the new values.

Notes:

- `MONGODB_URI` is required because the app connects to MongoDB on startup.
- `ENVIRONMENT=production` prevents `app.listen(...)` from running inside Vercel.
- You usually do not need to add `PORT` on Vercel.
- If you change a variable after deployment, redeploy again.

### Vercel CLI option

If you prefer CLI, run this from the linked project directory:

```bash
vercel env add MONGODB_URI
vercel env add ENVIRONMENT
```

Then redeploy:

```bash
vercel --prod
```

## Example Deployed URLs

```text
GET  https://your-project.vercel.app/api/classify?name=alex
POST https://your-project.vercel.app/api/profiles?name=alex
```

## Troubleshooting

| Issue | What to check |
|-------|---------------|
| `500` on Vercel | Confirm `MONGODB_URI` is set in Vercel and the deployment was redeployed after adding it |
| `404` on an endpoint | Confirm you are using `/api/classify` or `/api/profiles` exactly |
| POST request is not saving | Make sure `name` is being sent in the query string |
| Works locally but not on Vercel | Confirm `ENVIRONMENT=production` is set and MongoDB allows connections from Vercel |

## Author

Created by Tamarauemomoemi Egbebo. GitHub: `@Proppeller`
