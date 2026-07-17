import { Box, Card, CardContent, Stack, Typography } from "@mui/material";
import { PageHeader } from "./PageHeader";
import { SimpleTable } from "./SimpleTable";

type ModulePageProps = {
  title: string;
  description: string;
  actionLabel?: string;
  columns: string[];
  rows: Record<string, string>[];
  notes?: string[];
};

export function ModulePage({
  title,
  description,
  actionLabel,
  columns,
  rows,
  notes = []
}: ModulePageProps) {
  return (
    <Box>
      <PageHeader title={title} description={description} actionLabel={actionLabel} />
      <Stack spacing={3}>
        <SimpleTable columns={columns} rows={rows} />
        {notes.length > 0 ? (
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h3">Proximos passos</Typography>
              <Stack component="ul" spacing={1} sx={{ mb: 0, pl: 2.5 }}>
                {notes.map((note) => (
                  <Typography component="li" color="text.secondary" key={note}>
                    {note}
                  </Typography>
                ))}
              </Stack>
            </CardContent>
          </Card>
        ) : null}
      </Stack>
    </Box>
  );
}
