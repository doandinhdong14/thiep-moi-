import Link from "next/link";
import prisma from "@/lib/prisma";
import { Sparkles, ArrowRight } from "lucide-react";
import { getEffectiveVisibleTemplates } from "@/lib/templates/adminConfig";

export const dynamic = "force-dynamic";

export default async function OccasionsPage() {
  const [categories, visibleTemplates] = await Promise.all([
    prisma.occasionCategory.findMany({
      where: { active: true },
      include: {
        occasions: {
          where: { active: true },
          orderBy: { sortOrder: "asc" },
        },
      },
      orderBy: { sortOrder: "asc" },
    }),
    getEffectiveVisibleTemplates(),
  ]);

  const activeOccasionKeys = new Set<string>(visibleTemplates.map((t) => t.occasionKey));

  return (
    <div className="flex-1 bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-100 text-rose-800 text-xs font-semibold">
            <Sparkles className="w-4 h-4 text-rose-600" />
            <span>Danh Mục Sự Kiện Toàn Diện</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-slate-900">
            Khám phá thiệp mời theo từng dịp đặc biệt
          </h1>
          <p className="text-slate-600 text-sm sm:text-base">
            Mỗi khoảnh khắc đều xứng đáng được tôn vinh với thiết kế riêng biệt, biểu mẫu chuẩn xác và lời chúc chân thành.
          </p>
        </div>

        <div className="space-y-12">
          {categories.map((cat) => (
            <div key={cat.id} className="space-y-6">
              <div className="flex items-center gap-3 border-b border-rose-100 pb-3">
                <div className="w-8 h-8 rounded-lg bg-rose-500 text-white flex items-center justify-center font-bold text-sm">
                  {cat.title.charAt(0)}
                </div>
                <h2 className="text-xl font-serif font-bold text-slate-900">{cat.title}</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {cat.occasions.map((occ) => {
                  const isReady = activeOccasionKeys.has(occ.formPresetKey);
                  return (
                    <div
                      key={occ.id}
                      className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:border-rose-300 hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                              isReady ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {isReady ? "Sẵn sàng tạo" : "Sắp ra mắt"}
                          </span>
                        </div>
                        <h3 className="font-bold text-slate-800 text-sm">{occ.title}</h3>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                        {isReady ? (
                          <Link
                            href={`/occasions/${occ.slug}`}
                            className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1"
                          >
                            <span>Xem mẫu thiệp</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        ) : (
                          <span className="text-xs text-slate-400">Đang cập nhật mẫu</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

