const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
const authRoutes = require('./routes/auth');
const treatmentRoutes = require('./routes/treatment');
const consultationRoutes = require('./routes/consultation');
const clinicRoutes = require('./routes/clinic');
const engagementRoutes = require('./routes/engagement');
const chatRoutes = require('./routes/chat');
const habitRiskRoutes = require('./routes/habit_risk');
const exerciseRoutes = require('./routes/exercise');
const healthTrackerRoutes = require('./routes/health_trackers');
const aiRoutes = require('./routes/ai');
const aiProxyRoutes = require('./routes/ai_proxy');

// Web-Specific Routes
const webDashboard = require('./routes/web/dashboard');
const webReports = require('./routes/web/reports');
const webAI = require('./routes/web/ai');
const webTreatment = require('./routes/web/treatment');
const webMedications = require('./routes/web/medications');
const webAnalytics = require('./routes/web/analytics');
const webHealth = require('./routes/web/health');


// Map paths to match old PHP files for zero-configuration transition
app.use('/', authRoutes);
app.use('/', treatmentRoutes);
app.use('/', consultationRoutes);
app.use('/', clinicRoutes);
app.use('/', engagementRoutes);
app.use('/', chatRoutes);
app.use('/', habitRiskRoutes);
app.use('/', exerciseRoutes);
app.use('/', healthTrackerRoutes);
app.use('/ai', aiRoutes);
app.use('/api', aiProxyRoutes);

// Web-Specific Route Mounting
app.use('/web', webDashboard);
app.use('/web', webReports);
app.use('/web', webAI);
app.use('/web', webTreatment);
app.use('/web', webMedications);
app.use('/web', webAnalytics);
app.use('/web', webHealth);



// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'success', message: 'Server is running', engine: 'Node.js/Express' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`ProstoCalc Node.js Backend running on http://0.0.0.0:${PORT}`);
});
