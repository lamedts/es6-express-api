const moment = require('moment');
const crypto = require('crypto');
const utf8 = require('utf8');

const CryptoJS = require("crypto-js");
const SHA256 = require("crypto-js/sha256");

function sign1(key, msg) {
    let hmac = null
    hmac = crypto.createHmac('sha256', key);
    hmac.update(msg, 'utf-8');
    return hmac.digest()
}

function getSignatureKey(key, dateStamp, regionName, serviceName) {
    const kDate = sign1(utf8.encode('AWS4' + key), dateStamp)
    const kRegion = sign1(kDate, regionName)
    const kService = sign1(kRegion, serviceName)
    const kSigning = sign1(kService, 'aws4_request')
    return kSigning;
}

exports.getHeader = function(config, formDataStr, bodyData) {
    const predefineHeader = {
        'Host': 'host.com',
        'Accept': 'application/json',
        'Cache-control': 'no-cache',
        'Content-Type': 'application/x-www-form-urlencoded',
    }
    const endpoint = `https://${config.service.host}${config.service.path}`
    const host = config.service.host
    const canonicalUri = config.service.path
    const method = 'POST'
    const serviceName = config.service.service_name
    const regionName = config.service.region_name
    const accessKey = config.service.access_key
    const secretKey = config.service.secret_key
    const xApiKey = config.service.x_api_key

    const utcNow = moment.utc()
    const amzDate = utcNow.format('YYYYMMDDThhmmss') + 'Z'
    const dateStamp = utcNow.format('YYYYMMDD')

    const requestParameters = formDataStr
    const canonicalQuerystring = ''
    const unordered = {...predefineHeader, 'X-Amz-Date':amzDate, 'x-api-key':xApiKey}

    let ordered = {}
    let canonicalHeaders = ''
    let signedHeaders = ''

    Object.keys(unordered).sort().forEach(function(key) {
        ordered[key] = unordered[key];
    });
    for (var key in ordered) {
        signedHeaders += `${key.toLowerCase()};`
        canonicalHeaders += `${key.toLowerCase()}:${ordered[key]}\n`
    }
    signedHeaders = signedHeaders.slice(0, -1);
    const payloadHash = SHA256(requestParameters).toString(CryptoJS.enc.Hex)
    const canonicalRequest = method + '\n' + canonicalUri + '\n' + canonicalQuerystring + '\n' + canonicalHeaders + '\n' + signedHeaders + '\n' + payloadHash
    
    // gen string_to_sign
    const signingKey = getSignatureKey(secretKey, dateStamp, regionName, serviceName)
    const algorithm = 'AWS4-HMAC-SHA256'
    const credentialScope = dateStamp + '/' + regionName + '/' + serviceName + '/' + 'aws4_request'
    const stringToSign = algorithm + '\n' +  amzDate + '\n' +  credentialScope + '\n' +  SHA256(canonicalRequest).toString(CryptoJS.enc.Hex)
    
    // gen authorization_header
    const sigHmac = crypto.createHmac('sha256', signingKey).update(utf8.encode(stringToSign)).digest('hex')
    const authorizationHeader = algorithm + ' ' + 'Credential=' + accessKey + '/' + credentialScope + ', ' +  'SignedHeaders=' + signedHeaders + ', ' + 'Signature=' + sigHmac


    return {...ordered, 'Authorization':authorizationHeader}
}





