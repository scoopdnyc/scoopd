export async function POST(request) {
  try {
    const { password } = await request.json()

    if (!process.env.ADMIN_PASSWORD) {
      return Response.json({ error: 'Server misconfigured' }, { status: 500 })
    }

    if (password !== process.env.ADMIN_PASSWORD) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const response = Response.json({ ok: true })
    response.headers.set(
      'Set-Cookie',
      'admin_auth=1; HttpOnly; Secure; SameSite=Strict; Path=/api/admin; Max-Age=28800'
    )
    return response
  } catch {
    return Response.json({ error: 'Server error' }, { status: 500 })
  }
}
