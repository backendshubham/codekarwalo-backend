const Project = require('../../api/models/Project');
const Client = require('../../api/models/Client');
const Engineer = require('../../api/models/Engineer');

// Get all projects
const getAllProjects = async (req, res) => {
  try {
    const { status, category, complexity, search } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (complexity) filter.complexity = complexity;
    if (search) filter.title = { $regex: search, $options: 'i' };

    const projects = await Project.find(filter)
      .populate('client_id', 'name email')
      .populate('assignedEngineers', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    const clientIds = [...new Set(projects.map(p => p.client_id?._id?.toString()).filter(Boolean))];
    const clients = await Client.find({ _id: { $in: clientIds } }).lean();
    const clientMap = {};
    clients.forEach(client => {
      clientMap[client._id.toString()] = client;
    });

    const projectsWithClient = projects.map(project => ({
      ...project,
      client: clientMap[project.client_id?._id?.toString()] || null,
      client_id: undefined // Remove the original client_id field
    }));

    res.json({
      success: true,
      data: projectsWithClient
    });
  } catch (error) {
    console.error('Error in getAllProjects:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching projects'
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
    const client = await Client.findById(client_id);
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }
    const project = new Project({
      client_id,
      title,
      description,
      category,
      deadline,
      requiredSkills,
      complexity,
      additionalRequirements,
      paymentMethod,
      paymentAmount,
      status: 'pending'
    });
    await project.save();
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
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      {
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
      },
      { new: true, runValidators: true }
    );
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
      message: 'Error updating project'
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

// Assign one or more engineers to a project (admin side)
const assignEngineers = async (req, res) => {
  try {
    const { id } = req.params; // project id
    const { engineers } = req.body; // array of engineer IDs
    console.log( req.body);
    if (!Array.isArray(engineers) || engineers.length === 0) {
      return res.status(400).json({ success: false, message: 'engineers must be a non-empty array.' });
    }

    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Add unique engineer IDs (avoid duplicates)
    project.assignedEngineers = Array.from(new Set([
      ...project.assignedEngineers.map(e => e.toString()),
      ...engineers
    ]));

    await project.save();

    res.json({ success: true, data: project });
  } catch (error) {
    console.error('Error in assignEngineers:', error);
    res.status(500).json({ success: false, message: 'Error assigning engineers' });
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