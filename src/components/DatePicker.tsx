"use client";

import * as React from "react";
import { Calendar as CalendarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DatePickerProps {
  selected?: Date;
  onSelect?: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
}

function formatDate(date: Date | undefined) {
  if (!date) {
    return "";
  }

  return date.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function isValidDate(date: Date | undefined) {
  if (!date) {
    return false;
  }
  return !isNaN(date.getTime());
}

export function DatePicker({
  selected,
  onSelect,
  placeholder = "Pick a date",
  className,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [month, setMonth] = React.useState<Date | undefined>(selected);
  const [value, setValue] = React.useState(formatDate(selected));

  // Update value when selected prop changes
  React.useEffect(() => {
    setValue(formatDate(selected));
    setMonth(selected);
  }, [selected]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setValue(inputValue);

    const date = new Date(inputValue);
    if (isValidDate(date)) {
      onSelect?.(date);
      setMonth(date);
    }
  };

  const handleCalendarSelect = (date: Date | undefined) => {
    onSelect?.(date);
    setValue(formatDate(date));
    setOpen(false);
  };

  return (
    <div className={`relative flex gap-2 ${className}`}>
      <Input
        value={value}
        placeholder={placeholder}
        className="bg-background pr-10"
        onChange={handleInputChange}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setOpen(true);
          }
        }}
      />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            className="absolute top-1/2 right-2 size-6 -translate-y-1/2"
          >
            <CalendarIcon className="size-3.5" />
            <span className="sr-only">Select date</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto overflow-hidden p-0"
          align="end"
          alignOffset={-8}
          sideOffset={10}
        >
          <Calendar
            mode="single"
            selected={selected}
            captionLayout="dropdown"
            month={month}
            onMonthChange={setMonth}
            onSelect={handleCalendarSelect}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
