const Admin = require('../models/Admin');
const Client = require('../models/Client');
const Engineer = require('../models/Engineer');
const Project = require('../models/Project');
const Activity = require('../models/Activity');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const getLoginPage = async (req, res) => {
  res.render('admin/login', { error: null });
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email });

    if (!admin || !(await admin.comparePassword(password))) {
      return res.render('admin/login', { error: 'Invalid credentials' });
    }

    admin.lastLogin = new Date();
    await admin.save();

    req.session.adminId = admin._id;
    res.redirect('/admin/dashboard');
  } catch (error) {
    console.error(error);
    res.render('admin/login', { error: 'Something went wrong' });
  }
};

const getDashboard = async (req, res) => {
  try {
    const [stats, activities, projects] = await Promise.all([
      getDashboardStats(),
      getRecentActivities(),
      getRecentProjects()
    ]);

    res.render('admin/dashboard', {
      title: 'Dashboard',
      user: req.session.adminId,
      stats,
      activities,
      projects
    });
  } catch (error) {
    console.error(error);
    res.status(500).render('error', {
      status: 500,
      message: 'Internal Server Error'
    });
  }
};

const getDashboardStats = async (req, res = null) => {
  try {
    // Get basic counts
    const [totalClients, totalEngineers, totalProjects] = await Promise.all([
    Client.countDocuments(),
    Engineer.countDocuments(),
      Project.countDocuments()
    ]);

    // Get project status counts with payment information
    const projectStats = await Project.aggregate([
      {
        $facet: {
          statusCounts: [
            {
              $group: {
                _id: '$status',
                count: { $sum: 1 }
              }
            }
          ],
          completedEarnings: [
            {
              $match: {
                status: 'completed'
              }
            },
            {
              $group: {
                _id: '$paymentMethod',
                totalAmount: { $sum: { $ifNull: ['$paymentAmount', 0] } },
                count: { $sum: 1 }
              }
            }
          ],
          activeProjects: [
            {
              $match: {
                status: 'in-progress'
              }
            },
            {
              $lookup: {
                from: 'clients',
                localField: 'client_id',
                foreignField: '_id',
                as: 'client'
              }
            },
            {
              $unwind: '$client'
            },
            {
              $project: {
                title: 1,
                description: 1,
                category: 1,
                deadline: 1,
                requiredSkills: 1,
                complexity: 1,
                paymentMethod: 1,
                paymentAmount: 1,
                status: 1,
                clientName: '$client.name',
                clientEmail: '$client.email',
                startDate: '$createdAt',
                endDate: '$deadline'
              }
            },
            {
              $sort: { deadline: 1 }
            }
          ],
          pendingProjects: [
            {
              $match: {
                status: 'pending'
              }
            },
            {
              $lookup: {
                from: 'clients',
                localField: 'client_id',
                foreignField: '_id',
                as: 'client'
              }
            },
            {
              $unwind: '$client'
            },
            {
              $project: {
                title: 1,
                description: 1,
                category: 1,
                deadline: 1,
                requiredSkills: 1,
                complexity: 1,
                paymentMethod: 1,
                paymentAmount: 1,
                status: 1,
                clientName: '$client.name',
                clientEmail: '$client.email',
                startDate: '$createdAt',
                endDate: '$deadline'
              }
            },
            {
              $sort: { deadline: 1 }
            }
          ]
        }
      }
    ]);

    // Process status counts
    const statusCounts = projectStats[0].statusCounts.reduce((acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {});

    // Calculate earnings from completed projects
    const earningsByMethod = projectStats[0].completedEarnings.reduce((acc, curr) => {
      acc[curr._id] = {
        amount: curr.totalAmount || 0,
        count: curr.count || 0
      };
      return acc;
    }, {
      'Weekly': { amount: 0, count: 0 },
      'Hourly': { amount: 0, count: 0 },
      'Monthly': { amount: 0, count: 0 },
      'By Task': { amount: 0, count: 0 }
    });

    // Calculate total earnings from completed projects
    const totalEarnings = projectStats[0].completedEarnings.reduce((sum, curr) => {
      return sum + (curr.totalAmount || 0);
    }, 0);

    // Calculate potential earnings from active projects
    const activeProjectsEarnings = projectStats[0].activeProjects.reduce((sum, project) => {
      console.log('Active Project:', project.title, 'Amount:', project.paymentAmount);
      return sum + (Number(project.paymentAmount) || 0);
    }, 0);

    // Calculate potential earnings from pending projects
    const pendingProjectsEarnings = projectStats[0].pendingProjects.reduce((sum, project) => {
      console.log('Pending Project:', project.title, 'Amount:', project.paymentAmount);
      return sum + (Number(project.paymentAmount) || 0);
    }, 0);

    console.log('Active Projects Earnings:', activeProjectsEarnings);
    console.log('Pending Projects Earnings:', pendingProjectsEarnings);

  const stats = {
    totalClients,
    totalEngineers,
    totalProjects,
      activeProjects: statusCounts['in-progress'] || 0,
      projectsInProgress: statusCounts['pending'] || 0,
      completedProjects: statusCounts['completed'] || 0,
      activeProjectsList: projectStats[0].activeProjects || [],
      pendingProjectsList: projectStats[0].pendingProjects || [],
      totalEarnings,
      activeProjectsEarnings,
      pendingProjectsEarnings,
      earningsByMethod,
    clientGrowth: 0,
    engineerGrowth: 0,
      projectGrowth: 0
    };

    console.log('Final Stats:', {
      totalEarnings: stats.totalEarnings,
      activeProjectsEarnings: stats.activeProjectsEarnings,
      pendingProjectsEarnings: stats.pendingProjectsEarnings,
      activeProjectsCount: stats.activeProjectsList.length,
      pendingProjectsCount: stats.pendingProjectsList.length
    });

  if (res) return res.json(stats);
  return stats;
  } catch (error) {
    console.error('Error in getDashboardStats:', error);
    throw error;
  }
};

const getRecentActivities = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const recentActivities = await Activity.find({ createdAt: { $gte: today } })
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

  return recentActivities.map(a => ({
    title: a.title,
    description: a.description,
    time: a.createdAt.toLocaleTimeString(),
    type: a.type || 'info',
    icon: a.icon || 'info-circle',
    date: 'today'
  }));
};

const getRecentProjects = async () => {
  try {
  const lastWeek = new Date();
  lastWeek.setDate(lastWeek.getDate() - 7);

  const projects = await Project.find({ createdAt: { $gte: lastWeek } })
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

  // Get all unique client_ids from the projects
  const clientIds = [...new Set(projects.map(p => p.client_id.toString()))];

  // Fetch all clients in one query
  const clients = await Client.find({ _id: { $in: clientIds } }).lean();

  // Create a map for quick lookup
  const clientMap = {};
  clients.forEach(client => {
    clientMap[client._id.toString()] = client;
  });

  // Attach client info to each project
  const projectsWithClient = projects.map(project => ({
    ...project,
    client: clientMap[project.client_id.toString()] || null
  }));

  return projectsWithClient;
  } catch (error) {
    console.error('Error in getRecentProjects:', error);
    return [];
  }
};

const logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) console.error('Error destroying session:', err);
    res.redirect('/admin/login');
  });
};

// Project Management APIs
const getAllProjects = async (req, res) => {
  try {
    // Fetch all projects
    const projects = await Project.find().sort({ createdAt: -1 }).lean();

    // Get all unique client_ids from the projects
    const clientIds = [...new Set(projects.map(p => p.client_id.toString()))];

    // Fetch all clients in one query
    const clients = await Client.find({ _id: { $in: clientIds } }).lean();

    // Create a map for quick lookup
    const clientMap = {};
    clients.forEach(client => {
      clientMap[client._id.toString()] = client;
    });

    // Attach client info to each project
    const projectsWithClient = projects.map(project => ({
      ...project,
      client: clientMap[project.client_id.toString()] || null
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

    const project = new Project({
      client_id: mongoose.Types.ObjectId(client_id),
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

    // Create activity log
    const activity = new Activity({
      title: 'New Project Created',
      description: `Project "${title}" has been created`,
      type: 'project',
      icon: 'plus-circle'
    });
    await activity.save();

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
        message: 'Project not found',
        toast: {
          type: 'error',
          message: 'Project not found'
        }
      });
    }

    // Create activity log
    const activity = new Activity({
      title: 'Project Updated',
      description: `Project "${title}" has been updated`,
      type: 'info',
      icon: 'edit',
      user: req.session.adminId
    });
    await activity.save();

    res.json({
      success: true,
      data: project,
      toast: {
        type: 'success',
        message: 'Project updated successfully'
      }
    });
  } catch (error) {
    console.error('Error in updateProject:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating project',
      toast: {
        type: 'error',
        message: 'Failed to update project'
      }
    });
  }
};

const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
        toast: {
          type: 'error',
          message: 'Project not found'
        }
      });
    }

    await project.remove();

    // Create activity log
    const activity = new Activity({
      title: 'Project Deleted',
      description: `Project "${project.title}" has been deleted`,
      type: 'info',
      icon: 'trash',
      user: req.session.adminId
    });
    await activity.save();

    res.json({
      success: true,
      message: 'Project deleted successfully',
      toast: {
        type: 'success',
        message: 'Project deleted successfully'
      }
    });
  } catch (error) {
    console.error('Error in deleteProject:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting project',
      toast: {
        type: 'error',
        message: 'Failed to delete project'
      }
    });
  }
};

// Client Management APIs
const getAllClients = async (req, res) => {
  try {
    const clients = await Client.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      data: clients
    });
  } catch (error) {
    console.error('Error in getAllClients:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching clients'
    });
  }
};

const getClientById = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    res.json({
      success: true,
      data: client
    });
  } catch (error) {
    console.error('Error in getClientById:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching client'
    });
  }
};

const createClient = async (req, res) => {
  try {
    const { name, email, phone } = req.body;

    const client = new Client({
      name,
      email,
      phone,
      status: 'active'
    });

    await client.save();

    // Create activity log
    const activity = new Activity({
      title: 'New Client Added',
      description: `Client "${name}" has been added`,
      type: 'client',
      icon: 'user-plus'
    });
    await activity.save();

    res.status(201).json({
      success: true,
      data: client
    });
  } catch (error) {
    console.error('Error in createClient:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating client'
    });
  }
};

const updateClient = async (req, res) => {
  try {
    const { name, email, phone, status } = req.body;

    const client = await Client.findById(req.params.id);
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    // Update client fields
    Object.assign(client, {
      name,
      email,
      phone,
      status
    });

    await client.save();

    // Create activity log
    const activity = new Activity({
      title: 'Client Updated',
      description: `Client "${name}" has been updated`,
      type: 'client',
      icon: 'edit'
    });
    await activity.save();

    res.json({
      success: true,
      data: client
    });
  } catch (error) {
    console.error('Error in updateClient:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating client'
    });
  }
};

const deleteClient = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    await client.remove();

    // Create activity log
    const activity = new Activity({
      title: 'Client Deleted',
      description: `Client "${client.name}" has been deleted`,
      type: 'client',
      icon: 'trash'
    });
    await activity.save();

    res.json({
      success: true,
      message: 'Client deleted successfully'
    });
  } catch (error) {
    console.error('Error in deleteClient:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting client'
    });
  }
};

const setActive = async (req, res) => {
  await Engineer.findByIdAndUpdate(req.params.id, { status: 'Active' });
  res.json({ success: true });
};

const setInactive = async (req, res) => {
  await Engineer.findByIdAndUpdate(req.params.id, { status: 'Inactive' });
  res.json({ success: true });
};

const updateProjectStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true, runValidators: true }
    );
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
        toast: {
          type: 'error',
          message: 'Project not found'
        }
      });
    }
    res.json({
      success: true,
      data: project,
      toast: {
        type: 'success',
        message: 'Project status updated successfully'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating status',
      toast: {
        type: 'error',
        message: 'Failed to update project status'
      }
    });
  }
};

module.exports = {
  getLoginPage,
  login,
  getDashboard,
  getDashboardStats,
  logout,
  // Project APIs
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  updateProjectStatus,
  // Client APIs
  getAllClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
  setActive,
  setInactive
};
