import { CupModelPage } from "@/components/cup/CupModelPage";

export default function CopaQuartasPage() {
  return (
    <CupModelPage
      model="quarterfinals"
      title="Copa - Quartas de final"
      description="Modelo com 8 times: quartas, semifinais, final e terceiro lugar."
      teamCount={8}
      phaseLabel="Quartas de final"
    />
  );
}
