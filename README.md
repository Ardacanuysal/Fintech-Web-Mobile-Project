# Financial Website with Firebase and Finnhub API

This project is a comprehensive financial website built with React, Firebase, and the Finnhub API. It provides real-time stock market data, user authentication, and portfolio tracking capabilities.

## Features

- **User Authentication**: Secure sign-up, login, and profile management
- **Real-time Stock Data**: Live stock quotes and market updates
- **Interactive Charts**: Visualize stock performance over time
- **Portfolio Tracking**: Monitor your investments and track gains/losses
- **Watchlist**: Save and follow your favorite stocks
- **Market Overview**: Get a quick snapshot of market performance

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- Firebase account
- Finnhub API key

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file based on `.env.example` and add your Firebase and Finnhub credentials
4. Start the development server:
   ```bash
   npm run dev
   ```

## Firebase Setup

1. Create a new Firebase project at [https://console.firebase.google.com/](https://console.firebase.google.com/)
2. Enable Email/Password Authentication
3. Create a Firestore database
4. Add your Firebase configuration to the `.env` file

## Finnhub API Setup

1. Register for an API key at [https://finnhub.io/](https://finnhub.io/)
2. Add your API key to the `.env` file

## Project Structure

- `src/components`: UI components
- `src/pages`: Page components
- `src/context`: Context providers
- `src/services`: API and Firebase services
- `src/utils`: Utility functions
- `src/firebase`: Firebase configuration

## Technologies Used

- React
- TypeScript
- Firebase (Authentication & Firestore)
- Finnhub API
- Chart.js
- React Router
- Tailwind CSS

## Security Features

- Secure API key storage using environment variables
- User data encryption via Firebase
- Input validation on all forms
- Comprehensive error handling