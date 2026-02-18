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
import { CreateClientDto } from "../../schema/clients.schema";

interface BasicInfoFieldsProps {
  control: Control<CreateClientDto>;
  isLoading?: boolean;
  mode: "create" | "edit";
}

export function BasicInfoFields({
  control,
  isLoading = false,
  mode,
}: BasicInfoFieldsProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* NIT/Cedula */}
        <FormField
          control={control}
          name="nit"
          render={({ field }) => (
            <FormItem>
              <FormLabel>NIT/ID</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Enter NIT or ID number..."
                  disabled={isLoading}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Razón Social */}
        <FormField
          control={control}
          name="businessName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Business Name</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Enter business name..."
                  disabled={isLoading}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Nombre Cliente */}
        <FormField
          control={control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Client Name <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter client name..."
                  disabled={isLoading}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Dirección */}
        <FormField
          control={control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Enter address..."
                  disabled={isLoading}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
