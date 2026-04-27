import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-paper group-[.toaster]:text-ink group-[.toaster]:border-2 group-[.toaster]:border-ink group-[.toaster]:shadow-none rounded-none p-5",
          description: "group-[.toast]:text-ink/80 font-medium text-sm !font-body mt-1.5",
          title: "group-[.toast]:text-ink font-bold text-sm tracking-wide !font-serif",
          actionButton:
            "group-[.toast]:bg-ink group-[.toast]:text-paper group-[.toast]:border-0 font-bold uppercase tracking-[0.15em] text-[10px] !font-sans rounded-none px-4 py-2 hover:bg-neutral-800 transition-colors",
          cancelButton:
            "group-[.toast]:bg-transparent group-[.toast]:border group-[.toast]:border-ink group-[.toast]:text-ink font-bold uppercase tracking-[0.15em] text-[10px] !font-sans rounded-none px-4 py-2 hover:bg-ink/10 transition-colors",
          error: "group-[.toaster]:border-editorial-red group-[.toast]:text-editorial-red",
          icon: "group-data-[type=error]:text-editorial-red group-data-[type=success]:text-emerald-600 group-data-[type=warning]:text-amber-500 group-data-[type=info]:text-ink",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
