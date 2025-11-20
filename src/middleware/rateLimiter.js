const rateLimiter  =  require('express-rate-limit');

const authLimiter = rateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false
});


const apiLimiter = rateLimiter({
    windowMs: 15 * 60 * 1000, // 1 minute
    max: 200, // limit each IP to 200 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false
                               })


module.exports = {
    authLimiter,
    apiLimiter
}