interface FooterProps {
  onOpenProfile: () => void;
  onOpenAdvisor: () => void;
}

export function Footer({ onOpenProfile, onOpenAdvisor }: FooterProps) {
  return (
    <footer className="border-t border-[#D8E2DF] bg-white py-8 mt-8">
      <div className="max-w-[1200px] mx-auto px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-[#4A5C58]">
        <div>
          <span className="font-semibold text-[#13221F]">VinterKlar</span> · Winter Smog &amp;
          Urban Clean-Air Assistant for Families and Communities
        </div>
        <div className="flex items-center gap-5">
          <button
            type="button"
            onClick={onOpenProfile}
            className="hover:text-[#13221F] cursor-pointer"
          >
            Location Settings
          </button>
          <button
            type="button"
            onClick={onOpenAdvisor}
            className="hover:text-[#13221F] cursor-pointer"
          >
            Ask Clean-Air Advisor
          </button>
        </div>
      </div>
    </footer>
  );
}
