import { useState } from "react";
import { Outlet } from "react-router-dom";

import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import usePendingCounts from "./usePendingCounts";

import NewContactModal from "../components/contacts/NewContactModal";
import Toaster from "../components/common/Toaster";

export default function Layout() {
  const [newContactOpen, setNewContactOpen] =
    useState(false);

  // Gaveta do menu no celular
  const [menuOpen, setMenuOpen] =
    useState(false);

  // Muda a cada contato criado, para as páginas recarregarem
  const [contactsVersion, setContactsVersion] =
    useState(0);

  // Contadores do menu (pendências da Visão geral)
  const pending = usePendingCounts(contactsVersion);

  return (
    <div className="flex min-h-screen">
      <Sidebar
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        pending={pending}
      />

      <div className="min-w-0 flex-1 bg-canvas text-ink">
        <Topbar onOpenMenu={() => setMenuOpen(true)} />

        <main className="mx-auto max-w-[1400px] p-4 sm:p-6 lg:px-10 lg:py-8">
          <Outlet
            context={{
              openNewContact: () => setNewContactOpen(true),
              contactsVersion,
            }}
          />
        </main>
      </div>

      <NewContactModal
        open={newContactOpen}
        onClose={() =>
          setNewContactOpen(false)
        }
        onCreated={() =>
          setContactsVersion((current) => current + 1)
        }
      />

      <Toaster />
    </div>
  );
}
