"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { Badge, Button, Feedback, LoadingState, Progress } from "@/components/ui";
import { readApiError } from "@/lib/api/client";
import { petAsset } from "@/lib/pet/assets";
import type { PetCollection, PetState } from "@/lib/pet/types";
import { useI18n } from "@/lib/i18n";

type Action = "feed" | "feed-all" | "upgrade";
type UpgradeEffect = { level: number; token: number };

export function PetPanel() {
  const { locale, t } = useI18n();
  const [collection, setCollection] = useState<PetCollection>();
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();
  const [feedback, setFeedback] = useState<string>();
  const [upgradeEffect, setUpgradeEffect] = useState<UpgradeEffect>();
  const effectTimerRef = useRef<number | null>(null);
  const effectSequenceRef = useRef(0);

  const load = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(undefined);
    try {
      let response = await fetch("/api/pet/collection", { cache: "no-store" });
      if (!response.ok) throw new Error((await readApiError(response)).message);
      let data = await response.json() as PetCollection;
      if (!data.activePet && data.completedPets.length === 0 && data.availablePets.length > 0) {
        const initial = await fetch("/api/pet", { cache: "no-store" });
        if (!initial.ok) throw new Error((await readApiError(initial)).message);
        response = await fetch("/api/pet/collection", { cache: "no-store" });
        data = await response.json() as PetCollection;
      }
      setCollection(data);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t("Unable to load your Pet."));
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [t]);

  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer); }, [load]);
  useEffect(() => { if (!feedback) return; const timer = window.setTimeout(() => setFeedback(undefined), 1500); return () => window.clearTimeout(timer); }, [feedback]);
  useEffect(() => () => {
    if (effectTimerRef.current !== null) window.clearTimeout(effectTimerRef.current);
  }, []);

  async function post(path: string, message: string, action?: Action) {
    if (pending) return;
    setPending(true); setError(undefined);
    try {
      const response = await fetch("/api/pet/" + path, { method: "POST" });
      if (!response.ok) throw new Error((await readApiError(response)).message);
      const updated = await response.json() as PetState;
      setFeedback(message);
      if (action) {
        setCollection((current) => current ? { ...current, activePet: updated } : current);
      } else {
        await load(false);
      }
      if (action === "upgrade") {
        effectSequenceRef.current += 1;
        setUpgradeEffect({ level: updated.currentLevel, token: effectSequenceRef.current });
        if (effectTimerRef.current !== null) window.clearTimeout(effectTimerRef.current);
        effectTimerRef.current = window.setTimeout(() => {
          setUpgradeEffect(undefined);
          effectTimerRef.current = null;
          if (updated.completed) void load(false);
        }, 1200);
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t("Pet action could not be completed."));
    } finally { setPending(false); }
  }

  if (loading) return <LoadingState title={t("Loading your Pet...")} description={t("Please wait a moment.")} />;
  if (!collection) return <Feedback tone="warning" title={t("Pet unavailable")}><p>{error}</p><Button className="mt-3" size="sm" variant="secondary" onClick={() => void load()}>{t("Try again")}</Button></Feedback>;
  const pet = collection.activePet;

  return (
    <section className="space-y-6" aria-labelledby="learning-pet-title">
      {pet ? <ActivePet pet={pet} locale={locale} pending={pending} feedback={feedback} upgradeEffect={upgradeEffect} error={error} act={(action) => post(action, action === "upgrade" ? t("Pet leveled up!") : t("Pet was fed."), action)} t={t} /> : (
        <div className="rounded-lg border border-border bg-surface p-6">
          <h2 id="learning-pet-title" className="text-2xl font-semibold text-text">{t("Choose your next Pet")}</h2>
          <p className="mt-2 text-sm text-text-muted">{t("A completed Pet stays in your collection. Your next Pet starts a new progression.")}</p>
          {error ? <Feedback className="mt-4" tone="error" title={t("Pet action failed")}>{error}</Feedback> : null}
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {collection.availablePets.map((item) => <div key={item.id} className="rounded-lg border border-border p-4">
              <p className="font-semibold text-text">{item.name[locale]}</p>
              <p className="mt-1 text-sm text-text-muted">{item.learningMeaning[locale]}</p>
              <Button className="mt-4" size="sm" loading={pending} onClick={() => void post("select/" + item.id, t("New Pet selected."))}>{t("Choose Pet")}</Button>
            </div>)}
          </div>
          {!collection.availablePets.length ? <p className="mt-5 text-sm text-text-muted">{t("No other active Pets are available.")}</p> : null}
        </div>
      )}
      {collection.completedPets.length ? <div>
        <h3 className="text-lg font-semibold text-text">{t("Pet Collection")}</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">{collection.completedPets.map((item) => <div key={item.progressionId} className="rounded-lg border border-border bg-surface p-4"><Badge variant="success">{t("Completed")}</Badge><p className="mt-2 font-semibold text-text">{item.petName[locale]}</p><p className="mt-1 text-sm text-text-muted">{t("Level {{level}}", { level: item.currentLevel })}</p></div>)}</div>
      </div> : null}
    </section>
  );
}

function ActivePet({ pet, locale, pending, feedback, upgradeEffect, error, act, t }: { pet: PetState; locale: "vi" | "en"; pending: boolean; feedback?: string; upgradeEffect?: UpgradeEffect; error?: string; act: (action: Action) => void; t: (key: string, values?: Record<string, string | number>) => string }) {
  const progress = pet.requiredEnergy > 0 ? Math.min(100, pet.energy / pet.requiredEnergy * 100) : 100;
  const levelRatio = pet.maximumLevel > 1 ? pet.currentLevel / pet.maximumLevel : 1;
  const effectIntensity = levelRatio >= 0.75 ? "high" : levelRatio >= 0.45 ? "medium" : "subtle";
  return <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-card">
    <div className="grid items-center gap-6 p-5 sm:p-6 md:grid-cols-[15rem_minmax(0,1fr)]">
      <div key={upgradeEffect?.token ?? pet.currentLevel} className={"relative isolate mx-auto flex aspect-square w-full max-w-60 items-center justify-center rounded-full bg-primary-subtle " + (upgradeEffect ? `pet-level-feedback pet-level-${effectIntensity}` : feedback ? "pet-feed-feedback" : "")}>
        {upgradeEffect ? <span className="pet-upgrade-aura" aria-hidden="true">{Array.from({ length: 8 }, (_, index) => <span className="pet-upgrade-particle" key={index} />)}</span> : null}
        <Image src={petAsset(pet.assetReference)} alt={t("{{name}}, Pet level {{level}}", { name: pet.petName[locale], level: pet.currentLevel })} width={240} height={240} className="relative z-10 h-full w-full object-contain p-3" />
        {feedback ? <span className="absolute -bottom-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-semibold text-primary" role="status">{feedback}</span> : null}
      </div>
      <div className="min-w-0">
        <Badge variant="info">{t("Level {{level}}", { level: pet.currentLevel })} / {pet.maximumLevel}</Badge>
        <h2 id="learning-pet-title" className="mt-3 text-2xl font-semibold text-text">{pet.petName[locale]} · {pet.levelName[locale]}</h2>
        <p className="mt-2 text-sm text-text-muted">{pet.petDescription[locale]}</p>
        <p className="mt-2 text-xs text-text-subtle">{pet.learningMeaning[locale]}</p>
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3"><Stat label={t("Learning Points")} value={pet.totalLearningPoints} /><Stat label={t("Available Food")} value={pet.availableFood} /><Stat label={t("Point balance")} value={pet.pointBalance + "/" + pet.pointsPerFood} /></div>
        <div className="mt-5"><Progress value={progress} label={t("Energy: {{current}} / {{required}}", { current: pet.energy, required: pet.requiredEnergy })} showValue tone={pet.canUpgrade ? "success" : "primary"} /></div>
        {error ? <Feedback className="mt-4" tone="error" title={t("Pet action failed")}>{error}</Feedback> : null}
        <div className="mt-5 flex flex-wrap gap-3">
          <Button className="w-full sm:w-auto" loading={pending} disabled={!pet.canFeed} onClick={() => act("feed")}>{t("Feed Pet")}</Button>
          <Button className="w-full sm:w-auto" variant="secondary" loading={pending} disabled={!pet.canFeed || pet.availableFood < 2} onClick={() => act("feed-all")}>{t("Feed all")}</Button>
          <Button className="w-full sm:w-auto" variant="secondary" loading={pending} disabled={!pet.canUpgrade} onClick={() => act("upgrade")}>{t("Upgrade Pet")}</Button>
        </div>
      </div>
    </div>
  </div>;
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-md border border-border bg-surface-muted px-3 py-3"><p className="text-xs text-text-subtle">{label}</p><p className="mt-1 text-lg font-semibold tabular-nums text-text">{value}</p></div>;
}
