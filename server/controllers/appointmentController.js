/**
 * HOUSE OF JEWELUX — Appointment & Salon Concierge Controller
 * Manages private atelier suite bookings in Jaipur & New Delhi,
 * supporting both PostgreSQL and JSON fallback.
 */

const db = require('../db');

const createAppointment = async (req, res, next) => {
  try {
    const name = req.body.name || req.body.fullName;
    const phone = req.body.phone;
    const email = req.body.email || '';
    const salon = req.body.salon || req.body.consultationType;
    const date = req.body.date || req.body.appointmentDate;
    const timeSlot = req.body.timeSlot || req.body.preferredTime;
    const interests = req.body.interests;
    const notes = req.body.notes || '';

    if (!name || !phone || !date) {
      return res.status(400).json({ success: false, error: 'Name, phone number and preferred date are required.' });
    }

    const appointmentId = `HJ-APT-${Date.now().toString().slice(-6)}`;

    const newAppointment = {
      id: appointmentId,
      bookingRef: appointmentId,
      name,
      phone,
      email,
      salon: salon || 'Jaipur High Jewellery Atelier (Civil Lines)',
      type: salon || 'High Jewellery Consultation',
      date,
      time: timeSlot || 'Morning Private Suite (11:00 AM - 1:00 PM)',
      interests: interests || 'High Jewellery Consultation',
      notes,
      status: 'Confirmed & Calendar Synced',
      createdAt: new Date().toISOString()
    };

    await db.appointments.create(newAppointment);

    res.status(201).json({
      success: true,
      appointmentId,
      appointment: newAppointment,
      message: 'Private salon appointment confirmed. Our Head Goldsmith will await your arrival.'
    });
  } catch (err) {
    next(err);
  }
};

const getAppointments = async (req, res, next) => {
  try {
    const appointments = await db.appointments.getAll();
    res.json({ success: true, appointments });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createAppointment,
  getAppointments
};
