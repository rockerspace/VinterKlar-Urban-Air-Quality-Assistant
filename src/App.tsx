import { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { useVinterKlarState } from './hooks/useVinterKlarState';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { Footer } from './components/Footer';
import { ProfileModal } from './components/ProfileModal';
import { ImpactCalculator } from './components/ImpactCalculator';
import { PlaybookSection } from './components/PlaybookSection';
import { IndoorLabSection } from './components/IndoorLabSection';
import { CommunitySection } from './components/CommunitySection';
import { AdvisorDrawer } from './components/AdvisorDrawer';
import { ErrorBoundary } from './components/ErrorBoundary';

export default function App() {
  const {
    profile,
    airBrief,
    playbook,
    baseline,
    setBaseline,
    activeInterventions,
    completedHabitIds,
    communityHouseholds,
    setCommunityHouseholds,
    impact,
    isFetchingBrief,
    isFetchingPlaybook,
    briefError,
    playbookError,
    fetchGroundedBrief,
    fetchTailoredPlaybook,
    handleApplyProfile,
    handleToggleIntervention,
    handleToggleHabitComplete,
    handleResetCalculator,
  } = useVinterKlarState();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAdvisorOpen, setIsAdvisorOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F9F8] text-[#13221F]">
      <a
        href="#top"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-[#175946] focus:text-white focus:rounded-lg focus:text-xs focus:font-semibold"
      >
        Skip to main content
      </a>

      <Header onOpenProfile={() => setIsProfileOpen(true)} />

      <ErrorBoundary>
        <main id="top" className="flex-1 max-w-[1200px] w-full mx-auto px-6">
          <HeroSection
            profile={profile}
            airBrief={airBrief}
            isFetchingBrief={isFetchingBrief}
            briefError={briefError}
            onRefreshBrief={() => fetchGroundedBrief(profile)}
            onOpenAdvisor={() => setIsAdvisorOpen(true)}
            onOpenProfile={() => setIsProfileOpen(true)}
          />

          <ImpactCalculator
            baseline={baseline}
            onChangeBaseline={setBaseline}
            activeInterventions={activeInterventions}
            onToggleIntervention={handleToggleIntervention}
            onResetDefaults={handleResetCalculator}
            impact={impact}
            cityName={airBrief.city}
          />

          <PlaybookSection
            playbook={playbook}
            isLoading={isFetchingPlaybook}
            error={playbookError}
            onRegenerate={() => fetchTailoredPlaybook(profile, airBrief)}
            completedIds={completedHabitIds}
            onToggleComplete={handleToggleHabitComplete}
          />

          <IndoorLabSection />

          <CommunitySection
            communityHouseholds={communityHouseholds}
            onChangeCommunityHouseholds={setCommunityHouseholds}
            impact={impact}
            airBrief={airBrief}
            activeInterventionsCount={activeInterventions.length}
          />
        </main>
      </ErrorBoundary>

      <Footer
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenAdvisor={() => setIsAdvisorOpen(true)}
      />

      {!isAdvisorOpen && (
        <button
          type="button"
          onClick={() => setIsAdvisorOpen(true)}
          className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-[#175946] hover:bg-[#124738] rounded-full shadow-md transition-colors cursor-pointer print:hidden"
        >
          <MessageSquare className="w-4 h-4" aria-hidden="true" />
          Ask Advisor
        </button>
      )}

      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        profile={profile}
        onApplyProfile={handleApplyProfile}
        isLoading={isFetchingBrief || isFetchingPlaybook}
      />

      <AdvisorDrawer
        isOpen={isAdvisorOpen}
        onClose={() => setIsAdvisorOpen(false)}
        profile={profile}
        airBrief={airBrief}
        impact={impact}
      />
    </div>
  );
}
