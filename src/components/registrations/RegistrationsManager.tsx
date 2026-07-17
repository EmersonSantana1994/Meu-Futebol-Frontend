"use client";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import SaveIcon from "@mui/icons-material/Save";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { apiRequest } from "@/lib/api";
import { PageHeader } from "@/components/ui/PageHeader";

type League = {
  id: string;
  name: string;
  season?: string | null;
  leagueTeams?: Team[];
};

type Team = {
  id: string;
  name: string;
  shortName?: string | null;
  badgeUrl?: string | null;
  leagueId: string;
  ownerPlayerId?: string | null;
  league?: League;
  ownerPlayer?: Player | null;
  players: Player[];
};

type Player = {
  id: string;
  name: string;
  position?: string | null;
  country?: string | null;
  number?: number | null;
  teamId?: string | null;
  leagueId?: string | null;
  team?: Team | null;
  league?: League | null;
};

type TransferMode = "team-swap" | "free-agent";
type CatalogEntry = { id: string; name: string };

export function RegistrationsManager() {
  const [leagues, setLeagues] = useState<League[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [positions, setPositions] = useState<CatalogEntry[]>([]);
  const [countries, setCountries] = useState<CatalogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string>();
  const [error, setError] = useState<string>();

  const [leagueName, setLeagueName] = useState("");
  const [leagueSeason, setLeagueSeason] = useState("2025/2026");

  const [teamLeagueId, setTeamLeagueId] = useState("");
  const [teamName, setTeamName] = useState("");
  const [teamShortName, setTeamShortName] = useState("");
  const [teamBadgeUrl, setTeamBadgeUrl] = useState("");

  const [playerTeamId, setPlayerTeamId] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [playerPosition, setPlayerPosition] = useState("");
  const [playerCountry, setPlayerCountry] = useState("");
  const [playerNumber, setPlayerNumber] = useState("");
  const [playerIsOwner, setPlayerIsOwner] = useState(false);

  const [ownerTeamId, setOwnerTeamId] = useState("");
  const [ownerPlayerId, setOwnerPlayerId] = useState("");

  const [transferMode, setTransferMode] = useState<TransferMode>("team-swap");
  const [transferTargetTeamId, setTransferTargetTeamId] = useState("");
  const [transferTargetPlayerId, setTransferTargetPlayerId] = useState("");
  const [transferReplacementPlayerId, setTransferReplacementPlayerId] = useState("");
  const [transferNextOwnerPlayerId, setTransferNextOwnerPlayerId] = useState("");

  const selectedTransferTeam = useMemo(
    () => teams.find((team) => team.id === transferTargetTeamId),
    [teams, transferTargetTeamId]
  );
  const selectedOwnerTeam = useMemo(
    () => teams.find((team) => team.id === ownerTeamId),
    [teams, ownerTeamId]
  );

  const availableTargetPlayers = useMemo(() => {
    if (transferMode === "free-agent") {
      return players.filter((player) => !player.teamId);
    }
    return players.filter((player) => player.teamId && player.teamId !== transferTargetTeamId);
  }, [players, transferMode, transferTargetTeamId]);

  const teamPlayers = selectedTransferTeam?.players ?? [];
  const replacementIsOwner = selectedTransferTeam?.ownerPlayerId === transferReplacementPlayerId;

  async function loadData() {
    setLoading(true);
    setError(undefined);
    try {
      const [loadedLeagues, loadedTeams, loadedPlayers, loadedPositions, loadedCountries] = await Promise.all([
        apiRequest<League[]>("/registrations/leagues"),
        apiRequest<Team[]>("/registrations/teams"),
        apiRequest<Player[]>("/registrations/players"),
        apiRequest<CatalogEntry[]>("/registrations/positions"),
        apiRequest<CatalogEntry[]>("/registrations/countries")
      ]);
      setLeagues(loadedLeagues);
      setTeams(loadedTeams);
      setPlayers(loadedPlayers);
      setPositions(loadedPositions);
      setCountries(loadedCountries);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Erro ao carregar dados.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function submitLeague(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runAction(async () => {
      await apiRequest("/registrations/leagues", {
        method: "POST",
        body: JSON.stringify({ name: leagueName, season: leagueSeason })
      });
      setLeagueName("");
      setMessage("Liga cadastrada.");
    });
  }

  async function submitTeam(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runAction(async () => {
      await apiRequest("/registrations/teams", {
        method: "POST",
        body: JSON.stringify({
          leagueId: teamLeagueId,
          name: teamName,
          shortName: teamShortName,
          badgeUrl: teamBadgeUrl
        })
      });
      setTeamName("");
      setTeamShortName("");
      setTeamBadgeUrl("");
      setMessage("Time cadastrado na liga.");
    });
  }

  async function submitPlayer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runAction(async () => {
      await apiRequest("/registrations/players", {
        method: "POST",
        body: JSON.stringify({
          teamId: playerTeamId,
          name: playerName,
          position: playerPosition,
          country: playerCountry,
          number: playerNumber ? Number(playerNumber) : undefined,
          isOwner: playerIsOwner
        })
      });
      setPlayerName("");
      setPlayerPosition("");
      setPlayerCountry("");
      setPlayerNumber("");
      setPlayerIsOwner(false);
      setMessage("Jogador cadastrado.");
    });
  }

  async function submitOwner(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runAction(async () => {
      await apiRequest(`/registrations/teams/${ownerTeamId}/owner`, {
        method: "PATCH",
        body: JSON.stringify({ ownerPlayerId })
      });
      setOwnerPlayerId("");
      setMessage("Dono do time atualizado.");
    });
  }

  async function submitTransfer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runAction(async () => {
      await apiRequest(`/registrations/transfers/${transferMode}`, {
        method: "POST",
        body: JSON.stringify({
          targetTeamId: transferTargetTeamId,
          targetPlayerId: transferTargetPlayerId,
          replacementPlayerId: transferReplacementPlayerId,
          nextOwnerPlayerId: transferNextOwnerPlayerId || undefined
        })
      });
      setTransferTargetPlayerId("");
      setTransferReplacementPlayerId("");
      setTransferNextOwnerPlayerId("");
      setMessage("Transferencia registrada.");
    });
  }

  async function runAction(action: () => Promise<void>) {
    setError(undefined);
    setMessage(undefined);
    try {
      await action();
      await loadData();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Erro ao salvar.");
    }
  }

  return (
    <Box>
      <PageHeader
        title="Cadastros"
        description="Cadastre primeiro a liga, depois os times da liga e por fim os jogadores de cada time."
      />

      <Stack spacing={3}>
        {message ? <Alert severity="success">{message}</Alert> : null}
        {error ? <Alert severity="error">{error}</Alert> : null}

        <Stack direction={{ xs: "column", lg: "row" }} spacing={2}>
          <FormCard title="Liga" onSubmit={submitLeague}>
            <TextField
              label="Nome da liga"
              value={leagueName}
              onChange={(event) => setLeagueName(event.target.value)}
              required
              fullWidth
            />
            <TextField
              label="Temporada"
              value={leagueSeason}
              onChange={(event) => setLeagueSeason(event.target.value)}
              fullWidth
            />
            <SubmitButton label="Salvar liga" />
          </FormCard>

          <FormCard title="Time" onSubmit={submitTeam}>
            <LeagueSelect value={teamLeagueId} onChange={setTeamLeagueId} leagues={leagues} required />
            <TextField
              label="Nome do time"
              value={teamName}
              onChange={(event) => setTeamName(event.target.value)}
              required
              fullWidth
            />
            <TextField
              label="Sigla"
              value={teamShortName}
              onChange={(event) => setTeamShortName(event.target.value)}
              fullWidth
            />
            <TextField
              label="Caminho do escudo"
              value={teamBadgeUrl}
              onChange={(event) => setTeamBadgeUrl(event.target.value)}
              placeholder="/escudos/nome-do-time.png"
              fullWidth
            />
            <SubmitButton label="Salvar time" />
          </FormCard>

          <FormCard title="Jogador" onSubmit={submitPlayer}>
            <TeamSelect value={playerTeamId} onChange={setPlayerTeamId} teams={teams} required />
            <TextField
              label="Nome do jogador"
              value={playerName}
              onChange={(event) => setPlayerName(event.target.value)}
              required
              fullWidth
            />
            <Stack direction="row" spacing={1.5}>
              <FormControl fullWidth required>
                <InputLabel>Posicao</InputLabel>
                <Select
                  label="Posicao"
                  value={playerPosition}
                  onChange={(event) => setPlayerPosition(event.target.value)}
                >
                  {positions.map((position) => (
                    <MenuItem key={position.id} value={position.name}>
                      {position.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth required>
                <InputLabel>Pais</InputLabel>
                <Select
                  label="Pais"
                  value={playerCountry}
                  onChange={(event) => setPlayerCountry(event.target.value)}
                >
                  {countries.map((country) => (
                    <MenuItem key={country.id} value={country.name}>
                      {country.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="Numero"
                type="number"
                value={playerNumber}
                onChange={(event) => setPlayerNumber(event.target.value)}
                sx={{ width: 110 }}
              />
            </Stack>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography color="text.secondary">Dono do time</Typography>
              <Switch checked={playerIsOwner} onChange={(event) => setPlayerIsOwner(event.target.checked)} />
            </Stack>
            <SubmitButton label="Salvar jogador" />
          </FormCard>
        </Stack>

        <Card variant="outlined">
          <CardContent>
            <Stack component="form" spacing={2} onSubmit={submitOwner}>
              <Typography variant="h3">Dono do time</Typography>
              <Divider />
              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <TeamSelect
                  value={ownerTeamId}
                  onChange={(value) => {
                    setOwnerTeamId(value);
                    setOwnerPlayerId("");
                  }}
                  teams={teams}
                  required
                />
                <PlayerSelect
                  label="Jogador dono"
                  value={ownerPlayerId}
                  onChange={setOwnerPlayerId}
                  players={selectedOwnerTeam?.players ?? []}
                  required
                />
              </Stack>
              <Box>
                <Button type="submit" variant="contained" startIcon={<SaveIcon />}>
                  Definir dono
                </Button>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        <Card variant="outlined">
          <CardContent>
            <Stack spacing={2} component="form" onSubmit={submitTransfer}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
                <Typography variant="h3">Transferencias</Typography>
                <Button startIcon={<RefreshIcon />} onClick={loadData} disabled={loading}>
                  Atualizar
                </Button>
              </Stack>
              <Divider />
              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <FormControl fullWidth>
                  <InputLabel>Tipo</InputLabel>
                  <Select
                    label="Tipo"
                    value={transferMode}
                    onChange={(event) => {
                      setTransferMode(event.target.value as TransferMode);
                      setTransferTargetPlayerId("");
                    }}
                  >
                    <MenuItem value="team-swap">Compra de outro time</MenuItem>
                    <MenuItem value="free-agent">Compra de jogador livre</MenuItem>
                  </Select>
                </FormControl>
                <TeamSelect value={transferTargetTeamId} onChange={setTransferTargetTeamId} teams={teams} required />
              </Stack>
              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <PlayerSelect
                  label="Jogador comprado"
                  value={transferTargetPlayerId}
                  onChange={setTransferTargetPlayerId}
                  players={availableTargetPlayers}
                  required
                />
                <PlayerSelect
                  label="Quem sai do time"
                  value={transferReplacementPlayerId}
                  onChange={setTransferReplacementPlayerId}
                  players={teamPlayers}
                  required
                />
                {replacementIsOwner ? (
                  <PlayerSelect
                    label="Proximo dono"
                    value={transferNextOwnerPlayerId}
                    onChange={setTransferNextOwnerPlayerId}
                    players={teamPlayers.filter((player) => player.id !== transferReplacementPlayerId)}
                    required
                  />
                ) : null}
              </Stack>
              <Box>
                <Button type="submit" variant="contained" startIcon={<SwapHorizIcon />}>
                  Registrar transferencia
                </Button>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        <Card variant="outlined">
          <CardContent>
            <Typography variant="h3" sx={{ mb: 2 }}>
              Times e elencos
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Time</TableCell>
                    <TableCell>Liga</TableCell>
                    <TableCell>Dono</TableCell>
                    <TableCell>Jogadores</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {teams.map((team) => (
                    <TableRow key={team.id} hover>
                      <TableCell sx={{ fontWeight: 800 }}>{team.name}</TableCell>
                      <TableCell>{team.league?.name ?? "-"}</TableCell>
                      <TableCell>{team.ownerPlayer?.name ?? "Sem dono definido"}</TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                          {team.players.map((player) => (
                            <Chip
                              key={player.id}
                              label={player.id === team.ownerPlayerId ? `${player.name} - dono` : player.name}
                              color={player.id === team.ownerPlayerId ? "primary" : "default"}
                              size="small"
                            />
                          ))}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
}

function FormCard({
  title,
  children,
  onSubmit
}: {
  title: string;
  children: React.ReactNode;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <Card variant="outlined" sx={{ flex: 1 }}>
      <CardContent>
        <Stack component="form" spacing={2} onSubmit={onSubmit}>
          <Typography variant="h3">{title}</Typography>
          {children}
        </Stack>
      </CardContent>
    </Card>
  );
}

function SubmitButton({ label }: { label: string }) {
  return (
    <Button type="submit" variant="contained" startIcon={<SaveIcon />}>
      {label}
    </Button>
  );
}

function LeagueSelect({
  value,
  onChange,
  leagues,
  required
}: {
  value: string;
  onChange: (value: string) => void;
  leagues: League[];
  required?: boolean;
}) {
  return (
    <FormControl fullWidth required={required}>
      <InputLabel>Liga</InputLabel>
      <Select label="Liga" value={value} onChange={(event) => onChange(event.target.value)}>
        {leagues.map((league) => (
          <MenuItem key={league.id} value={league.id}>
            {league.name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

function TeamSelect({
  value,
  onChange,
  teams,
  required
}: {
  value: string;
  onChange: (value: string) => void;
  teams: Team[];
  required?: boolean;
}) {
  return (
    <FormControl fullWidth required={required}>
      <InputLabel>Time</InputLabel>
      <Select label="Time" value={value} onChange={(event) => onChange(event.target.value)}>
        {teams.map((team) => (
          <MenuItem key={team.id} value={team.id}>
            {team.name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

function PlayerSelect({
  label,
  value,
  onChange,
  players,
  required
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  players: Player[];
  required?: boolean;
}) {
  return (
    <FormControl fullWidth required={required}>
      <InputLabel>{label}</InputLabel>
      <Select label={label} value={value} onChange={(event) => onChange(event.target.value)}>
        {players.map((player) => (
          <MenuItem key={player.id} value={player.id}>
            {player.name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
