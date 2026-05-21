import { spawn } from 'child_process'
import path from 'path'

// NOTE: This route spawns a Python subprocess and only works in environments
// where Python 3 + curl_cffi are installed (local dev, self-hosted Node).
// It will not work on Vercel. The canonical execution path is GitHub Actions
// running lib/monitors/doordash.py directly.

export async function GET(request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const scriptPath = path.join(process.cwd(), 'lib', 'monitors', 'doordash.py')

  const result = await new Promise((resolve, reject) => {
    const proc = spawn('python3', [scriptPath], {
      env: {
        ...process.env,
        DD_WEB_TOKEN: process.env.DD_WEB_TOKEN ?? '',
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
        SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
      },
    })

    let stdout = ''
    let stderr = ''
    proc.stdout.on('data', (d) => { stdout += d })
    proc.stderr.on('data', (d) => { stderr += d })

    proc.on('close', (code) => {
      if (stderr) console.error('[doordash-check]', stderr)
      if (code !== 0) {
        reject(new Error(`doordash.py exited ${code}: ${stderr}`))
        return
      }
      try {
        resolve(JSON.parse(stdout))
      } catch {
        reject(new Error(`Invalid JSON from doordash.py: ${stdout}`))
      }
    })

    proc.on('error', reject)
  }).catch((err) => ({ error: err.message }))

  return Response.json(result)
}
