const Engineer = require('../models/Engineer');

// Website-side engineer registration
async function registerEngineer(req, res) {
    try {
        const { fullName, email, skills, aboutMe, designation, termsAccepted } = req.body;
        if (!fullName || !email || !skills || !aboutMe || !designation || !termsAccepted) {
            return res.status(400).json({ success: false, message: 'All required fields must be filled.' });
        }
        if (!req.files || !req.files.resume) {
            return res.status(400).json({ success: false, message: 'Resume file is required.' });
        }
        const resumeFile = req.files.resume;
        if (resumeFile.mimetype !== 'application/pdf') {
            return res.status(400).json({ success: false, message: 'Resume must be a PDF file.' });
        }
        const uploadPath = `uploads/resumes/${Date.now()}_${resumeFile.name}`;
        await resumeFile.mv(uploadPath);
        const engineer = new Engineer({
            name: fullName,
            email,
            skills: Array.isArray(skills) ? skills : skills.split(',').map(s => s.trim()),
            bio: aboutMe,
            designation,
            resume: uploadPath,
            termsAccepted: termsAccepted === 'true' || termsAccepted === true
        });
        await engineer.save();
        res.status(201).json({ success: true, data: engineer.getPublicProfile() });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
}

module.exports = {
    registerEngineer
}; 