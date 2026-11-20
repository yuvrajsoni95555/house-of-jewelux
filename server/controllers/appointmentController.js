/**
 * HOUSE OF JEWELUX — Online Consultation Request Controller
 * Stores customer requests for follow-up; requests are not confirmed appointments.
 */

const { readJSON, writeJSON } = require('../db/jsonDb');

const createAppointment = (req, res, next) => {
  try {
    const name = req.body.name || req.body.fullName;
    const phone = req.body.phone;
    const email = req.body.email;
    const consultationType = req.body.consultationType || 'Online Consultation';
    const date = req.body.date || req.body.appointmentDate;
    const timeSlot = req.body.timeSlot || req.body.preferredTime;
    const interests = req.body.interests;
    const notes = req.body.notes;

    if (typeof name !== 'string' || !name.trim() || typeof phone !== 'string' || phone.replace(/\\D/g, '').length < 10 || phone.replace(/\\D/g, '').length > 15 || typeof email !== 'string' || !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email) || typeof date !== 'string' || !/^\\d{4}-\\d{2}-\\d{2}$/.test(date)) {
      return res.status(400).json({ success: false, error: 'Name, phone number and preferred date are required.' });
    }

    const appointments = readJSON('appointments.json', []);
    const appointmentId = `HJ-REQ-${require('crypto').randomBytes(6).toString('hex').toUpperCase()}`;

    const newAppointment = {
      appointmentId,
      name,
      phone,
      email: email || '',
      consultationType: String(consultationType).slice(0, 80),
      date,
      timeSlot: typeof timeSlot === 'string' ? timeSlot.slice(0, 80) : '',
      interests: typeof interests === 'string' ? interests.slice(0, 500) : '',
      notes: notes || '',
      status: 'Request Received — Awaiting Confirmation',
      createdAt: new Date().toISOString()
    };

    appointments.unshift(newAppointment);
    if (!writeJSON('appointments.json', appointments)) return res.status(500).json({ success: false, error: 'Unable to save your consultation request. Please try again.' });

    res.status(201).json({
      success: true,
      appointmentId,
      appointment: newAppointment,
      message: 'Your consultation request has been received. Our team will contact you to confirm availability.'
    });
  } catch (err) {
    next(err);
  }
};

const getAppointments = (req, res, next) => {
  try {
    const appointments = readJSON('appointments.json', []);
    res.json({ success: true, appointments });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createAppointment,
  getAppointments
};
