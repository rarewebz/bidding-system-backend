process.env.NODE_ENV = 'test';

const expect = require('chai').expect;
const request = require('supertest');

const app = require('../../../app');

const characters ='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const characters2 ='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const characters3 ='0123456789';

function generateString(length, type) {
    let result = ' ';
    let charactersLength
    switch (type) {
        case 1:
            charactersLength = characters.length;
        case 2:
            charactersLength = characters3.length;
        default:
            charactersLength = characters2.length;
    }
    for ( let i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }

    return result;
}

let email = generateString(5) + "@gmail.com"
let mobile = "+94" + generateString(9, 2)
let access_token

describe('POST /user/', () => {
    it('OK, create user response', (done) => {
        request(app).post('/user/create')
            .send(
                {
                    "firstname": generateString(5, 1),
                    "lastname": generateString(5, 1),
                    "email": email,
                    "contact": mobile,
                    "password": "12345"
                }
            )
            .then((res) => {
                const body = res.body;
                expect(body.success);
                done();
            })
            .catch((err) => done(err));
    });
    it('OK, login response', (done) => {
        request(app).post('/user/auth')
            .send(
                {
                    "email": email,
                    "password":"12345"
                }
            )
            .then((res) => {
                const body = res.body;
                access_token = body.access_token;
                expect(body.success);
                done();
            })
            .catch((err) => done(err));
    });
})

describe('POST /auction/', () => {
    it('OK, create auction response', (done) => {
        request(app).post('/auction/')
            .set('Authorization', access_token)
            .send(
                {
                    "name" : generateString(10),
                    "initialprice" : Number(generateString(5)),
                    "startdate": "2023-01-28 00:00:00",
                    "enddate" : "2023-01-31 23:59:59",
                    "description" : generateString(15)

                }
            )
            .then((res) => {
                const body = res.body;
                expect(body.success);
                done();
            })
            .catch((err) => done(err));
    });
})

describe('GET /auction/', () => {
    it('OK, getting response', (done) => {
        request(app).get('/auction/')
            .then((res) => {
                const body = res.body;
                expect(body!==null);
                done();
            })
            .catch((err) => done(err));
    });
    it('OK, getting success response', (done) => {
        request(app).get('/auction/')
            .then((res) => {
                const body = res.body;
                expect(body.success);
                done();
            })
            .catch((err) => done(err));
    });
    it('OK, getting upcoming auctions', (done) => {
        request(app).get('/auction/')
            .then((res) => {
                const body = res.body;
                expect(body.body.upcoming);
                done();
            })
            .catch((err) => done(err));
    });
    it('OK, getting ongoing auctions', (done) => {
        request(app).get('/auction/')
            .then((res) => {
                const body = res.body;
                expect(body.body.ongoing);
                done();
            })
            .catch((err) => done(err));
    });
    it('OK, getting end auctions', (done) => {
        request(app).get('/auction/')
            .then((res) => {
                const body = res.body;
                expect(body.body.end);
                done();
            })
            .catch((err) => done(err));
    });
})

describe('GET /my/', () => {
    it('OK, get my auctions response', (done) => {
        request(app).get('/my/auctions/')
            .set('Authorization', access_token)
            .then((res) => {
                const body = res.body;
                expect(body.success);
                done();
            })
            .catch((err) => done(err));
    });
})
