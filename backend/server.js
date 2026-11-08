require('dotenv').config();

const app = require('./src/app');
const { connectRabbitMQ } = require('./src/config/rabbitmq');
const { startReportWorker } = require('./src/workers/reportWorker');
const { startCleanupJob } = require('./src/jobs/cleanupReports');

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    await connectRabbitMQ();
    await startReportWorker();
    startCleanupJob();

    app.listen(PORT, () => {
      console.log(`EcoPulse API listening on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
}

start();
