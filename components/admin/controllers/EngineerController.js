const Engineer = require('../../api/models/Engineer');
const Project = require('../../api/models/Project');

const getEngineersPage = async (req, res) => {
  try {
    res.render('admin/engineers');
  } catch (err) {
    console.error('Error rendering engineers page:', err);
    res.status(500).send('Error loading engineers page');
  }
};

const getAllEngineers = async (req, res) => {
  try {
    const { status, designation, specialization, minExperience, maxExperience, search, page = 1, limit = 12 } = req.query;
    
    // Convert page and limit to numbers
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    
    // Calculate skip value for pagination
    const skip = (pageNum - 1) * limitNum;
    
    const filter = {};
    
    // Status filter - normalize to lowercase
    if (status) {
      filter.status = status.toLowerCase();
    }
    
    // Designation filter
    if (designation) {
      filter.designation = designation;
    }
    
    // Specialization filter
    if (specialization) {
      filter.specialization = specialization;
    }
    
    // Experience range filter
    if (minExperience || maxExperience) {
      filter.experience = {};
      if (minExperience) {
        filter.experience.$gte = Number(minExperience);
      }
      if (maxExperience) {
        filter.experience.$lte = Number(maxExperience);
      }
    }
    
    // Search filter
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Get total count for pagination info
    const total = await Engineer.countDocuments(filter);
    
    // Get paginated engineers
    const engineers = await Engineer.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Calculate pagination info
    const totalPages = Math.ceil(total / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    return res.json({
      success: true,
      data: engineers,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalItems: total,
        itemsPerPage: limitNum,
        hasNextPage,
        hasPrevPage
      }
    });
  } catch (err) {
    console.error('Error in getAllEngineers:', err);
    return res.status(500).json({ 
      success: false, 
      data: [], 
      error: 'Error loading engineers' 
    });
  }
};

const getEngineerById = async (req, res) => {
  try {
    const engineer = await Engineer.findById(req.params.id);
    if (!engineer) {
      return res.status(404).json({
        success: false,
        message: 'Engineer not found'
      });
    }

    res.json({
      success: true,
      data: engineer
    });
  } catch (error) {
    console.error('Error in getEngineerById:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching engineer'
    });
  }
};

const getEngineerProjects = async (req, res) => {
  try {
    const engineerId = req.params.id;
    const total = await Project.countDocuments({ assignedEngineers: engineerId });
    const active = await Project.countDocuments({ assignedEngineers: engineerId, status: 'in-progress' });
    const completed = await Project.countDocuments({ assignedEngineers: engineerId, status: 'completed' });

    console.log({
      engineerId,
      total,
      active,
      completed
    });

    res.json({
      success: true,
      data: { total, active, completed }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching project stats' });
  }
};

const createEngineer = async (req, res) => {
  try {
    const {
      name, email, password, bio, skills,
      designation, specialization, experience,
      status, resume
    } = req.body;

    const engineer = await Engineer.create({
      name,
      email,
      password,
      bio,
      skills: skills.split(',').map(s => s.trim()),
      designation,
      specialization,
      experience,
      status,
      resume,
      termsAccepted: true
    });

    res.json({ success: true, data: engineer });
  } catch (err) {
    console.error('Error creating engineer:', err);
    res.status(500).json({ success: false, message: 'Error creating engineer' });
  }
};

const updateEngineer = async (req, res) => {
  try {
    const { name, email, bio, skills, designation, specialization, experience, status } = req.body;
    const updateData = {
      name,
      email,
      bio,
      skills: skills ? skills.split(',').map(s => s.trim()) : undefined,
      designation,
      specialization,
      experience,
      status
    };

    // Remove undefined fields
    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

    const engineer = await Engineer.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!engineer) {
      return res.status(404).json({ success: false, message: 'Engineer not found' });
    }

    res.json({ success: true, data: engineer });
  } catch (err) {
    console.error('Error updating engineer:', err);
    res.status(500).json({ success: false, message: 'Error updating engineer' });
  }
};

const setActive = async (req, res) => {
  try {
    const engineer = await Engineer.findByIdAndUpdate(
      req.params.id,
      { status: 'active' },
      { new: true }
    );

    if (!engineer) {
      return res.status(404).json({ success: false, message: 'Engineer not found' });
    }

    res.json({ success: true, data: engineer });
  } catch (err) {
    console.error('Error setting engineer active:', err);
    res.status(500).json({ success: false, message: 'Error setting engineer active' });
  }
};

const setInactive = async (req, res) => {
  try {
    const engineer = await Engineer.findByIdAndUpdate(
      req.params.id,
      { status: 'inactive' },
      { new: true }
    );

    if (!engineer) {
      return res.status(404).json({ success: false, message: 'Engineer not found' });
    }

    res.json({ success: true, data: engineer });
  } catch (err) {
    console.error('Error setting engineer inactive:', err);
    res.status(500).json({ success: false, message: 'Error setting engineer inactive' });
  }
};

const deleteEngineer = async (req, res) => {
  try {
    const engineer = await Engineer.findByIdAndDelete(req.params.id);
    
    if (!engineer) {
      return res.status(404).json({ success: false, message: 'Engineer not found' });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting engineer:', err);
    res.status(500).json({ success: false, message: 'Error deleting engineer' });
  }
};

const getEarningsThisMonth = async (req, res) => {
  try {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const result = await Project.aggregate([
      {
        $match: {
          createdAt: { $gte: firstDay, $lte: lastDay },
          status: 'completed' // Only count completed projects as earnings
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$paymentAmount' }
        }
      }
    ]);
    const total = result[0]?.total || 0;
    res.json({ success: true, total });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching earnings' });
  }
};

const getTopEngineers = async (req, res) => {
  try {
    const top = await Project.aggregate([
      { $match: { status: 'completed' } },
      { $unwind: '$assignedEngineers' },
      { $group: { _id: '$assignedEngineers', completedProjects: { $sum: 1 } } },
      { $sort: { completedProjects: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'engineers',
          localField: '_id',
          foreignField: '_id',
          as: 'engineer'
        }
      },
      { $unwind: '$engineer' },
      {
        $project: {
          _id: 0,
          engineerId: '$engineer._id',
          name: '$engineer.name',
          email: '$engineer.email',
          completedProjects: 1
        }
      }
    ]);
    res.json({ success: true, data: top });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching top engineers' });
  }
};

module.exports = {
  getEngineersPage,
  getAllEngineers,
  getEngineerById,
  getEngineerProjects,
  createEngineer,
  updateEngineer,
  setActive,
  setInactive,
  deleteEngineer,
  getEarningsThisMonth,
  getTopEngineers
};
