// Rótulo + campo. É uma div (não <label>) porque alguns campos são
// grupos de botões, e um <label> repassaria o clique ao primeiro deles.
export default function FormField({ label, children }) {
  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-ink">{label}</p>
      {children}
    </div>
  );
}
