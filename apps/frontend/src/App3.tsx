import { useEffect, useState } from "react";
import type { Course, CourseWorkWithSubmission, SubmissionAttachmentItem } from "shared";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? "http://localhost:3000";

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function formatDueDate(dueDate?: { year: number; month: number; day: number }) {
  if (!dueDate) return "Tidak ada deadline";
  return new Date(dueDate.year, dueDate.month - 1, dueDate.day).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function stateLabel(state?: string) {
  const map: Record<
    string,
    { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
  > = {
    TURNED_IN: { label: "Dikumpulkan", variant: "default" },
    RETURNED: { label: "Dinilai", variant: "secondary" },
    CREATED: { label: "Belum Dikumpulkan", variant: "destructive" },
    NEW: { label: "Belum Dimulai", variant: "outline" },
    RECLAIMED_BY_STUDENT: { label: "Ditarik Kembali", variant: "outline" },
  };
  return map[state ?? ""] ?? { label: state ?? "–", variant: "outline" };
}

// ─────────────────────────────────────────────
// Sub-komponen: satu kartu tugas
// ─────────────────────────────────────────────

function AttachmentLink({ att }: { att: SubmissionAttachmentItem }) {
  if (att.driveFile) {
    return (
      <a
        href={att.driveFile.alternateLink}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1 text-blue-600 hover:underline text-sm"
      >
        📄 {att.driveFile.title}
      </a>
    );
  }
  if (att.link) {
    return (
      <a
        href={att.link.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1 text-blue-600 hover:underline text-sm"
      >
        🔗 {att.link.title || att.link.url}
      </a>
    );
  }
  if (att.youtubeVideo) {
    return (
      <a
        href={att.youtubeVideo.alternateLink}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1 text-red-600 hover:underline text-sm"
      >
        ▶ {att.youtubeVideo.title}
      </a>
    );
  }
  if (att.form) {
    return (
      <a
        href={att.form.responseUrl || att.form.formUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1 text-green-600 hover:underline text-sm"
      >
        📝 {att.form.title}
      </a>
    );
  }
  return null;
}

function CourseWorkCard({ item }: { item: CourseWorkWithSubmission }) {
  const { courseWork, submission } = item;
  const { label, variant } = stateLabel(submission?.state);

  const attachments = submission?.assignmentSubmission?.attachments ?? [];
  const score = submission?.assignedGrade ?? submission?.draftGrade;

  return (
    <Card className="flex flex-col h-full shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      <CardHeader className="pb-2 shrink-0">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base leading-snug wrap-break-word min-w-0">
            {courseWork.title}
          </CardTitle>
          <Badge variant={variant} className="shrink-0 whitespace-nowrap">
            {label}
          </Badge>
        </div>
        <CardDescription className="text-xs mt-1">
          🗓 {formatDueDate(courseWork.dueDate)}
        </CardDescription>
      </CardHeader>

      <Separator className="shrink-0" />

      <ScrollArea className="flex-1 min-h-0">
        <CardContent className="flex flex-col gap-3 pt-3 pb-4">
          {/* Deskripsi tugas */}
          {courseWork.description && (
            <div className="flex flex-col gap-1">
              <p className="text-xs font-semibold text-muted-foreground">DESKRIPSI</p>
              <p className="text-sm text-foreground whitespace-pre-wrap wrap-break-word line-clamp-4">
                {courseWork.description}
              </p>
            </div>
          )}

          {/* Lampiran soal */}
          {courseWork.materials && courseWork.materials.length > 0 && (
            <div className="flex flex-col gap-1">
              <p className="text-xs font-semibold text-muted-foreground">LAMPIRAN TUGAS</p>
              <div className="flex flex-col gap-1">
                {courseWork.materials.map((mat, i) => {
                  const att: SubmissionAttachmentItem = {
                    driveFile: mat.driveFile?.driveFile,
                    link: mat.link,
                    youtubeVideo: mat.youtubeVideo,
                    form: mat.form
                      ? { formUrl: mat.form.formUrl, title: mat.form.title, responseUrl: "" }
                      : undefined,
                  };
                  return <AttachmentLink key={i} att={att} />;
                })}
              </div>
            </div>
          )}

          {/* Skor */}
          {submission && (
            <div className="flex items-center gap-2 shrink-0">
              <p className="text-xs font-semibold text-muted-foreground shrink-0">SKOR</p>
              {score !== undefined ? (
                <span className="text-sm font-bold text-primary">
                  {score} / {courseWork.maxPoints ?? "–"}
                </span>
              ) : (
                <span className="text-sm text-muted-foreground">Belum dinilai</span>
              )}
            </div>
          )}

          {/* Lampiran submisi mahasiswa */}
          {attachments.length > 0 && (
            <div className="flex flex-col gap-1">
              <p className="text-xs font-semibold text-muted-foreground">LAMPIRAN SUBMISI KAMU</p>
              <div className="flex flex-col gap-1">
                {attachments.map((att, i) => (
                  <AttachmentLink key={i} att={att} />
                ))}
              </div>
            </div>
          )}

          {/* Short answer */}
          {submission?.shortAnswerSubmission?.answer && (
            <div className="flex flex-col gap-1">
              <p className="text-xs font-semibold text-muted-foreground">JAWABAN SINGKATMU</p>
              <p className="text-sm italic wrap-break-word">
                "{submission.shortAnswerSubmission.answer}"
              </p>
            </div>
          )}

          {/* Late badge */}
          {submission?.late && (
            <div className="pt-1">
              <Badge variant="destructive" className="w-fit text-xs">
                ⚠ Terlambat
              </Badge>
            </div>
          )}
        </CardContent>
      </ScrollArea>
    </Card>
  );
}

// ─────────────────────────────────────────────
// Main App
// ─────────────────────────────────────────────

export default function App() {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [items, setItems] = useState<CourseWorkWithSubmission[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cek status login
  useEffect(() => {
    fetch(`${BACKEND_URL}/auth/me`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setLoggedIn(d.loggedIn))
      .catch(() => setLoggedIn(false));
  }, []);

  // Load daftar courses setelah login
  useEffect(() => {
    if (!loggedIn) return;
    fetch(`${BACKEND_URL}/classroom/courses`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setCourses(d.data ?? []));
  }, [loggedIn]);

  // Load submissions ketika course dipilih
  const loadSubmissions = async (courseId: string) => {
    setSelectedCourse(courseId);
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/classroom/courses/${courseId}/submissions`, {
        credentials: "include",
      });
      const d = await res.json();
      if (d.error) throw new Error(d.error);
      setItems(d.data ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Terjadi error");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    window.location.href = `${BACKEND_URL}/auth/login`;
  };

  const handleLogout = async () => {
    await fetch(`${BACKEND_URL}/auth/logout`, { method: "POST", credentials: "include" });
    setLoggedIn(false);
    setCourses([]);
    setItems([]);
    setSelectedCourse(null);
  };

  // ── Render ──

  if (loggedIn === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Memuat...</p>
      </div>
    );
  }

  if (!loggedIn) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <h1 className="text-2xl font-bold">Google Classroom Viewer</h1>
        <p className="text-muted-foreground">Login dengan akun Google kampus kamu</p>
        <Button onClick={handleLogin} size="lg">
          🎓 Login dengan Google
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">📚 Google Classroom Viewer</h1>
        <Button variant="outline" onClick={handleLogout}>
          Logout
        </Button>
      </div>

      {/* Pilih Course */}
      <div className="mb-6">
        <p className="text-sm font-semibold text-muted-foreground mb-2">PILIH MATA KULIAH</p>
        <div className="flex flex-wrap gap-2">
          {courses.length === 0 && (
            <p className="text-sm text-muted-foreground">Tidak ada mata kuliah ditemukan.</p>
          )}
          {courses.map((c) => (
            <Button
              key={c.id}
              variant={selectedCourse === c.id ? "default" : "outline"}
              size="sm"
              onClick={() => loadSubmissions(c.id)}
            >
              {c.name}
              {c.section && <span className="ml-1 text-xs opacity-70">· {c.section}</span>}
            </Button>
          ))}
        </div>
      </div>

      <Separator className="mb-6" />

      {/* Status / error */}
      {error && (
        <div className="mb-4 p-3 rounded bg-destructive/10 text-destructive text-sm">{error}</div>
      )}

      {loading && (
        <div className="text-center py-12 text-muted-foreground">Mengambil data tugas...</div>
      )}

      {/* Grid tugas */}
      {!loading && items.length > 0 && (
        <>
          <p className="text-sm text-muted-foreground mb-4">{items.length} tugas ditemukan</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {items.map((item) => (
              <CourseWorkCard key={item.courseWork.id} item={item} />
            ))}
          </div>
        </>
      )}

      {!loading && selectedCourse && items.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          Tidak ada tugas di mata kuliah ini.
        </div>
      )}
    </div>
  );
}
