const express = require('express');

const router = express.Router();

const User = require('../../models/User');

const {check, validationResult} = require('express-validator/check');

const bcrypt = require('bcryptjs');

const jwt = require('jsonwebtoken');

const config = require('config');

const gravatar = require('gravatar');

// @route POST api/users (Public) Register User
router.post('/', [
    check('name', 'Name is required')
        .not()
        .isEmpty(),
    check('email', 'Please provide a valid email')
        .isEmail(),
    check('password', 'Please enter a valid password with 6 or more characters')
        .isLength({min: 6})
], async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({errors: errors.array()});
    }

    const {name, email, password} = req.body;

    try {
        let user = await User.findOne({email});

        if (user) {
            return res.status(400).json({errors: [{msg: 'User already exists'}]});
        }

        const avatar = gravatar.url(email, {
            s: '200',
            r: 'pg',
            d: 'mm'
        });

        user = new User({
            name,
            email,
            avatar,
            password
        });

        const salt = await bcrypt.genSalt(10);

        user.password = await bcrypt.hash(password, salt);

        await user.save();

        const payload = {
            user: {
                id: user.id,
            }
        };

        jwt.sign(payload, config.get('jwtSecret'), {expiresIn: '1h'}, (error, token) => {
            if (error) {
                throw error;
            }
            else {
                res.json({token});
            }
        });

        // res.send('You signed up successfully');
    }
    catch (error) {
        console.log(error.message)
        res.status(500).send('Server Error');
    }
})

module.exports = router;
