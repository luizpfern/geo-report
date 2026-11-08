const crypto = require('crypto');
const { pool } = require('../config/database');
const { getChannel, QUEUE_NAME } = require('../config/rabbitmq');

async function createReport(req, res) {
  try {
    const { category_code, latitude, longitude, description } = req.body;

    if (!category_code || latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        error: 'Campos obrigatórios: category_code, latitude, longitude',
      });
    }

    const lat = Number(latitude);
    const lon = Number(longitude);

    if (Number.isNaN(lat) || Number.isNaN(lon)) {
      return res.status(400).json({ error: 'latitude e longitude devem ser números' });
    }

    const typeCheck = await pool.query(
      'SELECT code FROM report_types WHERE code = $1',
      [category_code]
    );

    if (typeCheck.rowCount === 0) {
      return res.status(400).json({ error: 'category_code inválido' });
    }

    const reportId = crypto.randomUUID();
    const payload = {
      id: reportId,
      report_type_code: category_code,
      description: description || null,
      latitude: lat,
      longitude: lon,
    };

    const channel = getChannel();
    channel.sendToQueue(QUEUE_NAME, Buffer.from(JSON.stringify(payload)), {
      persistent: true,
    });

    return res.status(202).json({
      message: 'Alerta recebido para processamento',
      report_id: reportId,
    });
  } catch (err) {
    console.error('createReport error:', err.message);
    return res.status(500).json({ error: 'Erro ao enfileirar alerta' });
  }
}

async function listReports(req, res) {
  try {
    const { lat, lon, radiusKm } = req.query;

    if (lat === undefined || lon === undefined) {
      return res.status(400).json({ error: 'Query params obrigatórios: lat, lon' });
    }

    const centerLat = Number(lat);
    const centerLon = Number(lon);
    const radius = Number(radiusKm ?? 100);

    if (Number.isNaN(centerLat) || Number.isNaN(centerLon) || Number.isNaN(radius)) {
      return res.status(400).json({ error: 'lat, lon e radiusKm devem ser números' });
    }

    const result = await pool.query(
      `
      SELECT
        r.id,
        r.report_type_code,
        rt.name AS report_type_name,
        r.description,
        r.latitude,
        r.longitude,
        r.created_at,
        (
          6371 * acos(
            LEAST(1.0, GREATEST(-1.0,
              cos(radians($1)) * cos(radians(r.latitude)) *
              cos(radians(r.longitude) - radians($2)) +
              sin(radians($1)) * sin(radians(r.latitude))
            ))
          )
        ) AS distance_km
      FROM reports r
      JOIN report_types rt ON rt.code = r.report_type_code
      WHERE (
        6371 * acos(
          LEAST(1.0, GREATEST(-1.0,
            cos(radians($1)) * cos(radians(r.latitude)) *
            cos(radians(r.longitude) - radians($2)) +
            sin(radians($1)) * sin(radians(r.latitude))
          ))
        )
      ) <= $3
      ORDER BY distance_km ASC, r.created_at DESC
      `,
      [centerLat, centerLon, radius]
    );

    return res.json(result.rows);
  } catch (err) {
    console.error('listReports error:', err.message);
    return res.status(500).json({ error: 'Erro ao buscar relatos' });
  }
}

module.exports = { createReport, listReports };
