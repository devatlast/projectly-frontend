Projectly — Frontend

Projectly is a project and task management application built to help users organize projects, manage tasks, and track progress through a clean, modern interface.

This repository contains the frontend application.

Features

* User registration and login
* Email verification
* Protected dashboard
* Project creation and management
* Task management within projects
* Project status updates
* User profile management
* Account settings
* Secure authentication using HTTP-only cookies
* Responsive interface with a dark theme

Tech Stack

* Next.js
* React
* TypeScript
* Tailwind CSS
* REST API integration
* Docker

Backend

The frontend communicates with the Projectly backend API, built with NestJS.

The backend handles authentication, email verification, project and task management, MongoDB persistence, and Redis-backed functionality.

Getting Started

Prerequisites

* Node.js
* npm
* Access to a running Projectly backend

Installation

Clone the repository and enter the frontend directory:

git clone https://github.com/devatlast/projectly-frontend

Install dependencies:

npm ci

Environment Variables

Create a .env.local file in the frontend root:

NEXT_PUBLIC_API_URL=https://projectly-backend-byiu.onrender.com

Replace the example URL with your deployed backend’s actual Render URL.

Run Locally

Start the development server:

npm run dev

Open:

http://localhost:3002

Production Build

Build the application:
npm run build

Start the production server:
npm run start

Authentication
Projectly uses HTTP-only cookies for authentication. The frontend sends credentials with API requests so the browser can include the authentication cookie.
The backend must be configured to allow requests from the frontend origin and support credentialed CORS requests.

Deployment
The frontend can be deployed to Vercel.

Configure NEXT_PUBLIC_API_URL in the deployment environment to point to the deployed backend API.