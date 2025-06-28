'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Select, SelectTrigger, SelectContent, SelectGroup, SelectItem, SelectValue } from "@/components/ui/select";
import type { DropdownProps } from "react-day-picker";
import React from "react";

export default function NewUserPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [form, setForm] = useState({
    username: '',
    name: '',
    dob: '',
    gender: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [dobOpen, setDobOpen] = useState(false);

  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  if (!session || !session.user) {
    return <div className="min-h-screen flex items-center justify-center text-red-500">No session found. Please sign in again.</div>;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (e.target.name === 'username') setUsernameAvailable(null);
  };

  const checkUsername = async () => {
    if (!form.username) return;
    const res = await fetch(`/api/user/check-username?username=${encodeURIComponent(form.username)}`);
    const data = await res.json();
    setUsernameAvailable(!data.exists);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    if (!form.username || !form.name || !form.dob || !form.gender) {
      setError('All fields are required.');
      setLoading(false);
      return;
    }
    // Check username again before submit
    const resCheck = await fetch(`/api/user/check-username?username=${encodeURIComponent(form.username)}`);
    const dataCheck = await resCheck.json();
    if (dataCheck.exists) {
      setError('Username already exists.');
      setUsernameAvailable(false);
      setLoading(false);
      return;
    }
    // Get userId from session
    const userId = (session?.user as any)?.id;
    if (!userId) {
      setError('User session not found.');
      setLoading(false);
      return;
    }
    // Try to update profile, if not found then create
    let res = await fetch(`/api/user/profile/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: form.username,
        name: form.name,
        dob: form.dob,
        gender: form.gender,
      }),
    });
    if (res.status === 404) {
      // Create profile if not found
      res = await fetch(`/api/user/profile/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: form.username,
          name: form.name,
          dob: form.dob,
          gender: form.gender,
        }),
      });
    }
    if (res.ok) {
      router.push('/');
    } else {
      const err = await res.json();
      setError(err.error || 'Failed to update profile.');
      setLoading(false);
    }
  };

  // Custom Dropdown for DayPicker using app's Select
  function CustomDropdown({ name, caption, children, className, ['aria-label']: ariaLabel, style, value, onChange }: DropdownProps) {
    let selectedLabel = '';
    React.Children.forEach(children, (child: any) => {
      if (child && child.props.value?.toString() === value?.toString()) {
        selectedLabel = child.props.children;
      }
    });
    // Add extra margin-top if this is the Year dropdown
    return (
      <div>
        <Select value={value?.toString()} onValueChange={val => onChange && onChange({ target: { value: val } } as any)}>
          <SelectTrigger className="bg-zinc-900 text-white rounded-md border border-border h-12 px-4 focus:ring-2 focus:ring-primary text-lg font-semibold">
            <SelectValue>{selectedLabel}</SelectValue>
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 text-white rounded-md border border-border">
            <SelectGroup>
              {React.Children.map(children, (child: any) =>
                child && (
                  <SelectItem
                    key={child.props.value}
                    value={child.props.value}
                    disabled={child.props.disabled}
                    className="rounded-md text-base"
                  >
                    {child.props.children}
                  </SelectItem>
                )
              )}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
    );
  }

  // Custom CaptionLabel to remove the large month/year header
  function EmptyCaptionLabel() {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md shadow-lg border-none bg-card">
        <CardHeader className="flex flex-col items-center gap-2">
          <img src="/logo.svg" alt="Sportal Logo" width={64} height={64} className="mb-2" />
          <CardTitle className="text-3xl font-extrabold tracking-tight text-primary">Complete Your Profile</CardTitle>
          <CardDescription className="text-center text-muted-foreground">Welcome to Sportal! Let's get you set up.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit} autoComplete="off">
          <CardContent className="flex flex-col gap-4">
            <div>
              <Label htmlFor="username">Username</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  id="username"
                  name="username"
                  type="text"
                  value={form.username}
                  onChange={handleChange}
                  onBlur={checkUsername}
                  autoComplete="off"
                  required
                  placeholder="Choose a unique username"
                />
                {usernameAvailable === true && <span className="text-green-500 text-xs">Available</span>}
                {usernameAvailable === false && <span className="text-red-500 text-xs">Taken</span>}
              </div>
            </div>
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                name="name"
                type="text"
                value={form.name}
                onChange={handleChange}
                required
                placeholder="Your full name"
              />
            </div>
            <div>
              <Label htmlFor="dob">Date of Birth</Label>
              <Popover open={dobOpen} onOpenChange={setDobOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={"w-full justify-start text-left font-normal flex items-center gap-2 " + (!form.dob ? "text-muted-foreground" : "")}
                    type="button"
                  >
                    {form.dob ? (
                      <span className="font-semibold">{format(new Date(form.dob), "MMM d, yyyy")}</span>
                    ) : (
                      "Select date"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="p-4 w-auto rounded-xl bg-card border border-border shadow-xl">
                  <Calendar
                    mode="single"
                    selected={form.dob ? new Date(form.dob) : undefined}
                    onSelect={date => {
                      setForm(f => ({ ...f, dob: date ? format(date, "yyyy-MM-dd") : "" }));
                      setDobOpen(false);
                    }}
                    captionLayout="dropdown"
                    fromYear={1950}
                    toYear={new Date().getFullYear()}
                    toDate={new Date()}
                    defaultMonth={form.dob ? new Date(form.dob) : new Date(2000, 0, 1)}
                    components={{ Dropdown: CustomDropdown, CaptionLabel: EmptyCaptionLabel }}
                    classNames={{
                      root: "bg-card rounded-xl p-2 shadow-none border-none",
                      months: "flex flex-col gap-2",
                      month: "rounded-lg p-2 bg-muted",
                      caption: "flex flex-col gap-3 mb-2 w-full",
                      caption_label: "text-base font-semibold text-primary",
                      table: "w-full border-collapse",
                      head_row: "",
                      head_cell: "text-muted-foreground text-xs font-medium p-1",
                      row: "",
                      cell: "h-9 w-9 p-0 text-center",
                      day: "rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary text-sm font-medium",
                      day_selected: "bg-primary text-primary-foreground",
                      day_today: "border border-primary",
                      day_outside: "text-muted-foreground opacity-50",
                      day_disabled: "opacity-30 cursor-not-allowed",
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label>Gender</Label>
              <RadioGroup
                name="gender"
                value={form.gender}
                onValueChange={val => setForm(f => ({ ...f, gender: val }))}
                className="flex flex-row gap-6 mt-1"
                required
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="M" id="gender-male" />
                  <Label htmlFor="gender-male">Male</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="F" id="gender-female" />
                  <Label htmlFor="gender-female">Female</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="O" id="gender-other" />
                  <Label htmlFor="gender-other">Other</Label>
                </div>
              </RadioGroup>
            </div>
            {error && <div className="text-red-500 text-sm text-center mt-2">{error}</div>}
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Saving...' : 'Complete Profile'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
} 