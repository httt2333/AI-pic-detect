import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';

export function VerifyEmail({
  appName = 'our app',
  logoUrl,
  url,
}: {
  appName?: string;
  logoUrl?: string;
  url: string;
}) {
  return (
    <Html>
      <Head />
      <Preview>{`Verify your email for ${appName}`}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Section style={styles.card}>
            <Section style={styles.accentBar} />
            {(logoUrl || appName) && (
              <Section style={styles.brandRow}>
                {logoUrl ? (
                  <Img
                    src={logoUrl}
                    width="40"
                    height="40"
                    alt={appName}
                    style={styles.cardLogo}
                  />
                ) : null}
                <Text style={styles.cardBrand}>{appName}</Text>
              </Section>
            )}
            <Heading style={styles.h1}>Verify your email</Heading>
            <Text style={styles.p}>
              Click the button below to verify your email address and finish
              signing in to <strong>{appName}</strong>.
            </Text>

            <Section style={styles.buttonWrap}>
              <Button href={url} style={styles.button}>
                Verify email
              </Button>
            </Section>

            <Text style={styles.muted}>
              This link will expire in <strong>24 hours</strong>.
            </Text>

            <Hr style={styles.hr} />

            <Text style={styles.small}>
              If the button doesn&apos;t work, copy and paste this link into
              your browser:
            </Text>
            <Link href={url} style={styles.link}>
              {url}
            </Link>

            <Text style={styles.footer}>
              If you didn&apos;t request this email, you can safely ignore it.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const styles: Record<string, React.CSSProperties> = {
  body: {
    margin: 0,
    padding: 0,
    backgroundColor: '#f6f9fc',
    fontFamily:
      '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Inter,Helvetica,Arial,sans-serif',
    color: '#0f172a',
  },
  container: {
    maxWidth: 560,
    margin: '0 auto',
    padding: '32px 16px 40px',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: '28px 24px',
    border: '1px solid rgba(15, 23, 42, 0.08)',
    boxShadow:
      '0 20px 50px rgba(2, 6, 23, 0.10), 0 2px 8px rgba(2, 6, 23, 0.05)',
  },
  accentBar: {
    height: 6,
    borderRadius: 999,
    marginBottom: 18,
    background:
      'linear-gradient(90deg, rgba(99,102,241,1) 0%, rgba(236,72,153,1) 55%, rgba(14,165,233,1) 100%)',
  },
  h1: {
    margin: '0 0 10px',
    fontSize: 24,
    lineHeight: '30px',
    fontWeight: 700,
    letterSpacing: '-0.01em',
  },
  brandRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  cardLogo: {
    borderRadius: 10,
    border: '1px solid rgba(15, 23, 42, 0.10)',
    backgroundColor: 'rgba(15, 23, 42, 0.03)',
  },
  cardBrand: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: '18px',
    fontWeight: 600,
    color: '#0f172a',
    letterSpacing: '-0.01em',
  },
  p: {
    margin: '0 0 18px',
    fontSize: 14,
    lineHeight: '22px',
    color: '#334155',
  },
  buttonWrap: {
    textAlign: 'center',
    margin: '18px 0 14px',
  },
  button: {
    backgroundColor: '#111827',
    borderRadius: 12,
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 600,
    textDecoration: 'none',
    padding: '12px 18px',
    display: 'inline-block',
  },
  muted: {
    margin: '0 0 10px',
    fontSize: 12,
    lineHeight: '18px',
    color: '#64748b',
    textAlign: 'center',
  },
  hr: {
    borderColor: 'rgba(15, 23, 42, 0.08)',
    margin: '18px 0',
  },
  small: {
    margin: '0 0 6px',
    fontSize: 12,
    lineHeight: '18px',
    color: '#64748b',
  },
  link: {
    fontSize: 12,
    lineHeight: '18px',
    color: '#2563eb',
    wordBreak: 'break-all',
  },
  footer: {
    margin: '18px 0 0',
    fontSize: 12,
    lineHeight: '18px',
    color: '#94a3b8',
  },
};
