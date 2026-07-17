import { Card, CardContent, Typography } from "@mui/material";

type StatCardProps = {
  label: string;
  value: string;
  helper: string;
};

export function StatCard({ label, value, helper }: StatCardProps) {
  return (
    <Card>
      <CardContent>
        <Typography color="text.secondary" fontWeight={700} variant="body2">
          {label}
        </Typography>
        <Typography variant="h2" sx={{ mt: 1 }}>
          {value}
        </Typography>
        <Typography color="text.secondary" variant="body2" sx={{ mt: 1 }}>
          {helper}
        </Typography>
      </CardContent>
    </Card>
  );
}
