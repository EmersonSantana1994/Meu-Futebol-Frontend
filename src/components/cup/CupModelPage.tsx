"use client";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import CasinoOutlinedIcon from "@mui/icons-material/CasinoOutlined";
import CleaningServicesIcon from "@mui/icons-material/CleaningServices";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import SaveIcon from "@mui/icons-material/Save";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { apiRequest } from "@/lib/api";

type CupModel = "semifinals" | "six-teams" | "quarterfinals" | "round-of-16";
type CupStage = "first" | "second" | "extra";

type CupModelPageProps = {
  model: CupModel;
  title: string;
  description: string;
  teamCount: number;
  phaseLabel: string;
};

type Match = {
  id: string;
  phase: "round-of-16" | "quarterfinals" | "semifinals" | "final" | "third-place";
  order: number;
  home: { id: string; name: string };
  away: { id: string; name: string };
  firstHomeScore: number | null;
  firstAwayScore: number | null;
  secondHomeScore: number | null;
  secondAwayScore: number | null;
  extraHomeScore: number | null;
  extraAwayScore: number | null;
  scoreSavedAt: string | null;
  firstScoreSavedAt: string | null;
  secondScoreSavedAt: string | null;
  extraScoreSavedAt: string | null;
};

type Team = {
  id: string;
  name: string;
  league?: { name: string } | null;
};
type Player = { id: string; name: string };
type NamedOption = { id: string; name: string };
type TeamRule = NamedOption & {
  firstPlacePoints: number;
  secondPlacePoints: number;
  thirdPlacePoints: number;
  fourthPlacePoints: number;
  fifthPlacePoints: number;
  sixthPlacePoints: number;
  seventhPlacePoints: number;
  eighthPlacePoints: number;
  ninthPlacePoints: number;
  tenthPlacePoints: number;
  eleventhPlacePoints: number;
  twelfthPlacePoints: number;
  thirteenthPlacePoints: number;
  fourteenthPlacePoints: number;
  fifteenthPlacePoints: number;
  sixteenthPlacePoints: number;
};
type CupFinalization = {
  finalization: { tournamentName: string; season: string; finalizedAt: string };
  titleType: NamedOption;
  championTeam: Team & { players?: Player[] };
  runnerUpTeam: (Team & { players?: Player[] }) | null;
  thirdTeam: Team | null;
  bestPlayers: Player[];
};

type BracketResponse = {
  tournamentName: string;
  model: CupModel;
  byeTeamIds: string[];
  matches: Match[];
};

export function CupModelPage({
  model,
  title,
  description,
  teamCount,
  phaseLabel
}: CupModelPageProps) {
  const [availableTeams, setAvailableTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [teamRules, setTeamRules] = useState<TeamRule[]>([]);
  const [titleTypes, setTitleTypes] = useState<NamedOption[]>([]);
  const [selectedTeamIds, setSelectedTeamIds] = useState(Array.from({ length: teamCount }, () => ""));
  const [tournamentName, setTournamentName] = useState("");
  const [matches, setMatches] = useState<Match[]>([]);
  const [byeTeamIds, setByeTeamIds] = useState(["", ""]);
  const [byes, setByes] = useState<Team[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generatingSemifinals, setGeneratingSemifinals] = useState(false);
  const [generatingFinalStage, setGeneratingFinalStage] = useState(false);
  const [finalSecondLegHomeTeamId, setFinalSecondLegHomeTeamId] = useState("");
  const [thirdSecondLegHomeTeamId, setThirdSecondLegHomeTeamId] = useState("");
  const [finalSeason, setFinalSeason] = useState("2025/2026");
  const [finalTitleTypeId, setFinalTitleTypeId] = useState("");
  const [finalTeamRuleId, setFinalTeamRuleId] = useState("");
  const [placementTeamIds, setPlacementTeamIds] = useState(
    Array.from({ length: 16 }, () => "")
  );
  const [bestPlayerIds, setBestPlayerIds] = useState(["", "", ""]);
  const [finalization, setFinalization] = useState<CupFinalization>();
  const [finalSummaryOpen, setFinalSummaryOpen] = useState(false);
  const selectedTeamRule = teamRules.find((rule) => rule.id === finalTeamRuleId);
  const activePlacementPositions = Array.from({ length: 16 }, (_, index) => index + 1).filter(
    (position) => teamRulePoints(selectedTeamRule, position) > 0
  );
  const [savingStageKey, setSavingStageKey] = useState<string>();
  const [clearScoreTarget, setClearScoreTarget] = useState<{ matchId: string; stage: CupStage; label: string }>();
  const [extraTimeMatchIds, setExtraTimeMatchIds] = useState<Set<string>>(new Set());
  const [clearConfirmationOpen, setClearConfirmationOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadData() {
    setLoadingTeams(true);
    setError(null);
    try {
      const [teams, loadedPlayers, loadedRules, loadedTitleTypes, bracket, loadedFinalization] = await Promise.all([
        apiRequest<Team[]>("/registrations/teams"),
        apiRequest<Player[]>("/registrations/players"),
        apiRequest<TeamRule[]>("/rankings/team-point-rules"),
        apiRequest<NamedOption[]>("/rankings/title-types"),
        apiRequest<BracketResponse | null>(`/cups/brackets/opening/${model}`),
        apiRequest<CupFinalization | null>(`/cups/brackets/${model}/finalization`)
      ]);
      setAvailableTeams(teams);
      setPlayers(loadedPlayers);
      setTeamRules(loadedRules);
      setTitleTypes(loadedTitleTypes);
      setFinalization(loadedFinalization ?? undefined);
      if (!finalTeamRuleId && loadedRules[0]) setFinalTeamRuleId(loadedRules[0].id);
      if (!finalTitleTypeId && loadedTitleTypes[0]) setFinalTitleTypeId(loadedTitleTypes[0].id);
      if (bracket) {
        setTournamentName(bracket.tournamentName);
        setMatches(bracket.matches);
        setExtraTimeMatchIds(
          new Set(
            bracket.matches
              .filter((match) => match.extraHomeScore != null || match.extraAwayScore != null)
              .map((match) => match.id)
          )
        );
        setByeTeamIds(bracket.byeTeamIds);
        setByes(teams.filter((team) => bracket.byeTeamIds.includes(team.id)));
        const participantIds = [
          ...new Set([
            ...bracket.matches.flatMap((match) => [match.home.id, match.away.id]),
            ...bracket.byeTeamIds
          ])
        ];
        setSelectedTeamIds(Array.from({ length: teamCount }, (_, index) => participantIds[index] ?? ""));
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Erro ao carregar times.");
    } finally {
      setLoadingTeams(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [model]);

  useEffect(() => {
    const finalMatch = matches.find((match) => match.phase === "final");
    const thirdMatch = matches.find((match) => match.phase === "third-place");
    if (!finalMatch || !thirdMatch || !isCupTieCompleted(finalMatch) || !isCupTieCompleted(thirdMatch)) {
      return;
    }
    const finalOutcome = cupTieOutcome(finalMatch);
    const thirdOutcome = cupTieOutcome(thirdMatch);
    if (!finalOutcome || !thirdOutcome) return;

    setPlacementTeamIds((current) => {
      const next = [...current];
      next[0] = finalOutcome.winnerId;
      next[1] = finalOutcome.loserId;
      next[2] = thirdOutcome.winnerId;
      return next;
    });
  }, [matches]);

  function updateTeam(index: number, value: string) {
    setSelectedTeamIds((current) => current.map((teamId, teamIndex) => (teamIndex === index ? value : teamId)));
  }

  async function createBracket() {
    const uniqueTeamIds = [...new Set(selectedTeamIds.filter(Boolean))];
    if (!tournamentName.trim()) {
      setMessage("Informe o nome do torneio antes de gerar o chaveamento.");
      return;
    }

    if (uniqueTeamIds.length !== teamCount) {
      setMessage(`Selecione ${teamCount} times diferentes antes de gerar o chaveamento.`);
      return;
    }

    const selectedTeams = uniqueTeamIds.map((teamId) => availableTeams.find((team) => team.id === teamId));
    if (selectedTeams.some((team) => !team)) {
      setMessage("Todos os times selecionados precisam existir no banco.");
      return;
    }

    let uniqueByeIds: string[] = [];
    if (model === "six-teams") {
      uniqueByeIds = [...new Set(byeTeamIds.filter(Boolean))];
      if (uniqueByeIds.length !== 2) {
        setMessage("Escolha exatamente 2 times classificados direto.");
        return;
      }

      if (uniqueByeIds.some((teamId) => !uniqueTeamIds.includes(teamId))) {
        setMessage("Os classificados direto precisam estar entre os 6 times da copa.");
        return;
      }
    }

    setGenerating(true);
    setError(null);
    try {
      const bracket = await apiRequest<BracketResponse>("/cups/brackets/opening", {
        method: "POST",
        body: JSON.stringify({
          tournamentName,
          model,
          byeTeamIds: uniqueByeIds,
          teams: selectedTeams as Team[]
        })
      });
      setMatches(bracket.matches);
      setExtraTimeMatchIds(new Set());
      setByeTeamIds(bracket.byeTeamIds);
      setByes(availableTeams.filter((team) => bracket.byeTeamIds.includes(team.id)));
      setMessage("Chaveamento gerado e salvo no banco.");
    } catch (generateError) {
      setError(generateError instanceof Error ? generateError.message : "Erro ao gerar chaveamento.");
    } finally {
      setGenerating(false);
    }
  }

  async function generateSemifinals() {
    setGeneratingSemifinals(true);
    setError(null);
    try {
      const bracket = await apiRequest<BracketResponse>(`/cups/brackets/${model}/semifinals`, {
        method: "POST",
        body: JSON.stringify({})
      });
      setMatches(bracket.matches);
      setMessage("Semifinais geradas com os quatro classificados das quartas de final.");
    } catch (generateError) {
      setError(
        generateError instanceof Error ? generateError.message : "Erro ao gerar as semifinais."
      );
    } finally {
      setGeneratingSemifinals(false);
    }
  }

  async function generateFinalStage() {
    setGeneratingFinalStage(true);
    setError(null);
    try {
      const bracket = await apiRequest<BracketResponse>(`/cups/brackets/${model}/final-stage`, {
        method: "POST",
        body: JSON.stringify({
          finalSecondLegHomeTeamId: finalSecondLegHomeTeamId || undefined,
          thirdPlaceSecondLegHomeTeamId: thirdSecondLegHomeTeamId || undefined
        })
      });
      setMatches(bracket.matches);
      setMessage("Final e disputa de terceiro lugar geradas na mesma Copa.");
    } catch (generateError) {
      setError(
        generateError instanceof Error ? generateError.message : "Erro ao gerar a fase final."
      );
    } finally {
      setGeneratingFinalStage(false);
    }
  }

  async function finalizeCup() {
    setError(null);
    try {
      const result = await apiRequest<CupFinalization>(`/cups/brackets/${model}/finalize`, {
        method: "POST",
        body: JSON.stringify({
          tournamentName,
          season: finalSeason,
          titleTypeId: finalTitleTypeId,
          teamRuleId: finalTeamRuleId,
          placements: activePlacementPositions.map((position) => ({
            position,
            teamId: placementTeamIds[position - 1]
          })),
          bestPlayerIds: bestPlayerIds.filter(Boolean)
        })
      });
      setFinalization(result);
      setMessage("Copa finalizada e rankings atualizados.");
    } catch (finalizeError) {
      setError(finalizeError instanceof Error ? finalizeError.message : "Erro ao finalizar a Copa.");
    }
  }

  function updateScore(matchId: string, field: keyof Match, value: string) {
    const score = value === "" ? null : Math.max(0, Number(value));
    setMatches((current) =>
      current.map((match) => (match.id === matchId ? { ...match, [field]: score } : match))
    );
  }

  async function saveStage(match: Match, stage: CupStage) {
    const [home, away] =
      stage === "first"
        ? [match.firstHomeScore, match.firstAwayScore]
        : stage === "second"
          ? [match.secondHomeScore, match.secondAwayScore]
          : [match.extraHomeScore, match.extraAwayScore];
    if (home == null || away == null) {
      setError("Preencha os dois placares antes de salvar.");
      return;
    }

    const stageKey = `${match.id}-${stage}`;
    setSavingStageKey(stageKey);
    setError(null);
    try {
      const saved = await apiRequest<Match>(`/cups/brackets/matches/${match.id}/score/${stage}`, {
        method: "PATCH",
        body: JSON.stringify({ home, away })
      });
      setMatches((current) => current.map((item) => (item.id === saved.id ? saved : item)));
      setMessage(`Placar de ${stageLabel(stage)} do jogo ${match.order} salvo.`);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Erro ao salvar placar.");
    } finally {
      setSavingStageKey(undefined);
    }
  }

  async function clearBracket() {
    setClearConfirmationOpen(false);
    setError(null);
    try {
      await apiRequest(`/cups/brackets/opening/${model}`, { method: "DELETE" });
      setMatches([]);
      setExtraTimeMatchIds(new Set());
      setByes([]);
      setByeTeamIds(["", ""]);
      setSelectedTeamIds(Array.from({ length: teamCount }, () => ""));
      setTournamentName("");
      setFinalization(undefined);
      setPlacementTeamIds(Array.from({ length: 16 }, () => ""));
      setMessage("Chaveamento limpo. Agora voce pode gerar uma nova Copa.");
    } catch (clearError) {
      setError(clearError instanceof Error ? clearError.message : "Erro ao limpar chaveamento.");
    }
  }

  async function clearScore() {
    const target = clearScoreTarget;
    if (!target) return;
    setClearScoreTarget(undefined);
    setError(null);
    try {
      await apiRequest(`/cups/brackets/matches/${target.matchId}/clear-score/${target.stage}`, {
        method: "POST",
        body: JSON.stringify({})
      });
      setMatches((current) =>
        current.map((match) => {
          if (match.id !== target.matchId) return match;
          if (target.stage === "first") {
            return { ...match, firstHomeScore: null, firstAwayScore: null, firstScoreSavedAt: null };
          }
          if (target.stage === "second") {
            return { ...match, secondHomeScore: null, secondAwayScore: null, secondScoreSavedAt: null };
          }
          return { ...match, extraHomeScore: null, extraAwayScore: null, extraScoreSavedAt: null };
        })
      );
      if (target.stage === "extra") {
        setExtraTimeMatchIds((current) => {
          const next = new Set(current);
          next.delete(target.matchId);
          return next;
        });
      }
      setMessage(`Placar de ${target.label} deletado.`);
    } catch (clearError) {
      setError(clearError instanceof Error ? clearError.message : "Erro ao deletar placar.");
    }
  }

  function disableExtraTime(match: Match) {
    if (match.extraScoreSavedAt) {
      setClearScoreTarget({ matchId: match.id, stage: "extra", label: "prorrogacao" });
      return;
    }

    setMatches((current) =>
      current.map((item) =>
        item.id === match.id ? { ...item, extraHomeScore: null, extraAwayScore: null } : item
      )
    );
    setExtraTimeMatchIds((current) => {
      const next = new Set(current);
      next.delete(match.id);
      return next;
    });
  }

  return (
    <Box>
      <PageHeader title={title} description={description} actionLabel="Salvar modelo" />
      <Stack spacing={3}>
        <Alert severity="info">
          Este modelo usa as regras novas da Copa: partida normal ate 4 gols, agregado em dois
          jogos, encerramento antecipado quando nao da mais para reverter e prorrogacao com 2 gols
          de diferenca.
        </Alert>
        {error ? <Alert severity="error">{error}</Alert> : null}

        <Card
          variant="outlined"
          sx={{
            background:
              "linear-gradient(135deg, rgba(19,117,71,0.12), rgba(29,78,216,0.10))",
            borderColor: "transparent"
          }}
        >
          <CardContent>
            <Stack spacing={2}>
              <Box>
                <Typography color="text.secondary" fontWeight={800} variant="body2">
                  Nome do torneio
                </Typography>
                <Typography variant="h2" sx={{ mt: 0.5 }}>
                  {tournamentName.trim() || "Torneio sem nome"}
                </Typography>
              </Box>
              <TextField
                label="Nome estampado no chaveamento"
                onChange={(event) => setTournamentName(event.target.value)}
                value={tournamentName}
                fullWidth
                helperText="Exemplo: Campeonato Mundial, Copa Nacional, Super Mundial."
              />
            </Stack>
          </CardContent>
        </Card>

        <Card variant="outlined">
          <CardContent>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              justifyContent="space-between"
              spacing={2}
              sx={{ mb: 2 }}
            >
              <Box>
                <Typography variant="h3">Times participantes</Typography>
                <Typography color="text.secondary">
                  Cadastre os times que entram nesta Copa. O chaveamento usa a ordem sorteada.
                </Typography>
              </Box>
              <Chip color="primary" label={`${teamCount} times`} />
            </Stack>
            {loadingTeams ? (
              <Stack alignItems="center" spacing={2} sx={{ py: 4 }}>
                <CircularProgress />
                <Typography color="text.secondary">Carregando times cadastrados...</Typography>
              </Stack>
            ) : (
              <Box
                sx={{
                  display: "grid",
                  gap: 2,
                  gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" }
                }}
              >
                {selectedTeamIds.map((teamId, index) => (
                  <TeamSelect
                    key={index}
                    label={`Time ${index + 1}`}
                    teams={availableTeams}
                    value={teamId}
                    onChange={(value) => updateTeam(index, value)}
                  />
                ))}
              </Box>
            )}
            {model === "six-teams" ? (
              <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} sx={{ mt: 3 }}>
                {[0, 1].map((index) => (
                  <TeamSelect
                    key={index}
                    label={`${index + 1} classificado direto`}
                    teams={availableTeams.filter((team) => selectedTeamIds.includes(team.id))}
                    value={byeTeamIds[index]}
                    onChange={(value) =>
                      setByeTeamIds((current) => {
                        const next = [...current];
                        next[index] = value;
                        return next;
                      })
                    }
                  />
                ))}
              </Stack>
            ) : null}
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mt: 3 }}>
              <Button
                disabled={loadingTeams || generating}
                onClick={createBracket}
                startIcon={<CasinoOutlinedIcon />}
                variant="contained"
              >
                Gerar chaveamento
              </Button>
              <Button
                color="error"
                disabled={matches.length === 0}
                onClick={() => setClearConfirmationOpen(true)}
                startIcon={<CleaningServicesIcon />}
                variant="outlined"
              >
                Limpar chaveamento
              </Button>
            </Stack>
          </CardContent>
        </Card>

        {message ? <Alert severity="success">{message}</Alert> : null}

        {matches.filter((match) => match.phase === "quarterfinals").length === 4 &&
        !matches.some((match) => match.phase === "semifinals") ? (
          <Card variant="outlined">
            <CardContent>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                justifyContent="space-between"
                alignItems={{ xs: "stretch", sm: "center" }}
                spacing={2}
              >
                <Box>
                  <Typography variant="h3">Próxima fase</Typography>
                  <Typography color="text.secondary">
                    Após salvar todos os resultados das quartas, gere os dois confrontos da mesma Copa.
                  </Typography>
                </Box>
                <Button
                  disabled={generatingSemifinals}
                  onClick={generateSemifinals}
                  variant="contained"
                >
                  {generatingSemifinals ? "Gerando..." : "Gerar semifinais"}
                </Button>
              </Stack>
            </CardContent>
          </Card>
        ) : null}

        {matches.filter((match) => match.phase === "semifinals").length === 2 &&
        matches
          .filter((match) => match.phase === "semifinals")
          .every(isCupTieCompleted) &&
        !matches.some((match) => match.phase === "final") ? (
          <Card variant="outlined">
            <CardContent>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="h3">Gerar final e terceiro lugar</Typography>
                  <Typography color="text.secondary">
                    O sistema aplicará automaticamente os critérios de mando. Use as escolhas
                    abaixo somente se houver empate e for necessária uma decisão manual.
                  </Typography>
                </Box>
                <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
                  <TeamSelect
                    label="Mando manual da volta da final"
                    teams={[
                      ...new Map(
                        matches
                          .filter((match) => match.phase === "semifinals")
                          .flatMap((match) => [match.home, match.away])
                          .map((team) => [team.id, team])
                      ).values()
                    ]}
                    value={finalSecondLegHomeTeamId}
                    onChange={setFinalSecondLegHomeTeamId}
                  />
                  <TeamSelect
                    label="Mando manual da volta do terceiro lugar"
                    teams={[
                      ...new Map(
                        matches
                          .filter((match) => match.phase === "semifinals")
                          .flatMap((match) => [match.home, match.away])
                          .map((team) => [team.id, team])
                      ).values()
                    ]}
                    value={thirdSecondLegHomeTeamId}
                    onChange={setThirdSecondLegHomeTeamId}
                  />
                </Stack>
                <Button
                  disabled={generatingFinalStage}
                  onClick={generateFinalStage}
                  variant="contained"
                >
                  {generatingFinalStage ? "Gerando..." : "Gerar final e terceiro lugar"}
                </Button>
              </Stack>
            </CardContent>
          </Card>
        ) : null}

        <Card variant="outlined">
          <CardContent>
            <Box
              sx={{
                borderBottom: "1px solid",
                borderColor: "divider",
                mb: 2,
                pb: 2
              }}
            >
              <Typography color="primary" fontWeight={900} variant="body2">
                {new Set(matches.map((match) => match.phase)).size > 1
                  ? "Fases da Copa"
                  : phaseLabel}
              </Typography>
              <Typography variant="h2">{tournamentName.trim() || "Torneio sem nome"}</Typography>
            </Box>
            {matches.length === 0 ? (
              <Typography color="text.secondary">
                Gere o chaveamento para visualizar os confrontos.
              </Typography>
            ) : (
              <Stack spacing={2}>
                {model === "six-teams" && byes.length === 2 ? (
                  <Alert severity="info">
                    {byes[0].name} e {byes[1].name} ficam em lados opostos e so podem se enfrentar em uma final possivel.
                  </Alert>
                ) : null}
                {(
                  [
                    "round-of-16",
                    "quarterfinals",
                    "semifinals",
                    "third-place",
                    "final"
                  ] as Match["phase"][]
                ).map((phase) => {
                  const phaseMatches = matches.filter((match) => match.phase === phase);
                  if (phaseMatches.length === 0) return null;

                  return (
                    <Box
                      key={phase}
                      sx={{
                        p: { xs: 1.5, md: 2 },
                        border: 1,
                        borderColor: "divider",
                        borderRadius: 2,
                        bgcolor: phase === "semifinals"
                          ? "rgba(29, 78, 216, 0.035)"
                          : phase === "final"
                            ? "rgba(22, 101, 52, 0.055)"
                            : "background.paper"
                      }}
                    >
                      <Typography color="primary" fontWeight={900} variant="h3" sx={{ mb: 1.5 }}>
                        {cupPhaseLabel(phase)}
                      </Typography>
                      <Box
                        sx={{
                          display: "grid",
                          gap: 2,
                          gridTemplateColumns: {
                            xs: "1fr",
                            md: phaseMatches.length === 1 ? "1fr" : "repeat(2, 1fr)"
                          }
                        }}
                      >
                        {phaseMatches.map((match) => (
                    <Card key={match.id} variant="outlined">
                      <CardContent>
                        <Typography color="primary" fontWeight={900} variant="caption">
                          {cupPhaseLabel(match.phase)}
                        </Typography>
                        <Typography color="text.secondary" fontWeight={700} variant="body2">
                          Jogo {match.order}
                        </Typography>
                        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 1 }}>
                          <Typography fontWeight={800}>{match.home.name}</Typography>
                          <Chip label="x" size="small" />
                          <Typography fontWeight={800}>{match.away.name}</Typography>
                        </Stack>
                        <Stack spacing={2} sx={{ mt: 2 }}>
                          <StageScoreRow
                            label="Jogo de Ida"
                            leftTeamName={match.home.name}
                            rightTeamName={match.away.name}
                            homeScore={match.firstHomeScore}
                            awayScore={match.firstAwayScore}
                            onHomeChange={(value) => updateScore(match.id, "firstHomeScore", value)}
                            onAwayChange={(value) => updateScore(match.id, "firstAwayScore", value)}
                            savedAt={match.firstScoreSavedAt}
                            saving={savingStageKey === `${match.id}-first`}
                            onSave={() => saveStage(match, "first")}
                            onDelete={() =>
                              setClearScoreTarget({ matchId: match.id, stage: "first", label: "ida" })
                            }
                          />
                          <StageScoreRow
                            label="Jogo de Volta"
                            leftTeamName={match.away.name}
                            rightTeamName={match.home.name}
                            homeScore={match.secondHomeScore}
                            awayScore={match.secondAwayScore}
                            onHomeChange={(value) => updateScore(match.id, "secondHomeScore", value)}
                            onAwayChange={(value) => updateScore(match.id, "secondAwayScore", value)}
                            savedAt={match.secondScoreSavedAt}
                            saving={savingStageKey === `${match.id}-second`}
                            onSave={() => saveStage(match, "second")}
                            onDelete={() =>
                              setClearScoreTarget({ matchId: match.id, stage: "second", label: "volta" })
                            }
                          />
                        </Stack>
                        {extraTimeMatchIds.has(match.id) ? (
                          <Box sx={{ mt: 2 }}>
                            <StageScoreRow
                              label="Prorrogacao"
                              leftTeamName={match.away.name}
                              rightTeamName={match.home.name}
                              homeScore={match.extraHomeScore}
                              awayScore={match.extraAwayScore}
                              onHomeChange={(value) => updateScore(match.id, "extraHomeScore", value)}
                              onAwayChange={(value) => updateScore(match.id, "extraAwayScore", value)}
                              savedAt={match.extraScoreSavedAt}
                              saving={savingStageKey === `${match.id}-extra`}
                              onSave={() => saveStage(match, "extra")}
                              onDelete={() =>
                                setClearScoreTarget({ matchId: match.id, stage: "extra", label: "prorrogacao" })
                              }
                            />
                            <Button
                              color="warning"
                              onClick={() => disableExtraTime(match)}
                              size="small"
                              variant="text"
                              sx={{ mt: 0.75 }}
                            >
                              Desabilitar prorrogacao
                            </Button>
                          </Box>
                        ) : (
                          <Button
                            onClick={() =>
                              setExtraTimeMatchIds((current) => new Set([...current, match.id]))
                            }
                            variant="text"
                            sx={{ mt: 1.5 }}
                          >
                            Habilitar prorrogacao
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                        ))}
                      </Box>
                    </Box>
                  );
                })}
              </Stack>
            )}
          </CardContent>
        </Card>

        {matches.some((match) => match.phase === "final") ? (
          <Card variant="outlined">
            <CardContent>
              <Stack spacing={2}>
                <Typography variant="h3">Finalizar Copa</Typography>
                <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
                  <TextField
                    label="Nome da Copa"
                    value={tournamentName}
                    onChange={(event) => setTournamentName(event.target.value)}
                    fullWidth
                  />
                  <TextField
                    label="Temporada"
                    value={finalSeason}
                    onChange={(event) => setFinalSeason(event.target.value)}
                    fullWidth
                  />
                  <OptionSelect
                    label="Tipo de torneio"
                    options={titleTypes}
                    value={finalTitleTypeId}
                    onChange={setFinalTitleTypeId}
                  />
                  <OptionSelect
                    label="Regra de pontos"
                    options={teamRules}
                    value={finalTeamRuleId}
                    onChange={setFinalTeamRuleId}
                  />
                </Stack>
                <Box>
                  <Typography fontWeight={900} sx={{ mb: 1 }}>
                    Classificação para o ranking de times
                  </Typography>
                  <Typography color="text.secondary" sx={{ mb: 1.5 }}>
                    Somente as posições com pontuação maior que zero na regra selecionada são exibidas.
                  </Typography>
                  <Box
                    sx={{
                      display: "grid",
                      gap: 1.5,
                      gridTemplateColumns: {
                        xs: "1fr",
                        sm: "repeat(2, 1fr)",
                        lg: "repeat(4, 1fr)"
                      }
                    }}
                  >
                    {activePlacementPositions.map((position) => (
                      <TeamSelect
                        key={position}
                        label={placementLabel(position, teamRulePoints(selectedTeamRule, position))}
                        teams={availableTeams.filter((team) => selectedTeamIds.includes(team.id))}
                        value={placementTeamIds[position - 1]}
                        onChange={(value) =>
                          setPlacementTeamIds((current) => {
                            const next = [...current];
                            next[position - 1] = value;
                            return next;
                          })
                        }
                      />
                    ))}
                  </Box>
                </Box>
                <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
                  {[0, 1, 2].map((index) => (
                    <OptionSelect
                      key={index}
                      label={`${index + 1} melhor jogador`}
                      options={players}
                      value={bestPlayerIds[index]}
                      onChange={(value) =>
                        setBestPlayerIds((current) => {
                          const next = [...current];
                          next[index] = value;
                          return next;
                        })
                      }
                    />
                  ))}
                </Stack>
                <Button
                  disabled={
                    Boolean(finalization) ||
                    !tournamentName.trim() ||
                    !finalSeason.trim() ||
                    !finalTitleTypeId ||
                    !finalTeamRuleId ||
                    activePlacementPositions.length === 0 ||
                    activePlacementPositions.some(
                      (position) => !placementTeamIds[position - 1]
                    ) ||
                    bestPlayerIds.some((id) => !id)
                  }
                  onClick={finalizeCup}
                  startIcon={<EmojiEventsIcon />}
                  variant="contained"
                >
                  {finalization ? "Copa finalizada" : "Finalizar Copa"}
                </Button>
              </Stack>
            </CardContent>
          </Card>
        ) : null}

        {finalization ? (
          <Card
            variant="outlined"
            sx={{ borderColor: "success.main", bgcolor: "rgba(22, 101, 52, 0.06)" }}
          >
            <CardContent>
              <Stack spacing={1.5}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <EmojiEventsIcon color="success" sx={{ fontSize: 42 }} />
                  <Box>
                    <Typography color="success.dark" fontWeight={900} variant="h2">
                      {finalization.championTeam.name} é campeão da {finalization.finalization.tournamentName}
                    </Typography>
                    <Typography color="text.secondary">
                      Temporada {finalization.finalization.season} | Vice:{" "}
                      {finalization.runnerUpTeam?.name ?? "-"} | Terceiro:{" "}
                      {finalization.thirdTeam?.name ?? "-"}
                    </Typography>
                  </Box>
                </Stack>
                <Typography fontWeight={900}>Os melhores jogadores foram</Typography>
                {finalization.bestPlayers.map((player, index) => (
                  <Typography key={player.id} color="text.secondary">
                    {index + 1}º {player.name}
                  </Typography>
                ))}
                <Button
                  onClick={() => setFinalSummaryOpen(true)}
                  startIcon={<VisibilityIcon />}
                  variant="contained"
                  sx={{ alignSelf: "flex-start" }}
                >
                  Visualizar fim da Copa
                </Button>
              </Stack>
            </CardContent>
          </Card>
        ) : null}
      </Stack>

      <Dialog open={clearConfirmationOpen} onClose={() => setClearConfirmationOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Limpar chaveamento?</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary">
            Tem certeza de que deseja excluir todos os confrontos e placares desta Copa?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setClearConfirmationOpen(false)}>Cancelar</Button>
          <Button color="error" variant="contained" onClick={clearBracket}>
            Sim, limpar chaveamento
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(clearScoreTarget)} onClose={() => setClearScoreTarget(undefined)} maxWidth="xs" fullWidth>
        <DialogTitle>Deletar placar?</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary">
            Tem certeza de que deseja apagar o placar de {clearScoreTarget?.label} deste confronto?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setClearScoreTarget(undefined)}>Cancelar</Button>
          <Button color="error" variant="contained" onClick={clearScore}>
            Sim, deletar placar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={finalSummaryOpen}
        onClose={() => setFinalSummaryOpen(false)}
        maxWidth="xl"
        fullWidth
        scroll="paper"
      >
        <DialogTitle>Fim da Copa</DialogTitle>
        <DialogContent dividers>
          {finalization ? (
            <Stack spacing={2}>
              <Stack
                direction={{ xs: "column", md: "row" }}
                justifyContent="space-between"
                alignItems={{ md: "center" }}
                spacing={2}
              >
                <Box>
                  <Typography variant="h2">{finalization.finalization.tournamentName}</Typography>
                  <Typography color="text.secondary">
                    Temporada {finalization.finalization.season} | {finalization.titleType?.name}
                  </Typography>
                  <Typography color="text.secondary">
                    Vice-campeão: {finalization.runnerUpTeam?.name ?? "-"} | Terceiro lugar:{" "}
                    {finalization.thirdTeam?.name ?? "-"}
                  </Typography>
                </Box>
                <Stack
                  direction="row"
                  spacing={1.5}
                  alignItems="center"
                  sx={{
                    p: 1.5,
                    border: 1,
                    borderColor: "success.main",
                    borderRadius: 2,
                    bgcolor: "rgba(22, 101, 52, 0.08)"
                  }}
                >
                  <EmojiEventsIcon color="success" sx={{ fontSize: 38 }} />
                  <Box>
                    <Typography color="text.secondary" fontWeight={800}>
                      Campeão
                    </Typography>
                    <Typography color="success.dark" fontWeight={900} variant="h2">
                      {finalization.championTeam.name}
                    </Typography>
                  </Box>
                </Stack>
              </Stack>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
                  gap: 2
                }}
              >
                <SummaryList
                  title="Jogadores campeões"
                  items={finalization.championTeam.players?.map((player) => player.name) ?? []}
                />
                <SummaryList
                  title="Jogadores vice-campeões"
                  items={finalization.runnerUpTeam?.players?.map((player) => player.name) ?? []}
                />
                <SummaryList
                  title="Os melhores jogadores foram"
                  items={finalization.bestPlayers.map(
                    (player, index) => `${index + 1}º ${player.name}`
                  )}
                />
              </Box>

              {["round-of-16", "quarterfinals", "semifinals", "third-place", "final"].map(
                (phase) => {
                  const phaseMatches = matches.filter((match) => match.phase === phase);
                  if (phaseMatches.length === 0) return null;
                  return (
                    <Box key={phase}>
                      <Typography variant="h3" sx={{ mb: 1 }}>
                        {cupPhaseLabel(phase as Match["phase"])}
                      </Typography>
                      <Stack spacing={0.75}>
                        {phaseMatches.map((match) => (
                          <Box
                            key={match.id}
                            sx={{
                              display: "grid",
                              gridTemplateColumns: { xs: "1fr", md: "120px 1fr 1fr 1fr" },
                              gap: 1,
                              py: 0.75,
                              borderBottom: 1,
                              borderColor: "divider"
                            }}
                          >
                            <Typography fontWeight={800}>Jogo {match.order}</Typography>
                            <Typography>
                              Ida: {match.home.name} {match.firstHomeScore} ×{" "}
                              {match.firstAwayScore} {match.away.name}
                            </Typography>
                            <Typography>
                              Volta: {match.away.name} {match.secondHomeScore} ×{" "}
                              {match.secondAwayScore} {match.home.name}
                            </Typography>
                            {match.extraScoreSavedAt ? (
                              <Stack spacing={0.25}>
                                <Typography>
                                  Prorrogação: {match.away.name} {match.extraHomeScore} ×{" "}
                                  {match.extraAwayScore} {match.home.name}
                                </Typography>
                                <Typography fontSize="0.95rem" fontWeight={900}>
                                  Salvo em: {formatSavedAt(match.extraScoreSavedAt)}
                                </Typography>
                              </Stack>
                            ) : (
                              <Typography fontSize="0.95rem" fontWeight={900}>
                                Salvo em: {formatSavedAt(match.secondScoreSavedAt)}
                              </Typography>
                            )}
                          </Box>
                        ))}
                      </Stack>
                    </Box>
                  );
                }
              )}
            </Stack>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFinalSummaryOpen(false)}>Fechar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

function TeamSelect({
  label,
  teams,
  value,
  onChange
}: {
  label: string;
  teams: Team[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <FormControl fullWidth>
      <InputLabel>{label}</InputLabel>
      <Select label={label} value={value} onChange={(event) => onChange(event.target.value)}>
        <MenuItem value="">Selecione</MenuItem>
        {teams.map((team) => (
          <MenuItem key={team.id} value={team.id}>
            {team.name}
            {team.league?.name ? ` - ${team.league.name}` : ""}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

function OptionSelect({
  label,
  options,
  value,
  onChange
}: {
  label: string;
  options: NamedOption[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <FormControl fullWidth>
      <InputLabel>{label}</InputLabel>
      <Select label={label} value={value} onChange={(event) => onChange(event.target.value)}>
        <MenuItem value="">Selecione</MenuItem>
        {options.map((option) => (
          <MenuItem key={option.id} value={option.id}>
            {option.name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

function SummaryList({ title, items }: { title: string; items: string[] }) {
  return (
    <Box>
      <Typography fontWeight={900} sx={{ mb: 0.75 }}>
        {title}
      </Typography>
      {items.map((item) => (
        <Typography key={item} color="text.secondary">
          {item}
        </Typography>
      ))}
    </Box>
  );
}

function StageScoreRow({
  label,
  leftTeamName,
  rightTeamName,
  homeScore,
  awayScore,
  onHomeChange,
  onAwayChange,
  savedAt,
  saving,
  onSave,
  onDelete
}: {
  label: string;
  leftTeamName: string;
  rightTeamName: string;
  homeScore: number | null;
  awayScore: number | null;
  onHomeChange: (value: string) => void;
  onAwayChange: (value: string) => void;
  savedAt: string | null;
  saving: boolean;
  onSave: () => void;
  onDelete: () => void;
}) {
  return (
    <Box>
      <Typography fontWeight={900} sx={{ mb: 1 }}>
        {label}
      </Typography>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1}
        alignItems={{ sm: "center" }}
        flexWrap="wrap"
        useFlexGap
      >
        <Typography fontWeight={800} sx={{ minWidth: 100 }}>{leftTeamName}</Typography>
        <TextField
          size="small"
          type="number"
          value={homeScore ?? ""}
          onChange={(event) => onHomeChange(event.target.value)}
          inputProps={{ min: 0, "aria-label": `Placar de ${leftTeamName} na ${label}` }}
          sx={{ width: 68 }}
        />
        <Typography color="text.secondary" fontWeight={800}>x</Typography>
        <TextField
          size="small"
          type="number"
          value={awayScore ?? ""}
          onChange={(event) => onAwayChange(event.target.value)}
          inputProps={{ min: 0, "aria-label": `Placar de ${rightTeamName} na ${label}` }}
          sx={{ width: 68 }}
        />
        <Typography fontWeight={800} sx={{ minWidth: 100 }}>{rightTeamName}</Typography>
        <Button disabled={saving} onClick={onSave} startIcon={<SaveIcon />} size="small" variant="contained">
          Salvar
        </Button>
        <Button
          color="warning"
          disabled={!savedAt}
          onClick={onDelete}
          startIcon={<CleaningServicesIcon />}
          size="small"
          variant="outlined"
        >
          Deletar
        </Button>
        <Typography
          color={savedAt ? "text.primary" : "text.secondary"}
          fontSize="0.95rem"
          fontWeight={800}
        >
          Salvo em: {formatSavedAt(savedAt)}
        </Typography>
      </Stack>
    </Box>
  );
}

function stageLabel(stage: CupStage) {
  if (stage === "first") return "ida";
  if (stage === "second") return "volta";
  return "prorrogacao";
}

function cupPhaseLabel(phase: Match["phase"]) {
  if (phase === "round-of-16") return "Oitavas de final";
  if (phase === "quarterfinals") return "Quartas de final";
  if (phase === "semifinals") return "Semifinal";
  if (phase === "third-place") return "Disputa de terceiro lugar";
  return "Final";
}

function isCupTieCompleted(match: Match) {
  if (
    !match.firstScoreSavedAt ||
    !match.secondScoreSavedAt ||
    match.firstHomeScore == null ||
    match.firstAwayScore == null ||
    match.secondHomeScore == null ||
    match.secondAwayScore == null
  ) {
    return false;
  }

  const firstTeamAggregate = match.firstHomeScore + match.secondAwayScore;
  const secondTeamAggregate = match.firstAwayScore + match.secondHomeScore;
  if (firstTeamAggregate !== secondTeamAggregate) return true;

  if (
    !match.extraScoreSavedAt ||
    match.extraHomeScore == null ||
    match.extraAwayScore == null
  ) {
    return false;
  }

  return (
    firstTeamAggregate + match.extraAwayScore !==
    secondTeamAggregate + match.extraHomeScore
  );
}

function cupTieOutcome(match: Match) {
  if (!isCupTieCompleted(match)) return null;
  const firstTeamGoals =
    (match.firstHomeScore ?? 0) +
    (match.secondAwayScore ?? 0) +
    (match.extraAwayScore ?? 0);
  const secondTeamGoals =
    (match.firstAwayScore ?? 0) +
    (match.secondHomeScore ?? 0) +
    (match.extraHomeScore ?? 0);
  return firstTeamGoals > secondTeamGoals
    ? { winnerId: match.home.id, loserId: match.away.id }
    : { winnerId: match.away.id, loserId: match.home.id };
}

function teamRulePoints(rule: TeamRule | undefined, position: number) {
  if (!rule) return 0;
  const fields: Array<keyof TeamRule> = [
    "firstPlacePoints",
    "secondPlacePoints",
    "thirdPlacePoints",
    "fourthPlacePoints",
    "fifthPlacePoints",
    "sixthPlacePoints",
    "seventhPlacePoints",
    "eighthPlacePoints",
    "ninthPlacePoints",
    "tenthPlacePoints",
    "eleventhPlacePoints",
    "twelfthPlacePoints",
    "thirteenthPlacePoints",
    "fourteenthPlacePoints",
    "fifteenthPlacePoints",
    "sixteenthPlacePoints"
  ];
  return Number(rule[fields[position - 1]] ?? 0);
}

function placementLabel(position: number, points: number) {
  if (position === 1) return `Campeão — ${points} pontos`;
  if (position === 2) return `Vice-campeão — ${points} pontos`;
  return `${position}º lugar — ${points} pontos`;
}

function formatSavedAt(value: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "medium"
  }).format(new Date(value));
}
