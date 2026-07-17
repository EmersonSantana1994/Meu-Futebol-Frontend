import Link from "next/link";
import { Box, Button, Card, CardContent, Stack, Typography } from "@mui/material";
import AccountTreeOutlinedIcon from "@mui/icons-material/AccountTreeOutlined";
import { PageHeader } from "@/components/ui/PageHeader";

export default function CopaPage() {
  const models = [
    {
      title: "Semifinais",
      description: "4 times, duas semifinais, final e terceiro lugar.",
      href: "/copa/semifinais"
    },
    {
      title: "Copa com 6 times",
      description: "2 times aguardam em lados opostos e 4 disputam as quartas.",
      href: "/copa/seis"
    },
    {
      title: "Quartas de final",
      description: "8 times, quartas, semifinais, final e terceiro lugar.",
      href: "/copa/quartas"
    },
    {
      title: "Oitavas de final",
      description: "16 times, oitavas, quartas, semifinais, final e terceiro lugar.",
      href: "/copa/oitavas"
    }
  ];

  return (
    <Box>
      <PageHeader
        title="Copa"
        description="Escolha o modelo da competicao. Todos seguem as regras especiais da Copa: jogos ate 4 gols, agregado em ida e volta, prorrogação e mando por campanha."
      />
      <Box
        sx={{
          display: "grid",
          gap: 3,
          gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" }
        }}
      >
        {models.map((model) => (
          <Card key={model.href} variant="outlined">
            <CardContent>
              <Stack spacing={2}>
                <AccountTreeOutlinedIcon color="primary" fontSize="large" />
                <Box>
                  <Typography variant="h3">{model.title}</Typography>
                  <Typography color="text.secondary" sx={{ mt: 1 }}>
                    {model.description}
                  </Typography>
                </Box>
                <Button LinkComponent={Link} href={model.href} variant="contained">
                  Abrir modelo
                </Button>
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  );
}
