const express = require('express')
const router = express.Router()
const moment = require('moment-timezone');
const multer  = require('multer')
const upload = multer()

const { appLogger } = require('../../utils/logger');
const service = require('./activesg')

router.post('/request', function (req, res) {
    const postJson = req.body 
    let order = {
        'request_id': postJson.request_id || "",
        'trans_id': postJson.trans_id || "",
        'amount': postJson.amount || "",
        'desc': postJson.desc || "",
        'ts': postJson.ts || moment().format()
    }
    Object.keys(order).forEach(function(key) {
        if (order[key] === "") res.status(400).json({ error: 'missing, field' });
    })

    service.inital(order).then(response => {
        res.status(200).json(response)
    }).catch((err) => {
        res.status(400).json(err)
    })
})

router.post('/update', upload.array(), function (req, res) {
    if (!req.body.request) {
        res.status(400).json({"msg": "no request in form data"})
    }
    const jwt = req.body.request
    service.update(jwt).then(response => {
        res.status(200).json(response)
    }).catch((err) => {
        res.status(400).json(err)
    })
})

router.post('/query', function (req, res) {
    const postJson = req.body 
    let order = {
        'request_id': postJson.request_id || "",
        'trans_id': postJson.trans_id || "",
        'amount': postJson.amount || "",
    }
    if (order.request_id === "" && order.trans_id === "") {
        res.status(400).json({ error: 'missing, field' });
    }
    service.query(order).then(response => {
        res.status(200).json(response)
    }).catch((err) => {
        res.status(400).json(err)
    })
    
})

router.get('/version', function (req, res) {
    res.json({version: "v2"})
})
  
module.exports = router