"use client";

import { useEffect, useRef, useState, type ComponentProps } from "react";
import dayjs from "dayjs";
import { CalendarIcon, ChevronDown, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const DATE_VALUE_FORMAT = "YYYY-MM-DD";
const HOURS = Array.from({ length: 24 }, (_, hour) => hour);

interface DatePickerProps extends Omit<
  ComponentProps<"button">,
  "value" | "onChange" | "children"
> {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

interface TimePickerProps extends DatePickerProps {
  minuteStep?: number;
}

interface TimeColumnProps {
  label: string;
  values: number[];
  selected: number | undefined;
  format: (value: number) => string;
  onSelect: (value: number) => void;
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function parseTime(value: string) {
  const [hour, minute] = value.split(":").map(Number);
  return Number.isNaN(hour) ? undefined : { hour, minute: minute || 0 };
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  className,
  ...props
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const selected = value ? dayjs(value).toDate() : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "picker-trigger",
            !value && "text-muted-foreground",
            className,
          )}
          {...props}
        >
          <CalendarIcon className="text-muted-foreground" />
          <span className="flex-1 truncate">
            {value ? dayjs(value).format("MMM D, YYYY") : placeholder}
          </span>
          <ChevronDown className="text-muted-foreground opacity-60" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          captionLayout="dropdown"
          selected={selected}
          defaultMonth={selected}
          onSelect={(date) => {
            if (!date) return;
            onChange(dayjs(date).format(DATE_VALUE_FORMAT));
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

function TimeColumn({
  label,
  values,
  selected,
  format,
  onSelect,
}: TimeColumnProps) {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const list = listRef.current;
    const active = list?.querySelector<HTMLElement>("[data-selected=true]");
    if (!list || !active) return;
    list.scrollTop =
      active.offsetTop - list.clientHeight / 2 + active.clientHeight / 2;
  }, []);

  return (
    <div className="flex w-20 flex-col">
      <span className="px-2 py-1.5 text-center text-xs font-medium text-muted-foreground">
        {label}
      </span>
      <div
        ref={listRef}
        role="listbox"
        aria-label={label}
        className="scrollbar-none relative flex h-56 flex-col gap-0.5 overflow-y-auto"
      >
        {values.map((value) => {
          const isSelected = value === selected;
          return (
            <Button
              key={value}
              type="button"
              role="option"
              aria-selected={isSelected}
              data-selected={isSelected}
              variant={isSelected ? "default" : "ghost"}
              size="sm"
              className="h-8 shrink-0 font-normal tabular-nums"
              onClick={() => onSelect(value)}
            >
              {format(value)}
            </Button>
          );
        })}
      </div>
    </div>
  );
}

export function TimePicker({
  value,
  onChange,
  minuteStep = 15,
  placeholder = "Pick a time",
  className,
  ...props
}: TimePickerProps) {
  const [open, setOpen] = useState(false);
  const time = parseTime(value);
  const minutes = Array.from(
    { length: Math.ceil(60 / minuteStep) },
    (_, index) => index * minuteStep,
  );

  function select(hour: number, minute: number) {
    onChange(`${pad(hour)}:${pad(minute)}`);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "picker-trigger",
            !time && "text-muted-foreground",
            className,
          )}
          {...props}
        >
          <Clock className="text-muted-foreground" />
          <span className="flex-1 truncate tabular-nums">
            {time
              ? dayjs().hour(time.hour).minute(time.minute).format("h:mm A")
              : placeholder}
          </span>
          <ChevronDown className="text-muted-foreground opacity-60" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="flex w-auto divide-x overflow-hidden p-1"
        align="start"
      >
        <TimeColumn
          label="Hour"
          values={HOURS}
          selected={time?.hour}
          format={(hour) => dayjs().hour(hour).format("h A")}
          onSelect={(hour) => select(hour, time?.minute ?? 0)}
        />
        <TimeColumn
          label="Minute"
          values={minutes}
          selected={time?.minute}
          format={(minute) => `:${pad(minute)}`}
          onSelect={(minute) => {
            select(time?.hour ?? 9, minute);
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
