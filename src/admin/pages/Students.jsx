import { useEffect, useState } from "react";

import SectionTitle from "../components/common/SectionTitle";
import EmptyState from "../components/common/EmptyState";

import ContactCard from "../components/contacts/ContactCard";
import ContactFilters from "../components/contacts/ContactFilters";
import ContactModal from "../components/contacts/ContactModal";
import ContactForm from "../components/contacts/ContactForm";

import { getContacts } from "../../services/contacts";

export default function Students() {
  const [contacts, setContacts] = useState([]);
  const [openModal, setOpenModal] = useState(false);

  useEffect(() => {
    loadContacts();
  }, []);

  async function loadContacts() {
    try {
      const data = await getContacts();
      setContacts(data);
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <div className="space-y-8">
      <SectionTitle
        title="Contatos"
        description="Gerencie todos os contatos desde o primeiro atendimento até a matrícula."
      />

      <ContactFilters onNewContact={() => setOpenModal(true)} />

      <ContactModal open={openModal} onClose={() => setOpenModal(false)}>
        <ContactForm
          onSuccess={() => {
            loadContacts();
            setOpenModal(false);
          }}
          onCancel={() => setOpenModal(false)}
        />
      </ContactModal>

      <div className="space-y-5">
        {contacts.length === 0 ? (
          <EmptyState
            title="Nenhum contato cadastrado"
            description="Clique em 'Novo Contato' para começar."
          />
        ) : (
          contacts.map((contact) => (
            <ContactCard key={contact.id} contact={contact} />
          ))
        )}
      </div>
    </div>
  );
}
