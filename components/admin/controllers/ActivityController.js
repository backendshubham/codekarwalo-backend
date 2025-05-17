const Activity = require('../models/Activity');
const Admin = require('../models/Admin');

const getAllActivities = async (req, res) => {
  try {
    console.log("getAllActivities");
    // Get activities from the last 7 days instead of just today
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    startDate.setHours(0, 0, 0, 0);

    const activities = await Activity.find({
      createdAt: { $gte: startDate }
    })
    .sort({ createdAt: -1 })
    .populate({
      path: 'user',
      model: 'admins',  // Use the correct model name as defined in Admin.js
      select: 'name'
    })
    .lean();

    // Format activities for dashboard display
    const formattedActivities = activities.map(activity => ({
      title: activity.title,
      description: activity.description,
      time: new Date(activity.createdAt).toLocaleTimeString(),
      type: activity.type || 'info',
      icon: activity.icon || 'info-circle',
      date: new Date(activity.createdAt).toLocaleDateString(),
      user: activity.user ? activity.user.name : 'Unknown'
    }));

    res.json({ success: true, data: formattedActivities });
  } catch (error) {
    console.error('Error in getAllActivities:', error);
    res.status(500).json({ success: false, message: 'Error fetching activities' });
  }
};

module.exports = {
  getAllActivities
}; 