const service_sign = require('./service_sign')
const aws_sign = require('./aws_sign')
const fs = require('fs')
const request = require('request');
const path = require('path')
require('request-to-curl');

const defaultConfigLoc = path.join(__dirname, `../../config/config.default.json`)
const configLoc = (!fs.existsSync(path.join(__dirname, `../../config/config.json`))) ? defaultConfigLoc : path.join(__dirname, `../../config/config.json`);
const config = JSON.parse(fs.readFileSync(configLoc, 'utf-8'), 'utf8');

payload = {
    "partner_id": config.service.partner_id,
    "request_id":"123",
    "terminal_id":config.service.terminal_id,
    "branch_id" :config.service.branch_id,
    "trans_id":"20180201TR000022",
    "trans_datetime":"2005-08-13T15:52:01+00:00",
    "description":"Lorem ipsum labore in.",
    "amount":6.50,
    "redirect_uri": config.service.redirect_uri,
}

jwt = service_sign.signData(payload, null)
formDataStr = `version=v1&request=${jwt}`
host = config.service.host
url_path = config.service.path
endpoint = `https://${host}${url_path}`
headers = aws_sign.getHeader(config, formDataStr, null)

request.post({
    method: 'POST',
    url: endpoint,
    form: formDataStr,
    headers: headers
}, function optionalCallback(err, httpResponse, body) {
    // console.log(httpResponse.request.headers)
    // console.log(httpResponse.request.body)
    // console.log(httpResponse.request.req.toCurl())
    if (err) {
      return console.error('upload failed:', err);
    }
    console.log('\n\n[response]')
    // console.log(body)
    msg = JSON.parse(body).data.split('.')
    console.log(service_sign.decodeData(msg[1]))
});