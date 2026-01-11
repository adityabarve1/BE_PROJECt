# Dropout Prediction System - Frontend

React.js frontend for the Student Dropout Prediction System.

## Features

- **Dashboard**: Overview of student statistics and risk metrics
- **Student Management**: View and manage student records
- **Prediction**: Real-time dropout risk prediction
- **Analytics**: Insights and risk factor analysis
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- React 18
- Material-UI (MUI)
- React Router
- Axios
- Recharts (for data visualization)
- React Toastify (for notifications)

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Update API URL in `.env`:
```
REACT_APP_API_URL=http://localhost:5000/api
```

4. Start development server:
```bash
npm start
```

The app will open at `http://localhost:3000`

## Build for Production

```bash
npm run build
```

## Project Structure

```
src/
├── components/       # Reusable components
├── pages/           # Page components
├── services/        # API services
├── utils/           # Utility functions
├── App.js           # Main app component
└── index.js         # Entry point
```

## Available Pages

- `/` - Dashboard
- `/students` - Student List
- `/students/:rollNo` - Student Profile
- `/predict` - Prediction Form
- `/analytics` - Analytics Dashboard
