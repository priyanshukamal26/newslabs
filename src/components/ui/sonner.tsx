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
            "group toast group-[.toaster]:bg-white group-[.toaster]:text-[#111111] group-[.toaster]:border-2 group-[.toaster]:border-[#111111] group-[.toaster]:shadow-none rounded-none p-5",
          description: "group-[.toast]:text-neutral-600 font-medium text-sm !font-body mt-1.5",
          title: "group-[.toast]:text-[#111111] font-bold text-sm tracking-wide !font-serif",
          actionButton:
            "group-[.toast]:bg-[#111111] group-[.toast]:text-[#F9F9F7] group-[.toast]:border-0 font-bold uppercase tracking-[0.15em] text-[10px] !font-sans rounded-none px-4 py-2 hover:bg-neutral-800 transition-colors",
          cancelButton:
            "group-[.toast]:bg-transparent group-[.toast]:border group-[.toast]:border-[#111111] group-[.toast]:text-[#111111] font-bold uppercase tracking-[0.15em] text-[10px] !font-sans rounded-none px-4 py-2 hover:bg-neutral-100 transition-colors",
          error: "group-[.toaster]:border-[#CC0000] group-[.toast]:text-[#CC0000]",
          icon: "group-data-[type=error]:text-[#CC0000] group-data-[type=success]:text-emerald-600 group-data-[type=warning]:text-amber-500 group-data-[type=info]:text-[#111111]",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
