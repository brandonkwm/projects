# Problem statement #
1. operations is always seen as a by-product of what automation cannot achieve either due to bandwidth constraints or many edge cases.
2. low code/no code platforms are expensive - and most of the time use their own proprietary language to protect their IP

# Thought process #
1. the platform should have the base building blocks and digital product managers/owners should seek to build out base building blocks instead of engaging dev work to re-create multiple different workflows e.g. base building blocks like = send notifications / call a HTTP API - hence, allowing the users themselves or product owners to self maintain the platform without any coding i.e. a citizen developer
2. think of this as an operations-as-a-service model where because the existing backend is unable to handle edge cases, it is now handed off to another platform with flexible logic e.g. handling the 5% while the main BE service handles the 95% - this would allow quicker time to market for product launches

## Context ##
This is an MVP of what could be an internal operations platform where there is a backend server that will allow different microservices to call HTTP API endpoint to pass in JSON payload and the frontend is where the magic happens - users are able to edit the workflows / create new workflows

## How to use ##
1. download the repo
2. go to ops-portal/ops-portal-frontend
3. npm install
4. npm run dev
5. to activate the backend server - do the same but in ops-portal/ops-portal-backend
6. npm install
7. npm run dev
