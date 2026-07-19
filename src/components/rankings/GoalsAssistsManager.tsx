"use client";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
  TextField,
  Typography
} from "@mui/material";
import CleaningServicesIcon from "@mui/icons-material/CleaningServices";
import SearchIcon from "@mui/icons-material/Search";
import SportsSoccerIcon from "@mui/icons-material/SportsSoccer";
import HandshakeIcon from "@mui/icons-material/Handshake";
import { KeyboardEvent, useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { apiRequest } from "@/lib/api";

type Competition = {
  id: string;
  name: string;
  season?: string | null;
};

type Team = {
  id: string;
  name: string;
};

type Player = {
  id: string;
  name: string;
  teamId?: string | null;
  team?: Team | null;
};

type ScoreboardEntry = {
  id: string;
  goals: number;
  team: Team;
};

type PlayerStat = {
  id: string;
  goals: number;
  assists: number;
  points?: number;
  player: Player;
};

type DestructiveConfirmation = {
  title: string;
  description: string;
  confirmLabel: string;
  action: () => Promise<void>;
};

export function GoalsAssistsManager() {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [competitionId, setCompetitionId] = useState("");
  const [playerId, setPlayerId] = useState("");
  const [playerQuery, setPlayerQuery] = useState("");
  const [teamQuery, setTeamQuery] = useState("");
  const [searchedTeamId, setSearchedTeamId] = useState("");
  const [scoreboard, setScoreboard] = useState<ScoreboardEntry[]>([]);
  const [competitionStats, setCompetitionStats] = useState<PlayerStat[]>([]);
  const [seasonStats, setSeasonStats] = useState<PlayerStat[]>([]);
  const [season, setSeason] = useState("");
  const [message, setMessage] = useState<string>();
  const [error, setError] = useState<string>();
  const [scoreboardPromptCompetitionId, setScoreboardPromptCompetitionId] = useState("");
  const [scoreboardPromptOpen, setScoreboardPromptOpen] = useState(false);
  const [destructiveConfirmation, setDestructiveConfirmation] = useState<DestructiveConfirmation>();

  const selectedCompetition = useMemo(
    () => competitions.find((competition) => competition.id === competitionId),
    [competitions, competitionId]
  );
  const selectedPlayer = useMemo(() => players.find((player) => player.id === playerId), [players, playerId]);
  const actionPlayer = selectedPlayer;
  const teams = useMemo(() => {
    const grouped = new Map<string, Team>();
    for (const player of players) {
      if (player.teamId && player.team) grouped.set(player.teamId, player.team);
    }
    return [...grouped.values()].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  }, [players]);
  const filteredTeams = useMemo(() => {
    const query = normalize(teamQuery);
    return teams.filter((team) => !query || normalize(team.name).includes(query)).slice(0, 8);
  }, [teams, teamQuery]);
  const searchedTeam = useMemo(() => teams.find((team) => team.id === searchedTeamId), [teams, searchedTeamId]);
  const searchedTeamPlayers = useMemo(
    () => players.filter((player) => player.teamId === searchedTeamId).sort((a, b) => a.name.localeCompare(b.name, "pt-BR")),
    [players, searchedTeamId]
  );
  const goalRanking = useMemo(
    () => [...competitionStats].filter((stat) => stat.goals > 0).sort(sortByGoals),
    [competitionStats]
  );
  const assistRanking = useMemo(
    () => [...competitionStats].filter((stat) => stat.assists > 0).sort(sortByAssists),
    [competitionStats]
  );

  async function loadBaseData() {
    setError(undefined);
    try {
      const [loadedCompetitions, loadedPlayers] = await Promise.all([
        apiRequest<Competition[]>("/rankings/competitions"),
        apiRequest<Player[]>("/registrations/players")
      ]);
      const activePlayers = loadedPlayers.filter((player) => player.teamId);
      setCompetitions(loadedCompetitions);
      setPlayers(activePlayers);
      if (!competitionId && loadedCompetitions[0]) setCompetitionId(loadedCompetitions[0].id);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Erro ao carregar dados.");
    }
  }

  async function loadRankingData(id = competitionId) {
    if (!id) return;
    setError(undefined);
    try {
      const [loadedScoreboard, rankings] = await Promise.all([
        apiRequest<ScoreboardEntry[]>(`/rankings/scoreboard?competitionId=${id}`),
        apiRequest<{ competitionStats: PlayerStat[]; seasonStats: PlayerStat[]; season: string }>(
          `/rankings/players?competitionId=${id}`
        )
      ]);
      setScoreboard(loadedScoreboard);
      setCompetitionStats(rankings.competitionStats);
      setSeasonStats(rankings.seasonStats);
      setSeason(rankings.season);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Erro ao carregar rankings.");
    }
  }

  useEffect(() => {
    loadBaseData();
  }, []);

  useEffect(() => {
    loadRankingData();
  }, [competitionId]);

  useEffect(() => {
    if (competitionId && scoreboard.length > 0 && scoreboardPromptCompetitionId !== competitionId) {
      setScoreboardPromptCompetitionId(competitionId);
      setScoreboardPromptOpen(true);
    }
  }, [competitionId, scoreboard.length, scoreboardPromptCompetitionId]);

  async function registerGoal(targetPlayerId = playerId) {
    if (!competitionId || !targetPlayerId) return;
    await runAction(async () => {
      await apiRequest("/rankings/goals", {
        method: "POST",
        body: JSON.stringify({ competitionId, playerId: targetPlayerId })
      });
      setMessage("Gol registrado e placar atualizado.");
    });
  }

  async function registerAssist(targetPlayerId = playerId) {
    if (!competitionId || !targetPlayerId) return;
    await runAction(async () => {
      await apiRequest("/rankings/assists", {
        method: "POST",
        body: JSON.stringify({ competitionId, playerId: targetPlayerId })
      });
      setMessage("Assistencia registrada.");
    });
  }

  async function removeGoal(targetPlayerId = playerId) {
    if (!competitionId || !targetPlayerId) return;
    await runAction(async () => {
      await apiRequest("/rankings/goals/remove", {
        method: "POST",
        body: JSON.stringify({ competitionId, playerId: targetPlayerId })
      });
      setMessage("Gol removido do torneio, da temporada e do placar.");
    });
  }

  async function removeAssist(targetPlayerId = playerId) {
    if (!competitionId || !targetPlayerId) return;
    await runAction(async () => {
      await apiRequest("/rankings/assists/remove", {
        method: "POST",
        body: JSON.stringify({ competitionId, playerId: targetPlayerId })
      });
      setMessage("Assistencia removida do torneio e da temporada.");
    });
  }

  async function clearScoreboard() {
    await runAction(async () => {
      await apiRequest("/rankings/scoreboard/clear", {
        method: "POST",
        body: JSON.stringify({ competitionId })
      });
      setScoreboardPromptOpen(false);
      setMessage("Placar limpo.");
    });
  }

  async function clearCompetitionStats() {
    await runAction(async () => {
      await apiRequest("/rankings/competition-stats/clear", {
        method: "POST",
        body: JSON.stringify({ competitionId })
      });
      setMessage("Artilharia e assistencias do campeonato foram limpas. O ranking mundial da temporada foi preservado.");
    });
  }

  function requestRemoveGoal(targetPlayerId?: string) {
    const player = players.find((item) => item.id === targetPlayerId);
    if (!player) return;
    setDestructiveConfirmation({
      title: "Remover gol?",
      description: `Tem certeza de que deseja remover um gol de ${player.name}?`,
      confirmLabel: "Sim, remover gol",
      action: () => removeGoal(player.id)
    });
  }

  function requestRemoveAssist(targetPlayerId?: string) {
    const player = players.find((item) => item.id === targetPlayerId);
    if (!player) return;
    setDestructiveConfirmation({
      title: "Remover assistencia?",
      description: `Tem certeza de que deseja remover uma assistencia de ${player.name}?`,
      confirmLabel: "Sim, remover assistencia",
      action: () => removeAssist(player.id)
    });
  }

  function requestClearScoreboard() {
    setDestructiveConfirmation({
      title: "Limpar placar?",
      description: "Tem certeza de que deseja apagar todo o placar eletronico deste campeonato?",
      confirmLabel: "Sim, limpar placar",
      action: clearScoreboard
    });
  }

  function requestClearCompetitionStats() {
    setDestructiveConfirmation({
      title: "Limpar gols e assistencias?",
      description:
        "Tem certeza de que deseja apagar toda a artilharia e todas as assistencias deste campeonato? Esta acao nao pode ser desfeita.",
      confirmLabel: "Sim, limpar gols e assistencias",
      action: clearCompetitionStats
    });
  }

  async function confirmDestructiveAction() {
    const confirmation = destructiveConfirmation;
    if (!confirmation) return;
    setDestructiveConfirmation(undefined);
    await confirmation.action();
  }

  async function runAction(action: () => Promise<void>) {
    setError(undefined);
    setMessage(undefined);
    try {
      await action();
      await loadRankingData();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Erro ao salvar.");
    }
  }

  function searchTeam() {
    const team = filteredTeams[0];
    if (!team) {
      setSearchedTeamId("");
      setError("Nenhum time encontrado com este nome.");
      return;
    }
    setSearchedTeamId(team.id);
    setError(undefined);
  }

  function handlePlayerShortcut(event: KeyboardEvent<HTMLInputElement>) {
    const exactPlayer = players.find(
      (player) => normalizeExactPlayerName(player.name) === normalizeExactPlayerName(playerQuery)
    );

    if (event.key === "Enter") {
      event.preventDefault();
      if (!exactPlayer) {
        setPlayerId("");
        setError("Este jogador nao existe.");
        return;
      }
      setPlayerId(exactPlayer.id);
      void registerGoal(exactPlayer.id);
    }
    if (event.key === "+" || event.code === "NumpadAdd") {
      event.preventDefault();
      if (!exactPlayer) {
        setPlayerId("");
        setError("Este jogador nao existe.");
        return;
      }
      setPlayerId(exactPlayer.id);
      void registerAssist(exactPlayer.id);
    }
  }

  return (
    <Box>
      <PageHeader
        title="Gols e assistencias"
        description="Lancamento rapido de gols e assistencias, placar eletronico e rankings do torneio."
      />

      <Stack spacing={2}>
        {message ? <Alert severity="success">{message}</Alert> : null}
        {error ? <Alert severity="error">{error}</Alert> : null}

        <Card variant="outlined">
          <CardContent sx={{ py: 2, "&:last-child": { pb: 2 } }}>
            <Stack spacing={1.5}>
              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <FormControl fullWidth>
                  <InputLabel>Campeonato</InputLabel>
                  <Select label="Campeonato" value={competitionId} onChange={(event) => setCompetitionId(event.target.value)}>
                    {competitions.map((competition) => (
                      <MenuItem key={competition.id} value={competition.id}>
                        {competition.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  fullWidth
                  label="Pesquisar jogador"
                  value={playerQuery}
                  onChange={(event) => {
                    const value = event.target.value;
                    const exactPlayer = players.find(
                      (player) => normalizeExactPlayerName(player.name) === normalizeExactPlayerName(value)
                    );
                    setPlayerQuery(value);
                    setPlayerId(exactPlayer?.id ?? "");
                  }}
                  onKeyDown={handlePlayerShortcut}
                />
              </Stack>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                <Button
                  variant="contained"
                  startIcon={<SportsSoccerIcon />}
                  onClick={() => registerGoal(actionPlayer?.id)}
                  disabled={!competitionId || !actionPlayer}
                >
                  Registrar gol
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<HandshakeIcon />}
                  onClick={() => registerAssist(actionPlayer?.id)}
                  disabled={!competitionId || !actionPlayer}
                >
                  Registrar assistencia
                </Button>
                <Button color="error" variant="outlined" onClick={() => requestRemoveGoal(actionPlayer?.id)} disabled={!competitionId || !actionPlayer}>
                  Remover gol
                </Button>
                <Button color="error" variant="outlined" onClick={() => requestRemoveAssist(actionPlayer?.id)} disabled={!competitionId || !actionPlayer}>
                  Remover assist.
                </Button>
                <Button color="warning" variant="outlined" startIcon={<CleaningServicesIcon />} onClick={requestClearScoreboard} disabled={!competitionId}>
                  Limpar placar
                </Button>
                <Button color="error" variant="outlined" onClick={requestClearCompetitionStats} disabled={!competitionId}>
                  Limpar artilharia/assist. do campeonato
                </Button>
              </Stack>

              <Typography color="text.secondary" variant="body2">
                Selecionado: {actionPlayer ? `${actionPlayer.name} - ${actionPlayer.team?.name ?? "-"}` : "nenhum jogador"}.
              </Typography>
            </Stack>
          </CardContent>
        </Card>

        <Stack direction={{ xs: "column", lg: "row" }} spacing={2}>
          <Card variant="outlined" sx={{ flex: 1 }}>
            <CardContent>
              <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={1.5} sx={{ mb: 2 }}>
                <Typography variant="h3">Placar eletronico</Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Chip label={selectedCompetition?.name ?? "Sem campeonato"} color="primary" variant="outlined" />
                  <Button
                    color="warning"
                    size="small"
                    variant="outlined"
                    startIcon={<CleaningServicesIcon />}
                    onClick={requestClearScoreboard}
                    disabled={!competitionId || scoreboard.length === 0}
                  >
                    Limpar placar
                  </Button>
                </Stack>
              </Stack>
              <Stack direction="row" spacing={2} useFlexGap flexWrap="wrap">
                {scoreboard.length === 0 ? (
                  <Typography color="text.secondary">Nenhum gol registrado no placar atual.</Typography>
                ) : (
                  scoreboard.map((entry) => (
                    <Box
                      key={entry.id}
                      sx={{
                        border: "1px solid",
                        borderColor: "divider",
                        borderRadius: 1,
                        minWidth: 160,
                        px: 2,
                        py: 1.5
                      }}
                    >
                      <Typography fontWeight={800}>{entry.team.name}</Typography>
                      <Typography variant="h2">{entry.goals}</Typography>
                    </Box>
                  ))
                )}
              </Stack>
            </CardContent>
          </Card>

          <Card variant="outlined" sx={{ flex: 1 }}>
            <CardContent>
              <Typography variant="h3" sx={{ mb: 2 }}>
                Buscar jogadores por time
              </Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                <TextField
                  fullWidth
                  label="Nome do time"
                  value={teamQuery}
                  onChange={(event) => setTeamQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      searchTeam();
                    }
                  }}
                />
                <Button variant="outlined" startIcon={<SearchIcon />} onClick={searchTeam} sx={{ minWidth: 130 }}>
                  Pesquisar
                </Button>
              </Stack>
              <Divider sx={{ my: 2 }} />
              {searchedTeam ? (
                <Stack spacing={1}>
                  <Typography fontWeight={800}>{searchedTeam.name}</Typography>
                  {searchedTeamPlayers.map((player) => (
                    <Typography key={player.id} color="text.secondary">
                      {player.name}
                    </Typography>
                  ))}
                </Stack>
              ) : (
                <Typography color="text.secondary">Pesquise um time para ver o elenco.</Typography>
              )}
            </CardContent>
          </Card>
        </Stack>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <TournamentTotalCard
            label="Gols totais do torneio"
            value={competitionStats.reduce((total, stat) => total + stat.goals, 0)}
          />
          <TournamentTotalCard
            label="Assistências totais do torneio"
            value={competitionStats.reduce((total, stat) => total + stat.assists, 0)}
          />
        </Stack>

        <Stack direction={{ xs: "column", lg: "row" }} spacing={2}>
          <RankingCard
            title="Ranking de artilheiros do torneio"
            stats={goalRanking}
            metric="goals"
            onGoal={registerGoal}
            onAssist={registerAssist}
            onRemoveGoal={requestRemoveGoal}
            onRemoveAssist={requestRemoveAssist}
          />
          <RankingCard
            title="Ranking de assistencias do torneio"
            stats={assistRanking}
            metric="assists"
            onGoal={registerGoal}
            onAssist={registerAssist}
            onRemoveGoal={requestRemoveGoal}
            onRemoveAssist={requestRemoveAssist}
          />
        </Stack>
      </Stack>

      <Dialog open={scoreboardPromptOpen} onClose={() => setScoreboardPromptOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Placar em andamento</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary">
            Ja existe um placar salvo para este campeonato. Voce gostaria que o placar da ultima partida fosse apagado?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setScoreboardPromptOpen(false)}>Nao, manter</Button>
          <Button color="warning" variant="contained" onClick={clearScoreboard}>
            Sim, apagar placar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(destructiveConfirmation)}
        onClose={() => setDestructiveConfirmation(undefined)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>{destructiveConfirmation?.title}</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary">{destructiveConfirmation?.description}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDestructiveConfirmation(undefined)}>Cancelar</Button>
          <Button color="error" variant="contained" onClick={confirmDestructiveAction}>
            {destructiveConfirmation?.confirmLabel}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

function TournamentTotalCard({ label, value }: { label: string; value: number }) {
  return (
    <Card variant="outlined" sx={{ flex: 1 }}>
      <CardContent>
        <Typography color="text.secondary" fontWeight={800}>
          {label}
        </Typography>
        <Typography color="primary" fontWeight={900} variant="h2" sx={{ mt: 0.5 }}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
}

function RankingCard({
  title,
  stats,
  metric,
  onGoal,
  onAssist,
  onRemoveGoal,
  onRemoveAssist
}: {
  title: string;
  stats: PlayerStat[];
  metric: "goals" | "assists";
  onGoal: (playerId: string) => Promise<void>;
  onAssist: (playerId: string) => Promise<void>;
  onRemoveGoal: (playerId: string) => void;
  onRemoveAssist: (playerId: string) => void;
}) {
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
                <TableCell>Jogador e acoes</TableCell>
                <TableCell>Time</TableCell>
                <TableCell>{metric === "goals" ? "Gols" : "Assist."}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {stats.map((stat, index) => (
                <TableRow key={stat.id} hover>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>
                    <Stack
                      direction="row"
                      alignItems="center"
                      spacing={1}
                      useFlexGap
                      flexWrap="wrap"
                      sx={{ minWidth: { md: 330 } }}
                    >
                      <Typography component="span" fontWeight={800} sx={{ minWidth: 80 }}>
                        {stat.player.name}
                      </Typography>
                      <Stack direction="row" spacing={0.5} useFlexGap flexWrap="wrap">
                        <Button size="small" variant="contained" onClick={() => void onGoal(stat.player.id)}>
                          Gol
                        </Button>
                        <Button size="small" variant="outlined" onClick={() => void onAssist(stat.player.id)}>
                          Assist.
                        </Button>
                        <Button size="small" color="error" variant="outlined" onClick={() => onRemoveGoal(stat.player.id)}>
                          - Gol
                        </Button>
                        <Button size="small" color="error" variant="outlined" onClick={() => onRemoveAssist(stat.player.id)}>
                          - Assist.
                        </Button>
                      </Stack>
                    </Stack>
                  </TableCell>
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

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

function normalizeExactPlayerName(value: string) {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase("pt-BR");
}

function sortByGoals(a: PlayerStat, b: PlayerStat) {
  return b.goals - a.goals || b.assists - a.assists || a.player.name.localeCompare(b.player.name, "pt-BR");
}

function sortByAssists(a: PlayerStat, b: PlayerStat) {
  return b.assists - a.assists || b.goals - a.goals || a.player.name.localeCompare(b.player.name, "pt-BR");
}
