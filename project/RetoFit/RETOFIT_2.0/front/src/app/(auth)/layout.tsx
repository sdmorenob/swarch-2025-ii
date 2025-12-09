import { Logo } from '@/components/icons';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Image from 'next/image';
import Link from 'next/link';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authBg = PlaceHolderImages.find((img) => img.id === 'auth-background');

  return (
    <div className="grid min-h-screen grid-cols-1 bg-background lg:grid-cols-2">
      <div className="h-full">
        {children}
      </div>
      <div className="relative hidden items-center justify-center bg-muted text-white lg:flex">
        <div className="absolute inset-0 z-0">
          {authBg && (
            <Image
              src={authBg.imageUrl}
              alt={authBg.description}
              fill
              className="object-cover"
              data-ai-hint={authBg.imageHint}
            />
          )}
          <div className="absolute inset-0 bg-zinc-900/60" />
        </div>
        <div className="relative z-10 flex flex-col items-center text-center">
          <Link href="/" className="mb-4 flex items-center gap-2">
            <Logo className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold tracking-tight text-white">
              Reto-Fit
            </span>
          </Link>
          <h1 className="text-4xl font-bold">Push Your Limits</h1>
          <p className="mt-2 max-w-sm text-lg text-muted-foreground">
            Join thousands of others in exclusive fitness challenges.
          </p>
        </div>
      </div>
    </div>
  );
}
