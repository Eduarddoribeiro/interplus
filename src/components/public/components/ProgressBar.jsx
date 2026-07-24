export default function ProgressBar({ current, total }) {
  const steps = [
    "Atleta",
    "Data",
    "Responsável",
    "Revisão",
  ];

  const mobileSteps = [
    "Atleta",
    "Data",
    "Respons.",
    "Revisão",
  ];

  const progress = ((current - 1) / (total - 1)) * 100;

  return (
    <div className="mb-6 sm:mb-10">

      {/* ETAPAS */}
      <div className="grid grid-cols-4">

        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const active = stepNumber <= current;
          const isCurrent = stepNumber === current;

          return (
            <div
              key={step}
              className="flex min-w-0 flex-col items-center"
            >

              {/* NÚMERO */}
              <div
                className={`
                  flex h-10 w-10 items-center justify-center rounded-full
                  text-sm font-bold transition-all duration-300
                  sm:h-12 sm:w-12 sm:text-base

                  ${
                    active
                      ? "bg-red-600 text-white"
                      : "bg-white/90 text-neutral-500"
                  }

                  ${
                    isCurrent
                      ? "ring-4 ring-red-600/15"
                      : ""
                  }
                `}
              >
                {stepNumber}
              </div>

              {/* TEXTO */}
              <span
                className={`
                  mt-2 w-full truncate px-1 text-center
                  text-[11px] font-medium
                  sm:mt-3 sm:text-sm

                  ${
                    active
                      ? "text-red-500"
                      : "text-white/55"
                  }
                `}
              >
                <span className="sm:hidden">
                  {mobileSteps[index]}
                </span>

                <span className="hidden sm:inline">
                  {step}
                </span>
              </span>

            </div>
          );
        })}

      </div>

      {/* BARRA */}
      <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/20 sm:mt-6 sm:h-2">

        <div
          className="h-full rounded-full bg-red-600 transition-[width] duration-500 ease-out"
          style={{
            width: `${progress}%`,
          }}
        />

      </div>

    </div>
  );
}