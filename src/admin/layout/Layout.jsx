import { useState } from "react";
import { Outlet } from "react-router-dom";

import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

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

  return (
    <div className="flex min-h-screen">
      <Sidebar
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
      />

      <div className="min-w-0 flex-1 bg-neutral-50">
        <Topbar
          onNewContact={() =>
            setNewContactOpen(true)
          }
          onOpenMenu={() => setMenuOpen(true)}
        />

        <main className="p-4 sm:p-6 lg:p-10">
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
