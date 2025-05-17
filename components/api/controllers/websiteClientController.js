const Client = require('../models/Client');
const Project = require('../models/Project');
const jwt = require('jsonwebtoken');
const { MESSAGES, HTTP_STATUS } = require('../../../config/constants');
const responseHandler = require('../../../utils/responseHandler');

// Register client
async function registerClient(req, res) {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !password) {
      return responseHandler.validationError(res, MESSAGES.CLIENT.REQUIRED_FIELDS);
    }

    let existingClient = await Client.findOne({ email });
    if (existingClient) {
      return responseHandler.validationError(res, MESSAGES.CLIENT.EMAIL_EXISTS);
    }

    const client = new Client({ name, email, phone, password });
    await client.save();

    return responseHandler.success(
      res,
      null,
      MESSAGES.CLIENT.REGISTRATION_SUCCESS,
      HTTP_STATUS.CREATED
    );
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return responseHandler.validationError(res, messages.join(', '));
    }
    console.error(error);
    return responseHandler.error(res, MESSAGES.COMMON.ERROR, HTTP_STATUS.SERVER_ERROR, error);
  }
}

// Login client
async function loginClient(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return responseHandler.validationError(res, MESSAGES.CLIENT.LOGIN_REQUIRED);
    }

    const client = await Client.findOne({ email });
    if (!client) {
      return responseHandler.validationError(res, MESSAGES.CLIENT.INVALID_CREDENTIALS);
    }

    const isMatch = await client.comparePassword(password);
    if (!isMatch) {
      return responseHandler.validationError(res, MESSAGES.CLIENT.INVALID_CREDENTIALS);
    }

    const token = jwt.sign({ id: client._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    return responseHandler.success(res, { token }, MESSAGES.CLIENT.LOGIN_SUCCESS);
  } catch (error) {
    console.error(error);
    return responseHandler.error(res, MESSAGES.COMMON.ERROR, HTTP_STATUS.SERVER_ERROR, error);
  }
}

// Get client profile (protected)
async function getProfile(req, res) {
  try {
    const client = await Client.findById(req.user.id);
    if (!client) {
      return responseHandler.notFound(res, MESSAGES.CLIENT.NOT_FOUND);
    }
    return responseHandler.success(res, client.getPublicProfile());
  } catch (error) {
    console.error(error);
    return responseHandler.error(res, MESSAGES.COMMON.ERROR, HTTP_STATUS.SERVER_ERROR, error);
  }
}

// Submit project (protected)
async function submitProject(req, res) {
  try {
    const {
      projectTitle,
      projectDescription,
      projectCategory,
      projectDeadline,
      skills,
      complexity,
      additionalReq,
      paymentMethod,
      paymentAmount
    } = req.body;

    if (!projectTitle || !projectDescription || !projectCategory || !projectDeadline || !skills || !complexity || !paymentMethod) {
      return responseHandler.validationError(res, MESSAGES.CLIENT.PROJECT_REQUIRED_FIELDS);
    }

    const project = new Project({
      client_id: req.user.id,
      title: projectTitle,
      description: projectDescription,
      category: projectCategory,
      deadline: projectDeadline,
      requiredSkills: Array.isArray(skills) ? skills : skills.split(',').map(s => s.trim()),
      complexity,
      additionalRequirements: additionalReq,
      paymentMethod,
      paymentAmount: paymentAmount ? Number(paymentAmount) : undefined
    });

    await project.save();
    return responseHandler.success(
      res,
      project,
      MESSAGES.CLIENT.PROJECT_CREATED,
      HTTP_STATUS.CREATED
    );
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return responseHandler.validationError(res, messages.join(', '));
    }
    console.error(error);
    return responseHandler.error(res, MESSAGES.COMMON.ERROR, HTTP_STATUS.SERVER_ERROR, error);
  }
}

// Get all projects for the logged-in client
async function getMyProjects(req, res) {
  try {
    const { status, search } = req.query;
    const filter = { client_id: req.user.id };
    if (status && status !== 'all') {
      filter.status = status;
    }
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    const projects = await Project.find(filter)
      .populate('assignedEngineers', 'name')
      .sort({ createdAt: -1 });

    // Format projects for frontend display
    const formatted = projects.map(project => {
      // Calculate progress
      let progress = 0;
      if (project.status === 'completed') progress = 100;
      else if (project.assignedEngineers && project.assignedEngineers.length > 0) progress = 20;
      else if (project.status === 'in-progress') progress = 50;
      else progress = 0;
      return {
        id: project._id,
        title: project.title,
        description: project.description,
        status: project.status,
        startDate: project.createdAt,
        deadline: project.deadline,
        completedAt: project.status === 'completed' ? project.updatedAt : null,
        assignedEngineers: project.assignedEngineers && project.assignedEngineers.length > 0
          ? project.assignedEngineers.map(e => e.name).join(', ')
          : 'Not Assigned',
        progress,
        category: project.category,
        complexity: project.complexity,
        paymentMethod: project.paymentMethod,
        paymentAmount: project.paymentAmount
      };
    });
    return responseHandler.success(res, formatted);
  } catch (error) {
    console.error(error);
    return responseHandler.error(res, MESSAGES.COMMON.ERROR, HTTP_STATUS.SERVER_ERROR, error);
  }
}

module.exports = {
  registerClient,
  loginClient,
  getProfile,
  submitProject,
  getMyProjects
};
