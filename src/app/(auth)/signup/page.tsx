import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/session'
import { AuthForm } from '@/components/auth-form'
import { signupStep1 } from '@/lib/actions/auth'
import { generateCaptcha } from '@/lib/captcha'

/** Sign up, page 1 of 3: the name and the arithmetic check. */
export default async function SignUpPage() {
  if (await getCurrentUser()) redirect('/library')

  return (
    <div>
      <h1 className="text-2xl">Create your account</h1>
      <p className="mt-1.5 mb-6 text-sm text-muted">Free to start. No card required.</p>
      <AuthForm step="name" action={signupStep1} captcha={generateCaptcha()} />
    </div>
  )
}