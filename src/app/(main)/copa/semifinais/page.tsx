import { CupModelPage } from "@/components/cup/CupModelPage";

export default function CopaSemifinaisPage() {
  return (
    <CupModelPage
      model="semifinals"
      title="Copa - Semifinais"
      description="Modelo curto com 4 times: duas semifinais, final e disputa de terceiro lugar."
      teamCount={4}
      phaseLabel="Semifinais"
    />
  );
}
