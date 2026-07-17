"use client";

import {
  Alert,
  Box,
  Card,
  CardContent,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { apiRequest } from "@/lib/api";

type Competition = {
  id: string;
  name: string;
};

type Team = {
  id: string;
  name: string;
};

type Player = {
  id: string;
  name: string;
  team?: Team | null;
};

type PlayerStat = {
  id: string;
  goals: number;
  assists: number;
  points?: number;
  player: Player;
};

export function SeasonGoalsAssistsRankings() {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [competitionId, setCompetitionId] = useState("");
  const [seasonStats, setSeasonStats] = useState<PlayerStat[]>([]);
  const [season, setSeason] = useState("");
  const [error, setError] = useState<string>();

  const goalRanking = useMemo(() => [...seasonStats].filter((stat) => stat.goals > 0).sort(sortByGoals), [seasonStats]);
  const assistRanking = useMemo(() => [...seasonStats].filter((stat) => stat.assists > 0).sort(sortByAssists), [seasonStats]);

  async function loadCompetitions() {
    setError(undefined);
    try {
      const loaded = await apiRequest<Competition[]>("/rankings/competitions");
      setCompetitions(loaded);
      if (!competitionId && loaded[0]) setCompetitionId(loaded[0].id);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Erro ao carregar campeonatos.");
    }
  }

  async function loadRankings(id = competitionId) {
    if (!id) return;
    setError(undefined);
    try {
      const rankings = await apiRequest<{ seasonStats: PlayerStat[]; season: string }>(`/rankings/players?competitionId=${id}`);
      setSeasonStats(rankings.seasonStats);
      setSeason(rankings.season);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Erro ao carregar rankings.");
    }
  }

  useEffect(() => {
    loadCompetitions();
  }, []);

  useEffect(() => {
    loadRankings();
  }, [competitionId]);

  return (
    <Box>
      <PageHeader
        title="Rankings da temporada"
        description="Artilharia e assistencias globais da temporada, preservadas entre campeonatos."
      />

      <Stack spacing={3}>
        {error ? <Alert severity="error">{error}</Alert> : null}

        <Card variant="outlined">
          <CardContent>
            <FormControl fullWidth>
              <InputLabel>Temporada pelo campeonato</InputLabel>
              <Select
                label="Temporada pelo campeonato"
                value={competitionId}
                onChange={(event) => setCompetitionId(event.target.value)}
              >
                {competitions.map((competition) => (
                  <MenuItem key={competition.id} value={competition.id}>
                    {competition.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </CardContent>
        </Card>

        <Stack direction={{ xs: "column", lg: "row" }} spacing={2}>
          <RankingCard title={`Ranking de gols da temporada ${season}`} stats={goalRanking} metric="goals" />
          <RankingCard title={`Ranking de assistencias da temporada ${season}`} stats={assistRanking} metric="assists" />
        </Stack>
      </Stack>
    </Box>
  );
}

function RankingCard({ title, stats, metric }: { title: string; stats: PlayerStat[]; metric: "goals" | "assists" }) {
  return (
    <Card variant="outlined" sx={{ flex: 1 }}>
      <CardContent>
        <Typography variant="h3" sx={{ mb: 2 }}>
          {title}
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell>Jogador</TableCell>
                <TableCell>Time</TableCell>
                <TableCell>{metric === "goals" ? "Gols" : "Assist."}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {stats.map((stat, index) => (
                <TableRow key={stat.id} hover>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>{stat.player.name}</TableCell>
                  <TableCell>{stat.player.team?.name ?? "-"}</TableCell>
                  <TableCell>{stat[metric]}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
}

function sortByGoals(a: PlayerStat, b: PlayerStat) {
  return b.goals - a.goals || b.assists - a.assists || a.player.name.localeCompare(b.player.name, "pt-BR");
}

function sortByAssists(a: PlayerStat, b: PlayerStat) {
  return b.assists - a.assists || b.goals - a.goals || a.player.name.localeCompare(b.player.name, "pt-BR");
}
