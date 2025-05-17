const Client = require('../../api/models/Client');
const Activity = require('../models/Activity');
const Project = require('../models/Project');

const getClientsPage = (req, res) => {
  res.render('admin/clients');
};

const list = async (req, res) => {
  try {
    const clients = await Client.find();
    res.render('admin/clients', { clients });
  } catch (err) {
    res.status(500).send('Error loading clients');
  }
};

const showAddForm = (req, res) => {
  res.render('admin/addClient');
};

const addClient = async (req, res) => {
  try {
    const { name, email, phone, status } = req.body;
    await Client.create({ name, email, phone, status });
    res.redirect('/admin/clients');
  } catch (err) {
    res.render('admin/addClient', { error: 'Error adding client', form: req.body });
  }
};
// Client Management APIs
const getAllClients = async (req, res) => {
  try {
    const { search, status, page = 1, limit = 12 } = req.query;
    
    // Convert page and limit to numbers
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    
    // Calculate skip value for pagination
    const skip = (pageNum - 1) * limitNum;

    // Build search filter
    const filter = search ? {
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ]
    } : {};
    if (status) filter.status = status;

    // Get total count for pagination info
    const total = await Client.countDocuments(filter);

    // Get paginated clients
    const clients = await Client.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Calculate pagination info
    const totalPages = Math.ceil(total / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    res.json({
      success: true,
      data: clients,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalItems: total,
        itemsPerPage: limitNum,
        hasNextPage,
        hasPrevPage
      }
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

const getClientProjects = async (req, res) => {
  try {
    const clientId = req.params.id;
    
    // Get total projects count
    const total = await Project.countDocuments({ client_id: clientId });
    
    // Get active projects count
    const active = await Project.countDocuments({ 
      client_id: clientId,
      status: 'active'
    });
    
    // Get completed projects count
    const completed = await Project.countDocuments({ 
      client_id: clientId,
      status: 'completed'
    });

    res.json({
      success: true,
      total,
      active,
      completed
    });
  } catch (error) {
    console.error('Error in getClientProjects:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching client projects'
    });
  }
};

const createClient = async (req, res) => {
  try {
    const { name, email, phone, status } = req.body;

    const client = new Client({
      name,
      email,
      phone,
      status: status || 'active'
    });

    await client.save();

    // Create activity log
    const activity = new Activity({
      title: 'New Client Added',
      description: `Client "${name}" has been added`,
      type: 'client',
      icon: 'user-plus',
      user: req.session.adminId
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
      description: `Client "${name}" was updated`,
      type: 'client',
      icon: 'edit',
      user: req.session.adminId
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
    const client = await Client.findByIdAndDelete(req.params.id);
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    // Create activity log
    const activity = new Activity({
      title: 'Client Deleted',
      description: `Client "${client.name}" has been deleted`,
      type: 'client',
      icon: 'trash',
      user: req.session.adminId
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
  try {
    const client = await Client.findByIdAndUpdate(
      req.params.id,
      { status: 'active' },
      { new: true }
    );

    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }

    res.json({ success: true, data: client });
  } catch (err) {
    console.error('Error setting client active:', err);
    res.status(500).json({ success: false, message: 'Error setting client active' });
  }
};

const setInactive = async (req, res) => {
  try {
    const client = await Client.findByIdAndUpdate(
      req.params.id,
      { status: 'inactive' },
      { new: true }
    );

    if (!client) {
      return res.status(404).json({ success: false, message: 'EngClientineer not found' });
    }

    res.json({ success: true, data: client });
  } catch (err) {
    console.error('Error setting client inactive:', err);
    res.status(500).json({ success: false, message: 'Error setting client inactive' });
  }
};

module.exports = {
  getClientsPage,
  list,
  showAddForm,
  addClient,
  getAllClients,
  getClientById,
  getClientProjects,
  createClient,
  updateClient,
  deleteClient,
  setActive,
  setInactive
};
