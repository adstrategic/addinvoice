"use client";

import { Control } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PhoneInputField } from "@/components/phone-input/phone-input";
import { PhoneHelp } from "@/components/phone-input/phone-help";
import { CreateClientDto } from "../../schema/clients.schema";

interface ContactFieldsProps {
  control: Control<CreateClientDto>;
  isLoading?: boolean;
}

export function ContactFields({
  control,
  isLoading = false,
}: ContactFieldsProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Teléfono 1 */}
        <FormField
          control={control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Primary Phone *</FormLabel>
              <FormControl>
                <PhoneInputField
                  value={field.value || ""}
                  onChange={field.onChange}
                  placeholder="Enter primary phone..."
                  disabled={isLoading}
                />
              </FormControl>
              <FormMessage />
              <PhoneHelp />
            </FormItem>
          )}
        />

        {/* Teléfono 2 */}
        {/* <FormField
          control={control}
          name="CTelefono2"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Secondary Phone</FormLabel>
              <FormControl>
                <PhoneInputField
                  value={field.value || ""}
                  onChange={field.onChange}
                  placeholder="Enter secondary phone..."
                  disabled={isLoading}
                />
              </FormControl>
              <FormMessage />
              <PhoneHelp />
            </FormItem>
          )}
        /> */}

        {/* Correo 1 */}
        <FormField
          control={control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Primary Email *</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="Enter primary email..."
                  disabled={isLoading}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Correo 2 */}
        {/* <FormField
          control={control}
          name="CCorreo2"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Secondary Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="Enter secondary email..."
                  disabled={isLoading}
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        /> */}
      </div>
    </div>
  );
}
