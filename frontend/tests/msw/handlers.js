import { rest } from 'msw';

const API = 'http://localhost:8000';

export const handlers = [
  rest.get(`${API}/live-data`, (req, res, ctx) =>
    res(
      ctx.json({
        timestamp: '2025-01-01T00:00:00Z',
        measurements: { TEMP: 22, HUMID: 45, PM2_5: 9.1 },
        air_quality_rating: { TEMP: { rating: 'GUT', value: 22 } },
        overall_quality: 'GUT'
      })
    )
  ),

  rest.get(`${API}/sessions`, (req, res, ctx) =>
    res(
      ctx.json([
        {
          id: 1,
            name: 'Session A',
            location: 'Lab',
            start_time: '2025-01-01T00:00:00Z',
            end_time: null,
            is_active: true,
            session_type: 'indoor'
        }
      ])
    )
  ),

  rest.post(`${API}/sessions`, async (req, res, ctx) => {
    const body = await req.json();
    return res(
      ctx.status(201),
      ctx.json({
        id: Date.now(),
        name: body.name,
        location: body.location,
        start_time: new Date().toISOString(),
        end_time: null,
        is_active: true,
        session_type: body.session_type
      })
    );
  }),

  rest.put(`${API}/sessions/:id/end`, (req, res, ctx) =>
    res(ctx.json({ message: 'Session ended successfully' }))
  ),

  rest.get(`${API}/sessions/:id/data`, (req, res, ctx) =>
    res(
      ctx.json([
        {
          timestamp: '2025-01-01T00:00:05Z',
          parsed_data: {
            TEMP: 21.5, HUMID: 46, 'PM2.5': 8, 'PM1.0': 3, VOCAQI: 37
          }
        }
      ])
    )
  ),

  rest.get(`${API}/sessions/:id/data/since/:ts`, (req, res, ctx) =>
    res(
      ctx.json([
        {
          timestamp: '2025-01-01T00:00:10Z',
          parsed_data: {
            TEMP: 22.1, HUMID: 47, 'PM2.5': 9, 'PM1.0': 4
          }
        }
      ])
    )
  ),

  rest.get(`${API}/devices/status`, (req, res, ctx) =>
    res(
      ctx.json({
        ventilator: { status: 'off', ip: 'mock' },
        diffusor: { status: 'off', ip: 'mock' }
      })
    )
  ),

  rest.put(`${API}/devices/:dev/control`, async (req, res, ctx) => {
    const body = await req.json();
    return res(
      ctx.json({
        message: `${req.params.dev} ${body.action} executed`,
        status: body.action,
        auto: body.action === 'auto'
      })
    );
  }),

  rest.get(`${API}/air-quality/colors`, (req, res, ctx) =>
    res(
      ctx.json({
        'SEHR GUT': '#00C851',
        'GUT': '#7CB342',
        'MAESSIG': '#FFB300',
        'SCHLECHT': '#FF8A00',
        'SEHR SCHLECHT': '#FF4444'
      })
    )
  )
];
