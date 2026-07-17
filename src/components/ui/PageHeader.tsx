import { Box, Button, Stack, Typography } from "@mui/material";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";

type PageHeaderProps = {
  title: string;
  description: string;
  actionLabel?: string;
};

export function PageHeader({ title, description, actionLabel }: PageHeaderProps) {
  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      justifyContent="space-between"
      alignItems={{ xs: "flex-start", sm: "center" }}
      spacing={2}
      sx={{ mb: 3 }}
    >
      <Box>
        <Typography component="h1" variant="h1">
          {title}
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 0.75, maxWidth: 680 }}>
          {description}
        </Typography>
      </Box>
      {actionLabel ? (
        <Button variant="contained" startIcon={<AddOutlinedIcon />}>
          {actionLabel}
        </Button>
      ) : null}
    </Stack>
  );
}
