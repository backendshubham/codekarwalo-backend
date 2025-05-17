const Activity = require('../models/Activity');
const Admin = require('../models/Admin');

const getActivityLog = async (req, res) => {
  try {
    const { page = 1, limit = 12, type, user, startDate, endDate, search } = req.query;
    const filter = {};
    if (type) filter.type = type;
    if (user) filter['user.name'] = { $regex: user, $options: 'i' };
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const activities = await Activity.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate({ path: 'user', model: 'admins', select: 'name' })
      .select('title description type icon createdAt user')
      .lean();

    const total = await Activity.countDocuments(filter);

    res.json({ success: true, data: activities, total });
  } catch (error) {
    console.error('Error in getActivityLog:', error);
    res.status(500).json({ success: false, message: 'Error fetching activity log' });
  }
};

module.exports = { getActivityLog }; 