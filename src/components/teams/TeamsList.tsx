"use client";

import { Alert, Box, Button, Card, CardContent, CircularProgress, Stack, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import Link from "next/link";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { SimpleTable } from "@/components/ui/SimpleTable";
import { apiRequest } from "@/lib/api";

type Player = { id: string; name: string };
type Team = {
  id: string;
  name: string;
  badgeUrl?: string | null;
  league?: { name: string } | null;
  ownerPlayer?: Player | null;
  players: Player[];
};

export function TeamsList() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  async function loadTeams() {
    setLoading(true);
    setError(undefined);
    try {
      setTeams(await apiRequest<Team[]>("/registrations/teams"));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Erro ao carregar times.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTeams();
  }, []);

  const rows = teams.map((team) => ({
    time: team.name,
    liga: team.league?.name ?? "-",
    dono: team.ownerPlayer?.name ?? "-",
    jogadores: String(team.players.length),
    escudo: team.badgeUrl ?? "-"
  }));

  return (
    <Box>
      <PageHeader
        title="Times"
        description="Clubes criados, suas ligas, donos, escudos e quantidade de jogadores cadastrados."
        actionLabel="Cadastrar time"
      />

      <Stack spacing={3}>
        <Button
          LinkComponent={Link}
          href="/cadastros"
          startIcon={<AddIcon />}
          variant="contained"
          sx={{ alignSelf: "flex-start" }}
        >
          Cadastrar time
        </Button>

        {error ? <Alert severity="error">{error}</Alert> : null}

        {loading ? (
          <Stack alignItems="center" spacing={2} sx={{ py: 6 }}>
            <CircularProgress />
            <Typography color="text.secondary">Carregando times do banco...</Typography>
          </Stack>
        ) : rows.length > 0 ? (
          <SimpleTable columns={["time", "liga", "dono", "jogadores", "escudo"]} rows={rows} />
        ) : (
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h3">Nenhum time cadastrado</Typography>
              <Typography color="text.secondary" sx={{ mt: 1 }}>
                Cadastre uma liga primeiro, depois crie os times dela em Cadastros.
              </Typography>
            </CardContent>
          </Card>
        )}
      </Stack>
    </Box>
  );
}
