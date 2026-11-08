const { pool } = require('../config/database');
const { getChannel, QUEUE_NAME } = require('../config/rabbitmq');

async function startReportWorker() {
  const channel = getChannel();

  await channel.consume(
    QUEUE_NAME,
    async (msg) => {
      if (!msg) return;

      try {
        const data = JSON.parse(msg.content.toString());
        const { id, report_type_code, description, latitude, longitude } = data;

        await pool.query(
          `
          INSERT INTO reports (id, report_type_code, description, latitude, longitude)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (id) DO NOTHING
          `,
          [id, report_type_code, description, latitude, longitude]
        );

        channel.ack(msg);
        console.log(`Report persisted: ${id}`);
      } catch (err) {
        console.error('Worker failed to process message:', err.message);
        channel.nack(msg, false, false);
      }
    },
    { noAck: false }
  );

  console.log(`Worker listening on queue: ${QUEUE_NAME}`);
}

module.exports = { startReportWorker };
