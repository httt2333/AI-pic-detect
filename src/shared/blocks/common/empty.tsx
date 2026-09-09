export function Empty({ message }: { message: string }) {
  return (
    <div className="flex h-[50vh] w-full flex-col items-center justify-center">
      <p>{message}</p>
    </div>
  );
}
