const amqp = require('amqplib');

const QUEUE_NAME = 'reports_queue';

let channel = null;

async function connectRabbitMQ() {
  const url = process.env.RABBITMQ_URL;
  if (!url) {
    throw new Error('RABBITMQ_URL não definido no .env');
  }
  const connection = await amqp.connect(url);
  channel = await connection.createChannel();
  await channel.assertQueue(QUEUE_NAME, { durable: true });

  connection.on('error', (err) => {
    console.error('RabbitMQ connection error:', err.message);
  });

  connection.on('close', () => {
    console.error('RabbitMQ connection closed');
    channel = null;
  });

  console.log(`RabbitMQ connected. Queue: ${QUEUE_NAME}`);
  return channel;
}

function getChannel() {
  if (!channel) {
    throw new Error('RabbitMQ channel not initialized');
  }
  return channel;
}

module.exports = {
  QUEUE_NAME,
  connectRabbitMQ,
  getChannel,
};
