import {
  Layers3,
  Trophy,
  Building2,
  MessageSquare,
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
    description: "Gerencie as unidades da escola.",
    icon: Building2,
    path: ROUTES.UNITS,
    enabled: true,
  },
  {
    id: "whatsapp",
    title: "WhatsApp",
    description: "Configuração da Evolution API.",
    icon: MessageSquare,
    path: ROUTES.WHATSAPP,
    enabled: false,
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