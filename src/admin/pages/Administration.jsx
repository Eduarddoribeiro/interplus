import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

import SectionTitle from "../components/common/SectionTitle";
import { Panel } from "../ui";
import { ADMINISTRATION_SECTIONS } from "../../constants/administrationSections";

/*
 * Cadastros da escola. Uma coluna no celular, duas no computador.
 * Os itens "em breve" ocupam juntos a última célula, em cinza,
 * para a grade não ficar com buraco.
 */
export default function Administration() {
  const enabled = ADMINISTRATION_SECTIONS.filter((section) => section.enabled);
  const upcoming = ADMINISTRATION_SECTIONS.filter((section) => !section.enabled);

  return (
    <div className="space-y-5">
      <SectionTitle title="Administração" />

      <Panel as="ul" className="grid gap-px overflow-hidden bg-line lg:grid-cols-2">
        {enabled.map((section) => {
          const Icon = section.icon;

          return (
            <li key={section.id} className="bg-white">
              <Link
                to={section.path}
                className="group flex h-full items-center gap-4 px-5 py-4 transition-colors hover:bg-canvas focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ink"
              >
                <Icon size={20} aria-hidden="true" className="shrink-0 text-ink" />

                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{section.title}</span>
                  <span className="block text-sm text-muted">{section.description}</span>
                </span>

                <ChevronRight
                  size={18}
                  aria-hidden="true"
                  className="shrink-0 text-neutral-300 group-hover:text-ink"
                />
              </Link>
            </li>
          );
        })}

        {upcoming.length > 0 && (
          <li className="flex items-center bg-white px-5 py-4 text-sm text-muted">
            Em breve: {upcoming.map((section) => section.title.toLowerCase()).join(" e ")} da equipe.
          </li>
        )}
      </Panel>
    </div>
  );
}
