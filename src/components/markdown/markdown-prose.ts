import { cn } from "@/lib/utils";

/** Long-form reading styles for document + note markdown previews. */
export const MARKDOWN_PROSE = cn(
  "mx-auto max-w-4xl min-w-0 text-[15px] leading-7 break-words text-foreground/90 [overflow-wrap:anywhere]",
  "[&_h1]:scroll-mt-4 [&_h2]:scroll-mt-4 [&_h3]:scroll-mt-4 [&_h1]:mt-0 [&_h1]:mb-5 [&_h1]:border-b [&_h1]:pb-3 [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:tracking-tight [&_h1]:text-foreground",
  "[&_h2]:mt-8 [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-foreground",
  "[&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-foreground",
  "[&_p]:mb-4 [&_li]:mb-1.5 [&_li::marker]:text-muted-foreground",
  "[&_strong]:font-semibold [&_strong]:text-foreground",
  "[&_blockquote]:my-5 [&_blockquote]:rounded-r-lg [&_blockquote]:border-l-4 [&_blockquote]:border-primary/40 [&_blockquote]:bg-muted/50 [&_blockquote]:py-2 [&_blockquote]:pr-4 [&_blockquote]:pl-4 [&_blockquote]:italic",
  "[&_pre]:my-5 [&_pre]:max-w-full [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:border [&_pre]:bg-muted/60 [&_pre]:p-4 [&_pre]:text-[13px] [&_pre]:leading-6 [&_pre]:[overflow-wrap:normal]",
  "[&_:not(pre)>code]:rounded-md [&_:not(pre)>code]:border [&_:not(pre)>code]:bg-muted/60 [&_:not(pre)>code]:px-1.5 [&_:not(pre)>code]:py-0.5 [&_:not(pre)>code]:text-[13px]",
  "[&_table]:my-5 [&_table]:block [&_table]:w-max [&_table]:max-w-full [&_table]:overflow-x-auto [&_table]:rounded-lg [&_td]:[overflow-wrap:normal] [&_table]:text-sm [&_th]:bg-muted/60 [&_th]:px-3 [&_th]:py-2 [&_th]:font-semibold [&_td]:px-3 [&_td]:py-2",
  "[&_img]:my-5 [&_img]:h-auto [&_img]:max-w-full [&_img]:rounded-xl [&_img]:border",
  "[&_hr]:my-8 [&_a]:font-medium",
);
