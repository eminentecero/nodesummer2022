const express = require('express');

const {isLoggedIn} = require('./middlewares');
const User = require('../models/user');
const { addFollowing, unFollowing } = require('../controller/user');

const router = express.Router();


router.post('/:id/follow', isLoggedIn, addFollowing);
router.post('/:id/unfollow', isLoggedIn, unFollowing);

module.exports = router;