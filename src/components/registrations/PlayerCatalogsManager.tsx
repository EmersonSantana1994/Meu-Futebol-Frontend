"use client";

import {
  Alert,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import SaveIcon from "@mui/icons-material/Save";
import { FormEvent, useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { apiRequest } from "@/lib/api";

type CatalogEntry = { id: string; name: string };
type CatalogType = "positions" | "countries";

export function PlayerCatalogsManager() {
  const [positions, setPositions] = useState<CatalogEntry[]>([]);
  const [countries, setCountries] = useState<CatalogEntry[]>([]);
  const [positionName, setPositionName] = useState("");
  const [countryName, setCountryName] = useState("");
  const [message, setMessage] = useState<string>();
  const [error, setError] = useState<string>();
  const [deleteTarget, setDeleteTarget] = useState<{
    type: CatalogType;
    entry: CatalogEntry;
  }>();

  async function loadCatalogs() {
    setError(undefined);
    try {
      const [loadedPositions, loadedCountries] = await Promise.all([
        apiRequest<CatalogEntry[]>("/registrations/positions"),
        apiRequest<CatalogEntry[]>("/registrations/countries")
      ]);
      setPositions(loadedPositions);
      setCountries(loadedCountries);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Erro ao carregar cadastros.");
    }
  }

  useEffect(() => {
    loadCatalogs();
  }, []);

  async function createEntry(event: FormEvent, type: CatalogType) {
    event.preventDefault();
    const name = type === "positions" ? positionName : countryName;
    setError(undefined);
    try {
      await apiRequest(`/registrations/${type}`, {
        method: "POST",
        body: JSON.stringify({ name })
      });
      if (type === "positions") setPositionName("");
      else setCountryName("");
      setMessage(type === "positions" ? "Posicao cadastrada." : "Pais cadastrado.");
      await loadCatalogs();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Erro ao cadastrar.");
    }
  }

  async function deleteEntry() {
    const target = deleteTarget;
    if (!target) return;
    setDeleteTarget(undefined);
    setError(undefined);
    try {
      await apiRequest(`/registrations/${target.type}/${target.entry.id}`, {
        method: "DELETE"
      });
      setMessage(target.type === "positions" ? "Posicao excluida." : "Pais excluido.");
      await loadCatalogs();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Erro ao excluir.");
    }
  }

  return (
    <>
      <PageHeader
        title="Posicoes e paises"
        description="Cadastre as opcoes obrigatorias usadas no cadastro dos jogadores."
      />
      <Stack spacing={2}>
        {message ? <Alert severity="success">{message}</Alert> : null}
        {error ? <Alert severity="error">{error}</Alert> : null}
        <Stack direction={{ xs: "column", lg: "row" }} spacing={2}>
          <CatalogCard
            title="Posicoes"
            fieldLabel="Nome da posicao"
            value={positionName}
            onChange={setPositionName}
            entries={positions}
            onSubmit={(event) => createEntry(event, "positions")}
            onDelete={(entry) => setDeleteTarget({ type: "positions", entry })}
          />
          <CatalogCard
            title="Paises"
            fieldLabel="Nome do pais"
            value={countryName}
            onChange={setCountryName}
            entries={countries}
            onSubmit={(event) => createEntry(event, "countries")}
            onDelete={(entry) => setDeleteTarget({ type: "countries", entry })}
          />
        </Stack>
      </Stack>

      <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(undefined)} maxWidth="xs" fullWidth>
        <DialogTitle>Excluir cadastro?</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary">
            Tem certeza de que deseja excluir “{deleteTarget?.entry.name}”? Itens usados por
            jogadores não podem ser excluídos.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(undefined)}>Cancelar</Button>
          <Button color="error" onClick={deleteEntry} variant="contained">
            Sim, excluir
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

function CatalogCard({
  title,
  fieldLabel,
  value,
  onChange,
  entries,
  onSubmit,
  onDelete
}: {
  title: string;
  fieldLabel: string;
  value: string;
  onChange: (value: string) => void;
  entries: CatalogEntry[];
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onDelete: (entry: CatalogEntry) => void;
}) {
  return (
    <Card variant="outlined" sx={{ flex: 1 }}>
      <CardContent>
        <Stack component="form" spacing={2} onSubmit={onSubmit}>
          <Typography variant="h3">{title}</Typography>
          <TextField
            label={fieldLabel}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            required
            fullWidth
          />
          <Button type="submit" startIcon={<SaveIcon />} variant="contained">
            Salvar
          </Button>
          <Stack spacing={1}>
            {entries.map((entry) => (
              <Stack
                key={entry.id}
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{ borderBottom: 1, borderColor: "divider", py: 1 }}
              >
                <Typography fontWeight={700}>{entry.name}</Typography>
                <Button
                  color="error"
                  onClick={() => onDelete(entry)}
                  startIcon={<DeleteOutlineIcon />}
                  size="small"
                  variant="outlined"
                >
                  Excluir
                </Button>
              </Stack>
            ))}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
