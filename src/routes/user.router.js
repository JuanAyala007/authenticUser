const { getAll, create, getOne, remove, update, verifyCode, login, getLogUser } = require('../controllers/user.controllers');
const express = require('express');
const verifyJWT = require('../utils/verifyJwt');

const userRouter = express.Router();

userRouter.route('/users')
    .get(verifyJWT, getAll)
    .post(create);

userRouter.route('/users/verify/:code')
    .get(verifyCode)

userRouter.route('/users/login')
    .post(login)

userRouter.route('/users/myself')
    .get(verifyJWT, getLogUser)
    
userRouter.route('/users/:id')
    .get(verifyJWT, getOne)
    .delete(verifyJWT, remove)
    .put(verifyJWT, update);

module.exports = userRouter;