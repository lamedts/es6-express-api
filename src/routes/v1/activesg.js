const fs = require('fs')
const path = require('path')
const request = require('request');
const appRoot = require('app-root-path');

const { appLogger } = require('../../utils/logger');
const service_sign = require('../../utils/service_sign');
const aws_sign = require('../../utils/aws_sign')
const ServiceTxModel = require('../../models/serviceTxModel')
const defaultConfigLoc = path.join(appRoot.toString(), `/config/config.default.json`)
const configLoc = (!fs.existsSync(path.join(appRoot.toString(), `/config/config.json`))) ? defaultConfigLoc : path.join(appRoot.toString(), `/config/config.json`);
const CONFIG = JSON.parse(fs.readFileSync(configLoc, 'utf-8'), 'utf8');

const query = (order) => {
    return new Promise((resolve, reject) => {
        appLogger.info("query with order: %s", JSON.stringify(order))
        ServiceTxModel.findOne({"trans_id": order.trans_id}, function (err, doc) {
            if (err) {
                appLogger.warn("query err: %s", err)
                reject({"status_code": 1, "msg": "query err"})
            }
            if (doc) {
                appLogger.info("retrived doc status: [%s]", doc.trans_status)
                if (doc.trans_status === 'complete') {
                    resolve ({"msg": "ok", "status_code": 10})
                } else {
                    resolve ({"msg": "not complete", "status_code": 1})
                }
            } else {
                appLogger.warn("no retrived doc")
                resolve ({"msg": "no record", "status_code": 0} )
            }
        });
    })
}

const update = (jwt) => {
    return new Promise((resolve, reject) => {
        appLogger.info("upsert with jwt: %s", jwt)
        const data = jwt.split('.');
        if (data.length !== 3) reject( {"status_code": 1, "msg": "jwt wrong"})
        const payload  = JSON.parse(service_sign.decodeData(data[1])) || {}
        if (payload !== {}) {
            const query = {"trans_id": payload.trans_id};
            if (!payload.trans_id) reject({"status_code": 1, "msg": "no payload.trans_id"})
            ServiceTxModel.findOneAndUpdate(query, payload, {upsert: true}, (err, doc) => {
                if (err) {
                    appLogger.error("upsert with [%s] err: %s", payload.trans_id, err)
                    reject ({"status_code": 1, "msg": "upsert err"})
                } else {
                    appLogger.info("upserted: %s", payload.trans_id)
                    resolve ({"status_code": 0, "msg": "ok"})
                }
            });
        }
    })
}

const inital = (order) => {
    return new Promise((resolve, reject) => {
        appLogger.info("request with order: %s", JSON.stringify(order))
        const payload = {
            partner_id: "SR0001",
            request_id: order['request_id'], // "6f81fafa-4d0e-4829-94d0-b349d58506b3"
            terminal_id:"terminal_id", // 
            branch_id :"branch_id", //
            trans_id: order['trans_id'], // 20180201TR000001
            trans_datetime: order['ts'], // '2005-08-15T15:52:01+00:00'
            description: order['desc'], // 'Lorem ipsum labore in.'
            amount: order['amount'], // 26.5
            redirect_uri: `${CONFIG.redirect_uri}`
        }
        const jwt = service_sign.signData(payload, "");
        const formDataStr = `version=v1&request=${jwt}`
        const host = CONFIG.service.host
        const url_path = CONFIG.service.path
        const endpoint = `https://${host}${url_path}`
        const headers = aws_sign.getHeader(CONFIG, formDataStr, null)
    
        request.post({
            method: 'POST',
            url: endpoint,
            form: formDataStr,
            headers: headers
        }, function optionalCallback(err, httpResponse, body) {
            if (err) {
                appLogger.error("request with error: %s", err)
                reject( {"msg": 'err while requesting', "status_code": 0})
            }
            const msg = JSON.parse(body) || {}
            if (msg !== {}) {
                if (msg.status_code && msg.status_code === 'ERROR'){
                    appLogger.warn("request api and return error: %s", msg)
                    resolve( {"msg": msg['message'], "status_code": 0})
                } else if (msg.data) {
                    const payload = msg.data.split('.')
                    const decodedPayload = JSON.parse(service_sign.decodeData(payload[1])) || {}
                    appLogger.info("request api and return ok: %s", JSON.stringify(decodedPayload))
                    if (decodedPayload && 'qr_code' in decodedPayload) {
                        resolve( {"qrcode": decodedPayload.qr_code, "msg":"ok", "status_code": 11})
                    } else {
                        resolve( {"qrcode": "", "msg": decodedPayload.message, "status_code": 0})
                    }
                }
            } else {
                reject( {"msg": 'response body wrong', "status_code": 0})
            }
        });
    }); 
}

module.exports = {
    query: query,
    update: update,
    inital: inital,
};