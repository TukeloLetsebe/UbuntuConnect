// Compact header search that balances the horizontal space on desktop. There
// is no global search endpoint, so this is a real control that jumps to the
// role's existing search tab with the typed query (the parent wires onSubmit).
// Hidden on small screens where each tab already has its own search field.

import { useState } from "react";
import { Search } from "lucide-react";

interface HeaderSearchProps {
  placeholder: string;
  onSubmit: (query: string) => void;
}

export default function HeaderSearch({ placeholder, onSubmit }: HeaderSearchProps) {
  const [value, setValue] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(value.trim());
      }}
      className="hidden lg:flex flex-1 items-center gap-2 max-w-md mx-6 rounded-full border border-neutral-200 bg-neutral-50 px-3.5 py-2 transition-colors focus-within:border-primary focus-within:bg-white"
    >
      <Search className="w-4 h-4 text-neutral-400 shrink-0" />
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="w-full bg-transparent text-sm text-neutral-700 placeholder:text-neutral-400 outline-none"
      />
    </form>
  );
}
