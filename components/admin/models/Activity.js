const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['primary', 'success', 'warning', 'danger', 'info', 'client', 'project', 'task', 'info', 'engineer', 'admin', 'other'],
        default: 'primary'
    },
    icon: {
        type: String,
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Static method to create activity
activitySchema.statics.createActivity = async function(data) {
    try {
        const activity = new this(data);
        await activity.save();
        return activity;
    } catch (error) {
        throw error;
    }
};

// Static method to get recent activities
activitySchema.statics.getRecentActivities = async function(limit = 5) {
    try {
        return await this.find()
            .sort({ createdAt: -1 })
            .limit(limit)
            .populate('user', 'name')
            .lean();
    } catch (error) {
        throw error;
    }
};

const Activity = mongoose.model('Activity', activitySchema);

module.exports = Activity; 