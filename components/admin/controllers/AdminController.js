const Admin = require('../models/Admin');
const Client = require('../models/Client');
const Engineer = require('../models/Engineer');
const Project = require('../models/Project');
const Activity = require('../models/Activity');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const getLoginPage = async (req, res) => {
  res.render('admin/login', { error: null, layout: false });
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email });

    if (!admin || !(await admin.comparePassword(password))) {
      return res.render('admin/login', { error: 'Invalid credentials', layout: false });
    }

    admin.lastLogin = new Date();
    await admin.save();

    req.session.adminId = admin._id;
    res.redirect('/admin/dashboard');
  } catch (error) {
    console.error(error);
    res.render('admin/login', { error: 'Something went wrong', layout: false });
  }
};

const getDashboard = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [stats, activityData, clientsToday, projectsToday, engineersToday, topEngineers, topClients] = await Promise.all([
      getDashboardStats(),
      getRecentActivities(),
      Client.countDocuments({ createdAt: { $gte: today } }),
      Project.countDocuments({ createdAt: { $gte: today } }),
      Engineer.countDocuments({ createdAt: { $gte: today } }),
      getTopEngineersData(),
      getTopClientsData()
    ]);
    const todaysActivities = activityData.activities;
    const todaysActivityTypeCounts = activityData.typeCounts;
    const pendingProjects = stats.pendingProjectsList || [];
    const activeProjects = stats.activeProjectsList || [];
    const todayCounts = {
      clients: clientsToday,
      projects: projectsToday,
      engineers: engineersToday
    };
    res.render('admin/dashboard', {
      title: 'Dashboard',
      activePage: 'dashboard',
      user: req.session.adminId,
      stats,
      todaysActivities,
      todaysActivityTypeCounts,
      todayCounts,
      pendingProjects,
      activeProjects,
      topEngineers,
      topClients
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
      return sum + (Number(project.paymentAmount) || 0);
    }, 0);

    // Calculate potential earnings from pending projects
    const pendingProjectsEarnings = projectStats[0].pendingProjects.reduce((sum, project) => {
      return sum + (Number(project.paymentAmount) || 0);
    }, 0);

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

  
  if (res) return res.json(stats);
  return stats;
  } catch (error) {
    console.error('Error in getDashboardStats:', error);
    throw error;
  }
};

const getRecentActivities = async () => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 7);
  startDate.setHours(0, 0, 0, 0);

  const recentActivities = await Activity.find({ createdAt: { $gte: startDate } })
    .sort({ createdAt: -1 })
    .populate({
      path: 'user',
      model: 'admins',
      select: 'name'
    })
    .lean();

  // Count activity types
  const typeCounts = {};
  recentActivities.forEach(a => {
    const type = a.type || 'info';
    typeCounts[type] = (typeCounts[type] || 0) + 1;
  });

  return {
    activities: recentActivities.map(a => ({
      title: a.title,
      description: a.description,
      time: new Date(a.createdAt).toLocaleTimeString(),
      type: a.type || 'info',
      icon: a.icon || 'info-circle',
      date: new Date(a.createdAt).toLocaleDateString(),
      user: a.user ? a.user.name : 'Unknown'
    })),
    typeCounts
  };
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
    // Read filters from query params
    const { status, category, complexity, search } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (complexity) filter.complexity = complexity;
    if (search) filter.title = { $regex: search, $options: 'i' };

    // Fetch filtered projects
    const projects = await Project.find(filter).sort({ createdAt: -1 }).lean();

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

const getProjectsPage = (req, res) => {
  res.render('admin/projects');
};

const getTopEngineers = async (req, res) => {
  try {
    const engineers = await Engineer.aggregate([
      {
        $lookup: {
          from: 'projects',
          localField: '_id',
          foreignField: 'assignedEngineers',
          as: 'projects'
        }
      },
      {
        $project: {
          name: 1,
          email: 1,
          completedProjects: {
            $size: {
              $filter: {
                input: '$projects',
                as: 'project',
                cond: { $eq: ['$$project.status', 'completed'] }
              }
            }
          }
        }
      },
      {
        $sort: { completedProjects: -1 }
      },
      {
        $limit: 5
      }
    ]);

    res.json({
      success: true,
      data: engineers
    });
  } catch (error) {
    console.error('Error in getTopEngineers:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching top engineers'
    });
  }
};

const getTopClients = async (req, res) => {
  try {
    const clients = await Client.aggregate([
      {
        $lookup: {
          from: 'projects',
          localField: '_id',
          foreignField: 'client_id',
          as: 'projects'
        }
      },
      {
        $project: {
          name: 1,
          email: 1,
          projects: { $size: '$projects' }
        }
      },
      {
        $sort: { projects: -1 }
      },
      {
        $limit: 5
      }
    ]);

    res.json({
      success: true,
      data: clients
    });
  } catch (error) {
    console.error('Error in getTopClients:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching top clients'
    });
  }
};

// Helper function to get top engineers data
const getTopEngineersData = async () => {
  try {
    const engineers = await Engineer.aggregate([
      {
        $lookup: {
          from: 'projects',
          localField: '_id',
          foreignField: 'assignedEngineers',
          as: 'projects'
        }
      },
      {
        $project: {
          name: 1,
          email: 1,
          completedProjects: {
            $size: {
              $filter: {
                input: '$projects',
                as: 'project',
                cond: { $eq: ['$$project.status', 'completed'] }
              }
            }
          }
        }
      },
      {
        $sort: { completedProjects: -1 }
      },
      {
        $limit: 5
      }
    ]);

    return engineers;
  } catch (error) {
    console.error('Error in getTopEngineersData:', error);
    return [];
  }
};

// Helper function to get top clients data
const getTopClientsData = async () => {
  try {
    const clients = await Client.aggregate([
      {
        $lookup: {
          from: 'projects',
          localField: '_id',
          foreignField: 'client_id',
          as: 'projects'
        }
      },
      {
        $project: {
          name: 1,
          email: 1,
          projects: { $size: '$projects' }
        }
      },
      {
        $sort: { projects: -1 }
      },
      {
        $limit: 5
      }
    ]);

    return clients;
  } catch (error) {
    console.error('Error in getTopClientsData:', error);
    return [];
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
  setActive,
  setInactive,
  getProjectsPage,
  // Top Performers APIs
  getTopEngineers,
  getTopClients
};
