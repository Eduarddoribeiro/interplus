import {
  Layers3,
  Trophy,
  Building2,
  MapPin,
  Users,
  ShieldCheck,
  GraduationCap
} from "lucide-react";
import { ROUTES } from "./routes";

export const ADMINISTRATION_SECTIONS = [
  {
  id: "training-groups",
  title: "Turmas",
  description: "Gerencie as turmas e seus horários.",
  icon: GraduationCap,
  path: ROUTES.TRAINING_GROUPS,
  enabled: true,
},
  {
    id: "categories",
    title: "Categorias",
    description: "Gerencie categorias.",
    icon: Layers3,
    path: ROUTES.CATEGORIES,
    enabled: true,
  },
  {
    id: "modalities",
    title: "Modalidades",
    description: "Cadastre Society, Futsal e futuras modalidades.",
    icon: Trophy,
    path: ROUTES.MODALITIES,
    enabled: true,
  },
  {
    id: "units",
    title: "Unidades",
    description: "Cidades onde a escola atua.",
    icon: Building2,
    path: ROUTES.UNITS,
    enabled: true,
  },
  {
    id: "locations",
    title: "Locais",
    description: "Ginásios e arenas onde acontecem os treinos.",
    icon: MapPin,
    path: ROUTES.LOCATIONS,
    enabled: true,
  },
  {
    id: "users",
    title: "Usuários",
    description: "Controle de acesso da equipe.",
    icon: Users,
    path: ROUTES.USERS,
    enabled: false,
  },
  {
    id: "permissions",
    title: "Permissões",
    description: "Perfis e níveis de acesso.",
    icon: ShieldCheck,
    path: ROUTES.PERMISSIONS,
    enabled: false,
  },
];