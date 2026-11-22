import { useEffect, useState } from "react";
import { loadProfile, loadSettings, pruneOldTrails, saveSettings, type Profile, type Settings } from "./lib/store";
import { Onboarding } from "./screens/Onboarding";
import { Trail } from "./screens/Trail";
import { Crowd } from "./screens/Crowd";
import { Vote } from "./screens/Vote";
import { SettingsScreen } from "./screens/Settings";

type Tab = "trail" | "crowd" | "vote" | "settings";

const TABS: { id: Tab; label: string }[] = [
  { id: "trail", label: "동선" },
  { id: "crowd", label: "몰려" },
  { id: "vote", label: "투표" },
  { id: "settings", label: "설정" },
];

export function App() {
  const [profile, setProfile] = useState<Profile | null>(() => loadProfile());
  const [settings, setSettings] = useState<Settings>(() => loadSettings());
  const [tab, setTab] = useState<Tab>("trail");

  useEffect(() => {
    pruneOldTrails();
  }, []);

  const updateSettings = (next: Settings) => {
    setSettings(next);
    saveSettings(next);
  };

  if (!profile) {
    return (
      <div className="app">
        <Onboarding onDone={setProfile} />
      </div>
    );
  }

  return (
    <div className="app">
      {tab === "trail" && <Trail settings={settings} onOpenSettings={() => setTab("settings")} />}
      {tab === "crowd" && <Crowd settings={settings} onOpenSettings={() => setTab("settings")} />}
      {tab === "vote" && <Vote profile={profile} />}
      {tab === "settings" && (
        <SettingsScreen
          profile={profile}
          settings={settings}
          onChange={updateSettings}
          onWipe={() => {
            setProfile(null);
            setSettings(loadSettings());
            setTab("trail");
          }}
        />
      )}
      <nav className="tabs" aria-label="메뉴">
        {TABS.map((t) => (
          <button key={t.id} aria-current={tab === t.id ? "page" : undefined} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
