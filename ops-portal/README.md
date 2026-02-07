# Problem statement #
1. operations is always seen as a by-product of what automation cannot achieve either due to bandwidth constraints or many edge cases.
2. low code/no code platforms are expensive - and most of the time use their own proprietary language to protect their IP

# Thought process #
1. the platform should have the base building blocks and digital product managers/owners should seek to build out base building blocks instead of engaging dev work to re-create multiple different workflows e.g. base building blocks like = send notifications / call a HTTP API - hence, allowing the users themselves or product owners to self maintain the platform without any coding i.e. a citizen developer
2. think of this as an operations-as-a-service model where because the existing backend is unable to handle edge cases, it is now handed off to another platform with flexible logic e.g. handling the 5% while the main BE service handles the 95% - this would allow quicker time to market for product launches

## Context ##
This is an MVP of what could be an internal operations platform where there is a backend server that will allow different microservices to call HTTP API endpoint to pass in JSON payload and the frontend is where the magic happens - users are able to edit the workflows / create new workflows

## How to use ##

### Launch the application

**Prerequisites:** Node.js (v18+ recommended) and npm.

1. **Clone or download the repo** and open a terminal in the project root (`ops-portal`).

2. **Start the backend** (optional; frontend works with localStorage if the backend is not running):
   ```bash
   cd ops-portal-backend
   npm install
   npm run dev
   ```
   Backend runs at **http://localhost:3001** by default. Set `PORT` to override.

3. **Start the frontend** (in a second terminal):
   ```bash
   cd ops-portal-frontend
   npm install
   npm run dev
   ```
   Frontend runs at **http://localhost:5173** (Vite default). Open this URL in your browser.

4. Use the app: configure **Workflows**, **Case templates**, and **Communication templates**, then work on cases under **Case work**. Data is stored in the browser (localStorage) unless you wire the frontend to the backend API.

**One-liner from repo root (two terminals):**
- Terminal 1: `cd ops-portal-backend && npm install && npm run dev`
- Terminal 2: `cd ops-portal-frontend && npm install && npm run dev`

Note: vibe coded using cursor AI