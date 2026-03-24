"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { DIETARY_SLUGS, DietarySlug, parseDietary, serializeDietary } from "@/lib/dietary";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Attendee {
  id: string;
  name: string;
  isPlusOne: boolean;
  attending: boolean | null;
  dietaryRestrictions: string | null;
}

interface Invitation {
  id: string;
  allowPlusOne: boolean;
  attendees: Attendee[];
}

interface Props {
  invitation: Invitation;
  rsvpLocked: boolean;
}

// ── Per-attendee state ────────────────────────────────────────────────────────

interface AttendeeState {
  attending: boolean | null;
  dietary: DietarySlug[];
  otherDietary: string;
}

function initAttendeeState(attendee: Attendee): AttendeeState {
  const { slugs, other } = parseDietary(attendee.dietaryRestrictions);
  return { attending: attendee.attending, dietary: slugs, otherDietary: other };
}

// ── Sub-component: dietary picker ─────────────────────────────────────────────

function DietaryPicker({
  dietary,
  otherDietary,
  onChange,
}: {
  dietary: DietarySlug[];
  otherDietary: string;
  onChange: (dietary: DietarySlug[], other: string) => void;
}) {
  const t = useTranslations("rsvpForm");

  function toggle(slug: DietarySlug) {
    const next = dietary.includes(slug)
      ? dietary.filter((d) => d !== slug)
      : [...dietary, slug];
    onChange(next, otherDietary);
  }

  const options: { slug: DietarySlug; label: string }[] = [
    { slug: "vegan", label: t("dietaryOptions.vegan") },
    { slug: "gluten-free", label: t("dietaryOptions.glutenFree") },
    { slug: "nuts", label: t("dietaryOptions.nuts") },
  ];

  return (
    <div className="space-y-3 pt-3 border-t border-border">
      <p className="text-sm text-muted-foreground">{t("dietaryNote")}</p>
      <div className="flex flex-wrap gap-2">
        {options.map(({ slug, label }) => (
          <button
            key={slug}
            type="button"
            onClick={() => toggle(slug)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs transition-colors",
              dietary.includes(slug)
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
            )}
          >
            {label}
          </button>
        ))}
      </div>
      <Input
        placeholder={t("otherDietary")}
        value={otherDietary}
        onChange={(e) => onChange(dietary, e.target.value)}
        className="text-sm"
        maxLength={500}
      />
    </div>
  );
}

// ── Sub-component: attendee row ───────────────────────────────────────────────

function AttendeeRow({
  name,
  state,
  onChange,
  nameInput,
}: {
  name?: string;
  state: AttendeeState;
  onChange: (state: AttendeeState) => void;
  nameInput?: React.ReactNode;
}) {
  const t = useTranslations("rsvpForm");

  return (
    <div className="space-y-4 rounded-lg border border-border p-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {nameInput ?? <p className="font-medium">{name}</p>}
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant={state.attending === true ? "default" : "outline"}
            onClick={() => onChange({ ...state, attending: true })}
          >
            {t("attending")}
          </Button>
          <Button
            type="button"
            size="sm"
            variant={state.attending === false ? "default" : "outline"}
            onClick={() => onChange({ ...state, attending: false })}
          >
            {t("notAttending")}
          </Button>
        </div>
      </div>
      {state.attending === true && (
        <DietaryPicker
          dietary={state.dietary}
          otherDietary={state.otherDietary}
          onChange={(dietary, otherDietary) => onChange({ ...state, dietary, otherDietary })}
        />
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function RsvpForm({ invitation, rsvpLocked }: Props) {
  const t = useTranslations("rsvpForm");

  const preRegistered = invitation.attendees.filter((a) => !a.isPlusOne);
  const existingPlusOne = invitation.attendees.find((a) => a.isPlusOne);

  const [states, setStates] = useState<Record<string, AttendeeState>>(() =>
    Object.fromEntries(preRegistered.map((a) => [a.id, initAttendeeState(a)]))
  );

  const [plusOne, setPlusOne] = useState(() => {
    if (existingPlusOne) {
      const { slugs, other } = parseDietary(existingPlusOne.dietaryRestrictions);
      return {
        enabled: true,
        name: existingPlusOne.name,
        state: { attending: existingPlusOne.attending, dietary: slugs, otherDietary: other } as AttendeeState,
      };
    }
    return {
      enabled: false,
      name: "",
      state: { attending: true, dietary: [] as DietarySlug[], otherDietary: "" } as AttendeeState,
    };
  });

  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [nameError, setNameError] = useState(false);
  const [editing, setEditing] = useState(false);

  const alreadySubmitted = invitation.attendees.some((a) => a.attending !== null);
  const showSuccess = !editing && (status === "success" || alreadySubmitted);

  if (rsvpLocked && !showSuccess) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          {t("locked")}
        </CardContent>
      </Card>
    );
  }

  if (showSuccess) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("successTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-muted-foreground text-sm">{t("successBody")}</p>
          <ul className="space-y-1 text-sm">
            {preRegistered.map((a) => {
              const s = states[a.id];
              return (
                <li key={a.id} className="flex justify-between">
                  <span>{a.name}</span>
                  <span className={cn(s.attending ? "text-foreground" : "text-muted-foreground")}>
                    {s.attending ? "✓" : "✗"}
                  </span>
                </li>
              );
            })}
            {plusOne.enabled && (
              <li className="flex justify-between">
                <span>{plusOne.name}</span>
                <span className={cn(plusOne.state.attending ? "text-foreground" : "text-muted-foreground")}>
                  {plusOne.state.attending ? "✓" : "✗"}
                </span>
              </li>
            )}
          </ul>
          {!rsvpLocked && (
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
              {t("update")}
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (plusOne.enabled && !plusOne.name.trim()) {
      setNameError(true);
      return;
    }
    setNameError(false);
    setStatus("submitting");

    const body = {
      attendees: preRegistered.map((a) => ({
        id: a.id,
        attending: states[a.id].attending ?? false,
        dietaryRestrictions: serializeDietary(states[a.id].dietary, states[a.id].otherDietary),
      })),
      plusOne: plusOne.enabled
        ? {
            name: plusOne.name.trim(),
            attending: plusOne.state.attending ?? true,
            dietaryRestrictions: serializeDietary(plusOne.state.dietary, plusOne.state.otherDietary),
          }
        : null,
    };

    try {
      const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        setStatus("error");
        return;
      }

      setStatus("success");
      setEditing(false);
    } catch {
      setStatus("error");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {preRegistered.map((a) => (
        <AttendeeRow
          key={a.id}
          name={a.name}
          state={states[a.id]}
          onChange={(s) => setStates((prev) => ({ ...prev, [a.id]: s }))}
        />
      ))}

      {invitation.allowPlusOne && (
        <>
          {!plusOne.enabled ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => setPlusOne((p) => ({ ...p, enabled: true }))}
            >
              {t("addPlusOne")}
            </Button>
          ) : (
            <AttendeeRow
              state={plusOne.state}
              onChange={(s) => setPlusOne((p) => ({ ...p, state: s }))}
              nameInput={
                <div className="flex-1 min-w-0 space-y-1">
                  <Input
                    placeholder={t("plusOneName")}
                    value={plusOne.name}
                    onChange={(e) => {
                      setPlusOne((p) => ({ ...p, name: e.target.value }));
                      setNameError(false);
                    }}
                    aria-invalid={nameError}
                    className="text-sm"
                    maxLength={100}
                  />
                  {nameError && (
                    <p className="text-xs text-destructive">{t("nameRequired")}</p>
                  )}
                  <button
                    type="button"
                    onClick={() => setPlusOne((p) => ({ ...p, enabled: false, name: "", state: { attending: true, dietary: [], otherDietary: "" } }))}
                    className="text-xs text-muted-foreground underline underline-offset-2"
                  >
                    {t("removePlusOne")}
                  </button>
                </div>
              }
            />
          )}
        </>
      )}

      {status === "error" && (
        <p className="text-sm text-destructive">{t("error")}</p>
      )}

      <Button type="submit" disabled={status === "submitting"} className="w-full sm:w-auto">
        {t("submit")}
      </Button>
    </form>
  );
}
