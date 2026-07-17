import { CupModelPage } from "@/components/cup/CupModelPage";

export default function CopaSeisPage() {
  return (
    <CupModelPage
      model="six-teams"
      title="Copa - 6 times"
      description="Modelo com 6 times: dois classificados direto em lados opostos e quatro times disputando as quartas de final."
      teamCount={6}
      phaseLabel="Quartas de final"
    />
  );
}
