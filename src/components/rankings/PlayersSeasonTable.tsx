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
  Typography
} from "@mui/material";
import LeaderboardOutlinedIcon from "@mui/icons-material/LeaderboardOutlined";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { apiRequest } from "@/lib/api";

type Team = { id: string; name: string; leagueId?: string };
type League = { id: string; name: string };
type PlayerRow = {
  id: string;
  playerName: string;
  teamName: string;
  teamId?: string | null;
  leagueName: string;
  leagueId?: string | null;
  country: string;
  position: string;
  goals: number;
  assists: number;
  participations: number;
  points: number;
};

type OrderBy = "goals" | "assists" | "participations" | "points";

export function PlayersSeasonTable() {
  const [country, setCountry] = useState("");
  const [position, setPosition] = useState("");
  const [teamId, setTeamId] = useState("");
  const [leagueId, setLeagueId] = useState("");
  const [orderBy, setOrderBy] = useState<OrderBy>("goals");
  const [rows, setRows] = useState<PlayerRow[]>([]);
  const [seasonTotals, setSeasonTotals] = useState({ goals: 0, assists: 0 });
  const [teams, setTeams] = useState<Team[]>([]);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [error, setError] = useState<string>();

  const countries = useMemo(
    () => Array.from(new Set(rows.map((row) => row.country).filter((item) => item && item !== "-"))).sort(),
    [rows]
  );
  const positions = useMemo(
    () => Array.from(new Set(rows.map((row) => row.position).filter((item) => item && item !== "-"))).sort(),
    [rows]
  );

  async function loadData() {
    setError(undefined);
    try {
      const params = new URLSearchParams({ orderBy });
      if (country) params.set("country", country);
      if (position) params.set("position", position);
      if (teamId) params.set("teamId", teamId);
      if (leagueId) params.set("leagueId", leagueId);

      const [loadedRows, allRows, loadedTeams, loadedLeagues] = await Promise.all([
        apiRequest<PlayerRow[]>(`/rankings/players/season-table?${params.toString()}`),
        apiRequest<PlayerRow[]>("/rankings/players/season-table?orderBy=goals"),
        apiRequest<Team[]>("/registrations/teams"),
        apiRequest<League[]>("/registrations/leagues")
      ]);
      setRows(loadedRows);
      setSeasonTotals(
        allRows.reduce(
          (totals, row) => ({
            goals: totals.goals + row.goals,
            assists: totals.assists + row.assists
          }),
          { goals: 0, assists: 0 }
        )
      );
      setTeams(loadedTeams);
      setLeagues(loadedLeagues);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Erro ao carregar jogadores.");
    }
  }

  useEffect(() => {
    loadData();
  }, [country, position, teamId, leagueId, orderBy]);

  return (
    <Box>
      <PageHeader
        title="Jogadores"
        description="Tabela global com gols, assistencias, participacoes, pontos, pais, posicao, time e liga."
      />
      <Stack spacing={3}>
        {error ? <Alert severity="error">{error}</Alert> : null}
        <Button
          LinkComponent={Link}
          href="/jogadores/rankings-agregados"
          startIcon={<LeaderboardOutlinedIcon />}
          variant="contained"
          sx={{ alignSelf: "flex-start" }}
        >
          Rankings por país, posição, time e liga
        </Button>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <TotalCard label="Gols totais da temporada" value={seasonTotals.goals} />
          <TotalCard label="Assistências totais da temporada" value={seasonTotals.assists} />
        </Stack>
        <Card variant="outlined">
          <CardContent>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <SelectBox label="Ordenar por" value={orderBy} onChange={(value) => setOrderBy(value as OrderBy)} items={[
                { id: "goals", name: "Gols" },
                { id: "assists", name: "Assistencias" },
                { id: "participations", name: "Participacoes" },
                { id: "points", name: "Pontos" }
              ]} />
              <SelectBox label="Pais" value={country} onChange={setCountry} items={countries.map((item) => ({ id: item, name: item }))} allowEmpty />
              <SelectBox label="Posicao" value={position} onChange={setPosition} items={positions.map((item) => ({ id: item, name: item }))} allowEmpty />
              <SelectBox
                label="Time"
                value={teamId}
                onChange={setTeamId}
                items={[{ id: "__none__", name: "Sem time" }, ...teams]}
                allowEmpty
              />
              <SelectBox
                label="Liga"
                value={leagueId}
                onChange={setLeagueId}
                items={[{ id: "__none__", name: "Sem liga" }, ...leagues]}
                allowEmpty
              />
            </Stack>
          </CardContent>
        </Card>

        <Card variant="outlined">
          <CardContent>
            <Typography variant="h3" sx={{ mb: 2 }}>
              Ranking de jogadores
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>Jogador</TableCell>
                    <TableCell>Time</TableCell>
                    <TableCell>Liga</TableCell>
                    <TableCell>Posicao</TableCell>
                    <TableCell>Pais</TableCell>
                    <TableCell>Gols</TableCell>
                    <TableCell>Assist.</TableCell>
                    <TableCell>Part.</TableCell>
                    <TableCell>Pontos</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row, index) => (
                    <TableRow key={row.id} hover>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>{row.playerName}</TableCell>
                      <TableCell>{row.teamName}</TableCell>
                      <TableCell>{row.leagueName}</TableCell>
                      <TableCell>{row.position}</TableCell>
                      <TableCell>{row.country}</TableCell>
                      <TableCell>{row.goals}</TableCell>
                      <TableCell>{row.assists}</TableCell>
                      <TableCell>{row.participations}</TableCell>
                      <TableCell>{row.points}</TableCell>
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

function TotalCard({ label, value }: { label: string; value: number }) {
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

function SelectBox({
  label,
  value,
  onChange,
  items,
  allowEmpty
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
        {allowEmpty ? <MenuItem value="">Todos</MenuItem> : null}
        {items.map((item) => (
          <MenuItem key={item.id} value={item.id}>
            {item.name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
