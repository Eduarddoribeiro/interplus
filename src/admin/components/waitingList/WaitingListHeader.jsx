import SectionTitle from "../common/SectionTitle";

export default function WaitingListHeader({ total }) {
  return (
    <SectionTitle
      title="Lista de Interesse"
      description={`${total} famílias aguardando vaga, nova turma ou oportunidade.`}
    />
  );
}