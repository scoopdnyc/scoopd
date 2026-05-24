import { notifyMonitorFlags } from '../../../lib/monitors/notify'

export async function POST(request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const result = await notifyMonitorFlags()
  return Response.json(result)
}
