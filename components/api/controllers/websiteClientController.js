const Client = require('../models/Client');
const Project = require('../models/Project');
const jwt = require('jsonwebtoken');

// Register client
async function registerClient(req, res) {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }

    let existingClient = await Client.findOne({ email });
    if (existingClient) {
      return res.status(400).json({ success: false, message: 'Email already registered.' });
    }

    const client = new Client({ name, email, phone, password });
    await client.save();

    res.status(201).json({ success: true, message: 'Registration successful.' });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
}

// Login client
async function loginClient(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const client = await Client.findOne({ email });
    if (!client) {
      return res.status(400).json({ success: false, message: 'Invalid credentials.' });
    }

    const isMatch = await client.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid credentials.' });
    }

    const token = jwt.sign({ id: client._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({ success: true, token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
}

// Get client profile (protected)
async function getProfile(req, res) {
  try {
    const client = await Client.findById(req.user.id);
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found.' });
    }
    res.json({ success: true, data: client.getPublicProfile() });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
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
      return res.status(400).json({ success: false, message: 'All required fields must be filled.' });
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
    res.status(201).json({ success: true, data: project });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
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
        res.json({ success: true, data: formatted });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
}

module.exports = {
  registerClient,
  loginClient,
  getProfile,
  submitProject,
  getMyProjects
};
