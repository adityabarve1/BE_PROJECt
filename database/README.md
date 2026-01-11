# Database Setup Guide

This directory contains the database schema and migrations for the Dropout Prediction System using Supabase (PostgreSQL).

## Schema Overview

### Tables

1. **students**
   - Stores student information and current dropout risk assessment
   - Primary key: `id` (UUID)
   - Unique constraint: `roll_no`

2. **prediction_history**
   - Tracks all prediction records over time
   - Links to students via `roll_no`
   - Useful for tracking risk changes

3. **interventions**
   - Records interventions for at-risk students
   - Tracks status and outcomes of support measures

### Views

- `high_risk_students`: Quick access to students at high dropout risk
- `class_statistics`: Aggregated statistics by class
- `location_statistics`: Risk analysis by location

## Setup Instructions

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Note down your:
   - Project URL
   - API Key (anon/public)
   - Database password

### 2. Run Schema

1. Open your Supabase project dashboard
2. Go to SQL Editor
3. Copy and paste the contents of `schema.sql`
4. Click "Run"

### 3. Configure Backend

Update your backend `.env` file:

```bash
SUPABASE_URL=your-project-url
SUPABASE_KEY=your-anon-key
DATABASE_URL=postgresql://postgres:[password]@[host]:5432/postgres
```

## Sample Queries

### Get all high-risk students
```sql
SELECT * FROM high_risk_students;
```

### Get class-wise statistics
```sql
SELECT * FROM class_statistics;
```

### Get students with low attendance
```sql
SELECT * FROM students WHERE attendance < 75;
```

### Get prediction history for a student
```sql
SELECT * FROM prediction_history 
WHERE roll_no = 'JP00001' 
ORDER BY created_at DESC;
```

## Migrations

Future schema changes should be placed in the `migrations/` directory with timestamps:

```
migrations/
├── 001_initial_schema.sql
├── 002_add_intervention_types.sql
└── 003_add_performance_indexes.sql
```

## Security

- Row Level Security (RLS) is enabled on all tables
- Policies allow public read access
- Authenticated users can insert/update/delete
- Adjust policies based on your authentication requirements

## Backup

Regular backups are handled by Supabase automatically. You can also:

1. Use Supabase Dashboard → Database → Backups
2. Export data using pg_dump:
```bash
pg_dump -h [host] -U postgres -d postgres > backup.sql
```
