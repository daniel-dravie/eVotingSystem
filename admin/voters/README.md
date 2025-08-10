# Voters Voting Platform

A secure voting platform built with React, Firebase, and Material-UI that allows voters to login using their index number and code, then vote for candidates.

## Features

- **Secure Authentication**: Voters login using index number and unique code
- **Real-time Voting**: Live vote counting and candidate display
- **Responsive Design**: Works on desktop and mobile devices
- **Material-UI Components**: Clean, modern interface
- **Firebase Integration**: Real-time database and authentication

## Setup Instructions

### 1. Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or use existing one
3. Enable Authentication (Email/Password method)
4. Set up Firestore Database
5. Update `voters/src/firebaseConfig.js` with your Firebase configuration

### 2. Database Structure

#### Voters Collection
```javascript
voters: {
  [indexNumber]: {
    name: "Student Name",
    indexNumber: "12345678",
    code: "secure123", // This will be used as password
    hasVoted: false,
    votedFor: "candidateId", // After voting
    votedAt: "2024-01-01T00:00:00.000Z"
  }
}
```

#### Candidates Collection
```javascript
candidates: {
  [candidateId]: {
    name: "Candidate Name",
    position: "President",
    description: "Candidate description",
    image: "https://example.com/image.jpg",
    votes: 0
  }
}
```

### 3. Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### 4. Usage

1. **Admin Setup**: Use the admin panel to register voters and candidates
2. **Voter Login**: Voters use their index number and code to login
3. **Voting**: After login, voters can view candidates and cast their vote
4. **Results**: Votes are counted in real-time

## Security Features

- Email/password authentication using Firebase Auth
- Each voter can only vote once
- Vote tracking with timestamps
- Secure password handling

## Components

- **Login.jsx**: Voter authentication page
- **VotingPlatform.jsx**: Main voting interface
- **AuthContext.jsx**: Authentication state management
- **firebaseConfig.js**: Firebase configuration

## Development

The project uses:
- React 19 with Vite
- Material-UI (MUI) for components
- React Router for navigation
- Firebase for backend services
- ESLint for code quality

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build
