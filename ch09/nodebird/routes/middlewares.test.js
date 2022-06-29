const { isLoggedIn } = require("./middlewares");
const { isNotLoggedIn } = require("./middlewares");


describe('isLoggedIn', () => {
    // 모킹: jest.fn()함수 사용
    const res = {
        status: jest.fn(()=>res),
        send: jest.fn(),
    };
    const next = jest.fn();

    test('로그인되어 있으면 isLoggedIn이 next를 호출해야함', () => {
        const req = {
            isAuthenticated: jest.fn(()=>true),
        };
        isLoggedIn(req, res, next);
        expect(next).toBeCalledTimes(1); // 정확하게 몇 번 호출 되었는지 체크
    });

    test('로그인되어 있지 않으면 isLoggedIn이 에러를 응답해야 함.', () =>{
        const req = {
            isAuthenticated: jest.fn(() => false),
        };
        isLoggedIn(req, res, next);
        expect(res.status).toBeCalledWith(403); // 특정인수와 함께 호출되었는지 확인
        expect(res.send).toBeCalledWith('로그인 필요');
    });
});

describe('isNotLoggedIn', () => {
        // 모킹: jest.fn()함수 사용
        const res = {
            redirect: jest.fn(),
        };
        const next = jest.fn();
    
        test('로그인되어 있으면 isNotLoggedIn이 에러를 응답해야 함.', () => {
            const req = {
                isAuthenticated: jest.fn(()=>true),
            };
            isNotLoggedIn(req, res, next);
            const message = encodeURIComponent('로그인한 상태입니다.');
            expect(res.redirect).toBeCalledWith(`/?error=${message}`);
        });
    
        test('로그인되어 있지 않으면 isNotLoggedIn이 next를 호출해야 함.', () =>{
            const req = {
                isAuthenticated: jest.fn(() => false),
            };
            isNotLoggedIn(req, res, next);
            expect(next).toBeCalledTimes(1);
        });
});