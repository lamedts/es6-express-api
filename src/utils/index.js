function base64AddPadding(str) {
    return str + Array((4 - str.length % 4) % 4 + 1).join('=');
}

module.exports = {
	base64AddPadding
};