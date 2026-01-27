import menu from "@/data/menu.json";
import site from "@/data/site.json";
import MenuThemeSaud from "@/components/MenuThemeSaud";

export default function MenuPage({ searchParams }) {
  // دعم مشاركة منيو عبر رابط (data=base64)
  let incoming = null;
  try {
    if (searchParams?.data) {
      const jsonStr = Buffer.from(searchParams.data, "base64").toString("utf-8");
      incoming = JSON.parse(jsonStr);
    }
  } catch (e) {
    incoming = null;
  }

  const m = incoming || menu;

  return (
    <MenuThemeSaud
      m={m}
      whatsappUrl={site?.links?.whatsapp || "https://wa.me/966532212529"}
    />
  );
}
