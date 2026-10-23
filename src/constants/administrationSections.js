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
  description: "Turmas, horários e professores de cada horário.",
  icon: GraduationCap,
  path: ROUTES.TRAINING_GROUPS,
  enabled: true,
},
  {
    id: "categories",
    title: "Categorias",
    description: "Faixas de idade, do Sub-05 ao Sub-17.",
    icon: Layers3,
    path: ROUTES.CATEGORIES,
    enabled: true,
  },
  {
    id: "modalities",
    title: "Modalidades",
    description: "Futsal, Society e as que vierem.",
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
    description: "Ginásios e arenas, com o endereço que os pais veem no formulário.",
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