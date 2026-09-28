"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

import { Badge, Button, Feedback, Progress } from "@/components/ui";
import { readApiError } from "@/lib/api/client";
import { petAsset } from "@/lib/pet/assets";
import type { PetState } from "@/lib/pet/types";
import { useI18n } from "@/lib/i18n";

type PetFeedback = "fed" | "upgraded" | undefined;

export function PetPanel() {
  const { t } = useI18n();
  const [pet, setPet] = useState<PetState>();
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();
  const [feedback, setFeedback] = useState<PetFeedback>();
  const [imageFailed, setImageFailed] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      const response = await fetch("/api/pet", { cache: "no-store" });
      if (!response.ok) throw new Error((await readApiError(response)).message);
      setPet(await response.json() as PetState);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t("Unable to load your Pet."));
    } finally { setLoading(false); }
  }, [t]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  useEffect(() => {
    if (!feedback) return;
    const timer = window.setTimeout(() => setFeedback(undefined), 1400);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  async function act(action: "feed" | "upgrade") {
    if (pending) return;
    setPending(true);
    setError(undefined);
    try {
      const response = await fetch(`/api/pet/${action}`, { method: "POST" });
      if (!response.ok) throw new Error((await readApiError(response)).message);
      const updated = await response.json() as PetState;
      if (updated.currentLevel !== pet?.currentLevel) setImageFailed(false);
      setPet(updated);
      setFeedback(action === "feed" ? "fed" : "upgraded");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t("Pet action could not be completed."));
    } finally { setPending(false); }
  }

  if (loading) return <div className="h-80 animate-pulse rounded-lg border border-border bg-surface motion-reduce:animate-none" role="status"><span className="sr-only">{t("Loading your Pet...")}</span></div>;
  if (!pet) return <Feedback tone="warning" title={t("Pet unavailable")}><p>{error}</p><Button className="mt-3" size="sm" variant="secondary" onClick={() => void load()}>{t("Try again")}</Button></Feedback>;

  const progress = pet.requiredEnergy > 0 ? Math.min(100, pet.energy / pet.requiredEnergy * 100) : 100;
  const atMaximum = pet.currentLevel >= pet.maximumLevel;

  return (
    <section className="overflow-hidden rounded-lg border border-border bg-surface shadow-card" aria-labelledby="learning-pet-title">
      <div className="grid items-center gap-6 p-5 sm:p-6 md:grid-cols-[15rem_minmax(0,1fr)]">
        <div className={`relative mx-auto flex aspect-square w-full max-w-60 items-center justify-center rounded-full bg-primary-subtle ${feedback === "fed" ? "pet-feed-feedback" : ""} ${feedback === "upgraded" ? "pet-level-feedback" : ""}`}>
          {imageFailed ? <span className="text-4xl font-bold text-primary" aria-label={t("Pet image placeholder for level {{level}}", { level: pet.currentLevel })}>LV{pet.currentLevel}</span> : <Image src={petAsset(pet.currentLevel)} alt={t("{{name}}, Pet level {{level}}", { name: pet.name, level: pet.currentLevel })} width={240} height={240} priority={false} className="h-full w-full object-contain p-3" onError={() => setImageFailed(true)} />}
          {feedback ? <span className="absolute -bottom-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-semibold text-primary shadow-button" role="status">{t(feedback === "fed" ? "+{{energy}} Energy" : "Pet leveled up!", { energy: pet.energyPerFood })}</span> : null}
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2"><Badge variant="info">{t("Level {{level}}", { level: pet.currentLevel })}</Badge>{atMaximum ? <Badge variant="success">{t("Maximum level")}</Badge> : null}</div>
          <h2 id="learning-pet-title" className="mt-3 text-2xl font-semibold tracking-tight text-text">{pet.name}</h2>
          <p className="mt-2 text-sm leading-6 text-text-muted">{pet.description}</p>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Stat label={t("Learning Points")} value={pet.totalLearningPoints} />
            <Stat label={t("Available Food")} value={pet.availableFood} />
            <Stat label={t("Point balance")} value={`${pet.pointBalance}/${pet.pointsPerFood}`} className="col-span-2 sm:col-span-1" />
          </div>

          <div className="mt-5">
            <Progress value={progress} label={atMaximum ? t("Maximum level reached") : t("Energy: {{current}} / {{required}}", { current: pet.energy, required: pet.requiredEnergy })} showValue={!atMaximum} tone={pet.canUpgrade || atMaximum ? "success" : "primary"} />
          </div>

          {error ? <Feedback className="mt-4" tone="error" title={t("Pet action failed")}>{error}</Feedback> : null}
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Button loading={pending} disabled={!pet.canFeed} onClick={() => void act("feed")}>{t("Feed Pet")}</Button>
            <Button variant="secondary" loading={pending} disabled={!pet.canUpgrade} onClick={() => void act("upgrade")}>{t("Upgrade Pet")}</Button>
          </div>
          {!atMaximum && pet.availableFood === 0 ? <p className="mt-3 text-xs text-text-subtle">{t("Complete lessons and pass quizzes to earn Learning Points and Food.")}</p> : null}
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value, className = "" }: { label: string; value: string | number; className?: string }) {
  return <div className={`rounded-md border border-border bg-surface-muted px-3 py-3 ${className}`}><p className="text-xs text-text-subtle">{label}</p><p className="mt-1 text-lg font-semibold tabular-nums text-text">{value}</p></div>;
}
