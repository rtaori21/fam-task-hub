import React from 'npm:react@18.3.1'
import { Webhook } from 'https://esm.sh/standardwebhooks@1.0.0'
import { Resend } from 'npm:resend@4.0.0'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { VerificationEmail } from './_templates/verification-email.tsx'

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string)
const hookSecret = Deno.env.get('SEND_EMAIL_HOOK_SECRET') as string

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const payload = await req.text()
    const headers = Object.fromEntries(req.headers)
    
    console.log('📧 Processing email webhook...')
    
    // If webhook secret is configured, verify the webhook
    let webhookData;
    if (hookSecret) {
      const wh = new Webhook(hookSecret)
      webhookData = wh.verify(payload, headers) as {
        user: { email: string }
        email_data: {
          token: string
          token_hash: string
          redirect_to: string
          email_action_type: string
          site_url: string
        }
      }
    } else {
      // For development, parse directly
      webhookData = JSON.parse(payload)
    }

    const { user, email_data } = webhookData
    const { token, token_hash, redirect_to, email_action_type } = email_data

    console.log('📧 Sending verification email to:', user.email)
    console.log('📧 Email action type:', email_action_type)

    // Render the React email template
    const html = await renderAsync(
      React.createElement(VerificationEmail, {
        supabase_url: Deno.env.get('SUPABASE_URL') ?? '',
        token,
        token_hash,
        redirect_to: redirect_to || `${Deno.env.get('SUPABASE_URL')}/auth/callback`,
        email_action_type,
        user_email: user.email,
      })
    )

    // Send email via Resend
    const { data, error } = await resend.emails.send({
      from: 'FamPlan <onboarding@resend.dev>',
      to: [user.email],
      subject: 'Verify your email address for FamPlan',
      html,
    })

    if (error) {
      console.error('❌ Failed to send email:', error)
      throw error
    }

    console.log('✅ Email sent successfully:', data)

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('❌ Error in send-verification-email function:', error)
    return new Response(
      JSON.stringify({
        error: {
          message: error.message,
          code: error.code || 'UNKNOWN_ERROR',
        },
      }),
      {
        status: error.code === 'WEBHOOK_VERIFICATION_ERROR' ? 401 : 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
})