const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const {Post, Hashtag, User} = require('../models');
const {isLoggedIn} = require('./middlewares');
const { findOne } = require('../models/user');
const db = require('../models');

const router = express.Router();

try{
    fs.readdirSync('uploads');
}catch (error) {
    console.error('uploads 폴더가 없어 uploads 폴더를 생성합니다.');
    fs.mkdirSync('uploads');
}

const upload = multer({
    storage: multer.diskStorage({
        destination(req, file, cb){
            cb(null, 'uploads/');
        },
        filename(req, file, cb){
            const ext = path.extname(file.originalname);
            cb(null, path.basename(file.originalname, ext) + Date.now() + ext);
        },
    }),
    limits: {fileSize: 5 * 1024 * 1024},
});

router.post('/img', isLoggedIn, upload.single('img'), (req, res) => {
    console.log(req.file);
    res.json({url: `/img/${req.file.filename}`});
});

const upload2 = multer();

// upload2.none() : 업로드 된 주소가 넘겨진 것일 뿐. 실제 이미지가 넘겨진 것은 아니므로. none
router.post('/', isLoggedIn, upload2.none(), async(req, res, next) => {
    try{
        const post = await Post.create({
            content: req.body.content,
            img: req.body.url,
            UserId: req.user.id,
        });
        const hashtags = req.body.content.match(/#[^\s#]w+/g);  // 해시태그를 정규표현식으로 추출
        if (hashtags){
            const result = await Promise.all(
                hashtags.map(tag => {
                    return Hashtag.findOrCreate({
                        where: {title: tag.slice(1).toLowerCase()},
                    })
                }),
            );
            await post.addHashtags(result.map(r => r[0]));
        }
        res.redirect('/');
    }catch(error){
        console.error(error);
        next(error);
    }
});


router.post('/Like/:postid', isLoggedIn, async (req, res, next) => {
    try{
        const userid = req.user.id;
        const postid = req.params.postid;
        
        const user = await User.findOne({where: {id: userid}});
        await user.addLikedPost(parseInt(postid, 10));

        res.send('ok');
    }catch (error){
        console.error(error);
        next(error);
    }
});

router.post('/CancelLike/:postid', isLoggedIn, async (req, res, next) => {
    try{
        const userid = req.user.id;
        const postid = req.params.postid;
        
        const user = await User.findOne({where: {id: userid}});
        await user.removeLikedPost(parseInt(postid, 10));

        res.send('ok');
    }catch (error){
        console.error(error);
        next(error);
    }
});

router.delete('/:postid', isLoggedIn, async(req, res, next) => {
    try{
        const post = await Post.destroy({
            where: {
                id: req.params.postid,
            }
        })
        res.send('ok');

    }catch(error){
        console.error(error);
        next(error);
    }
});

module.exports = router;