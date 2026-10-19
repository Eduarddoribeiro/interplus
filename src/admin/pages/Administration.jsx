import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";

import SectionTitle from "../components/common/SectionTitle";
import { Panel } from "../ui";
import { ADMINISTRATION_SECTIONS } from "../../constants/administrationSections";

/*
 * Cadastros da escola. Os itens "em breve" aparecem apagados no fim.
 */
export default function Administration() {
  const navigate = useNavigate();

  const sections = [...ADMINISTRATION_SECTIONS].sort(
    (a, b) => Number(b.enabled) - Number(a.enabled),
  );

  return (
    <div className="space-y-5">
      <SectionTitle title="Administração" />

      <Panel as="ul" className="max-w-3xl divide-y divide-line overflow-hidden">
        {sections.map((section) => {
          const Icon = section.icon;

          return (
            <li key={section.id}>
              <button
                type="button"
                disabled={!section.enabled}
                onClick={() => navigate(section.path)}
                className="flex w-full items-center gap-4 px-4 py-4 text-left transition-colors hover:bg-canvas disabled:cursor-not-allowed disabled:hover:bg-white"
              >
                <Icon
                  size={20}
                  aria-hidden="true"
                  className={section.enabled ? "text-ink" : "text-neutral-300"}
                />

                <span className="min-w-0 flex-1">
                  <span className={`block font-semibold ${section.enabled ? "" : "text-muted"}`}>
                    {section.title}
                    {!section.enabled && (
                      <span className="ml-2 text-sm font-normal">(em breve)</span>
                    )}
                  </span>

                  <span className="block text-sm text-muted">{section.description}</span>
                </span>

                {section.enabled && (
                  <ChevronRight size={18} aria-hidden="true" className="text-neutral-300" />
                )}
              </button>
            </li>
          );
        })}
      </Panel>
    </div>
  );
}
