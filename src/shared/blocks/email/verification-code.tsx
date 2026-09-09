export function VerificationCode({ code }: { code: string }) {
  return (
    <div>
      <h1>Verification Code</h1>
      <p style={{ color: 'red' }}>Your verification code is: {code}</p>
    </div>
  );
}
