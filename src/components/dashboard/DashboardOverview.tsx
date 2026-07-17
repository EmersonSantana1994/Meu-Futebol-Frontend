"use client";

import { Alert, Box, Card, CardContent, CircularProgress, Stack, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { ModuleCard } from "@/components/ui/ModuleCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { SimpleTable } from "@/components/ui/SimpleTable";
import { StatCard } from "@/components/ui/StatCard";
import { modules } from "@/config/modules";
import { apiRequest } from "@/lib/api";

type DashboardStat = { label: string; value: string; helper: string };
type Match = {
  id: string;
  stage: string;
  matchNumber?: number | null;
  homeScore?: number | null;
  awayScore?: number | null;
  competition: { name: string };
  homeTeam: { name: string };
  awayTeam: { name: string };
};
type DashboardSummary = {
  stats: DashboardStat[];
  latestMatches: Match[];
};
type TeamRanking = { id: string; points: number; team: { name: string } };

const season = "2025/2026";

export function DashboardOverview() {
  const [summary, setSummary] = useState<DashboardSummary>();
  const [teamRanking, setTeamRanking] = useState<TeamRanking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  async function loadDashboard() {
    setLoading(true);
    setError(undefined);
    try {
      const [loadedSummary, loadedRanking] = await Promise.all([
        apiRequest<DashboardSummary>("/competitions/summary"),
        apiRequest<TeamRanking[]>(`/rankings/team-season?season=${encodeURIComponent(season)}`)
      ]);
      setSummary(loadedSummary);
      setTeamRanking(loadedRanking);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Erro ao carregar dashboard.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const clubRows = teamRanking.slice(0, 4).map((row, index) => ({
    posicao: String(index + 1),
    time: row.team.name,
    pontos: String(row.points)
  }));

  const matchRows =
    summary?.latestMatches.map((match) => ({
      torneio: match.competition.name,
      rodada: match.matchNumber ? `Jogo ${match.matchNumber}` : match.stage,
      mandante: match.homeTeam.name,
      placar:
        match.homeScore == null || match.awayScore == null
          ? "-"
          : `${match.homeScore} x ${match.awayScore}`,
      visitante: match.awayTeam.name
    })) ?? [];

  return (
    <Box>
      <PageHeader
        title="Dashboard"
        description="Visao geral da temporada, atalhos para os modulos e os principais dados do universo Meu Futebol."
      />

      {error ? <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert> : null}

      {loading ? (
        <Stack alignItems="center" spacing={2} sx={{ py: 6 }}>
          <CircularProgress />
          <Typography color="text.secondary">Carregando dados do banco...</Typography>
        </Stack>
      ) : (
        <>
          <Box
            sx={{
              display: "grid",
              gap: 2,
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, 1fr)",
                lg: "repeat(4, 1fr)"
              },
              mb: 3
            }}
          >
            {(summary?.stats ?? []).map((stat) => (
              <StatCard key={stat.label} {...stat} />
            ))}
          </Box>
          <Box
            sx={{
              display: "grid",
              gap: 3,
              gridTemplateColumns: { xs: "1fr", lg: "1.3fr 1fr" },
              mb: 3
            }}
          >
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h3" sx={{ mb: 2 }}>
                  Modulos do sistema
                </Typography>
                <Box
                  sx={{
                    display: "grid",
                    gap: 2,
                    gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" }
                  }}
                >
                  {modules.slice(0, 6).map((module) => (
                    <ModuleCard key={module.href} module={module} />
                  ))}
                </Box>
              </CardContent>
            </Card>
            <Stack spacing={3}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h3" sx={{ mb: 2 }}>
                    Top clubes
                  </Typography>
                  {clubRows.length > 0 ? (
                    <SimpleTable columns={["posicao", "time", "pontos"]} rows={clubRows} />
                  ) : (
                    <Typography color="text.secondary">Nenhum ranking de times registrado.</Typography>
                  )}
                </CardContent>
              </Card>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h3" sx={{ mb: 2 }}>
                    Ultimos jogos
                  </Typography>
                  {matchRows.length > 0 ? (
                    <SimpleTable columns={["torneio", "rodada", "mandante", "placar", "visitante"]} rows={matchRows} />
                  ) : (
                    <Typography color="text.secondary">Nenhuma partida registrada.</Typography>
                  )}
                </CardContent>
              </Card>
            </Stack>
          </Box>
        </>
      )}
    </Box>
  );
}
