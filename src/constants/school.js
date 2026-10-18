/**
 * Dados de contato da escola exibidos no site público.
 * Deixe vazio o que ainda não estiver definido: o botão some.
 */
export const SCHOOL = {
  name: "Escola Oficial do Inter Viamão",
  // Somente números, com DDI e DDD (ex.: 5551999999999)
  whatsapp: "5551996476999",
  instagram: "",
};

/**
 * Como o responsável conheceu a escola.
 * Os valores são os mesmos usados nos relatórios.
 */
export const SOURCE_OPTIONS = [
  { value: "instagram", label: "Instagram" },
  { value: "referral", label: "Indicação de amigo ou familiar" },
  { value: "google", label: "Google" },
  { value: "facebook", label: "Facebook" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "presential", label: "Passei em frente / vi a escola" },
  { value: "other", label: "Outro" },
];

export const SOURCE_LABEL = Object.fromEntries(
  SOURCE_OPTIONS.map((option) => [option.value, option.label]),
);

// Origens antigas do cadastro manual
const LEGACY_SOURCE_LABEL = {
  franchisor_site: "Site da Franqueadora",
  unit_site: "Site da Unidade",
  presential: "Presencial",
};

/**
 * Rótulo de uma origem gravada no contato (aceita valores antigos
 * e com maiúsculas, ex.: "WhatsApp").
 */
export function getSourceLabel(source) {
  if (!source) return null;

  const key = source.toLowerCase();

  return LEGACY_SOURCE_LABEL[key] ?? SOURCE_LABEL[key] ?? source;
}

// Apelidos aceitos no link (?origem=ig)
const SOURCE_ALIASES = {
  ig: "instagram",
  insta: "instagram",
  fb: "facebook",
  indicacao: "referral",
  zap: "whatsapp",
  wpp: "whatsapp",
};

/**
 * Lê a origem do link (?origem=instagram ou ?utm_source=instagram).
 */
export function getSourceFromUrl(search = window.location.search) {
  const params = new URLSearchParams(search);
  const raw = (params.get("origem") || params.get("utm_source") || "")
    .trim()
    .toLowerCase();

  const value = SOURCE_ALIASES[raw] ?? raw;

  return SOURCE_LABEL[value] ? value : "";
}
