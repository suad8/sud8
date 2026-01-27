"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Home, UtensilsCrossed, Sparkles, Tags, Briefcase, PhoneCall } from "lucide-react";
import Logo from "@/components/Logo";

const links = [
  { href: "/", label: "الرئيسية", icon: Home },
  { href: "/menu", label: "المنيو", icon: UtensilsCrossed },
  { href: "/builder", label: "اصنع منيو", icon: Sparkles },
  { href: "/packages", label: "الباقات", icon: Tags },
  { href: "/work", label: "الأعمال", icon: Briefcase },
  { href: "/contact", label: "تواصل", icon: PhoneCall },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#050914]/70 backdrop-blur">
      <div className="container py-3 flex items-center justify-between gap-3">
        <a href="/" className="hover:opacity-95 transition">
          <Logo />
        </a>

        <nav className="hidden md:flex items-center gap-1">
          {links.map((l) => {
            const Icon = l.icon;
            return (
              <a key={l.href} href={l.href} className="btn px-3 py-2">
                <Icon size={18} />
                {l.label}
              </a>
            );
          })}
        </nav>

        <button className="md:hidden btn" onClick={() => setOpen((v) => !v)} aria-label="menu">
          {open ? <X /> : <Menu />}
        </button>
      </div>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden border-t border-white/10 bg-[#050914]/85"
          >
            <div className="container py-3 grid gap-2">
              {links.map((l) => {
                const Icon = l.icon;
                return (
                  <a key={l.href} href={l.href} className="btn justify-start" onClick={() => setOpen(false)}>
                    <Icon size={18} />
                    {l.label}
                  </a>
                );
              })}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
