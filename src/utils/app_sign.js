const crypto = require('crypto');
const base64url = require('base64url');
const fs = require('fs')
const utils = require('.')
const path = require('path')
const appRoot = require('app-root-path');

exports.signData = function(payload, keyName) {
    const privateKeyLoc = (keyName) ? path.join(appRoot.toString(), `/config/key/${keyName}`) : path.join(appRoot.toString(), '/config/key/priv.pem');
    const privatekey = fs.readFileSync(privateKeyLoc, 'utf8');

    const header = {"typ":"JWT","alg":"RS256"}
    const b64h = utils.base64AddPadding(base64url.fromBase64(base64url.encode(JSON.stringify(header))))
    const b64p = utils.base64AddPadding(base64url.fromBase64(base64url.encode(JSON.stringify(payload))))
    const data = `${b64h}.${b64p}`

    const signer = crypto.createSign('RSA-SHA256').update(data); 
    const signture = signer.sign(privatekey, 'base64');
    const b64sig = utils.base64AddPadding(base64url.fromBase64(signture))
    const jwt = `${data}.${b64sig}`
    return jwt
}

exports.verifyData = function(payload, publicKey) {
    // publicKey = (publicKey) ? `/config/key/${publicKey}` : '/config/key/pubkey.pem';
    return true
}

exports.decodeData = function(msg) {
    return base64url.decode(utils.base64AddPadding(msg))
}
