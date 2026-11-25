import { MapPin } from 'lucide-react';

interface HeaderProps {
  onOpenProfile: () => void;
}

const NAV_LINKS = [
  { href: '#impact-calculator', label: 'Impact Calculator' },
  { href: '#playbook', label: 'Daily Playbook' },
  { href: '#indoor-air', label: 'Indoor Air Lab' },
  { href: '#community', label: 'Community' },
] as const;

export function Header({ onOpenProfile }: HeaderProps) {
  return (
    <header className="bg-white/95 backdrop-blur-sm border-b border-[#D8E2DF] sticky top-0 z-40">
      <div className="max-w-[1200px] mx-auto px-6 py-3.5 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark */}
        <a
          href="#top"
          className="flex items-center gap-2.5 text-lg font-bold tracking-tight text-[#13221F] whitespace-nowrap shrink-0"
        >
          <img
            src="/src/assets/images/vinterklar_logo_1795009757270.jpg"
            alt="VinterKlar"
            className="w-7 h-7 rounded-md object-cover border border-[#D8E2DF]"
            referrerPolicy="no-referrer"
          />
          <span>VinterKlar</span>
        </a>

        {/* Zone 2: Primary Section Links */}
        <nav
          aria-label="Primary sections"
          className="hidden md:flex items-center gap-6 text-sm font-medium text-[#4A5C58]"
        >
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="hover:text-[#13221F] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Zone 3: Single Primary Action */}
        <div className="shrink-0">
          <button
            type="button"
            onClick={onOpenProfile}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#175946] hover:bg-[#124738] rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
            Update Location
          </button>
        </div>
      </div>

      {/* Accessible compact section jump bar for small viewports */}
      <nav
        aria-label="Section shortcuts"
        className="flex md:hidden items-center gap-4 px-6 py-2 border-t border-[#EDF2F0] overflow-x-auto text-xs font-medium text-[#4A5C58]"
      >
        {NAV_LINKS.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="hover:text-[#13221F] whitespace-nowrap shrink-0"
          >
            {link.label}
          </a>
        ))}
      </nav>
    </header>
  );
}
