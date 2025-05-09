const Activity = require('../models/Activity');
const Admin = require('../models/Admin');

const getAllActivities = async (req, res) => {
  try {
    const { search } = req.query;
    const filter = search ? {
      $or: [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { type: { $regex: search, $options: 'i' } }
      ]
    } : {};
    const activities = await Activity.find(filter)
      .sort({ createdAt: -1 })
      .populate({ path: 'user', model: 'admins', select: 'name' });
    res.json({ success: true, data: activities });
  } catch (error) {
    console.error('Error in getAllActivities:', error);
    res.status(500).json({ success: false, message: 'Error fetching activities' });
  }
};

module.exports = {
  getAllActivities
}; 