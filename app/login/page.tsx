import { LoginForm } from "@/components/auth/login-form";

type LoginPageProps = {
  searchParams: Promise<{ next?: string; error?: string; message?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { next, error, message } = await searchParams;

  const initialError =
    error === "auth"
      ? message ??
        "Sign-in link failed. Request a fresh link and open it in the same browser you used to sign in."
      : null;

  return (
    <main className="safe-top safe-bottom flex min-h-dvh items-center justify-center px-4 py-10">
      <LoginForm next={next} initialError={initialError} />
    </main>
  );
}