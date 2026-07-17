import Link from "next/link";
import {
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import LoginOutlinedIcon from "@mui/icons-material/LoginOutlined";
import SportsSoccerOutlinedIcon from "@mui/icons-material/SportsSoccerOutlined";

export default function LoginPage() {
  return (
    <Box
      sx={{
        alignItems: "center",
        bgcolor: "background.default",
        display: "flex",
        minHeight: "100vh",
        px: 2,
        py: 6
      }}
    >
      <Box sx={{ mx: "auto", width: "100%", maxWidth: 440 }}>
        <Stack spacing={3}>
          <Stack spacing={1} alignItems="center">
            <Box
              sx={{
                alignItems: "center",
                bgcolor: "primary.main",
                borderRadius: 2,
                color: "white",
                display: "flex",
                height: 56,
                justifyContent: "center",
                width: 56
              }}
            >
              <SportsSoccerOutlinedIcon fontSize="large" />
            </Box>
            <Typography component="h1" variant="h1" textAlign="center">
              My Fut
            </Typography>
            <Typography color="text.secondary" textAlign="center">
              Entre para organizar campeonatos, rankings, times e jogadores.
            </Typography>
          </Stack>
          <Card variant="outlined">
            <CardContent>
              <Stack spacing={2.5}>
                <TextField label="E-mail" fullWidth />
                <TextField label="Senha" type="password" fullWidth />
                <Button
                  LinkComponent={Link}
                  href="/dashboard"
                  size="large"
                  startIcon={<LoginOutlinedIcon />}
                  variant="contained"
                >
                  Entrar
                </Button>
                <Button LinkComponent={Link} href="/dashboard" variant="text">
                  Continuar em modo demonstracao
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      </Box>
    </Box>
  );
}
