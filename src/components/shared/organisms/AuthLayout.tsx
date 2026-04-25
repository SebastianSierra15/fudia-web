import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { CircleCheckBig } from "lucide-react";

type AuthLayoutProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
};

const highlights = [
  "Registro de comidas por foto, voz o texto",
  "Analisis nutricional rapido con IA",
  "Metricas claras para mejorar tus habitos",
];

export function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto grid min-h-screen w-full max-w-7xl lg:grid-cols-[1.05fr_0.95fr]">
        <section className="hidden border-r border-(--color-border) bg-[radial-gradient(70%_55%_at_50%_0%,rgba(182,240,117,0.16),transparent_70%)] p-10 lg:flex lg:flex-col">
          <div className="relative">
            <Link href="/" title="Volver al inicio" className="inline-flex items-center gap-2">
              <Image
                src="/global/fudia_logo.png"
                alt="Fudia"
                title="Fudia"
                width={40}
                height={40}
                className="h-10 w-10 object-contain"
              />
              <span className="text-3xl font-semibold text-foreground">Fudia</span>
            </Link>
          </div>

          <div className="relative space-y-7">
            <h2 className="max-w-xl text-5xl leading-tight font-semibold text-foreground">
              Tu nutricionista personal en una sola app.
            </h2>
            <ul className="space-y-3">
              {highlights.map((item) => (
                <li key={item} className="flex items-center gap-3 text-lg text-(--color-muted)">
                  <CircleCheckBig size={18} className="text-(--color-accent)" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative mt-auto pt-12">
            <div className="relative aspect-[16/9] overflow-hidden rounded-3xl border border-(--color-accent)">
              <Image
                src="/media/card-apron2.webp"
                alt="Preparacion saludable en Fudia"
                title="Preparacion saludable en Fudia"
                fill
                className="object-cover"
                sizes="(max-width: 1280px) 40vw, 36vw"
                priority
              />
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center px-6 py-10 sm:px-8">
          <div className="w-full max-w-md space-y-6">
            <Link
              href="/"
              title="Fudia"
              className="inline-flex items-center gap-3 lg:hidden"
            >
              <Image
                src="/global/fudia_logo.png"
                alt="Fudia"
                title="Fudia"
                width={48}
                height={48}
                className="h-12 w-12 object-contain"
              />
              <span className="text-3xl font-semibold text-foreground">Fudia</span>
            </Link>

            <div className="space-y-2">
              <h1 className="text-4xl font-semibold text-foreground md:text-5xl">{title}</h1>
              <p className="text-base text-(--color-muted) md:text-lg">{subtitle}</p>
            </div>

            <div className="rounded-3xl border border-(--color-border) bg-(--color-surface) p-5 sm:p-6">
              {children}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
