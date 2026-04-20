# Demographic Intelligence API

An Express.js API that predicts gender, age, and nationality from a first name, stores profiles in MongoDB, and exposes a rich query interface with filtering, sorting, pagination, and rule‑based natural language search. Designed for both local development and Vercel deployment.

## Features

- Predict gender from a first name (`GET /api/classify`)
- Create a complete profile by aggregating data from Genderize, Agify, and Nationalize APIs (`POST /api/profiles`)
- Retrieve, filter, sort, and paginate stored profiles (`GET /api/profiles`)
- Rule‑based natural language search (`GET /api/profiles/search`)
- Fetch or delete a single profile by its public `id` (`GET /api/profiles/:id`, `DELETE /api/profiles/:id`)
- Idempotent seeding from `seed_profiles.json` (2026 records)
- UUID v7 identifiers for public profile IDs
- UTC ISO 8601 timestamps
- CORS enabled (`Access-Control-Allow-Origin: *`)

## Tech Stack

- Node.js
- Express
- MongoDB with Mongoose
- dotenv
- Vercel (optional)

## Project Structure (Blueprint)

```
.
├── README.md
├── vercel.json
└── server
    ├── models
    │   └── profileModel.js       # Mongoose model (also called dataModel.js)
    ├── seed_profiles.json        # 2026 pre‑generated profiles
    ├── seed.js                   # Standalone seeding script
    ├── server.js                 # Main Express application
    ├── package.json
    ├── package-lock.json
    └── .env                      # Not committed – local environment variables
```

> **Note**: If your files currently reside at the root level, you can still use this structure by moving them into a `server/` folder. The code is written to work either way – adjust paths accordingly.

## Local Setup

1. **Clone the repository and navigate to the server folder**  
   ```bash
   cd server
   ```

2. **Install dependencies**  
   ```bash
   npm install
   ```

3. **Create a `.env` file** inside `server/` with the following variables:

   ```env
   MONGODB_URI=your_mongodb_connection_string
   ENVIRONMENT=development
   PORT=3000
   ```

4. **Seed the database** (optional – seeding also runs automatically on startup when `ENVIRONMENT=development`)  
   ```bash
   npm run seed
   ```
   Or manually:  
   ```bash
   node seed.js
   ```

5. **Start the development server**  
   ```bash
   npm run dev
   ```
   The server will connect to MongoDB, seed any missing profiles, and start listening on `PORT`.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URI` | Yes | MongoDB connection string |
| `ENVIRONMENT` | Yes | `development` (local) or `production` (Vercel) |
| `PORT` | Local only | Port for local server, defaults to `3000` |

## Base URL

- Local: `http://localhost:3000`
- Vercel: `https://your-project.vercel.app`

## API Endpoints

### `GET /`

Health check.

#### Response
```json
{ "message": "Hello from the server!" }
```

---

### `GET /api/classify`

Predicts gender for a given first name using the Genderize API.

#### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name`    | string | Yes     | First name to classify |

#### Example
```http
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
    "processed_at": "2026-04-21T10:00:00.000Z"
  }
}
```

#### Error Responses
- `400` – Missing or empty name
- `422` – Name is not a string
- `502` – Genderize returned invalid data

---

### `POST /api/profiles`

Creates and stores a profile by fetching gender, age, and country data from external APIs.

#### Request Body
```json
{ "name": "john" }
```

#### Success Response (201 Created)
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
    "country_name": "United States",
    "country_probability": 0.12,
    "created_at": "2026-04-21T10:00:00.000Z"
  }
}
```

#### If Profile Already Exists (200 OK)
Same body but with an additional `"message": "Profile already exists"`.

#### Error Responses
- `400` – Missing or empty name
- `422` – Invalid type (name not a string)
- `502` – Any external API (Genderize, Agify, Nationalize) returns invalid data

---

### `GET /api/profiles`

Returns a list of stored profiles with advanced filtering, sorting, and pagination.

#### Query Parameters (all optional)

| Parameter | Type | Description |
|-----------|------|-------------|
| `gender` | string | `male` or `female` |
| `country_id` | string | 2‑letter country code (e.g., `NG`, `US`) |
| `age_group` | string | `child`, `teenager`, `adult`, `senior` |
| `min_age` | number | Minimum age (inclusive) |
| `max_age` | number | Maximum age (inclusive) |
| `min_gender_probability` | number | 0–1, minimum gender probability |
| `min_country_probability` | number | 0–1, minimum country probability |
| `sort_by` | string | `created_at`, `age`, `gender_probability` (default: `created_at`) |
| `order` | string | `asc` or `desc` (default: `desc` for `created_at`, `asc` for others) |
| `page` | positive integer | Page number (default: `1`) |
| `limit` | positive integer | Items per page, max `50` (default: `10`) |

#### Example
```http
GET /api/profiles?gender=male&country_id=NG&min_age=25&sort_by=age&order=desc&page=1&limit=10
```

#### Success Response
```json
{
  "status": "success",
  "page": 1,
  "limit": 10,
  "total": 2026,
  "data": [ /* array of profile objects (full format) */ ]
}
```

#### Error Responses
- `422` – Invalid query parameter values (e.g., wrong gender, malformed age, etc.)

---

### `GET /api/profiles/search`

Rule‑based natural language search. Does **not** use AI or LLMs – it parses common phrases.

#### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `q`      | string | Yes     | Natural language query |
| `page`   | integer | No      | Default `1`, max page size `50` |
| `limit`  | integer | No      | Default `10`, max `50` |

#### Supported Phrases
- Genders: `male`, `female`, `males`, `females`, `boy`, `girl`, `boys`, `girls`
- Age groups: `child`, `teenager`, `adult`, `senior`, `teenagers`, `teens`
- Countries: country names (e.g., `nigeria`, `angola`, `kenya`) – mapped to 2‑letter codes
- Age ranges: `young` (16–24)
- `above <number>` (e.g., `above 30`)
- `from <country>` (e.g., `from angola`)

#### Examples
- `young males`
- `females above 30`
- `people from angola`
- `adult males from kenya`
- `male and female teenagers above 17`

#### Success Response
Same paginated structure as `GET /api/profiles`, but only with the matched profiles.

#### Error Responses
- `400` – Missing or empty `q`, or query cannot be interpreted
- `422` – Invalid query parameters (type, page, limit)

---

### `GET /api/profiles/:id`

Fetches a single profile by its public `id` (UUID v7, not the MongoDB `_id`).

#### Example
```http
GET /api/profiles/01963f4e-7c41-7ec6-9e44-75a7b7782e1c
```

#### Success Response
```json
{
  "status": "success",
  "data": { /* full profile object */ }
}
```

#### Error Response (404)
```json
{ "status": "error", "message": "Profile not found" }
```

---

### `DELETE /api/profiles/:id`

Deletes a profile by its public `id`.

#### Example
```http
DELETE /api/profiles/01963f4e-7c41-7ec6-9e44-75a7b7782e1c
```

#### Success Response
`204 No Content`

#### Error Response (404)
```json
{ "status": "error", "message": "Profile not found" }
```

## Database Schema (Profile)

Each profile is stored with the following fields:

| Field | Type | Description |
|-------|------|-------------|
| `_id` | String (UUID v7) | Internal primary key |
| `id` | String (UUID v7) | Public identifier (same as `_id`) |
| `name` | String | Lowercased, unique |
| `gender` | String | `male` or `female` |
| `gender_probability` | Number | 0–1 |
| `sample_size` | Number | Genderize sample count |
| `age` | Number | Integer |
| `age_group` | String | `child`, `teenager`, `adult`, `senior` |
| `country_id` | String | 2‑letter country code |
| `country_name` | String | Full country name |
| `country_probability` | Number | 0–1 |
| `created_at` | Date | ISO 8601, UTC |

## Seeding Notes

- The repository includes `seed_profiles.json` with 2026 records.
- Seeding is **idempotent** – re‑running the seed script or restarting the server (in development) will only insert profiles whose `name` does not already exist.
- Automatic seeding occurs on local startup (`ENVIRONMENT=development`). To disable, remove the `await seedData()` call in `server.js`.
- To seed manually: `npm run seed` (assumes a `"seed": "node seed.js"` script in `package.json`).

## Validation and Error Handling

All error responses follow the same shape:

```json
{
  "status": "error",
  "message": "Human-readable explanation"
}
```

| HTTP Status | Typical Use |
|-------------|--------------|
| `400` | Missing or empty required parameter |
| `422` | Invalid data type or out‑of‑range value |
| `404` | Profile not found |
| `500` | Internal server or database error |
| `502` | Upstream API (Genderize, Agify, Nationalize) failure |

## Performance Notes

- Common filter fields (`gender`, `age_group`, `country_id`, `age`, `created_at`) are indexed in the Mongoose schema.
- Pagination uses `skip` + `limit`; total counts are obtained with `countDocuments`.
- The natural language parser is rule‑based and efficient – no external AI calls.

## Vercel Deployment

1. Push the repository (with the `server/` folder and `vercel.json`) to a Git provider.
2. Import the project into Vercel.
3. Set the following environment variables in the Vercel dashboard:
   - `MONGODB_URI` – your production MongoDB connection string
   - `ENVIRONMENT` – `production`
4. Deploy. The `vercel.json` file routes all requests to `server/server.js`.
5. Seeding on Vercel is **not automatic** because the serverless environment does not run a persistent startup process. Seed your production database once using a local script or a one‑time cron job.

## cURL Examples

```bash
# Classify a name
curl "http://localhost:3000/api/classify?name=alex"

# Create a profile
curl -X POST "http://localhost:3000/api/profiles" \
  -H "Content-Type: application/json" \
  -d '{"name":"alex"}'

# List adult profiles from Nigeria, sorted by age descending
curl "http://localhost:3000/api/profiles?country_id=NG&age_group=adult&sort_by=age&order=desc"

# Natural language search
curl "http://localhost:3000/api/profiles/search?q=young males from nigeria"

# Get a single profile
curl "http://localhost:3000/api/profiles/01963f4e-7c41-7ec6-9e44-75a7b7782e1c"

# Delete a profile
curl -X DELETE "http://localhost:3000/api/profiles/01963f4e-7c41-7ec6-9e44-75a7b7782e1c"
```

## Troubleshooting

| Issue | Likely Fix |
|-------|-------------|
| `500` error locally or on Vercel | Check that `MONGODB_URI` is correct and the IP is whitelisted |
| `502` on `POST /api/profiles` | One of the external APIs returned invalid data (e.g., unknown name) |
| `404` on `GET /api/profiles/:id` | The `id` must be the public UUID, not the MongoDB `_id` |
| Works locally but not on Vercel | Verify Vercel environment variables are set and redeploy |
| Seeding doesn’t run on Vercel | Seeding is intentionally disabled in production. Run `seed.js` manually against your production database once |

## Author

Created by Tamarauemomoemi Egbebo. GitHub: [@Proppeller](https://github.com/Proppeller25)