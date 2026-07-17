"use client";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  InputLabel,
  ListItemText,
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
import SaveIcon from "@mui/icons-material/Save";
import ShuffleIcon from "@mui/icons-material/Shuffle";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { apiRequest } from "@/lib/api";

type Competition = {
  id: string;
  name: string;
  type: "LEAGUE" | "CUP";
  cupModel?: "SEMIFINALS" | "SIX_TEAMS" | "QUARTERFINALS" | "ROUND_OF_16" | null;
  season?: string | null;
  teams?: { team: Team }[];
};

type Team = {
  id: string;
  name: string;
  badgeUrl?: string | null;
  players?: Player[];
};

type Player = { id: string; name: string };
type TeamRule = { id: string; name: string };
type TitleType = { id: string; name: string };
type Standing = {
  id: string;
  played: number;
  wins: number;
  losses: number;
  goalBalance: number;
  points: number;
  team: Team;
};

type Match = {
  id: string;
  stage: string;
  leg: string;
  matchNumber?: number | null;
  homeScore?: number | null;
  awayScore?: number | null;
  extraHomeScore?: number | null;
  extraAwayScore?: number | null;
  playedAt?: string | null;
  status: string;
  homeTeam: Team;
  awayTeam: Team;
  winnerTeam?: Team | null;
};

type ScoreDraft = {
  homeScore: string;
  awayScore: string;
  extraHomeScore: string;
  extraAwayScore: string;
  winnerTeamId: string;
};

type FinalizationResult = {
  finalization: { tournamentName: string; season: string };
  titleType: TitleType;
  championTeam: Team;
  runnerUpTeam?: Team | null;
  thirdTeam?: Team | null;
  bestPlayers: Player[];
};

export function TournamentManager() {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [competitionId, setCompetitionId] = useState("");
  const [matches, setMatches] = useState<Match[]>([]);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [teamRules, setTeamRules] = useState<TeamRule[]>([]);
  const [titleTypes, setTitleTypes] = useState<TitleType[]>([]);
  const [drafts, setDrafts] = useState<Record<string, ScoreDraft>>({});
  const [message, setMessage] = useState<string>();
  const [error, setError] = useState<string>();
  const [finalTournamentName, setFinalTournamentName] = useState("");
  const [finalTitleTypeId, setFinalTitleTypeId] = useState("");
  const [finalTeamRuleId, setFinalTeamRuleId] = useState("");
  const [championTeamId, setChampionTeamId] = useState("");
  const [runnerUpTeamId, setRunnerUpTeamId] = useState("");
  const [thirdTeamId, setThirdTeamId] = useState("");
  const [bestPlayerIds, setBestPlayerIds] = useState(["", "", ""]);
  const [lastFinalization, setLastFinalization] = useState<FinalizationResult>();
  const [clearConfirmationOpen, setClearConfirmationOpen] = useState(false);
  const [scoreConfirmationMatchId, setScoreConfirmationMatchId] = useState<string>();
  const [finalSummaryOpen, setFinalSummaryOpen] = useState(false);
  const [newCompetitionName, setNewCompetitionName] = useState("");
  const [newCompetitionSeason, setNewCompetitionSeason] = useState("2025/2026");
  const [newCompetitionType, setNewCompetitionType] = useState<Competition["type"]>("LEAGUE");
  const [newCupModel, setNewCupModel] = useState<NonNullable<Competition["cupModel"]>>("SEMIFINALS");
  const [newCompetitionTeamIds, setNewCompetitionTeamIds] = useState<string[]>([]);
  const selectedCompetition = useMemo(
    () => competitions.find((competition) => competition.id === competitionId),
    [competitions, competitionId]
  );
  const isLeagueTournament = selectedCompetition?.type === "LEAGUE";
  const firstTurnMatches = useMemo(
    () => matches.filter((match) => (match.matchNumber ?? 0) <= 6),
    [matches]
  );
  const secondTurnMatches = useMemo(
    () => matches.filter((match) => (match.matchNumber ?? 0) > 6),
    [matches]
  );

  async function loadCompetitions() {
    setError(undefined);
    try {
      const [loaded, loadedTeams, loadedPlayers, loadedRules, loadedTitleTypes] = await Promise.all([
        apiRequest<Competition[]>("/rankings/competitions"),
        apiRequest<Team[]>("/registrations/teams"),
        apiRequest<Player[]>("/registrations/players"),
        apiRequest<TeamRule[]>("/rankings/team-point-rules"),
        apiRequest<TitleType[]>("/rankings/title-types")
      ]);
      setCompetitions(loaded);
      setTeams(loadedTeams);
      setPlayers(loadedPlayers);
      setTeamRules(loadedRules);
      setTitleTypes(loadedTitleTypes);
      if (!competitionId && loaded[0]) setCompetitionId(loaded[0].id);
      if (!finalTeamRuleId && loadedRules[0]) setFinalTeamRuleId(loadedRules[0].id);
      if (!finalTitleTypeId && loadedTitleTypes[0]) setFinalTitleTypeId(loadedTitleTypes[0].id);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Erro ao carregar torneios.");
    }
  }

  async function loadMatches(id = competitionId) {
    if (!id) return;
    setError(undefined);
    try {
      const [loaded, loadedStandings, loadedFinalization] = await Promise.all([
        apiRequest<Match[]>(`/competitions/${id}/matches`),
        apiRequest<Standing[]>(`/competitions/${id}/standings`),
        apiRequest<FinalizationResult | null>(`/competitions/${id}/finalization`)
      ]);
      const officialMatches = loaded.filter((match) => match.homeTeam.id !== match.awayTeam.id);
      setMatches(officialMatches);
      setStandings(loadedStandings);
      setLastFinalization(loadedFinalization ?? undefined);
      const competition = competitions.find((item) => item.id === id);
      if (competition && !finalTournamentName) setFinalTournamentName(competition.name);
      setDrafts(
        Object.fromEntries(
          officialMatches.map((match) => [
            match.id,
            {
              homeScore: match.homeScore?.toString() ?? "",
              awayScore: match.awayScore?.toString() ?? "",
              extraHomeScore: match.extraHomeScore?.toString() ?? "",
              extraAwayScore: match.extraAwayScore?.toString() ?? "",
              winnerTeamId: match.winnerTeam?.id ?? ""
            }
          ])
        )
      );
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Erro ao carregar partidas.");
    }
  }

  useEffect(() => {
    loadCompetitions();
  }, []);

  useEffect(() => {
    loadMatches();
  }, [competitionId]);

  function updateDraft(matchId: string, field: keyof ScoreDraft, value: string) {
    setDrafts((current) => ({
      ...current,
      [matchId]: {
        ...current[matchId],
        [field]: value
      }
    }));
  }

  async function saveScore(match: Match) {
    const draft = drafts[match.id];
    if (!draft || draft.homeScore === "" || draft.awayScore === "") {
      setError("Informe o placar normal antes de salvar.");
      return;
    }

    await runAction(async () => {
      await apiRequest(`/competitions/matches/${match.id}/score`, {
        method: "PATCH",
        body: JSON.stringify({
          homeScore: Number(draft.homeScore),
          awayScore: Number(draft.awayScore),
          extraHomeScore: isLeagueTournament ? null : draft.extraHomeScore ? Number(draft.extraHomeScore) : null,
          extraAwayScore: isLeagueTournament ? null : draft.extraAwayScore ? Number(draft.extraAwayScore) : null,
          winnerTeamId: isLeagueTournament ? null : draft.winnerTeamId || null
        })
      });
      setMessage("Placar da partida atualizado.");
    });
  }

  async function clearMatchScore(matchId: string) {
    await runAction(async () => {
      await apiRequest(`/competitions/matches/${matchId}/clear-score`, {
        method: "POST",
        body: JSON.stringify({})
      });
      setMessage("Placar individual limpo.");
    });
  }

  function requestClearMatchScore(matchId: string) {
    setScoreConfirmationMatchId(matchId);
  }

  async function confirmClearMatchScore() {
    const matchId = scoreConfirmationMatchId;
    if (!matchId) return;
    setScoreConfirmationMatchId(undefined);
    await clearMatchScore(matchId);
  }

  async function clearTournament() {
    setClearConfirmationOpen(false);
    await runAction(async () => {
      await apiRequest(`/competitions/${competitionId}/clear-tournament`, {
        method: "POST",
        body: JSON.stringify({})
      });
      setMatches([]);
      setStandings([]);
      setLastFinalization(undefined);
      setChampionTeamId("");
      setRunnerUpTeamId("");
      setThirdTeamId("");
      setBestPlayerIds(["", "", ""]);
      setMessage("Torneio limpo para iniciar outro. Ranking mundial/temporada preservado.");
    });
  }

  async function generateLeagueFixtures() {
    await runAction(async () => {
      await apiRequest(`/competitions/${competitionId}/generate-league-fixtures`, {
        method: "POST",
        body: JSON.stringify({})
      });
      setMessage("Jogos do campeonato sorteados.");
    });
  }

  async function finalizeTournament() {
    await runAction(async () => {
      const result = await apiRequest<FinalizationResult>(`/competitions/${competitionId}/finalize`, {
        method: "POST",
        body: JSON.stringify({
          tournamentName: finalTournamentName,
          titleTypeId: finalTitleTypeId,
          teamRuleId: finalTeamRuleId,
          championTeamId,
          runnerUpTeamId: runnerUpTeamId || null,
          thirdTeamId: thirdTeamId || null,
          bestPlayerIds: bestPlayerIds.filter(Boolean)
        })
      });
      setLastFinalization(result);
      setMessage("Torneio finalizado e rankings atualizados.");
    });
  }

  async function createCompetition() {
    setError(undefined);
    setMessage(undefined);
    try {
      const competition = await apiRequest<Competition>("/competitions", {
        method: "POST",
        body: JSON.stringify({
          name: newCompetitionName,
          season: newCompetitionSeason,
          type: newCompetitionType,
          cupModel: newCompetitionType === "CUP" ? newCupModel : null,
          teamIds: newCompetitionTeamIds
        })
      });
      setCompetitionId(competition.id);
      setFinalTournamentName(competition.name);
      setNewCompetitionName("");
      setNewCompetitionTeamIds([]);
      setMessage("Torneio cadastrado.");
      await loadCompetitions();
      await loadMatches(competition.id);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Erro ao salvar.");
    }
  }

  async function runAction(action: () => Promise<void>) {
    setError(undefined);
    setMessage(undefined);
    try {
      await action();
      await loadMatches();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Erro ao salvar.");
    }
  }

  return (
    <Box>
      <PageHeader
        title="Torneios"
        description="Cadastre campeonatos e copas, selecione participantes, gere jogos e finalize torneios."
      />

      <Stack spacing={3}>
        {message ? <Alert severity="success">{message}</Alert> : null}
        {error ? <Alert severity="error">{error}</Alert> : null}

        <Card variant="outlined">
          <CardContent>
            <Stack spacing={2}>
              <Typography variant="h3">Cadastrar torneio</Typography>
              <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
                <TextField
                  label="Nome do campeonato ou copa"
                  value={newCompetitionName}
                  onChange={(event) => setNewCompetitionName(event.target.value)}
                  fullWidth
                />
                <TextField
                  label="Temporada"
                  value={newCompetitionSeason}
                  onChange={(event) => setNewCompetitionSeason(event.target.value)}
                  fullWidth
                />
                <FormControl fullWidth>
                  <InputLabel>Tipo</InputLabel>
                  <Select
                    label="Tipo"
                    value={newCompetitionType}
                    onChange={(event) => setNewCompetitionType(event.target.value as Competition["type"])}
                  >
                    <MenuItem value="LEAGUE">Campeonato</MenuItem>
                    <MenuItem value="CUP">Copa</MenuItem>
                  </Select>
                </FormControl>
                {newCompetitionType === "CUP" ? (
                  <FormControl fullWidth>
                    <InputLabel>Modelo da copa</InputLabel>
                    <Select
                      label="Modelo da copa"
                      value={newCupModel}
                      onChange={(event) => setNewCupModel(event.target.value as NonNullable<Competition["cupModel"]>)}
                    >
                      <MenuItem value="SEMIFINALS">4 times</MenuItem>
                      <MenuItem value="SIX_TEAMS">6 times</MenuItem>
                      <MenuItem value="QUARTERFINALS">8 times</MenuItem>
                      <MenuItem value="ROUND_OF_16">16 times</MenuItem>
                    </Select>
                  </FormControl>
                ) : null}
              </Stack>

              <FormControl fullWidth>
                <InputLabel>Times participantes</InputLabel>
                <Select
                  multiple
                  label="Times participantes"
                  value={newCompetitionTeamIds}
                  renderValue={(selected) =>
                    teams
                      .filter((team) => selected.includes(team.id))
                      .map((team) => team.name)
                      .join(", ")
                  }
                  onChange={(event) => {
                    const value = event.target.value;
                    setNewCompetitionTeamIds(typeof value === "string" ? value.split(",") : value);
                  }}
                >
                  {teams.map((team) => (
                    <MenuItem key={team.id} value={team.id}>
                      <Checkbox checked={newCompetitionTeamIds.includes(team.id)} />
                      <ListItemText primary={team.name} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={createCompetition}
                disabled={!newCompetitionName || newCompetitionTeamIds.length < 2}
                sx={{ alignSelf: "flex-start" }}
              >
                Salvar torneio
              </Button>
            </Stack>
          </CardContent>
        </Card>

        <Card variant="outlined">
          <CardContent>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ md: "center" }}>
              <FormControl fullWidth>
                <InputLabel>Torneio</InputLabel>
                <Select
                  label="Torneio"
                  value={competitionId}
                  onChange={(event) => setCompetitionId(event.target.value)}
                >
                  {competitions.map((competition) => (
                    <MenuItem key={competition.id} value={competition.id}>
                      {competition.name} - {competition.type === "LEAGUE" ? "CAMPEONATO" : competition.type}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button
                color="error"
                startIcon={<CleaningServicesIcon />}
                variant="outlined"
                onClick={() => setClearConfirmationOpen(true)}
                disabled={!competitionId}
                sx={{ minWidth: 180 }}
              >
                Limpar torneio
              </Button>
              <Button
                startIcon={<ShuffleIcon />}
                variant="outlined"
                onClick={generateLeagueFixtures}
                disabled={!competitionId || competitions.find((item) => item.id === competitionId)?.type !== "LEAGUE"}
                sx={{ minWidth: 180 }}
              >
                Sortear campeonato
              </Button>
            </Stack>
          </CardContent>
        </Card>

        {isLeagueTournament && matches.length > 0 ? (
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h3" sx={{ mb: 2 }}>
                Tabela do campeonato
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>#</TableCell>
                      <TableCell>Time</TableCell>
                      <TableCell>J</TableCell>
                      <TableCell>V</TableCell>
                      <TableCell>D</TableCell>
                      <TableCell>Saldo</TableCell>
                      <TableCell>Pontos</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {standings.map((row, index) => (
                      <TableRow key={row.id} hover>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>{row.team.name}</TableCell>
                        <TableCell>{row.played}</TableCell>
                        <TableCell>{row.wins}</TableCell>
                        <TableCell>{row.losses}</TableCell>
                        <TableCell>{row.goalBalance}</TableCell>
                        <TableCell>{row.points}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        ) : null}

        {matches.length === 0 ? (
          <Alert severity="info">
            Este torneio ainda nao possui partidas salvas. Em campeonatos, clique em Sortear campeonato para gerar primeiro e segundo turno.
          </Alert>
        ) : isLeagueTournament ? (
          <Stack spacing={3}>
            <LeagueTurn title="Primeiro turno" matches={firstTurnMatches} drafts={drafts} updateDraft={updateDraft} saveScore={saveScore} clearMatchScore={requestClearMatchScore} />
            <LeagueTurn title="Segundo turno" matches={secondTurnMatches} drafts={drafts} updateDraft={updateDraft} saveScore={saveScore} clearMatchScore={requestClearMatchScore} />
          </Stack>
        ) : (
          <Stack spacing={2}>
            {matches.map((match) => {
              const draft = drafts[match.id] ?? {
                homeScore: "",
                awayScore: "",
                extraHomeScore: "",
                extraAwayScore: "",
                winnerTeamId: ""
              };

              return (
                <Card key={match.id} variant="outlined">
                  <CardContent>
                    <Stack spacing={2}>
                      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={1}>
                        <Box>
                          <Typography color="text.secondary" fontWeight={800} variant="body2">
                            {match.stage} | {match.leg}
                          </Typography>
                          <Typography variant="h3">
                            {match.homeTeam.name} x {match.awayTeam.name}
                          </Typography>
                        </Box>
                        <Stack spacing={0.5} alignItems={{ xs: "flex-start", md: "flex-end" }}>
                          <Chip label={match.status} variant="outlined" />
                          <Typography color="text.secondary" variant="body2">
                            Salvo em: {formatPlayedAt(match.playedAt)}
                          </Typography>
                        </Stack>
                      </Stack>

                      <Stack direction={{ xs: "column", lg: "row" }} spacing={1.5}>
                        <ScoreInput
                          label={match.homeTeam.name}
                          value={draft.homeScore}
                          onChange={(value) => updateDraft(match.id, "homeScore", value)}
                        />
                        <ScoreInput
                          label={match.awayTeam.name}
                          value={draft.awayScore}
                          onChange={(value) => updateDraft(match.id, "awayScore", value)}
                        />
                        <ScoreInput
                          label="Prorrog. mandante"
                          value={draft.extraHomeScore}
                          onChange={(value) => updateDraft(match.id, "extraHomeScore", value)}
                        />
                        <ScoreInput
                          label="Prorrog. visitante"
                          value={draft.extraAwayScore}
                          onChange={(value) => updateDraft(match.id, "extraAwayScore", value)}
                        />
                        <FormControl fullWidth>
                          <InputLabel>Vencedor</InputLabel>
                          <Select
                            label="Vencedor"
                            value={draft.winnerTeamId}
                            onChange={(event) => updateDraft(match.id, "winnerTeamId", event.target.value)}
                          >
                            <MenuItem value="">Nao definido</MenuItem>
                            <MenuItem value={match.homeTeam.id}>{match.homeTeam.name}</MenuItem>
                            <MenuItem value={match.awayTeam.id}>{match.awayTeam.name}</MenuItem>
                          </Select>
                        </FormControl>
                      </Stack>

                      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                        <Button variant="contained" startIcon={<SaveIcon />} onClick={() => saveScore(match)}>
                          Salvar placar
                        </Button>
                        <Button color="warning" variant="outlined" onClick={() => requestClearMatchScore(match.id)}>
                          Limpar placar individual
                        </Button>
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>
              );
            })}
          </Stack>
        )}

        <Card variant="outlined">
          <CardContent>
            <Stack spacing={2}>
              <Typography variant="h3">Finalizar torneio</Typography>
              <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
                <TextField
                  label="Nome do torneio"
                  value={finalTournamentName}
                  onChange={(event) => setFinalTournamentName(event.target.value)}
                  fullWidth
                />
                <SelectField label="Tipo de torneio" value={finalTitleTypeId} onChange={setFinalTitleTypeId} items={titleTypes} />
                <SelectField label="Regra de pontos" value={finalTeamRuleId} onChange={setFinalTeamRuleId} items={teamRules} />
              </Stack>
              <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
                <SelectField label="Campeao" value={championTeamId} onChange={setChampionTeamId} items={teams} />
                <SelectField label="Vice-campeao" value={runnerUpTeamId} onChange={setRunnerUpTeamId} items={teams} allowEmpty />
                <SelectField label="Terceiro lugar" value={thirdTeamId} onChange={setThirdTeamId} items={teams} allowEmpty />
              </Stack>
              <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
                {[0, 1, 2].map((index) => (
                  <SelectField
                    key={index}
                    label={`${index + 1} melhor jogador`}
                    value={bestPlayerIds[index]}
                    onChange={(value) =>
                      setBestPlayerIds((current) => {
                        const next = [...current];
                        next[index] = value;
                        return next;
                      })
                    }
                    items={players}
                    allowEmpty
                  />
                ))}
              </Stack>
              <Button
                variant="contained"
                startIcon={<EmojiEventsIcon />}
                onClick={finalizeTournament}
                disabled={!competitionId || !finalTournamentName || !finalTitleTypeId || !finalTeamRuleId || !championTeamId}
              >
                Finalizar torneio
              </Button>
            </Stack>
          </CardContent>
        </Card>

        {lastFinalization ? (
          <Card variant="outlined">
            <CardContent>
              <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ md: "center" }}>
                {lastFinalization.championTeam.badgeUrl ? (
                  <Box
                    component="img"
                    src={lastFinalization.championTeam.badgeUrl}
                    alt={lastFinalization.championTeam.name}
                    sx={{ width: 104, height: 104, objectFit: "contain" }}
                  />
                ) : null}
                <Box>
                  <Typography variant="h2">
                    {lastFinalization.championTeam.name} e campeao do {lastFinalization.finalization.tournamentName}
                  </Typography>
                  <Typography color="text.secondary">
                    Tipo: {lastFinalization.titleType.name} | Vice: {lastFinalization.runnerUpTeam?.name ?? "-"}
                  </Typography>
                </Box>
              </Stack>
              <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mt: 2 }}>
                <PlayersList title="Jogadores campeoes" players={lastFinalization.championTeam.players ?? []} />
                <PlayersList title="Jogadores vice-campeoes" players={lastFinalization.runnerUpTeam?.players ?? []} />
                <RankedPlayersList players={lastFinalization.bestPlayers ?? []} />
              </Stack>
              <Button
                variant="contained"
                startIcon={<VisibilityIcon />}
                onClick={() => setFinalSummaryOpen(true)}
                sx={{ mt: 2 }}
              >
                Visualizar fim do torneio
              </Button>
            </CardContent>
          </Card>
        ) : null}
      </Stack>

      <Dialog
        open={finalSummaryOpen}
        onClose={() => setFinalSummaryOpen(false)}
        maxWidth="xl"
        fullWidth
        scroll="paper"
      >
        <DialogTitle>Fim do torneio</DialogTitle>
        <DialogContent
          dividers
          sx={{
            py: 1.5,
            "& .MuiTableCell-root": {
              py: 0.45,
              px: 1,
              lineHeight: 1.25
            }
          }}
        >
          {lastFinalization ? (
            <Stack spacing={1.5}>
              <Stack
                direction={{ xs: "column", md: "row" }}
                justifyContent="space-between"
                alignItems={{ md: "center" }}
                spacing={1.5}
              >
                <Box>
                  <Typography variant="h2">{lastFinalization.finalization.tournamentName}</Typography>
                  <Typography color="text.secondary">
                    Temporada {lastFinalization.finalization.season} | {lastFinalization.titleType.name}
                  </Typography>
                  <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                    Vice-campeao: {lastFinalization.runnerUpTeam?.name ?? "-"}
                  </Typography>
                </Box>
                <Stack
                  direction="row"
                  spacing={1.5}
                  alignItems="center"
                  sx={{
                    p: 1.25,
                    width: "fit-content",
                    minWidth: { xs: "100%", sm: 300 },
                    border: 1,
                    borderColor: "success.main",
                    borderRadius: 2,
                    bgcolor: "rgba(22, 101, 52, 0.08)"
                  }}
                >
                  <EmojiEventsIcon color="success" sx={{ fontSize: 34 }} />
                  <Box>
                    <Typography color="text.secondary" fontWeight={700} variant="body2">
                      Campeao
                    </Typography>
                    <Typography color="success.dark" fontWeight={900} variant="h2">
                      {lastFinalization.championTeam.name}
                    </Typography>
                  </Box>
                </Stack>
              </Stack>

              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" }, gap: 1.5 }}>
                <PlayersList title="Jogadores campeoes" players={lastFinalization.championTeam.players ?? []} />
                <PlayersList title="Jogadores vice-campeoes" players={lastFinalization.runnerUpTeam?.players ?? []} />
                <RankedPlayersList players={lastFinalization.bestPlayers ?? []} />
              </Box>

              {isLeagueTournament && standings.length > 0 ? (
                <Box>
                  <Typography variant="h3" sx={{ mb: 1 }}>Classificacao final</Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>#</TableCell>
                          <TableCell>Time</TableCell>
                          <TableCell>J</TableCell>
                          <TableCell>V</TableCell>
                          <TableCell>D</TableCell>
                          <TableCell>Saldo</TableCell>
                          <TableCell>Pontos</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {standings.map((row, index) => (
                          <TableRow key={row.id}>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell>{row.team.name}</TableCell>
                            <TableCell>{row.played}</TableCell>
                            <TableCell>{row.wins}</TableCell>
                            <TableCell>{row.losses}</TableCell>
                            <TableCell>{row.goalBalance}</TableCell>
                            <TableCell>{row.points}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              ) : null}

              {isLeagueTournament ? (
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" },
                    gap: 2
                  }}
                >
                  <FinalMatchesTable title="Primeiro turno" matches={firstTurnMatches} />
                  <FinalMatchesTable title="Segundo turno" matches={secondTurnMatches} />
                </Box>
              ) : (
                <FinalMatchesTable title="Partidas" matches={matches} />
              )}
            </Stack>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFinalSummaryOpen(false)}>Fechar</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={clearConfirmationOpen}
        onClose={() => setClearConfirmationOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Limpar este torneio?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Esta ação excluirá todos os resultados das partidas, a tabela de pontos e a exibição do campeão,
            vice-campeão e melhores jogadores. Assim, o torneio ficará disponível para começar novamente.
          </DialogContentText>
          <DialogContentText sx={{ mt: 2, fontWeight: 700 }}>
            Tem certeza de que deseja continuar?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setClearConfirmationOpen(false)}>Cancelar</Button>
          <Button
            color="error"
            variant="contained"
            startIcon={<CleaningServicesIcon />}
            onClick={clearTournament}
          >
            Sim, limpar torneio
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(scoreConfirmationMatchId)}
        onClose={() => setScoreConfirmationMatchId(undefined)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Limpar placar da partida?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Tem certeza de que deseja excluir o placar salvo desta partida?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setScoreConfirmationMatchId(undefined)}>Cancelar</Button>
          <Button color="error" variant="contained" onClick={confirmClearMatchScore}>
            Sim, limpar placar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

function SelectField({
  label,
  value,
  onChange,
  items,
  allowEmpty = false
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  items: { id: string; name: string }[];
  allowEmpty?: boolean;
}) {
  return (
    <FormControl fullWidth>
      <InputLabel>{label}</InputLabel>
      <Select label={label} value={value} onChange={(event) => onChange(event.target.value)}>
        {allowEmpty ? <MenuItem value="">Nao definido</MenuItem> : null}
        {items.map((item) => (
          <MenuItem key={item.id} value={item.id}>
            {item.name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

function PlayersList({ title, players }: { title: string; players: Player[] }) {
  return (
    <Box sx={{ flex: 1 }}>
      <Typography fontWeight={800} sx={{ mb: 1 }}>
        {title}
      </Typography>
      <Stack spacing={0.5}>
        {players.length > 0 ? (
          players.map((player) => (
            <Typography key={player.id} color="text.secondary">
              {player.name}
            </Typography>
          ))
        ) : (
          <Typography color="text.secondary">Nenhum jogador listado.</Typography>
        )}
      </Stack>
    </Box>
  );
}

function RankedPlayersList({ players }: { players: Player[] }) {
  return (
    <Box sx={{ flex: 1 }}>
      <Typography fontWeight={800} sx={{ mb: 1 }}>
        Os melhores jogadores foram
      </Typography>
      <Stack spacing={0.5}>
        {players.length > 0 ? (
          players.map((player, index) => (
            <Typography key={player.id} color="text.secondary">
              {index + 1}º {player.name}
            </Typography>
          ))
        ) : (
          <Typography color="text.secondary">Nenhum jogador listado.</Typography>
        )}
      </Stack>
    </Box>
  );
}

function FinalMatchesTable({
  title,
  matches
}: {
  title: string;
  matches: Match[];
}) {
  return (
    <Box>
      <Typography variant="h3" sx={{ mb: 1 }}>{title}</Typography>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Data</TableCell>
              <TableCell>Partida</TableCell>
              <TableCell>Placar</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {matches.map((match) => (
              <TableRow key={match.id}>
                <TableCell>{formatPlayedAt(match.playedAt)}</TableCell>
                <TableCell>{match.homeTeam.name} x {match.awayTeam.name}</TableCell>
                <TableCell>{formatMatchScore(match)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

function formatPlayedAt(value?: string | null) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "medium"
  }).format(new Date(value));
}

function formatMatchScore(match: Match) {
  if (match.homeScore == null || match.awayScore == null) return "-";

  const regularScore = `${match.homeScore} x ${match.awayScore}`;
  if (match.extraHomeScore == null || match.extraAwayScore == null) return regularScore;
  return `${regularScore} (${match.extraHomeScore} x ${match.extraAwayScore})`;
}

function sanitizeScoreValue(value: string) {
  return value.replace(/\D/g, "").slice(0, 2);
}

function LeagueTurn({
  title,
  matches,
  drafts,
  updateDraft,
  saveScore,
  clearMatchScore
}: {
  title: string;
  matches: Match[];
  drafts: Record<string, ScoreDraft>;
  updateDraft: (matchId: string, field: keyof ScoreDraft, value: string) => void;
  saveScore: (match: Match) => Promise<void>;
  clearMatchScore: (matchId: string) => void;
}) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h2" sx={{ mb: 2 }}>
          {title}
        </Typography>
        <Stack spacing={1.5}>
          {matches.map((match) => {
            const draft = drafts[match.id] ?? {
              homeScore: "",
              awayScore: "",
              extraHomeScore: "",
              extraAwayScore: "",
              winnerTeamId: ""
            };

            return (
              <Box
                key={match.id}
                sx={{
                  alignItems: { xs: "stretch", md: "center" },
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 1,
                  display: "grid",
                  gap: 1.5,
                  gridTemplateColumns: {
                    xs: "1fr",
                    md: "minmax(120px, 1fr) 128px minmax(120px, 1fr) minmax(150px, auto) auto"
                  },
                  p: 1.5
                }}
              >
                <Typography fontWeight={800}>{match.homeTeam.name}</Typography>
                <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
                  <TextField
                    size="small"
                    type="text"
                    value={draft.homeScore}
                    onChange={(event) => updateDraft(match.id, "homeScore", sanitizeScoreValue(event.target.value))}
                    inputProps={{ inputMode: "numeric", pattern: "[0-9]*", style: { textAlign: "center" } }}
                    sx={{ width: 52 }}
                  />
                  <Typography color="text.secondary">x</Typography>
                  <TextField
                    size="small"
                    type="text"
                    value={draft.awayScore}
                    onChange={(event) => updateDraft(match.id, "awayScore", sanitizeScoreValue(event.target.value))}
                    inputProps={{ inputMode: "numeric", pattern: "[0-9]*", style: { textAlign: "center" } }}
                    sx={{ width: 52 }}
                  />
                </Stack>
                <Typography fontWeight={800}>{match.awayTeam.name}</Typography>
                <Box>
                  <Typography color="text.secondary" variant="caption">
                    Data
                  </Typography>
                  <Typography fontWeight={700} variant="body2">
                    {formatPlayedAt(match.playedAt)}
                  </Typography>
                </Box>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                  <Button size="small" variant="contained" startIcon={<SaveIcon />} onClick={() => saveScore(match)}>
                    Enviar resultado
                  </Button>
                  <Button size="small" color="warning" variant="outlined" onClick={() => clearMatchScore(match.id)}>
                    Deletar placar
                  </Button>
                </Stack>
              </Box>
            );
          })}
        </Stack>
      </CardContent>
    </Card>
  );
}

function ScoreInput({
  label,
  value,
  onChange
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <TextField
      label={label}
      type="number"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      inputProps={{ min: 0 }}
      fullWidth
    />
  );
}
