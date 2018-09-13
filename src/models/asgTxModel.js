const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const serviceTxSchema = new Schema({
	amount: {
        type: String,
        required: true,
	},
	receipt_datetime: {
		type: String,
		required: true,
	},
	receipt_id: {
		type: String,
        required: true,
        unique: true,
	},
	trans_id:{
		type: String,
        required: true,
        unique: true,
    },
    trans_status:{
		type: String,
		required: true,
	}
});

module.exports = mongoose.model('ServiceTx', serviceTxSchema);
