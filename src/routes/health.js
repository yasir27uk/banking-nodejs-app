'use strict';

const router = require('express').Router();

router.get('/', (req, res) => {
    res.json({
        status  : 'healthy',
        service : 'banking-nodejs-api',
        version : process.env.APP_VERSION || '1.0.0',
        uptime  : process.uptime(),
        timestamp: new Date().toISOString(),
    });
});

module.exports = router;
