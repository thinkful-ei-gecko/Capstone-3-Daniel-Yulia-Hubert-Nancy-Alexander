const express = require('express');
const path = require('path');
const { requireAuth } = require('../middleware/jwt-auth');
const HouseholdsService = require('./households-service');
const { requireMemberAuth } = require('../middleware/member-jwt');
const MembersService = require('../members/members-service')
const xss = require('xss');

// const shortid = require('shortid');

const householdsRouter = express.Router();
const jsonBodyParser = express.json();

householdsRouter
  .route('/')
  .all(requireAuth)
  .post(jsonBodyParser, async (req, res, next) => {
    const { name } = req.body;
    const user_id = req.user.id;

    if (!name)
      return res.status(400).json({
        error: `Missing name in request body`,
      });

    try {
      //use short id to generate house code
      // let house_code = `${name}` + shortid.generate();
      const newHousehold = {
        name: xss(name),
        user_id,
      };

      const house = await HouseholdsService.insertHousehold(
        req.app.get('db'),
        newHousehold
      );

      res.status(201).json({
        user_id: house.user_id,
        id: house.id,
        name: xss(house.name),
        // code: house.house_code,
      });
    } catch (error) {
      next(error);
    }
  })
  .get((req, res, next) => {
    const user_id = req.user.id;

    return (
      HouseholdsService.getAllHouseholds(req.app.get('db'), user_id)
        .then(households => {
          return res.json(households);
        })
        // .then(households => {
        //   return res.json({
        //     id: households.id,
        //     name: xss(households.name),
        //     user_id: households.user_id
        //   })
        // })
        .catch(next)
    );
  });

// householdsRouter
//   .route('/:householdId')
//   .all(requireAuth)
//   .delete(jsonBodyParser, (req, res, next) => {
//     console.log('in delete');
//     const { householdId } = req.params;

//     HouseholdsService.deleteHousehold(req.app.get('db'), householdId)
//       .then(() => {
//         res.status(204).end();
//       })
//       .catch(next);
//   });

householdsRouter
  .route('/members')
  .all(requireAuth)
  .get((req, res, next) => {
    const user_id = req.user.id;
    return HouseholdsService.getAllMembersAllHouseholds(
      req.app.get('db'),
      user_id
    )
      .then(members => {
        const result = {};
        members.forEach(member => {
          if (member.household_id in result) {
            result[member.household_id].members.push({
              name: member.name,
              id: member.id,
            });
          } else {
            result[member.household_id] = {
              household_id: member.household_id,
              members: [{ name: member.name, id: member.id }],
            };
          }
        });
        return res.json(result);
      })
      .catch(next);
  });

householdsRouter
  .route('/:householdId/tasks')
  .all(requireAuth)
  .post(jsonBodyParser, (req, res, next) => {
    let { title, member_id, points } = req.body;
    const { householdId } = req.params;

    if (!title || !member_id || !points) {
      return res.status(400).json({
        error: {
          message: 'Missing task name, member id or points in request body',
        },
      });
    }

    const newTask = {
      title,
      household_id: householdId,
      member_id,
      points,
    };

    newTask.user_id = req.user.id;

    HouseholdsService.insertTask(req.app.get('db'), newTask)
      .then(result => {
        res
          .status(201)
          .location(`/api/households/${newTask.user_id}/tasks`)
          .json(result[0]);
      })
      .catch(next);
  })

  .get((req, res, next) => {
    const { householdId } = req.params;

    return HouseholdsService.getTasksForAll(req.app.get('db'), householdId)
      .then(tasks => {
        const result = {};
        tasks.forEach(task => {
          if (task.member_id in result) {
            result[task.member_id].tasks.push({
              title: task.title,
              id: task.id,
              points: task.points,
              status: task.status
            });
          } else {
            result[task.member_id] = {
              member_id: task.member_id,
              name: task.name,
              username: task.username,
              total_score: task.total_score,
              tasks: [{ title: task.title, id: task.id, points: task.points, status: task.status }],
            };
          }
        });
        return res.json(result);
      })
      .catch(next);
  })
  .patch(jsonBodyParser, (req, res, next) => {
    console.log(req.body);
    if (req.body.method === 'points') {
      HouseholdsService.updateTaskPoints(
        req.app.get('db'),
        req.body.id,
        req.body.points
      )
        .then(() => {
          res.send('points updated');
        })
        .catch(next);
    }

    if (req.body.method === 'title') {
      HouseholdsService.updateTaskTitle(
        req.app.get('db'),
        req.body.id,
        req.body.title
      )
        .then(() => {
          res.send('title updated');
        })
        .catch(next);
    }
  });

householdsRouter
  .route('/:householdId/tasks/status')
  .all(requireAuth)
  .get((req, res, next) => {
    const { householdId } = req.params;
    const { status } = req.query;
    if (status == 'completed') {
      HouseholdsService.getCompletedTasks(
        req.app.get('db'),
        householdId,
        status
      )
        .then(tasks => {
          return res.json(tasks);
        })
        .catch(next);
    }
  });

// householdsRouter
//   .route('/:householdId/tasks/status/:taskId')
//   .all(requireAuth)
//   .patch(jsonBodyParser, (req, res, next) => {
//     const { taskId } = req.params;

//     //This handles returned tasks for diaspproval. DONT TOUCH.
//     const { newStatus, points, memberId } = req.body;
//     if (newStatus === 'assigned') {
//       HouseholdsService.parentReassignTaskStatus(req.app.get('db'), taskId, newStatus)
//       .then(task => {
//         return res.json(task);
//       })
//       .catch(next);
//     }

//     //Handles Approval, dont touch. Need the delete.
//     if (newStatus === 'approved') {
//       HouseholdsService.parentApproveTaskStatus(req.app.get('db'), taskId, points, memberId)
//       .then(task => {
//         return res.json(task);
//       })
//       .catch(next);
//     }
//   })

householdsRouter
  .route('/:householdId/tasks/:taskId')
  .all(requireAuth)
  .delete((req, res, next) => {
    const { taskId } = req.params;
    HouseholdsService.deleteTask(req.app.get('db'), taskId)
      .then(() => {
        res.status(204).end();
      })
      .catch(next);
  });

// NOTE: THIS ENDPOINT USES THE MEMBER'S AUTHTOKEN, NOT PARAMS.
// MIGHT WANT TO FIX THIS BEFORE DEPLOY
householdsRouter
  .route('/householdId/members/memberId/tasks')
  .all(requireMemberAuth)
  .get((req, res, next) => {
    console.log(req.member);
    HouseholdsService.getMemberTasks(
      req.app.get('db'),
      req.member.household_id,
      req.member.id
    )

      .then(result => {
        res.status(201).json(result);
      })
      .catch(next);
  })
  //This updates the task status to "completed"  when member clicks completed.
  .patch(jsonBodyParser, (req, res, next) => {
    const { taskId } = req.body;
    console.log(taskId);
    HouseholdsService.completeTask(
      req.app.get('db'),
      req.member.id,
      req.member.household_id,
      taskId
    )
      .then(() => {
        res.status(204).end();
      })
      .catch(next);
  });

householdsRouter
  .route('/:householdId/members')
  .all(requireAuth)
  .get((req, res, next) => {
    const { householdId } = req.params;

    return HouseholdsService.getAllMembers(req.app.get('db'), householdId)
      .then(tasks => {
        return res.json(tasks);
      })
      .catch(next);
  })
  .post(jsonBodyParser, async (req, res, next) => {
    const { password, username, name } = req.body;
    const user_id = req.user.id;
    const { householdId } = req.params;
    console.log(password, username, name);

    for (const field of ['name', 'username', 'password'])
      if (!req.body[field])
        return res.status(400).json({
          error: `Missing '${field}' in request body`,
        });

    try {
      const passwordError = MembersService.validatePassword(password)

      if (passwordError)
        return res.status(400).json({ error: passwordError })
      
      const hasMemberwithMemberName = await HouseholdsService.hasMemberwithMemberName(
        req.app.get('db'),
        username
      );

      if (hasMemberwithMemberName)
        return res.status(400).json({ error: `Username already taken` });

      const hashedPassword = await HouseholdsService.hashPassword(password);

      const newMember = {
        username,
        password: hashedPassword,
        name,
        household_id: householdId,
        user_id,
      };

      const member = await HouseholdsService.insertMember(
        req.app.get('db'),
        newMember
      );

      //Set member level by adding their ID to the  levels_members table
      //This must run after HouseholdService.insertMember, because we need the new member Id.
      await HouseholdsService.setMemberLevel(req.app.get('db'), member.id);

      res
        .status(201)
        .location(path.posix.join(req.originalUrl, `/${member.id}`))
        .json(HouseholdsService.serializeMember(member));
    } catch (error) {
      next(error);
    }
  })
  //delete members
  .delete(jsonBodyParser, (req, res, next) => {
    const { member_id } = req.body;
    console.log(member_id);
    HouseholdsService.deleteMember(req.app.get('db'), member_id)
      .then(() => {
        res.status(204).end();
      })
      .catch(next);
  });

householdsRouter
  .route('/:householdId/members/:memberId')
  .all(requireAuth)
  // Currently, not allowing users to reassign households to members.
  .patch(jsonBodyParser, async (req, res, next) => {
    const { name, username, password } = req.body;
    const { memberId } = req.params;

    try {
      //check to see that updated userName isn't a duplicate

      const userData = await HouseholdsService.getMemberById(
        req.app.get('db'),
        memberId
      );

      const hasMemberwithMemberName = await HouseholdsService.hasMemberwithMemberName(
        req.app.get('db'),
        username
      );

      if (username !== userData.username && hasMemberwithMemberName) {
        return res.status(400).json({ error: `Username already taken.` });
      }

      //update password needs to be rehashed
      const hashedPassword = await HouseholdsService.hashPassword(password);

      const updatedMember = { name, username, password: hashedPassword };

      //Check to see that there are actually values passed to be updated
      const numberOfValues = Object.values(updatedMember).filter(Boolean)
        .length;

      if (numberOfValues === 0) {
        return res.status(400).json({
          error: `Request must contain name, username, password, or household`,
        });
      }

      const updated = await HouseholdsService.updateMember(
        req.app.get('db'),
        memberId,
        updatedMember
      );

      return res.status(201).json(updated);
    } catch (error) {
      next(error);
    }
  });

householdsRouter
  .route('/:householdId')
  .all(requireAuth)
  .all(checkHouseholdExists)
  .get((req, res, next) => {
    const { householdId } = req.params;
    return HouseholdsService.getAllHouseholds(req.app.get('db'), householdId)
      .then(households => {
        return res.json(households);
      })
      .catch(next);
  })
  // .get((req, res, next) => {
  //   res.json(HouseholdsService.serializeHousehold(res.household))
  // })
  .delete(jsonBodyParser, (req, res, next) => {
    console.log('in delete');
    const { householdId } = req.params;

    HouseholdsService.deleteHousehold(req.app.get('db'), householdId)
      .then(() => {
        res.status(204).end();
      })
      .catch(next);
  })
  .patch(jsonBodyParser, (req, res, next) => {
    let user_id = req.user.id;
    const { householdId } = req.params;
    const { name } = req.body;
    const newHousehold = { name };
    const db = req.app.get('db');

    const householdVals = Object.values(newHousehold).filter(Boolean).length;
    if (householdVals === 0) {
      return res.status(400).json({
        error: {
          message: `Request body must contain household 'name'.`,
        },
      });
    }
    HouseholdsService.updateHouseholdName(db, householdId, newHousehold)
      .then(() => HouseholdsService.getAllHouseholds(db, user_id))
      .then(result => res.json(result))
      .catch(next);
  });

householdsRouter
  //houshold added due to odd conflict with route ':/householdId'
  .route('/household/scores')
  .get(requireMemberAuth, (req, res, next) => {
    HouseholdsService.getHouseholdScores(
      req.app.get('db'),
      req.member.household_id
    )

      .then(result => {
        res.status(201).json(result);
      })
      .catch(next);
  })
  //adding a reset button route. Chose to take the household_id from the req body.
  .patch(requireAuth, jsonBodyParser, async (req, res, next) => {
    console.log(
      'WE ARE IN THE ROUTE AND THIS IS THE ID',
      req.body.household_id
    );
    let { household_id } = req.body;
    console.log(household_id);

    try {
      await HouseholdsService.resetHouseholdScores(
        req.app.get('db'),
        household_id
      );

      await HouseholdsService.resetHouseholdLevels(
        req.app.get('db'),
        household_id
      );

      const newScores = await HouseholdsService.getHouseholdScores(
        req.app.get('db'),
        household_id
      );
      console.log('these are the new scores', newScores);
      res.status(201).json(newScores);
    } catch (error) {
      next(error);
    }
  });

//GET gets the members current level information
//Post: Adds points and  updates levels/badges
householdsRouter
  .route('/:householdId/tasks/status/:taskId')
  // .all(requireMemberAuth)

  //The get requires member auth because it uses the token from the logged in member.
  //This get grabs information for the currently logged in  member.
  .get(requireMemberAuth, async (req, res, next) => {
    const member_id = req.member.id;

    try {
      const userScores = await HouseholdsService.getLevels(
        req.app.get('db'),
        member_id
      );

      //show distance to next level
      console.log(userScores);
      userScores.nextLevel = userScores.level_id * 10 - userScores.total_score;

      res.status(201).send(userScores);
    } catch (error) {
      next(error);
    }
  })
  .patch(jsonBodyParser, async (req, res, next) => {
    const { points, memberId, newStatus } = req.body;
    const { taskId } = req.params;
    console.log(points, memberId, newStatus, taskId);

    try {
      //This handles returned tasks for diaspproval and kicks it
      // back to the child/member
      if (newStatus === 'assigned') {
        const task = await HouseholdsService.parentReassignTaskStatus(
          req.app.get('db'),
          taskId,
          newStatus
        );
        return res.status(201).json(task);
      }
      //Handles Approval, dont touch. Need the delete.
      if (newStatus === 'approved') {
        await HouseholdsService.parentApproveTaskStatus(
          req.app.get('db'),
          taskId
        );
      }

      //get the member's current points/level info
      const userScores = await HouseholdsService.getLevels(
        req.app.get('db'),
        memberId
      );

      let { total_score, level_id } = userScores;
      let newScore = total_score + points;
      let newLevel = level_id;

      if (newScore >= level_id * 10) {
        newLevel = level_id + 1;
      }

      if (newLevel > 10) {
        await HouseholdsService.updatePoints(
          req.app.get('db'),
          memberId,
          newScore
        );
      } else {
        await HouseholdsService.updateLevel(
          req.app.get('db'),
          memberId,
          newLevel
        );

        await HouseholdsService.updatePoints(
          req.app.get('db'),
          memberId,
          newScore
        );
      }

      res.status(200).json({
        level_id: newLevel,
        name: userScores.name,
        total_score: newScore,
        badge: userScores.badge,
        taskId,
      });
    } catch (error) {
      next(error);
    }
  });

//example response

//   {
//     "level_id": 1,
//     "name": "Kelley",
//     "total_score": 25,
//     "badge": "badge1"
// }

async function checkHouseholdExists(req, res, next) {
  try {
    const household = await HouseholdsService.getById(
      req.app.get('db'),
      req.params.householdId
    );

    if (!household) {
      return res.status(404).json({
        error: `Household doesn't exist`,
      });
    }

    res.household = household;
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = householdsRouter;
