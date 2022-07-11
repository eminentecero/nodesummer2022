const express = require('express');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const url = require('url');

const {verifyToken, apiLimiter, freeapiLimiter} = require('./middlewares');
const {Domain, User, Post, Hashtag} = require('../models');

const router = express.Router();

// cors: 우리가 허용한 사용자만 접근할 수 있도록 설정하는 것
router.use(async (req, res, next)=>{
    const domain = await Domain.findOne({
        where: {host:url.parse(req.get('origin')).host},    // 클라이언트의 도메인과 일치하는지 확인
    });
    if(domain){
        cors({
            origin: req.get('origin'),  // 허용할 도메인 표시
            credentials: true,
        })(req, res, next);
    }else{
        next();
    }
});

router.use(async (req, res, next)=>{
    const domain = await Domain.findOne({
        where: {host:url.parse(req.get('origin')).host},    // 클라이언트의 도메인과 일치하는지 확인
    });
    if(domain.type === 'free'){
        freeapiLimiter(req, res, next);
    }else{
        apiLimiter(req, res, next);
    }
});

/**
 * @swagger
 * paths:
 *  /v2/token:
 *    post:
 *      summary: "토큰 발급"
 *      description: "요청자에 대한 토큰 발급"
 *      tags: [API]
*      responses:
 *        "200":
 *          description: 토큰 안내 메시지
 *          content:
 *            application/json:
 *              schema:
 *                type: String
 *                properties:
 *                    ok:
 *                      type: boolean
 *                    message:
 *                      type: String
 */
// 토큰 발급
router.post('/token', async(req, res) => {
    const {clientSecret} = req.body;
    try{
        const domain = await Domain.findOne({
            where: {clientSecret: clientSecret},
            include: {
                model: User,
                attribute: ['nick', 'id'],
            },
        });
        if(!domain){
            return res.status(401).json({
                code: 401,
                message: '등록되지 않은 도메인입니다. 먼저 도메인을 등록하세요.',
            });
        }
        const token = jwt.sign({
            id: domain.User.id,
            nick: domain.User.nick,
        }, process.env.JWT_SECRET, {
            expiresIn: '30m',
            issuer: 'nodebird',
        });
        return res.json({
            code: 200,
            message: '토큰이 발급되었습니다.',
            token,
        });
    } catch(error){
        console.error(error);
        return res.status(500).json({
            code: 500,
            message: '서버 에러',
        });
    }
});

router.get('/test', verifyToken, (req, res) => {
    res.json(req.decoded);
});

/**
 * @swagger
 * paths:
 *  /v2/posts/my:
 *    post:
 *      summary: "사용자 글 보기"
 *      description: "사용자가 작성한 글 내용 보여주기"
 *      tags: [API]
*      responses:
 *        "200":
 *          description: 글 정보
 *          content:
 *            application/json:
 *              schema:
 *                type: Object
 *                properties:
 *                    ok:
 *                      type: boolean
 *                    payload:
 *                      type: String
 */
router.get('/posts/my', verifyToken,(req, res)=> {
    Post.findAll({where: {userId: req.decoded.id}})
        .then((posts) => {
            res.json({
                code: 200,
                payload: posts,
            });
        })
        .catch((error) =>{
            console.error(error);
            return res.status(500).json({
                code:500,
                message: '서버 에러',
            });
        });
});

/**
 * @swagger
 * paths:
 *  /v2/posts/hashtag/:title:
 *    post:
 *      summary: "해시태그 내용 검색"
 *      description: "해당 해시태그 내용을 가진 해시태그를 검색"
 *      tags: [API]
*      responses:
 *        "200":
 *          description: 해시태그 정보
 *          content:
 *            application/json:
 *              schema:
 *                type: Object
 *                properties:
 *                    ok:
 *                      type: boolean
 *                    payload:
 *                      type: String
 */
router.get('/posts/hashtag/:title', verifyToken, async(req, res) => {
    try{
        const hashtag = await Hashtag.findOne({where: {title: req.params.title}});
        if(!hashtag){
            return res.status(404).json({
                code: 404,
                message: '검색 결과가 없습니다.',
            });
        }
        const posts = await hashtag.getPosts();
        return res.json({
            code: 200,
            payload: posts,
        });
    }catch(error){
        console.error(error);
        return res.status(500).json({
            code: 500,
            message: '서버 에러',
        });
    }
});

/**
 * @swagger
 * paths:
 *  /v2/my/following:
 *    post:
 *      summary: "팔로잉 목록"
 *      description: "사용자 팔로잉 목록"
 *      tags: [API]
*      responses:
 *        "200":
 *          description: "성공"
 *          content:
 *            application/json:
 *              schema:
 *                type: Object
 *                properties:
 *                    ok:
 *                      type: boolean
 *                    payload:
 *                      type: String
 */
router.get('/my/following', verifyToken, async (req, res)=> {
    try{
        const user = await User.findOne({
            where: {id: req.decoded.id}
        });
        if(user){
            const followings = await user.getFollowings();

            res.json({
                code:200,
                payload: followings.map((v) => v.nick),
            });
        }
    }catch (error){
        console.error(error);
        return res.status(500).json({
            code:500,
            message: '서버 에러',
        });
    }
});

/**
 * @swagger
 * paths:
 *  /v2/my/follower:
 *    post:
 *      summary: "팔로워 목록"
 *      description: "사용자 팔로워 목록"
 *      tags: [API]
*      responses:
 *        "200":
 *          description: "성공"
 *          content:
 *            application/json:
 *              schema:
 *                type: Object
 *                properties:
 *                    ok:
 *                      type: boolean
 *                    payload:
 *                      type: String
 */
router.get('/my/follower', verifyToken,async (req, res)=> {
    try{
        const user = await User.findOne({
            where: {id: req.decoded.id}
        });
        if(user){
            const followers = await user.getFollowers();

            res.json({
                code:200,
                payload: followers.map((v) => v.nick),
            });
        }
    }catch (error){
        console.error(error);
        return res.status(500).json({
            code:500,
            message: '서버 에러',
        });
    }
});


router.use(cors({
    credential: true,
}));

module.exports = router;