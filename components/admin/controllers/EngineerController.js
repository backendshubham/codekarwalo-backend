const Engineer = require('../../api/models/Engineer');

const list = async (req, res) => {
  try {
    const engineers = await Engineer.find();
    res.render('admin/engineers', { engineers });
  } catch (err) {
    res.status(500).send('Error loading engineers');
  }
};

const showAddForm = (req, res) => {
  res.render('admin/addEngineer');
};

const addEngineer = async (req, res) => {
  try {
    const {
      name, email, password, bio, skills,
      designation, specialization, experience,
      status, resume
    } = req.body;

    await Engineer.create({
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

    res.redirect('/admin/engineers');
  } catch (err) {
    res.render('admin/addEngineer', { error: 'Error adding engineer', form: req.body });
  }
};

const setActive = async (req, res) => {
  try {
    await Engineer.findByIdAndUpdate(req.params.id, { status: 'Active' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error setting active' });
  }
};

const setInactive = async (req, res) => {
  try {
    await Engineer.findByIdAndUpdate(req.params.id, { status: 'Inactive' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error setting inactive' });
  }
};

const editEngineer = async (req, res) => {
  try {
    const { name, designation, experience } = req.body;
    await Engineer.findByIdAndUpdate(req.params.id, { name, designation, experience });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error editing engineer' });
  }
};

const deleteEngineer = async (req, res) => {
  try {
    await Engineer.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error deleting engineer' });
  }
};

module.exports = {
  list,
  showAddForm,
  addEngineer,
  setActive,
  setInactive,
  editEngineer,
  deleteEngineer
};
