import Image from "next/image";
import { InstagramLogo, XLogo, YouTubeLogo } from "../atoms/SocialBrandLogo";
import { Container } from "../atoms/Container";
import { SocialIconButton } from "../atoms/SocialIconButton";
import { FooterColumn } from "../molecules/FooterColumn";

const columns = [
  {
    title: "Producto",
    links: [{ label: "Precios", href: "/precios" }],
  },
  {
    title: "Compania",
    links: [{ label: "Sobre nosotros", href: "/sobre-nosotros" }],
  },
  {
    title: "Soporte",
    links: [
      { label: "Contacto", href: "#" },
      { label: "Privacidad", href: "/politica-privacidad" },
    ],
  },
];

const legalLinks = [
  { label: "Terminos de uso", href: "#", title: "Terminos de uso" },
  {
    label: "Politica de privacidad",
    href: "/politica-privacidad",
    title: "Politica de privacidad",
  },
  { label: "Cookies", href: "#", title: "Cookies" },
];

export function FooterSection() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-(--color-border) bg-background py-12 md:py-14">
      <Container>
        <div className="grid gap-12 lg:grid-cols-[1.25fr_1.75fr]">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="inline-flex h-11 w-11 items-center justify-center">
                <Image
                  src="/global/fudia_logo.png"
                  alt="Fudia"
                  title="Fudia"
                  width={44}
                  height={44}
                  className="h-11 w-11 object-contain"
                />
              </div>
              <span className="text-4xl font-semibold text-foreground">
                Fudia
              </span>
            </div>

            <p className="max-w-md text-lg leading-8 text-(--color-muted)">
              Tu nutricionista personal con IA, disponible 24/7.
            </p>

            <div className="flex items-center gap-3">
              <SocialIconButton
                icon={<InstagramLogo />}
                label="Instagram"
                href="#"
                title="Instagram"
              />
              <SocialIconButton icon={<XLogo />} label="X" href="#" title="X" />
              <SocialIconButton
                icon={<YouTubeLogo />}
                label="YouTube"
                href="#"
                title="YouTube"
              />
            </div>
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
            {columns.map((column) => (
              <FooterColumn key={column.title} {...column} />
            ))}
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-5 border-t border-(--color-border) pt-6 text-base text-(--color-muted) md:flex-row md:items-center md:justify-between">
          <p>
            {"\u00a9 "}
            {currentYear} Fudia. Todos los derechos reservados.
          </p>
          <div className="flex flex-wrap items-center gap-x-8 gap-y-2">
            {legalLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                title={link.title}
                className="transition-colors hover:text-foreground"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </Container>
    </footer>
  );
}
