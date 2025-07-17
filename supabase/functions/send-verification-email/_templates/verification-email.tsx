import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'

interface VerificationEmailProps {
  supabase_url: string
  email_action_type: string
  redirect_to: string
  token_hash: string
  token: string
  user_email: string
}

export const VerificationEmail = ({
  token,
  supabase_url,
  email_action_type,
  redirect_to,
  token_hash,
  user_email,
}: VerificationEmailProps) => (
  <Html>
    <Head />
    <Preview>Verify your email address for FamPlan</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Welcome to FamPlan! 👨‍👩‍👧‍👦</Heading>
        <Text style={text}>
          Hi there! Thanks for signing up for FamPlan, the family task and calendar management app.
        </Text>
        <Text style={text}>
          To complete your registration and start organizing your family's tasks, please verify your email address by clicking the button below:
        </Text>
        <Link
          href={`${supabase_url}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}`}
          target="_blank"
          style={button}
        >
          Verify Email Address
        </Link>
        <Text style={text}>
          Or, copy and paste this temporary verification code:
        </Text>
        <code style={code}>{token}</code>
        <Text style={text}>
          Once verified, you'll be able to:
        </Text>
        <Text style={list}>
          • Create and manage family tasks<br/>
          • Set up your family calendar<br/>
          • Invite family members to join<br/>
          • Track progress on shared goals
        </Text>
        <Text style={footerText}>
          If you didn't create an account with FamPlan, you can safely ignore this email.
        </Text>
        <Text style={footer}>
          Best regards,<br/>
          The FamPlan Team
        </Text>
      </Container>
    </Body>
  </Html>
)

export default VerificationEmail

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
}

const container = {
  paddingLeft: '20px',
  paddingRight: '20px',
  margin: '0 auto',
  backgroundColor: '#ffffff',
  borderRadius: '8px',
  padding: '40px',
  marginTop: '40px',
  marginBottom: '40px',
  maxWidth: '600px',
}

const h1 = {
  color: '#333',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '0 0 30px',
  textAlign: 'center' as const,
}

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 0',
}

const list = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '28px',
  margin: '16px 0',
  paddingLeft: '20px',
}

const button = {
  backgroundColor: '#5469d4',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '16px 24px',
  margin: '24px 0',
}

const code = {
  display: 'inline-block',
  padding: '16px 20px',
  width: 'calc(100% - 40px)',
  backgroundColor: '#f4f4f4',
  borderRadius: '6px',
  border: '1px solid #eee',
  color: '#333',
  fontSize: '14px',
  fontFamily: 'monospace',
  letterSpacing: '2px',
  textAlign: 'center' as const,
  margin: '16px 0',
}

const footerText = {
  color: '#898989',
  fontSize: '14px',
  lineHeight: '22px',
  marginTop: '24px',
  marginBottom: '16px',
}

const footer = {
  color: '#898989',
  fontSize: '14px',
  lineHeight: '22px',
  marginTop: '12px',
  marginBottom: '24px',
}