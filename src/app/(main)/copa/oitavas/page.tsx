import { CupModelPage } from "@/components/cup/CupModelPage";

export default function CopaOitavasPage() {
  return (
    <CupModelPage
      model="round-of-16"
      title="Copa - Oitavas de final"
      description="Modelo completo com 16 times: oitavas, quartas, semifinais, final e terceiro lugar."
      teamCount={16}
      phaseLabel="Oitavas de final"
    />
  );
}
