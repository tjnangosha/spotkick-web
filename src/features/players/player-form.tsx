import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppForm } from "@/components/ui/tanstack-form";
import { useCallback } from "react";
import { z } from "zod";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createPlayer, Player, updatePlayer } from "@/services/players";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const POSITIONS = ["goalkeeper", "defender", "midfielder", "forward"];

// Define the form schema with validation
const PlayerFormSchema = z.object({
  first_name: z.string().min(2, {
    message: "First name must be at least 2 characters.",
  }),
  last_name: z.string().min(2, {
    message: "Last name must be at least 2 characters.",
  }),
  country: z.string().min(2, {
    message: "Country must be at least 2 characters.",
  }),
  position: z.enum(["goalkeeper", "defender", "midfielder", "forward"], {
    required_error: "Please select a position.",
  }),
  jersey_number: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Jersey number must be a positive number.",
  }),
  date_joined_club: z.string().min(1, {
    message: "Please select the date joined.",
  }),
  date_of_birth: z.string().min(1, {
    message: "Please select the date of birth.",
  }),
  height_cm: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Height must be a positive number.",
  }),
  weight_kg: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Weight must be a positive number.",
  }),
});

interface PlayerFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (player: Player) => void;
  initialData?: Partial<Player>;
}

export function PlayerForm({
  open,
  onOpenChange,
  onSuccess,
  initialData,
}: PlayerFormProps) {
  const queryClient = useQueryClient();
  const isEditing = !!initialData?.user?.id;

  // Create form with validation
  const form = useAppForm({
    validators: { onChange: PlayerFormSchema },
    defaultValues: {
      first_name: initialData?.user?.firstName || "",
      last_name: initialData?.user?.lastName || "",
      country: initialData?.user?.country || "",
      position: initialData?.position || "",
      jersey_number:
        initialData?.jerseyNumber !== undefined
          ? String(initialData.jerseyNumber)
          : "",
      date_joined_club: initialData?.dateJoinedClub || "",
      date_of_birth: initialData?.dateOfBirth || "",
      height_cm:
        initialData?.heightCm !== undefined ? String(initialData.heightCm) : "",
      weight_kg:
        initialData?.weightKg !== undefined ? String(initialData.weightKg) : "",
    },
    onSubmit: async ({ value }) => {
      const payload = {
        first_name: value.first_name,
        last_name: value.last_name,
        country: value.country,
        position: value.position,
        jersey_number: Number(value.jersey_number),
        date_joined_club: value.date_joined_club,
        date_of_birth: value.date_of_birth,
        height_cm: Number(value.height_cm),
        weight_kg: Number(value.weight_kg),
      };

      const savedPlayer = isEditing && initialData?.user?.id
        ? await updatePlayer(initialData.user.id, payload)
        : await createPlayer(payload);

      queryClient.invalidateQueries({ queryKey: ["players"] });

      if (onSuccess) {
        onSuccess(savedPlayer);
      }

      onOpenChange(false);
    },
  });

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      e.stopPropagation();
      form.handleSubmit();
    },
    [form]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[880px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Player" : "Add New Player"}
          </DialogTitle>
        </DialogHeader>
        <form.AppForm>
          <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
            <form.AppField
              name="first_name"
              children={(field) => (
                <field.FormItem>
                  <field.FormLabel>First Name</field.FormLabel>
                  <field.FormControl>
                    <Input
                      placeholder="First Name"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                    />
                  </field.FormControl>
                  <field.FormMessage />
                </field.FormItem>
              )}
            />

            <form.AppField
              name="last_name"
              children={(field) => (
                <field.FormItem>
                  <field.FormLabel>Last Name</field.FormLabel>
                  <field.FormControl>
                    <Input
                      placeholder="Last Name"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                    />
                  </field.FormControl>
                  <field.FormMessage />
                </field.FormItem>
              )}
            />

            <form.AppField
              name="country"
              children={(field) => (
                <field.FormItem>
                  <field.FormLabel>Country</field.FormLabel>
                  <field.FormControl>
                    <Input
                      placeholder="Country"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                    />
                  </field.FormControl>
                  <field.FormMessage />
                </field.FormItem>
              )}
            />

            <form.AppField
              name="position"
              children={(field) => (
                <field.FormItem>
                  <field.FormLabel>Position</field.FormLabel>
                  <field.FormControl>
                    <Select
                      value={field.state.value}
                      onValueChange={field.handleChange}
                      onOpenChange={field.handleBlur}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a position" />
                      </SelectTrigger>
                      <SelectContent>
                        {POSITIONS.map((position) => (
                          <SelectItem key={position} value={position}>
                            {position}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </field.FormControl>
                  <field.FormMessage />
                </field.FormItem>
              )}
            />

            <form.AppField
              name="jersey_number"
              children={(field) => (
                <field.FormItem>
                  <field.FormLabel>Jersey Number</field.FormLabel>
                  <field.FormControl>
                    <Input
                      type="number"
                      min="1"
                      placeholder="10"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                    />
                  </field.FormControl>
                  <field.FormMessage />
                </field.FormItem>
              )}
            />

            <form.AppField
              name="date_joined_club"
              children={(field) => (
                <field.FormItem>
                  <field.FormLabel>Date Joined Club</field.FormLabel>
                  <field.FormControl>
                    <Input
                      type="date"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                    />
                  </field.FormControl>
                  <field.FormMessage />
                </field.FormItem>
              )}
            />

            <form.AppField
              name="date_of_birth"
              children={(field) => (
                <field.FormItem>
                  <field.FormLabel>Date of Birth</field.FormLabel>
                  <field.FormControl>
                    <Input
                      type="date"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                    />
                  </field.FormControl>
                  <field.FormMessage />
                </field.FormItem>
              )}
            />

            <form.AppField
              name="height_cm"
              children={(field) => (
                <field.FormItem>
                  <field.FormLabel>Height (cm)</field.FormLabel>
                  <field.FormControl>
                    <Input
                      type="number"
                      min="1"
                      placeholder="180"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                    />
                  </field.FormControl>
                  <field.FormMessage />
                </field.FormItem>
              )}
            />

            <form.AppField
              name="weight_kg"
              children={(field) => (
                <field.FormItem>
                  <field.FormLabel>Weight (kg)</field.FormLabel>
                  <field.FormControl>
                    <Input
                      type="number"
                      min="1"
                      placeholder="75"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                    />
                  </field.FormControl>
                  <field.FormMessage />
                </field.FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4 sm:col-span-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="cursor-pointer"
              >
                Cancel
              </Button>
              <Button type="submit" className="cursor-pointer">
                {isEditing ? "Update Player" : "Add Player"}
              </Button>
            </div>
          </form>
        </form.AppForm>
      </DialogContent>
    </Dialog>
  );
}
