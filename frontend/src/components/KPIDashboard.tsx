import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartTooltip,
  ResponsiveContainer,
  FunnelChart,
  Funnel,
  LabelList,
  Cell,
} from "recharts";
import {
  Upload,
  Download,
  FolderOpen,
  Clock,
  Zap,
  TrendingUp,
  Activity,
} from "lucide-react";
import { useStats } from "@/hooks/useProjects";
import { formatTime } from "@/lib/utils";

const KPI_COLORS = ["#8b5cf6", "#a78bfa", "#7c3aed", "#6d28d9"];

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color = "text-primary",
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}) {
  return (
    <div className="flex items-start gap-4 rounded-xl border border-zinc-800 bg-zinc-900 p-5">
      <div className={`rounded-lg bg-zinc-800 p-2.5 ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-sm text-zinc-400">{label}</p>
        {sub && <p className="mt-0.5 text-xs text-zinc-600">{sub}</p>}
      </div>
    </div>
  );
}

export function KPIDashboard() {
  const { data: stats, isLoading } = useStats();

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!stats) return null;

  const toolData = Object.entries(stats.tool_usage).map(([name, count]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    count,
  }));

  const funnelData = [
    { name: "Upload", value: stats.funnel.uploaded, fill: "#8b5cf6" },
    { name: "Édition", value: stats.funnel.edited, fill: "#a78bfa" },
    { name: "Export", value: stats.funnel.exported, fill: "#c4b5fd" },
  ];

  const conversionRate =
    stats.funnel.uploaded > 0
      ? Math.round((stats.funnel.exported / stats.funnel.uploaded) * 100)
      : 0;

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold">Insights & KPIs</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Métriques d'usage en temps réel — mis à jour toutes les 30s
        </p>
      </div>

      {/* KPI Cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={FolderOpen}
          label="Projets créés"
          value={stats.total_projects}
          color="text-violet-400"
        />
        <StatCard
          icon={Download}
          label="Exports totaux"
          value={stats.total_exports}
          color="text-emerald-400"
        />
        <StatCard
          icon={Activity}
          label="Actions tracées"
          value={stats.total_events}
          color="text-blue-400"
        />
        <StatCard
          icon={Clock}
          label="Temps moyen d'édition"
          value={formatTime(stats.avg_editing_time)}
          color="text-orange-400"
        />
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        {/* Tool usage bar chart */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          <div className="mb-4 flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold">Outils les plus utilisés</h3>
          </div>
          {toolData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={toolData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#71717a" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#71717a" }} axisLine={false} tickLine={false} />
                <RechartTooltip
                  cursor={{ fill: "rgba(139, 92, 246, 0.08)" }}
                  contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: 8 }}
                  labelStyle={{ color: "#e4e4e7", fontSize: 12 }}
                  itemStyle={{ color: "#a1a1aa", fontSize: 12 }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={40}>
                  {toolData.map((_, i) => (
                    <Cell key={i} fill={KPI_COLORS[i % KPI_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-48 items-center justify-center text-sm text-zinc-600">
              Pas encore de données
            </div>
          )}
        </div>

        {/* Funnel */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold">Funnel de conversion</h3>
            </div>
            <span className="rounded-full bg-primary/20 px-2 py-0.5 text-xs font-medium text-primary">
              {conversionRate}% converti
            </span>
          </div>

          {funnelData[0].value > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <FunnelChart>
                <RechartTooltip
                  contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: 8 }}
                  labelStyle={{ color: "#e4e4e7", fontSize: 12 }}
                  itemStyle={{ color: "#a1a1aa", fontSize: 12 }}
                />
                <Funnel dataKey="value" data={funnelData} isAnimationActive>
                  <LabelList
                    position="right"
                    fill="#a1a1aa"
                    stroke="none"
                    dataKey="name"
                    style={{ fontSize: 12 }}
                  />
                </Funnel>
              </FunnelChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-48 items-center justify-center text-sm text-zinc-600">
              Uploadez une image pour démarrer
            </div>
          )}
        </div>
      </div>

      {/* Conversion steps detail */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
        <div className="mb-4 flex items-center gap-2">
          <Upload className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Détail du parcours utilisateur</h3>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {funnelData.map((step, i) => (
            <div key={step.name} className="text-center">
              <div
                className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold text-white"
                style={{ backgroundColor: step.fill }}
              >
                {step.value}
              </div>
              <p className="text-sm font-medium">{step.name}</p>
              {i > 0 && funnelData[i - 1].value > 0 && (
                <p className="mt-0.5 text-xs text-zinc-500">
                  {Math.round((step.value / funnelData[i - 1].value) * 100)}% du step précédent
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
