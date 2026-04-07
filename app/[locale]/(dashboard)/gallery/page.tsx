import { setRequestLocale, getTranslations } from "next-intl/server";
import { listPhotos } from "@/lib/storage";
import { PhotoGrid } from "@/components/gallery/PhotoGrid";

export default async function GalleryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("gallery");

  const photos = await listPhotos();

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 space-y-6">
      <h1 className="font-serif text-4xl font-light">{t("title")}</h1>
      {photos.length === 0 ? (
        <p className="text-muted-foreground">{t("noPhotos")}</p>
      ) : (
        <PhotoGrid photos={photos} />
      )}
    </div>
  );
}
