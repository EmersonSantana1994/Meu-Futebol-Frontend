import Link from "next/link";
import { Box, Card, CardActionArea, CardContent, Stack, Typography } from "@mui/material";
import type { ModuleLink } from "@/config/modules";

type ModuleCardProps = {
  module: ModuleLink;
};

export function ModuleCard({ module }: ModuleCardProps) {
  const Icon = module.icon;

  return (
    <Card variant="outlined">
      <CardActionArea LinkComponent={Link} href={module.href} sx={{ height: "100%" }}>
        <CardContent sx={{ height: "100%" }}>
          <Stack spacing={2}>
            <Box
              sx={{
                alignItems: "center",
                bgcolor: `${module.color}14`,
                borderRadius: 2,
                color: module.color,
                display: "flex",
                height: 44,
                justifyContent: "center",
                width: 44
              }}
            >
              <Icon />
            </Box>
            <Box>
              <Typography variant="h3">{module.title}</Typography>
              <Typography color="text.secondary" sx={{ mt: 0.75 }}>
                {module.description}
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
