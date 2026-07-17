"use client";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
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
import SaveIcon from "@mui/icons-material/Save";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import { FormEvent, useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { apiRequest } from "@/lib/api";

type Team = { id: string; name: string; badgeUrl?: string | null; players?: Player[] };
type Player = { id: string; name: string; team?: Team | null };
type TeamRule = {
  id: string;
  name: string;
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
type TeamRanking = { id: string; points: number; team: Team };
type PlayerSeason = { id: string; goals: number; assists: number; points: number; player: Player };
type TitleType = { id: string; name: string };
type PlayerTitleRanking = {
  playerId: string;
  playerName: string;
  teamName: string;
  totalTitles: number;
  titles: Record<string, number>;
};

const teamPointFields = [
  ["firstPlacePoints", "1 lugar"],
  ["secondPlacePoints", "2 lugar"],
  ["thirdPlacePoints", "3 lugar"],
  ["fourthPlacePoints", "4 lugar"],
  ["fifthPlacePoints", "5 lugar"],
  ["sixthPlacePoints", "6 lugar"],
  ["seventhPlacePoints", "7 lugar"],
  ["eighthPlacePoints", "8 lugar"],
  ["ninthPlacePoints", "9 lugar"],
  ["tenthPlacePoints", "10 lugar"],
  ["eleventhPlacePoints", "11 lugar"],
  ["twelfthPlacePoints", "12 lugar"],
  ["thirteenthPlacePoints", "13 lugar"],
  ["fourteenthPlacePoints", "14 lugar"],
  ["fifteenthPlacePoints", "15 lugar"],
  ["sixteenthPlacePoints", "16 lugar"]
] as const;

const defaultTeamPoints = {
  firstPlacePoints: "100",
  secondPlacePoints: "60",
  thirdPlacePoints: "30",
  fourthPlacePoints: "15",
  fifthPlacePoints: "10",
  sixthPlacePoints: "8",
  seventhPlacePoints: "6",
  eighthPlacePoints: "5",
  ninthPlacePoints: "4",
  tenthPlacePoints: "3",
  eleventhPlacePoints: "2",
  twelfthPlacePoints: "1",
  thirteenthPlacePoints: "0",
  fourteenthPlacePoints: "0",
  fifteenthPlacePoints: "0",
  sixteenthPlacePoints: "0"
};

export function SeasonRankingsManager() {
  const [season, setSeason] = useState("2025/2026");
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [teamRules, setTeamRules] = useState<TeamRule[]>([]);
  const [teamRanking, setTeamRanking] = useState<TeamRanking[]>([]);
  const [playerRanking, setPlayerRanking] = useState<PlayerSeason[]>([]);
  const [titleTypes, setTitleTypes] = useState<TitleType[]>([]);
  const [playerTitleRanking, setPlayerTitleRanking] = useState<PlayerTitleRanking[]>([]);
  const [message, setMessage] = useState<string>();
  const [error, setError] = useState<string>();
  const [titleTypeName, setTitleTypeName] = useState("Liga");

  const [ruleName, setRuleName] = useState("Campeonato Mundial");
  const [teamPoints, setTeamPoints] = useState(defaultTeamPoints);
  const [editingRuleId, setEditingRuleId] = useState("");

  const [selectedRuleId, setSelectedRuleId] = useState("");
  const [teamPlacements, setTeamPlacements] = useState<string[]>(Array.from({ length: 16 }, () => ""));
  const [lastPodium, setLastPodium] = useState<{ champion?: Team; runnerUp?: Team; third?: Team }>();

  const [playerFirstPoints, setPlayerFirstPoints] = useState("10");
  const [playerSecondPoints, setPlayerSecondPoints] = useState("6");
  const [playerThirdPoints, setPlayerThirdPoints] = useState("3");
  const [firstPlayerId, setFirstPlayerId] = useState("");
  const [secondPlayerId, setSecondPlayerId] = useState("");
  const [thirdPlayerId, setThirdPlayerId] = useState("");

  async function loadData() {
    setError(undefined);
    try {
      const [loadedTeams, loadedPlayers, loadedRules, loadedTeamRanking, loadedTitleTypes, loadedPlayerTitles] = await Promise.all([
        apiRequest<Team[]>("/registrations/teams"),
        apiRequest<Player[]>("/registrations/players"),
        apiRequest<TeamRule[]>("/rankings/team-point-rules"),
        apiRequest<TeamRanking[]>(`/rankings/team-season?season=${encodeURIComponent(season)}`),
        apiRequest<TitleType[]>("/rankings/title-types"),
        apiRequest<PlayerTitleRanking[]>(`/rankings/player-titles?season=${encodeURIComponent(season)}`)
      ]);
      setTeams(loadedTeams);
      setPlayers(loadedPlayers);
      setTeamRules(loadedRules);
      setTeamRanking(loadedTeamRanking);
      setTitleTypes(loadedTitleTypes);
      setPlayerTitleRanking(loadedPlayerTitles);
      if (!selectedRuleId && loadedRules[0]) setSelectedRuleId(loadedRules[0].id);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Erro ao carregar rankings.");
    }
  }

  async function loadPlayerRankingFromCompetition() {
    const competition = await apiRequest<{ id: string }[]>("/rankings/competitions");
    const current = competition.find(Boolean);
    if (!current) return;
    const data = await apiRequest<{ seasonStats: PlayerSeason[] }>(`/rankings/players?competitionId=${current.id}`);
    setPlayerRanking(data.seasonStats);
  }

  useEffect(() => {
    loadData();
    loadPlayerRankingFromCompetition().catch(() => undefined);
  }, [season]);

  async function saveTeamRule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runAction(async () => {
      const rule = await apiRequest<TeamRule>(
        editingRuleId
          ? `/rankings/team-point-rules/${editingRuleId}`
          : "/rankings/team-point-rules",
        {
        method: editingRuleId ? "PATCH" : "POST",
        body: JSON.stringify({
          name: ruleName,
          ...Object.fromEntries(
            teamPointFields.map(([field]) => [field, Number(teamPoints[field]) || 0])
          )
        })
        });
      setSelectedRuleId(rule.id);
      setEditingRuleId(rule.id);
      setMessage(editingRuleId ? "Regra de pontuacao atualizada." : "Regra de pontuacao criada.");
    });
  }

  function selectRuleForEditing(ruleId: string) {
    setEditingRuleId(ruleId);
    if (!ruleId) {
      setRuleName("");
      setTeamPoints({ ...defaultTeamPoints });
      return;
    }
    const rule = teamRules.find((item) => item.id === ruleId);
    if (!rule) return;
    setRuleName(rule.name);
    setTeamPoints(
      Object.fromEntries(
        teamPointFields.map(([field]) => [field, String(rule[field])])
      ) as typeof defaultTeamPoints
    );
  }

  async function saveTitleType(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runAction(async () => {
      await apiRequest("/rankings/title-types", {
        method: "POST",
        body: JSON.stringify({ name: titleTypeName })
      });
      setMessage("Tipo de torneio salvo no Ranking de titulos.");
    });
  }

  async function applyTeamAwards(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runAction(async () => {
      await apiRequest("/rankings/team-awards/apply", {
        method: "POST",
        body: JSON.stringify({
          season,
          ruleId: selectedRuleId,
          placements: teamPlacements
            .map((teamId, index) => ({ teamId, position: index + 1 }))
            .filter((placement) => placement.teamId)
        })
      });
      setLastPodium({
        champion: teams.find((team) => team.id === teamPlacements[0]),
        runnerUp: teams.find((team) => team.id === teamPlacements[1]),
        third: teams.find((team) => team.id === teamPlacements[2])
      });
      setMessage("Ranking de times atualizado.");
    });
  }

  async function savePlayerRule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runAction(async () => {
      await apiRequest("/rankings/player-award-rule", {
        method: "POST",
        body: JSON.stringify({
          firstPlacePoints: Number(playerFirstPoints),
          secondPlacePoints: Number(playerSecondPoints),
          thirdPlacePoints: Number(playerThirdPoints)
        })
      });
      setMessage("Pontuacao dos melhores jogadores salva.");
    });
  }

  async function applyPlayerAwards(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runAction(async () => {
      await apiRequest("/rankings/player-awards/apply", {
        method: "POST",
        body: JSON.stringify({
          season,
          awards: [
            { playerId: firstPlayerId, position: 1 },
            { playerId: secondPlayerId, position: 2 },
            { playerId: thirdPlayerId, position: 3 }
          ].filter((award) => award.playerId)
        })
      });
      setMessage("Ranking de jogadores atualizado.");
    });
  }

  async function runAction(action: () => Promise<void>) {
    setError(undefined);
    setMessage(undefined);
    try {
      await action();
      await loadData();
      await loadPlayerRankingFromCompetition().catch(() => undefined);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Erro ao salvar.");
    }
  }

  return (
    <Box>
      <PageHeader
        title="Rankings da temporada"
        description="Pontuacao acumulada de times e jogadores ao finalizar ligas, copas e torneios."
      />
      <Stack spacing={3}>
        {message ? <Alert severity="success">{message}</Alert> : null}
        {error ? <Alert severity="error">{error}</Alert> : null}

        <TextField label="Temporada" value={season} onChange={(event) => setSeason(event.target.value)} sx={{ maxWidth: 240 }} />

        <Stack direction={{ xs: "column", lg: "row" }} spacing={2}>
          <Card variant="outlined" sx={{ flex: 1 }}>
            <CardContent>
              <Stack spacing={2} component="form" onSubmit={saveTeamRule}>
                <Typography variant="h3">Pontuacao por torneio</Typography>
                <FormControl fullWidth>
                  <InputLabel>Editar regra cadastrada</InputLabel>
                  <Select
                    label="Editar regra cadastrada"
                    value={editingRuleId}
                    onChange={(event) => selectRuleForEditing(event.target.value)}
                  >
                    <MenuItem value="">Criar nova regra</MenuItem>
                    {teamRules.map((rule) => (
                      <MenuItem key={rule.id} value={rule.id}>
                        {rule.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField label="Nome do torneio" value={ruleName} onChange={(event) => setRuleName(event.target.value)} required />
                <Stack
                  direction="row"
                  spacing={1.5}
                  useFlexGap
                  flexWrap="wrap"
                >
                  {teamPointFields.map(([field, label]) => (
                    <TextField
                      key={field}
                      label={label}
                      type="number"
                      value={teamPoints[field]}
                      onChange={(event) =>
                        setTeamPoints((current) => ({
                          ...current,
                          [field]: event.target.value
                        }))
                      }
                      sx={{ width: { xs: "calc(50% - 6px)", sm: 110 } }}
                    />
                  ))}
                </Stack>
                <Button type="submit" variant="contained" startIcon={<SaveIcon />}>
                  {editingRuleId ? "Atualizar regra" : "Salvar nova regra"}
                </Button>
              </Stack>
            </CardContent>
          </Card>

          <Card variant="outlined" sx={{ flex: 1 }}>
            <CardContent>
              <Stack spacing={2} component="form" onSubmit={applyTeamAwards}>
                <Typography variant="h3">Finalizar torneio</Typography>
                <SelectBox label="Regra" value={selectedRuleId} onChange={setSelectedRuleId} items={teamRules.map((rule) => ({ id: rule.id, name: rule.name }))} />
                <Stack spacing={1.5} sx={{ maxHeight: 430, overflowY: "auto", pr: 0.5 }}>
                  {teamPlacements.map((teamId, index) => (
                    <SelectBox
                      key={index}
                      label={`${index + 1} colocado`}
                      value={teamId}
                      onChange={(value) =>
                        setTeamPlacements((current) => {
                          const next = [...current];
                          next[index] = value;
                          return next;
                        })
                      }
                      items={teams}
                    />
                  ))}
                </Stack>
                <Button type="submit" variant="contained" startIcon={<EmojiEventsIcon />}>Atualizar times</Button>
              </Stack>
            </CardContent>
          </Card>
        </Stack>

        <Stack direction={{ xs: "column", lg: "row" }} spacing={2}>
          <Card variant="outlined" sx={{ flex: 1 }}>
            <CardContent>
              <Stack spacing={2} component="form" onSubmit={saveTitleType}>
                <Typography variant="h3">Ranking de titulos</Typography>
                <TextField
                  label="Tipo de torneio"
                  value={titleTypeName}
                  onChange={(event) => setTitleTypeName(event.target.value)}
                  required
                />
                <Button type="submit" variant="contained" startIcon={<SaveIcon />}>
                  Salvar tipo
                </Button>
              </Stack>
            </CardContent>
          </Card>

          <Card variant="outlined" sx={{ flex: 2 }}>
            <CardContent>
              <Typography variant="h3" sx={{ mb: 2 }}>
                Titulos por jogador
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>#</TableCell>
                      <TableCell>Jogador</TableCell>
                      <TableCell>Time</TableCell>
                      <TableCell>Total</TableCell>
                      {titleTypes.map((type) => (
                        <TableCell key={type.id}>{type.name}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {playerTitleRanking.map((row, index) => (
                      <TableRow key={row.playerId} hover>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>{row.playerName}</TableCell>
                        <TableCell>{row.teamName}</TableCell>
                        <TableCell>{row.totalTitles}</TableCell>
                        {titleTypes.map((type) => (
                          <TableCell key={type.id}>{row.titles[type.name] ?? 0}</TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Stack>

        <Stack direction={{ xs: "column", lg: "row" }} spacing={2}>
          <Card variant="outlined" sx={{ flex: 1 }}>
            <CardContent>
              <Stack spacing={2} component="form" onSubmit={savePlayerRule}>
                <Typography variant="h3">Melhores jogadores</Typography>
                <Stack direction="row" spacing={1.5}>
                  <TextField label="1 lugar" type="number" value={playerFirstPoints} onChange={(event) => setPlayerFirstPoints(event.target.value)} />
                  <TextField label="2 lugar" type="number" value={playerSecondPoints} onChange={(event) => setPlayerSecondPoints(event.target.value)} />
                  <TextField label="3 lugar" type="number" value={playerThirdPoints} onChange={(event) => setPlayerThirdPoints(event.target.value)} />
                </Stack>
                <Button type="submit" variant="contained" startIcon={<SaveIcon />}>Salvar regra</Button>
              </Stack>
            </CardContent>
          </Card>

          <Card variant="outlined" sx={{ flex: 1 }}>
            <CardContent>
              <Stack spacing={2} component="form" onSubmit={applyPlayerAwards}>
                <Typography variant="h3">Premiar jogadores</Typography>
                <SelectBox label="1 melhor" value={firstPlayerId} onChange={setFirstPlayerId} items={players} />
                <SelectBox label="2 melhor" value={secondPlayerId} onChange={setSecondPlayerId} items={players} />
                <SelectBox label="3 melhor" value={thirdPlayerId} onChange={setThirdPlayerId} items={players} />
                <Button type="submit" variant="contained" startIcon={<EmojiEventsIcon />}>Atualizar jogadores</Button>
              </Stack>
            </CardContent>
          </Card>
        </Stack>

        {lastPodium?.champion ? (
          <Card variant="outlined">
            <CardContent>
              <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ xs: "flex-start", md: "center" }}>
                {lastPodium.champion.badgeUrl ? (
                  <Box
                    component="img"
                    src={lastPodium.champion.badgeUrl}
                    alt={lastPodium.champion.name}
                    sx={{ width: 96, height: 96, objectFit: "contain" }}
                  />
                ) : null}
                <Box>
                  <Typography variant="h2">
                    {lastPodium.champion.name} e campeao do torneio
                  </Typography>
                  <Typography color="text.secondary">
                    Vice: {lastPodium.runnerUp?.name ?? "-"} | Terceiro: {lastPodium.third?.name ?? "-"}
                  </Typography>
                </Box>
              </Stack>
              <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mt: 2 }}>
                <PlayersList title="Jogadores campeoes" players={lastPodium.champion.players ?? []} />
                <PlayersList title="Jogadores vice-campeoes" players={lastPodium.runnerUp?.players ?? []} />
              </Stack>
            </CardContent>
          </Card>
        ) : null}

        <Stack direction={{ xs: "column", lg: "row" }} spacing={2}>
          <RankingTable title="Ranking de times" rows={teamRanking.map((row) => ({ name: row.team.name, points: row.points }))} />
          <RankingTable title="Ranking de jogadores" rows={playerRanking.map((row) => ({ name: row.player.name, points: row.points, extra: `${row.goals} gols / ${row.assists} assist.` }))} />
        </Stack>
      </Stack>
    </Box>
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

function SelectBox({
  label,
  value,
  onChange,
  items
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  items: { id: string; name: string }[];
}) {
  return (
    <FormControl fullWidth>
      <InputLabel>{label}</InputLabel>
      <Select label={label} value={value} onChange={(event) => onChange(event.target.value)}>
        {items.map((item) => (
          <MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

function RankingTable({ title, rows }: { title: string; rows: { name: string; points: number; extra?: string }[] }) {
  return (
    <Card variant="outlined" sx={{ flex: 1 }}>
      <CardContent>
        <Typography variant="h3" sx={{ mb: 2 }}>{title}</Typography>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell>Nome</TableCell>
                <TableCell>Pontos</TableCell>
                <TableCell>Detalhe</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row, index) => (
                <TableRow key={`${row.name}-${index}`} hover>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>{row.name}</TableCell>
                  <TableCell>{row.points}</TableCell>
                  <TableCell>{row.extra ?? "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
}
