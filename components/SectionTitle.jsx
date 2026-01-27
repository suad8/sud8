export default function SectionTitle({ title, subtitle }) {
  return (
    <div>
      <h2 className="text-xl md:text-2xl font-extrabold">{title}</h2>
      {subtitle ? <p className="mt-2 text-white/70">{subtitle}</p> : null}
    </div>
  );
}
