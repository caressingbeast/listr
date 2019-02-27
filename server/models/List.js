// List.js

const mongoose = require('mongoose');

const ListSchema = new mongoose.Schema({
    title: {
        type: String,
        default: Date.now,
        required: true
    },
    items: [
        {
            title: {
                type: String,
                required: true
            },
            completed: {
                type: Boolean,
                default: false
            },
            created_at: {
                type: Date,
                default: Date.now
            }
        }
    ],
    shared_users: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    ],
    created_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    created_at: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('List', ListSchema);