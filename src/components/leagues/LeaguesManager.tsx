"use client";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import { FormEvent, useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { SimpleTable } from "@/components/ui/SimpleTable";
import { apiRequest } from "@/lib/api";

type Team = {
  id: string;
  name: string;
};

type League = {
  id: string;
  name: string;
  season?: string | null;
  status: string;
  leagueTeams?: Team[];
};

export function LeaguesManager() {
  const [leagues, setLeagues] = useState<League[]>([]);
  const [name, setName] = useState("");
  const [season, setSeason] = useState("2025/2026");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string>();
  const [error, setError] = useState<string>();

  async function loadLeagues() {
    setLoading(true);
    setError(undefined);
    try {
      setLeagues(await apiRequest<League[]>("/registrations/leagues"));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Erro ao carregar ligas.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLeagues();
  }, []);

  async function submitLeague(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);
    setMessage(undefined);
    try {
      await apiRequest("/registrations/leagues", {
        method: "POST",
        body: JSON.stringify({ name, season })
      });
      setName("");
      setMessage("Liga cadastrada.");
      await loadLeagues();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Erro ao cadastrar liga.");
    }
  }

  const rows = leagues.map((league) => ({
    liga: league.name,
    temporada: league.season ?? "-",
    status: league.status,
    times: String(league.leagueTeams?.length ?? 0)
  }));

  return (
    <Box>
      <PageHeader
        title="Ligas"
        description="Cadastre as organizadoras dos times. Depois crie os times desta liga/organizadora e os jogadores de cada time."
      />

      <Stack spacing={3}>
        {message ? <Alert severity="success">{message}</Alert> : null}
        {error ? <Alert severity="error">{error}</Alert> : null}

        <Card variant="outlined">
          <CardContent>
            <Stack component="form" spacing={2} onSubmit={submitLeague}>
              <Typography variant="h3">Cadastrar organizadora</Typography>
              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <TextField
                  label="Nome da liga/organizadora"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                  fullWidth
                />
                <TextField
                  label="Temporada"
                  value={season}
                  onChange={(event) => setSeason(event.target.value)}
                  fullWidth
                />
              </Stack>
              <Button type="submit" variant="contained" startIcon={<SaveIcon />} sx={{ alignSelf: "flex-start" }}>
                Salvar organizadora
              </Button>
            </Stack>
          </CardContent>
        </Card>

        <Card variant="outlined">
          <CardContent>
            <Typography variant="h3" sx={{ mb: 2 }}>
              Ligas/organizadoras cadastradas
            </Typography>
            {loading ? (
              <Stack alignItems="center" spacing={2} sx={{ py: 5 }}>
                <CircularProgress />
                <Typography color="text.secondary">Carregando ligas do banco...</Typography>
              </Stack>
            ) : rows.length > 0 ? (
              <SimpleTable columns={["liga", "temporada", "status", "times"]} rows={rows} />
            ) : (
              <Typography color="text.secondary">
                Nenhuma liga cadastrada ainda.
              </Typography>
            )}
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
}
