"use client";

import { useEffect, useState } from "react";
import { FileUp, Trash2, Upload } from "lucide-react";
import { FormField, inputClassName, PageBody, PageHeader, Panel } from "@/components/ui/Page";
import {
  createDocument,
  deleteDocument,
  listDocuments,
  type PdfDocumentResponse,
} from "@/lib/api";

export function DocumentsPage() {
  const [docs, setDocs] = useState<PdfDocumentResponse[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = async () => setDocs(await listDocuments());

  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!file || !title.trim() || !description.trim()) {
      setError("Judul, deskripsi, dan file PDF wajib diisi.");
      return;
    }

    const form = new FormData();
    form.append("title", title.trim());
    form.append("description", description.trim());
    form.append("file", file);
    setLoading(true);
    setError("");

    try {
      await createDocument(form);
      setTitle("");
      setDescription("");
      setFile(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengunggah dokumen");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Perpustakaan referensi"
        description="Simpan dokumen klinis penting, lalu indekskan agar bisa dipakai sebagai konteks asesmen."
      />
      <PageBody className="grid grid-cols-1 gap-6 lg:grid-cols-[360px_1fr]">
        <Panel className="p-5">
          <form onSubmit={submit} className="space-y-4">
            <h2 className="font-display text-2xl text-ink-900">Tambah referensi</h2>
            <FormField label="Judul dokumen">
              <input
                className={inputClassName}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
            </FormField>
            <FormField label="Deskripsi dokumen">
              <textarea
                className={inputClassName}
                rows={3}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </FormField>
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-ink-200 bg-ink-50 px-3 py-4 text-sm text-ink-500">
            <FileUp size={16} />
            <span>{file ? file.name : "Pilih file PDF"}</span>
            <input
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(event) => setFile(event.target.files?.[0] || null)}
            />
          </label>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <button
            disabled={loading || !file || !title.trim() || !description.trim()}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sage-800 via-sage-700 to-sage-600 px-4 py-2.5 text-sm font-medium text-white shadow-[0_14px_32px_rgba(31,82,146,0.22)] hover:from-sage-900 hover:via-sage-800 hover:to-sage-700 disabled:border disabled:border-sage-100 disabled:bg-none disabled:bg-sage-50/80 disabled:text-sage-300 disabled:shadow-none"
          >
            <Upload size={14} />
            {loading ? "Sedang mengindeks..." : "Unggah & indekskan"}
          </button>
          </form>
        </Panel>

        <Panel className="p-5">
          <h2 className="mb-4 text-sm font-medium text-ink-800">Referensi aktif</h2>
        <div className="space-y-3">
          {docs.map((doc) => (
            <article key={doc.id} className="flex items-start justify-between gap-3 rounded-lg border border-ink-100 p-4">
              <div>
                <h3 className="font-medium text-ink-800">{doc.title}</h3>
                <p className="text-xs text-ink-400">
                  {doc.original_filename} - {(doc.file_size / 1024 / 1024).toFixed(2)} MB
                </p>
                {doc.description && <p className="mt-2 text-sm text-ink-500">{doc.description}</p>}
              </div>
              <button
                onClick={async () => {
                  await deleteDocument(doc.id);
                  await load();
                }}
                className="rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50"
                title="Hapus PDF"
              >
                <Trash2 size={15} />
              </button>
            </article>
          ))}
        </div>
        </Panel>
      </PageBody>
    </>
  );
}
