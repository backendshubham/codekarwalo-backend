const Client = require('../../api/models/Client');

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

module.exports = {
  list,
  showAddForm,
  addClient
};
