const Project = require('../../api/models/Project');
const Client = require('../../api/models/Client');
const Engineer = require('../../api/models/Engineer');

// Get all projects
const getAllProjects = async (req, res) => {
  try {
    const { status, category, minBudget, maxBudget, search, page = 1, limit = 12 } = req.query;
    
    // Convert page and limit to numbers
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    
    // Calculate skip value for pagination
    const skip = (pageNum - 1) * limitNum;
    
    const filter = {};
    
    // Status filter
    if (status) {
      filter.status = status;
    }
    
    // Category filter
    if (category) {
      filter.category = category;
    }
    
    // Budget range filter
    if (minBudget || maxBudget) {
      filter.paymentAmount = {};
      if (minBudget) {
        filter.paymentAmount.$gte = Number(minBudget);
      }
      if (maxBudget) {
        filter.paymentAmount.$lte = Number(maxBudget);
      }
    }
    
    // Search filter
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Get total count for pagination info
    const total = await Project.countDocuments(filter);
    
    // Get paginated projects
    const projects = await Project.find(filter)
      .populate('client_id', 'name email')
      .populate('assignedEngineers', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Calculate pagination info
    const totalPages = Math.ceil(total / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    return res.json({
      success: true,
      data: projects,
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
    console.error('Error in getAllProjects:', err);
    return res.status(500).json({ 
      success: false, 
      data: [], 
      error: 'Error loading projects' 
    });
  }
};

// Get project by ID
const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('client_id', 'name email')
      .populate('assignedEngineers', 'name email');
      
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }
    
    res.json({
      success: true,
      data: project
    });
  } catch (error) {
    console.error('Error in getProjectById:', error);
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: 'Invalid project ID'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error fetching project'
    });
  }
};

// Create new project
const createProject = async (req, res) => {
  try {
    const {
      client_id,
      title,
      description,
      category,
      deadline,
      requiredSkills,
      complexity,
      additionalRequirements,
      paymentMethod,
      paymentAmount
    } = req.body;

    // Validate client exists
    const client = await Client.findById(client_id);
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    // Create new project
    const project = new Project({
      client_id,
      title,
      description,
      category,
      deadline,
      requiredSkills: Array.isArray(requiredSkills) ? requiredSkills : [requiredSkills],
      complexity,
      additionalRequirements,
      paymentMethod,
      paymentAmount,
      status: 'pending'
    });

    await project.save();

    // Populate client and engineers before sending response
    await project.populate('client_id', 'name email');
    await project.populate('assignedEngineers', 'name email');

    res.status(201).json({
      success: true,
      data: project
    });
  } catch (error) {
    console.error('Error in createProject:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating project'
    });
  }
};

// Update project
const updateProject = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      deadline,
      requiredSkills,
      complexity,
      additionalRequirements,
      paymentMethod,
      paymentAmount,
      status
    } = req.body;

    const updateData = {
      title,
      description,
      category,
      deadline,
      requiredSkills: Array.isArray(requiredSkills) ? requiredSkills : [requiredSkills],
      complexity,
      additionalRequirements,
      paymentMethod: paymentMethod || 'Hourly', // Set default payment method if not provided
      paymentAmount,
      status
    };

    // Remove undefined and empty string fields
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined || updateData[key] === '') {
        delete updateData[key];
      }
    });

    // If paymentMethod was removed, set it back to the default
    if (!updateData.paymentMethod) {
      updateData.paymentMethod = 'Hourly';
    }

    const project = await Project.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
    .populate('client_id', 'name email')
    .populate('assignedEngineers', 'name email');

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    res.json({
      success: true,
      data: project
    });
  } catch (error) {
    console.error('Error in updateProject:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating project'
    });
  }
};

// Delete project
const deleteProject = async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    res.json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    console.error('Error in deleteProject:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting project'
    });
  }
};

// Assign engineers to a project
const assignEngineers = async (req, res) => {
  try {
    const { id } = req.params;
    const { engineers } = req.body;

    if (!Array.isArray(engineers) || engineers.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Engineers must be a non-empty array' 
      });
    }

    // Validate all engineers exist
    const engineersExist = await Engineer.find({ _id: { $in: engineers } });
    if (engineersExist.length !== engineers.length) {
      return res.status(400).json({
        success: false,
        message: 'One or more engineers not found'
      });
    }

    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ 
        success: false, 
        message: 'Project not found' 
      });
    }

    // Replace the entire assignedEngineers array with the new selection
    project.assignedEngineers = engineers;

    await project.save();

    // Populate the updated project data
    await project.populate('client_id', 'name email');
    await project.populate('assignedEngineers', 'name email');

    res.json({ 
      success: true, 
      data: project 
    });
  } catch (error) {
    console.error('Error in assignEngineers:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error assigning engineers' 
    });
  }
};

module.exports = {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  assignEngineers
}; 