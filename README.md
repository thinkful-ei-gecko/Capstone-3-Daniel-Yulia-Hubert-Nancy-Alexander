# ChoreRunner API 1.0

Authors: Daniel Nichols, Hubert Yang, Nancy Phiukhao, Yulia Khisamutdinova, Alexander Fukui

This project was created using Express, Node, and PostgreSQL.

Demo: [ENTER LINK HERE]

## Set up

Complete the following steps to start a new project (NEW-PROJECT-NAME):

1. Clone this repository to your local machine `git clone BOILERPLATE-URL NEW-PROJECTS-NAME`
2. `cd` into the cloned repository
3. Make a fresh start of the git history for this project with `rm -rf .git && git init`
4. Install the node dependencies `npm install`
5. Move the example Environment file to `.env` that will be ignored by git and read by the express server `mv example.env .env`
6. Edit the contents of the `package.json` to use NEW-PROJECT-NAME instead of `"name": "express-boilerplate",`

## Scripts

Start the application `npm start`

Start nodemon for the application `npm run dev`

Run the tests `npm test`

## Deploying

When your new project is ready for deployment, add a new Heroku application with `heroku create`. This will make a new git remote called "heroku" and you can then `npm run deploy` which will push to this remote's master branch.

## API Documentation

### Authorized Endpoints

  All endpoints using the `requireAuth` middleware require a hashed bearer token in the header. The server uses jsonwebtoken and bcryptjs to parse and encrypt this token to prevent data collisions and provide some security for the users.

### GET api/households

If a parent is logged in, retrieves a list of households for a given parent. On success, returns an array of objects containing info for each household.

```json
//GET api/households
//returns...
[
  {
    "id": 1,
    "name": "Katakuri Estate",
    "user_id": 1
  },
  {
    "id" : 2,
    "name": "Motoyuki House",
    "user_id": 1
  }
];
```

### POST api/households

If a parent is logged in, creates a new household associated to a logged-in parent account. It checks if the data contains a 'name' value. The new household is inserted into the database and assigned an id, then the API issues a response with a JSON object containing all households associated with the user, including the new one.

```json
//POST api/households
//Body: {"name": "Mitsurugi Mansion", "user_id":"1"}
//returns...
[
  {
    "id": 1,
    "name": "Katakuri Estate",
    "user_id": 1
  },
  {
    "id" : 2,
    "name": "Motoyuki House",
    "user_id": 1
  },
  {
    "id" : 3,
    "name": "Mitsurugi Mansion",
    "user_id": 1
  }
];
```

### GET households/:householdId/tasks

Provided a parent is logged in and a household id is included in the request, it retrieves an array with the tasks for a given household. A task is associated to a household id, also and consists of a title, a member_id representing who the task is assigned to, and a point value to award the member upon completing the task.

```json
//GET api/households/1/tasks
[
  {
    "title": "Rake the leaves",
    "household_id": 1,
    "member_id": 3,
    "points": 20
  },
  {
    "title": "Wash the windows",
    "household_id": 1,
    "member_id": 2,
    "points": 8
  },
  {
    "title": "Bleach the cat",
    "household_id": 1,
    "member_id": 1,
    "points": 8
  },
];
```

### POST households/:householdId/tasks

Provided a parent is logged in and a household id is included in the request, it creates a new task for the household, responding with a 201 success message.

### GET households/:householdId/members

Provided a parent is logged in and a household id is included in the request, it returns an array listing all members of the household, including their name and username (TODO is this right? Does it include more info?).

```json
//GET api/households/1/members/
[
  {
    "id": 1,
    "name":"Keiko",
    "username": "kikichan",
  },
  {
    "id": 2,
    "name":"Sadako",
    "username": "sailorMercury",
  },
  {
    "id": 3,
    "name":"Hidenori",
    "username": "kuroi_nezumi",
  },
];
```

### DELETE households........

### PATCH/PUT households.......

