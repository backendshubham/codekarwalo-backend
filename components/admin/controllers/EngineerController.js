const Engineer = require('../../api/models/Engineer');

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
    const { status, designation, specialization, minExperience, maxExperience, search } = req.query;
    
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
    
    const engineers = await Engineer.find(filter).sort({ createdAt: -1 });
    return res.json({ data: engineers });
  } catch (err) {
    console.error('Error in getAllEngineers:', err);
    return res.status(500).json({ data: [], error: 'Error loading engineers' });
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

module.exports = {
  getEngineersPage,
  getAllEngineers,
  createEngineer,
  updateEngineer,
  setActive,
  setInactive,
  deleteEngineer
};
