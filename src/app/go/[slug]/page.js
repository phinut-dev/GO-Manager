import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import GoRegisterForm from "@/components/GoRegisterForm";
import { formatRupiah, formatDate } from "@/lib/format";

async function getGo(slug) {
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_public_go", { p_slug: slug });
  return data?.[0] ?? null;
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const go = await getGo(slug);
  if (!go) return { title: "GO tidak ditemukan" };

  const description =
    go.description?.slice(0, 150) || `Group Order ${formatRupiah(go.price)}`;

  return {
    title: go.title,
    description,
    openGraph: {
      title: go.title,
      description,
      images: go.image_url ? [go.image_url] : [],
    },
    twitter: {
      card: go.image_url ? "summary_large_image" : "summary",
      title: go.title,
      description,
      images: go.image_url ? [go.image_url] : [],
    },
  };
}

export default async function PublicGoPage({ params }) {
  const { slug } = await params;
  const go = await getGo(slug);
  if (!go) notFound();

  const supabase = await createClient();
  const { data: store } = await supabase
    .from("store_settings")
    .select("name, logo_url, whatsapp_contact")
    .eq("id", 1)
    .single();

  return (
    <main className="mx-auto max-w-xl space-y-5 px-4 py-8">
      <header className="flex items-center gap-3">
        {store?.logo_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={store.logo_url}
            alt={store.name}
            className="h-10 w-10 rounded-full object-cover"
          />
        )}
        <p className="font-bold">{store?.name ?? "GO Manager"}</p>
      </header>

      <section className="overflow-hidden rounded-2xl border border-line bg-surface shadow-soft">
        {go.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={go.image_url}
            alt={go.title}
            className="max-h-96 w-full object-cover"
          />
        )}
        <div className="space-y-2 p-5">
          <h1 className="text-2xl font-bold">{go.title}</h1>
          <p className="text-xl font-semibold text-brand-700">
            {formatRupiah(go.price)}
          </p>
          {go.description && (
            <p className="whitespace-pre-line text-muted">{go.description}</p>
          )}
          <p className="text-sm text-muted">
            Tutup: {formatDate(go.close_date)}
          </p>
        </div>
      </section>

      <GoRegisterForm initial={go} whatsapp={store?.whatsapp_contact ?? null} />
    </main>
  );
}
