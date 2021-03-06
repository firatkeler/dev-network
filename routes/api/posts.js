const express = require('express');

const router = express.Router();

const auth = require('../../middleware/auth');

const {check, validationResult} = require("express-validator/check");

const Profile = require('../../models/Profile');

const User = require('../../models/User');

const Post = require('../../models/Post');

// @route POST api/posts
// @desc Generate Post
// @access Private
router.post('/', [
    auth,
    check('text', 'Text is required').not().isEmpty()
], async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({errors: errors.array()});
    }

    try {
        const user = await User.findById(req.user.id).select('-password');

        const postFields = {
            text: req.body.text,
            name: user.name,
            avatar: user.avatar,
            user: req.user.id
        }

        const post = new Post(postFields);

        await post.save();

        res.json(post);
    }
    catch(error) {
        console.log(error.message);

        res.status(500).send('Server Error');
    }
});

// @route GET api/posts
// @desc Get All Posts
// @access Private
router.get('/', auth,async (req, res) => {
    try {
        const posts = await Post.find().sort({date: -1});

        res.json(posts);
    }
    catch(error) {
        console.log(error.message);

        res.status(500).send('Server Error');
    }
});

// @route GET api/posts/:id
// @desc Get Post By ID
// @access Private
router.get('/:id', auth,async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({msg: 'Post not found'});
        }

        res.json(post);
    }
    catch(error) {
        console.log(error.message);

        if (error.kind === 'ObjectId') {
            return res.status(404).json({msg: 'Post not found'});
        }

        res.status(500).send('Server Error');
    }
});

// @route DELETE api/posts/:id
// @desc Delete A Post
// @access Private
router.delete('/:id', auth,async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({msg: 'Post not found'});
        }

        if (req.user.id !== post.user.toString()) {
            return res.status(401).json({msg: 'User not authorized'});
        }

        await post.remove();

        res.json({msg: 'Post removed'});
    }
    catch(error) {
        console.log(error.message);

        if (error.kind === 'ObjectId') {
            return res.status(404).json({msg: 'Post not found'});
        }

        res.status(500).send('Server Error');
    }
});

// @route PUT api/posts/like/:id
// @desc Like A Post
// @access Private
router.put('/like/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({msg: 'Post not found'});
        }

        if (post.likes.filter(like => like.user.toString() === req.user.id).length > 0) {
            return res.status(400).json({msg: 'Post already liked'});
        }

        post.likes.unshift({user: req.user.id});

        await post.save();

        res.json(post.likes);
    }
    catch (error) {
        console.log(error.message);

        res.status(500).send('Server Error');
    }
});

// @route PUT api/posts/unlike/:id
// @desc Unlike A Post
// @access Private
router.put('/unlike/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({msg: 'Post not found'});
        }

        if (post.likes.filter(like => like.user.toString() === req.user.id).length === 0) {
            return res.status(400).json({msg: 'Post has not yet been liked'});
        }

        post.likes.splice(post.likes.map(item => item.user.toString()).indexOf(req.user.id), 1);

        await post.save();

        res.json(post.likes);
    }
    catch (error) {
        console.log(error.message);

        res.status(500).send('Server Error');
    }
});

// @route POST api/posts/comment/:id
// @desc Comment On A Post
// @access Private
router.post('/comment/:id', [
    auth,
    check('text', 'Text is required').not().isEmpty()
], async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({errors: errors.array()});
    }

    try {
        const user = await User.findById(req.user.id).select('-password');

        const post = await Post.findById(req.params.id);

        const commentFields = {
            text: req.body.text,
            name: user.name,
            avatar: user.avatar,
            user: req.user.id
        }

        post.comments.unshift(commentFields);

        await post.save();

        res.json(post.comments);
    }
    catch(error) {
        console.log(error.message);

        res.status(500).send('Server Error');
    }
});

// @route DELETE api/posts/comment/:id/:comment_id
// @desc Delete Comment On A Post
// @access Private
router.delete('/comment/:id/:comment_id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({msg: 'Post not found'});
        }

        const comment = post.comments.find(item => item.id.toString() === req.params.comment_id);

        if (!comment) {
            return res.status(404).json({msg: 'Comment not found'});
        }

        if (req.user.id !== comment.user.toString()) {
            return res.status(401).json({msg: 'User not authorized'});
        }

        post.comments.splice(post.comments.map(item => item.user.toString()).indexOf(req.user.id), 1);

        await post.save();

        res.json(post.comments);
    }
    catch (error) {
        console.log(error.message);

        res.status(500).send('Server Error');
    }
});

module.exports = router;
