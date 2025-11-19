import fs from 'fs';

// Load existing data
const data = JSON.parse(fs.readFileSync('data.json', 'utf8'));

// Extract existing entities
const operators = data.operators;
const treatments = data.treatments;
const patients = data.patients;
const existingAppointments = data.appointments || [];
const existingInvoices = data.invoices || [];

console.log(`Loaded ${operators.length} operators, ${treatments.length} treatments, ${patients.length} patients`);
console.log(`Existing: ${existingAppointments.length} appointments, ${existingInvoices.length} invoices`);

// Helper functions
function getRandomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomItems(array, count) {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function getRandomDate(start, end) {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const randomDate = new Date(startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime()));
  return randomDate.toISOString().split('T')[0];
}

function getRandomTime() {
  const hours = Math.floor(Math.random() * 12) + 8; // 8 AM to 8 PM
  const minutes = Math.random() < 0.5 ? '00' : '30';
  return `${hours.toString().padStart(2, '0')}:${minutes}`;
}

function generateVitalSigns() {
  const hasValidBP = Math.random() > 0.3; // 70% chance of having recorded BP

  if (hasValidBP) {
    const systolic = Math.floor(Math.random() * 50) + 100; // 100-150
    const diastolic = Math.floor(Math.random() * 30) + 60; // 60-90
    return {
      bloodPressure: `${systolic}/${diastolic}`,
      respirationRate: Math.floor(Math.random() * 10) + 12, // 12-21
      heartRate: Math.floor(Math.random() * 40) + 60, // 60-100
      borgScale: Math.floor(Math.random() * 11) // 0-10
    };
  } else {
    return {
      bloodPressure: "Not recorded",
      respirationRate: 0,
      heartRate: 0,
      borgScale: 0
    };
  }
}

function getNextInvoiceNumber(existingInvoices, date) {
  const yearMonth = date.replace(/-/g, '').substring(0, 6);
  const existingForMonth = existingInvoices
    .filter(inv => inv.invoiceNumber && inv.invoiceNumber.startsWith(`INV-${yearMonth}`))
    .length;
  const nextNumber = existingForMonth + 1;
  return `INV-${yearMonth}-${nextNumber.toString().padStart(4, '0')}`;
}

// Generate appointments
function generateAppointments(count) {
  const appointments = [];
  const startDate = '2024-01-01';
  const endDate = '2025-12-31';

  for (let i = 0; i < count; i++) {
    const patient = getRandomItem(patients);
    const operator = getRandomItem(operators);
    const treatmentCount = Math.random() < 0.8 ? 1 : (Math.random() < 0.9 ? 2 : 3); // 80% single, 18% double, 2% triple treatments
    const selectedTreatments = getRandomItems(treatments, treatmentCount);

    const appointment = {
      id: Date.now() + i + 1,
      patientName: patient.name,
      patientId: patient.id,
      operatorName: operator.name,
      operatorId: operator.id,
      date: getRandomDate(startDate, endDate),
      time: getRandomTime(),
      vitalSigns: generateVitalSigns(),
      treatments: selectedTreatments,
      totalPrice: selectedTreatments.reduce((sum, t) => sum + t.price, 0),
      notes: Math.random() < 0.3 ? `Progress note for appointment ${i + 1}` : "",
      created_at: new Date().toISOString()
    };

    appointments.push(appointment);
  }

  return appointments;
}

// Generate invoices based on appointments
function generateInvoices(appointments, existingInvoices) {
  const invoices = [];

  appointments.forEach((appointment, index) => {
    const status = Math.random() < 0.7 ? 'paid' : 'unpaid'; // 70% paid, 30% unpaid

    const invoice = {
      id: Date.now() + index + 100000,
      invoiceNumber: getNextInvoiceNumber([...existingInvoices, ...invoices], appointment.date),
      appointmentId: appointment.id,
      patientName: appointment.patientName,
      patientId: appointment.patientId,
      operatorName: appointment.operatorName,
      operatorId: appointment.operatorId,
      date: new Date().toISOString(),
      appointmentDate: appointment.date,
      vitalSigns: appointment.vitalSigns,
      treatments: appointment.treatments,
      totalAmount: appointment.totalPrice,
      status: status,
      paymentMethod: status === 'paid' ? getRandomItem(['cash', 'transfer', 'card']) : null,
      paidAt: status === 'paid' ? new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString() : null,
      created_at: new Date().toISOString(),
      updated_at: status === 'paid' ? new Date().toISOString() : new Date().toISOString()
    };

    invoices.push(invoice);
  });

  return invoices;
}

// Generate the data
console.log('Generating 25,000 appointments...');
const newAppointments = generateAppointments(25000);
console.log('Generated 25,000 appointments');

console.log('Generating 25,000 invoices...');
const newInvoices = generateInvoices(newAppointments, existingInvoices);
console.log('Generated 25,000 invoices');

// Create the updated data structure
const updatedData = {
  ...data,
  appointments: [...existingAppointments, ...newAppointments],
  invoices: [...existingInvoices, ...newInvoices]
};

// Save to new file
const outputFile = `data_with_${newAppointments.length}_appointments_${newInvoices.length}_invoices.json`;
fs.writeFileSync(outputFile, JSON.stringify(updatedData, null, 2));

console.log(`\n✅ Data generation complete!`);
console.log(`📊 Final statistics:`);
console.log(`   - Total appointments: ${updatedData.appointments.length}`);
console.log(`   - Total invoices: ${updatedData.invoices.length}`);
console.log(`   - New appointments added: ${newAppointments.length}`);
console.log(`   - New invoices added: ${newInvoices.length}`);
console.log(`\n📁 Saved to: ${outputFile}`);

// Generate some statistics
const stats = {
  appointmentsByOperator: {},
  appointmentsByTreatment: {},
  appointmentsByMonth: {},
  invoicesByStatus: { paid: 0, unpaid: 0 },
  totalRevenue: newInvoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.totalAmount, 0)
};

newAppointments.forEach(apt => {
  // By operator
  stats.appointmentsByOperator[apt.operatorName] = (stats.appointmentsByOperator[apt.operatorName] || 0) + 1;

  // By treatment
  apt.treatments.forEach(t => {
    stats.appointmentsByTreatment[t.name] = (stats.appointmentsByTreatment[t.name] || 0) + 1;
  });

  // By month
  const month = apt.date.substring(0, 7);
  stats.appointmentsByMonth[month] = (stats.appointmentsByMonth[month] || 0) + 1;
});

newInvoices.forEach(inv => {
  stats.invoicesByStatus[inv.status]++;
});

console.log(`\n📈 Generated Data Statistics:`);
console.log(`   - Appointments by operator:`, stats.appointmentsByOperator);
console.log(`   - Appointments by treatment:`, stats.appointmentsByTreatment);
console.log(`   - Invoices - Paid: ${stats.invoicesByStatus.paid}, Unpaid: ${stats.invoicesByStatus.unpaid}`);
console.log(`   - Total generated revenue: Rp ${stats.totalRevenue.toLocaleString('id-ID')}`);