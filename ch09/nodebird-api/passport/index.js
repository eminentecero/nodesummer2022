const passport = require('passport');
const local = require('./localStrategy');
const kakao = require('./kakaoStrategy');
const User = require('../models/user');

module.exports = () => {
    // 로그인 시 실행
    // 세션에 어떤 데이터를 저장할지 정함
    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    // 로그인 매 요청 시 실행
    // 세션에 저장한 아이디를 통해 사용자 정보 객체를 불러오는 것
    passport.deserializeUser((id, done) => {
        User.findOne({
            where: {id},
            include: [{
                model: User,
                attributes: ['id', 'nick'],
                as: 'Followers',
            }, {
                model: User,
                attributes: ['id', 'nick'],
                as: 'Followings',
            }],
        })
        .then(user => done(null, user))
        .catch(err => done(err));
            
    });

    local();
    kakao();
};