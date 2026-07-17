import {
  EmojiEventsOutlined,
  GroupsOutlined,
  LeaderboardOutlined,
  PersonAddAltOutlined,
  PublicOutlined,
  AccountTreeOutlined,
  ShieldOutlined,
  SportsSoccerOutlined,
  SwapHorizOutlined
} from "@mui/icons-material";
import type { SvgIconComponent } from "@mui/icons-material";

export type ModuleLink = {
  title: string;
  description: string;
  href: string;
  icon: SvgIconComponent;
  color: string;
};

export const modules: ModuleLink[] = [
  {
    title: "Torneios",
    description: "Organize rodadas, placares, sorteios e campeoes.",
    href: "/torneios",
    icon: EmojiEventsOutlined,
    color: "#137547"
  },
  {
    title: "Ligas",
    description: "Cadastre ligas antes de criar times e jogadores.",
    href: "/ligas",
    icon: AccountTreeOutlined,
    color: "#15803d"
  },
  {
    title: "Copa",
    description: "Monte semifinal, quartas ou oitavas com regras especiais.",
    href: "/copa",
    icon: ShieldOutlined,
    color: "#1d4ed8"
  },
  {
    title: "Rankings",
    description: "Veja clubes, jogadores e titulos por pontuacao.",
    href: "/rankings",
    icon: LeaderboardOutlined,
    color: "#7c3aed"
  },
  {
    title: "Times",
    description: "Consulte escudos, ligas e donos dos clubes.",
    href: "/times",
    icon: GroupsOutlined,
    color: "#0f766e"
  },
  {
    title: "Jogadores",
    description: "Liste elenco, nacionalidade, posicao e status.",
    href: "/jogadores",
    icon: SportsSoccerOutlined,
    color: "#c2410c"
  },
  {
    title: "Artilharia",
    description: "Controle gols da temporada e torneio atual.",
    href: "/artilharia",
    icon: SportsSoccerOutlined,
    color: "#be123c"
  },
  {
    title: "Assistencias",
    description: "Acompanhe criadores de jogadas e participacoes.",
    href: "/assistencias",
    icon: SwapHorizOutlined,
    color: "#2563eb"
  },
  {
    title: "Cadastros",
    description: "Crie times, ligas, jogadores e pontuacoes.",
    href: "/cadastros",
    icon: PersonAddAltOutlined,
    color: "#475569"
  },
  {
    title: "Posicoes e paises",
    description: "Cadastre as opcoes usadas nos jogadores.",
    href: "/posicoes-paises",
    icon: PublicOutlined,
    color: "#0369a1"
  }
];
