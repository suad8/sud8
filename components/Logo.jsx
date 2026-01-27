export default function Logo({ className = "h-8 w-auto" }) {
  return (
    <div className={"inline-flex items-center gap-2 " + className}>
      <img src="/logo.svg" alt="منيو سعود" className="h-8 w-8" />
      <div className="leading-tight">
        <div className="text-base font-extrabold">منيو سعود</div>
        <div className="text-[11px] text-white/60 -mt-0.5">Menu Saud</div>
      </div>
    </div>
  );
}
