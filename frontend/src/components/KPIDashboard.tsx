import { useStats } from "@/hooks/useProjects";
import { formatTime } from "@/lib/utils";
import { EXPORT_TARGETS } from "@/lib/exportPresets";
import type { Stats } from "@/types";

const ACTION_LABELS: Record<string, string> = {
  upload: "Photo importée",
  text: "Texte ajouté",
  sticker: "Sticker ajouté",
  filter: "Filtre appliqué",
  crop: "Format changé",
  export: "Image exportée",
  save: "Projet enregistré",
  delete: "Projet supprimé",
};

const TOOL_LABELS: Record<string, string> = {
  text: "Texte",
  sticker: "Stickers",
  filter: "Filtres",
  crop: "Format",
};

const percent = (part: number, whole: number) => (whole > 0 ? Math.round((part / whole) * 100) : 0);

const relativeTime = new Intl.RelativeTimeFormat("fr", { numeric: "auto" });
function timeAgo(iso: string) {
  const seconds = Math.round((new Date(iso).getTime() - Date.now()) / 1000);
  const steps: [Intl.RelativeTimeFormatUnit, number][] = [["day", 86400], ["hour", 3600], ["minute", 60]];
  for (const [unit, size] of steps) {
    if (Math.abs(seconds) >= size) return relativeTime.format(Math.round(seconds / size), unit);
  }
  return "à l'instant";
}

function Figures({ stats }: { stats: Stats }) {
  const figures = [
    { value: stats.total_projects, label: "projets enregistrés" },
    { value: stats.total_exports, label: "exports de projets" },
    { value: formatTime(stats.avg_editing_time), label: "d'édition en moyenne par projet" },
    { value: stats.total_events, label: "actions enregistrées" },
  ];
  return (
    <dl className="grid grid-cols-2 border-y border-line sm:grid-cols-4">
      {figures.map(({ value, label }, i) => (
        <div
          key={label}
          className={`px-4 py-5 sm:px-6 ${i % 2 === 1 ? "border-l border-line" : ""} ${i >= 2 ? "border-t border-line sm:border-t-0" : ""} ${i === 2 ? "sm:border-l" : ""}`}
        >
          <dd className="text-3xl font-extrabold tabular-nums tracking-tight sm:text-4xl">{value}</dd>
          <dt className="mt-1 text-sm text-dim">{label}</dt>
        </div>
      ))}
    </dl>
  );
}

function Funnel({ funnel }: { funnel: Stats["funnel"] }) {
  const steps = [
    { label: "Ont importé une photo", value: funnel.uploaded },
    { label: "Puis l'ont retouchée", value: funnel.edited },
    { label: "Puis l'ont exportée", value: funnel.exported },
  ];
  const overall = percent(funnel.exported, funnel.uploaded);

  return (
    <section aria-labelledby="funnel-title">
      <h2 id="funnel-title" className="text-lg font-bold">Parcours des visiteurs</h2>
      {funnel.uploaded > 0 ? (
        <>
          <p className="mt-1 max-w-prose text-sm text-dim">
            <span className="font-semibold text-paper">{overall} %</span> des visiteurs qui importent une photo
            vont jusqu'à l'export. Chaque visiteur n'est compté qu'une fois par étape.
          </p>
          <ol className="mt-6 space-y-4">
            {steps.map((step, i) => (
              <li key={step.label}>
                <div className="mb-1.5 flex items-baseline justify-between gap-4 text-sm">
                  <span>{step.label}</span>
                  <span className="tabular-nums">
                    <span className="font-semibold">{step.value}</span>
                    {i > 0 && (
                      <span className="ml-2 text-dim">{percent(step.value, steps[i - 1].value)} % de l'étape précédente</span>
                    )}
                  </span>
                </div>
                <div className="h-3 overflow-hidden rounded-sm bg-line">
                  <div
                    className={`h-full rounded-sm ${i === steps.length - 1 ? "bg-safelight" : "bg-paper/70"}`}
                    style={{ width: `${percent(step.value, funnel.uploaded)}%` }}
                  />
                </div>
              </li>
            ))}
          </ol>
        </>
      ) : (
        <p className="mt-2 text-sm text-dim">Le parcours apparaîtra après le premier import de photo.</p>
      )}
    </section>
  );
}

const TARGET_LABELS = Object.fromEntries(
  Object.values(EXPORT_TARGETS).map(({ id, label, width, height }) => [id, `${label} (${width}×${height})`])
);

function Breakdown({ id, title, empty, counts, labels }: {
  id: string;
  title: string;
  empty: string;
  counts: Record<string, number>;
  labels: Record<string, string>;
}) {
  const rows = Object.entries(counts).sort(([, a], [, b]) => b - a);
  const max = rows[0]?.[1] ?? 0;
  return (
    <section aria-labelledby={id}>
      <h2 id={id} className="text-lg font-bold">{title}</h2>
      {rows.length ? (
        <ul className="mt-5 space-y-3">
          {rows.map(([key, count]) => (
            <li key={key} className="grid grid-cols-[minmax(5.5rem,auto)_1fr_2.5rem] items-center gap-3 text-sm">
              <span>{labels[key] ?? key}</span>
              <div className="h-2 overflow-hidden rounded-sm bg-line">
                <div className="h-full rounded-sm bg-paper/70" style={{ width: `${percent(count, max)}%` }} />
              </div>
              <span className="text-right tabular-nums text-dim">{count}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-dim">{empty}</p>
      )}
    </section>
  );
}

function RecentActivity({ activity }: { activity: Stats["recent_activity"] }) {
  return (
    <section aria-labelledby="activity-title">
      <h2 id="activity-title" className="text-lg font-bold">Dernières actions</h2>
      {activity.length ? (
        <ul className="mt-4 divide-y divide-line border-y border-line">
          {activity.slice(0, 10).map(({ action, at }, i) => (
            <li key={`${at}-${i}`} className="flex justify-between gap-4 py-2.5 text-sm">
              <span>{ACTION_LABELS[action] ?? action}</span>
              <time dateTime={at} className="shrink-0 text-dim">{timeAgo(at)}</time>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-dim">Aucune action pour l'instant.</p>
      )}
    </section>
  );
}

export function KPIDashboard() {
  const { data: stats, isLoading, isError } = useStats();

  return (
    <div className="flex-1 overflow-y-auto bg-ink">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8">
        <h1 className="text-3xl font-extrabold tracking-tight">Statistiques</h1>
        <p className="mt-1 text-sm text-dim">Usage de PixelCraft, tous visiteurs confondus. Actualisé toutes les 30 secondes.</p>

        {isLoading && <p className="mt-8 text-sm text-dim" role="status">Chargement des statistiques…</p>}
        {isError && <p className="mt-8 text-sm text-dim">Le serveur ne répond pas : les statistiques ne peuvent pas être chargées.</p>}

        {stats && (
          <div className="mt-8 space-y-12">
            <Figures stats={stats} />
            <div className="grid gap-12 lg:grid-cols-[3fr_2fr]">
              <Funnel funnel={stats.funnel} />
              <div className="space-y-10">
                <Breakdown
                  id="tools-title"
                  title="Outils utilisés"
                  empty="Aucun outil utilisé pour l'instant."
                  counts={stats.tool_usage}
                  labels={TOOL_LABELS}
                />
                <Breakdown
                  id="targets-title"
                  title="Exports par destination"
                  empty="Aucun export vers un réseau pour l'instant."
                  counts={stats.exports_by_target ?? {}}
                  labels={TARGET_LABELS}
                />
              </div>
            </div>
            <RecentActivity activity={stats.recent_activity} />
          </div>
        )}
      </div>
    </div>
  );
}
