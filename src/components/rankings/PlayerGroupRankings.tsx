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
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Link from "next/link";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { apiRequest } from "@/lib/api";

type GroupBy = "country" | "position" | "team" | "league";
type OrderBy = "goals" | "assists";
type GroupRow = {
  id: string;
  name: string;
  goals: number;
  assists: number;
  participations: number;
  players: number;
};

const groupLabels: Record<GroupBy, string> = {
  country: "Países",
  position: "Posições",
  team: "Times",
  league: "Ligas"
};
const groupSingularLabels: Record<GroupBy, string> = {
  country: "País",
  position: "Posição",
  team: "Time",
  league: "Liga"
};

export function PlayerGroupRankings() {
  const [groupBy, setGroupBy] = useState<GroupBy>("country");
  const [orderBy, setOrderBy] = useState<OrderBy>("goals");
  const [rows, setRows] = useState<GroupRow[]>([]);
  const [error, setError] = useState<string>();

  useEffect(() => {
    setError(undefined);
    const params = new URLSearchParams({ groupBy, orderBy });
    apiRequest<GroupRow[]>(`/rankings/players/group-rankings?${params.toString()}`)
      .then(setRows)
      .catch((loadError) =>
        setError(loadError instanceof Error ? loadError.message : "Erro ao carregar ranking.")
      );
  }, [groupBy, orderBy]);

  return (
    <Box>
      <PageHeader
        title="Rankings de gols e assistências"
        description="Totais globais agrupados por país, posição dos jogadores, time e liga."
      />
      <Stack spacing={3}>
        {error ? <Alert severity="error">{error}</Alert> : null}
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
          <Button
            LinkComponent={Link}
            href="/jogadores"
            startIcon={<ArrowBackIcon />}
            variant="outlined"
          >
            Voltar aos jogadores
          </Button>
          {(["country", "position", "team", "league"] as GroupBy[]).map((group) => (
            <Button
              key={group}
              onClick={() => setGroupBy(group)}
              variant={groupBy === group ? "contained" : "outlined"}
            >
              Ranking de {groupLabels[group].toLowerCase()}
            </Button>
          ))}
        </Stack>

        <Card variant="outlined">
          <CardContent>
            <Stack
              direction={{ xs: "column", md: "row" }}
              justifyContent="space-between"
              alignItems={{ md: "center" }}
              spacing={2}
              sx={{ mb: 2 }}
            >
              <Typography variant="h3">Ranking de {groupLabels[groupBy].toLowerCase()}</Typography>
              <FormControl sx={{ minWidth: 220 }}>
                <InputLabel>Ordenar por</InputLabel>
                <Select
                  label="Ordenar por"
                  value={orderBy}
                  onChange={(event) => setOrderBy(event.target.value as OrderBy)}
                >
                  <MenuItem value="goals">Mais gols</MenuItem>
                  <MenuItem value="assists">Mais assistências</MenuItem>
                </Select>
              </FormControl>
            </Stack>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>{groupSingularLabels[groupBy]}</TableCell>
                    <TableCell>Jogadores</TableCell>
                    <TableCell>Gols</TableCell>
                    <TableCell>Assistências</TableCell>
                    <TableCell>Participações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row, index) => (
                    <TableRow key={row.id} hover>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell sx={{ fontWeight: 900 }}>{row.name}</TableCell>
                      <TableCell>{row.players}</TableCell>
                      <TableCell sx={{ fontWeight: orderBy === "goals" ? 900 : 400 }}>
                        {row.goals}
                      </TableCell>
                      <TableCell sx={{ fontWeight: orderBy === "assists" ? 900 : 400 }}>
                        {row.assists}
                      </TableCell>
                      <TableCell>{row.participations}</TableCell>
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
