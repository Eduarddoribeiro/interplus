import SectionTitle from "../components/common/SectionTitle";
import { ADMINISTRATION_SECTIONS } from "../../constants/administrationSections";
import { useNavigate } from "react-router-dom";

export default function Administration() {
  const navigate = useNavigate();
  return (
    
    <div className="space-y-8">
      <SectionTitle
        title="Administração"
        subtitle="Gerencie todas as configurações do sistema."
      />

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {ADMINISTRATION_SECTIONS.map((section) => {
          const Icon = section.icon;

          return (
            <button
  key={section.id}
  disabled={!section.enabled}
  onClick={() => navigate(section.path)}
  className={`rounded-3xl border p-6 text-left transition ${
    section.enabled
      ? "border-neutral-200 bg-white hover:-translate-y-1 hover:shadow-lg"
      : "cursor-not-allowed border-dashed border-neutral-300 bg-neutral-50 opacity-70"
  }`}
>
              <div className="flex items-center gap-3">
                <div
                  className={`rounded-2xl p-3 ${
                    section.enabled
                      ? "bg-red-50 text-red-600"
                      : "bg-neutral-200 text-neutral-500"
                  }`}
                >
                  <Icon size={24} />
                </div>

                <div>
                  <h3 className="font-semibold text-neutral-900">
                    {section.title}
                  </h3>

                  {!section.enabled && (
                    <span className="text-xs text-neutral-500">
                      Em breve
                    </span>
                  )}
                </div>
              </div>

              <p className="mt-5 text-sm text-neutral-500">
                {section.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}