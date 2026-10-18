import { useState } from "react";
import { Outlet } from "react-router-dom";

import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

import NewContactModal from "../components/contacts/NewContactModal";

export default function Layout() {
  const [newContactOpen, setNewContactOpen] =
    useState(false);

  // Muda a cada contato criado, para as páginas recarregarem
  const [contactsVersion, setContactsVersion] =
    useState(0);

  return (
    <div className="flex">
      <Sidebar />

      <div className="min-h-screen flex-1 bg-neutral-50">
        <Topbar
          onNewContact={() =>
            setNewContactOpen(true)
          }
        />

        <main className="p-10">
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
    </div>
  );
}
