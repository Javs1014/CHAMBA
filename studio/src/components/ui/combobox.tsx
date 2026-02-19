"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

type ComboboxOption = {
  value: string
  label: string
}

interface ComboboxProps {
  options: ComboboxOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string;
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder = "Select an option...",
  className
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState(value || "")

  // Sincronizar inputValue si el value externo cambia (opcional pero recomendado)
  React.useEffect(() => {
     if (!open) {
       setInputValue(value || "");
     }
  }, [value, open]);

  const handleSelect = (currentValue: string) => {
    
    const matchedOption = options.find(opt => opt.label.toLowerCase() === currentValue.toLowerCase());
    const finalValue = matchedOption ? matchedOption.label : currentValue;

    const newValue = finalValue === value ? "" : finalValue;
    onChange(newValue);
    setInputValue(newValue);
    setOpen(false);
  }
  
  const handleInputChange = (search: string) => {
    setInputValue(search);
    // Automatically select if it's a perfect match from the list
    const perfectMatch = options.find(option => option.label.toLowerCase() === search.toLowerCase());
    if (perfectMatch) {
      onChange(perfectMatch.label);
    } else {
      onChange(search); // Allow typing custom values
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between font-normal", className)}
        >
          {value
            ? options.find((option) => option.value.toLowerCase() === value.toLowerCase())?.label || value
            : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        {/* Eliminamos shouldFilter={false} para activar el filtrado nativo */}
        <Command>
          <CommandInput 
            placeholder="Search or type custom value..."
            value={inputValue}
            onValueChange={handleInputChange}
          />
          <CommandList>
            <CommandEmpty>No option found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label} // Usamos el label como valor para el filtro
                  onSelect={handleSelect}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value.toLowerCase() === option.value.toLowerCase() ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}