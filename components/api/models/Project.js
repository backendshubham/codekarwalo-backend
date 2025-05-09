const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  client_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'clients',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Project title is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Project description is required'],
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Project category is required'],
    enum: [
      'Software Development',
      'Web Development',
      'Graphic Design',
      'Data Science',
      'UI/UX Design',
      'Embedded Systems',
      'Other'
    ]
  },
  deadline: {
    type: Date,
    required: [true, 'Project deadline is required']
  },
  requiredSkills: [{
    type: String,
    enum: [
      'Frontend Development',
      'Backend Development',
      'UI/UX Design',
      'Data Analysis',
      'Mobile Development',
      'DevOps',
      'Other'
    ]
  }],
  complexity: {
    type: String,
    required: [true, 'Project complexity is required'],
    enum: ['Low', 'Medium', 'High']
  },
  additionalRequirements: {
    type: String,
    trim: true
  },
  paymentMethod: {
    type: String,
    required: [true, 'Payment method is required'],
    enum: ['Weekly', 'Hourly', 'Monthly', 'By Task']
  },
  paymentAmount: {
    type: Number,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  assignedEngineers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Engineer'
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('projects', projectSchema);
