import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Search,
  MessageCircle,
  UserRound,
  Plus,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
} from "lucide-react";

import SectionTitle from "../components/common/SectionTitle";

import { getContacts } from "../../services/contacts";
import { sendWhatsAppMessage } from "../../services/whatsapp";

const ITEMS_PER_PAGE = 15;

const STATUS_FILTERS = [
  {
    value: "all",
    label: "Todos",
  },
  {
    value: "new_contact",
    label: "Novos contatos",
  },
  {
    value: "pending_confirmation",
    label: "Aguardando confirmação",
  },
  {
    value: "confirmed",
    label: "Confirmados",
  },
  {
    value: "follow_up",
    label: "Retornos",
  },
  {
    value: "waiting_list",
    label: "Lista de interesse",
  },
  {
    value: "enrolled",
    label: "Matriculados",
  },
  {
    value: "no_show",
    label: "Não compareceram",
  },
  {
    value: "lost",
    label: "Não convertidos",
  },
];

const STATUS_INFO = {
  new_contact: {
    label: "Novo contato",
    className: "bg-neutral-100 text-neutral-700 border-neutral-200",
  },

  pending_confirmation: {
    label: "Aguardando confirmação",
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },

  confirmed: {
    label: "Confirmado",
    className: "bg-blue-50 text-blue-700 border-blue-200",
  },

  attended: {
    label: "Compareceu",
    className: "bg-green-50 text-green-700 border-green-200",
  },

  no_show: {
    label: "Não compareceu",
    className: "bg-red-50 text-red-700 border-red-200",
  },

  follow_up: {
    label: "Retorno pendente",
    className: "bg-orange-50 text-orange-700 border-orange-200",
  },

  enrolled: {
    label: "Matriculado",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },

  lost: {
    label: "Não convertido",
    className: "bg-neutral-100 text-neutral-600 border-neutral-200",
  },

  waiting_list: {
    label: "Lista de interesse",
    className: "bg-purple-50 text-purple-700 border-purple-200",
  },
};

const SORT_OPTIONS = [
  {
    value: "first_contact_desc",
    label: "Primeiro contato — mais recente",
  },
  {
    value: "first_contact_asc",
    label: "Primeiro contato — mais antigo",
  },
  {
    value: "name_asc",
    label: "Atleta — A a Z",
  },
  {
    value: "name_desc",
    label: "Atleta — Z a A",
  },
];

function normalizeText(value) {
  return (value || "")
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function formatDate(date) {
  if (!date) return "—";

  const rawDate = date.toString();

  /*
   * first_contact_at pode vir como:
   * 2026-04-20
   * ou
   * 2026-04-20T14:30:00...
   */
  const datePart = rawDate.split("T")[0];

  const [year, month, day] = datePart.split("-");

  if (!year || !month || !day) {
    return "—";
  }

  return `${day}/${month}/${year}`;
}

function formatPhone(phone) {
  if (!phone) return "—";

  const numbers = phone.replace(/\D/g, "");

  let localPhone = numbers;

  if (numbers.startsWith("55") && numbers.length >= 12) {
    localPhone = numbers.slice(2);
  }

  if (localPhone.length === 11) {
    return localPhone.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  }

  if (localPhone.length === 10) {
    return localPhone.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  }

  return phone;
}

function openWhatsApp(phone) {
  if (!phone) return;

  const cleanPhone = phone.replace(/\D/g, "");

  const phoneWithCountry = cleanPhone.startsWith("55")
    ? cleanPhone
    : `55${cleanPhone}`;

  window.open(
    `https://wa.me/${phoneWithCountry}`,
    "_blank",
    "noopener,noreferrer",
  );
}

function getDateValue(value) {
  if (!value) return null;

  const timestamp = new Date(value).getTime();

  return Number.isNaN(timestamp) ? null : timestamp;
}

export default function Contacts() {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState("all");

  const [categoryFilter, setCategoryFilter] = useState("all");

  const [sourceFilter, setSourceFilter] = useState("all");

  const [sortBy, setSortBy] = useState("first_contact_desc");

  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    loadContacts();
  }, []);

  /*
   * Sempre que busca, filtro ou ordenação
   * mudar, voltamos para a página 1.
   */
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, categoryFilter, sourceFilter, sortBy]);

  async function loadContacts() {
    try {
      setLoading(true);
      setError("");

      const data = await getContacts();

      setContacts(data ?? []);
    } catch (err) {
      console.error("Erro ao carregar contatos:", err);

      setError("Não foi possível carregar os contatos.");
    } finally {
      setLoading(false);
    }
  }

  /*
   * Categorias existentes na própria base.
   * Assim não precisamos deixar Sub-07,
   * Sub-09 etc. fixos no código.
   */
  const categories = useMemo(() => {
    const values = contacts
      .map((contact) => contact.category?.name?.trim())
      .filter(Boolean);

    return [...new Set(values)].sort((a, b) =>
      a.localeCompare(b, "pt-BR", {
        numeric: true,
      }),
    );
  }, [contacts]);

  /*
   * Origens existentes na base.
   */
  const sources = useMemo(() => {
    const values = contacts
      .map((contact) => contact.source?.trim())
      .filter(Boolean);

    return [...new Set(values)].sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [contacts]);

  /*
   * Fluxo:
   *
   * 1. Base completa
   * 2. Busca
   * 3. Filtros
   * 4. Ordenação
   * 5. Paginação
   *
   * Dessa forma nunca ordenamos apenas
   * os 15 registros da página atual.
   */
  const filteredContacts = useMemo(() => {
    const normalizedSearch = normalizeText(search.trim());

    const result = contacts.filter((contact) => {
      const matchesStatus =
        statusFilter === "all" || contact.status === statusFilter;

      if (!matchesStatus) {
        return false;
      }

      const matchesCategory =
        categoryFilter === "all" || contact.category?.name === categoryFilter;

      if (!matchesCategory) {
        return false;
      }

      const matchesSource =
        sourceFilter === "all" || contact.source === sourceFilter;

      if (!matchesSource) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const searchableText = normalizeText(
        [
          contact.child_name,
          contact.responsible_name,
          contact.phone,
          contact.category?.name,
          contact.source,
          contact.neighborhood,
        ]
          .filter(Boolean)
          .join(" "),
      );

      return searchableText.includes(normalizedSearch);
    });

    return [...result].sort((a, b) => {
      if (sortBy === "first_contact_desc" || sortBy === "first_contact_asc") {
        const dateA = getDateValue(a.first_contact_at);

        const dateB = getDateValue(b.first_contact_at);

        /*
         * Registros sem primeiro contato
         * ficam no final da lista.
         */
        if (dateA === null && dateB === null) {
          return 0;
        }

        if (dateA === null) {
          return 1;
        }

        if (dateB === null) {
          return -1;
        }

        if (sortBy === "first_contact_asc") {
          return dateA - dateB;
        }

        return dateB - dateA;
      }

      const nameA = a.child_name || "";

      const nameB = b.child_name || "";

      if (sortBy === "name_desc") {
        return nameB.localeCompare(nameA, "pt-BR");
      }

      return nameA.localeCompare(nameB, "pt-BR");
    });
  }, [contacts, search, statusFilter, categoryFilter, sourceFilter, sortBy]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredContacts.length / ITEMS_PER_PAGE),
  );

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;

  const endIndex = startIndex + ITEMS_PER_PAGE;

  const paginatedContacts = filteredContacts.slice(startIndex, endIndex);

  const hasSecondaryFilters =
    categoryFilter !== "all" || sourceFilter !== "all";

  function clearSecondaryFilters() {
    setCategoryFilter("all");
    setSourceFilter("all");
  }

  function goToPreviousPage() {
    setCurrentPage((page) => Math.max(1, page - 1));

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function goToNextPage() {
    setCurrentPage((page) => Math.min(totalPages, page + 1));

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  return (
    <div className="space-y-8">
      {/* CABEÇALHO */}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <SectionTitle
          title="Contatos"
          description="Gerencie todos os atletas e famílias da unidade."
        />

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={loadContacts}
            className="
              flex
              items-center
              gap-2
              rounded-xl
              border
              border-neutral-200
              bg-white
              px-4
              py-3
              text-sm
              font-semibold
              text-neutral-700
              transition
              hover:bg-neutral-50
            "
          >
            <RefreshCw size={17} />
            Atualizar
          </button>

          <button
            type="button"
            className="
              flex
              items-center
              gap-2
              rounded-xl
              bg-inter-red
              px-5
              py-3
              text-sm
              font-semibold
              text-white
              transition
              hover:bg-[#a80e24]
            "
          >
            <Plus size={18} />
            Novo contato
          </button>
        </div>
      </div>

      {/* BUSCA E FILTROS */}

      <div
        className="
          rounded-3xl
          border
          border-neutral-200
          bg-white
          p-5
          shadow-sm
        "
      >
        {/* BUSCA */}

        <div className="relative">
          <Search
            size={19}
            className="
              absolute
              left-4
              top-1/2
              -translate-y-1/2
              text-neutral-400
            "
          />

          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar atleta, responsável, telefone, categoria ou origem..."
            className="
              w-full
              rounded-xl
              border
              border-neutral-200
              bg-white
              py-3
              pl-12
              pr-4
              text-sm
              text-neutral-900
              outline-none
              transition
              placeholder:text-neutral-400
              focus:border-inter-red
              focus:ring-2
              focus:ring-inter-red/10
            "
          />
        </div>

        {/* STATUS */}

        <div className="mt-5 flex flex-wrap gap-2">
          {STATUS_FILTERS.map((filter) => {
            const active = statusFilter === filter.value;

            return (
              <button
                key={filter.value}
                type="button"
                onClick={() => setStatusFilter(filter.value)}
                className={`
                  rounded-full
                  px-4
                  py-2
                  text-sm
                  font-semibold
                  transition
                  ${
                    active
                      ? "bg-neutral-900 text-white"
                      : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                  }
                `}
              >
                {filter.label}
              </button>
            );
          })}
        </div>

        {/* FILTROS COMERCIAIS */}

        <div
          className="
            mt-5
            border-t
            border-neutral-100
            pt-5
          "
        >
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-neutral-700">
              <SlidersHorizontal size={17} />
              Filtros comerciais
            </div>

            {hasSecondaryFilters && (
              <button
                type="button"
                onClick={clearSecondaryFilters}
                className="
                  text-sm
                  font-semibold
                  text-inter-red
                  hover:underline
                "
              >
                Limpar filtros
              </button>
            )}
          </div>

          <div
            className="
              grid
              gap-3
              md:grid-cols-3
            "
          >
            {/* CATEGORIA */}

            <FilterField label="Categoria">
              <select
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
                className="
                  w-full
                  rounded-xl
                  border
                  border-neutral-200
                  bg-white
                  px-4
                  py-3
                  text-sm
                  text-neutral-700
                  outline-none
                  transition
                  focus:border-inter-red
                  focus:ring-2
                  focus:ring-inter-red/10
                "
              >
                <option value="all">Todas as categorias</option>

                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </FilterField>

            {/* ORIGEM */}

            <FilterField label="Origem">
              <select
                value={sourceFilter}
                onChange={(event) => setSourceFilter(event.target.value)}
                className="
                  w-full
                  rounded-xl
                  border
                  border-neutral-200
                  bg-white
                  px-4
                  py-3
                  text-sm
                  text-neutral-700
                  outline-none
                  transition
                  focus:border-inter-red
                  focus:ring-2
                  focus:ring-inter-red/10
                "
              >
                <option value="all">Todas as origens</option>

                {sources.map((source) => (
                  <option key={source} value={source}>
                    {source}
                  </option>
                ))}
              </select>
            </FilterField>

            {/* ORDENAÇÃO */}

            <FilterField label="Ordenar por">
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
                className="
                  w-full
                  rounded-xl
                  border
                  border-neutral-200
                  bg-white
                  px-4
                  py-3
                  text-sm
                  text-neutral-700
                  outline-none
                  transition
                  focus:border-inter-red
                  focus:ring-2
                  focus:ring-inter-red/10
                "
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </FilterField>
          </div>
        </div>
      </div>

      {/* CONTADOR */}

      {!loading && !error && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-neutral-500">
            <strong className="text-neutral-800">
              {filteredContacts.length}
            </strong>{" "}
            contato
            {filteredContacts.length !== 1 ? "s" : ""} encontrado
            {filteredContacts.length !== 1 ? "s" : ""}
          </p>

          {filteredContacts.length > 0 && (
            <p className="text-sm text-neutral-400">
              Mostrando {startIndex + 1}–
              {Math.min(endIndex, filteredContacts.length)} de{" "}
              {filteredContacts.length}
            </p>
          )}
        </div>
      )}

      {/* LOADING */}

      {loading && (
        <div
          className="
            rounded-3xl
            border
            border-neutral-200
            bg-white
            py-20
            text-center
            text-neutral-500
          "
        >
          Carregando contatos...
        </div>
      )}

      {/* ERRO */}

      {!loading && error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <p className="font-medium text-red-700">{error}</p>

          <button
            type="button"
            onClick={loadContacts}
            className="
              mt-4
              rounded-xl
              bg-red-600
              px-5
              py-2
              font-semibold
              text-white
            "
          >
            Tentar novamente
          </button>
        </div>
      )}

      {/* LISTA */}

      {!loading && !error && (
        <>
          <div className="space-y-4">
            {paginatedContacts.map((contact) => {
              const status = STATUS_INFO[contact.status] ?? {
                label: contact.status || "Sem status",

                className: "bg-neutral-100 text-neutral-600 border-neutral-200",
              };

              return (
                <div
                  key={contact.id}
                  className="
                      rounded-3xl
                      border
                      border-neutral-200
                      bg-white
                      p-6
                      shadow-sm
                      transition
                      hover:shadow-md
                    "
                >
                  {/* TOPO */}

                  <div className="flex flex-wrap items-start justify-between gap-5">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-xl font-bold text-neutral-900">
                          {contact.child_name || "Nome não informado"}
                        </h3>

                        <span
                          className={`
                              rounded-full
                              border
                              px-3
                              py-1
                              text-xs
                              font-semibold
                              ${status.className}
                            `}
                        >
                          {status.label}
                        </span>
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-neutral-500">
                        {contact.category?.name && (
                          <span className="font-semibold text-neutral-700">
                            {contact.category.name}
                          </span>
                        )}

                        {contact.category?.name && contact.source && (
                          <span>•</span>
                        )}

                        {contact.source && <span>{contact.source}</span>}
                      </div>
                    </div>

                    {/* AÇÕES */}

                    <div className="flex flex-wrap gap-2">
                   <button
  type="button"
  onClick={async () => {
    try {
      const response = await sendWhatsAppMessage({
        phone: contact.phone,
        message: "Olá! Esta é uma mensagem de teste 🚀",
      });

      console.log(response);

      alert("Mensagem enviada!");
    } catch (err) {
      console.error(err);

      alert("Erro ao enviar mensagem.");
    }
  }}
  className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold"
>
  <MessageCircle size={17} />
  Enviar WhatsApp
</button>

                      <button
                        type="button"
                        onClick={() =>
                          navigate(`/admin/contacts/${contact.id}`)
                        }
                        className="
    flex
    items-center
    gap-2
    rounded-xl
    bg-neutral-900
    px-4
    py-2.5
    text-sm
    font-semibold
    text-white
    transition
    hover:bg-neutral-800
  "
                      >
                        <UserRound size={17} />
                        Ver contato
                      </button>
                    </div>
                  </div>

                  {/* INFORMAÇÕES */}

                  <div
                    className="
                        mt-6
                        grid
                        gap-5
                        border-t
                        border-neutral-100
                        pt-5
                        sm:grid-cols-2
                        lg:grid-cols-4
                      "
                  >
                    <Info
                      label="Responsável"
                      value={contact.responsible_name || "—"}
                    />

                    <Info label="WhatsApp" value={formatPhone(contact.phone)} />

                    <Info
                      label="Primeiro contato"
                      value={formatDate(contact.first_contact_at)}
                    />

                    <Info label="Origem" value={contact.source || "—"} />
                  </div>

                  {/* EXPERIMENTAL, SE EXISTIR */}

                  {contact.experimental_date && (
                    <div
                      className="
                          mt-4
                          rounded-xl
                          bg-neutral-50
                          px-4
                          py-3
                          text-sm
                          text-neutral-600
                        "
                    >
                      Experimental:{" "}
                      <strong className="text-neutral-800">
                        {formatDate(contact.experimental_date)}
                      </strong>
                    </div>
                  )}
                </div>
              );
            })}

            {/* SEM RESULTADOS */}

            {filteredContacts.length === 0 && (
              <div
                className="
                  rounded-3xl
                  border
                  border-dashed
                  border-neutral-300
                  bg-white
                  p-12
                  text-center
                "
              >
                <p className="font-semibold text-neutral-800">
                  Nenhum contato encontrado.
                </p>

                <p className="mt-2 text-sm text-neutral-500">
                  Tente alterar a busca ou selecionar outros filtros.
                </p>
              </div>
            )}
          </div>

          {/* PAGINAÇÃO */}

          {filteredContacts.length > ITEMS_PER_PAGE && (
            <div
              className="
                flex
                flex-wrap
                items-center
                justify-between
                gap-4
                rounded-2xl
                border
                border-neutral-200
                bg-white
                px-5
                py-4
              "
            >
              <p className="text-sm text-neutral-500">
                Mostrando{" "}
                <strong className="text-neutral-800">{startIndex + 1}</strong>
                {" – "}
                <strong className="text-neutral-800">
                  {Math.min(endIndex, filteredContacts.length)}
                </strong>
                {" de "}
                <strong className="text-neutral-800">
                  {filteredContacts.length}
                </strong>
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                  aria-label="Página anterior"
                  className="
                    flex
                    h-10
                    w-10
                    items-center
                    justify-center
                    rounded-xl
                    border
                    border-neutral-200
                    bg-white
                    transition
                    hover:bg-neutral-50
                    disabled:cursor-not-allowed
                    disabled:opacity-40
                  "
                >
                  <ChevronLeft size={18} />
                </button>

                <div className="min-w-[120px] text-center text-sm font-semibold text-neutral-700">
                  Página {currentPage} de {totalPages}
                </div>

                <button
                  type="button"
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  aria-label="Próxima página"
                  className="
                    flex
                    h-10
                    w-10
                    items-center
                    justify-center
                    rounded-xl
                    border
                    border-neutral-200
                    bg-white
                    transition
                    hover:bg-neutral-50
                    disabled:cursor-not-allowed
                    disabled:opacity-40
                  "
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function FilterField({ label, children }) {
  return (
    <div>
      <label
        className="
          mb-2
          block
          text-xs
          font-semibold
          uppercase
          tracking-wide
          text-neutral-400
        "
      >
        {label}
      </label>

      {children}
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <p
        className="
          text-xs
          font-medium
          uppercase
          tracking-wide
          text-neutral-400
        "
      >
        {label}
      </p>

      <p className="mt-1 font-semibold text-neutral-800">{value || "—"}</p>
    </div>
  );
}
