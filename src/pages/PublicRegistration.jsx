import RegistrationHero from "../components/public/RegistrationHero";
import RegistrationForm from "../components/public/RegistrationForm";

export default function PublicRegistration() {
  return (
    <main className="min-h-screen bg-neutral-950">
      <RegistrationHero />

      <section
        id="registration-form"
        className="relative py-20 lg:py-28"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(200,16,46,0.12),transparent_60%)]" />

        <div className="relative mx-auto max-w-7xl px-6">
          <RegistrationForm />
        </div>
      </section>
    </main>
  );
}